"""
Waste Management Router — Phase 2
Endpoints:
  /api/waste/categories  — CRUD for waste stream categories
  /api/waste/records     — CRUD for waste generation / recycling records
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.session import get_db
from app.api.routers.auth import get_current_user

# Waste models live in the environmental models module
from app.models.environmental_models import WasteCategory, WasteRecord
from app.models.models import Department, User
from app.schemas.environmental_schemas import (
    WasteCategoryCreate,
    WasteCategoryUpdate,
    WasteCategoryOut,
    WasteRecordCreate,
    WasteRecordUpdate,
    WasteRecordOut,
)

router = APIRouter(prefix="/api/waste", tags=["waste"])


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _require_esg_or_admin(user: User) -> None:
    """Raise 403 if the user is not an ESG Manager or Super Admin."""
    if user.role not in ("Super Admin", "ESG Manager"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Super Admins and ESG Managers can perform this action.",
        )


def _compute_recycling_percentage(waste_generated: float, waste_recycled: float) -> float:
    """
    Compute recycling percentage with safe division.
    Returns a value in [0.0, 100.0] rounded to 4 decimal places.
    """
    if waste_generated <= 0:
        return 0.0
    return round((waste_recycled / waste_generated) * 100, 4)


# ---------------------------------------------------------------------------
# Waste Category Endpoints
# ---------------------------------------------------------------------------

@router.get("/categories", response_model=List[WasteCategoryOut])
def list_waste_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all waste categories (paginated)."""
    return db.query(WasteCategory).offset(skip).limit(limit).all()


@router.get("/categories/{category_id}", response_model=WasteCategoryOut)
def get_waste_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single waste category by ID."""
    category = db.query(WasteCategory).filter(WasteCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waste category not found")
    return category


@router.post("/categories", response_model=WasteCategoryOut, status_code=status.HTTP_201_CREATED)
def create_waste_category(
    category_in: WasteCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new waste category. Restricted to ESG Manager / Super Admin."""
    _require_esg_or_admin(current_user)

    # Prevent duplicate category names
    existing = db.query(WasteCategory).filter(WasteCategory.name == category_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A waste category named '{category_in.name}' already exists.",
        )

    category = WasteCategory(**category_in.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/categories/{category_id}", response_model=WasteCategoryOut)
def update_waste_category(
    category_id: int,
    category_in: WasteCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing waste category. Restricted to ESG Manager / Super Admin."""
    _require_esg_or_admin(current_user)

    category = db.query(WasteCategory).filter(WasteCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waste category not found")

    for field, value in category_in.model_dump(exclude_unset=True).items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_waste_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a waste category. Restricted to ESG Manager / Super Admin."""
    _require_esg_or_admin(current_user)

    category = db.query(WasteCategory).filter(WasteCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waste category not found")

    db.delete(category)
    db.commit()


# ---------------------------------------------------------------------------
# Waste Record Endpoints
# ---------------------------------------------------------------------------

@router.get("/records", response_model=List[WasteRecordOut])
def list_waste_records(
    skip: int = 0,
    limit: int = 100,
    department_id: Optional[int] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all waste records (paginated).
    Optionally filter by department_id or category_id.
    """
    query = db.query(WasteRecord).order_by(WasteRecord.date.desc())
    if department_id:
        query = query.filter(WasteRecord.department_id == department_id)
    if category_id:
        query = query.filter(WasteRecord.category_id == category_id)
    return query.offset(skip).limit(limit).all()


@router.get("/records/{record_id}", response_model=WasteRecordOut)
def get_waste_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single waste record by ID."""
    record = db.query(WasteRecord).filter(WasteRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waste record not found")
    return record


@router.post("/records", response_model=WasteRecordOut, status_code=status.HTTP_201_CREATED)
def create_waste_record(
    record_in: WasteRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new waste record.
    recycling_percentage is automatically calculated: (waste_recycled / waste_generated) × 100.
    Any authenticated user can submit; Approved / Rejected status requires ESG Manager / Admin.
    """
    # Validate category exists and is active
    category = db.query(WasteCategory).filter(WasteCategory.id == record_in.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Referenced waste category not found.",
        )
    if not category.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Referenced waste category is inactive. Please choose an active category.",
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

    # Automatically compute recycling percentage
    recycling_pct = _compute_recycling_percentage(record_in.waste_generated, record_in.waste_recycled)

    record = WasteRecord(
        department_id=record_in.department_id,
        employee_id=record_in.employee_id,
        category_id=record_in.category_id,
        waste_generated=record_in.waste_generated,
        waste_recycled=record_in.waste_recycled,
        recycling_percentage=recycling_pct,
        notes=record_in.notes,
        status="Pending",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/records/{record_id}", response_model=WasteRecordOut)
def update_waste_record(
    record_id: int,
    record_in: WasteRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a waste record.
    - recycling_percentage is recomputed automatically if waste_generated or waste_recycled changes.
    - If only one of the two quantities is updated, the existing stored value of the other is used.
    - Status changes to Approved / Rejected are restricted to ESG Manager / Super Admin.
    """
    record = db.query(WasteRecord).filter(WasteRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waste record not found")

    # Restrict status approval to managers/admins
    if record_in.status in ("Approved", "Rejected"):
        _require_esg_or_admin(current_user)

    update_data = record_in.model_dump(exclude_unset=True)

    # Validate category if being changed
    if "category_id" in update_data:
        category = db.query(WasteCategory).filter(WasteCategory.id == update_data["category_id"]).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referenced waste category not found.",
            )
        if not category.active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referenced waste category is inactive.",
            )

    # Apply field updates
    for field, value in update_data.items():
        setattr(record, field, value)

    # Cross-field validation after applying updates (handles partial edits)
    if record.waste_recycled > record.waste_generated:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"waste_recycled ({record.waste_recycled}) cannot exceed "
                f"waste_generated ({record.waste_generated}) after update."
            ),
        )

    # Recompute recycling_percentage whenever either quantity changes
    if "waste_generated" in update_data or "waste_recycled" in update_data:
        record.recycling_percentage = _compute_recycling_percentage(
            record.waste_generated, record.waste_recycled
        )

    db.commit()
    db.refresh(record)
    return record


@router.delete("/records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_waste_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a waste record. Restricted to ESG Manager / Super Admin."""
    _require_esg_or_admin(current_user)

    record = db.query(WasteRecord).filter(WasteRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waste record not found")

    db.delete(record)
    db.commit()
