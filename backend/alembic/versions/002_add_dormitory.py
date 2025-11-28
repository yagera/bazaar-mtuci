"""Add dormitory fields

Revision ID: 002_add_dormitory
Revises: 001_initial
Create Date: 2025-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_add_dormitory'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add dormitory to users table
    op.add_column('users', sa.Column('dormitory', sa.Integer(), nullable=True))
    
    # Add dormitory to items table
    op.add_column('items', sa.Column('dormitory', sa.Integer(), nullable=True))


def downgrade() -> None:
    # Remove dormitory from items table
    op.drop_column('items', 'dormitory')
    
    # Remove dormitory from users table
    op.drop_column('users', 'dormitory')




