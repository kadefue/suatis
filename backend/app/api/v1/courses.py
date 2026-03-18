"""app/api/v1/courses.py"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Course, Program, Instructor
from app.schemas.schemas import CourseCreate, CourseUpdate, CourseRead
from app.services.crud import get_or_404, paginate
from app.core.security import get_current_user

router = APIRouter()


def _sync_relations(db, obj: Course, program_ids, instructor_ids):
    if program_ids is not None:
        obj.programs = db.query(Program).filter(Program.id.in_(program_ids)).all()
    if instructor_ids is not None:
        obj.instructors = db.query(Instructor).filter(Instructor.id.in_(instructor_ids)).all()


@router.get("", response_model=list[CourseRead])
def list_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return paginate(db.query(Course), skip, limit)

@router.post("", response_model=CourseRead, status_code=201)
def create_course(payload: CourseCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    data = payload.model_dump(exclude={"program_ids", "instructor_ids"})
    obj = Course(**data)
    db.add(obj)
    db.flush()
    _sync_relations(db, obj, payload.program_ids, payload.instructor_ids)
    db.commit(); db.refresh(obj)
    return obj

@router.get("/{id}", response_model=CourseRead)
def get_course(id: int, db: Session = Depends(get_db)):
    return get_or_404(db, Course, id)

@router.patch("/{id}", response_model=CourseRead)
def update_course(id: int, payload: CourseUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_or_404(db, Course, id)
    data = payload.model_dump(exclude_unset=True, exclude={"program_ids", "instructor_ids"})
    for k, v in data.items():
        setattr(obj, k, v)
    _sync_relations(db, obj, payload.program_ids, payload.instructor_ids)
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/{id}", status_code=204)
def delete_course(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_or_404(db, Course, id)
    db.delete(obj); db.commit()
