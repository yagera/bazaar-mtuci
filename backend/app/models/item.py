from sqlalchemy import Column, Integer, String, Text, Numeric, ForeignKey, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class ModerationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    price_per_hour = Column(Numeric(10, 2), nullable=False)
    price_per_day = Column(Numeric(10, 2), nullable=True)
    image_url = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dormitory = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    moderation_status = Column(Enum(ModerationStatus), default=ModerationStatus.PENDING, nullable=False)
    moderation_comment = Column(Text, nullable=True)
    moderated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    moderated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="items", foreign_keys=[owner_id])
    moderator = relationship("User", foreign_keys=[moderated_by_id])
    bookings = relationship("Booking", back_populates="item", cascade="all, delete-orphan")
    availabilities = relationship("Availability", back_populates="item", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="item", cascade="all, delete-orphan")


