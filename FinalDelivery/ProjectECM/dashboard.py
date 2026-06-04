from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth, scoring
from typing import List

# ── Dashboard ─────────────────────────────────────────────────────────────────
dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@dashboard_router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_role(
        models.UserRole.admin, models.UserRole.donor
    )),
):
    total_devices  = db.query(models.Device).count()
    available      = db.query(models.Device).filter(models.Device.state == models.DeviceState.available).count()
    assigned       = db.query(models.Device).filter(models.Device.state == models.DeviceState.assigned).count()
    in_repair      = db.query(models.Device).filter(models.Device.state == models.DeviceState.in_repair).count()
    overdue_dev    = db.query(models.Device).filter(models.Device.state == models.DeviceState.overdue).count()
    pending_req    = db.query(models.DeviceRequest).filter(models.DeviceRequest.status == models.RequestStatus.pending).count()
    approved_req   = db.query(models.DeviceRequest).filter(models.DeviceRequest.status == models.RequestStatus.approved).count()
    holds          = db.query(models.User).filter(models.User.academic_hold == True).count()
    total_students = db.query(models.User).filter(models.User.role == models.UserRole.student).count()

    # Recovery rate: returned on time / total returned
    returned = db.query(models.DeviceRequest).filter(
        models.DeviceRequest.status == models.RequestStatus.returned
    ).all()
    on_time = [r for r in returned if r.returned_at and r.due_date and r.returned_at <= r.due_date]
    recovery_rate = round(len(on_time) / max(len(returned), 1) * 100, 1)

    return schemas.DashboardStats(
        total_devices    = total_devices,
        available        = available,
        assigned         = assigned,
        in_repair        = in_repair,
        overdue          = overdue_dev,
        pending_requests = pending_req,
        approved_requests= approved_req,
        academic_holds   = holds,
        total_students   = total_students,
        recovery_rate    = recovery_rate,
    )


@dashboard_router.get("/queue")
def get_priority_queue(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_role(models.UserRole.admin)),
):
    """Return pending requests sorted by priority score descending."""
    pending = db.query(models.DeviceRequest).filter(
        models.DeviceRequest.status == models.RequestStatus.pending
    ).order_by(models.DeviceRequest.priority_score.desc()).all()

    return [
        {
            "request_id":    r.id,
            "student_id":    r.student_id,
            "student_name":  r.student.full_name if r.student else "N/A",
            "priority_score": r.priority_score,
            "priority_band": scoring.priority_band(r.priority_score or 0),
            "program":       r.academic_program,
            "semester":      r.semester,
            "reason":        r.reason,
            "requested_at":  r.requested_at,
        }
        for r in pending
    ]


@dashboard_router.get("/audit-log")
def get_audit_log(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_role(models.UserRole.admin)),
):
    logs = db.query(models.AuditLog).order_by(
        models.AuditLog.timestamp.desc()
    ).offset(skip).limit(limit).all()
    return logs


# ── Scoring preview ───────────────────────────────────────────────────────────
scoring_router = APIRouter(prefix="/scoring", tags=["Scoring Engine"])

@scoring_router.post("/preview", response_model=schemas.ScoreResult)
def preview_score(
    data: schemas.ScorePreview,
    _: models.User = Depends(auth.get_current_user),
):
    """Preview what score a student would receive without creating a request."""
    score = scoring.compute_score(
        data.vulnerability_index,
        data.academic_load,
        data.compliance_history,
    )
    breakdown = scoring.score_breakdown(
        data.vulnerability_index,
        data.academic_load,
        data.compliance_history,
    )
    return schemas.ScoreResult(
        score          = score,
        breakdown      = breakdown,
        priority_band  = scoring.priority_band(score),
    )


# ── Users (admin management) ──────────────────────────────────────────────────
users_router = APIRouter(prefix="/users", tags=["Users"])

@users_router.get("/", response_model=List[schemas.UserOut])
def list_users(
    role: models.UserRole = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_role(models.UserRole.admin)),
):
    q = db.query(models.User)
    if role:
        q = q.filter(models.User.role == role)
    return q.offset(skip).limit(limit).all()

@users_router.patch("/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    updates: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in updates.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    auth.log_action(db, current_user.id, "UPDATE_USER", "User", user_id,
                    str(updates.model_dump(exclude_none=True)))
    return user
