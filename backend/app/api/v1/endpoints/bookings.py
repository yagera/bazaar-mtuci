from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timedelta, date, time, timezone
from decimal import Decimal
from app.core.database import get_db
from app.models.user import User as UserModel
from app.models.item import Item as ItemModel
from app.models.booking import Booking, BookingStatus
from app.models.availability import Availability
from app.schemas.booking import BookingCreate, BookingUpdate, Booking as BookingSchema, BookingPublic
from app.api.v1.endpoints.auth import get_current_user
from app.services.notification_service import (
    create_new_booking_notification,
    create_booking_confirmed_notification,
    create_booking_rejected_notification,
    create_booking_cancelled_by_owner_notification,
    create_booking_cancelled_by_renter_notification,
)

router = APIRouter()


def calculate_price(item: ItemModel, start_time: datetime, end_time: datetime) -> Decimal:
    duration = end_time - start_time
    hours = duration.total_seconds() / 3600
    
    if item.price_per_day and hours >= 24:
        days = hours / 24
        return Decimal(str(days)) * item.price_per_day
    elif item.price_per_hour:
        return Decimal(str(hours)) * item.price_per_hour
    else:
        raise ValueError("Item must have either price_per_hour or price_per_day")


def check_availability(item_id: int, start_time: datetime, end_time: datetime, db: Session, exclude_booking_id: int = None) -> dict:
    query = db.query(Booking).filter(
        Booking.item_id == item_id,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
        Booking.start_time < end_time,
        Booking.end_time > start_time
    )
    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)
    
    overlapping = query.first()
    if overlapping:
        overlap_start_date = overlapping.start_time.strftime("%d.%m.%Y")
        overlap_start_time = overlapping.start_time.strftime("%H:%M")
        overlap_end_time = overlapping.end_time.strftime("%H:%M")
        return {
            "available": False,
            "message": f"Это время уже занято. Занято {overlap_start_date} с {overlap_start_time} до {overlap_end_time}"
        }
    
    booking_start_date = start_time.date()
    booking_end_date = end_time.date()
    booking_start_time = start_time.time()
    booking_end_time = end_time.time()
    
    availabilities = db.query(Availability).filter(
        Availability.item_id == item_id,
        Availability.start_date <= booking_end_date,
        Availability.end_date >= booking_start_date
    ).all()
    
    if not availabilities:
        return {
            "available": False,
            "message": f"На выбранные даты нет доступного времени"
        }
    
    from datetime import timedelta
    current_date = booking_start_date
    found_valid_availability = False
    
    while current_date <= booking_end_date:
        day_availability = None
        for avail in availabilities:
            if avail.start_date <= current_date <= avail.end_date:
                day_availability = avail
                break
        
        if not day_availability:
            return {
                "available": False,
                "message": f"На дату {current_date.strftime('%d.%m.%Y')} нет доступного времени"
            }
        
        if current_date == booking_start_date:
            if booking_start_time < day_availability.start_time:
                avail_start = day_availability.start_time.strftime("%H:%M")
                return {
                    "available": False,
                    "message": f"Время начала должно быть не раньше {avail_start}"
                }
        
        if current_date == booking_end_date:
            if booking_end_time > day_availability.end_time:
                avail_end = day_availability.end_time.strftime("%H:%M")
                return {
                    "available": False,
                    "message": f"Время окончания должно быть не позже {avail_end}"
                }
        
        found_valid_availability = True
        current_date += timedelta(days=1)
    
    if not found_valid_availability:
        return {
            "available": False,
            "message": f"На выбранные даты нет доступного времени"
        }
    
    return {"available": True, "message": "Time slot is available"}


