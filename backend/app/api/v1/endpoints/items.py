from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.user import User as UserModel, UserRole
from app.models.item import Item as ItemModel, ModerationStatus, ItemCategory, ItemType
from app.models.availability import Availability
from app.models.notification import Notification as NotificationModel
from app.models.booking import Booking as BookingModel
from app.models.report import Report as ReportModel
from app.schemas.item import ItemCreate, ItemUpdate, Item as ItemSchema
from app.api.v1.endpoints.auth import get_current_user, get_current_user_optional
from app.core.config import settings
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/me/items", response_model=List[ItemSchema])
def read_my_items(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(ItemModel).filter(ItemModel.owner_id == current_user.id).all()
    return items


@router.get("/", response_model=List[ItemSchema])
def read_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    dormitory: Optional[int] = Query(None, ge=1, le=3),
    category: Optional[ItemCategory] = None,
    item_type: Optional[ItemType] = None,
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(ItemModel).filter(
        ItemModel.is_active == True,
        ItemModel.moderation_status == ModerationStatus.APPROVED
    )

    if search:
        query = query.filter(ItemModel.title.ilike(f"%{search}%"))
    
    if dormitory:
        query = query.filter(ItemModel.dormitory == dormitory)
    
    if category:
        query = query.filter(ItemModel.category == category)
    
    if item_type:
        query = query.filter(ItemModel.item_type == item_type)
    
    if min_price is not None:
        if item_type == ItemType.SALE:
            query = query.filter(ItemModel.sale_price >= min_price)
        else:
            query = query.filter(
                (ItemModel.price_per_hour >= min_price) | 
                (ItemModel.sale_price >= min_price)
            )
    
    if max_price is not None:
        if item_type == ItemType.SALE:
            query = query.filter(ItemModel.sale_price <= max_price)
        else:
            query = query.filter(
                (ItemModel.price_per_hour <= max_price) | 
                (ItemModel.sale_price <= max_price)
            )

    items = query.offset(skip).limit(limit).all()
    return items


@router.get("/{item_id}", response_model=ItemSchema)
def read_item(
    item_id: int, 
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_current_user_optional)
):
    item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if current_user is None or current_user.id != item.owner_id:
        item.view_count = (item.view_count or 0) + 1
        db.commit()
        db.refresh(item)
    
    return item


@router.post("/", response_model=ItemSchema, status_code=status.HTTP_201_CREATED)
async def create_item(
    item: ItemCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item_type_value = item.item_type
    if isinstance(item_type_value, str):
        try:
            item_type_value = ItemType(item_type_value.lower())
        except ValueError:
            item_type_value = ItemType[item_type_value.upper()] if item_type_value.upper() in ['RENT', 'SALE'] else ItemType.RENT
    elif not isinstance(item_type_value, ItemType):
        item_type_value = ItemType(str(item_type_value).lower())
    
    moderation_status = ModerationStatus.PENDING
    if settings.AI_MODERATION_ENABLED and item.image_url:
        try:
            from app.core.ai_service import moderate_image_auto
            
            moderation_result = await moderate_image_auto(
                image_url=item.image_url,
                category=item.category.value if item.category else None,
                min_confidence_for_rejection=settings.AI_MODERATION_AUTO_REJECT_CONFIDENCE
            )
            
            if (
                moderation_result["status"] == "approved" and
                moderation_result["auto_action"] and
                moderation_result["confidence"] >= settings.AI_MODERATION_AUTO_APPROVE_CONFIDENCE
            ):
                moderation_status = ModerationStatus.APPROVED
            
            elif (
                moderation_result["status"] == "rejected" and
                moderation_result["auto_action"] and
                moderation_result["confidence"] >= settings.AI_MODERATION_AUTO_REJECT_CONFIDENCE
            ):
                moderation_status = ModerationStatus.REJECTED
        
        except Exception as mod_error:
            logger.warning(f"AI moderation check failed during item creation: {mod_error}", exc_info=True)
    
    if item_type_value == ItemType.RENT:
        if not item.price_per_hour and not item.price_per_day:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Для аренды необходимо указать цену за час или за день"
            )
    elif item_type_value == ItemType.SALE:
        if not item.sale_price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Для продажи необходимо указать цену продажи"
            )
    
    db_item = ItemModel(
        title=item.title,
        description=item.description,
        item_type=item_type_value,
        price_per_hour=item.price_per_hour,
        price_per_day=item.price_per_day,
        sale_price=item.sale_price,
        image_url=item.image_url,
        category=item.category,
        owner_id=current_user.id,
        dormitory=current_user.dormitory,
        moderation_status=moderation_status,
    )
    db.add(db_item)
    db.flush()
    
    if item.availabilities:
        for avail in item.availabilities:
            day_of_week = avail.start_date.weekday() if avail.start_date else None
            db_avail = Availability(
                item_id=db_item.id,
                day_of_week=day_of_week,
                date=None,
                start_date=avail.start_date,
                end_date=avail.end_date,
                start_time=avail.start_time,
                end_time=avail.end_time,
            )
            db.add(db_avail)
    
    db.commit()
    db.refresh(db_item)
    return db_item


@router.put("/{item_id}", response_model=ItemSchema)
def update_item(
    item_id: int,
    item_update: ItemUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    if db_item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_data = item_update.model_dump(exclude_unset=True)
    availabilities = update_data.pop("availabilities", None)
    
    if 'is_active' in update_data and update_data['is_active'] is True:
        if db_item.moderation_status == ModerationStatus.REJECTED:
            db_item.moderation_status = ModerationStatus.PENDING
            db_item.moderation_comment = None
            db_item.moderated_by_id = None
            db_item.moderated_at = None
    
    if 'item_type' in update_data:
        item_type_value = update_data.pop('item_type')
        if isinstance(item_type_value, str):
            item_type_value = ItemType(item_type_value.lower())
        elif hasattr(item_type_value, 'value'):
            item_type_value = ItemType(item_type_value.value)
        update_data['item_type'] = item_type_value
    
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    if availabilities is not None:
        db.query(Availability).filter(Availability.item_id == item_id).delete()
        for avail in availabilities:
            day_of_week = avail.start_date.weekday() if avail.start_date else None
            db_avail = Availability(
                item_id=db_item.id,
                day_of_week=day_of_week,
                date=None,
                start_date=avail.start_date,
                end_date=avail.end_date,
                start_time=avail.start_time,
                end_time=avail.end_time,
            )
            db.add(db_avail)
    
    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    if db_item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db.query(NotificationModel).filter(NotificationModel.related_item_id == item_id).update(
        {NotificationModel.related_item_id: None},
        synchronize_session=False
    )
    
    db.query(Availability).filter(Availability.item_id == item_id).delete(synchronize_session=False)
    
    db.query(BookingModel).filter(BookingModel.item_id == item_id).delete(synchronize_session=False)
    
    db.query(ReportModel).filter(ReportModel.item_id == item_id).delete(synchronize_session=False)
    
    db.delete(db_item)
    db.commit()
    return None

