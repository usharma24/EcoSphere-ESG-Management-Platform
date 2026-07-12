from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import SystemSettings, User
from app.schemas.schemas import SystemSettingsOut, SystemSettingsUpdate
from app.api.routers.auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("/", response_model=SystemSettingsOut)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User not associated with an organization")

    settings = (
        db.query(SystemSettings)
        .filter(SystemSettings.organization_id == current_user.organization_id)
        .first()
    )
    if not settings:
        settings = SystemSettings(organization_id=current_user.organization_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.put("/", response_model=SystemSettingsOut)
def update_settings(
    data: SystemSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("Super Admin", "ESG Manager"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User not associated with an organization")

    settings = (
        db.query(SystemSettings)
        .filter(SystemSettings.organization_id == current_user.organization_id)
        .first()
    )
    if not settings:
        settings = SystemSettings(organization_id=current_user.organization_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings
