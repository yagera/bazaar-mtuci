.PHONY: help install start stop restart logs clean docker-start docker-stop

help:
	@echo "Bazaar MTUCI - Команды управления"
	@echo ""
	@echo "Локальная разработка:"
	@echo "  make install     - Установить все зависимости"
	@echo "  make start       - Запустить проект (одна команда)"
	@echo "  make stop        - Остановить серверы"
	@echo "  make logs        - Показать логи"
	@echo "  make clean       - Очистить зависимости и логи"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-start - Запустить через Docker Compose"
	@echo "  make docker-stop  - Остановить Docker контейнеры"
	@echo "  make docker-logs  - Показать логи Docker"

install:
	@echo "📦 Установка зависимостей..."
	@cd backend && python3 -m venv venv || true
	@cd backend && source venv/bin/activate && pip install -q -r requirements.txt
	@cd frontend && npm install --silent
	@echo "✅ Зависимости установлены"

start:
	@chmod +x start.sh
	@./start.sh

stop:
	@pkill -f "python.*run.py" || true
	@pkill -f "next dev" || true
	@echo "✅ Серверы остановлены"

logs:
	@echo "📋 Логи Backend:"
	@tail -n 20 backend.log 2>/dev/null || echo "Логи не найдены"
	@echo ""
	@echo "📋 Логи Frontend:"
	@tail -n 20 frontend.log 2>/dev/null || echo "Логи не найдены"

clean:
	@echo "🧹 Очистка..."
	@rm -rf backend/venv
	@rm -rf frontend/node_modules
	@rm -rf frontend/.next
	@rm -f backend.log frontend.log
	@echo "✅ Очистка завершена"

docker-start:
	@echo "🐳 Запуск через Docker..."
	@docker-compose up -d
	@echo "✅ Сервисы запущены"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000"

docker-stop:
	@echo "🛑 Остановка Docker контейнеров..."
	@docker-compose down
	@echo "✅ Контейнеры остановлены"

docker-logs:
	@docker-compose logs -f








