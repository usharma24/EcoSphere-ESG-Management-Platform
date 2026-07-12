from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# CSR Activity Schemas
class CSRActivityBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    date: datetime
    location: Optional[str] = None
    organizer: Optional[str] = None
    points_rewarded: int = Field(10, ge=0)

class CSRActivityCreate(CSRActivityBase):
    pass

class CSRActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    location: Optional[str] = None
    organizer: Optional[str] = None
    status: Optional[str] = None
    points_rewarded: Optional[int] = Field(None, ge=0)

class CSRActivityOut(CSRActivityBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# CSR Participation Schemas
class CSRParticipationBase(BaseModel):
    activity_id: int
    hours_contributed: float = Field(0.0, ge=0.0)

class CSRParticipationCreate(CSRParticipationBase):
    pass

class CSRParticipationUpdate(BaseModel):
    status: Optional[str] = None
    hours_contributed: Optional[float] = Field(None, ge=0.0)

class CSRParticipationOut(BaseModel):
    id: int
    activity_id: int
    user_id: int
    registered_at: datetime
    status: str
    hours_contributed: float
    user_name: Optional[str] = None
    activity_title: Optional[str] = None

    class Config:
        from_attributes = True

# Training Session Schemas
class TrainingSessionBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    date: datetime
    trainer_name: str = Field(..., min_length=2, max_length=100)
    category: str = Field("ESG", description="ESG, Safety, Diversity, Technical, etc.")
    duration_hours: float = Field(1.0, ge=0.0)

class TrainingSessionCreate(TrainingSessionBase):
    pass

class TrainingSessionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    trainer_name: Optional[str] = None
    category: Optional[str] = None
    duration_hours: Optional[float] = Field(None, ge=0.0)
    status: Optional[str] = None

class TrainingSessionOut(TrainingSessionBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Training Participation Schemas
class TrainingParticipationBase(BaseModel):
    session_id: int

class TrainingParticipationCreate(TrainingParticipationBase):
    pass

class TrainingParticipationUpdate(BaseModel):
    status: Optional[str] = None

class TrainingParticipationOut(BaseModel):
    id: int
    session_id: int
    user_id: int
    registered_at: datetime
    status: str
    user_name: Optional[str] = None
    session_title: Optional[str] = None

    class Config:
        from_attributes = True

# Wellness Program Schemas
class WellnessProgramBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    type: str = Field("Physical", description="Physical, Mental, Nutritional, etc.")
    start_date: datetime
    end_date: Optional[datetime] = None
    points_worth: int = Field(5, ge=0)

class WellnessProgramCreate(WellnessProgramBase):
    pass

class WellnessProgramUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None
    points_worth: Optional[int] = Field(None, ge=0)

class WellnessProgramOut(WellnessProgramBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Wellness Participation Schemas
class WellnessParticipationBase(BaseModel):
    program_id: int

class WellnessParticipationCreate(WellnessParticipationBase):
    pass

class WellnessParticipationUpdate(BaseModel):
    status: Optional[str] = None

class WellnessParticipationOut(BaseModel):
    id: int
    program_id: int
    user_id: int
    registered_at: datetime
    status: str
    user_name: Optional[str] = None
    program_title: Optional[str] = None

    class Config:
        from_attributes = True