@router.post("/", response_model=BookingSchema, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking: BookingCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(ItemModel).filter(ItemModel.id == booking.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not item.is_active:
        raise HTTPException(status_code=400, detail="Item is not available")
    
    if item.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot book your own item")
    
    def normalize_datetime(dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        else:
            return dt.astimezone(timezone.utc)
    
    start_time = normalize_datetime(booking.start_time)
    end_time = normalize_datetime(booking.end_time)
    
    if start_time >= end_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    now = datetime.now(timezone.utc)
    if start_time < now:
        raise HTTPException(status_code=400, detail="Cannot book in the past")
    
    availability_result = check_availability(booking.item_id, start_time, end_time, db)
    if not availability_result["available"]:
        raise HTTPException(status_code=400, detail=availability_result["message"])
    
    total_price = calculate_price(item, start_time, end_time)
    
    db_booking = Booking(
        item_id=booking.item_id,
        renter_id=current_user.id,
        start_time=start_time,
        end_time=end_time,
        total_price=total_price,
        status=BookingStatus.PENDING,
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    
    # Создаем уведомление владельцу о новом бронировании
    try:
        create_new_booking_notification(
            db=db,
            owner_id=item.owner_id,
            booking_id=db_booking.id,
            item_id=item.id,
            item_title=item.title,
            renter_username=current_user.username
        )
        db.commit()
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Ошибка при создании уведомления о новом бронировании: {str(e)}")
        db.rollback()
    
    return db_booking


@router.get("/", response_model=List[BookingSchema])
def read_bookings(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).filter(Booking.renter_id == current_user.id).all()
    return bookings


@router.get("/my-items", response_model=List[BookingSchema])
def read_bookings_for_my_items(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).join(ItemModel).filter(ItemModel.owner_id == current_user.id).all()
    return bookings


@router.get("/item/{item_id}", response_model=List[BookingPublic])
def read_bookings_for_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).filter(
        Booking.item_id == item_id,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED])
    ).all()
    return bookings


@router.get("/{booking_id}", response_model=BookingSchema)
def read_booking(
    booking_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    item = db.query(ItemModel).filter(ItemModel.id == booking.item_id).first()
    if booking.renter_id != current_user.id and item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return booking


@router.put("/{booking_id}", response_model=BookingSchema)
def update_booking(
    booking_id: int,
    booking_update: BookingUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).options(joinedload(Booking.item), joinedload(Booking.renter)).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    item = booking.item
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Проверяем права доступа
    is_owner = item.owner_id == current_user.id
    is_renter = booking.renter_id == current_user.id
    
    if not is_owner and not is_renter:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    old_status = booking.status
    
    # Валидация статуса
    if booking_update.status:
        try:
            new_status = BookingStatus(booking_update.status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        # Владелец может подтверждать, отклонять или отменять
        # Арендатор может только отменять свои бронирования
        if is_renter and not is_owner:
            if new_status != BookingStatus.CANCELLED:
                raise HTTPException(status_code=403, detail="Renter can only cancel bookings")
            if old_status == BookingStatus.COMPLETED:
                raise HTTPException(status_code=400, detail="Cannot cancel completed booking")
        
        booking.status = new_status
    
    db.commit()
    
    # Создаем уведомления при изменении статуса бронирования
    if booking_update.status and old_status != booking.status:
        try:
            renter = booking.renter
            
            if booking.status == BookingStatus.CONFIRMED:
                # Владелец подтвердил бронирование
                create_booking_confirmed_notification(
                    db=db,
                    renter_id=booking.renter_id,
                    booking_id=booking.id,
                    item_id=item.id,
                    item_title=item.title
                )
            elif booking.status == BookingStatus.CANCELLED:
                if is_renter and not is_owner:
                    # Арендатор отменил бронирование
                    create_booking_cancelled_by_renter_notification(
                        db=db,
                        owner_id=item.owner_id,
                        booking_id=booking.id,
                        item_id=item.id,
                        item_title=item.title,
                        renter_username=renter.username
                    )
                elif is_owner:
                    # Владелец отменил бронирование
                    if old_status == BookingStatus.PENDING:
                        # Если владелец отменяет pending бронирование, это считается отклонением
                        create_booking_rejected_notification(
                            db=db,
                            renter_id=booking.renter_id,
                            booking_id=booking.id,
                            item_id=item.id,
                            item_title=item.title
                        )
                    elif old_status == BookingStatus.CONFIRMED:
                        # Если владелец отменяет подтвержденное бронирование
                        create_booking_cancelled_by_owner_notification(
                            db=db,
                            renter_id=booking.renter_id,
                            booking_id=booking.id,
                            item_id=item.id,
                            item_title=item.title
                        )
            
            db.commit()
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Ошибка при создании уведомления об изменении статуса бронирования: {str(e)}")
            db.rollback()
    
    db.refresh(booking)
    return booking
