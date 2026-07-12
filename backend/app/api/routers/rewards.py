from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.models import Reward, Redemption, User
from app.schemas.schemas import RewardCreate, RewardOut, RedemptionOut
from app.api.routers.auth import get_current_user

router = APIRouter(prefix="/api/rewards", tags=["Rewards"])


@router.get("/", response_model=List[RewardOut])
def list_rewards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Reward).filter(Reward.is_active == True).order_by(Reward.created_at.desc()).all()


@router.post("/", response_model=RewardOut, status_code=201)
def create_reward(
    data: RewardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("Super Admin", "ESG Manager"):
        raise HTTPException(status_code=403, detail="Only admins can create rewards")
    reward = Reward(**data.model_dump())
    db.add(reward)
    db.commit()
    db.refresh(reward)
    return reward


@router.post("/{reward_id}/redeem")
def redeem_reward(
    reward_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    if reward.stock <= 0:
        raise HTTPException(status_code=400, detail="Out of stock")
    if (current_user.xp or 0) < reward.cost_points:
        raise HTTPException(status_code=400, detail="Insufficient points")

    # Deduct points and stock
    current_user.xp -= reward.cost_points
    reward.stock -= 1

    redemption = Redemption(
        user_id=current_user.id,
        reward_id=reward.id,
        points_spent=reward.cost_points,
    )
    db.add(redemption)
    db.commit()
    db.refresh(redemption)

    return {
        "message": "Reward redeemed successfully!",
        "remaining_xp": current_user.xp,
        "remaining_stock": reward.stock,
    }


@router.get("/my-redemptions", response_model=List[RedemptionOut])
def my_redemptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Redemption)
        .filter(Redemption.user_id == current_user.id)
        .order_by(Redemption.redeemed_at.desc())
        .all()
    )
