"""
Water Consumption Management Router — Phase 2
Endpoints:
  /api/water/categories  — CRUD for water categories
  /api/water/records     — CRUD for water consumption records
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.api.routers.auth import get_current_user

# Water models live in the environmental models module
from app.models.environmental_models import WaterCategory, WaterRecord
from app.models.models import Department, User
from app.schemas.environmental_schemas import (
    WaterCategoryCreate,
    WaterCategoryUpdate,
    WaterCategoryOut,
    WaterRecordCreate,
    WaterRecordUpdate,
    WaterRecordOut,
)

router = APIRouter(prefix="/api/water", tags=["water"])

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
# Water Category Endpoints
# ---------------------------------------------------------------------------

@router.get("/categories", response_model=List[WaterCategoryOut])
def list_water_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all water categories (paginated)."""
    return db.query(WaterCategory).offset(skip).limit(limit).all()


@router.get("/categories/{category_id}", response_model=WaterCategoryOut)
def get_water_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single water category by ID."""
    category = db.query(WaterCategory).filter(WaterCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Water category not found")
    return category


@router.post("/categories", response_model=WaterCategoryOut, status_code=status.HTTP_201_CREATED)
def create_water_category(
    category_in: WaterCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new water category. Restricted to ESG Manager / Super Admin."""
    _require_esg_or_admin(current_user)

    # Prevent duplicate category names
    existing = db.query(WaterCategory).filter(WaterCategory.name == category_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A water category named '{category_in.name}' already exists.",
        )

    category = WaterCategory(**category_in.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/categories/{category_id}", response_model=WaterCategoryOut)
def update_water_category(
    category_id: int,
    category_in: WaterCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing water category. Restricted to ESG Manager / Super Admin."""
    _require_esg_or_admin(current_user)

    category = db.query(WaterCategory).filter(WaterCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Water category not found")

    for field, value in category_in.model_dump(exclude_unset=True).items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_water_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a water category. Restricted to ESG Manager / Super Admin."""
    _require_esg_or_admin(current_user)

    category = db.query(WaterCategory).filter(WaterCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Water category not found")

    db.delete(category)
    db.commit()


# ---------------------------------------------------------------------------
# Water Record Endpoints
# ---------------------------------------------------------------------------

@router.get("/records", response_model=List[WaterRecordOut])
def list_water_records(
    skip: int = 0,
    limit: int = 100,
    department_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all water consumption records (paginated).
    Optionally filter by department_id.
    """
    query = db.query(WaterRecord).order_by(WaterRecord.date.desc())
    if department_id:
        query = query.filter(WaterRecord.department_id == department_id)
    return query.offset(skip).limit(limit).all()


@router.get("/records/{record_id}", response_model=WaterRecordOut)
def get_water_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single water consumption record by ID."""
    record = db.query(WaterRecord).filter(WaterRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Water record not found")
    return record


@router.post("/records", response_model=WaterRecordOut, status_code=status.HTTP_201_CREATED)
def create_water_record(
    record_in: WaterRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new water consumption record.
    Any authenticated user can submit a record; approval is managed via status updates.
    """
    # Validate category exists and is active
    category = db.query(WaterCategory).filter(WaterCategory.id == record_in.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Referenced water category not found.",
        )
    if not category.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Referenced water category is inactive. Please choose an active category.",
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

    record = WaterRecord(
        department_id=record_in.department_id,
        employee_id=record_in.employee_id,
        category_id=record_in.category_id,
        consumption=record_in.consumption,
        notes=record_in.notes,
        status="Pending",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/records/{record_id}", response_model=WaterRecordOut)
def update_water_record(
    record_id: int,
    record_in: WaterRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a water consumption record.
    Status changes to Approved / Rejected are restricted to ESG Manager / Super Admin.
    """
    record = db.query(WaterRecord).filter(WaterRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Water record not found")

    # Restrict status approval to managers/admins
    if record_in.status in ("Approved", "Rejected"):
        _require_esg_or_admin(current_user)

    # If category_id is being updated, validate it exists and is active
    update_data = record_in.model_dump(exclude_unset=True)
    if "category_id" in update_data:
        category = db.query(WaterCategory).filter(WaterCategory.id == update_data["category_id"]).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referenced water category not found.",
            )
        if not category.active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referenced water category is inactive.",
            )

    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_water_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a water consumption record. Restricted to ESG Manager / Super Admin."""
    _require_esg_or_admin(current_user)

    record = db.query(WaterRecord).filter(WaterRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Water record not found")

    db.delete(record)
    db.commit()
