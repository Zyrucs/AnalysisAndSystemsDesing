from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal
import models, auth

# Routers
from routers.auth_router import router as auth_router
from routers.devices     import router as devices_router
from routers.requests    import router as requests_router
from routers.dashboard   import dashboard_router, scoring_router, users_router

# ── Create tables ─────────────────────────────────────────────────────────────
models.Base.metadata.create_all(bind=engine)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "ECM Platform API",
    description = "Equipment & Connectivity Management Platform — Universidad Distrital FJC",
    version     = "1.0.0",
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Register routers ──────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(devices_router)
app.include_router(requests_router)
app.include_router(dashboard_router)
app.include_router(scoring_router)
app.include_router(users_router)


# ── Seed data (runs once on first startup) ────────────────────────────────────
def seed():
    db = SessionLocal()
    try:
        if db.query(models.User).count() > 0:
            return  # already seeded

        # Admin
        admin = models.User(
            full_name       = "Admin ECM",
            email           = "admin@udistrital.edu.co",
            hashed_password = auth.hash_password("admin1234"),
            role            = models.UserRole.admin,
        )
        db.add(admin)

        # Demo student
        student = models.User(
            full_name           = "Juan Ramírez",
            email               = "student@udistrital.edu.co",
            hashed_password     = auth.hash_password("student1234"),
            role                = models.UserRole.student,
            vulnerability_index = 0.75,
            academic_load       = 0.80,
            compliance_history  = 0.90,
        )
        db.add(student)

        # Demo donor
        donor = models.User(
            full_name       = "Donor Corp",
            email           = "donor@example.com",
            hashed_password = auth.hash_password("donor1234"),
            role            = models.UserRole.donor,
        )
        db.add(donor)
        db.commit()

        # Demo devices
        devices_data = [
            ("Dell Latitude 5420",    "laptop",  "SN-001"),
            ("Lenovo ThinkPad E14",   "laptop",  "SN-002"),
            ("HP ProBook 450",        "laptop",  "SN-003"),
            ("Samsung Galaxy Tab A8", "tablet",  "SN-004"),
            ("iPad 9th Gen",          "tablet",  "SN-005"),
            ("TP-Link Router TL-MR6", "router",  "SN-006"),
        ]
        for name, dtype, serial in devices_data:
            db.add(models.Device(name=name, device_type=dtype, serial_number=serial))

        db.commit()
        print("[OK] Seed data loaded")
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    seed()


@app.get("/")
def root():
    return {
        "project": "ECM Platform",
        "version": "1.0.0",
        "docs":    "/docs",
        "status":  "running",
    }
