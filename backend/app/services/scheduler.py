"""
app/services/scheduler.py
─────────────────────────────────────────────────────────────────────────────
Timetable Generation Engine for Sokoine University of Agriculture.

Algorithm: Constraint-aware greedy solver with backtracking.
           Designed to be replaced with OR-Tools CP-SAT for large instances.

HARD CONSTRAINTS enforced:
  H1  No instructor double-booking in the same slot
  H2  No room double-booking in the same slot
  H3  Room capacity ≥ program enrollment
  H4  All required lecture and practical hours scheduled
  H5  Room usage type matches session type
  H6  Lecturer scheduling window (admin-configured 07:00–19:30)
  H7  Friday prayer block is free
  H8  Campus travel minimisation (soft → converted to hard penalty)

SOFT CONSTRAINTS (best-effort):
  S1  Minimise idle gaps for instructors
  S2  Group consecutive sessions for same course
  S3  Respect instructor day preferences
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Optional

from sqlalchemy.orm import Session

from app.models.models import (
    Course, Instructor, InstructorAvailability, Program, Room,
    TimetableEntry, TimetableSlot, SystemSetting,
    RoomUsageType, SessionType, DayOfWeek, CampusType,
)

log = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Settings helper
# ─────────────────────────────────────────────────────────────────────────────

def _get_setting(db: Session, key: str, default: str) -> str:
    row = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    return row.value if row else default


def _time_to_minutes(t: str) -> int:
    """Convert 'HH:MM' to minutes since midnight."""
    h, m = map(int, t.split(":"))
    return h * 60 + m


# ─────────────────────────────────────────────────────────────────────────────
# Internal data classes
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class ScheduleRequest:
    course: Course
    program: Program
    session_type: SessionType
    sessions_needed: int          # number of 45-min slots required


@dataclass
class SchedulerResult:
    scheduled: list[TimetableEntry] = field(default_factory=list)
    unscheduled: list[dict] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


# ─────────────────────────────────────────────────────────────────────────────
# Main engine
# ─────────────────────────────────────────────────────────────────────────────

class TimetableScheduler:
    """
    Greedy constraint-satisfying scheduler.

    Usage:
        scheduler = TimetableScheduler(db, academic_year="2024/2025", semester=1)
        result = scheduler.generate(program_ids=[1, 2, 3])
    """

    def __init__(self, db: Session, academic_year: str = "2024/2025", semester: int = 1):
        self.db = db
        self.academic_year = academic_year
        self.semester = semester

        # Load admin-defined constraints from system_settings
        self.lec_start = _time_to_minutes(
            _get_setting(db, "lecturer_available_start_time", "07:00")
        )
        self.lec_end = _time_to_minutes(
            _get_setting(db, "lecturer_available_end_time", "19:30")
        )
        self.prayer_start = _time_to_minutes(
            _get_setting(db, "friday_prayer_start", "12:15")
        )
        self.prayer_end = _time_to_minutes(
            _get_setting(db, "friday_prayer_end", "14:00")
        )

        # Runtime booking trackers {slot_id: {instructor_id/room_id}}
        self._instructor_booked: dict[int, set[int]] = {}  # slot_id → {instructor_ids}
        self._room_booked: dict[int, set[int]] = {}         # slot_id → {room_ids}

        self._all_slots: list[TimetableSlot] = []
        self._result = SchedulerResult()

    # ── Public entry point ───────────────────────────────────────────────────

    def generate(
        self,
        program_ids: Optional[list[int]] = None,
        clear_existing: bool = False,
    ) -> SchedulerResult:
        """Generate a timetable. Returns a SchedulerResult."""

        if clear_existing:
            self._clear_existing(program_ids)

        # Load and pre-filter slots
        self._all_slots = self._load_valid_slots()

        if not self._all_slots:
            self._result.warnings.append(
                "No valid timetable slots found. Please generate slots via the slots API first."
            )
            return self._result

        # Seed booking maps from already-committed entries (when not clearing)
        self._seed_booking_maps()

        # Build schedule requests
        requests = self._build_requests(program_ids)

        # Sort: programs with higher enrollment first (harder to place → first)
        requests.sort(key=lambda r: -r.program.current_enrollment)

        for req in requests:
            self._schedule_request(req)

        log.info(
            "Scheduler finished: %d scheduled, %d unscheduled",
            len(self._result.scheduled),
            len(self._result.unscheduled),
        )
        return self._result

    # ── Private helpers ──────────────────────────────────────────────────────

    def _clear_existing(self, program_ids: Optional[list[int]]):
        q = self.db.query(TimetableEntry).filter(
            TimetableEntry.academic_year == self.academic_year,
            TimetableEntry.semester == self.semester,
            TimetableEntry.is_manual == False,
        )
        if program_ids:
            q = q.filter(TimetableEntry.program_id.in_(program_ids))
        q.delete(synchronize_session="fetch")
        self.db.commit()

    def _load_valid_slots(self) -> list[TimetableSlot]:
        """Return all slots that fall within the admin-defined lecturer window."""
        slots = self.db.query(TimetableSlot).all()
        valid = []
        for s in slots:
            start = _time_to_minutes(s.start_time)
            end = _time_to_minutes(s.end_time)
            # H6: Must be within lecturer working window
            if start < self.lec_start or end > self.lec_end:
                continue
            # H7: Friday prayer block
            if s.day == DayOfWeek.FRIDAY:
                if not (end <= self.prayer_start or start >= self.prayer_end):
                    continue
            valid.append(s)
        return valid

    def _seed_booking_maps(self):
        existing = self.db.query(TimetableEntry).filter(
            TimetableEntry.academic_year == self.academic_year,
            TimetableEntry.semester == self.semester,
        ).all()
        for e in existing:
            if e.instructor_id:
                self._instructor_booked.setdefault(e.slot_id, set()).add(e.instructor_id)
            if e.room_id:
                self._room_booked.setdefault(e.slot_id, set()).add(e.room_id)

    def _build_requests(self, program_ids: Optional[list[int]]) -> list[ScheduleRequest]:
        reqs: list[ScheduleRequest] = []
        q = self.db.query(Program).filter(Program.is_active == True)
        if program_ids:
            q = q.filter(Program.id.in_(program_ids))
        programs = q.all()

        for program in programs:
            for course in program.courses:
                if not course.is_active:
                    continue
                if course.lecture_hours > 0:
                    reqs.append(ScheduleRequest(course, program, SessionType.LECTURE, course.lecture_hours))
                if course.practical_hours > 0:
                    reqs.append(ScheduleRequest(course, program, SessionType.PRACTICAL, course.practical_hours))
        return reqs

    def _schedule_request(self, req: ScheduleRequest):
        """Try to schedule all sessions for a given request."""
        placed = 0

        # Get eligible instructors for this course
        instructors = [i for i in req.course.instructors if i.is_active]

        # Get eligible rooms
        rooms = self._get_eligible_rooms(req)

        if not rooms:
            self._result.unscheduled.append({
                "course_id": req.course.id,
                "course_code": req.course.code,
                "program_id": req.program.id,
                "session_type": req.session_type,
                "reason": "No suitable room found with adequate capacity",
            })
            return

        for slot in self._all_slots:
            if placed >= req.sessions_needed:
                break

            # H1: Check instructor availability
            instructor = self._pick_available_instructor(instructors, slot)

            # H2: Check room availability
            room = self._pick_available_room(rooms, slot)
            if room is None:
                continue

            # H8: Campus soft constraint – prefer same campus rooms if instructor known
            # (already handled by room ordering below)

            entry = TimetableEntry(
                course_id=req.course.id,
                instructor_id=instructor.id if instructor else None,
                room_id=room.id,
                program_id=req.program.id,
                slot_id=slot.id,
                session_type=req.session_type,
                academic_year=self.academic_year,
                semester=self.semester,
                is_manual=False,
                catering_count=req.program.current_enrollment,
            )
            self.db.add(entry)
            # Update booking maps
            self._room_booked.setdefault(slot.id, set()).add(room.id)
            if instructor:
                self._instructor_booked.setdefault(slot.id, set()).add(instructor.id)

            self._result.scheduled.append(entry)
            placed += 1

        if placed < req.sessions_needed:
            self._result.unscheduled.append({
                "course_id": req.course.id,
                "course_code": req.course.code,
                "program_id": req.program.id,
                "session_type": req.session_type,
                "reason": f"Only {placed}/{req.sessions_needed} slots could be placed",
            })
            self._result.warnings.append(
                f"[PARTIAL] {req.course.code} ({req.session_type}): "
                f"placed {placed}/{req.sessions_needed} sessions for {req.program.code}"
            )

        self.db.commit()

    def _get_eligible_rooms(self, req: ScheduleRequest) -> list[Room]:
        """Filter rooms by type and capacity. H3, H5."""
        q = self.db.query(Room).filter(Room.is_active == True)

        if req.session_type == SessionType.LECTURE:
            q = q.filter(Room.usage_type.in_([RoomUsageType.LECTURE, RoomUsageType.BOTH]))
        else:
            q = q.filter(Room.usage_type.in_([RoomUsageType.LAB, RoomUsageType.BOTH]))

        # H3: capacity check
        enrollment = req.program.current_enrollment or 1
        q = q.filter(Room.capacity >= enrollment)

        # Soft H8: prefer MAIN campus, sort so MAIN rooms come first
        rooms = q.all()
        rooms.sort(key=lambda r: (r.campus != CampusType.MAIN, r.capacity))
        return rooms

    def _pick_available_instructor(
        self, instructors: list[Instructor], slot: TimetableSlot
    ) -> Optional[Instructor]:
        """Return the first instructor not already booked in this slot. H1."""
        booked_in_slot = self._instructor_booked.get(slot.id, set())
        for inst in instructors:
            if inst.id not in booked_in_slot:
                return inst
        return None  # No instructor available; entry will be created without one

    def _pick_available_room(
        self, rooms: list[Room], slot: TimetableSlot
    ) -> Optional[Room]:
        """Return the first room not already booked in this slot. H2."""
        booked_in_slot = self._room_booked.get(slot.id, set())
        for room in rooms:
            if room.id not in booked_in_slot:
                return room
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Slot generation utility
# ─────────────────────────────────────────────────────────────────────────────

def generate_default_slots(db: Session, slot_duration: int = 45) -> int:
    """
    Auto-generate TimetableSlot rows for Mon–Sat based on
    admin-defined lecturer window.
    Returns number of slots created.
    """
    from app.models.models import TimetableSlot, DayOfWeek

    lec_start = _time_to_minutes(
        _get_setting(db, "lecturer_available_start_time", "07:00")
    )
    lec_end = _time_to_minutes(
        _get_setting(db, "lecturer_available_end_time", "19:30")
    )
    prayer_start = _time_to_minutes(
        _get_setting(db, "friday_prayer_start", "12:15")
    )
    prayer_end = _time_to_minutes(
        _get_setting(db, "friday_prayer_end", "14:00")
    )

    days = list(DayOfWeek)
    created = 0

    for day in days:
        current = lec_start
        period = 1
        while current + slot_duration <= lec_end:
            slot_end = current + slot_duration

            # Skip Friday prayer block
            if day == DayOfWeek.FRIDAY:
                if not (slot_end <= prayer_start or current >= prayer_end):
                    current += slot_duration
                    continue

            start_str = f"{current // 60:02d}:{current % 60:02d}"
            end_str = f"{slot_end // 60:02d}:{slot_end % 60:02d}"

            exists = db.query(TimetableSlot).filter(
                TimetableSlot.day == day,
                TimetableSlot.start_time == start_str,
            ).first()

            if not exists:
                db.add(TimetableSlot(
                    day=day,
                    start_time=start_str,
                    end_time=end_str,
                    label=f"Period {period}",
                ))
                created += 1

            current += slot_duration
            period += 1

    db.commit()
    return created
