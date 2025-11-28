# Настройка AWS S3 для загрузки изображений

## Шаг 1: Создание AWS аккаунта (если еще нет)

1. Перейдите на https://aws.amazon.com/
2. Создайте аккаунт или войдите в существующий

## Шаг 2: Создание S3 Bucket

1. Войдите в AWS Console
2. Перейдите в сервис **S3**
3. Нажмите **"Create bucket"**
4. Заполните форму:
   - **Bucket name**: `bazaar-mtuci-images` (или любое уникальное имя)
   - **Region**: Выберите ближайший регион (например, `eu-central-1` для Европы)
   - **Block Public Access**: **СНИМИТЕ ГАЛОЧКУ** (нужно для публичного доступа к изображениям)
     - Снимите все 4 галочки
     - Подтвердите в диалоге
   - **Bucket Versioning**: Оставьте отключенным
   - **Default encryption**: Можно включить (опционально)
5. Нажмите **"Create bucket"**

## Шаг 3: Настройка CORS (Cross-Origin Resource Sharing)

1. Откройте созданный bucket
2. Перейдите на вкладку **"Permissions"**
3. Прокрутите до **"Cross-origin resource sharing (CORS)"**
4. Нажмите **"Edit"** и вставьте:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:3001"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

5. Сохраните изменения

## Шаг 4: Настройка Bucket Policy (для публичного доступа)

1. В том же разделе **"Permissions"**
2. Прокрутите до **"Bucket policy"**
3. Нажмите **"Edit"** и вставьте (замените `YOUR-BUCKET-NAME` на имя вашего bucket):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

4. Сохраните изменения

## Шаг 5: Создание IAM пользователя для доступа

1. Перейдите в сервис **IAM** (Identity and Access Management)
2. В меню слева выберите **"Users"**
3. Нажмите **"Create user"**
4. Имя пользователя: `bazaar-mtuci-s3-user`
5. Нажмите **"Next"**
6. Выберите **"Attach policies directly"**
7. Найдите и выберите политику **"AmazonS3FullAccess"** (или создайте более ограниченную)
8. Нажмите **"Next"** и затем **"Create user"**

## Шаг 6: Создание Access Keys

1. Откройте созданного пользователя
2. Перейдите на вкладку **"Security credentials"**
3. Прокрутите до **"Access keys"**
4. Нажмите **"Create access key"**
5. Выберите **"Application running outside AWS"**
6. Нажмите **"Next"** и затем **"Create access key"**
7. **ВАЖНО**: Скопируйте:
   - **Access key ID**
   - **Secret access key** (показывается только один раз!)

## Шаг 7: Настройка .env файла

Добавьте в `backend/.env`:

```env
AWS_ACCESS_KEY_ID=ваш-access-key-id
AWS_SECRET_ACCESS_KEY=ваш-secret-access-key
AWS_REGION=ваш-region (например: eu-central-1)
AWS_S3_BUCKET=ваш-bucket-name
```

## Шаг 8: Проверка настройки

Запустите скрипт проверки:

```bash
cd backend
python check_s3.py
```

## Альтернатива: Использование MinIO (локальный S3)

Если не хотите использовать AWS, можно использовать MinIO - локальный S3-совместимый сервер.





