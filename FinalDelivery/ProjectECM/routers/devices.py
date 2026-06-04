from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.get("/", response_model=List[schemas.DeviceOut])
def list_devices(
    state: Optional[models.DeviceState] = None,
    device_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.Device)
    if state:
        q = q.filter(models.Device.state == state)
    if device_type:
        q = q.filter(models.Device.device_type == device_type)
    return q.offset(skip).limit(limit).all()


@router.get("/{device_id}", response_model=schemas.DeviceOut)
def get_device(
    device_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.post("/", response_model=schemas.DeviceOut, status_code=201)
def create_device(
    device_in: schemas.DeviceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
):
    if db.query(models.Device).filter(
        models.Device.serial_number == device_in.serial_number
    ).first():
        raise HTTPException(status_code=400, detail="Serial number already registered")

    device = models.Device(**device_in.model_dump())
    db.add(device)
    db.commit()
    db.refresh(device)
    auth.log_action(db, current_user.id, "CREATE_DEVICE", "Device", device.id,
                    f"Added {device.name} ({device.serial_number})")
    return device


@router.patch("/{device_id}", response_model=schemas.DeviceOut)
def update_device(
    device_id: int,
    updates: schemas.DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
):
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    for field, value in updates.model_dump(exclude_none=True).items():
        setattr(device, field, value)
    db.commit()
    db.refresh(device)
    auth.log_action(db, current_user.id, "UPDATE_DEVICE", "Device", device.id,
                    str(updates.model_dump(exclude_none=True)))
    return device


@router.delete("/{device_id}", status_code=204)
def retire_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
):
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if device.state == models.DeviceState.assigned:
        raise HTTPException(status_code=400, detail="Cannot retire an assigned device")
    device.state = models.DeviceState.retired
    db.commit()
    auth.log_action(db, current_user.id, "RETIRE_DEVICE", "Device", device.id)


@router.post("/{device_id}/send-to-repair", response_model=schemas.DeviceOut)
def send_to_repair(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
):
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if device.state == models.DeviceState.assigned:
        raise HTTPException(status_code=400, detail="Device is currently assigned")
    device.state = models.DeviceState.in_repair
    db.commit()
    db.refresh(device)
    auth.log_action(db, current_user.id, "SEND_TO_REPAIR", "Device", device.id)
    return device


@router.post("/{device_id}/return-from-repair", response_model=schemas.DeviceOut)
def return_from_repair(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
):
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device or device.state != models.DeviceState.in_repair:
        raise HTTPException(status_code=400, detail="Device is not in repair")
    device.state     = models.DeviceState.available
    device.condition = min(1.0, device.condition + 0.3)   # partial restore after repair
    db.commit()
    db.refresh(device)
    auth.log_action(db, current_user.id, "RETURN_FROM_REPAIR", "Device", device.id)
    return device
