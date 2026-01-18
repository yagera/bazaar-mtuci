"""
Tests for moderation endpoints.
"""
import pytest
from fastapi import status
from app.models.item import Item as ItemModel, ModerationStatus


@pytest.mark.moderation
class TestModeration:
    """Test moderation endpoints."""

    def test_get_pending_items(self, client, moderator_headers, db_session, test_user):
        """Test getting pending items for moderation."""
        # Create pending item
        item = ItemModel(
            title="Pending Item",
            description="Test",
            item_type="rent",
            price_per_hour=100.00,
            owner_id=test_user.id,
            category="electronics",
            moderation_status=ModerationStatus.PENDING
        )
        db_session.add(item)
        db_session.commit()
        
        response = client.get("/api/v1/moderation/pending", headers=moderator_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_get_pending_items_unauthorized(self, client, auth_headers):
        """Test that regular user cannot access moderation."""
        response = client.get("/api/v1/moderation/pending", headers=auth_headers)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_approve_item(self, client, moderator_headers, db_session, test_user):
        """Test approving an item."""
        item = ItemModel(
            title="Pending Item",
            description="Test",
            item_type="rent",
            price_per_hour=100.00,
            owner_id=test_user.id,
            category="electronics",
            moderation_status=ModerationStatus.PENDING
        )
        db_session.add(item)
        db_session.commit()
        
        response = client.post(
            f"/api/v1/moderation/{item.id}/approve",
            headers=moderator_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["moderation_status"] == "approved"
        
        db_session.refresh(item)
        assert item.moderation_status == ModerationStatus.APPROVED
        assert item.moderated_by_id is not None
        assert item.moderated_at is not None

    def test_reject_item(self, client, moderator_headers, db_session, test_user):
        """Test rejecting an item."""
        item = ItemModel(
            title="Pending Item",
            description="Test",
            item_type="rent",
            price_per_hour=100.00,
            owner_id=test_user.id,
            category="electronics",
            moderation_status=ModerationStatus.PENDING
        )
        db_session.add(item)
        db_session.commit()
        
        response = client.post(
            f"/api/v1/moderation/{item.id}/reject?comment=Inappropriate content",
            headers=moderator_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["moderation_status"] == "rejected"
        assert data["moderation_comment"] == "Inappropriate content"
        assert data["is_active"] == False

    def test_get_moderation_stats(self, client, moderator_headers, db_session, test_user):
        """Test getting moderation statistics."""
        response = client.get("/api/v1/moderation/stats", headers=moderator_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "pending" in data
        assert "approved" in data
        assert "rejected" in data
        assert isinstance(data["pending"], int)
        assert isinstance(data["approved"], int)
        assert isinstance(data["rejected"], int)

    def test_get_detailed_stats(self, client, moderator_headers):
        """Test getting detailed moderation statistics."""
        response = client.get("/api/v1/moderation/stats/detailed", headers=moderator_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "items" in data
        assert "reports" in data
        assert "moderator" in data
        assert "items" in data["items"]
        assert "periods" in data["items"]

