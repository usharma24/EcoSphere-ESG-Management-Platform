"""
Environmental Management Models — Phase 2
Covers: Water Consumption Management, Waste Management & Sustainability Goals

Note: CarbonCategory and CarbonRecord are defined in models.py (Phase 1 core)
      to avoid duplicate table registration with SQLAlchemy Base.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.session import Base


# ---------------------------------------------------------------------------
# Water Consumption Management Models
# ---------------------------------------------------------------------------

class WaterCategory(Base):
    """Lookup table for water source / usage types (e.g., Municipal, Rainwater, Industrial)."""
    __tablename__ = "water_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    unit = Column(String, nullable=False)          # e.g., litres, gallons, m³
    description = Column(String, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    records = relationship("WaterRecord", back_populates="category", cascade="all, delete-orphan")


class WaterRecord(Base):
    """Tracks water consumption per department / employee per entry."""
    __tablename__ = "water_records"

    id = Column(Integer, primary_key=True, index=True)
    # Optional FK to department — allows org-wide entries
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    # Optional FK to user (employee who submitted)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    # FK to water category (required)
    category_id = Column(Integer, ForeignKey("water_categories.id", ondelete="RESTRICT"), nullable=False)

    consumption = Column(Float, nullable=False)    # Quantity consumed (e.g., 500 litres)
    notes = Column(String, nullable=True)
    status = Column(String, default="Pending", nullable=False)  # Pending | Approved | Rejected
    date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships (back-references are declared on Department and User in models.py)
    department = relationship("Department", back_populates="water_records")
    employee = relationship("User", back_populates="water_records")
    category = relationship("WaterCategory", back_populates="records")

    __table_args__ = (
        CheckConstraint("consumption > 0", name="ck_water_consumption_positive"),
    )


# ---------------------------------------------------------------------------
# Waste Management Models
# ---------------------------------------------------------------------------

class WasteCategory(Base):
    """Lookup table for waste stream types (e.g., Plastic, Paper, E-Waste, Organic)."""
    __tablename__ = "waste_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    unit = Column(String, nullable=False)          # e.g., kg, tonnes, litres
    description = Column(String, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    records = relationship("WasteRecord", back_populates="category", cascade="all, delete-orphan")


class WasteRecord(Base):
    """
    Tracks waste generated and recycled per department / employee per entry.
    recycling_percentage is stored as a Float and recomputed at the API layer
    whenever waste_generated or waste_recycled changes.
    """
    __tablename__ = "waste_records"

    id = Column(Integer, primary_key=True, index=True)
    # Optional FK to department — allows org-wide entries
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    # Optional FK to user (employee who submitted)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    # FK to waste category (required)
    category_id = Column(Integer, ForeignKey("waste_categories.id", ondelete="RESTRICT"), nullable=False)

    waste_generated = Column(Float, nullable=False)    # Total waste produced (e.g., 200 kg)
    waste_recycled = Column(Float, nullable=False, default=0.0)  # Amount recycled (e.g., 150 kg)
    recycling_percentage = Column(Float, nullable=False, default=0.0)  # Computed: recycled/generated*100

    notes = Column(String, nullable=True)
    status = Column(String, default="Pending", nullable=False)  # Pending | Approved | Rejected
    date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships (back-references declared on Department and User in models.py)
    department = relationship("Department", back_populates="waste_records")
    employee = relationship("User", back_populates="waste_records")
    category = relationship("WasteCategory", back_populates="records")

    __table_args__ = (
        # waste_generated must be > 0
        CheckConstraint("waste_generated > 0", name="ck_waste_generated_positive"),
        # waste_recycled must be >= 0
        CheckConstraint("waste_recycled >= 0", name="ck_waste_recycled_non_negative"),
        # Cannot recycle more than what was generated
        CheckConstraint("waste_recycled <= waste_generated", name="ck_waste_recycled_lte_generated"),
        # Percentage must be in [0, 100]
        CheckConstraint("recycling_percentage >= 0 AND recycling_percentage <= 100", name="ck_recycling_pct_range"),
    )


# ---------------------------------------------------------------------------
# Sustainability Goals Model
# ---------------------------------------------------------------------------

class SustainabilityGoal(Base):
    """
    Tracks an organisation-level sustainability goal.

    progress_percentage and status are recomputed at the API layer on every
    create / update so they stay consistent with current_value and deadline.
    Allowed status values: Not Started | In Progress | Achieved | Overdue | Cancelled
    """
    __tablename__ = "sustainability_goals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)                 # Goal title
    description = Column(String, nullable=True)                       # Optional longer description
    unit = Column(String, nullable=True)                              # e.g., tonnes CO₂, kWh, %

    target_value = Column(Float, nullable=False)                      # The value to reach
    current_value = Column(Float, nullable=False, default=0.0)        # Current progress
    progress_percentage = Column(Float, nullable=False, default=0.0)  # Computed: current/target × 100

    deadline = Column(DateTime(timezone=True), nullable=False)        # When the goal must be met
    status = Column(String, default="Not Started", nullable=False)    # Auto-derived or Cancelled

    # FK to the user who created the goal (optional — allows system-generated goals)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])

    __table_args__ = (
        # target_value must be positive
        CheckConstraint("target_value > 0", name="ck_goal_target_positive"),
        # current_value must be non-negative
        CheckConstraint("current_value >= 0", name="ck_goal_current_non_negative"),
        # progress_percentage must be in [0, 100]
        CheckConstraint(
            "progress_percentage >= 0 AND progress_percentage <= 100",
            name="ck_goal_progress_range",
        ),
    )
