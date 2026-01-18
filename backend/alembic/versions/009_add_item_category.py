"""Add category to items

Revision ID: 009_add_category
Revises: 008_fix_fkeys
Create Date: 2026-01-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '009_add_category'
down_revision = '008_fix_fkeys'  # Must match revision in 008_fix_notifications_foreign_keys.py
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum type for item categories
    itemcategory_enum = sa.Enum('electronics', 'clothing', 'furniture', 'books', 'sports', 'kitchen', 'tools', 'games', 'cosmetics', 'other', name='itemcategory')
    itemcategory_enum.create(op.get_bind(), checkfirst=True)
    
    # Add category column to items table
    op.add_column('items', sa.Column('category', itemcategory_enum, nullable=False, server_default='other'))
    
    # Create index on category for faster filtering
    op.create_index(op.f('ix_items_category'), 'items', ['category'], unique=False)


def downgrade() -> None:
    # Drop index
    op.drop_index(op.f('ix_items_category'), table_name='items')
    
    # Drop column
    op.drop_column('items', 'category')
    
    # Drop enum type
    op.execute('DROP TYPE IF EXISTS itemcategory')

