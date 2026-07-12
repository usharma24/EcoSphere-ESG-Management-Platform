from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# Organization Schemas
class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationOut(OrganizationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Department Schemas
class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)

class DepartmentCreate(DepartmentBase):
    organization_id: int

class DepartmentOut(DepartmentBase):
    id: int
    organization_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    role: str = Field("Employee", description="Super Admin, ESG Manager, Department Manager, Employee")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    organization_name: Optional[str] = None  # To allow creating/joining an organization during sign-up
    department_name: Optional[str] = None    # To allow creating/joining a department during sign-up

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    organization_id: Optional[int] = None
    department_id: Optional[int] = None

class UserOut(UserBase):
    id: int
    xp: int
    is_active: bool
    organization_id: Optional[int] = None
    department_id: Optional[int] = None
    organization: Optional[OrganizationOut] = None
    department: Optional[DepartmentOut] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None

class TokenRefreshRequest(BaseModel):
    refresh_token: str

# Policy Schemas
class PolicyBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    content: str = Field(..., min_length=10)
    version: str = Field("1.0", max_length=20)

class PolicyCreate(PolicyBase):
    pass

class PolicyOut(PolicyBase):
    id: int
    created_by_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class PolicyAcknowledgementOut(BaseModel):
    id: int
    policy_id: int
    user_id: int
    acknowledged_at: datetime

    class Config:
        from_attributes = True

class PolicyUserOut(BaseModel):
    policy: PolicyOut
    acknowledged: bool
    acknowledged_at: Optional[datetime] = None

# Audit Schemas
class AuditBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    scheduled_date: datetime
    auditor_name: str = Field(..., min_length=2, max_length=100)
    scope: Optional[str] = None

class AuditCreate(AuditBase):
    pass

class AuditOut(AuditBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Compliance Issue Schemas
class ComplianceIssueBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=5)
    severity: str = Field("Medium", description="Low, Medium, High, Critical")

class ComplianceIssueCreate(ComplianceIssueBase):
    policy_id: Optional[int] = None

class ComplianceIssueUpdate(BaseModel):
    severity: Optional[str] = None
    status: Optional[str] = None
    assigned_to_id: Optional[int] = None

class ComplianceIssueOut(ComplianceIssueBase):
    id: int
    status: str
    policy_id: Optional[int] = None
    reported_by_id: int
    assigned_to_id: Optional[int] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    
    # We can fetch detailed representations if needed, but let's keep them optional/nullable
    reported_by_name: Optional[str] = None
    assigned_to_name: Optional[str] = None

    class Config:
        from_attributes = True

# Risk Register Schemas
class RiskBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    likelihood: int = Field(1, ge=1, le=5)
    impact: int = Field(1, ge=1, le=5)
    mitigation_strategy: Optional[str] = None
    department_id: Optional[int] = None

class RiskCreate(RiskBase):
    pass

class RiskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    likelihood: Optional[int] = Field(None, ge=1, le=5)
    impact: Optional[int] = Field(None, ge=1, le=5)
    mitigation_strategy: Optional[str] = None
    status: Optional[str] = None
    department_id: Optional[int] = None

class RiskOut(RiskBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Carbon Emission Management Schemas
# ---------------------------------------------------------------------------

class CarbonCategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    unit: str = Field(..., min_length=1)
    emission_factor: float = Field(..., gt=0, description="kg CO2 per unit")
    description: Optional[str] = None
    active: bool = True

class CarbonCategoryCreate(CarbonCategoryBase):
    pass

class CarbonCategoryUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    emission_factor: Optional[float] = None
    description: Optional[str] = None
    active: Optional[bool] = None

class CarbonCategoryOut(CarbonCategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CarbonRecordBase(BaseModel):
    department_id: Optional[int] = None
    employee_id: Optional[int] = None
    category_id: int
    quantity: float = Field(..., gt=0)
    notes: Optional[str] = None
    status: str = Field(default="Pending")

class CarbonRecordCreate(CarbonRecordBase):
    pass

class CarbonRecordUpdate(BaseModel):
    department_id: Optional[int] = None
    employee_id: Optional[int] = None
    category_id: Optional[int] = None
    quantity: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class CarbonRecordOut(CarbonRecordBase):
    id: int
    co2_emitted: float
    date: datetime

    class Config:
        from_attributes = True
