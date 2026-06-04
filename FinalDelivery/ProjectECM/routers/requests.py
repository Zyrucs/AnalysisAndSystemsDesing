from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from database import get_db
import models, schemas, auth, scoring

router = APIRouter(prefix="/requests", tags=["Device Requests"])


@router.post("/", response_model=schemas.RequestOut, status_code=201)
def create_request(
    req_in: schemas.RequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.student)),
):
    # Block if academic hold is active
    if current_user.academic_hold:
        raise HTTPException(status_code=403,
                            detail="Academic Hold active — return overdue device first")

    # Block if already has an active request or assigned device
    active = db.query(models.DeviceRequest).filter(
        models.DeviceRequest.student_id == current_user.id,
        models.DeviceRequest.status.in_([
            models.RequestStatus.pending,
            models.RequestStatus.approved
        ])
    ).first()
    if active:
        raise HTTPException(status_code=400,
                            detail="You already have an active request or assigned device")

    # Compute priority score via Scoring Engine
    score = scoring.compute_score(
        current_user.vulnerability_index,
        current_user.academic_load,
        current_user.compliance_history,
    )

    request = models.DeviceRequest(
        student_id       = current_user.id,
        reason           = req_in.reason,
        academic_program = req_in.academic_program,
        semester         = req_in.semester,
        priority_score   = score,
        status           = models.RequestStatus.pending,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    auth.log_action(db, current_user.id, "CREATE_REQUEST", "DeviceRequest",
                    request.id, f"Score: {score}")
    return request


@router.get("/", response_model=List[schemas.RequestOut])
def list_requests(
    status: Optional[models.RequestStatus] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.DeviceRequest)

    # Students only see their own requests
    if current_user.role == models.UserRole.student:
        q = q.filter(models.DeviceRequest.student_id == current_user.id)

    if status:
        q = q.filter(models.DeviceRequest.status == status)

    # Order by priority score descending (admin view)
    q = q.order_by(models.DeviceRequest.priority_score.desc())
    return q.offset(skip).limit(limit).all()


@router.get("/{request_id}", response_model=schemas.RequestOut)
def get_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    req = db.query(models.DeviceRequest).filter(
        models.DeviceRequest.id == request_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if current_user.role == models.UserRole.student and req.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return req


@router.post("/{request_id}/review", response_model=schemas.RequestOut)
def review_request(
    request_id: int,
    review: schemas.RequestReview,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
):
    req = db.query(models.DeviceRequest).filter(
        models.DeviceRequest.id == request_id,
        models.DeviceRequest.status == models.RequestStatus.pending,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Pending request not found")

    if review.approved:
        if not review.device_id:
            raise HTTPException(status_code=400, detail="device_id required for approval")

        device = db.query(models.Device).filter(
            models.Device.id == review.device_id,
            models.Device.state == models.DeviceState.available,
        ).first()
        if not device:
            raise HTTPException(status_code=400, detail="Device not available")

        # Assign device
        device.state       = models.DeviceState.assigned
        req.device_id      = device.id
        req.status         = models.RequestStatus.approved
        req.approved_at    = datetime.utcnow()
        req.due_date       = datetime.utcnow() + timedelta(days=review.loan_days)
        req.reviewed_by    = current_user.id
        req.admin_notes    = review.admin_notes
        action = "APPROVE_REQUEST"
    else:
        req.status      = models.RequestStatus.denied
        req.reviewed_by = current_user.id
        req.admin_notes = review.admin_notes
        action = "DENY_REQUEST"

    db.commit()
    db.refresh(req)
    auth.log_action(db, current_user.id, action, "DeviceRequest", req.id,
                    review.admin_notes)
    return req


@router.post("/{request_id}/return", response_model=schemas.RequestOut)
def return_device(
    request_id: int,
    ret: schemas.RequestReturn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
):
    req = db.query(models.DeviceRequest).filter(
        models.DeviceRequest.id == request_id,
        models.DeviceRequest.status == models.RequestStatus.approved,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Active loan not found")

    device = db.query(models.Device).filter(models.Device.id == req.device_id).first()
    if device:
        device.condition = ret.device_condition
        device.state     = (models.DeviceState.in_repair
                            if ret.device_condition < 0.3
                            else models.DeviceState.available)

    # Update compliance history of student
    student = db.query(models.User).filter(models.User.id == req.student_id).first()
    on_time = datetime.utcnow() <= req.due_date if req.due_date else True
    if student:
        # Rolling average — weight recent behavior 30%
        student.compliance_history = round(
            student.compliance_history * 0.7 + (1.0 if on_time else 0.0) * 0.3, 4
        )
        if student.academic_hold and on_time:
            student.academic_hold = False   # lift hold if returned

    req.status      = models.RequestStatus.returned
    req.returned_at = datetime.utcnow()
    db.commit()
    db.refresh(req)
    auth.log_action(db, current_user.id, "RETURN_DEVICE", "DeviceRequest", req.id,
                    f"Condition: {ret.device_condition}")
    return req


@router.post("/check-overdue", status_code=200)
def check_overdue(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
):
    """
    Scan all active loans past due date and apply Academic Hold.
    Call this endpoint daily (cron job or manual trigger).
    """
    now = datetime.utcnow()
    overdue = db.query(models.DeviceRequest).filter(
        models.DeviceRequest.status == models.RequestStatus.approved,
        models.DeviceRequest.due_date < now,
    ).all()

    flagged = []
    for req in overdue:
        student = db.query(models.User).filter(models.User.id == req.student_id).first()
        device  = db.query(models.Device).filter(models.Device.id == req.device_id).first()
        if student and not student.academic_hold:
            student.academic_hold = True
        if device:
            device.state = models.DeviceState.overdue
        flagged.append(req.id)

    db.commit()
    auth.log_action(db, current_user.id, "CHECK_OVERDUE", "System",
                    detail=f"Flagged request IDs: {flagged}")
    return {"flagged_requests": flagged, "count": len(flagged)}
