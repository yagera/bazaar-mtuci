from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Union
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    room_number: Optional[str] = None
    dormitory: Optional[int] = None  # 1, 2, or 3
    telegram_username: Optional[str] = None
    
    @field_validator('dormitory', mode='before')
    @classmethod
    def validate_dormitory(cls, v):
        if v is None or v == '':
            return None
        if isinstance(v, str):
            try:
                val = int(v)
                if val not in [1, 2, 3]:
                    return None
                return val
            except (ValueError, TypeError):
                return None
        if isinstance(v, int) and v not in [1, 2, 3]:
            return None
        return v


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    room_number: Optional[str] = None
    dormitory: Optional[int] = None
    telegram_username: Optional[str] = None
    password: Optional[str] = None


class UserInDB(UserBase):
    id: int
    is_active: bool
    role: UserRole
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class User(UserInDB):
    pass


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


