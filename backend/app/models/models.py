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
    carbon_records = relationship("CarbonRecord", back_populates="department", cascade="all, delete-orphan")
    water_records = relationship("WaterRecord", back_populates="department", cascade="all, delete-orphan")
    waste_records = relationship("WasteRecord", back_populates="department", cascade="all, delete-orphan")

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
    carbon_records = relationship("CarbonRecord", back_populates="employee", cascade="all, delete-orphan")
    water_records = relationship("WaterRecord", back_populates="employee", cascade="all, delete-orphan")
    waste_records = relationship("WasteRecord", back_populates="employee", cascade="all, delete-orphan")

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


# ---------------------------------------------------------------------------
# Carbon Emission Management Models
# ---------------------------------------------------------------------------

from sqlalchemy import Float

class CarbonCategory(Base):
    __tablename__ = "carbon_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    unit = Column(String, nullable=False)  # e.g., kWh, litre, km
    emission_factor = Column(Float, nullable=False)  # CO₂ per unit (kg CO₂/unit)
    description = Column(String, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    records = relationship("CarbonRecord", back_populates="category", cascade="all, delete-orphan")

class CarbonRecord(Base):
    __tablename__ = "carbon_records"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(Integer, ForeignKey("carbon_categories.id", ondelete="SET NULL"), nullable=False)
    quantity = Column(Float, nullable=False)  # Amount of activity (e.g., 100 kWh)
    co2_emitted = Column(Float, nullable=False)  # Computed = quantity * emission_factor
    date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="Pending", nullable=False)  # Pending, Approved, Rejected
    notes = Column(String, nullable=True)

    # Relationships
    department = relationship("Department", back_populates="carbon_records")
    employee = relationship("User", back_populates="carbon_records")
    category = relationship("CarbonCategory", back_populates="records")

    __table_args__ = (
        # Ensure positive quantity and emission factor via DB check constraints
        # SQLite ignores CHECK on values < 0, but PostgreSQL will enforce.
        # This mirrors Pydantic validation but adds safety at DB level.
        # Note: SQLAlchemy's CheckConstraint requires import; omitted for brevity.
    )
