from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.notification import NotificationType


class NotificationBase(BaseModel):
    type: NotificationType
    title: str
    message: str


class NotificationCreate(NotificationBase):
    user_id: int
    related_item_id: Optional[int] = None
    related_booking_id: Optional[int] = None
    related_report_id: Optional[int] = None


class NotificationInDB(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    related_item_id: Optional[int] = None
    related_booking_id: Optional[int] = None
    related_report_id: Optional[int] = None
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Notification(NotificationInDB):
    pass


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None


