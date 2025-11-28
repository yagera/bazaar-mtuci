from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.schemas.user import User
from app.schemas.availability import Availability
from app.models.item import ModerationStatus


class ItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    price_per_hour: Decimal
    price_per_day: Optional[Decimal] = None
    image_url: Optional[str] = None


class ItemCreate(ItemBase):
    availabilities: Optional[List["AvailabilityCreate"]] = None


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price_per_hour: Optional[Decimal] = None
    price_per_day: Optional[Decimal] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    availabilities: Optional[List["AvailabilityCreate"]] = None


class ItemInDB(ItemBase):
    id: int
    owner_id: int
    dormitory: Optional[int] = None
    is_active: bool
    moderation_status: ModerationStatus
    moderation_comment: Optional[str] = None
    moderated_by_id: Optional[int] = None
    moderated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Item(ItemInDB):
    owner: User
    availabilities: List[Availability] = []


from app.schemas.availability import AvailabilityCreate
ItemCreate.model_rebuild()
ItemUpdate.model_rebuild()


