"""app/api/v1/programs.py"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Program
from app.schemas.schemas import ProgramCreate, ProgramUpdate, ProgramRead
from app.services.crud import get_or_404, paginate
from app.core.security import get_current_user

router = APIRouter()

@router.get("", response_model=list[ProgramRead])
def list_programs(skip: int = 0, limit: int = 100, department_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Program)
    if department_id:
        q = q.filter(Program.department_id == department_id)
    return paginate(q, skip, limit)

@router.post("", response_model=ProgramRead, status_code=201)
def create_program(payload: ProgramCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Program(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.get("/{id}", response_model=ProgramRead)
def get_program(id: int, db: Session = Depends(get_db)):
    return get_or_404(db, Program, id)

@router.patch("/{id}", response_model=ProgramRead)
def update_program(id: int, payload: ProgramUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_or_404(db, Program, id)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/{id}", status_code=204)
def delete_program(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_or_404(db, Program, id)
    db.delete(obj); db.commit()
