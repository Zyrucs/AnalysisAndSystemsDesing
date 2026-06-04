from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from models import UserRole, DeviceState, DeviceOrigin, RequestStatus


# ── Auth ──────────────────────────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str
    role: UserRole

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[UserRole] = None


# ── User ──────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.student
    vulnerability_index: float = Field(0.5, ge=0, le=1)
    academic_load: float       = Field(0.5, ge=0, le=1)
    compliance_history: float  = Field(1.0, ge=0, le=1)

class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: UserRole
    is_active: bool
    academic_hold: bool
    vulnerability_index: float
    academic_load: float
    compliance_history: float
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    vulnerability_index: Optional[float] = Field(None, ge=0, le=1)
    academic_load: Optional[float]       = Field(None, ge=0, le=1)
    compliance_history: Optional[float]  = Field(None, ge=0, le=1)
    academic_hold: Optional[bool]        = None
    is_active: Optional[bool]            = None


# ── Device ────────────────────────────────────────────────────────────────────
class DeviceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    device_type: str
    serial_number: str
    state: DeviceState = DeviceState.available
    origin: DeviceOrigin = DeviceOrigin.owned
    condition: float = Field(1.0, ge=0, le=1)
    donor_id: Optional[int] = None
    notes: Optional[str] = None

class DeviceOut(BaseModel):
    id: int
    name: str
    device_type: str
    serial_number: str
    state: DeviceState
    origin: DeviceOrigin
    condition: float
    donor_id: Optional[int]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class DeviceUpdate(BaseModel):
    name: Optional[str]         = None
    state: Optional[DeviceState] = None
    condition: Optional[float]  = Field(None, ge=0, le=1)
    notes: Optional[str]        = None


# ── Device Request ─────────────────────────────────────────────────────────────
class RequestCreate(BaseModel):
    reason: str = Field(..., min_length=10)
    academic_program: str
    semester: int = Field(..., ge=1, le=12)

class RequestOut(BaseModel):
    id: int
    student_id: int
    device_id: Optional[int]
    status: RequestStatus
    priority_score: Optional[float]
    reason: str
    academic_program: str
    semester: int
    requested_at: datetime
    approved_at: Optional[datetime]
    due_date: Optional[datetime]
    returned_at: Optional[datetime]
    admin_notes: Optional[str]

    class Config:
        from_attributes = True

class RequestReview(BaseModel):
    approved: bool
    device_id: Optional[int] = None   # required if approved
    admin_notes: Optional[str] = None
    loan_days: int = Field(30, ge=1, le=90)

class RequestReturn(BaseModel):
    device_condition: float = Field(..., ge=0, le=1)
    notes: Optional[str] = None


# ── Connectivity ──────────────────────────────────────────────────────────────
class TokenOut(BaseModel):
    id: int
    student_id: int
    data_limit_gb: float
    used_gb: float
    is_active: bool
    issued_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Dashboard ─────────────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_devices: int
    available: int
    assigned: int
    in_repair: int
    overdue: int
    pending_requests: int
    approved_requests: int
    academic_holds: int
    total_students: int
    recovery_rate: float          # % returned on time


# ── Scoring ───────────────────────────────────────────────────────────────────
class ScorePreview(BaseModel):
    vulnerability_index: float = Field(..., ge=0, le=1)
    academic_load: float       = Field(..., ge=0, le=1)
    compliance_history: float  = Field(..., ge=0, le=1)

class ScoreResult(BaseModel):
    score: float
    breakdown: dict
    priority_band: str          # High / Medium / Low
