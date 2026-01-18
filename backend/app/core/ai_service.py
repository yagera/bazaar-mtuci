"""
AI Service for integrating image moderation into existing codebase
"""

from typing import Optional, Dict, Any, TYPE_CHECKING
import logging

logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from app.ai_moderation.predictor import ImageModerationPredictor

_predictor: Optional[Any] = None


def initialize_predictor(predictor):
    """Initialize global predictor instance"""
    global _predictor
    _predictor = predictor
    logger.info("AI moderation predictor initialized")


def get_predictor():
    """Get global predictor instance"""
    return _predictor


async def moderate_image_auto(
    image_url: str,
    category: Optional[str] = None,
    min_confidence_for_rejection: float = 0.7
) -> Dict[str, Any]:
    """
    Automatically moderate image using AI model.
    
    Args:
        image_url: URL of the image to moderate
        category: Optional item category (for logging/future use)
        min_confidence_for_rejection: Minimum confidence to reject (default: 0.7)
    
    Returns:
        dict with fields:
        - status: "approved", "rejected", or "pending"
        - reason: exact class name
        - confidence: float
        - probabilities: dict
        - processing_time_ms: int
        - model: "trained"
        - auto_action: bool - whether automatic action was taken
    
    Returns default "pending" if predictor is not available.
    """
    if _predictor is None:
        logger.warning("AI moderation predictor not initialized, returning pending")
        return {
            "status": "pending",
            "reason": "model_not_loaded",
            "confidence": 0.0,
            "probabilities": {},
            "processing_time_ms": 0,
            "model": "unavailable",
            "auto_action": False,
        }
    
    try:
        prediction = await _predictor.predict_from_url(image_url)
        
        result = _predictor.format_prediction_for_api(prediction)
        
        predicted_class = prediction["predicted_class"]
        confidence = prediction["confidence"]
        
        auto_action = False
        
        if predicted_class == "approved" and confidence > 0.85:
            result["status"] = "approved"
            result["auto_action"] = True
        
        elif predicted_class != "approved" and confidence > min_confidence_for_rejection:
            if confidence > 0.9:
                result["status"] = "rejected"
                result["auto_action"] = True
            else:
                result["status"] = "pending"
                result["auto_action"] = False
        
        else:
            result["status"] = "pending"
            result["auto_action"] = False
        
        if category:
            result["category"] = category
        
        logger.info(
            f"Image moderation: {image_url[:50]}... -> {result['status']} "
            f"(class: {predicted_class}, confidence: {confidence:.4f}, "
            f"probabilities: {prediction.get('probabilities', {})})"
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error moderating image {image_url}: {e}", exc_info=True)
        return {
            "status": "pending",
            "reason": "error",
            "confidence": 0.0,
            "probabilities": {},
            "processing_time_ms": 0,
            "model": "error",
            "auto_action": False,
            "error": str(e),
        }

