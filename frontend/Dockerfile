FROM node:20-alpine

WORKDIR /app

# Копирование package файлов
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование остальных файлов
COPY . .

# Открытие порта
EXPOSE 3000

# Команда по умолчанию
CMD ["npm", "run", "dev"]





