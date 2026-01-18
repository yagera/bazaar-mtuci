from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.schemas.user import User
from app.schemas.availability import Availability
from app.models.item import ModerationStatus, ItemCategory, ItemType


class ItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    item_type: ItemType = ItemType.RENT
    price_per_hour: Optional[Decimal] = None  # Для аренды
    price_per_day: Optional[Decimal] = None  # Для аренды
    sale_price: Optional[Decimal] = None  # Для продажи
    image_url: Optional[str] = None
    category: ItemCategory = ItemCategory.OTHER


class ItemCreate(ItemBase):
    availabilities: Optional[List["AvailabilityCreate"]] = None


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    item_type: Optional[ItemType] = None
    price_per_hour: Optional[Decimal] = None
    price_per_day: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    image_url: Optional[str] = None
    category: Optional[ItemCategory] = None
    is_active: Optional[bool] = None
    availabilities: Optional[List["AvailabilityCreate"]] = None


class ItemInDB(ItemBase):
    id: int
    owner_id: int
    dormitory: Optional[int] = None
    item_type: ItemType
    category: ItemCategory
    is_active: bool
    view_count: int = 0
    moderation_status: ModerationStatus
    moderation_comment: Optional[str] = None
    moderated_by_id: Optional[int] = None
    moderated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        use_enum_values = True


class Item(ItemInDB):
    owner: User
    availabilities: List[Availability] = []


from app.schemas.availability import AvailabilityCreate
ItemCreate.model_rebuild()
ItemUpdate.model_rebuild()


