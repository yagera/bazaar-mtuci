from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.user import User as UserModel, UserRole
from app.models.item import Item as ItemModel, ModerationStatus
from app.models.availability import Availability
from app.schemas.item import ItemCreate, ItemUpdate, Item as ItemSchema
from app.api.v1.endpoints.auth import get_current_user
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=List[ItemSchema])
def read_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    dormitory: Optional[int] = Query(None, ge=1, le=3),
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
    
    if min_price is not None:
        query = query.filter(ItemModel.price_per_hour >= min_price)
    
    if max_price is not None:
        query = query.filter(ItemModel.price_per_hour <= max_price)

    items = query.offset(skip).limit(limit).all()
    return items


@router.get("/{item_id}", response_model=ItemSchema)
def read_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("/", response_model=ItemSchema, status_code=status.HTTP_201_CREATED)
def create_item(
    item: ItemCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = ItemModel(
        title=item.title,
        description=item.description,
        price_per_hour=item.price_per_hour,
        price_per_day=item.price_per_day,
        image_url=item.image_url,
        owner_id=current_user.id,
        dormitory=current_user.dormitory,
        moderation_status=ModerationStatus.PENDING,
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
    
    db.query(Availability).filter(Availability.item_id == item_id).delete()
    db.delete(db_item)
    db.commit()
    return None


@router.get("/me/items", response_model=List[ItemSchema])
def read_my_items(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(ItemModel).filter(ItemModel.owner_id == current_user.id).all()
    return items

