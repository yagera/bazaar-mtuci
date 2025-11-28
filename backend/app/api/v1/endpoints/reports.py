from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.user import User as UserModel, UserRole
from app.models.item import Item as ItemModel
from app.models.report import Report as ReportModel, ReportStatus, ReportReason
from app.schemas.report import ReportCreate, ReportUpdate, Report as ReportSchema, ReportInDB
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


@router.post("/", response_model=ReportInDB, status_code=status.HTTP_201_CREATED)
def create_report(
    report: ReportCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(ItemModel).filter(ItemModel.id == report.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    
    if item.owner_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя пожаловаться на собственное объявление"
        )
    
    existing_report = db.query(ReportModel).filter(
        ReportModel.item_id == report.item_id,
        ReportModel.reporter_id == current_user.id,
        ReportModel.status == ReportStatus.PENDING
    ).first()
    
    if existing_report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы уже подали жалобу на это объявление"
        )
    
    db_report = ReportModel(
        item_id=report.item_id,
        reporter_id=current_user.id,
        reason=report.reason,
        description=report.description,
        status=ReportStatus.PENDING
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report


@router.get("/", response_model=List[ReportSchema])
def get_reports(
    status_filter: Optional[ReportStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: UserModel = Depends(require_moderator),
    db: Session = Depends(get_db)
):
    query = db.query(ReportModel)
    
    if status_filter:
        query = query.filter(ReportModel.status == status_filter)
    
    reports = query.order_by(ReportModel.created_at.desc()).offset(skip).limit(limit).all()
    return reports


@router.get("/pending", response_model=List[ReportSchema])
def get_pending_reports(
    current_user: UserModel = Depends(require_moderator),
    db: Session = Depends(get_db)
):
    reports = db.query(ReportModel).filter(
        ReportModel.status == ReportStatus.PENDING
    ).order_by(ReportModel.created_at.desc()).all()
    return reports


@router.get("/{report_id}", response_model=ReportSchema)
def get_report(
    report_id: int,
    current_user: UserModel = Depends(require_moderator),
    db: Session = Depends(get_db)
):
    report = db.query(ReportModel).filter(ReportModel.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Жалоба не найдена")
    return report


@router.put("/{report_id}", response_model=ReportSchema)
def update_report(
    report_id: int,
    report_update: ReportUpdate,
    current_user: UserModel = Depends(require_moderator),
    db: Session = Depends(get_db)
):
    report = db.query(ReportModel).filter(ReportModel.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Жалоба не найдена")
    
    if report_update.status:
        report.status = report_update.status
        report.reviewed_by_id = current_user.id
        report.reviewed_at = datetime.utcnow()
    
    if report_update.description is not None:
        report.description = report_update.description
    
    db.commit()
    db.refresh(report)
    return report


@router.post("/{report_id}/resolve", response_model=ReportSchema)
def resolve_report(
    report_id: int,
    current_user: UserModel = Depends(require_moderator),
    db: Session = Depends(get_db)
):
    report = db.query(ReportModel).filter(ReportModel.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Жалоба не найдена")
    
    report.status = ReportStatus.RESOLVED
    report.reviewed_by_id = current_user.id
    report.reviewed_at = datetime.utcnow()
    
    item = db.query(ItemModel).filter(ItemModel.id == report.item_id).first()
    if item:
        item.is_active = False
        item.moderation_status = ModerationStatus.REJECTED
    
    db.commit()
    db.refresh(report)
    return report


@router.post("/{report_id}/dismiss", response_model=ReportSchema)
def dismiss_report(
    report_id: int,
    current_user: UserModel = Depends(require_moderator),
    db: Session = Depends(get_db)
):
    report = db.query(ReportModel).filter(ReportModel.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Жалоба не найдена")
    
    report.status = ReportStatus.DISMISSED
    report.reviewed_by_id = current_user.id
    report.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(report)
    return report


@router.get("/stats/summary")
def get_report_stats(
    current_user: UserModel = Depends(require_moderator),
    db: Session = Depends(get_db)
):
    pending_count = db.query(ReportModel).filter(
        ReportModel.status == ReportStatus.PENDING
    ).count()
    
    resolved_count = db.query(ReportModel).filter(
        ReportModel.status == ReportStatus.RESOLVED
    ).count()
    
    dismissed_count = db.query(ReportModel).filter(
        ReportModel.status == ReportStatus.DISMISSED
    ).count()
    
    return {
        "pending": pending_count,
        "resolved": resolved_count,
        "dismissed": dismissed_count
    }


