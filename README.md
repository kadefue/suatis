# TGS — Timetable Generation System
### Sokoine University of Agriculture (SUA)

A full-stack, production-ready automated timetabling platform with constraint-based scheduling, multi-campus support, and Friday prayer scheduling awareness.

---

## 📐 Architecture

```
tgs/
├── backend/                    # FastAPI + SQLAlchemy
│   ├── main.py                 # App entry point
│   ├── alembic/                # Database migrations
│   │   └── env.py
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── .env.example
│   ├── scripts/
│   │   └── seed_admin.py       # Creates first admin user
│   └── app/
│       ├── config/
│       │   └── settings.py     # Pydantic Settings (env-aware)
│       ├── db/
│       │   └── session.py      # Engine creation (SQLite/PostgreSQL)
│       ├── models/
│       │   └── models.py       # All SQLAlchemy ORM models
│       ├── schemas/
│       │   └── schemas.py      # Pydantic v2 request/response schemas
│       ├── core/
│       │   └── security.py     # JWT + password hashing + RBAC deps
│       ├── services/
│       │   ├── scheduler.py    # 🧠 Timetable generation engine
│       │   └── crud.py         # Shared DB helpers
│       └── api/v1/
│           ├── router.py       # Aggregates all sub-routers
│           ├── auth.py
│           ├── colleges.py
│           ├── departments.py
│           ├── programs.py
│           ├── instructors.py
│           ├── rooms.py
│           ├── courses.py
│           ├── timetable.py    # Generation + query endpoints
│           ├── settings.py
│           └── reports.py
│
└── frontend/                   # React + Vite + TailwindCSS
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx             # Route definitions
        ├── index.css           # Tailwind + custom classes
        ├── api/
        │   └── client.js       # Axios + all API methods
        ├── store/
        │   └── authStore.js    # Zustand auth state
        ├── components/
        │   ├── Layout.jsx      # Sidebar navigation
        │   ├── ui.jsx          # Shared UI components
        │   └── CrudPage.jsx    # Generic CRUD page factory
        └── pages/
            ├── LoginPage.jsx
            ├── Dashboard.jsx
            ├── CollegesPage.jsx
            ├── DepartmentsPage.jsx
            ├── ProgramsPage.jsx
            ├── InstructorsPage.jsx
            ├── RoomsPage.jsx
            ├── CoursesPage.jsx
            ├── TimetablePage.jsx   # ← Core timetable viewer (3 modes)
            ├── GenerationPage.jsx  # ← Run the scheduler
            ├── SettingsPage.jsx
            └── ReportsPage.jsx
```

---

## 🚀 Quick Start

### Backend

```bash
cd backend

# 1. Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env as needed (SQLite used by default in development)

# 4. Create admin user
python scripts/seed_admin.py

# 5. Start dev server
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend

npm install
npm run dev
```

Frontend available at: http://localhost:5173

---

## 🔧 Environment Configuration

### Development (SQLite — default)
```env
ENVIRONMENT=development
DATABASE_URL=sqlite:///./tgs_dev.db
SECRET_KEY=your-secret-key-here
```

### Production (PostgreSQL)
```env
ENVIRONMENT=production
DATABASE_URL=postgresql://user:password@host:5432/tgs_prod
SECRET_KEY=a-very-long-random-secret-key
```

The system automatically switches DB adapters based on `DATABASE_URL`. No code changes required.

---

## 🗄️ Database Migrations (Alembic)

```bash
cd backend

# Generate a new migration
alembic revision --autogenerate -m "describe change"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

Both SQLite and PostgreSQL are supported via `render_as_batch=True` in `alembic/env.py`.

---

## 🧠 Scheduling Engine

Located at `app/services/scheduler.py`.

### Hard Constraints (always enforced)

| # | Constraint |
|---|-----------|
| H1 | No instructor double-booking in the same slot |
| H2 | No room double-booking in the same slot |
| H3 | Room capacity ≥ program current enrollment |
| H4 | All required lecture and practical slots must be scheduled |
| H5 | Room type matches session type (LECTURE/LAB/BOTH) |
| H6 | Lecturers only scheduled within admin-defined window (default 07:00–19:30) |
| H7 | No classes during admin-defined Friday prayer block (default 12:15–14:00) |
| H8 | Campus preference — MAIN campus rooms prioritised to reduce travel |

### Soft Constraints (best-effort)
- Prefer rooms with sufficient-but-not-excessive capacity
- Prioritize programs with higher enrollment (harder to place first)

### Upgrading to OR-Tools
Replace `_schedule_request()` in `scheduler.py` with a CP-SAT model for optimal solutions at scale.

---

## 🔐 RBAC

| Role | Access |
|------|--------|
| **Admin** | Full system — configure settings, generate, manage all data |
| **Department Head** | View & manage own department data |
| **Instructor** | View their own timetable |
| **Student** | View program timetable |

Default credentials: `admin` / `admin123` (change immediately in production)

---

## 📡 Key API Endpoints

```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
GET    /api/v1/auth/me

GET    /api/v1/colleges
POST   /api/v1/colleges
PATCH  /api/v1/colleges/{id}

GET    /api/v1/timetable?program_id=&instructor_id=&room_id=
GET    /api/v1/timetable/program/{program_id}
GET    /api/v1/timetable/instructor/{instructor_id}
GET    /api/v1/timetable/room/{room_id}
PUT    /api/v1/timetable/{id}          ← manual adjustment with conflict check

POST   /api/v1/slots/generate          ← auto-create time slots
POST   /api/v1/generate-timetable      ← run scheduling engine

GET    /api/v1/settings
PUT    /api/v1/settings/{key}

GET    /api/v1/reports/room-utilization
GET    /api/v1/reports/instructor-workload
GET    /api/v1/reports/unscheduled-courses
```

---

## 📊 Frontend Pages

| Page | Description |
|------|-------------|
| **Dashboard** | System overview with stats and quick actions |
| **Timetable** | Interactive grid with Program / Instructor / Room views |
| **Generate** | Step-by-step scheduler with constraint summary |
| **Colleges** | Manage SUA colleges |
| **Departments** | Manage departments linked to colleges |
| **Programs** | Manage programs with enrollment data |
| **Instructors** | Manage academic staff and availability |
| **Rooms & Labs** | Manage physical spaces (MAIN + MAZIMBU campuses) |
| **Courses** | Course catalog with multi-program/instructor assignment |
| **Reports** | Room utilization, instructor workload, unscheduled courses |
| **Settings** | Admin-only system configuration |

---

## 🏗️ Production Deployment

```bash
# Backend
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Frontend
npm run build
# Serve dist/ with nginx or similar

# Run migrations before start
alembic upgrade head
```

---

## 🧩 Extension Points

| Feature | Where to add |
|---------|-------------|
| OR-Tools CP-SAT solver | Replace greedy in `scheduler.py` |
| Drag-and-drop timetable editing | `TimetablePage.jsx` + `PUT /timetable/{id}` |
| PDF timetable export | Add `reportlab` to backend + export endpoint |
| Email notifications | Add `fastapi-mail` + notification service |
| Catering integration | `catering_count` field already on `TimetableEntry` |
| Multi-semester planning | Already supported via `academic_year` + `semester` fields |

---

*Developed for Sokoine University of Agriculture · Morogoro, Tanzania*
