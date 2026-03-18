"""app/api/v1/reports.py"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.models import (
    TimetableEntry, Room, Instructor, TimetableSlot,
    Program, Course
)
from app.schemas.schemas import (
    RoomUtilizationReport, InstructorWorkloadReport, UnscheduledCourse
)

router = APIRouter()


@router.get("/room-utilization", response_model=list[RoomUtilizationReport])
def room_utilization(
    academic_year: str = "2024/2025",
    semester: int = 1,
    db: Session = Depends(get_db),
):
    rooms = db.query(Room).filter(Room.is_active == True).all()
    total_slots = db.query(TimetableSlot).count()
    result = []
    for room in rooms:
        used = db.query(TimetableEntry).filter(
            TimetableEntry.room_id == room.id,
            TimetableEntry.academic_year == academic_year,
            TimetableEntry.semester == semester,
        ).count()
        pct = round((used / total_slots * 100), 1) if total_slots else 0.0
        result.append(RoomUtilizationReport(
            room_id=room.id,
            room_name=room.name,
            campus=room.campus.value,
            total_slots=total_slots,
            used_slots=used,
            utilization_percent=pct,
        ))
    result.sort(key=lambda r: -r.utilization_percent)
    return result


@router.get("/instructor-workload", response_model=list[InstructorWorkloadReport])
def instructor_workload(
    academic_year: str = "2024/2025",
    semester: int = 1,
    db: Session = Depends(get_db),
):
    instructors = db.query(Instructor).filter(Instructor.is_active == True).all()
    result = []
    for inst in instructors:
        count = db.query(TimetableEntry).filter(
            TimetableEntry.instructor_id == inst.id,
            TimetableEntry.academic_year == academic_year,
            TimetableEntry.semester == semester,
        ).count()
        # Each slot = 45 min = 0.75 hr
        hours = round(count * 0.75, 1)
        pct = round((hours / inst.max_load_hours * 100), 1) if inst.max_load_hours else 0.0
        dept = inst.department.name if inst.department else None
        result.append(InstructorWorkloadReport(
            instructor_id=inst.id,
            instructor_name=f"{inst.first_name} {inst.last_name}",
            department=dept,
            scheduled_hours=hours,
            max_load_hours=inst.max_load_hours,
            load_percent=pct,
        ))
    result.sort(key=lambda r: -r.load_percent)
    return result


@router.get("/unscheduled-courses", response_model=list[UnscheduledCourse])
def unscheduled_courses(
    academic_year: str = "2024/2025",
    semester: int = 1,
    db: Session = Depends(get_db),
):
    result = []
    programs = db.query(Program).filter(Program.is_active == True).all()
    for program in programs:
        for course in program.courses:
            if not course.is_active:
                continue

            lec_scheduled = db.query(TimetableEntry).filter(
                TimetableEntry.program_id == program.id,
                TimetableEntry.course_id == course.id,
                TimetableEntry.academic_year == academic_year,
                TimetableEntry.semester == semester,
                TimetableEntry.session_type == "LECTURE",
            ).count()

            prac_scheduled = db.query(TimetableEntry).filter(
                TimetableEntry.program_id == program.id,
                TimetableEntry.course_id == course.id,
                TimetableEntry.academic_year == academic_year,
                TimetableEntry.semester == semester,
                TimetableEntry.session_type == "PRACTICAL",
            ).count()

            missing_lec = max(0, course.lecture_hours - lec_scheduled)
            missing_prac = max(0, course.practical_hours - prac_scheduled)

            if missing_lec > 0 or missing_prac > 0:
                result.append(UnscheduledCourse(
                    course_id=course.id,
                    course_code=course.code,
                    course_name=course.name,
                    program_id=program.id,
                    program_name=program.name,
                    missing_lecture_slots=missing_lec,
                    missing_practical_slots=missing_prac,
                    reason="Insufficient slots or resources",
                ))
    return result
