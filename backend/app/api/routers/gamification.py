from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime

from app.database.session import get_db
from app.models.models import User, Department
from app.models.gamification import (
    PointTransaction, Badge, UserBadge, Challenge, UserChallenge, Reward, UserReward
)
from app.schemas.gamification import (
    PointTransactionCreate, PointTransactionOut,
    BadgeCreate, BadgeOut, UserBadgeOut,
    ChallengeCreate, ChallengeOut, UserChallengeOut,
    RewardCreate, RewardOut, UserRewardOut,
    LeaderboardUserOut, LeaderboardDepartmentOut, UserProfileOut
)
from app.api.routers.auth import get_current_user

router = APIRouter()

def check_manager_or_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["Super Admin", "ESG Manager", "Department Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Managers or Admins only."
        )
    return current_user

# ----------------- POINTS -----------------

@router.post("/points/award", response_model=PointTransactionOut)
def award_points(
    transaction_in: PointTransactionCreate,
    current_user: User = Depends(check_manager_or_admin),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == transaction_in.user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    transaction = PointTransaction(
        user_id=target_user.id,
        amount=transaction_in.amount,
        reason=transaction_in.reason
    )
    db.add(transaction)
    
    # Update user XP
    target_user.xp += transaction_in.amount
    
    db.commit()
    db.refresh(transaction)
    return transaction

# ----------------- CHALLENGES -----------------

@router.get("/challenges", response_model=List[ChallengeOut])
def get_challenges(db: Session = Depends(get_db)):
    return db.query(Challenge).order_by(desc(Challenge.created_at)).all()

@router.post("/challenges", response_model=ChallengeOut, status_code=status.HTTP_201_CREATED)
def create_challenge(
    challenge_in: ChallengeCreate,
    current_user: User = Depends(check_manager_or_admin),
    db: Session = Depends(get_db)
):
    challenge = Challenge(
        title=challenge_in.title,
        description=challenge_in.description,
        target_points=challenge_in.target_points,
        reward_points=challenge_in.reward_points,
        start_date=challenge_in.start_date,
        end_date=challenge_in.end_date
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return challenge

@router.post("/challenges/{challenge_id}/complete", response_model=UserChallengeOut)
def complete_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")
        
    now = datetime.utcnow()
    # Check if challenge is active (using naive dates for simplicity in this hackathon)
    if not (challenge.start_date.replace(tzinfo=None) <= now <= challenge.end_date.replace(tzinfo=None)):
        pass # In a real app we might reject, but allowing for demo purposes
        
    user_challenge = db.query(UserChallenge).filter(
        UserChallenge.challenge_id == challenge_id,
        UserChallenge.user_id == current_user.id
    ).first()
    
    if user_challenge and user_challenge.status == "Completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Challenge already completed")
        
    if not user_challenge:
        user_challenge = UserChallenge(
            user_id=current_user.id,
            challenge_id=challenge_id,
            status="Completed",
            completed_at=now
        )
        db.add(user_challenge)
    else:
        user_challenge.status = "Completed"
        user_challenge.completed_at = now
        
    # Award points
    reward_transaction = PointTransaction(
        user_id=current_user.id,
        amount=challenge.reward_points,
        reason=f"Completed challenge: {challenge.title}"
    )
    db.add(reward_transaction)
    current_user.xp += challenge.reward_points
    
    db.commit()
    db.refresh(user_challenge)
    return user_challenge

# ----------------- REWARDS -----------------

@router.get("/rewards", response_model=List[RewardOut])
def get_rewards(db: Session = Depends(get_db)):
    return db.query(Reward).filter(Reward.is_active == True).all()

@router.post("/rewards", response_model=RewardOut, status_code=status.HTTP_201_CREATED)
def create_reward(
    reward_in: RewardCreate,
    current_user: User = Depends(check_manager_or_admin),
    db: Session = Depends(get_db)
):
    reward = Reward(
        title=reward_in.title,
        description=reward_in.description,
        points_cost=reward_in.points_cost,
        quantity_available=reward_in.quantity_available,
        is_active=reward_in.is_active
    )
    db.add(reward)
    db.commit()
    db.refresh(reward)
    return reward

@router.post("/rewards/{reward_id}/redeem", response_model=UserRewardOut)
def redeem_reward(
    reward_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reward = db.query(Reward).filter(Reward.id == reward_id, Reward.is_active == True).first()
    if not reward:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reward not found or inactive")
        
    if current_user.xp < reward.points_cost:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient points")
        
    if reward.quantity_available > 0:
        reward.quantity_available -= 1
    elif reward.quantity_available == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reward out of stock")
        
    user_reward = UserReward(user_id=current_user.id, reward_id=reward.id)
    db.add(user_reward)
    
    transaction = PointTransaction(
        user_id=current_user.id,
        amount=-reward.points_cost,
        reason=f"Redeemed reward: {reward.title}"
    )
    db.add(transaction)
    
    current_user.xp -= reward.points_cost
    
    db.commit()
    db.refresh(user_reward)
    return user_reward

# ----------------- LEADERBOARD -----------------

@router.get("/leaderboard/users", response_model=List[LeaderboardUserOut])
def get_users_leaderboard(limit: int = 10, db: Session = Depends(get_db)):
    users = db.query(User).filter(User.is_active == True).order_by(desc(User.xp)).limit(limit).all()
    
    result = []
    for rank, user in enumerate(users, start=1):
        dept_name = user.department.name if user.department else None
        result.append(LeaderboardUserOut(
            user_id=user.id,
            full_name=user.full_name,
            department_name=dept_name,
            xp=user.xp,
            rank=rank
        ))
    return result

@router.get("/leaderboard/departments", response_model=List[LeaderboardDepartmentOut])
def get_departments_leaderboard(db: Session = Depends(get_db)):
    # Calculate sum of XP per department
    dept_scores = db.query(
        Department.id,
        Department.name,
        func.sum(User.xp).label("total_xp")
    ).join(User, User.department_id == Department.id).group_by(Department.id).order_by(desc("total_xp")).all()
    
    result = []
    for rank, ds in enumerate(dept_scores, start=1):
        result.append(LeaderboardDepartmentOut(
            department_id=ds.id,
            department_name=ds.name,
            total_xp=ds.total_xp or 0,
            rank=rank
        ))
    return result

# ----------------- PROFILE -----------------

@router.get("/profile", response_model=UserProfileOut)
def get_gamification_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Refresh to get latest relationships if needed, or query directly
    db.refresh(current_user)
    
    badges = db.query(UserBadge).filter(UserBadge.user_id == current_user.id).all()
    challenges = db.query(UserChallenge).filter(UserChallenge.user_id == current_user.id).all()
    rewards = db.query(UserReward).filter(UserReward.user_id == current_user.id).all()
    transactions = db.query(PointTransaction).filter(PointTransaction.user_id == current_user.id).order_by(desc(PointTransaction.created_at)).limit(10).all()
    
    active_challenges = [c for c in challenges if c.status == "Active"]
    completed_challenges = [c for c in challenges if c.status == "Completed"]
    
    return UserProfileOut(
        user_id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        xp=current_user.xp,
        department_name=current_user.department.name if current_user.department else None,
        badges=badges,
        active_challenges=active_challenges,
        completed_challenges=completed_challenges,
        rewards=rewards,
        recent_transactions=transactions
    )
