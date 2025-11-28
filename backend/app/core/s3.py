import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import uuid
from typing import Optional

s3_client = None


def get_s3_client():
    global s3_client
    if s3_client is None:
        client_config = {
            'aws_access_key_id': settings.AWS_ACCESS_KEY_ID,
            'aws_secret_access_key': settings.AWS_SECRET_ACCESS_KEY,
            'region_name': settings.AWS_REGION
        }
        
        if settings.AWS_S3_ENDPOINT_URL:
            client_config['endpoint_url'] = settings.AWS_S3_ENDPOINT_URL
        
        s3_client = boto3.client('s3', **client_config)
    return s3_client


def upload_file_to_s3(file_content: bytes, filename: str, content_type: str) -> str:
    try:
        file_extension = filename.split('.')[-1] if '.' in filename else 'jpg'
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        s3_key = f"items/{unique_filename}"
        
        s3_client = get_s3_client()
        
        put_params = {
            'Bucket': settings.AWS_S3_BUCKET,
            'Key': s3_key,
            'Body': file_content,
            'ContentType': content_type,
        }
        
        if not settings.AWS_S3_ENDPOINT_URL:
            put_params['ACL'] = 'public-read'
        
        s3_client.put_object(**put_params)
        
        if settings.AWS_S3_ENDPOINT_URL:
            endpoint = settings.AWS_S3_ENDPOINT_URL.replace('http://minio:', 'http://localhost:')
            url = f"{endpoint}/{settings.AWS_S3_BUCKET}/{s3_key}"
        else:
            url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
        return url
    except ClientError as e:
        raise Exception(f"Ошибка загрузки файла в S3: {str(e)}")


def delete_file_from_s3(s3_key: str) -> bool:
    try:
        if s3_key.startswith('http'):
            if '/bazaar-images/' in s3_key:
                s3_key = s3_key.split('/bazaar-images/')[-1]
            elif '.amazonaws.com/' in s3_key:
                s3_key = s3_key.split('.amazonaws.com/')[-1]
        
        s3_client = get_s3_client()
        s3_client.delete_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=s3_key
        )
        return True
    except ClientError as e:
        print(f"Ошибка удаления файла из S3: {str(e)}")
        return False

