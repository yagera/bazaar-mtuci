"""
Скрипт для инициализации MinIO bucket
"""
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import time
import json

def init_minio():
    """Создает bucket в MinIO если его нет"""
    if not settings.AWS_S3_BUCKET:
        print("AWS_S3_BUCKET не настроен, пропускаем инициализацию MinIO")
        return
    
    if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
        print("AWS credentials не настроены, пропускаем инициализацию MinIO")
        return
    
    try:
        client_config = {
            'aws_access_key_id': settings.AWS_ACCESS_KEY_ID,
            'aws_secret_access_key': settings.AWS_SECRET_ACCESS_KEY,
            'region_name': settings.AWS_REGION
        }
        
        if settings.AWS_S3_ENDPOINT_URL:
            client_config['endpoint_url'] = settings.AWS_S3_ENDPOINT_URL
        
        s3_client = boto3.client('s3', **client_config)
        
        try:
            s3_client.head_bucket(Bucket=settings.AWS_S3_BUCKET)
            print(f"✅ Bucket '{settings.AWS_S3_BUCKET}' уже существует")
            try:
                current_policy = s3_client.get_bucket_policy(Bucket=settings.AWS_S3_BUCKET)
                policy_dict = json.loads(current_policy.get('Policy', '{}'))
                if policy_dict.get('Statement'):
                    print(f"✅ Bucket policy уже настроена")
                else:
                    raise Exception("Policy пустая")
            except (ClientError, Exception):
                bucket_policy = {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": "*"},
                            "Action": ["s3:GetObject"],
                            "Resource": [f"arn:aws:s3:::{settings.AWS_S3_BUCKET}/*"]
                        }
                    ]
                }
                try:
                    s3_client.put_bucket_policy(
                        Bucket=settings.AWS_S3_BUCKET,
                        Policy=json.dumps(bucket_policy)
                    )
                    print(f"✅ Bucket policy настроена для публичного доступа")
                except Exception as policy_error:
                    print(f"⚠️  Не удалось настроить bucket policy: {policy_error}")
                    if settings.AWS_S3_ENDPOINT_URL:
                        print("   Для MinIO настройте публичный доступ вручную через консоль (http://localhost:9001)")
                        print("   Bucket -> Access Policy -> Public")
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            if error_code in ['404', 'NoSuchBucket']:
                print(f"Создание bucket '{settings.AWS_S3_BUCKET}'...")
                
                if settings.AWS_S3_ENDPOINT_URL:
                    s3_client.create_bucket(Bucket=settings.AWS_S3_BUCKET)
                else:
                    s3_client.create_bucket(
                        Bucket=settings.AWS_S3_BUCKET,
                        CreateBucketConfiguration={'LocationConstraint': settings.AWS_REGION}
                    )
                
                bucket_policy = {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": "*"},
                            "Action": ["s3:GetObject"],
                            "Resource": [f"arn:aws:s3:::{settings.AWS_S3_BUCKET}/*"]
                        }
                    ]
                }
                
                try:
                    s3_client.put_bucket_policy(
                        Bucket=settings.AWS_S3_BUCKET,
                        Policy=json.dumps(bucket_policy)
                    )
                    print(f"✅ Bucket policy настроена для публичного доступа")
                except Exception as policy_error:
                    print(f"⚠️  Не удалось настроить bucket policy: {policy_error}")
                    if settings.AWS_S3_ENDPOINT_URL:
                        print("   Для MinIO настройте публичный доступ вручную через консоль (http://localhost:9001)")
                        print("   Bucket -> Access Policy -> Public")
                
                print(f"✅ Bucket '{settings.AWS_S3_BUCKET}' успешно создан!")
            else:
                print(f"Ошибка при проверке bucket: {e}")
        
    except Exception as e:
        print(f"⚠️  Ошибка инициализации MinIO: {e}")
        print("Продолжаем запуск, bucket может быть создан вручную через MinIO Console")

if __name__ == "__main__":
    print("Ожидание запуска MinIO...")
    time.sleep(5)
    init_minio()

