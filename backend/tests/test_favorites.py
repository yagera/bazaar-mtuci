"""
Tests for favorites endpoints.
"""
import pytest
from fastapi import status
from app.models.favorite import Favorite as FavoriteModel


@pytest.mark.items
class TestFavorites:
    """Test favorites endpoints."""

    def test_add_to_favorites(self, client, auth_headers, test_item, test_user):
        """Test adding item to favorites."""
        response = client.post(
            f"/api/v1/favorites/{test_item.id}",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["item_id"] == test_item.id
        assert data["user_id"] == test_user.id

    def test_remove_from_favorites(self, client, auth_headers, test_item, test_user, db_session):
        """Test removing item from favorites."""
        # Add to favorites first
        favorite = FavoriteModel(
            user_id=test_user.id,
            item_id=test_item.id
        )
        db_session.add(favorite)
        db_session.commit()
        
        response = client.delete(
            f"/api/v1/favorites/{test_item.id}",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_get_favorites(self, client, auth_headers, test_item, test_user, db_session):
        """Test getting user's favorites."""
        # Add to favorites first
        favorite = FavoriteModel(
            user_id=test_user.id,
            item_id=test_item.id
        )
        db_session.add(favorite)
        db_session.commit()
        
        response = client.get("/api/v1/favorites/", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(item["id"] == test_item.id for item in data)

    def test_get_favorite_count(self, client, test_item, db_session):
        """Test getting favorite count for an item."""
        # Add multiple favorites
        from app.models.user import User as UserModel
        from app.core.security import get_password_hash
        
        for i in range(3):
            user = UserModel(
                email=f"user{i}@example.com",
                username=f"user{i}",
                hashed_password=get_password_hash("password123"),
                is_active=True
            )
            db_session.add(user)
            db_session.flush()
            
            favorite = FavoriteModel(
                user_id=user.id,
                item_id=test_item.id
            )
            db_session.add(favorite)
        
        db_session.commit()
        
        response = client.get(f"/api/v1/favorites/{test_item.id}/count")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["count"] >= 3

