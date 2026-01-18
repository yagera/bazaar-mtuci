from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.core.database import get_db
from app.models.user import User as UserModel
from app.models.item import Item as ItemModel
from app.models.favorite import Favorite as FavoriteModel
from app.schemas.item import Item as ItemSchema
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.post("/items/{item_id}/favorite", status_code=status.HTTP_201_CREATED)
def add_to_favorites(
    item_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Добавить товар в избранное"""
    # Проверяем существование товара
    item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Проверяем, не добавлен ли уже в избранное
    existing_favorite = db.query(FavoriteModel).filter(
        FavoriteModel.user_id == current_user.id,
        FavoriteModel.item_id == item_id
    ).first()
    
    if existing_favorite:
        raise HTTPException(status_code=400, detail="Item already in favorites")
    
    # Создаем новую запись в избранном
    favorite = FavoriteModel(
        user_id=current_user.id,
        item_id=item_id
    )
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    
    return {"message": "Item added to favorites", "favorite_id": favorite.id}


@router.delete("/items/{item_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_favorites(
    item_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить товар из избранного"""
    # Проверяем существование товара
    item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    favorite = db.query(FavoriteModel).filter(
        FavoriteModel.user_id == current_user.id,
        FavoriteModel.item_id == item_id
    ).first()
    
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    db.delete(favorite)
    db.commit()
    return None


@router.get("/favorites", response_model=List[ItemSchema])
def get_favorites(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить список избранных товаров пользователя"""
    favorites = db.query(FavoriteModel).filter(
        FavoriteModel.user_id == current_user.id
    ).all()
    
    item_ids = [favorite.item_id for favorite in favorites]
    items = db.query(ItemModel).filter(ItemModel.id.in_(item_ids)).all()
    
    return items


@router.get("/items/{item_id}/favorite/status")
def get_favorite_status(
    item_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Проверить, добавлен ли товар в избранное текущим пользователем"""
    favorite = db.query(FavoriteModel).filter(
        FavoriteModel.user_id == current_user.id,
        FavoriteModel.item_id == item_id
    ).first()
    
    return {"is_favorite": favorite is not None}


@router.post("/items/{item_id}/view", status_code=status.HTTP_200_OK)
def increment_view_count(
    item_id: int,
    db: Session = Depends(get_db)
):
    """Увеличить счетчик просмотров товара"""
    item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.view_count = (item.view_count or 0) + 1
    db.commit()
    db.refresh(item)
    
    return {"view_count": item.view_count}


@router.get("/items/{item_id}/stats")
def get_item_stats(
    item_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить статистику товара (просмотры, количество в избранном, статус избранного для текущего пользователя)"""
    item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Количество добавлений в избранное
    favorites_count = db.query(func.count(FavoriteModel.id)).filter(
        FavoriteModel.item_id == item_id
    ).scalar() or 0
    
    # Проверяем, добавлен ли в избранное текущим пользователем
    is_favorite = False
    if current_user:
        favorite = db.query(FavoriteModel).filter(
            FavoriteModel.user_id == current_user.id,
            FavoriteModel.item_id == item_id
        ).first()
        is_favorite = favorite is not None
    
    return {
        "view_count": item.view_count or 0,
        "favorites_count": favorites_count,
        "is_favorite": is_favorite
    }

