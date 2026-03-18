"""app/api/v1/instructors.py"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Instructor, InstructorAvailability
from app.schemas.schemas import (
    InstructorCreate, InstructorUpdate, InstructorRead,
    InstructorAvailabilityCreate, InstructorAvailabilityRead,
)
from app.services.crud import get_or_404, paginate
from app.core.security import get_current_user

router = APIRouter()

@router.get("", response_model=list[InstructorRead])
def list_instructors(skip: int = 0, limit: int = 100, department_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Instructor)
    if department_id:
        q = q.filter(Instructor.department_id == department_id)
    return paginate(q, skip, limit)

@router.post("", response_model=InstructorRead, status_code=201)
def create_instructor(payload: InstructorCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Instructor(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.get("/{id}", response_model=InstructorRead)
def get_instructor(id: int, db: Session = Depends(get_db)):
    return get_or_404(db, Instructor, id)

@router.patch("/{id}", response_model=InstructorRead)
def update_instructor(id: int, payload: InstructorUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_or_404(db, Instructor, id)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/{id}", status_code=204)
def delete_instructor(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_or_404(db, Instructor, id)
    db.delete(obj); db.commit()

# ── Availability ──────────────────────────────────────────────────────────────

@router.get("/{id}/availability", response_model=list[InstructorAvailabilityRead])
def get_availability(id: int, db: Session = Depends(get_db)):
    get_or_404(db, Instructor, id)
    return db.query(InstructorAvailability).filter(InstructorAvailability.instructor_id == id).all()

@router.post("/{id}/availability", response_model=InstructorAvailabilityRead, status_code=201)
def set_availability(id: int, payload: InstructorAvailabilityCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    get_or_404(db, Instructor, id)
    # Upsert
    existing = db.query(InstructorAvailability).filter(
        InstructorAvailability.instructor_id == id,
        InstructorAvailability.day == payload.day,
    ).first()
    if existing:
        for k, v in payload.model_dump(exclude_unset=True).items():
            setattr(existing, k, v)
        db.commit(); db.refresh(existing)
        return existing
    obj = InstructorAvailability(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj
