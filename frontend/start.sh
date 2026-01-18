#!/bin/bash

# Скрипт для запуска frontend сервера

echo "Запуск Bazaar MTUCI Frontend..."

# Проверка наличия node_modules
if [ ! -d "node_modules" ]; then
    echo "Установка зависимостей..."
    npm install
fi

# Запуск dev сервера
npm run dev








