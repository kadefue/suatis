"""app/api/v1/departments.py"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Department
from app.schemas.schemas import DepartmentCreate, DepartmentUpdate, DepartmentRead
from app.services.crud import get_or_404, paginate
from app.core.security import get_current_user

router = APIRouter()

@router.get("", response_model=list[DepartmentRead])
def list_departments(skip: int = 0, limit: int = 100, college_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Department)
    if college_id:
        q = q.filter(Department.college_id == college_id)
    return paginate(q, skip, limit)

@router.post("", response_model=DepartmentRead, status_code=201)
def create_department(payload: DepartmentCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Department(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.get("/{id}", response_model=DepartmentRead)
def get_department(id: int, db: Session = Depends(get_db)):
    return get_or_404(db, Department, id)

@router.patch("/{id}", response_model=DepartmentRead)
def update_department(id: int, payload: DepartmentUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_or_404(db, Department, id)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/{id}", status_code=204)
def delete_department(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_or_404(db, Department, id)
    db.delete(obj); db.commit()
