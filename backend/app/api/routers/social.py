from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.models import SocialInitiative, User
from app.schemas.schemas import SocialInitiativeCreate, SocialInitiativeOut
from app.api.routers.auth import get_current_user

router = APIRouter(prefix="/api/social", tags=["Social"])


@router.get("/initiatives", response_model=List[SocialInitiativeOut])
def list_initiatives(
    category: str = None,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(SocialInitiative)
    if category:
        query = query.filter(SocialInitiative.category == category)
    if status:
        query = query.filter(SocialInitiative.status == status)
    return query.order_by(SocialInitiative.created_at.desc()).all()


@router.post("/initiatives", response_model=SocialInitiativeOut, status_code=201)
def create_initiative(
    data: SocialInitiativeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    initiative = SocialInitiative(
        **data.model_dump(),
        created_by_id=current_user.id,
    )
    db.add(initiative)
    db.commit()
    db.refresh(initiative)
    return initiative


@router.get("/summary")
def social_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregate social KPIs."""
    total = db.query(SocialInitiative).count()
    active = db.query(SocialInitiative).filter(SocialInitiative.status == "Active").count()
    completed = db.query(SocialInitiative).filter(SocialInitiative.status == "Completed").count()

    by_category = {}
    for cat in ["DEI", "Community", "Wellbeing", "Training"]:
        by_category[cat] = db.query(SocialInitiative).filter(SocialInitiative.category == cat).count()

    return {
        "total": total,
        "active": active,
        "completed": completed,
        "by_category": by_category,
    }


@router.delete("/initiatives/{initiative_id}", status_code=204)
def delete_initiative(
    initiative_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    initiative = db.query(SocialInitiative).filter(SocialInitiative.id == initiative_id).first()
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")
    db.delete(initiative)
    db.commit()
