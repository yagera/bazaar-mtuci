from sqlalchemy import Column, Integer, String, Text, Numeric, ForeignKey, Boolean, DateTime, Enum, TypeDecorator
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class ModerationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ItemCategory(str, enum.Enum):
    ELECTRONICS = "electronics"  # Электроника
    CLOTHING = "clothing"  # Одежда и обувь
    FURNITURE = "furniture"  # Мебель
    BOOKS = "books"  # Книги и учебники
    SPORTS = "sports"  # Спорт и отдых
    KITCHEN = "kitchen"  # Кухонные принадлежности
    TOOLS = "tools"  # Инструменты
    GAMES = "games"  # Игры и развлечения
    COSMETICS = "cosmetics"  # Косметика и гигиена
    OTHER = "other"  # Другое


class ItemCategoryColumn(TypeDecorator):
    """Кастомный тип для ItemCategory, который всегда использует значение enum, а не имя"""
    impl = String
    cache_ok = True
    
    def __init__(self, length=20):
        super().__init__(length=length)
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, ItemCategory):
            return value.value  # Возвращаем значение 'electronics', 'kitchen' и т.д.
        if isinstance(value, str):
            # Если пришла строка, пытаемся преобразовать в enum и взять значение
            try:
                return ItemCategory(value.lower()).value
            except ValueError:
                # Если не получилось, пробуем найти по имени
                try:
                    return ItemCategory[value.upper()].value
                except KeyError:
                    return ItemCategory.OTHER.value
        return str(value).lower()
    
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return ItemCategory(value)


class ItemType(str, enum.Enum):
    RENT = "rent"  # Аренда
    SALE = "sale"  # Продажа


class ItemTypeColumn(TypeDecorator):
    """Кастомный тип для ItemType, который всегда использует значение enum, а не имя"""
    impl = String
    cache_ok = True
    
    def __init__(self, length=10):
        super().__init__(length=length)
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, ItemType):
            return value.value  # Возвращаем значение 'rent' или 'sale'
        if isinstance(value, str):
            # Если пришла строка, пытаемся преобразовать в enum и взять значение
            try:
                return ItemType(value.lower()).value
            except ValueError:
                # Если не получилось, пробуем найти по имени
                if value.upper() in ['RENT', 'SALE']:
                    return ItemType[value.upper()].value
                return ItemType.RENT.value
        return str(value).lower()
    
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return ItemType(value)


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    item_type = Column(ItemTypeColumn(), default=ItemType.RENT, nullable=False, index=True)
    price_per_hour = Column(Numeric(10, 2), nullable=True)  # Для аренды
    price_per_day = Column(Numeric(10, 2), nullable=True)  # Для аренды
    sale_price = Column(Numeric(10, 2), nullable=True)  # Для продажи
    image_url = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dormitory = Column(Integer, nullable=True)
    category = Column(ItemCategoryColumn(), default=ItemCategory.OTHER, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    moderation_status = Column(Enum(ModerationStatus), default=ModerationStatus.PENDING, nullable=False)
    moderation_comment = Column(Text, nullable=True)
    moderated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    moderated_at = Column(DateTime(timezone=True), nullable=True)
    view_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="items", foreign_keys=[owner_id])
    moderator = relationship("User", foreign_keys=[moderated_by_id])
    bookings = relationship("Booking", back_populates="item", cascade="all, delete-orphan")
    availabilities = relationship("Availability", back_populates="item", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="item", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="item", cascade="all, delete-orphan")


