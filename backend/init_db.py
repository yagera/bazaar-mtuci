"""
Скрипт для инициализации базы данных.
Использование: python init_db.py
"""
from app.core.database import Base, engine

if __name__ == "__main__":
    print("Создание таблиц в базе данных...")
    Base.metadata.create_all(bind=engine)
    print("Таблицы созданы успешно!")
    print("Примечание: Для продакшена используйте миграции Alembic: alembic upgrade head")








