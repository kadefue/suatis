"""app/api/v1/timetable.py"""
from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import TimetableEntry, TimetableSlot
from app.schemas.schemas import (
    TimetableEntryRead, TimetableEntryCreate, TimetableEntryUpdate,
    TimetableSlotCreate, TimetableSlotRead,
    GenerateRequest, GenerateResponse,
)
from app.services.crud import get_or_404, paginate
from app.services.scheduler import TimetableScheduler, generate_default_slots
from app.core.security import get_current_user, require_admin

router = APIRouter()


# ── Slot management ───────────────────────────────────────────────────────────

@router.get("/slots", response_model=list[TimetableSlotRead])
def list_slots(db: Session = Depends(get_db)):
    return db.query(TimetableSlot).order_by(TimetableSlot.day, TimetableSlot.start_time).all()

@router.post("/slots/generate", status_code=201)
def auto_generate_slots(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Auto-populate slots based on admin working hours settings."""
    count = generate_default_slots(db)
    return {"message": f"Created {count} time slots"}

@router.post("/slots", response_model=TimetableSlotRead, status_code=201)
def create_slot(payload: TimetableSlotCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = TimetableSlot(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.delete("/slots/{id}", status_code=204)
def delete_slot(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = get_or_404(db, TimetableSlot, id)
    db.delete(obj); db.commit()


# ── Timetable generation ──────────────────────────────────────────────────────

@router.post("/generate-timetable", response_model=GenerateResponse)
def generate_timetable(
    payload: GenerateRequest,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """
    Run the scheduling engine.
    Set clear_existing=true to wipe auto-generated entries before re-running.
    """
    scheduler = TimetableScheduler(db, payload.academic_year, payload.semester)
    result = scheduler.generate(
        program_ids=payload.program_ids,
        clear_existing=payload.clear_existing,
    )
    return GenerateResponse(
        success=True,
        message=f"Scheduled {len(result.scheduled)} sessions",
        scheduled_count=len(result.scheduled),
        unscheduled=result.unscheduled,
        warnings=result.warnings,
    )


# ── Timetable query ───────────────────────────────────────────────────────────

def _base_query(db: Session, academic_year: str = "2024/2025", semester: int = 1):
    return db.query(TimetableEntry).filter(
        TimetableEntry.academic_year == academic_year,
        TimetableEntry.semester == semester,
    )

@router.get("/timetable", response_model=list[TimetableEntryRead])
def list_timetable(
    program_id: Optional[int] = None,
    instructor_id: Optional[int] = None,
    room_id: Optional[int] = None,
    academic_year: str = "2024/2025",
    semester: int = 1,
    skip: int = 0,
    limit: int = 500,
    db: Session = Depends(get_db),
):
    q = _base_query(db, academic_year, semester)
    if program_id:
        q = q.filter(TimetableEntry.program_id == program_id)
    if instructor_id:
        q = q.filter(TimetableEntry.instructor_id == instructor_id)
    if room_id:
        q = q.filter(TimetableEntry.room_id == room_id)
    return paginate(q, skip, limit)

@router.get("/timetable/program/{program_id}", response_model=list[TimetableEntryRead])
def program_timetable(program_id: int, academic_year: str = "2024/2025", semester: int = 1, db: Session = Depends(get_db)):
    return _base_query(db, academic_year, semester).filter(TimetableEntry.program_id == program_id).all()

@router.get("/timetable/instructor/{instructor_id}", response_model=list[TimetableEntryRead])
def instructor_timetable(instructor_id: int, academic_year: str = "2024/2025", semester: int = 1, db: Session = Depends(get_db)):
    return _base_query(db, academic_year, semester).filter(TimetableEntry.instructor_id == instructor_id).all()

@router.get("/timetable/room/{room_id}", response_model=list[TimetableEntryRead])
def room_timetable(room_id: int, academic_year: str = "2024/2025", semester: int = 1, db: Session = Depends(get_db)):
    return _base_query(db, academic_year, semester).filter(TimetableEntry.room_id == room_id).all()

@router.get("/timetable/{id}", response_model=TimetableEntryRead)
def get_entry(id: int, db: Session = Depends(get_db)):
    return get_or_404(db, TimetableEntry, id)

@router.put("/timetable/{id}", response_model=TimetableEntryRead)
def update_entry(
    id: int,
    payload: TimetableEntryUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Manual adjustment with basic conflict validation."""
    entry = get_or_404(db, TimetableEntry, id)

    if payload.slot_id and payload.slot_id != entry.slot_id:
        # Check instructor double-booking
        if payload.instructor_id or entry.instructor_id:
            inst_id = payload.instructor_id or entry.instructor_id
            conflict = db.query(TimetableEntry).filter(
                TimetableEntry.slot_id == payload.slot_id,
                TimetableEntry.instructor_id == inst_id,
                TimetableEntry.academic_year == entry.academic_year,
                TimetableEntry.semester == entry.semester,
                TimetableEntry.id != id,
            ).first()
            if conflict:
                from fastapi import HTTPException
                raise HTTPException(409, "Instructor already booked in that slot")

        # Check room double-booking
        if payload.room_id or entry.room_id:
            room_id = payload.room_id or entry.room_id
            conflict = db.query(TimetableEntry).filter(
                TimetableEntry.slot_id == payload.slot_id,
                TimetableEntry.room_id == room_id,
                TimetableEntry.academic_year == entry.academic_year,
                TimetableEntry.semester == entry.semester,
                TimetableEntry.id != id,
            ).first()
            if conflict:
                from fastapi import HTTPException
                raise HTTPException(409, "Room already booked in that slot")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(entry, k, v)
    entry.is_manual = True
    db.commit(); db.refresh(entry)
    return entry

@router.delete("/timetable/{id}", status_code=204)
def delete_entry(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = get_or_404(db, TimetableEntry, id)
    db.delete(obj); db.commit()
