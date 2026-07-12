"""
Sustainability Goals Router — Phase 2
Endpoints:
  /api/goals  — CRUD for sustainability goals

Business logic:
  - progress_percentage  is auto-computed on every create / update
  - status               is auto-derived unless explicitly set to "Cancelled"
    Derivation rules (applied after values are saved):
      current_value >= target_value         → "Achieved"
      deadline < now AND not Achieved       → "Overdue"
      0 < current_value < target_value      → "In Progress"
      current_value == 0                    → "Not Started"
"""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.routers.auth import get_current_user
from app.models.environmental_models import SustainabilityGoal
from app.models.models import User
from app.schemas.environmental_schemas import (
    SustainabilityGoalCreate,
    SustainabilityGoalUpdate,
    SustainabilityGoalOut,
)

router = APIRouter(prefix="/api/goals", tags=["sustainability-goals"])


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


def _compute_progress(current_value: float, target_value: float) -> float:
    """
    Compute progress as a percentage capped at 100.
    Returns a value in [0.0, 100.0] rounded to 4 decimal places.
    """
    if target_value <= 0:
        return 0.0
    raw = (current_value / target_value) * 100
    return round(min(raw, 100.0), 4)


def _derive_status(
    current_value: float,
    target_value: float,
    deadline: datetime,
    existing_status: Optional[str] = None,
) -> str:
    """
    Automatically derive status from current values.
    If the goal was manually cancelled, preserve "Cancelled".
    """
    # Preserve a manual Cancelled status
    if existing_status == "Cancelled":
        return "Cancelled"

    now = datetime.now(timezone.utc)

    # Normalise deadline to tz-aware for comparison
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    if current_value >= target_value:
        return "Achieved"
    elif deadline < now:
        return "Overdue"
    elif current_value > 0:
        return "In Progress"
    else:
        return "Not Started"


# ---------------------------------------------------------------------------
# Sustainability Goal Endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[SustainabilityGoalOut])
def list_goals(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all sustainability goals (paginated).
    Optionally filter by status: Not Started | In Progress | Achieved | Overdue | Cancelled
    """
    query = db.query(SustainabilityGoal).order_by(SustainabilityGoal.deadline.asc())
    if status_filter:
        query = query.filter(SustainabilityGoal.status == status_filter)
    return query.offset(skip).limit(limit).all()


@router.get("/{goal_id}", response_model=SustainabilityGoalOut)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single sustainability goal by ID."""
    goal = db.query(SustainabilityGoal).filter(SustainabilityGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sustainability goal not found")
    return goal


@router.post("/", response_model=SustainabilityGoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_in: SustainabilityGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new sustainability goal.
    Restricted to ESG Manager / Super Admin.
    progress_percentage and status are computed automatically.
    """
    _require_esg_or_admin(current_user)

    # Compute derived fields
    progress_pct = _compute_progress(goal_in.current_value, goal_in.target_value)
    derived_status = _derive_status(
        goal_in.current_value,
        goal_in.target_value,
        goal_in.deadline,
        existing_status=None,
    )

    goal = SustainabilityGoal(
        name=goal_in.name,
        description=goal_in.description,
        unit=goal_in.unit,
        target_value=goal_in.target_value,
        current_value=goal_in.current_value,
        progress_percentage=progress_pct,
        deadline=goal_in.deadline,
        status=derived_status,
        created_by_id=current_user.id,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.put("/{goal_id}", response_model=SustainabilityGoalOut)
def update_goal(
    goal_id: int,
    goal_in: SustainabilityGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a sustainability goal.
    - progress_percentage is recomputed whenever current_value or target_value changes.
    - status is auto-derived from updated values unless explicitly set to 'Cancelled'.
    - Setting status to any value other than 'Cancelled' is ignored (it's always derived).
    Restricted to ESG Manager / Super Admin.
    """
    _require_esg_or_admin(current_user)

    goal = db.query(SustainabilityGoal).filter(SustainabilityGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sustainability goal not found")

    update_data = goal_in.model_dump(exclude_unset=True)

    # Separate explicit status from computed fields
    explicit_status = update_data.pop("status", None)

    # Apply all other field updates to the ORM object
    for field, value in update_data.items():
        setattr(goal, field, value)

    # Cross-field validation after applying updates (handles partial edits)
    if goal.current_value > goal.target_value:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"current_value ({goal.current_value}) cannot exceed "
                f"target_value ({goal.target_value}) after update."
            ),
        )

    # Recompute progress_percentage
    goal.progress_percentage = _compute_progress(goal.current_value, goal.target_value)

    # Derive status — preserve Cancelled if explicitly requested or already set
    if explicit_status == "Cancelled":
        goal.status = "Cancelled"
    else:
        # Re-derive from latest values (ignores any other explicit status; always stays consistent)
        goal.status = _derive_status(
            goal.current_value,
            goal.target_value,
            goal.deadline,
            existing_status=goal.status,  # preserves Cancelled if already set
        )

    db.commit()
    db.refresh(goal)
    return goal


@router.patch("/{goal_id}/cancel", response_model=SustainabilityGoalOut)
def cancel_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel a sustainability goal.
    Sets status to 'Cancelled' — this overrides automatic status derivation.
    Restricted to ESG Manager / Super Admin.
    """
    _require_esg_or_admin(current_user)

    goal = db.query(SustainabilityGoal).filter(SustainabilityGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sustainability goal not found")

    if goal.status == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Goal is already cancelled.",
        )

    goal.status = "Cancelled"
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a sustainability goal permanently. Restricted to Super Admin only."""
    if current_user.role != "Super Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can permanently delete sustainability goals.",
        )

    goal = db.query(SustainabilityGoal).filter(SustainabilityGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sustainability goal not found")

    db.delete(goal)
    db.commit()
