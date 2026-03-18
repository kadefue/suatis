"""app/api/v1/rooms.py"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Room, RoomUsageType, CampusType
from app.schemas.schemas import RoomCreate, RoomUpdate, RoomRead
from app.services.crud import get_or_404, paginate
from app.core.security import get_current_user

router = APIRouter()

@router.get("", response_model=list[RoomRead])
def list_rooms(
    skip: int = 0, limit: int = 100,
    campus: CampusType | None = None,
    usage_type: RoomUsageType | None = None,
    db: Session = Depends(get_db)
):
    q = db.query(Room)
    if campus:
        q = q.filter(Room.campus == campus)
    if usage_type:
        q = q.filter(Room.usage_type == usage_type)
    return paginate(q, skip, limit)

@router.post("", response_model=RoomRead, status_code=201)
def create_room(payload: RoomCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = Room(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.get("/{id}", response_model=RoomRead)
def get_room(id: int, db: Session = Depends(get_db)):
    return get_or_404(db, Room, id)

@router.patch("/{id}", response_model=RoomRead)
def update_room(id: int, payload: RoomUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_or_404(db, Room, id)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/{id}", status_code=204)
def delete_room(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_or_404(db, Room, id)
    db.delete(obj); db.commit()
