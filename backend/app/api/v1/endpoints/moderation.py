from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from typing import List, Optional
from app.core.database import get_db
from app.models.user import User as UserModel, UserRole
from app.models.item import Item as ItemModel, ModerationStatus
from app.models.report import Report as ReportModel, ReportStatus
from app.models.booking import Booking as BookingModel, BookingStatus
from app.schemas.item import Item as ItemSchema
from app.api.v1.endpoints.auth import get_current_user
from app.services.notification_service import create_item_approved_notification, create_item_rejected_notification
from datetime import datetime, timedelta


router = APIRouter()


def require_moderator(current_user: UserModel = Depends(get_current_user)):
    if current_user.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Требуются права модератора"
        )
    return current_user


@router.get("/pending", response_model=List[ItemSchema])
def get_pending_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: UserModel = Depends(require_moderator),
    db: Session = Depends(get_db)
):
    items = db.query(ItemModel).options(
        joinedload(ItemModel.owner)
    ).filter(
        ItemModel.moderation_status == ModerationStatus.PENDING
    ).order_by(ItemModel.created_at.desc()).offset(skip).limit(limit).all()
    return items


@router.post("/{item_id}/approve", response_model=ItemSchema)
def approve_item(
    item_id: int,
    current_user: UserModel = Depends(require_moderator),
    db: Session = Depends(get_db)
):
    item = db.query(ItemModel).options(
        joinedload(ItemModel.owner)
    ).filter(ItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    
    item.moderation_status = ModerationStatus.APPROVED
    item.moderated_by_id = current_user.id
    item.moderated_at = datetime.utcnow()
    item.moderation_comment = None
    
    db.commit()
    
    # Создаем уведомление владельцу объявления (после коммита, чтобы не блокировать одобрение)
    try:
        create_item_approved_notification(
            db=db,
            owner_id=item.owner_id,
            item_id=item.id,
            item_title=item.title
        )
        db.commit()
    except Exception as e:
        # Логируем ошибку, но не прерываем выполнение (уведомления - это дополнительная функция)
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Ошибка при создании уведомления: {str(e)}")
        db.rollback()
    
    db.refresh(item)
    return item


@router.post("/{item_id}/reject", response_model=ItemSchema)
def reject_item(
    item_id: int,
    comment: Optional[str] = Query(None, description="Причина отклонения"),
    current_user: UserModel = Depends(require_moderator),
    db: Session = Depends(get_db)
):
    item = db.query(ItemModel).options(
        joinedload(ItemModel.owner)
    ).filter(ItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    
    item.moderation_status = ModerationStatus.REJECTED
    item.moderated_by_id = current_user.id
    item.moderated_at = datetime.utcnow()
    item.moderation_comment = comment
    item.is_active = False
    
    db.commit()
    
    # Создаем уведомление владельцу объявления (после коммита, чтобы не блокировать отклонение)
    try:
        create_item_rejected_notification(
            db=db,
            owner_id=item.owner_id,
            item_id=item.id,
            item_title=item.title,
            comment=comment
        )
        db.commit()
    except Exception as e:
        # Логируем ошибку, но не прерываем выполнение (уведомления - это дополнительная функция)
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Ошибка при создании уведомления: {str(e)}")
        db.rollback()
    
    db.refresh(item)
    return item


@router.get("/stats")
def get_moderation_stats(
    current_user: UserModel = Depends(require_moderator),
    db: Session = Depends(get_db)
):
    """Базовая статистика модерации (для обратной совместимости)"""
    pending_count = db.query(ItemModel).filter(
        ItemModel.moderation_status == ModerationStatus.PENDING
    ).count()
    
    approved_count = db.query(ItemModel).filter(
        ItemModel.moderation_status == ModerationStatus.APPROVED
    ).count()
    
    rejected_count = db.query(ItemModel).filter(
        ItemModel.moderation_status == ModerationStatus.REJECTED
    ).count()
    
    return {
        "pending": pending_count,
        "approved": approved_count,
        "rejected": rejected_count
    }


@router.get("/stats/detailed")
def get_detailed_moderation_stats(
    current_user: UserModel = Depends(require_moderator),
    db: Session = Depends(get_db)
):
    """Детальная статистика для модераторов и админов"""
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    week_start = today_start - timedelta(days=7)
    month_start = datetime(now.year, now.month, 1)
    
    # Статистика по объявлениям
    items_pending = db.query(func.count(ItemModel.id)).filter(
        ItemModel.moderation_status == ModerationStatus.PENDING
    ).scalar() or 0
    
    items_approved = db.query(func.count(ItemModel.id)).filter(
        ItemModel.moderation_status == ModerationStatus.APPROVED
    ).scalar() or 0
    
    items_rejected = db.query(func.count(ItemModel.id)).filter(
        ItemModel.moderation_status == ModerationStatus.REJECTED
    ).scalar() or 0
    
    items_total = items_pending + items_approved + items_rejected
    
    # Статистика по объявлениям за периоды
    items_approved_today = db.query(func.count(ItemModel.id)).filter(
        ItemModel.moderation_status == ModerationStatus.APPROVED,
        ItemModel.moderated_at >= today_start
    ).scalar() or 0
    
    items_approved_week = db.query(func.count(ItemModel.id)).filter(
        ItemModel.moderation_status == ModerationStatus.APPROVED,
        ItemModel.moderated_at >= week_start
    ).scalar() or 0
    
    items_approved_month = db.query(func.count(ItemModel.id)).filter(
        ItemModel.moderation_status == ModerationStatus.APPROVED,
        ItemModel.moderated_at >= month_start
    ).scalar() or 0
    
    items_rejected_today = db.query(func.count(ItemModel.id)).filter(
        ItemModel.moderation_status == ModerationStatus.REJECTED,
        ItemModel.moderated_at >= today_start
    ).scalar() or 0
    
    items_rejected_week = db.query(func.count(ItemModel.id)).filter(
        ItemModel.moderation_status == ModerationStatus.REJECTED,
        ItemModel.moderated_at >= week_start
    ).scalar() or 0
    
    items_rejected_month = db.query(func.count(ItemModel.id)).filter(
        ItemModel.moderation_status == ModerationStatus.REJECTED,
        ItemModel.moderated_at >= month_start
    ).scalar() or 0
    
    # Статистика по жалобам
    reports_pending = db.query(func.count(ReportModel.id)).filter(
        ReportModel.status == ReportStatus.PENDING
    ).scalar() or 0
    
    reports_resolved = db.query(func.count(ReportModel.id)).filter(
        ReportModel.status == ReportStatus.RESOLVED
    ).scalar() or 0
    
    reports_dismissed = db.query(func.count(ReportModel.id)).filter(
        ReportModel.status == ReportStatus.DISMISSED
    ).scalar() or 0
    
    reports_total = reports_pending + reports_resolved + reports_dismissed
    
    # Статистика по жалобам за периоды
    reports_resolved_today = db.query(func.count(ReportModel.id)).filter(
        ReportModel.status == ReportStatus.RESOLVED,
        ReportModel.reviewed_at >= today_start
    ).scalar() or 0
    
    reports_resolved_week = db.query(func.count(ReportModel.id)).filter(
        ReportModel.status == ReportStatus.RESOLVED,
        ReportModel.reviewed_at >= week_start
    ).scalar() or 0
    
    reports_resolved_month = db.query(func.count(ReportModel.id)).filter(
        ReportModel.status == ReportStatus.RESOLVED,
        ReportModel.reviewed_at >= month_start
    ).scalar() or 0
    
    reports_dismissed_today = db.query(func.count(ReportModel.id)).filter(
        ReportModel.status == ReportStatus.DISMISSED,
        ReportModel.reviewed_at >= today_start
    ).scalar() or 0
    
    reports_dismissed_week = db.query(func.count(ReportModel.id)).filter(
        ReportModel.status == ReportStatus.DISMISSED,
        ReportModel.reviewed_at >= week_start
    ).scalar() or 0
    
    reports_dismissed_month = db.query(func.count(ReportModel.id)).filter(
        ReportModel.status == ReportStatus.DISMISSED,
        ReportModel.reviewed_at >= month_start
    ).scalar() or 0
    
    # Статистика активности текущего модератора
    moderator_items_approved = db.query(func.count(ItemModel.id)).filter(
        ItemModel.moderation_status == ModerationStatus.APPROVED,
        ItemModel.moderated_by_id == current_user.id
    ).scalar() or 0
    
    moderator_items_rejected = db.query(func.count(ItemModel.id)).filter(
        ItemModel.moderation_status == ModerationStatus.REJECTED,
        ItemModel.moderated_by_id == current_user.id
    ).scalar() or 0
    
    moderator_items_today = db.query(func.count(ItemModel.id)).filter(
        ItemModel.moderated_by_id == current_user.id,
        ItemModel.moderated_at >= today_start
    ).scalar() or 0
    
    moderator_items_week = db.query(func.count(ItemModel.id)).filter(
        ItemModel.moderated_by_id == current_user.id,
        ItemModel.moderated_at >= week_start
    ).scalar() or 0
    
    moderator_reports_resolved = db.query(func.count(ReportModel.id)).filter(
        ReportModel.status == ReportStatus.RESOLVED,
        ReportModel.reviewed_by_id == current_user.id
    ).scalar() or 0
    
    moderator_reports_dismissed = db.query(func.count(ReportModel.id)).filter(
        ReportModel.status == ReportStatus.DISMISSED,
        ReportModel.reviewed_by_id == current_user.id
    ).scalar() or 0
    
    moderator_reports_today = db.query(func.count(ReportModel.id)).filter(
        ReportModel.reviewed_by_id == current_user.id,
        ReportModel.reviewed_at >= today_start
    ).scalar() or 0
    
    moderator_reports_week = db.query(func.count(ReportModel.id)).filter(
        ReportModel.reviewed_by_id == current_user.id,
        ReportModel.reviewed_at >= week_start
    ).scalar() or 0
    
    # Статистика для админов
    admin_stats = {}
    if current_user.role == UserRole.ADMIN:
        from app.models.user import User as UserModel
        total_users = db.query(func.count(UserModel.id)).scalar() or 0
        active_users = db.query(func.count(UserModel.id)).filter(
            UserModel.is_active == True
        ).scalar() or 0
        
        total_bookings = db.query(func.count(BookingModel.id)).scalar() or 0
        confirmed_bookings = db.query(func.count(BookingModel.id)).filter(
            BookingModel.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
        ).scalar() or 0
        
        total_items_active = db.query(func.count(ItemModel.id)).filter(
            ItemModel.is_active == True
        ).scalar() or 0
        
        admin_stats = {
            "users": {
                "total": total_users,
                "active": active_users
            },
            "bookings": {
                "total": total_bookings,
                "confirmed": confirmed_bookings
            },
            "items": {
                "active": total_items_active
            }
        }
    
    return {
        "items": {
            "total": items_total,
            "pending": items_pending,
            "approved": items_approved,
            "rejected": items_rejected,
            "periods": {
                "approved": {
                    "today": items_approved_today,
                    "week": items_approved_week,
                    "month": items_approved_month
                },
                "rejected": {
                    "today": items_rejected_today,
                    "week": items_rejected_week,
                    "month": items_rejected_month
                }
            }
        },
        "reports": {
            "total": reports_total,
            "pending": reports_pending,
            "resolved": reports_resolved,
            "dismissed": reports_dismissed,
            "periods": {
                "resolved": {
                    "today": reports_resolved_today,
                    "week": reports_resolved_week,
                    "month": reports_resolved_month
                },
                "dismissed": {
                    "today": reports_dismissed_today,
                    "week": reports_dismissed_week,
                    "month": reports_dismissed_month
                }
            }
        },
        "moderator": {
            "items": {
                "approved": moderator_items_approved,
                "rejected": moderator_items_rejected,
                "today": moderator_items_today,
                "week": moderator_items_week
            },
            "reports": {
                "resolved": moderator_reports_resolved,
                "dismissed": moderator_reports_dismissed,
                "today": moderator_reports_today,
                "week": moderator_reports_week
            }
        },
        "admin": admin_stats
    }





