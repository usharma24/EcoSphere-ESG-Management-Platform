from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from datetime import datetime, timezone
from typing import List
from app.database.session import get_db
from app.models.models import Challenge, UserChallenge, Badge, UserBadge, User
from app.schemas.schemas import (
    ChallengeCreate, ChallengeOut, UserChallengeOut, BadgeOut, UserBadgeOut,
)
from app.api.routers.auth import get_current_user

router = APIRouter(prefix="/api/gamification", tags=["Gamification"])


# ── Challenges ────────────────────────────────────────────────────────

@router.get("/challenges", response_model=List[ChallengeOut])
def list_challenges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Challenge).filter(Challenge.is_active == True).order_by(Challenge.created_at.desc()).all()


@router.post("/challenges", response_model=ChallengeOut, status_code=201)
def create_challenge(
    data: ChallengeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    challenge = Challenge(**data.model_dump())
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return challenge


@router.post("/challenges/{challenge_id}/join")
def join_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    existing = (
        db.query(UserChallenge)
        .filter(UserChallenge.user_id == current_user.id, UserChallenge.challenge_id == challenge_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already joined this challenge")

    uc = UserChallenge(user_id=current_user.id, challenge_id=challenge_id)
    db.add(uc)
    db.commit()
    db.refresh(uc)
    return {"message": "Joined challenge", "id": uc.id}


@router.post("/challenges/{challenge_id}/complete")
def complete_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uc = (
        db.query(UserChallenge)
        .filter(UserChallenge.user_id == current_user.id, UserChallenge.challenge_id == challenge_id)
        .first()
    )
    if not uc:
        raise HTTPException(status_code=404, detail="You haven't joined this challenge")
    if uc.status == "Completed":
        raise HTTPException(status_code=400, detail="Already completed")

    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    uc.status = "Completed"
    uc.completed_at = datetime.now(timezone.utc)

    # Award XP
    current_user.xp = (current_user.xp or 0) + challenge.xp_reward
    db.commit()

    # Auto-award badges
    _check_badges(db, current_user)

    return {"message": "Challenge completed!", "xp_earned": challenge.xp_reward, "total_xp": current_user.xp}


@router.get("/my-challenges", response_model=List[UserChallengeOut])
def my_challenges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(UserChallenge)
        .filter(UserChallenge.user_id == current_user.id)
        .order_by(UserChallenge.created_at.desc())
        .all()
    )


# ── Leaderboard ───────────────────────────────────────────────────────

@router.get("/leaderboard")
def leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    top_users = (
        db.query(User.id, User.full_name, User.xp, User.role)
        .filter(User.is_active == True)
        .order_by(User.xp.desc())
        .limit(20)
        .all()
    )
    return [
        {"rank": idx + 1, "id": u.id, "full_name": u.full_name, "xp": u.xp, "role": u.role}
        for idx, u in enumerate(top_users)
    ]


# ── Badges ────────────────────────────────────────────────────────────

@router.get("/badges", response_model=List[BadgeOut])
def list_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Badge).all()


@router.get("/my-badges", response_model=List[UserBadgeOut])
def my_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(UserBadge).filter(UserBadge.user_id == current_user.id).all()


def _check_badges(db: Session, user: User):
    """Auto-award badges if conditions are met."""
    badges = db.query(Badge).all()
    for badge in badges:
        # Already earned?
        existing = (
            db.query(UserBadge)
            .filter(UserBadge.user_id == user.id, UserBadge.badge_id == badge.id)
            .first()
        )
        if existing:
            continue

        earned = False
        if badge.rule_metric == "xp" and (user.xp or 0) >= badge.rule_value:
            earned = True
        elif badge.rule_metric == "challenges_completed":
            completed = (
                db.query(sql_func.count(UserChallenge.id))
                .filter(UserChallenge.user_id == user.id, UserChallenge.status == "Completed")
                .scalar()
            )
            if completed >= badge.rule_value:
                earned = True

        if earned:
            ub = UserBadge(user_id=user.id, badge_id=badge.id)
            db.add(ub)

    db.commit()
