"""Make date required and day_of_week optional

Revision ID: 004_date_required
Revises: 003_add_date_to_availability
Create Date: 2025-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '004_date_required'
down_revision = '003_add_date_to_availability'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Сначала делаем day_of_week nullable
    op.alter_column('availabilities', 'day_of_week',
                    existing_type=sa.Integer(),
                    nullable=True)
    
    # Затем делаем date NOT NULL
    # Для существующих записей без даты устанавливаем текущую дату
    op.execute("UPDATE availabilities SET date = CURRENT_DATE WHERE date IS NULL")
    
    op.alter_column('availabilities', 'date',
                    existing_type=sa.Date(),
                    nullable=False)


def downgrade() -> None:
    # Возвращаем обратно
    op.alter_column('availabilities', 'date',
                    existing_type=sa.Date(),
                    nullable=True)
    
    op.alter_column('availabilities', 'day_of_week',
                    existing_type=sa.Integer(),
                    nullable=False)

