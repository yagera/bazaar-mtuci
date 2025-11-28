#!/bin/bash

echo "🚀 Запуск Bazaar MTUCI..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для проверки команды
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 не установлен. Пожалуйста, установите $1${NC}"
        exit 1
    fi
}

# Проверка зависимостей
echo -e "${YELLOW}Проверка зависимостей...${NC}"
check_command python3
check_command node
check_command npm

# Проверка PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL не найден. Убедитесь, что база данных доступна.${NC}"
fi

# Backend setup
echo -e "${GREEN}📦 Настройка Backend...${NC}"
cd backend

# Создание виртуального окружения если не существует
if [ ! -d "venv" ]; then
    echo "Создание виртуального окружения..."
    python3 -m venv venv
fi

# Активация виртуального окружения
source venv/bin/activate

# Установка зависимостей
if [ ! -f "venv/.installed" ]; then
    echo "Установка Python зависимостей..."
    pip install -q -r requirements.txt
    touch venv/.installed
fi

# Создание .env если не существует
if [ ! -f ".env" ]; then
    echo "Создание .env файла..."
    cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bazaar_mtuci
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
EOF
    echo -e "${GREEN}✅ .env файл создан. Проверьте настройки базы данных!${NC}"
fi

# Инициализация базы данных (если нужно)
echo "Проверка базы данных..."
python3 -c "
import sys
try:
    from app.core.database import engine
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    if not tables:
        print('Инициализация базы данных...')
        from app.core.database import Base
        Base.metadata.create_all(bind=engine)
        print('✅ База данных инициализирована')
    else:
        print('✅ База данных уже настроена')
except Exception as e:
    print(f'⚠️  Ошибка подключения к БД: {e}')
    print('Убедитесь, что PostgreSQL запущен и настройки в .env корректны')
" 2>/dev/null || echo -e "${YELLOW}⚠️  Не удалось проверить БД. Продолжаем...${NC}"

cd ..

# Frontend setup
echo -e "${GREEN}📦 Настройка Frontend...${NC}"
cd frontend

# Установка зависимостей
if [ ! -d "node_modules" ]; then
    echo "Установка Node.js зависимостей..."
    npm install --silent
fi

# Создание .env.local если не существует
if [ ! -f ".env.local" ]; then
    echo "Создание .env.local файла..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
fi

cd ..

# Функция для очистки при выходе
cleanup() {
    echo -e "\n${YELLOW}Остановка серверов...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    # Убиваем все процессы связанные с проектом
    pkill -f "python.*run.py" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Запуск backend
echo -e "${GREEN}🚀 Запуск Backend сервера...${NC}"
cd backend
source venv/bin/activate
python3 run.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Небольшая задержка для запуска backend
sleep 2

# Запуск frontend
echo -e "${GREEN}🚀 Запуск Frontend сервера...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}✅ Серверы запущены!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📱 Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}🔧 Backend API: http://localhost:8000${NC}"
echo -e "${GREEN}📚 API Docs: http://localhost:8000/docs${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Логи Backend: tail -f backend.log${NC}"
echo -e "${YELLOW}Логи Frontend: tail -f frontend.log${NC}"
echo -e "${YELLOW}Для остановки нажмите Ctrl+C${NC}"
echo ""

# Ожидание завершения процессов
echo -e "${GREEN}Серверы работают. Нажмите Ctrl+C для остановки${NC}"
wait $BACKEND_PID $FRONTEND_PID

