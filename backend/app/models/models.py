"""
app/models/models.py
Full ORM model definitions for TGS – Sokoine University of Agriculture.

Designed to be compatible with both SQLite (dev) and PostgreSQL (prod).
"""

import enum
from datetime import time
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, Enum,
    UniqueConstraint, Index, Text, Float, Time, Table
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.session import Base


# ─────────────────────────────────────────────────────────────────────────────
# Enumerations
# ─────────────────────────────────────────────────────────────────────────────

class RoomUsageType(str, enum.Enum):
    LECTURE = "LECTURE"
    LAB = "LAB"
    BOTH = "BOTH"


class CampusType(str, enum.Enum):
    MAIN = "MAIN"
    MAZIMBU = "MAZIMBU"


class SessionType(str, enum.Enum):
    LECTURE = "LECTURE"
    PRACTICAL = "PRACTICAL"


class DayOfWeek(str, enum.Enum):
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"


# ─────────────────────────────────────────────────────────────────────────────
# Many-to-Many Association Tables
# ─────────────────────────────────────────────────────────────────────────────

course_programs = Table(
    "course_programs",
    Base.metadata,
    Column("course_id", Integer, ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True),
    Column("program_id", Integer, ForeignKey("programs.id", ondelete="CASCADE"), primary_key=True),
)

course_instructors = Table(
    "course_instructors",
    Base.metadata,
    Column("course_id", Integer, ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True),
    Column("instructor_id", Integer, ForeignKey("instructors.id", ondelete="CASCADE"), primary_key=True),
)

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


# ─────────────────────────────────────────────────────────────────────────────
# Academic Structure
# ─────────────────────────────────────────────────────────────────────────────

