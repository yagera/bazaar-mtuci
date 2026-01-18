"""
Сервис для создания уведомлений
"""
from sqlalchemy.orm import Session
from app.models.notification import Notification as NotificationModel, NotificationType
from datetime import datetime


def create_notification(
    db: Session,
    user_id: int,
    notification_type: NotificationType,
    title: str,
    message: str,
    related_item_id: int = None,
    related_booking_id: int = None,
    related_report_id: int = None,
):
    """Создает новое уведомление"""
    notification = NotificationModel(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        related_item_id=related_item_id,
        related_booking_id=related_booking_id,
        related_report_id=related_report_id,
        is_read=False,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def create_item_removed_notification(
    db: Session,
    owner_id: int,
    item_id: int,
    report_id: int,
    item_title: str,
):
    """Создает уведомление о снятии объявления из-за жалобы"""
    return create_notification(
        db=db,
        user_id=owner_id,
        notification_type=NotificationType.ITEM_REMOVED_BY_REPORT,
        title="Объявление снято из-за жалобы",
        message=f'Ваше объявление "{item_title}" было снято с публикации из-за жалобы.',
        related_item_id=item_id,
        related_report_id=report_id,
    )


def create_item_approved_notification(
    db: Session,
    owner_id: int,
    item_id: int,
    item_title: str,
):
    """Создает уведомление об одобрении объявления"""
    return create_notification(
        db=db,
        user_id=owner_id,
        notification_type=NotificationType.ITEM_APPROVED,
        title="Объявление одобрено",
        message=f'Ваше объявление "{item_title}" было одобрено и опубликовано.',
        related_item_id=item_id,
    )


def create_item_rejected_notification(
    db: Session,
    owner_id: int,
    item_id: int,
    item_title: str,
    comment: str = None,
):
    """Создает уведомление об отклонении объявления"""
    message = f'Ваше объявление "{item_title}" было отклонено.'
    if comment:
        message += f' Причина: {comment}'
    
    return create_notification(
        db=db,
        user_id=owner_id,
        notification_type=NotificationType.ITEM_REJECTED,
        title="Объявление отклонено",
        message=message,
        related_item_id=item_id,
    )


def create_new_booking_notification(
    db: Session,
    owner_id: int,
    booking_id: int,
    item_id: int,
    item_title: str,
    renter_username: str,
):
    """Создает уведомление о новом бронировании"""
    return create_notification(
        db=db,
        user_id=owner_id,
        notification_type=NotificationType.NEW_BOOKING_REQUEST,
        title="Новое бронирование",
        message=f'Пользователь {renter_username} хочет забронировать ваше объявление "{item_title}".',
        related_item_id=item_id,
        related_booking_id=booking_id,
    )


def create_booking_confirmed_notification(
    db: Session,
    renter_id: int,
    booking_id: int,
    item_id: int,
    item_title: str,
):
    """Создает уведомление о подтверждении бронирования (для арендатора)"""
    return create_notification(
        db=db,
        user_id=renter_id,
        notification_type=NotificationType.BOOKING_CONFIRMED,
        title="Бронирование подтверждено",
        message=f'Ваше бронирование объявления "{item_title}" было подтверждено.',
        related_item_id=item_id,
        related_booking_id=booking_id,
    )


def create_booking_rejected_notification(
    db: Session,
    renter_id: int,
    booking_id: int,
    item_id: int,
    item_title: str,
):
    """Создает уведомление об отклонении бронирования (для арендатора)"""
    return create_notification(
        db=db,
        user_id=renter_id,
        notification_type=NotificationType.BOOKING_REJECTED,
        title="Бронирование отклонено",
        message=f'Ваше бронирование объявления "{item_title}" было отклонено владельцем.',
        related_item_id=item_id,
        related_booking_id=booking_id,
    )


def create_booking_cancelled_by_owner_notification(
    db: Session,
    renter_id: int,
    booking_id: int,
    item_id: int,
    item_title: str,
):
    """Создает уведомление об отмене бронирования владельцем (для арендатора)"""
    return create_notification(
        db=db,
        user_id=renter_id,
        notification_type=NotificationType.BOOKING_CANCELLED_BY_OWNER,
        title="Бронирование отменено",
        message=f'Владелец отменил ваше бронирование объявления "{item_title}".',
        related_item_id=item_id,
        related_booking_id=booking_id,
    )


def create_booking_cancelled_by_renter_notification(
    db: Session,
    owner_id: int,
    booking_id: int,
    item_id: int,
    item_title: str,
    renter_username: str,
):
    """Создает уведомление об отмене бронирования арендатором (для владельца)"""
    return create_notification(
        db=db,
        user_id=owner_id,
        notification_type=NotificationType.BOOKING_CANCELLED_BY_RENTER,
        title="Бронирование отменено",
        message=f'Пользователь {renter_username} отменил бронирование вашего объявления "{item_title}".',
        related_item_id=item_id,
        related_booking_id=booking_id,
    )


