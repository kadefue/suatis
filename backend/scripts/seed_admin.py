#!/usr/bin/env python3
"""
scripts/seed_admin.py
Creates the initial admin user. Run once after first launch:
  python scripts/seed_admin.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.db.session import SessionLocal, engine, Base
from app.models.models import User, Role
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)

with SessionLocal() as db:
    # Ensure Admin role exists
    role = db.query(Role).filter(Role.name == "Admin").first()
    if not role:
        role = Role(name="Admin", description="Full system access")
        db.add(role)
        db.flush()

    # Create admin user
    if not db.query(User).filter(User.username == "admin").first():
        user = User(
            username="admin",
            email="admin@sua.ac.tz",
            hashed_password=hash_password("admin123"),
            full_name="System Administrator",
            role=role,
            is_superuser=True,
            is_active=True,
        )
        db.add(user)
        db.commit()
        print("✅  Admin user created: admin / admin123")
    else:
        print("ℹ️   Admin user already exists")
