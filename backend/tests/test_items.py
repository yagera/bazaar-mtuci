"""
Tests for items endpoints.
"""
import pytest
from fastapi import status
from app.models.item import Item as ItemModel, ModerationStatus, ItemType, ItemCategory
from decimal import Decimal


@pytest.mark.items
class TestItems:
    """Test items endpoints."""

    def test_create_item_rent(self, client, auth_headers, test_user):
        """Test creating a rent item."""
        response = client.post(
            "/api/v1/items/",
            headers=auth_headers,
            json={
                "title": "Test Item",
                "description": "Test description",
                "item_type": "rent",
                "price_per_hour": 100.00,
                "price_per_day": 500.00,
                "category": "electronics",
                "dormitory": test_user.dormitory
            }
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == "Test Item"
        assert data["item_type"] == "rent"
        assert float(data["price_per_hour"]) == 100.00
        assert data["moderation_status"] == "pending"

    def test_create_item_sale(self, client, auth_headers, test_user):
        """Test creating a sale item."""
        response = client.post(
            "/api/v1/items/",
            headers=auth_headers,
            json={
                "title": "Test Sale Item",
                "description": "Test description",
                "item_type": "sale",
                "sale_price": 5000.00,
                "category": "electronics",
                "dormitory": test_user.dormitory
            }
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["item_type"] == "sale"
        assert float(data["sale_price"]) == 5000.00
        assert data["price_per_hour"] is None

    def test_create_item_unauthorized(self, client):
        """Test creating item without authentication."""
        response = client.post(
            "/api/v1/items/",
            json={
                "title": "Test Item",
                "item_type": "rent",
                "price_per_hour": 100.00,
                "category": "electronics"
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_items(self, client, test_item):
        """Test getting list of items."""
        response = client.get("/api/v1/items/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(item["id"] == test_item.id for item in data)

    def test_get_items_filter_by_category(self, client, test_item):
        """Test filtering items by category."""
        response = client.get("/api/v1/items/?category=electronics")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert all(item["category"] == "electronics" for item in data)

    def test_get_items_filter_by_type(self, client, test_item, test_item_for_sale):
        """Test filtering items by type."""
        response = client.get("/api/v1/items/?item_type=rent")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert all(item["item_type"] == "rent" for item in data)

    def test_get_item_by_id(self, client, test_item):
        """Test getting item by ID."""
        response = client.get(f"/api/v1/items/{test_item.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_item.id
        assert data["title"] == test_item.title

    def test_get_item_not_found(self, client):
        """Test getting non-existent item."""
        response = client.get("/api/v1/items/99999")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_item(self, client, auth_headers, test_item):
        """Test updating own item."""
        response = client.put(
            f"/api/v1/items/{test_item.id}",
            headers=auth_headers,
            json={
                "title": "Updated Title",
                "description": "Updated description"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["description"] == "Updated description"

    def test_update_item_unauthorized(self, client, test_item):
        """Test updating item without authentication."""
        response = client.put(
            f"/api/v1/items/{test_item.id}",
            json={"title": "Updated Title"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_delete_item(self, client, auth_headers, test_item):
        """Test deleting own item."""
        response = client.delete(
            f"/api/v1/items/{test_item.id}",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify item is deleted
        get_response = client.get(f"/api/v1/items/{test_item.id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND

    def test_view_count_increment(self, client, test_item, test_user, db_session):
        """Test that view count increments when viewing item."""
        initial_count = test_item.view_count
        
        # View as different user (no auth)
        response = client.get(f"/api/v1/items/{test_item.id}")
        assert response.status_code == status.HTTP_200_OK
        
        db_session.refresh(test_item)
        assert test_item.view_count == initial_count + 1

    def test_view_count_not_increment_for_owner(self, client, auth_headers, test_item, db_session):
        """Test that view count doesn't increment for owner."""
        initial_count = test_item.view_count
        
        # View as owner
        response = client.get(
            f"/api/v1/items/{test_item.id}",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        
        db_session.refresh(test_item)
        assert test_item.view_count == initial_count

