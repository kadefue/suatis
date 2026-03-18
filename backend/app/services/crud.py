"""app/services/crud.py — generic helpers used by route handlers."""
from typing import Type, TypeVar, Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException

T = TypeVar("T")


def get_or_404(db: Session, model: Type[T], obj_id: int) -> T:
    obj = db.get(model, obj_id)
    if not obj:
        raise HTTPException(status_code=404, detail=f"{model.__name__} {obj_id} not found")
    return obj


def paginate(query, skip: int = 0, limit: int = 100):
    return query.offset(skip).limit(limit).all()
