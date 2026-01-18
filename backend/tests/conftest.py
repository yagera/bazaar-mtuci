"""
Pytest configuration and shared fixtures for all tests.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from app.core.database import Base, get_db
from app.main import app
from app.models.user import User as UserModel, UserRole
from app.models.item import Item as ItemModel, ModerationStatus, ItemType, ItemCategory
from app.core.security import get_password_hash
from faker import Faker

fake = Faker(['ru_RU', 'en_US'])


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session: Session):
    """Create a test client with database override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session: Session) -> UserModel:
    """Create a test user."""
    user = UserModel(
        email=fake.email(),
        username=fake.user_name(),
        hashed_password=get_password_hash("testpassword123"),
        full_name=fake.name(),
        room_number=str(fake.random_int(min=100, max=999)),
        dormitory=fake.random_int(min=1, max=3),
        telegram_username=f"@{fake.user_name()}",
        is_active=True,
        role=UserRole.USER
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_moderator(db_session: Session) -> UserModel:
    """Create a test moderator user."""
    user = UserModel(
        email=fake.email(),
        username=fake.user_name(),
        hashed_password=get_password_hash("testpassword123"),
        full_name=fake.name(),
        room_number=str(fake.random_int(min=100, max=999)),
        dormitory=fake.random_int(min=1, max=3),
        is_active=True,
        role=UserRole.MODERATOR
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_admin(db_session: Session) -> UserModel:
    """Create a test admin user."""
    user = UserModel(
        email=fake.email(),
        username=fake.user_name(),
        hashed_password=get_password_hash("testpassword123"),
        full_name=fake.name(),
        is_active=True,
        role=UserRole.ADMIN
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(client, test_user):
    """Get authentication headers for test user."""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": test_user.username, "password": "testpassword123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def moderator_headers(client, test_moderator):
    """Get authentication headers for moderator."""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": test_moderator.username, "password": "testpassword123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_item(db_session: Session, test_user: UserModel) -> ItemModel:
    """Create a test item."""
    item = ItemModel(
        title=fake.sentence(nb_words=3),
        description=fake.text(max_nb_chars=200),
        item_type=ItemType.RENT,
        price_per_hour=100.00,
        price_per_day=500.00,
        owner_id=test_user.id,
        dormitory=test_user.dormitory,
        category=ItemCategory.ELECTRONICS,
        is_active=True,
        moderation_status=ModerationStatus.APPROVED
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)
    return item


@pytest.fixture
def test_item_for_sale(db_session: Session, test_user: UserModel) -> ItemModel:
    """Create a test item for sale."""
    item = ItemModel(
        title=fake.sentence(nb_words=3),
        description=fake.text(max_nb_chars=200),
        item_type=ItemType.SALE,
        sale_price=5000.00,
        owner_id=test_user.id,
        dormitory=test_user.dormitory,
        category=ItemCategory.ELECTRONICS,
        is_active=True,
        moderation_status=ModerationStatus.APPROVED
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)
    return item

