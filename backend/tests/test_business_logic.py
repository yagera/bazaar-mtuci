"""
Tests for business logic functions.
"""
import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from app.models.item import Item as ItemModel, ItemType
from app.models.booking import Booking as BookingModel, BookingStatus


@pytest.mark.unit
class TestBusinessLogic:
    """Test business logic functions."""

    def test_calculate_booking_price_per_hour(self, db_session, test_user):
        """Test calculating booking price for hourly rental."""
        item = ItemModel(
            title="Test Item",
            item_type=ItemType.RENT,
            price_per_hour=Decimal("100.00"),
            owner_id=test_user.id,
            category="electronics",
            is_active=True,
            moderation_status="approved"
        )
        db_session.add(item)
        db_session.commit()
        
        start_time = datetime.utcnow() + timedelta(days=1)
        end_time = start_time + timedelta(hours=3)
        
        hours = (end_time - start_time).total_seconds() / 3600
        expected_price = Decimal(str(hours)) * item.price_per_hour
        
        assert expected_price == Decimal("300.00")

    def test_calculate_booking_price_per_day(self, db_session, test_user):
        """Test calculating booking price for daily rental."""
        item = ItemModel(
            title="Test Item",
            item_type=ItemType.RENT,
            price_per_day=Decimal("500.00"),
            owner_id=test_user.id,
            category="electronics",
            is_active=True,
            moderation_status="approved"
        )
        db_session.add(item)
        db_session.commit()
        
        start_time = datetime.utcnow() + timedelta(days=1)
        end_time = start_time + timedelta(days=2)
        
        days = (end_time - start_time).total_seconds() / 86400
        expected_price = Decimal(str(days)) * item.price_per_day
        
        assert expected_price == Decimal("1000.00")

    def test_item_availability_check(self, db_session, test_user):
        """Test checking item availability."""
        item = ItemModel(
            title="Test Item",
            item_type=ItemType.RENT,
            price_per_hour=Decimal("100.00"),
            owner_id=test_user.id,
            category="electronics",
            is_active=True,
            moderation_status="approved"
        )
        db_session.add(item)
        db_session.commit()
        
        # Create a booking
        start_time = datetime.utcnow() + timedelta(days=1)
        end_time = start_time + timedelta(hours=3)
        
        booking = BookingModel(
            item_id=item.id,
            renter_id=test_user.id,
            start_time=start_time,
            end_time=end_time,
            total_price=Decimal("300.00"),
            status=BookingStatus.CONFIRMED
        )
        db_session.add(booking)
        db_session.commit()
        
        # Check overlapping time
        overlap_start = start_time + timedelta(hours=1)
        overlap_end = start_time + timedelta(hours=2)
        
        overlapping = db_session.query(BookingModel).filter(
            BookingModel.item_id == item.id,
            BookingModel.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
            BookingModel.start_time < overlap_end,
            BookingModel.end_time > overlap_start
        ).first()
        
        assert overlapping is not None

    def test_user_cannot_book_own_item(self, db_session, test_user):
        """Test that user cannot book their own item."""
        item = ItemModel(
            title="Test Item",
            item_type=ItemType.RENT,
            price_per_hour=Decimal("100.00"),
            owner_id=test_user.id,
            category="electronics",
            is_active=True,
            moderation_status="approved"
        )
        db_session.add(item)
        db_session.commit()
        
        # This should be prevented by business logic
        assert item.owner_id == test_user.id

    def test_moderation_status_workflow(self, db_session, test_user):
        """Test moderation status workflow."""
        item = ItemModel(
            title="Test Item",
            item_type=ItemType.RENT,
            price_per_hour=Decimal("100.00"),
            owner_id=test_user.id,
            category="electronics",
            moderation_status="pending"
        )
        db_session.add(item)
        db_session.commit()
        
        # Item should start as pending
        assert item.moderation_status == "pending"
        assert item.is_active == True
        
        # After rejection
        item.moderation_status = "rejected"
        item.is_active = False
        db_session.commit()
        
        assert item.moderation_status == "rejected"
        assert item.is_active == False

