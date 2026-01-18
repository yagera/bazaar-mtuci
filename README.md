<div align="center">

# 🏪 Bazaar MTUCI

**Платформа для аренды вещей в общежитии МТУСИ**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

## 📋 О проекте

Bazaar MTUCI — это современная веб-платформа, позволяющая студентам общежития МТУСИ сдавать в аренду и арендовать различные вещи. Платформа включает систему бронирования, модерацию контента, AI-модерацию изображений и полноценный административный интерфейс.

## ✨ Основные возможности

- 🔐 **Аутентификация и авторизация** (JWT, роли пользователей)
- 📦 **Управление объявлениями** (аренда и продажа)
- 📅 **Система бронирования** с проверкой доступности
- 🤖 **AI-модерация изображений** (CLIP-based)
- 👮 **Модерация контента** (ручная и автоматическая)
- 📊 **Административная панель** со статистикой
- 🔔 **Система уведомлений**
- ⭐ **Избранное**
- 🌐 **Многоязычность** (русский/английский)
- 📱 **Адаптивный дизайн**

## 🚀 Быстрый старт

### Требования

**Для Docker (рекомендуется):**
- Docker 20.10+
- Docker Compose 2.0+

**Для локального запуска:**
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### Вариант 1: Запуск через Docker (рекомендуется)

Этот способ самый простой и не требует установки зависимостей на вашем компьютере.

```bash
# 1. Клонировать репозиторий
git clone <repository-url>
cd bazaar-mtuci

# 2. Собрать Docker образы (первый запуск или после изменений)
docker compose build

# 3. Запустить все сервисы
docker compose up
```

**Что произойдет:**
- Автоматически установятся все зависимости
- Запустится PostgreSQL база данных
- Запустится MinIO для хранения файлов
- Запустится Backend API
- Запустится Frontend приложение
- Применятся миграции базы данных

**Готово!** Откройте в браузере:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (логин: minioadmin, пароль: minioadmin)

**Остановка:**
```bash
docker compose down
```

**Просмотр логов:**
```bash
docker compose logs -f
```

**Пересборка после изменений:**
```bash
docker compose build
docker compose up
```

### Вариант 2: Локальный запуск

Если у вас установлены Python, Node.js и PostgreSQL:

```bash
# 1. Клонировать репозиторий
git clone <repository-url>
cd bazaar-mtuci

# 2. Запустить через скрипт (автоматически установит зависимости)
chmod +x start.sh
./start.sh
```

Или вручную:

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Создать .env файл (см. раздел Конфигурация)
# Убедиться, что PostgreSQL запущен

# Применить миграции
alembic upgrade head

# Запустить backend
python run.py
```

```bash
# Frontend (в другом терминале)
cd frontend
npm install
npm run dev
```

**Готово!** Приложение будет доступно на тех же адресах.

## 🏗️ Технологический стек

### Backend
- **FastAPI** — веб-фреймворк
- **SQLAlchemy** — ORM
- **PostgreSQL** — база данных
- **Alembic** — миграции БД
- **JWT** — аутентификация
- **PyTorch** — AI-модерация
- **boto3** — S3/MinIO интеграция

### Frontend
- **Next.js 14** — React фреймворк
- **TypeScript** — типизация
- **Tailwind CSS** — стилизация
- **Framer Motion** — анимации
- **React Query** — управление состоянием
- **React Hook Form** — формы

### Инфраструктура
- **Docker** — контейнеризация
- **MinIO** — S3-совместимое хранилище
- **PostgreSQL** — база данных

## 📁 Структура проекта

```
bazaar-mtuci/
├── backend/           # FastAPI приложение
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── models/   # SQLAlchemy модели
│   │   ├── schemas/  # Pydantic схемы
│   │   ├── core/     # Конфигурация, БД, безопасность
│   │   └── ai_moderation/  # AI-модерация
│   └── alembic/      # Миграции БД
├── frontend/         # Next.js приложение
│   ├── app/          # Next.js App Router
│   ├── components/   # React компоненты
│   └── lib/          # Утилиты и конфигурация
└── docker-compose.yml
```

## 🔧 Конфигурация

### Для Docker

Все настройки уже настроены в `docker-compose.yml`. Дополнительная конфигурация не требуется для первого запуска.

### Для локального запуска

Создайте файл `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bazaar_mtuci
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# MinIO/S3 (если используете локальный MinIO)
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1
AWS_S3_BUCKET=bazaar-images
AWS_S3_ENDPOINT_URL=http://localhost:9000

# AI Moderation (опционально, можно оставить по умолчанию)
AI_MODERATION_ENABLED=false
```

**Генерация SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 📝 Первый запуск

### После запуска через Docker

1. **Создать первого администратора:**

```bash
# Зайти в контейнер backend
docker compose exec backend bash

# Установить роль администратора для пользователя
python scripts/set_user_role.py <username> admin

# Выйти из контейнера
exit
```

2. **Проверить работу:**
   - Откройте http://localhost:3000
   - Зарегистрируйте пользователя
   - Войдите в систему

### После локального запуска

1. **Применить миграции:**
```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

2. **Создать первого администратора:**
```bash
python scripts/set_user_role.py <username> admin
```

## 🧪 Тестирование

### Через Docker

```bash
# Backend тесты
docker compose exec backend pytest

# Frontend тесты
docker compose exec frontend npm test
```

### Локально

```bash
# Backend тесты
cd backend
source venv/bin/activate
pytest

# Frontend тесты
cd frontend
npm test
```

## 🛠️ Полезные команды

### Docker

```bash
# Пересобрать образы после изменений
docker compose build

# Запустить в фоновом режиме
docker compose up -d

# Остановить
docker compose down

# Посмотреть логи
docker compose logs -f

# Выполнить команду в контейнере
docker compose exec backend <command>
docker compose exec frontend <command>
```

### Миграции базы данных

```bash
# Через Docker
docker compose exec backend alembic upgrade head

# Локально
cd backend
source venv/bin/activate
alembic upgrade head
```

### Управление пользователями

```bash
# Через Docker
docker compose exec backend python scripts/set_user_role.py <username> <role>

# Локально
cd backend
source venv/bin/activate
python scripts/set_user_role.py <username> <role>
```

**Роли:** `user`, `moderator`, `admin`

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📝 Лицензия

MIT License

## 👥 Авторы

Разработано для общежития МТУСИ

---

<div align="center">
Made with ❤️ for MTUCI students
</div>
