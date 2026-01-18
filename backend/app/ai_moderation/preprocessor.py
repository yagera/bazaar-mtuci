"""
Image preprocessing utilities for CLIP moderation model
"""

import aiohttp
import requests
from io import BytesIO
from PIL import Image
from typing import Union
import logging

logger = logging.getLogger(__name__)


async def download_image_async(url: str, timeout: int = 30) -> Image.Image:
    """
    Download image from URL asynchronously.
    
    Args:
        url: Image URL
        timeout: Request timeout in seconds
    
    Returns:
        PIL.Image in RGB format
    
    Raises:
        ValueError: If image cannot be downloaded or decoded
    """
    # Replace localhost:9000 with minio:9000 for Docker internal access
    # This is needed because AI moderation runs inside Docker container
    internal_url = url.replace('http://localhost:9000', 'http://minio:9000')
    internal_url = internal_url.replace('http://127.0.0.1:9000', 'http://minio:9000')
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(internal_url, timeout=aiohttp.ClientTimeout(total=timeout)) as response:
                if response.status != 200:
                    raise ValueError(f"Failed to download image: HTTP {response.status}")
                
                data = await response.read()
                image = Image.open(BytesIO(data))
                
                # Convert to RGB (handles RGBA, P, etc.)
                if image.mode != "RGB":
                    image = image.convert("RGB")
                
                return image
    
    except aiohttp.ClientError as e:
        logger.error(f"Error downloading image from {internal_url} (original: {url}): {e}")
        raise ValueError(f"Failed to download image: {str(e)}")
    except Exception as e:
        logger.error(f"Error processing image from {url}: {e}")
        raise ValueError(f"Failed to process image: {str(e)}")


def download_image_sync(url: str, timeout: int = 30) -> Image.Image:
    """
    Download image from URL synchronously.
    
    Args:
        url: Image URL
        timeout: Request timeout in seconds
    
    Returns:
        PIL.Image in RGB format
    
    Raises:
        ValueError: If image cannot be downloaded or decoded
    """
    try:
        response = requests.get(url, timeout=timeout, stream=True)
        response.raise_for_status()
        
        image = Image.open(BytesIO(response.content))
        
        # Convert to RGB (handles RGBA, P, etc.)
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        return image
    
    except requests.RequestException as e:
        logger.error(f"Error downloading image from {url}: {e}")
        raise ValueError(f"Failed to download image: {str(e)}")
    except Exception as e:
        logger.error(f"Error processing image from {url}: {e}")
        raise ValueError(f"Failed to process image: {str(e)}")


def load_image_from_bytes(image_bytes: bytes) -> Image.Image:
    """
    Load image from bytes.
    
    Args:
        image_bytes: Image data as bytes
    
    Returns:
        PIL.Image in RGB format
    
    Raises:
        ValueError: If image cannot be decoded
    """
    try:
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGB
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        return image
    
    except Exception as e:
        logger.error(f"Error loading image from bytes: {e}")
        raise ValueError(f"Failed to load image: {str(e)}")

