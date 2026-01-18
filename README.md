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

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (или Docker)
- Docker & Docker Compose (рекомендуется)

### Установка и запуск

```bash
git clone <repository-url>
cd bazaar-mtuci
./start.sh
```

Или через Docker:

```bash
docker compose up
```

**Готово!** Откройте в браузере:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001

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

Создайте файл `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/bazaar_mtuci
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:3000

# MinIO/S3
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1
AWS_S3_BUCKET=bazaar-images
AWS_S3_ENDPOINT_URL=http://minio:9000

# AI Moderation (опционально)
AI_MODERATION_ENABLED=false
AI_MODERATION_MODEL_DIR=/path/to/model
AI_MODERATION_DEVICE=cpu
```

## 📚 Документация

Подробная документация доступна в файле [DOCS.md](DOCS.md):
- Установка и настройка
- API документация
- Администрирование
- AI-модерация
- Разработка и тестирование

## 🧪 Тестирование

```bash
# Backend тесты
cd backend
pytest

# Frontend тесты
cd frontend
npm test
```

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
