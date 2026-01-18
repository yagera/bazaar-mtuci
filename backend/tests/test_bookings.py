"""
Tests for bookings endpoints and business logic.
"""
import pytest
from fastapi import status
from datetime import datetime, timedelta
from app.models.booking import Booking as BookingModel, BookingStatus
from app.models.item import Item as ItemModel, ItemType


@pytest.mark.bookings
class TestBookings:
    """Test bookings endpoints."""

    def test_create_booking(self, client, auth_headers, test_item, test_user, db_session):
        """Test creating a booking."""
        start_time = datetime.utcnow() + timedelta(days=1)
        end_time = start_time + timedelta(hours=3)
        
        response = client.post(
            "/api/v1/bookings/",
            headers=auth_headers,
            json={
                "item_id": test_item.id,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat()
            }
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["item_id"] == test_item.id
        assert data["status"] == "pending"
        assert "total_price" in data

    def test_create_booking_own_item(self, client, auth_headers, test_item):
        """Test that owner cannot book own item."""
        start_time = datetime.utcnow() + timedelta(days=1)
        end_time = start_time + timedelta(hours=3)
        
        response = client.post(
            "/api/v1/bookings/",
            headers=auth_headers,
            json={
                "item_id": test_item.id,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat()
            }
        )
        # Should fail because test_item is owned by test_user
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_booking_past_time(self, client, auth_headers, test_item):
        """Test that booking cannot be created for past time."""
        start_time = datetime.utcnow() - timedelta(days=1)
        end_time = start_time + timedelta(hours=3)
        
        response = client.post(
            "/api/v1/bookings/",
            headers=auth_headers,
            json={
                "item_id": test_item.id,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat()
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_booking_invalid_time_range(self, client, auth_headers, test_item):
        """Test that end_time must be after start_time."""
        start_time = datetime.utcnow() + timedelta(days=1)
        end_time = start_time - timedelta(hours=1)
        
        response = client.post(
            "/api/v1/bookings/",
            headers=auth_headers,
            json={
                "item_id": test_item.id,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat()
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_my_bookings(self, client, auth_headers, test_user, db_session):
        """Test getting user's bookings."""
        # Create a booking first
        from app.models.item import Item as ItemModel
        other_user = db_session.query(ItemModel).filter(
            ItemModel.owner_id != test_user.id
        ).first()
        
        if other_user:
            start_time = datetime.utcnow() + timedelta(days=1)
            end_time = start_time + timedelta(hours=3)
            
            client.post(
                "/api/v1/bookings/",
                headers=auth_headers,
                json={
                    "item_id": other_user.id,
                    "start_time": start_time.isoformat(),
                    "end_time": end_time.isoformat()
                }
            )
        
        response = client.get("/api/v1/bookings/me", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

    def test_confirm_booking_as_owner(self, client, auth_headers, test_item, test_user, db_session):
        """Test confirming booking as item owner."""
        # Create another user and booking
        from app.models.user import User as UserModel
        from app.core.security import get_password_hash
        renter = UserModel(
            email="renter@example.com",
            username="renter",
            hashed_password=get_password_hash("password123"),
            is_active=True
        )
        db_session.add(renter)
        db_session.commit()
        
        start_time = datetime.utcnow() + timedelta(days=1)
        end_time = start_time + timedelta(hours=3)
        
        booking = BookingModel(
            item_id=test_item.id,
            renter_id=renter.id,
            start_time=start_time,
            end_time=end_time,
            total_price=300.00,
            status=BookingStatus.PENDING
        )
        db_session.add(booking)
        db_session.commit()
        
        response = client.post(
            f"/api/v1/bookings/{booking.id}/confirm",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "confirmed"

    def test_cancel_booking(self, client, auth_headers, test_user, db_session):
        """Test canceling own booking."""
        from app.models.user import User as UserModel
        from app.models.item import Item as ItemModel
        from app.core.security import get_password_hash
        
        owner = UserModel(
            email="owner@example.com",
            username="owner",
            hashed_password=get_password_hash("password123"),
            is_active=True
        )
        db_session.add(owner)
        
        item = ItemModel(
            title="Test Item",
            item_type=ItemType.RENT,
            price_per_hour=100.00,
            owner_id=owner.id,
            category="electronics",
            is_active=True,
            moderation_status="approved"
        )
        db_session.add(item)
        db_session.commit()
        
        start_time = datetime.utcnow() + timedelta(days=1)
        end_time = start_time + timedelta(hours=3)
        
        booking = BookingModel(
            item_id=item.id,
            renter_id=test_user.id,
            start_time=start_time,
            end_time=end_time,
            total_price=300.00,
            status=BookingStatus.PENDING
        )
        db_session.add(booking)
        db_session.commit()
        
        response = client.post(
            f"/api/v1/bookings/{booking.id}/cancel",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "cancelled"