class College(Base):
    __tablename__ = "colleges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    departments: Mapped[List["Department"]] = relationship("Department", back_populates="college")


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    college_id: Mapped[int] = mapped_column(Integer, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    college: Mapped["College"] = relationship("College", back_populates="departments")
    programs: Mapped[List["Program"]] = relationship("Program", back_populates="department")
    instructors: Mapped[List["Instructor"]] = relationship("Instructor", back_populates="department")

    __table_args__ = (
        UniqueConstraint("code", "college_id", name="uq_dept_code_college"),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Academic Data
# ─────────────────────────────────────────────────────────────────────────────

class Program(Base):
    __tablename__ = "programs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    department_id: Mapped[int] = mapped_column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=0)
    current_enrollment: Mapped[int] = mapped_column(Integer, default=0)
    year_of_study: Mapped[int] = mapped_column(Integer, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    department: Mapped["Department"] = relationship("Department", back_populates="programs")
    courses: Mapped[List["Course"]] = relationship("Course", secondary=course_programs, back_populates="programs")
    timetable_entries: Mapped[List["TimetableEntry"]] = relationship("TimetableEntry", back_populates="program")

    __table_args__ = (
        Index("ix_programs_department_id", "department_id"),
    )


class Instructor(Base):
    __tablename__ = "instructors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    staff_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    department_id: Mapped[int] = mapped_column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    max_load_hours: Mapped[int] = mapped_column(Integer, default=20)  # hours per week
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    department: Mapped[Optional["Department"]] = relationship("Department", back_populates="instructors")
    courses: Mapped[List["Course"]] = relationship("Course", secondary=course_instructors, back_populates="instructors")
    availability: Mapped[List["InstructorAvailability"]] = relationship("InstructorAvailability", back_populates="instructor")
    timetable_entries: Mapped[List["TimetableEntry"]] = relationship("TimetableEntry", back_populates="instructor")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    __table_args__ = (
        Index("ix_instructors_department_id", "department_id"),
    )


class InstructorAvailability(Base):
    """Admin-controlled override for when an instructor is available."""
    __tablename__ = "instructor_availability"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    instructor_id: Mapped[int] = mapped_column(Integer, ForeignKey("instructors.id", ondelete="CASCADE"), nullable=False)
    day: Mapped[DayOfWeek] = mapped_column(Enum(DayOfWeek), nullable=False)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)  # "HH:MM"
    end_time: Mapped[str] = mapped_column(String(10), nullable=False)    # "HH:MM"
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)

    instructor: Mapped["Instructor"] = relationship("Instructor", back_populates="availability")

    __table_args__ = (
        UniqueConstraint("instructor_id", "day", name="uq_instructor_day"),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Resources
# ─────────────────────────────────────────────────────────────────────────────

class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    usage_type: Mapped[RoomUsageType] = mapped_column(Enum(RoomUsageType), nullable=False, default=RoomUsageType.LECTURE)
    campus: Mapped[CampusType] = mapped_column(Enum(CampusType), nullable=False, default=CampusType.MAIN)
    building: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    floor: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    has_projector: Mapped[bool] = mapped_column(Boolean, default=False)
    has_ac: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    timetable_entries: Mapped[List["TimetableEntry"]] = relationship("TimetableEntry", back_populates="room")

    __table_args__ = (
        Index("ix_rooms_campus", "campus"),
        Index("ix_rooms_usage_type", "usage_type"),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Courses
# ─────────────────────────────────────────────────────────────────────────────

class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lecture_hours: Mapped[int] = mapped_column(Integer, default=0)      # 45-min units per week
    practical_hours: Mapped[int] = mapped_column(Integer, default=0)    # 45-min units per week
    credit_hours: Mapped[float] = mapped_column(Float, default=3.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    programs: Mapped[List["Program"]] = relationship("Program", secondary=course_programs, back_populates="courses")
    instructors: Mapped[List["Instructor"]] = relationship("Instructor", secondary=course_instructors, back_populates="courses")
    timetable_entries: Mapped[List["TimetableEntry"]] = relationship("TimetableEntry", back_populates="course")


# ─────────────────────────────────────────────────────────────────────────────
# Timetable
# ─────────────────────────────────────────────────────────────────────────────

class TimetableSlot(Base):
    """Defines valid time slots in the week."""
    __tablename__ = "timetable_slots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    day: Mapped[DayOfWeek] = mapped_column(Enum(DayOfWeek), nullable=False)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)  # "HH:MM"
    end_time: Mapped[str] = mapped_column(String(10), nullable=False)    # "HH:MM"
    label: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g. "Period 1"

    entries: Mapped[List["TimetableEntry"]] = relationship("TimetableEntry", back_populates="slot")

    __table_args__ = (
        UniqueConstraint("day", "start_time", name="uq_slot_day_start"),
    )


class TimetableEntry(Base):
    """A single scheduled session — the core output of the scheduling engine."""
    __tablename__ = "timetable_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    instructor_id: Mapped[int] = mapped_column(Integer, ForeignKey("instructors.id", ondelete="SET NULL"), nullable=True)
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)
    program_id: Mapped[int] = mapped_column(Integer, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    slot_id: Mapped[int] = mapped_column(Integer, ForeignKey("timetable_slots.id", ondelete="CASCADE"), nullable=False)
    session_type: Mapped[SessionType] = mapped_column(Enum(SessionType), nullable=False)
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False, default="2024/2025")
    semester: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_manual: Mapped[bool] = mapped_column(Boolean, default=False)  # True if manually adjusted
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Catering / meals placeholder
    catering_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    course: Mapped["Course"] = relationship("Course", back_populates="timetable_entries")
    instructor: Mapped[Optional["Instructor"]] = relationship("Instructor", back_populates="timetable_entries")
    room: Mapped[Optional["Room"]] = relationship("Room", back_populates="timetable_entries")
    program: Mapped["Program"] = relationship("Program", back_populates="timetable_entries")
    slot: Mapped["TimetableSlot"] = relationship("TimetableSlot", back_populates="entries")

    __table_args__ = (
        # Prevent double-booking
        UniqueConstraint("instructor_id", "slot_id", "academic_year", "semester", name="uq_instructor_slot"),
        UniqueConstraint("room_id", "slot_id", "academic_year", "semester", name="uq_room_slot"),
        # Indexes for fast filtering
        Index("ix_entry_program_id", "program_id"),
        Index("ix_entry_instructor_id", "instructor_id"),
        Index("ix_entry_room_id", "room_id"),
        Index("ix_entry_course_id", "course_id"),
    )


# ─────────────────────────────────────────────────────────────────────────────
# System: Users / RBAC
# ─────────────────────────────────────────────────────────────────────────────

class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    roles: Mapped[List["Role"]] = relationship("Role", secondary=role_permissions, back_populates="permissions")


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    permissions: Mapped[List["Permission"]] = relationship("Permission", secondary=role_permissions, back_populates="roles")
    users: Mapped[List["User"]] = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id", ondelete="SET NULL"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)

    role: Mapped[Optional["Role"]] = relationship("Role", back_populates="users")


# ─────────────────────────────────────────────────────────────────────────────
# System Settings
# ─────────────────────────────────────────────────────────────────────────────

class SystemSetting(Base):
    """Admin-controlled global settings for the timetabling system."""
    __tablename__ = "system_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    value: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
