from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User as UserModel
from app.core.s3 import upload_file_to_s3, delete_file_from_s3
from app.core.config import settings
import io
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_user)
):
    if not settings.AWS_S3_BUCKET or not settings.AWS_ACCESS_KEY_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="S3/MinIO не настроен. Используйте URL изображения."
        )
    
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Неподдерживаемый тип файла. Разрешены: {', '.join(allowed_types)}"
        )
    
    file_content = await file.read()
    if len(file_content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Размер файла не должен превышать 5MB"
        )
    
    try:
        url = upload_file_to_s3(
            file_content=file_content,
            filename=file.filename or "image.jpg",
            content_type=file.content_type or "image/jpeg"
        )
        
        # AI moderation check (if enabled)
        if settings.AI_MODERATION_ENABLED:
            try:
                # Lazy import to avoid requiring torch when AI moderation is disabled
                from app.core.ai_service import moderate_image_auto
                
                moderation_result = await moderate_image_auto(
                    image_url=url,
                    category=None,
                    min_confidence_for_rejection=settings.AI_MODERATION_AUTO_REJECT_CONFIDENCE
                )
                
                # If image is rejected with high confidence, delete it and return error
                if (
                    moderation_result["status"] == "rejected" and
                    moderation_result["auto_action"] and
                    moderation_result["confidence"] >= settings.AI_MODERATION_AUTO_REJECT_CONFIDENCE
                ):
                    # Extract S3 key from URL to delete the file
                    try:
                        # Extract S3 key from URL (format: .../bazaar-images/items/filename.jpg)
                        if "/" in url:
                            # Find the part after the bucket name
                            if "/items/" in url:
                                s3_key = "items/" + url.split("/items/")[-1]
                            else:
                                # Fallback: try to extract from end of URL
                                parts = url.split("/")
                                if len(parts) >= 2:
                                    s3_key = parts[-2] + "/" + parts[-1]
                                else:
                                    s3_key = parts[-1]
                            delete_file_from_s3(s3_key)
                    except Exception as delete_error:
                        logger.warning(f"Failed to delete rejected image: {delete_error}")
                    
                    reason_map = {
                        "rejected_nsfw": "Неприемлемое содержимое (NSFW)",
                        "rejected_violence": "Насилие или оружие",
                        "rejected_spam": "Спам или реклама"
                    }
                    reason = reason_map.get(moderation_result["reason"], "Неприемлемое содержимое")
                    
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Изображение не прошло автоматическую модерацию: {reason}. Пожалуйста, загрузите другое изображение."
                    )
                
                # Include moderation result in response
                return {
                    "url": url,
                    "moderation": {
                        "status": moderation_result["status"],
                        "confidence": moderation_result["confidence"],
                        "auto_action": moderation_result["auto_action"]
                    }
                }
            
            except HTTPException:
                # Re-raise HTTP exceptions (like rejection errors)
                raise
            except Exception as mod_error:
                # Log moderation error but don't block upload
                logger.warning(f"AI moderation check failed: {mod_error}", exc_info=True)
                # Continue with upload, image will be manually moderated
        
        return {"url": url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка загрузки файла: {str(e)}"
        )

