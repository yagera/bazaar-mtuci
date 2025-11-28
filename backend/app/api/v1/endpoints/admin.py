from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models.user import User as UserModel, UserRole
from app.schemas.user import User as UserSchema, UserUpdate
from app.api.v1.endpoints.auth import get_current_user


class RoleUpdate(BaseModel):
    role: UserRole


router = APIRouter()


def require_admin(current_user: UserModel = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Требуются права администратора"
        )
    return current_user


@router.get("/users", response_model=List[UserSchema])
def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[UserRole] = None,
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(UserModel)
    
    if search:
        query = query.filter(
            (UserModel.username.ilike(f"%{search}%")) |
            (UserModel.email.ilike(f"%{search}%"))
        )
    
    if role:
        query = query.filter(UserModel.role == role)
    
    users = query.offset(skip).limit(limit).all()
    return users


@router.put("/users/{user_id}/role", response_model=UserSchema)
def update_user_role(
    user_id: int,
    role_update: RoleUpdate = Body(...),
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя изменить свою собственную роль"
        )
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    user.role = role_update.role
    db.commit()
    db.refresh(user)
    return user


@router.get("/users/{user_id}", response_model=UserSchema)
def get_user(
    user_id: int,
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


@router.get("/stats")
def get_admin_stats(
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    from app.models.item import Item as ItemModel, ModerationStatus
    from app.models.report import Report as ReportModel, ReportStatus
    
    total_users = db.query(UserModel).count()
    total_moderators = db.query(UserModel).filter(UserModel.role == UserRole.MODERATOR).count()
    total_admins = db.query(UserModel).filter(UserModel.role == UserRole.ADMIN).count()
    
    total_items = db.query(ItemModel).count()
    pending_items = db.query(ItemModel).filter(ItemModel.moderation_status == ModerationStatus.PENDING).count()
    
    total_reports = db.query(ReportModel).count()
    pending_reports = db.query(ReportModel).filter(ReportModel.status == ReportStatus.PENDING).count()
    
    return {
        "users": {
            "total": total_users,
            "moderators": total_moderators,
            "admins": total_admins
        },
        "items": {
            "total": total_items,
            "pending_moderation": pending_items
        },
        "reports": {
            "total": total_reports,
            "pending": pending_reports
        }
    }

