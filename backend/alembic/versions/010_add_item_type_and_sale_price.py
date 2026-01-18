"""add item_type and sale_price

Revision ID: 010_item_type
Revises: 009_add_item_category
Create Date: 2026-01-09 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '010_item_type'
down_revision = '009_add_category'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Создаем enum для item_type
    itemtype_enum = sa.Enum('rent', 'sale', name='itemtype')
    itemtype_enum.create(op.get_bind(), checkfirst=True)
    
    # Добавляем колонку item_type
    op.add_column('items', sa.Column('item_type', itemtype_enum, nullable=False, server_default='rent'))
    
    # Делаем price_per_hour nullable (для продажи он не нужен)
    op.alter_column('items', 'price_per_hour',
                    existing_type=sa.Numeric(10, 2),
                    nullable=True)
    
    # Добавляем колонку sale_price
    op.add_column('items', sa.Column('sale_price', sa.Numeric(10, 2), nullable=True))
    
    # Создаем индекс для item_type
    op.create_index(op.f('ix_items_item_type'), 'items', ['item_type'], unique=False)


def downgrade() -> None:
    # Удаляем индекс
    op.drop_index(op.f('ix_items_item_type'), table_name='items')
    
    # Удаляем колонку sale_price
    op.drop_column('items', 'sale_price')
    
    # Возвращаем price_per_hour в not nullable (но только если все записи имеют значение)
    op.alter_column('items', 'price_per_hour',
                    existing_type=sa.Numeric(10, 2),
                    nullable=False)
    
    # Удаляем колонку item_type
    op.drop_column('items', 'item_type')
    
    # Удаляем enum
    op.execute('DROP TYPE IF EXISTS itemtype')

