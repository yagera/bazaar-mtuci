from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.user import User as UserModel
from app.models.notification import Notification as NotificationModel
from app.schemas.notification import Notification as NotificationSchema, NotificationUpdate
from app.api.v1.endpoints.auth import get_current_user
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=List[NotificationSchema])
def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить уведомления текущего пользователя"""
    query = db.query(NotificationModel).filter(NotificationModel.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(NotificationModel.is_read == False)
    
    notifications = query.order_by(NotificationModel.created_at.desc()).offset(skip).limit(limit).all()
    return notifications


@router.get("/unread/count")
def get_unread_count(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить количество непрочитанных уведомлений"""
    count = db.query(NotificationModel).filter(
        NotificationModel.user_id == current_user.id,
        NotificationModel.is_read == False
    ).count()
    return {"count": count}


@router.patch("/read-all", response_model=dict)
def mark_all_as_read(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Отметить все уведомления как прочитанные"""
    count = db.query(NotificationModel).filter(
        NotificationModel.user_id == current_user.id,
        NotificationModel.is_read == False
    ).update(
        {
            NotificationModel.is_read: True,
            NotificationModel.read_at: datetime.utcnow()
        },
        synchronize_session=False
    )
    
    db.commit()
    return {"marked_as_read": count}


@router.get("/{notification_id}", response_model=NotificationSchema)
def get_notification(
    notification_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить конкретное уведомление"""
    notification = db.query(NotificationModel).filter(
        NotificationModel.id == notification_id,
        NotificationModel.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Уведомление не найдено")
    
    return notification


@router.patch("/{notification_id}", response_model=NotificationSchema)
def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить уведомление (например, отметить как прочитанное)"""
    notification = db.query(NotificationModel).filter(
        NotificationModel.id == notification_id,
        NotificationModel.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Уведомление не найдено")
    
    if notification_update.is_read is not None:
        notification.is_read = notification_update.is_read
        if notification_update.is_read:
            notification.read_at = datetime.utcnow()
        else:
            notification.read_at = None
    
    db.commit()
    db.refresh(notification)
    return notification


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить уведомление"""
    notification = db.query(NotificationModel).filter(
        NotificationModel.id == notification_id,
        NotificationModel.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Уведомление не найдено")
    
    db.delete(notification)
    db.commit()
    return None

