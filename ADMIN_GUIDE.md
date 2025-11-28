# Руководство по управлению ролями

## Как выдать роль пользователю

### Способ 1: Через панель администратора (рекомендуется)

1. Войдите в систему как администратор
2. Перейдите на страницу `/admin`
3. Найдите пользователя в списке
4. Выберите нужную роль в выпадающем списке
5. Подтвердите изменение

### Способ 2: Через скрипт (для первого администратора)

Если у вас еще нет администратора, используйте скрипт:

```bash
# В контейнере backend
docker compose exec backend python scripts/set_user_role.py <username_or_email> <role>

# Примеры:
docker compose exec backend python scripts/set_user_role.py admin@example.com admin
docker compose exec backend python scripts/set_user_role.py username moderator
```

### Способ 3: Через SQL (прямое изменение в БД)

```sql
-- Подключитесь к базе данных
docker compose exec postgres psql -U postgres -d bazaar

-- Измените роль пользователя
UPDATE users SET role = 'admin' WHERE username = 'your_username';
-- или
UPDATE users SET role = 'moderator' WHERE email = 'user@example.com';

-- Проверьте результат
SELECT id, username, email, role FROM users WHERE username = 'your_username';
```

### Способ 4: Через API (для разработчиков)

```bash
# Получите токен администратора
TOKEN="your_admin_token"

# Измените роль пользователя
curl -X PUT "http://localhost:8000/api/v1/admin/users/{user_id}/role" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

## Роли в системе

- **user** - Обычный пользователь (по умолчанию)
  - Может создавать объявления
  - Может бронировать вещи
  - Может жаловаться на объявления

- **moderator** - Модератор
  - Все права пользователя
  - Может одобрять/отклонять объявления
  - Может обрабатывать жалобы
  - Доступ к странице `/moderation`

- **admin** - Администратор
  - Все права модератора
  - Может изменять роли пользователей
  - Доступ к странице `/admin`
  - Доступ к статистике системы

## Создание первого администратора

1. Зарегистрируйте пользователя через обычную регистрацию
2. Используйте скрипт для выдачи роли администратора:

```bash
docker compose exec backend python scripts/set_user_role.py your_username admin
```

3. Войдите в систему и перейдите на `/admin` для управления другими пользователями

## Безопасность

- Только администраторы могут изменять роли
- Администратор не может изменить свою собственную роль
- Все изменения ролей логируются в базе данных


