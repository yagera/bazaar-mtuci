"""Add date to availability

Revision ID: 003_add_date_to_availability
Revises: 002_add_dormitory
Create Date: 2025-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003_add_date_to_availability'
down_revision = '002_add_dormitory'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add date column to availabilities table
    op.add_column('availabilities', sa.Column('date', sa.Date(), nullable=True))


def downgrade() -> None:
    # Remove date column from availabilities table
    op.drop_column('availabilities', 'date')






