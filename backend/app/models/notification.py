from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class NotificationType(str, enum.Enum):
    # Уведомления для владельца объявления
    ITEM_REMOVED_BY_REPORT = "item_removed_by_report"  # Объявление снято из-за жалобы
    ITEM_APPROVED = "item_approved"  # Объявление одобрено
    ITEM_REJECTED = "item_rejected"  # Объявление отклонено
    NEW_BOOKING_REQUEST = "new_booking_request"  # Новое бронирование
    BOOKING_CANCELLED_BY_RENTER = "booking_cancelled_by_renter"  # Бронирование отменено арендатором
    
    # Уведомления для арендатора
    BOOKING_CONFIRMED = "booking_confirmed"  # Бронирование подтверждено
    BOOKING_REJECTED = "booking_rejected"  # Бронирование отклонено
    BOOKING_CANCELLED_BY_OWNER = "booking_cancelled_by_owner"  # Бронирование отменено владельцем


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    
    # Связи с другими сущностями (опциональные)
    related_item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    related_booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    related_report_id = Column(Integer, ForeignKey("reports.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="notifications")
    related_item = relationship("Item", foreign_keys=[related_item_id])
    related_booking = relationship("Booking", foreign_keys=[related_booking_id])
    related_report = relationship("Report", foreign_keys=[related_report_id])


