from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CORS_ORIGINS: str = "http://localhost:3000"
    
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: Optional[str] = None
    AWS_S3_ENDPOINT_URL: Optional[str] = None
    
    # AI Moderation settings
    AI_MODERATION_ENABLED: bool = False
    AI_MODERATION_MODEL_DIR: Optional[str] = None  # Path to model directory, e.g., "/home/gera/clip"
    AI_MODERATION_MODEL_NAME: str = "openai/clip-vit-base-patch32"
    AI_MODERATION_DEVICE: Optional[str] = None  # "cuda" or "cpu", auto-detects if None
    AI_MODERATION_MIN_CONFIDENCE_REJECT: float = 0.7
    AI_MODERATION_AUTO_APPROVE_CONFIDENCE: float = 0.85
    AI_MODERATION_AUTO_REJECT_CONFIDENCE: float = 0.90

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()

