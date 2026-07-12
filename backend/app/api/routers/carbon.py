"""
Carbon Emission Management Router — Phase 2
Endpoints:
  /api/carbon/categories  — CRUD for carbon emission categories
  /api/carbon/records     — CRUD for carbon emission records
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.api.routers.auth import get_current_user

# Carbon models live in the core models module (shared Base)
from app.models.models import CarbonCategory, CarbonRecord, Department, User
from app.schemas.environmental_schemas import (
    CarbonCategoryCreate,
    CarbonCategoryUpdate,
    CarbonCategoryOut,
    CarbonRecordCreate,
    CarbonRecordUpdate,
    CarbonRecordOut,
)

router = APIRouter(prefix="/api/carbon", tags=["carbon"])

# ---------------------------------------------------------------------------
# Helper: role guard
# ---------------------------------------------------------------------------

def _require_esg_or_admin(user: User) -> None:
    """Raise 403 if the user is not an ESG Manager or Super Admin."""
    if user.role not in ("Super Admin", "ESG Manager"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Super Admins and ESG Managers can perform this action.",
        )


# ---------------------------------------------------------------------------
# Carbon Category Endpoints
# ---------------------------------------------------------------------------

@router.get("/categories", response_model=List[CarbonCategoryOut])
def list_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all carbon emission categories (paginated)."""
    return db.query(CarbonCategory).offset(skip).limit(limit).all()


@router.get("/categories/{category_id}", response_model=CarbonCategoryOut)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single carbon emission category by ID."""
    category = db.query(CarbonCategory).filter(CarbonCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon category not found")
    return category


@router.post("/categories", response_model=CarbonCategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: CarbonCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new carbon emission category. Restricted to ESG Manager / Super Admin."""
    _require_esg_or_admin(current_user)

    # Prevent duplicate category names
    existing = db.query(CarbonCategory).filter(CarbonCategory.name == category_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A carbon category named '{category_in.name}' already exists.",
        )

    category = CarbonCategory(**category_in.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/categories/{category_id}", response_model=CarbonCategoryOut)
def update_category(
    category_id: int,
    category_in: CarbonCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing carbon emission category. Restricted to ESG Manager / Super Admin."""
    _require_esg_or_admin(current_user)

    category = db.query(CarbonCategory).filter(CarbonCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon category not found")

    for field, value in category_in.model_dump(exclude_unset=True).items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a carbon emission category. Restricted to ESG Manager / Super Admin."""
    _require_esg_or_admin(current_user)

    category = db.query(CarbonCategory).filter(CarbonCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon category not found")

    db.delete(category)
    db.commit()


# ---------------------------------------------------------------------------
# Carbon Record Endpoints
# ---------------------------------------------------------------------------

@router.get("/records", response_model=List[CarbonRecordOut])
def list_records(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all carbon emission records (paginated)."""
    return db.query(CarbonRecord).order_by(CarbonRecord.date.desc()).offset(skip).limit(limit).all()


@router.get("/records/{record_id}", response_model=CarbonRecordOut)
def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single carbon emission record by ID."""
    record = db.query(CarbonRecord).filter(CarbonRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon record not found")
    return record


@router.post("/records", response_model=CarbonRecordOut, status_code=status.HTTP_201_CREATED)
def create_record(
    record_in: CarbonRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new carbon emission record.
    CO₂ emitted is automatically calculated: quantity × category.emission_factor.
    """
    # Validate category exists
    category = db.query(CarbonCategory).filter(CarbonCategory.id == record_in.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Referenced carbon category not found.",
        )

    # Validate department if provided
    if record_in.department_id:
        dept = db.query(Department).filter(Department.id == record_in.department_id).first()
        if not dept:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referenced department not found.",
            )

    # Validate employee if provided
    if record_in.employee_id:
        emp = db.query(User).filter(User.id == record_in.employee_id).first()
        if not emp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referenced employee not found.",
            )

    # Automatically compute CO₂ emissions
    co2_emitted = round(record_in.quantity * category.emission_factor, 6)

    record = CarbonRecord(
        department_id=record_in.department_id,
        employee_id=record_in.employee_id,
        category_id=record_in.category_id,
        quantity=record_in.quantity,
        co2_emitted=co2_emitted,
        notes=record_in.notes,
        status="Pending",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/records/{record_id}", response_model=CarbonRecordOut)
def update_record(
    record_id: int,
    record_in: CarbonRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a carbon emission record.
    If quantity or category changes, CO₂ is recomputed automatically.
    Status changes to Approved / Rejected are restricted to ESG Manager / Super Admin.
    """
    record = db.query(CarbonRecord).filter(CarbonRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon record not found")

    # Restrict status approval to managers/admins
    if record_in.status in ("Approved", "Rejected"):
        _require_esg_or_admin(current_user)

    update_data = record_in.model_dump(exclude_unset=True)

    # Apply field updates
    for field, value in update_data.items():
        setattr(record, field, value)

    # Recompute CO₂ if quantity or category changed
    if "quantity" in update_data or "category_id" in update_data:
        category = db.query(CarbonCategory).filter(CarbonCategory.id == record.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referenced carbon category not found.",
            )
        record.co2_emitted = round(record.quantity * category.emission_factor, 6)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a carbon emission record. Restricted to ESG Manager / Super Admin."""
    _require_esg_or_admin(current_user)

    record = db.query(CarbonRecord).filter(CarbonRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon record not found")

    db.delete(record)
    db.commit()
