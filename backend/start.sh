#!/bin/bash

echo "Запуск Bazaar MTUCI Backend..."

if [ ! -f .env ]; then
    echo "Ошибка: файл .env не найден!"
    echo "Создайте файл .env с необходимыми переменными окружения."
    exit 1
fi

if [ -d "venv" ]; then
    source venv/bin/activate
fi

python run.py




