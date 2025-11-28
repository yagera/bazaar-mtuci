from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.report import ReportStatus, ReportReason
from app.schemas.user import User
from app.schemas.item import Item


class ReportBase(BaseModel):
    reason: ReportReason
    description: Optional[str] = None


class ReportCreate(BaseModel):
    item_id: int
    reason: ReportReason
    description: Optional[str] = None


class ReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None
    description: Optional[str] = None


class ReportInDB(ReportBase):
    id: int
    item_id: int
    reporter_id: int
    status: ReportStatus
    reviewed_by_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Report(ReportInDB):
    item: Item
    reporter: User
    reviewer: Optional[User] = None


