from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.schemas.user import User
from app.schemas.item import Item


class BookingBase(BaseModel):
    start_time: datetime
    end_time: datetime


class BookingCreate(BookingBase):
    item_id: int


class BookingUpdate(BaseModel):
    status: Optional[str] = None


class BookingInDB(BookingBase):
    id: int
    item_id: int
    renter_id: int
    total_price: Decimal
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Booking(BookingInDB):
    item: Item
    renter: User


class BookingPublic(BookingBase):
    """Public booking schema without user information"""
    id: int
    item_id: int
    start_time: datetime
    end_time: datetime
    status: str

    class Config:
        from_attributes = True



