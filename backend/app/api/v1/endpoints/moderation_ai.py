"""
API endpoints for AI-powered image moderation
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ModerationRequest(BaseModel):
    image_url: HttpUrl
    category: Optional[str] = None


class ModerationResponse(BaseModel):
    status: str  # "approved", "rejected", or "pending"
    reason: str  # exact class name
    confidence: float
    probabilities: Dict[str, float]
    processing_time_ms: int
    model: str
    auto_action: bool = False


class BatchModerationRequest(BaseModel):
    images: List[Dict[str, Any]]  # [{"url": "...", "category": "..."}]


class BatchModerationResponse(BaseModel):
    results: List[ModerationResponse]
    total_time_ms: int


@router.post("/check", response_model=ModerationResponse)
async def moderate_image(request: ModerationRequest):
    """
    Moderate a single image using AI model.
    
    Args:
        request: ModerationRequest with image_url and optional category
    
    Returns:
        ModerationResponse with prediction results
    """
    # Lazy import to avoid requiring torch when AI moderation is disabled
    try:
        from app.core.ai_service import get_predictor
    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail=f"AI moderation dependencies not available: {str(e)}"
        )
    
    predictor = get_predictor()
    if predictor is None:
        raise HTTPException(
            status_code=503,
            detail="AI moderation model is not available"
        )
    
    try:
        # Get prediction
        prediction = await predictor.predict_from_url(str(request.image_url))
        
        # Format for API
        result = predictor.format_prediction_for_api(prediction)
        result["auto_action"] = False  # API endpoint doesn't auto-approve/reject
        
        # Add category if provided
        if request.category:
            result["category"] = request.category
        
        return ModerationResponse(**result)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error moderating image: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error moderating image: {str(e)}")


@router.post("/batch", response_model=BatchModerationResponse)
async def moderate_images_batch(request: BatchModerationRequest):
    """
    Moderate multiple images in batch.
    
    Args:
        request: BatchModerationRequest with list of image URLs
    
    Returns:
        BatchModerationResponse with results for all images
    """
    import time
    start_time = time.time()
    
    # Lazy import to avoid requiring torch when AI moderation is disabled
    try:
        from app.core.ai_service import get_predictor
    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail=f"AI moderation dependencies not available: {str(e)}"
        )
    
    predictor = get_predictor()
    if predictor is None:
        raise HTTPException(
            status_code=503,
            detail="AI moderation model is not available"
        )
    
    results = []
    
    for image_data in request.images:
        image_url = image_data.get("url")
        category = image_data.get("category")
        
        if not image_url:
            results.append({
                "status": "pending",
                "reason": "invalid_url",
                "confidence": 0.0,
                "probabilities": {},
                "processing_time_ms": 0,
                "model": "error",
                "auto_action": False,
            })
            continue
        
        try:
            prediction = await predictor.predict_from_url(str(image_url))
            result = predictor.format_prediction_for_api(prediction)
            result["auto_action"] = False
            
            if category:
                result["category"] = category
            
            results.append(result)
        
        except Exception as e:
            logger.error(f"Error moderating image {image_url}: {e}")
            results.append({
                "status": "pending",
                "reason": "error",
                "confidence": 0.0,
                "probabilities": {},
                "processing_time_ms": 0,
                "model": "error",
                "auto_action": False,
                "error": str(e),
            })
    
    total_time_ms = int((time.time() - start_time) * 1000)
    
    return BatchModerationResponse(
        results=[ModerationResponse(**r) for r in results],
        total_time_ms=total_time_ms
    )

