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


# ── Environment Schemas ───────────────────────────────────────────────

class EnvironmentMetricBase(BaseModel):
    category: str = Field(..., description="carbon, energy, water, waste")
    metric_name: str = Field(..., min_length=2, max_length=200)
    value: int = Field(0, ge=0)
    unit: str = Field(..., min_length=1, max_length=50)
    period: str = Field(..., min_length=2, max_length=20)
    department_id: Optional[int] = None
    notes: Optional[str] = None

class EnvironmentMetricCreate(EnvironmentMetricBase):
    pass

class EnvironmentMetricOut(EnvironmentMetricBase):
    id: int
    recorded_by_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Social Schemas ────────────────────────────────────────────────────

class SocialInitiativeBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    category: str = Field(..., description="DEI, Community, Wellbeing, Training")
    status: str = Field("Planned", description="Planned, Active, Completed")
    target_participants: int = 0
    actual_participants: int = 0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class SocialInitiativeCreate(SocialInitiativeBase):
    pass

class SocialInitiativeOut(SocialInitiativeBase):
    id: int
    created_by_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Gamification Schemas ──────────────────────────────────────────────

class ChallengeBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    xp_reward: int = Field(50, ge=1)
    category: str = "general"
    difficulty: str = "Easy"

class ChallengeCreate(ChallengeBase):
    pass

class ChallengeOut(ChallengeBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserChallengeOut(BaseModel):
    id: int
    user_id: int
    challenge_id: int
    status: str
    completed_at: Optional[datetime] = None
    created_at: datetime
    challenge: Optional[ChallengeOut] = None

    class Config:
        from_attributes = True

class BadgeOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    icon: str
    rule_metric: str
    rule_value: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserBadgeOut(BaseModel):
    id: int
    user_id: int
    badge_id: int
    unlocked_at: datetime
    badge: Optional[BadgeOut] = None

    class Config:
        from_attributes = True


# ── Rewards Schemas ───────────────────────────────────────────────────

class RewardBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    cost_points: int = Field(..., ge=1)
    stock: int = Field(10, ge=0)
    image_url: Optional[str] = None

class RewardCreate(RewardBase):
    pass

class RewardOut(RewardBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class RedemptionOut(BaseModel):
    id: int
    user_id: int
    reward_id: int
    points_spent: int
    redeemed_at: datetime

    class Config:
        from_attributes = True


# ── Notification Schemas ──────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationSettingsOut(BaseModel):
    id: int
    user_id: int
    email_enabled: bool
    in_app_enabled: bool
    notify_compliance: bool
    notify_approvals: bool
    notify_policies: bool
    notify_badges: bool

    class Config:
        from_attributes = True

class NotificationSettingsUpdate(BaseModel):
    email_enabled: Optional[bool] = None
    in_app_enabled: Optional[bool] = None
    notify_compliance: Optional[bool] = None
    notify_approvals: Optional[bool] = None
    notify_policies: Optional[bool] = None
    notify_badges: Optional[bool] = None


# ── System Settings Schemas ───────────────────────────────────────────

class SystemSettingsOut(BaseModel):
    id: int
    organization_id: int
    auto_emission_calculation: bool
    csr_evidence_requirement: bool
    badge_auto_award: bool

    class Config:
        from_attributes = True

class SystemSettingsUpdate(BaseModel):
    auto_emission_calculation: Optional[bool] = None
    csr_evidence_requirement: Optional[bool] = None
    badge_auto_award: Optional[bool] = None


# ── AI Advisor Schemas ────────────────────────────────────────────────

class AIPrompt(BaseModel):
    prompt: str = Field(..., min_length=5, max_length=2000)

class AIResponse(BaseModel):
    prompt: str
    response: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Report Schemas ────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    report_type: str = Field(..., description="environmental, social, governance, comprehensive")
    format: str = Field("pdf", description="pdf, csv")

class ReportOut(BaseModel):
    id: int
    title: str
    report_type: str
    format: str
    generated_by_id: Optional[int] = None
    file_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Dashboard Schemas ─────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_carbon: int = 0
    total_energy: int = 0
    total_water: int = 0
    total_waste: int = 0
    active_initiatives: int = 0
    total_policies: int = 0
    open_issues: int = 0
    active_challenges: int = 0
    total_users: int = 0


