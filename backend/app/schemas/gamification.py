from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Point Transaction Schemas
class PointTransactionBase(BaseModel):
    amount: int
    reason: str = Field(..., min_length=2, max_length=200)

class PointTransactionCreate(PointTransactionBase):
    user_id: int

class PointTransactionOut(PointTransactionBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Badge Schemas
class BadgeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    points_required: int = Field(0, ge=0)

class BadgeCreate(BadgeBase):
    pass

class BadgeOut(BadgeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserBadgeOut(BaseModel):
    id: int
    user_id: int
    badge: BadgeOut
    awarded_at: datetime

    class Config:
        from_attributes = True

# Challenge Schemas
class ChallengeBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    target_points: int = Field(..., gt=0)
    reward_points: int = Field(..., gt=0)
    start_date: datetime
    end_date: datetime

class ChallengeCreate(ChallengeBase):
    pass

class ChallengeOut(ChallengeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserChallengeOut(BaseModel):
    id: int
    user_id: int
    challenge: ChallengeOut
    status: str
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Reward Schemas
class RewardBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    points_cost: int = Field(..., gt=0)
    quantity_available: int = Field(-1, ge=-1)
    is_active: bool = True

class RewardCreate(RewardBase):
    pass

class RewardOut(RewardBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserRewardOut(BaseModel):
    id: int
    user_id: int
    reward: RewardOut
    redeemed_at: datetime

    class Config:
        from_attributes = True

# Leaderboard Schemas
class LeaderboardUserOut(BaseModel):
    user_id: int
    full_name: str
    department_name: Optional[str] = None
    xp: int
    rank: int

    class Config:
        from_attributes = True

class LeaderboardDepartmentOut(BaseModel):
    department_id: int
    department_name: str
    total_xp: int
    rank: int

    class Config:
        from_attributes = True

# Employee Profile Schema
class UserProfileOut(BaseModel):
    user_id: int
    full_name: str
    email: str
    xp: int
    department_name: Optional[str] = None
    badges: List[UserBadgeOut] = []
    active_challenges: List[UserChallengeOut] = []
    completed_challenges: List[UserChallengeOut] = []
    rewards: List[UserRewardOut] = []
    recent_transactions: List[PointTransactionOut] = []

    class Config:
        from_attributes = True
