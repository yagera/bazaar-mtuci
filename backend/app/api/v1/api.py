from fastapi import APIRouter

api_router = APIRouter()

# Import endpoints (lazy import for moderation_ai to avoid requiring torch)
from app.api.v1.endpoints import auth, items, bookings, users, upload, moderation, reports, admin, notifications, favorites

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(moderation.router, prefix="/moderation", tags=["moderation"])

# Lazy import for moderation_ai to avoid requiring torch when AI moderation is disabled
try:
    from app.api.v1.endpoints import moderation_ai
    api_router.include_router(moderation_ai.router, prefix="/moderation/ai", tags=["moderation-ai"])
except ImportError:
    # AI moderation endpoints not available (torch not installed)
    pass

api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(favorites.router, tags=["favorites"])

