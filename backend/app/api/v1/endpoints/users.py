from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.user import User as UserModel
from app.models.item import Item as ItemModel
from app.models.booking import Booking as BookingModel
from app.models.favorite import Favorite as FavoriteModel
from app.schemas.user import UserUpdate, User as UserSchema
from app.api.v1.endpoints.auth import get_current_user
from app.models.booking import BookingStatus
from app.models.item import ItemType

router = APIRouter()


@router.get("/me", response_model=UserSchema)
def read_user_me(current_user: UserModel = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserSchema)
def update_user_me(
    user_update: UserUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.core.security import get_password_hash
    
    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserSchema)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/me/stats")
def get_user_stats(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить статистику пользователя"""
    # Статистика по объявлениям
    total_items = db.query(func.count(ItemModel.id)).filter(ItemModel.owner_id == current_user.id).scalar() or 0
    active_items = db.query(func.count(ItemModel.id)).filter(
        ItemModel.owner_id == current_user.id,
        ItemModel.is_active == True
    ).scalar() or 0
    inactive_items = total_items - active_items
    
    # Общее количество просмотров всех объявлений
    total_views = db.query(func.sum(ItemModel.view_count)).filter(
        ItemModel.owner_id == current_user.id
    ).scalar() or 0
    
    # Общее количество добавлений в избранное всех объявлений
    total_favorites = db.query(func.count(FavoriteModel.id)).join(
        ItemModel, FavoriteModel.item_id == ItemModel.id
    ).filter(ItemModel.owner_id == current_user.id).scalar() or 0
    
    # Бронирования как владелец (полученные)
    bookings_as_owner = db.query(func.count(BookingModel.id)).join(
        ItemModel, BookingModel.item_id == ItemModel.id
    ).filter(ItemModel.owner_id == current_user.id).scalar() or 0
    
    confirmed_bookings_as_owner = db.query(func.count(BookingModel.id)).join(
        ItemModel, BookingModel.item_id == ItemModel.id
    ).filter(
        ItemModel.owner_id == current_user.id,
        BookingModel.status == BookingStatus.CONFIRMED
    ).scalar() or 0
    
    completed_bookings_as_owner = db.query(func.count(BookingModel.id)).join(
        ItemModel, BookingModel.item_id == ItemModel.id
    ).filter(
        ItemModel.owner_id == current_user.id,
        BookingModel.status == BookingStatus.COMPLETED
    ).scalar() or 0
    
    # Бронирования как арендатор (сделанные)
    bookings_as_renter = db.query(func.count(BookingModel.id)).filter(
        BookingModel.renter_id == current_user.id
    ).scalar() or 0
    
    confirmed_bookings_as_renter = db.query(func.count(BookingModel.id)).filter(
        BookingModel.renter_id == current_user.id,
        BookingModel.status == BookingStatus.CONFIRMED
    ).scalar() or 0
    
    completed_bookings_as_renter = db.query(func.count(BookingModel.id)).filter(
        BookingModel.renter_id == current_user.id,
        BookingModel.status == BookingStatus.COMPLETED
    ).scalar() or 0
    
    # Продажи (объявления типа SALE)
    sales_items = db.query(func.count(ItemModel.id)).filter(
        ItemModel.owner_id == current_user.id,
        ItemModel.item_type == ItemType.SALE,
        ItemModel.is_active == True
    ).scalar() or 0
    
    # Общий доход от завершенных бронирований и продаж
    total_earnings = db.query(func.sum(BookingModel.total_price)).join(
        ItemModel, BookingModel.item_id == ItemModel.id
    ).filter(
        ItemModel.owner_id == current_user.id,
        BookingModel.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
    ).scalar() or 0
    
    return {
        "items": {
            "total": total_items,
            "active": active_items,
            "inactive": inactive_items
        },
        "views": {
            "total": int(total_views)
        },
        "favorites": {
            "total": total_favorites
        },
        "bookings": {
            "as_owner": {
                "total": bookings_as_owner,
                "confirmed": confirmed_bookings_as_owner,
                "completed": completed_bookings_as_owner
            },
            "as_renter": {
                "total": bookings_as_renter,
                "confirmed": confirmed_bookings_as_renter,
                "completed": completed_bookings_as_renter
            }
        },
        "sales": {
            "active_items": sales_items
        },
        "earnings": {
            "total": float(total_earnings) if total_earnings else 0.0
        }
    }

