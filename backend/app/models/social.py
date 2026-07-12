from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base

class CSRActivity(Base):
    __tablename__ = "csr_activities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)
    location = Column(String, nullable=True)
    organizer = Column(String, nullable=True)
    status = Column(String, default="Planned", nullable=False)  # Planned, Active, Completed, Cancelled
    points_rewarded = Column(Integer, default=10, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    participations = relationship("CSRParticipation", back_populates="activity", cascade="all, delete-orphan")

class CSRParticipation(Base):
    __tablename__ = "csr_participations"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("csr_activities.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="Registered", nullable=False)  # Registered, Attended, Absent
    hours_contributed = Column(Float, default=0.0, nullable=False)

    # Relationships
    activity = relationship("CSRActivity", back_populates="participations")
    user = relationship("User")

class TrainingSession(Base):
    __tablename__ = "training_sessions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)
    trainer_name = Column(String, nullable=False)
    category = Column(String, default="ESG", nullable=False)  # ESG, Safety, Diversity, Technical, etc.
    duration_hours = Column(Float, default=1.0, nullable=False)
    status = Column(String, default="Scheduled", nullable=False)  # Scheduled, Completed, Cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    participations = relationship("TrainingParticipation", back_populates="session", cascade="all, delete-orphan")

class TrainingParticipation(Base):
    __tablename__ = "training_participations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("training_sessions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="Registered", nullable=False)  # Registered, Completed, Incomplete

    # Relationships
    session = relationship("TrainingSession", back_populates="participations")
    user = relationship("User")

class WellnessProgram(Base):
    __tablename__ = "wellness_programs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    type = Column(String, default="Physical", nullable=False)  # Physical, Mental, Nutritional, etc.
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="Upcoming", nullable=False)  # Upcoming, Active, Completed
    points_worth = Column(Integer, default=5, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    participations = relationship("WellnessParticipation", back_populates="program", cascade="all, delete-orphan")

class WellnessParticipation(Base):
    __tablename__ = "wellness_participations"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("wellness_programs.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="Registered", nullable=False)  # Registered, Completed, Dropped

    # Relationships
    program = relationship("WellnessProgram", back_populates="participations")
    user = relationship("User")
