"""app/api/v1/colleges.py"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import College
from app.schemas.schemas import CollegeCreate, CollegeUpdate, CollegeRead
from app.services.crud import get_or_404, paginate
from app.core.security import get_current_user

router = APIRouter()

@router.get("", response_model=list[CollegeRead])
def list_colleges(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return paginate(db.query(College), skip, limit)

@router.post("", response_model=CollegeRead, status_code=201)
def create_college(payload: CollegeCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = College(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.get("/{id}", response_model=CollegeRead)
def get_college(id: int, db: Session = Depends(get_db)):
    return get_or_404(db, College, id)

@router.patch("/{id}", response_model=CollegeRead)
def update_college(id: int, payload: CollegeUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_or_404(db, College, id)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/{id}", status_code=204)
def delete_college(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_or_404(db, College, id)
    db.delete(obj); db.commit()
