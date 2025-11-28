from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.user import User as UserModel, UserRole
from app.models.item import Item as ItemModel, ModerationStatus
from app.schemas.item import Item as ItemSchema
from app.api.v1.endpoints.auth import get_current_user
from datetime import datetime


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
    items = db.query(ItemModel).filter(
        ItemModel.moderation_status == ModerationStatus.PENDING
    ).offset(skip).limit(limit).all()
    return items


@router.post("/{item_id}/approve", response_model=ItemSchema)
def approve_item(
    item_id: int,
    current_user: UserModel = Depends(require_moderator),
    db: Session = Depends(get_db)
):
    item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    
    item.moderation_status = ModerationStatus.APPROVED
    item.moderated_by_id = current_user.id
    item.moderated_at = datetime.utcnow()
    item.moderation_comment = None
    
    db.commit()
    db.refresh(item)
    return item


@router.post("/{item_id}/reject", response_model=ItemSchema)
def reject_item(
    item_id: int,
    comment: Optional[str] = Query(None, description="Причина отклонения"),
    current_user: UserModel = Depends(require_moderator),
    db: Session = Depends(get_db)
):
    item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    
    item.moderation_status = ModerationStatus.REJECTED
    item.moderated_by_id = current_user.id
    item.moderated_at = datetime.utcnow()
    item.moderation_comment = comment
    item.is_active = False
    
    db.commit()
    db.refresh(item)
    return item


@router.get("/stats")
def get_moderation_stats(
    current_user: UserModel = Depends(require_moderator),
    db: Session = Depends(get_db)
):
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


