from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User as UserModel
from app.core.s3 import upload_file_to_s3
from app.core.config import settings
import io

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
        
        return {"url": url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка загрузки файла: {str(e)}"
        )

