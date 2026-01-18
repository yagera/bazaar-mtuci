"""
Image moderation predictor using fine-tuned CLIP model
"""

import torch
from PIL import Image
from typing import Dict, Any, Optional
import time
import logging

from app.ai_moderation.model import CLIPModerationModel
from app.ai_moderation.preprocessor import download_image_async, download_image_sync, load_image_from_bytes

logger = logging.getLogger(__name__)


class ImageModerationPredictor:
    """
    Predictor for image moderation using CLIP model.
    """
    
    def __init__(self, model: CLIPModerationModel):
        """
        Initialize predictor with loaded model.
        
        Args:
            model: Initialized CLIPModerationModel instance
        """
        if not model.is_loaded():
            raise ValueError("Model must be loaded before creating predictor")
        
        self.model = model
        self.classes = model.get_classes()
    
    def predict(self, image: Image.Image) -> Dict[str, Any]:
        """
        Predict moderation status for an image.
        
        Args:
            image: PIL.Image in RGB format
        
        Returns:
            dict with fields:
            - predicted_class: str, one of self.classes
            - confidence: float, 0.0-1.0
            - probabilities: dict with probabilities for all classes
            - processing_time_ms: int
        """
        start_time = time.time()
        
        inputs = self.model.processor(images=image, return_tensors="pt")
        pixel_values = inputs["pixel_values"].to(self.model.device)
        
        with torch.no_grad():
            vision_outputs = self.model.clip_model.vision_model(pixel_values)
            
            pooled_output = vision_outputs.pooler_output
            
            image_features = self.model.clip_model.visual_projection(pooled_output)
            
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            
            logits = self.model.classification_head(image_features)
            
            probs = torch.softmax(logits, dim=1)[0]
        
        predicted_idx = torch.argmax(probs).item()
        predicted_class = self.classes[predicted_idx]
        confidence = probs[predicted_idx].item()
        
        probabilities = {
            class_name: float(prob.item())
            for class_name, prob in zip(self.classes, probs)
        }
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        logger.debug(
            f"Prediction details - class: {predicted_class}, confidence: {confidence:.6f}, "
            f"probabilities: {probabilities}"
        )
        
        return {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "probabilities": probabilities,
            "processing_time_ms": processing_time_ms,
        }
    
    async def predict_from_url(self, image_url: str) -> Dict[str, Any]:
        """
        Predict moderation status for an image from URL (async).
        
        Args:
            image_url: URL of the image
        
        Returns:
            dict with prediction results (same format as predict())
        
        Raises:
            ValueError: If image cannot be downloaded or processed
        """
        image = await download_image_async(image_url)
        return self.predict(image)
    
    def predict_from_url_sync(self, image_url: str) -> Dict[str, Any]:
        """
        Predict moderation status for an image from URL (sync).
        
        Args:
            image_url: URL of the image
        
        Returns:
            dict with prediction results (same format as predict())
        
        Raises:
            ValueError: If image cannot be downloaded or processed
        """
        image = download_image_sync(image_url)
        return self.predict(image)
    
    def predict_from_bytes(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Predict moderation status for an image from bytes.
        
        Args:
            image_bytes: Image data as bytes
        
        Returns:
            dict with prediction results (same format as predict())
        
        Raises:
            ValueError: If image cannot be decoded
        """
        image = load_image_from_bytes(image_bytes)
        return self.predict(image)
    
    def format_prediction_for_api(self, prediction: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format prediction result for API response.
        
        Args:
            prediction: Raw prediction dict from predict()
        
        Returns:
            Formatted dict for API response:
            - status: "approved" or "rejected"
            - reason: exact class name
            - confidence: float
            - probabilities: dict
            - processing_time_ms: int
            - model: "trained"
        """
        predicted_class = prediction["predicted_class"]
        
        return {
            "status": "approved" if predicted_class == "approved" else "rejected",
            "reason": predicted_class,
            "confidence": prediction["confidence"],
            "probabilities": prediction["probabilities"],
            "processing_time_ms": prediction["processing_time_ms"],
            "model": "trained",
        }

