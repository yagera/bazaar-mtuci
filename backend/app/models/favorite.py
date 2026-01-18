from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Уникальное ограничение: один пользователь не может добавить один товар дважды
    __table_args__ = (
        UniqueConstraint('user_id', 'item_id', name='unique_user_item_favorite'),
    )

    user = relationship("User", back_populates="favorites")
    item = relationship("Item", back_populates="favorites")

