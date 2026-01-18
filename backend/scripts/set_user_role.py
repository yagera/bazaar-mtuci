#!/usr/bin/env python3
"""
Скрипт для установки роли пользователю
Использование:
    python set_user_role.py <username_or_email> <role>
    
Роли: user, moderator, admin

Пример:
    python set_user_role.py admin@example.com admin
    python set_user_role.py username moderator
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.item import Item
from app.models.report import Report


def set_user_role(username_or_email: str, role: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()
        
        if not user:
            print(f"❌ Пользователь '{username_or_email}' не найден")
            return False
        
        try:
            user_role = UserRole(role.lower())
        except ValueError:
            print(f"❌ Неверная роль: {role}. Доступные роли: user, moderator, admin")
            return False
        
        old_role = user.role.value
        user.role = user_role
        db.commit()
        
        print(f"✅ Роль пользователя '{user.username}' изменена: {old_role} → {user_role.value}")
        print(f"   ID: {user.id}")
        print(f"   Email: {user.email}")
        return True
    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка: {e}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    
    username_or_email = sys.argv[1]
    role = sys.argv[2]
    
    success = set_user_role(username_or_email, role)
    sys.exit(0 if success else 1)




