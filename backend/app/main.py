from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.api.v1.api import api_router
from pathlib import Path
import logging
import traceback

app = FastAPI(
    title="Bazaar MTUCI API",
    description="Сервис аренды вещей для общежития МТУСИ",
    version="1.0.0",
)

# Расширяем список разрешенных origins для поддержки localhost, 0.0.0.0 и 127.0.0.1
cors_origins_extended = list(settings.cors_origins_list)
for origin in list(settings.cors_origins_list):
    # Добавляем варианты с 0.0.0.0 и 127.0.0.1 для каждого localhost origin
    if "localhost" in origin:
        cors_origins_extended.append(origin.replace("localhost", "0.0.0.0"))
        cors_origins_extended.append(origin.replace("localhost", "127.0.0.1"))
    elif "0.0.0.0" in origin:
        cors_origins_extended.append(origin.replace("0.0.0.0", "localhost"))
        cors_origins_extended.append(origin.replace("0.0.0.0", "127.0.0.1"))
    elif "127.0.0.1" in origin:
        cors_origins_extended.append(origin.replace("127.0.0.1", "localhost"))
        cors_origins_extended.append(origin.replace("127.0.0.1", "0.0.0.0"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_extended,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.middleware("http")
async def cors_handler(request: Request, call_next):
    if request.method == "OPTIONS":
        # Always return 200 for OPTIONS preflight requests
        origin = request.headers.get("origin")
        response = Response(status_code=200)
        
        # Нормализуем origin (0.0.0.0 и 127.0.0.1 эквивалентны localhost)
        normalized_origin = None
        if origin:
            # Заменяем 0.0.0.0 и 127.0.0.1 на localhost для проверки
            normalized_origin = origin.replace("0.0.0.0", "localhost").replace("127.0.0.1", "localhost")
        
        # Проверяем, разрешен ли origin (прямо или после нормализации)
        is_allowed = False
        if origin:
            is_allowed = origin in settings.cors_origins_list
            if not is_allowed and normalized_origin:
                is_allowed = normalized_origin in settings.cors_origins_list
        
        # Если origin разрешен, устанавливаем заголовки
        if is_allowed and origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        elif origin and (origin.startswith("http://localhost:") or 
                        origin.startswith("http://0.0.0.0:") or 
                        origin.startswith("http://127.0.0.1:")):
            # Разрешаем localhost, 0.0.0.0 и 127.0.0.1 на любых портах для разработки
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Max-Age"] = "3600"
        return response
    response = await call_next(request)
    return response

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    import json
    logger = logging.getLogger(__name__)
    logger.error(f"Validation error on {request.url.path}: {exc.errors()}")
    try:
        body = await request.json()
        logger.error(f"Request body: {json.dumps(body, indent=2)}")
    except Exception as e:
        logger.error(f"Could not read request body: {e}")
    return JSONResponse(
        status_code=400,
        content={"detail": exc.errors()}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Глобальный обработчик исключений для предотвращения падения сервера"""
    logger = logging.getLogger(__name__)
    logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    
    # Если это HTTPException, просто пробрасываем дальше
    from fastapi import HTTPException
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=exc.headers
        )
    
    # Для всех остальных исключений возвращаем 500
    return JSONResponse(
        status_code=500,
        content={"detail": "Внутренняя ошибка сервера. Пожалуйста, попробуйте позже."}
    )

app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    """Initialize AI moderation model on startup if enabled"""
    if settings.AI_MODERATION_ENABLED and settings.AI_MODERATION_MODEL_DIR:
        try:
            # Lazy import to avoid requiring torch when AI moderation is disabled
            try:
                from app.ai_moderation.model import CLIPModerationModel
                from app.ai_moderation.predictor import ImageModerationPredictor
                from app.core.ai_service import initialize_predictor
            except ImportError as import_error:
                logger = logging.getLogger(__name__)
                logger.warning(f"AI moderation dependencies not available: {import_error}")
                logger.warning("Install torch, transformers, and aiohttp to enable AI moderation")
                return
            
            logger = logging.getLogger(__name__)
            logger.info("Initializing AI moderation model...")
            
            model_dir = Path(settings.AI_MODERATION_MODEL_DIR)
            if not model_dir.exists():
                logger.warning(f"AI moderation model directory not found: {model_dir}")
                return
            
            # Initialize model
            model = CLIPModerationModel(
                model_dir=model_dir,
                model_name=settings.AI_MODERATION_MODEL_NAME,
                device=settings.AI_MODERATION_DEVICE
            )
            
            # Load models
            model.load_config()
            model.load_models()
            
            # Create predictor and initialize service
            predictor = ImageModerationPredictor(model)
            initialize_predictor(predictor)
            
            logger.info("✓ AI moderation model loaded successfully")
        
        except ImportError as import_error:
            logger = logging.getLogger(__name__)
            logger.warning(f"AI moderation dependencies not available: {import_error}")
            logger.warning("Install torch, transformers, and aiohttp to enable AI moderation")
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to initialize AI moderation model: {e}", exc_info=True)
            logger.warning("AI moderation will be unavailable, falling back to manual moderation")


@app.get("/")
async def root():
    return {"message": "Bazaar MTUCI API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}

