"""
AI Moderation Module for Image Content Moderation
Uses fine-tuned CLIP model for classifying images
"""

# Lazy imports to avoid requiring torch when AI moderation is disabled
__all__ = ["ImageModerationPredictor"]

def __getattr__(name):
    if name == "ImageModerationPredictor":
        from app.ai_moderation.predictor import ImageModerationPredictor
        return ImageModerationPredictor
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

