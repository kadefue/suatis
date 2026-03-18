"""
app/api/v1/router.py
Aggregates all sub-routers and registers them on /api/v1.
"""

from fastapi import APIRouter
from app.api.v1 import (
    auth, colleges, departments, programs, instructors,
    rooms, courses, timetable, settings, reports
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router,         prefix="/auth",        tags=["Auth"])
api_router.include_router(colleges.router,     prefix="/colleges",    tags=["Colleges"])
api_router.include_router(departments.router,  prefix="/departments", tags=["Departments"])
api_router.include_router(programs.router,     prefix="/programs",    tags=["Programs"])
api_router.include_router(instructors.router,  prefix="/instructors", tags=["Instructors"])
api_router.include_router(rooms.router,        prefix="/rooms",       tags=["Rooms"])
api_router.include_router(courses.router,      prefix="/courses",     tags=["Courses"])
api_router.include_router(timetable.router,    prefix="",             tags=["Timetable"])
api_router.include_router(settings.router,     prefix="/settings",    tags=["Settings"])
api_router.include_router(reports.router,      prefix="/reports",     tags=["Reports"])
