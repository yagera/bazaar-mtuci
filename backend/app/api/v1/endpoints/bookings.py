from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
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

router = APIRouter()


def calculate_price(item: ItemModel, start_time: datetime, end_time: datetime) -> Decimal:
    duration = end_time - start_time
    hours = duration.total_seconds() / 3600
    
    if item.price_per_day and hours >= 24:
        days = hours / 24
        return Decimal(str(days)) * item.price_per_day
    else:
        return Decimal(str(hours)) * item.price_per_hour


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
        overlap_start = overlapping.start_time.strftime("%H:%M")
        overlap_end = overlapping.end_time.strftime("%H:%M")
        return {
            "available": False,
            "message": f"Это время уже занято. Занято с {overlap_start} до {overlap_end}"
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
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    item = db.query(ItemModel).filter(ItemModel.id == booking.item_id).first()
    
    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only item owner can update booking status")
    
    if booking_update.status:
        try:
            booking.status = BookingStatus(booking_update.status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")
    
    db.commit()
    db.refresh(booking)
    return booking
