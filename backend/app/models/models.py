from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    departments = relationship("Department", back_populates="organization", cascade="all, delete-orphan")
    users = relationship("User", back_populates="organization")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    organization = relationship("Organization", back_populates="departments")
    users = relationship("User", back_populates="department")

    __table_args__ = (
        UniqueConstraint("name", "organization_id", name="uq_department_name_org"),
    )

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="Employee", nullable=False)  # Super Admin, ESG Manager, Department Manager, Employee
    is_active = Column(Boolean, default=True, nullable=False)
    xp = Column(Integer, default=0, nullable=False)
    
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    organization = relationship("Organization", back_populates="users")
    department = relationship("Department", back_populates="users")
    
    acknowledgements = relationship("PolicyAcknowledgement", back_populates="user", cascade="all, delete-orphan")
    reported_issues = relationship("ComplianceIssue", foreign_keys="[ComplianceIssue.reported_by_id]", back_populates="reported_by")
    assigned_issues = relationship("ComplianceIssue", foreign_keys="[ComplianceIssue.assigned_to_id]", back_populates="assigned_to")

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    content = Column(String, nullable=False)
    version = Column(String, default="1.0", nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])
    acknowledgements = relationship("PolicyAcknowledgement", back_populates="policy", cascade="all, delete-orphan")
    compliance_issues = relationship("ComplianceIssue", back_populates="policy")

class PolicyAcknowledgement(Base):
    __tablename__ = "policy_acknowledgements"

    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey("policies.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    policy = relationship("Policy", back_populates="acknowledgements")
    user = relationship("User", back_populates="acknowledgements")

    __table_args__ = (
        UniqueConstraint("policy_id", "user_id", name="uq_policy_user_acknowledgement"),
    )

class Audit(Base):
    __tablename__ = "audits"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="Scheduled", nullable=False)  # Scheduled, In Progress, Completed, Cancelled
    auditor_name = Column(String, nullable=False)
    scope = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ComplianceIssue(Base):
    __tablename__ = "compliance_issues"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=False)
    severity = Column(String, default="Medium", nullable=False)  # Low, Medium, High, Critical
    status = Column(String, default="Open", nullable=False)  # Open, Under Review, Resolved, Closed
    
    policy_id = Column(Integer, ForeignKey("policies.id", ondelete="SET NULL"), nullable=True)
    reported_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    policy = relationship("Policy", back_populates="compliance_issues")
    reported_by = relationship("User", foreign_keys=[reported_by_id], back_populates="reported_issues")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_issues")

class Risk(Base):
    __tablename__ = "risks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    likelihood = Column(Integer, default=1, nullable=False)  # 1 to 5
    impact = Column(Integer, default=1, nullable=False)  # 1 to 5
    mitigation_strategy = Column(String, nullable=True)
    status = Column(String, default="Identified", nullable=False)  # Identified, Mitigated, Monitoring
    
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    department = relationship("Department")


# ── Environmental Module ──────────────────────────────────────────────

class EnvironmentMetric(Base):
    __tablename__ = "environment_metrics"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)          # carbon, energy, water, waste
    metric_name = Column(String, nullable=False)        # e.g. "Scope 1 Emissions"
    value = Column(Integer, default=0, nullable=False)
    unit = Column(String, nullable=False)               # tCO2e, kWh, m³, kg
    period = Column(String, nullable=False)             # e.g. "2025-Q1"
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    recorded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    department = relationship("Department")
    recorded_by = relationship("User", foreign_keys=[recorded_by_id])


# ── Social Module ─────────────────────────────────────────────────────

class SocialInitiative(Base):
    __tablename__ = "social_initiatives"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=False)           # DEI, Community, Wellbeing, Training
    status = Column(String, default="Planned", nullable=False)  # Planned, Active, Completed
    target_participants = Column(Integer, default=0)
    actual_participants = Column(Integer, default=0)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    created_by = relationship("User", foreign_keys=[created_by_id])


# ── Gamification Module ───────────────────────────────────────────────

class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    xp_reward = Column(Integer, default=50, nullable=False)
    category = Column(String, default="general", nullable=False)  # environment, social, governance, general
    difficulty = Column(String, default="Easy", nullable=False)    # Easy, Medium, Hard
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserChallenge(Base):
    __tablename__ = "user_challenges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    challenge_id = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="In Progress", nullable=False)  # In Progress, Completed
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    challenge = relationship("Challenge")

    __table_args__ = (
        UniqueConstraint("user_id", "challenge_id", name="uq_user_challenge"),
    )


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    icon = Column(String, default="🏅", nullable=False)
    rule_metric = Column(String, nullable=False)        # xp, challenges_completed
    rule_value = Column(Integer, nullable=False)         # threshold, e.g. 500 xp
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id", ondelete="CASCADE"), nullable=False)
    unlocked_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    badge = relationship("Badge")

    __table_args__ = (
        UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )


# ── Rewards Module ────────────────────────────────────────────────────

class Reward(Base):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    cost_points = Column(Integer, nullable=False)
    stock = Column(Integer, default=10, nullable=False)
    image_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Redemption(Base):
    __tablename__ = "redemptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reward_id = Column(Integer, ForeignKey("rewards.id", ondelete="CASCADE"), nullable=False)
    points_spent = Column(Integer, nullable=False)
    redeemed_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    reward = relationship("Reward")


# ── Notifications Module ──────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, default="info", nullable=False)  # compliance, approval, policy, badge, info
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")


class NotificationSettings(Base):
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    email_enabled = Column(Boolean, default=True)
    in_app_enabled = Column(Boolean, default=True)
    notify_compliance = Column(Boolean, default=True)
    notify_approvals = Column(Boolean, default=True)
    notify_policies = Column(Boolean, default=True)
    notify_badges = Column(Boolean, default=True)

    user = relationship("User")


# ── System Settings ───────────────────────────────────────────────────

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), unique=True, nullable=False)
    auto_emission_calculation = Column(Boolean, default=True)
    csr_evidence_requirement = Column(Boolean, default=False)
    badge_auto_award = Column(Boolean, default=True)

    organization = relationship("Organization")


# ── AI Advisor Logs ───────────────────────────────────────────────────

class AILog(Base):
    __tablename__ = "ai_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    prompt = Column(String, nullable=False)
    response = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")


# ── Reports ───────────────────────────────────────────────────────────

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    report_type = Column(String, nullable=False)        # environmental, social, governance, comprehensive
    format = Column(String, default="pdf", nullable=False)  # pdf, csv
    generated_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    generated_by = relationship("User", foreign_keys=[generated_by_id])

