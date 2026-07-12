"""
Environmental Management Pydantic Schemas — Phase 2
Covers: Carbon Emission Management & Water Consumption Management
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime


# ---------------------------------------------------------------------------
# Carbon Emission Management Schemas
# ---------------------------------------------------------------------------

class CarbonCategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Unique category name, e.g. Electricity")
    unit: str = Field(..., min_length=1, max_length=30, description="Unit of activity, e.g. kWh, km, litres")
    emission_factor: float = Field(..., gt=0, description="kg CO₂ emitted per unit of activity")
    description: Optional[str] = Field(None, max_length=500)
    active: bool = True


class CarbonCategoryCreate(CarbonCategoryBase):
    pass


class CarbonCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    unit: Optional[str] = Field(None, min_length=1, max_length=30)
    emission_factor: Optional[float] = Field(None, gt=0)
    description: Optional[str] = Field(None, max_length=500)
    active: Optional[bool] = None


class CarbonCategoryOut(CarbonCategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---

class CarbonRecordBase(BaseModel):
    department_id: Optional[int] = Field(None, description="Linked department (optional)")
    employee_id: Optional[int] = Field(None, description="Linked employee / submitter (optional)")
    category_id: int = Field(..., description="Carbon category ID (required)")
    quantity: float = Field(..., gt=0, description="Activity quantity, e.g. 100 kWh")
    notes: Optional[str] = Field(None, max_length=1000)


class CarbonRecordCreate(CarbonRecordBase):
    pass


class CarbonRecordUpdate(BaseModel):
    department_id: Optional[int] = None
    employee_id: Optional[int] = None
    category_id: Optional[int] = None
    quantity: Optional[float] = Field(None, gt=0)
    notes: Optional[str] = Field(None, max_length=1000)
    status: Optional[Literal["Pending", "Approved", "Rejected"]] = None


class CarbonRecordOut(CarbonRecordBase):
    id: int
    co2_emitted: float = Field(..., description="Computed: quantity × emission_factor (kg CO₂)")
    status: str
    date: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Water Consumption Management Schemas
# ---------------------------------------------------------------------------

class WaterCategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Unique water category name, e.g. Municipal")
    unit: str = Field(..., min_length=1, max_length=30, description="Unit of measurement, e.g. litres, m³, gallons")
    description: Optional[str] = Field(None, max_length=500)
    active: bool = True


class WaterCategoryCreate(WaterCategoryBase):
    pass


class WaterCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    unit: Optional[str] = Field(None, min_length=1, max_length=30)
    description: Optional[str] = Field(None, max_length=500)
    active: Optional[bool] = None


class WaterCategoryOut(WaterCategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---

class WaterRecordBase(BaseModel):
    department_id: Optional[int] = Field(None, description="Linked department (optional)")
    employee_id: Optional[int] = Field(None, description="Linked employee / submitter (optional)")
    category_id: int = Field(..., description="Water category ID (required)")
    consumption: float = Field(..., gt=0, description="Water consumed, e.g. 500 litres")
    notes: Optional[str] = Field(None, max_length=1000)


class WaterRecordCreate(WaterRecordBase):
    pass


class WaterRecordUpdate(BaseModel):
    department_id: Optional[int] = None
    employee_id: Optional[int] = None
    category_id: Optional[int] = None
    consumption: Optional[float] = Field(None, gt=0)
    notes: Optional[str] = Field(None, max_length=1000)
    status: Optional[Literal["Pending", "Approved", "Rejected"]] = None


class WaterRecordOut(WaterRecordBase):
    id: int
    status: str
    date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Waste Management Schemas
# ---------------------------------------------------------------------------

class WasteCategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Unique waste category name, e.g. Plastic")
    unit: str = Field(..., min_length=1, max_length=30, description="Unit of measurement, e.g. kg, tonnes")
    description: Optional[str] = Field(None, max_length=500)
    active: bool = True


class WasteCategoryCreate(WasteCategoryBase):
    pass


class WasteCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    unit: Optional[str] = Field(None, min_length=1, max_length=30)
    description: Optional[str] = Field(None, max_length=500)
    active: Optional[bool] = None


class WasteCategoryOut(WasteCategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---

class WasteRecordBase(BaseModel):
    department_id: Optional[int] = Field(None, description="Linked department (optional)")
    employee_id: Optional[int] = Field(None, description="Linked employee / submitter (optional)")
    category_id: int = Field(..., description="Waste category ID (required)")
    waste_generated: float = Field(..., gt=0, description="Total waste produced (e.g., 200 kg)")
    waste_recycled: float = Field(..., ge=0, description="Waste sent for recycling (e.g., 150 kg)")
    notes: Optional[str] = Field(None, max_length=1000)

    @field_validator("waste_recycled")
    @classmethod
    def recycled_cannot_exceed_generated(cls, recycled: float, info) -> float:
        """Ensure waste_recycled is not greater than waste_generated."""
        generated = info.data.get("waste_generated")
        if generated is not None and recycled > generated:
            raise ValueError(
                f"waste_recycled ({recycled}) cannot exceed waste_generated ({generated})."
            )
        return recycled


class WasteRecordCreate(WasteRecordBase):
    pass


class WasteRecordUpdate(BaseModel):
    department_id: Optional[int] = None
    employee_id: Optional[int] = None
    category_id: Optional[int] = None
    waste_generated: Optional[float] = Field(None, gt=0)
    waste_recycled: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=1000)
    status: Optional[Literal["Pending", "Approved", "Rejected"]] = None

    @field_validator("waste_recycled")
    @classmethod
    def recycled_cannot_exceed_generated(cls, recycled: Optional[float], info) -> Optional[float]:
        """On partial updates, validate only when both values are provided."""
        if recycled is None:
            return recycled
        generated = info.data.get("waste_generated")
        if generated is not None and recycled > generated:
            raise ValueError(
                f"waste_recycled ({recycled}) cannot exceed waste_generated ({generated})."
            )
        return recycled


class WasteRecordOut(WasteRecordBase):
    id: int
    recycling_percentage: float = Field(..., description="Computed: (waste_recycled / waste_generated) × 100")
    status: str
    date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Sustainability Goals Schemas
# ---------------------------------------------------------------------------

# Valid status values for a sustainability goal
GOAL_STATUSES = Literal["Not Started", "In Progress", "Achieved", "Overdue", "Cancelled"]


class SustainabilityGoalBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200, description="Goal title")
    description: Optional[str] = Field(None, max_length=1000)
    unit: Optional[str] = Field(None, max_length=50, description="Unit of measurement, e.g. tonnes CO₂, kWh")
    target_value: float = Field(..., gt=0, description="The target value to achieve")
    current_value: float = Field(0.0, ge=0, description="Current progress value")
    deadline: datetime = Field(..., description="ISO-8601 datetime by which the goal must be met")


class SustainabilityGoalCreate(SustainabilityGoalBase):
    @field_validator("deadline")
    @classmethod
    def deadline_must_be_future(cls, v: datetime) -> datetime:
        """Deadline must be set in the future."""
        from datetime import timezone
        now = datetime.now(timezone.utc)
        # Make deadline timezone-aware if naive
        if v.tzinfo is None:
            from datetime import timezone
            v = v.replace(tzinfo=timezone.utc)
        if v <= now:
            raise ValueError("deadline must be a future date and time.")
        return v

    @field_validator("current_value")
    @classmethod
    def current_cannot_exceed_target(cls, current: float, info) -> float:
        """current_value should not exceed target_value at creation."""
        target = info.data.get("target_value")
        if target is not None and current > target:
            raise ValueError(
                f"current_value ({current}) cannot exceed target_value ({target})."
            )
        return current


class SustainabilityGoalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    unit: Optional[str] = Field(None, max_length=50)
    target_value: Optional[float] = Field(None, gt=0)
    current_value: Optional[float] = Field(None, ge=0)
    deadline: Optional[datetime] = None
    # On update the caller may explicitly set status to Cancelled
    status: Optional[GOAL_STATUSES] = None  # type: ignore[valid-type]

    @field_validator("current_value")
    @classmethod
    def current_cannot_exceed_target(cls, current: Optional[float], info) -> Optional[float]:
        """Validate cross-field only when both are present in the same request."""
        if current is None:
            return current
        target = info.data.get("target_value")
        if target is not None and current > target:
            raise ValueError(
                f"current_value ({current}) cannot exceed target_value ({target})."
            )
        return current


class SustainabilityGoalOut(SustainabilityGoalBase):
    id: int
    progress_percentage: float = Field(
        ..., description="Computed: (current_value / target_value) × 100, capped at 100"
    )
    status: str
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

