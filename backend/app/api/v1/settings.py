"""app/api/v1/settings.py"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import SystemSetting
from app.schemas.schemas import SettingRead, SettingUpdate, SystemSettingsBundle
from app.core.security import require_admin

router = APIRouter()

DEFAULT_KEYS = {
    "lecturer_available_start_time": "07:00",
    "lecturer_available_end_time": "19:30",
    "friday_prayer_start": "12:15",
    "friday_prayer_end": "14:00",
    "slot_duration_minutes": "45",
    "current_academic_year": "2024/2025",
    "current_semester": "1",
}

def _ensure_defaults(db: Session):
    for key, value in DEFAULT_KEYS.items():
        if not db.query(SystemSetting).filter(SystemSetting.key == key).first():
            db.add(SystemSetting(key=key, value=value, description=f"Default: {value}"))
    db.commit()

@router.get("", response_model=SystemSettingsBundle)
def get_settings(db: Session = Depends(get_db)):
    _ensure_defaults(db)
    rows = {r.key: r.value for r in db.query(SystemSetting).all()}
    return SystemSettingsBundle(
        lecturer_available_start_time=rows.get("lecturer_available_start_time", "07:00"),
        lecturer_available_end_time=rows.get("lecturer_available_end_time", "19:30"),
        friday_prayer_start=rows.get("friday_prayer_start", "12:15"),
        friday_prayer_end=rows.get("friday_prayer_end", "14:00"),
        slot_duration_minutes=int(rows.get("slot_duration_minutes", "45")),
        current_academic_year=rows.get("current_academic_year", "2024/2025"),
        current_semester=int(rows.get("current_semester", "1")),
    )

@router.put("/{key}", response_model=SettingRead)
def update_setting(key: str, payload: SettingUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    row = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not row:
        row = SystemSetting(key=key)
        db.add(row)
    row.value = payload.value
    if payload.description:
        row.description = payload.description
    db.commit(); db.refresh(row)
    return row
