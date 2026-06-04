from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class UserRole(str, enum.Enum):
    student = "student"
    admin   = "admin"
    donor   = "donor"


class DeviceState(str, enum.Enum):
    available    = "available"
    assigned     = "assigned"
    in_repair    = "in_repair"
    overdue      = "overdue"
    retired      = "retired"


class DeviceOrigin(str, enum.Enum):
    owned  = "owned"
    donated = "donated"


class RequestStatus(str, enum.Enum):
    pending  = "pending"
    approved = "approved"
    denied   = "denied"
    returned = "returned"


# ── User ──────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    full_name       = Column(String(120), nullable=False)
    email           = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role            = Column(Enum(UserRole), default=UserRole.student, nullable=False)
    is_active       = Column(Boolean, default=True)
    academic_hold   = Column(Boolean, default=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    # Student-specific scoring attributes
    vulnerability_index  = Column(Float, default=0.5)   # V ∈ [0,1]
    academic_load        = Column(Float, default=0.5)   # A ∈ [0,1]
    compliance_history   = Column(Float, default=1.0)   # H ∈ [0,1]

    requests = relationship("DeviceRequest", back_populates="student",
                            foreign_keys="DeviceRequest.student_id")


# ── Device ────────────────────────────────────────────────────────────────────
class Device(Base):
    __tablename__ = "devices"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(100), nullable=False)          # e.g. "Dell Latitude 5420"
    device_type  = Column(String(50), nullable=False)           # laptop / tablet / router
    serial_number = Column(String(100), unique=True, nullable=False)
    state        = Column(Enum(DeviceState), default=DeviceState.available)
    origin       = Column(Enum(DeviceOrigin), default=DeviceOrigin.owned)
    condition    = Column(Float, default=1.0)                   # 0..1
    donor_id     = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes        = Column(Text, nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    requests = relationship("DeviceRequest", back_populates="device")


# ── Device Request ─────────────────────────────────────────────────────────────
class DeviceRequest(Base):
    __tablename__ = "device_requests"

    id           = Column(Integer, primary_key=True, index=True)
    student_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    device_id    = Column(Integer, ForeignKey("devices.id"), nullable=True)
    status       = Column(Enum(RequestStatus), default=RequestStatus.pending)
    priority_score = Column(Float, nullable=True)               # computed by scoring engine

    # Student-provided context at time of request
    reason       = Column(Text, nullable=False)
    academic_program = Column(String(100), nullable=False)
    semester     = Column(Integer, nullable=False)

    # Dates
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_at  = Column(DateTime(timezone=True), nullable=True)
    due_date     = Column(DateTime(timezone=True), nullable=True)
    returned_at  = Column(DateTime(timezone=True), nullable=True)

    # Admin notes
    admin_notes  = Column(Text, nullable=True)
    reviewed_by  = Column(Integer, ForeignKey("users.id"), nullable=True)

    student  = relationship("User", back_populates="requests", foreign_keys=[student_id])
    device   = relationship("Device", back_populates="requests")
    reviewer = relationship("User", foreign_keys=[reviewed_by])


# ── Connectivity Token ────────────────────────────────────────────────────────
class ConnectivityToken(Base):
    __tablename__ = "connectivity_tokens"

    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    data_limit_gb = Column(Float, default=10.0)
    used_gb     = Column(Float, default=0.0)
    is_active   = Column(Boolean, default=True)
    issued_at   = Column(DateTime(timezone=True), server_default=func.now())
    expires_at  = Column(DateTime(timezone=True), nullable=True)

    student = relationship("User")


# ── Audit Log ─────────────────────────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=True)
    action     = Column(String(100), nullable=False)
    entity     = Column(String(50), nullable=False)
    entity_id  = Column(Integer, nullable=True)
    detail     = Column(Text, nullable=True)
    timestamp  = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
