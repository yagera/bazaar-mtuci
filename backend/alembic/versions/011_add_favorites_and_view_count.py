"""add favorites and view_count

Revision ID: 011_favorites
Revises: 010_item_type
Create Date: 2026-01-09 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '011_favorites'
down_revision = '010_item_type'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Добавляем поле view_count в таблицу items
    op.add_column('items', sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'))
    
    # Создаем таблицу favorites
    op.create_table(
        'favorites',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['item_id'], ['items.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'item_id', name='unique_user_item_favorite')
    )
    
    # Создаем индексы для быстрого поиска
    op.create_index(op.f('ix_favorites_user_id'), 'favorites', ['user_id'], unique=False)
    op.create_index(op.f('ix_favorites_item_id'), 'favorites', ['item_id'], unique=False)


def downgrade() -> None:
    # Удаляем индексы
    op.drop_index(op.f('ix_favorites_item_id'), table_name='favorites')
    op.drop_index(op.f('ix_favorites_user_id'), table_name='favorites')
    
    # Удаляем таблицу favorites
    op.drop_table('favorites')
    
    # Удаляем поле view_count
    op.drop_column('items', 'view_count')

