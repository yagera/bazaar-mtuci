"""
Model loading and initialization for CLIP-based image moderation
"""

import torch
import torch.nn as nn
from transformers import CLIPProcessor, CLIPModel
from pathlib import Path
import json
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class CLIPClassificationHead(nn.Module):
    """
    Classification head for CLIP embeddings.
    Takes 512-dimensional CLIP embeddings and outputs 4-class logits.
    """
    
    def __init__(self, input_dim: int = 512, num_classes: int = 4):
        super().__init__()
        self.head = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, num_classes),
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: torch.Tensor of shape (batch_size, 512) - normalized CLIP embeddings
        
        Returns:
            logits: torch.Tensor of shape (batch_size, 4) - raw scores for each class
        """
        return self.head(x)


class CLIPModerationModel:
    """
    Wrapper class for loading and managing CLIP moderation model.
    """
    
    def __init__(
        self,
        model_dir: Path,
        model_name: str = "openai/clip-vit-base-patch32",
        device: Optional[str] = None
    ):
        """
        Initialize CLIP moderation model.
        
        Args:
            model_dir: Path to directory containing trained model files
            model_name: Hugging Face model name for CLIP
            device: Device to use ('cuda' or 'cpu'). Auto-detects if None.
        """
        self.model_dir = Path(model_dir)
        self.model_name = model_name
        
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        self.config: Optional[Dict[str, Any]] = None
        self.classes: Optional[list] = None
        self.processor: Optional[CLIPProcessor] = None
        self.clip_model: Optional[CLIPModel] = None
        self.classification_head: Optional[CLIPClassificationHead] = None
        
    def load_config(self) -> Dict[str, Any]:
        """Load model configuration from config.json"""
        config_path = self.model_dir / "config.json"
        if not config_path.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")
        
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        self.classes = self.config.get("classes", [
            "approved",
            "rejected_nsfw",
            "rejected_violence",
            "rejected_spam"
        ])
        
        logger.info(f"Loaded config: {self.config.get('model_name')}, classes: {self.classes}")
        return self.config
    
    def load_models(self):
        """Load CLIP model and trained classification head"""
        if self.config is None:
            self.load_config()
        
        # Load CLIP processor and model
        logger.info(f"Loading CLIP model: {self.model_name}")
        self.processor = CLIPProcessor.from_pretrained(self.model_name)
        self.clip_model = CLIPModel.from_pretrained(self.model_name)
        self.clip_model = self.clip_model.to(self.device)
        self.clip_model.eval()  # Set to evaluation mode
        
        # Freeze CLIP parameters
        for param in self.clip_model.parameters():
            param.requires_grad = False
        
        logger.info(f"CLIP model loaded on device: {self.device}")
        
        # Load classification head
        input_dim = self.config.get("input_dim", 512)
        num_classes = self.config.get("num_classes", 4)
        
        head_path = self.model_dir / "classification_head_best.pth"
        if not head_path.exists():
            raise FileNotFoundError(f"Classification head not found: {head_path}")
        
        logger.info(f"Loading classification head from {head_path}")
        self.classification_head = CLIPClassificationHead(
            input_dim=input_dim,
            num_classes=num_classes
        ).to(self.device)
        
        state_dict = torch.load(head_path, map_location=self.device)
        self.classification_head.load_state_dict(state_dict)
        self.classification_head.eval()  # Set to evaluation mode
        
        logger.info("Classification head loaded successfully")
    
    def is_loaded(self) -> bool:
        """Check if models are loaded"""
        return (
            self.processor is not None and
            self.clip_model is not None and
            self.classification_head is not None
        )
    
    def get_classes(self) -> list:
        """Get class names"""
        if self.classes is None:
            self.load_config()
        return self.classes

