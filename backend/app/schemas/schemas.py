"""
app/schemas/schemas.py
Pydantic v2 schemas for request/response validation.
"""

from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator, model_validator

from app.models.models import RoomUsageType, CampusType, SessionType, DayOfWeek


# ─── Shared helpers ───────────────────────────────────────────────────────────

class OrmBase(BaseModel):
    model_config = {"from_attributes": True}


# ─── Auth ─────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role_id: Optional[int] = None


class UserRead(OrmBase):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    is_superuser: bool
    role: Optional[RoleRead] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role_id: Optional[int] = None


# ─── Roles / Permissions ──────────────────────────────────────────────────────

class PermissionRead(OrmBase):
    id: int
    name: str
    description: Optional[str]


class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None


class RoleRead(OrmBase):
    id: int
    name: str
    description: Optional[str]
    permissions: List[PermissionRead] = []


# ─── College ──────────────────────────────────────────────────────────────────

class CollegeCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None


class CollegeUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CollegeRead(OrmBase):
    id: int
    name: str
    code: str
    description: Optional[str]
    is_active: bool


# ─── Department ───────────────────────────────────────────────────────────────

class DepartmentCreate(BaseModel):
    name: str
    code: str
    college_id: int


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    college_id: Optional[int] = None
    is_active: Optional[bool] = None


class DepartmentRead(OrmBase):
    id: int
    name: str
    code: str
    college_id: int
    college: Optional[CollegeRead] = None
    is_active: bool


# ─── Program ──────────────────────────────────────────────────────────────────

class ProgramCreate(BaseModel):
    name: str
    code: str
    department_id: int
    capacity: int = 0
    current_enrollment: int = 0
    year_of_study: int = 1


class ProgramUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    current_enrollment: Optional[int] = None
    year_of_study: Optional[int] = None
    is_active: Optional[bool] = None


class ProgramRead(OrmBase):
    id: int
    name: str
    code: str
    department_id: int
    capacity: int
    current_enrollment: int
    year_of_study: int
    is_active: bool
    department: Optional[DepartmentRead] = None


# ─── Instructor ───────────────────────────────────────────────────────────────

class InstructorCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    staff_id: str
    department_id: Optional[int] = None
    max_load_hours: int = 20


class InstructorUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    department_id: Optional[int] = None
    max_load_hours: Optional[int] = None
    is_active: Optional[bool] = None


class InstructorRead(OrmBase):
    id: int
    first_name: str
    last_name: str
    email: str
    staff_id: str
    department_id: Optional[int]
    max_load_hours: int
    is_active: bool


class InstructorAvailabilityCreate(BaseModel):
    instructor_id: int
    day: DayOfWeek
    start_time: str
    end_time: str
    is_available: bool = True


class InstructorAvailabilityRead(OrmBase):
    id: int
    instructor_id: int
    day: DayOfWeek
    start_time: str
    end_time: str
    is_available: bool


# ─── Room ─────────────────────────────────────────────────────────────────────

class RoomCreate(BaseModel):
    name: str
    code: str
    capacity: int
    usage_type: RoomUsageType = RoomUsageType.LECTURE
    campus: CampusType = CampusType.MAIN
    building: Optional[str] = None
    floor: Optional[int] = None
    has_projector: bool = False
    has_ac: bool = False


class RoomUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    usage_type: Optional[RoomUsageType] = None
    campus: Optional[CampusType] = None
    building: Optional[str] = None
    has_projector: Optional[bool] = None
    has_ac: Optional[bool] = None
    is_active: Optional[bool] = None


class RoomRead(OrmBase):
    id: int
    name: str
    code: str
    capacity: int
    usage_type: RoomUsageType
    campus: CampusType
    building: Optional[str]
    floor: Optional[int]
    has_projector: bool
    has_ac: bool
    is_active: bool


# ─── Course ───────────────────────────────────────────────────────────────────

class CourseCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    lecture_hours: int = 0
    practical_hours: int = 0
    credit_hours: float = 3.0
    program_ids: List[int] = []
    instructor_ids: List[int] = []


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    lecture_hours: Optional[int] = None
    practical_hours: Optional[int] = None
    credit_hours: Optional[float] = None
    program_ids: Optional[List[int]] = None
    instructor_ids: Optional[List[int]] = None
    is_active: Optional[bool] = None


class CourseRead(OrmBase):
    id: int
    code: str
    name: str
    description: Optional[str]
    lecture_hours: int
    practical_hours: int
    credit_hours: float
    is_active: bool
    programs: List[ProgramRead] = []
    instructors: List[InstructorRead] = []


# ─── Timetable Slot ───────────────────────────────────────────────────────────

class TimetableSlotCreate(BaseModel):
    day: DayOfWeek
    start_time: str  # "HH:MM"
    end_time: str    # "HH:MM"
    label: Optional[str] = None


class TimetableSlotRead(OrmBase):
    id: int
    day: DayOfWeek
    start_time: str
    end_time: str
    label: Optional[str]


# ─── Timetable Entry ──────────────────────────────────────────────────────────

class TimetableEntryCreate(BaseModel):
    course_id: int
    instructor_id: Optional[int]
    room_id: Optional[int]
    program_id: int
    slot_id: int
    session_type: SessionType
    academic_year: str = "2024/2025"
    semester: int = 1
    notes: Optional[str] = None


class TimetableEntryUpdate(BaseModel):
    instructor_id: Optional[int] = None
    room_id: Optional[int] = None
    slot_id: Optional[int] = None
    notes: Optional[str] = None
    is_manual: bool = True


class TimetableEntryRead(OrmBase):
    id: int
    course_id: int
    instructor_id: Optional[int]
    room_id: Optional[int]
    program_id: int
    slot_id: int
    session_type: SessionType
    academic_year: str
    semester: int
    is_manual: bool
    notes: Optional[str]
    catering_count: Optional[int]
    course: Optional[CourseRead] = None
    instructor: Optional[InstructorRead] = None
    room: Optional[RoomRead] = None
    program: Optional[ProgramRead] = None
    slot: Optional[TimetableSlotRead] = None


# ─── Generation ───────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    academic_year: str = "2024/2025"
    semester: int = 1
    program_ids: Optional[List[int]] = None  # None = all active programs
    clear_existing: bool = False


class GenerateResponse(BaseModel):
    success: bool
    message: str
    scheduled_count: int = 0
    unscheduled: List[dict] = []
    warnings: List[str] = []


# ─── System Settings ──────────────────────────────────────────────────────────

class SettingUpdate(BaseModel):
    value: str
    description: Optional[str] = None


class SettingRead(OrmBase):
    id: int
    key: str
    value: str
    description: Optional[str]


class SystemSettingsBundle(BaseModel):
    """Convenience object returned by GET /settings."""
    lecturer_available_start_time: str
    lecturer_available_end_time: str
    friday_prayer_start: str
    friday_prayer_end: str
    slot_duration_minutes: int
    current_academic_year: str
    current_semester: int


# ─── Reports ─────────────────────────────────────────────────────────────────

class RoomUtilizationReport(BaseModel):
    room_id: int
    room_name: str
    campus: str
    total_slots: int
    used_slots: int
    utilization_percent: float


class InstructorWorkloadReport(BaseModel):
    instructor_id: int
    instructor_name: str
    department: Optional[str]
    scheduled_hours: int
    max_load_hours: int
    load_percent: float


class UnscheduledCourse(BaseModel):
    course_id: int
    course_code: str
    course_name: str
    program_id: int
    program_name: str
    missing_lecture_slots: int
    missing_practical_slots: int
    reason: str


# Fix forward references
UserRead.model_rebuild()
