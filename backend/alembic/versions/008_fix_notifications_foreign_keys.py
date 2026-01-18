"""Fix foreign keys in notifications table to allow item deletion

Revision ID: 008_fix_fkeys
Revises: 007_add_notifications
Create Date: 2025-01-01 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '008_fix_fkeys'
down_revision = '007_add_notifications'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Удаляем старые foreign key constraints
    op.drop_constraint('notifications_related_item_id_fkey', 'notifications', type_='foreignkey')
    op.drop_constraint('notifications_related_booking_id_fkey', 'notifications', type_='foreignkey')
    op.drop_constraint('notifications_related_report_id_fkey', 'notifications', type_='foreignkey')
    
    # Создаем новые constraints с ON DELETE SET NULL
    op.create_foreign_key(
        'notifications_related_item_id_fkey',
        'notifications', 'items',
        ['related_item_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'notifications_related_booking_id_fkey',
        'notifications', 'bookings',
        ['related_booking_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'notifications_related_report_id_fkey',
        'notifications', 'reports',
        ['related_report_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Удаляем новые constraints
    op.drop_constraint('notifications_related_item_id_fkey', 'notifications', type_='foreignkey')
    op.drop_constraint('notifications_related_booking_id_fkey', 'notifications', type_='foreignkey')
    op.drop_constraint('notifications_related_report_id_fkey', 'notifications', type_='foreignkey')
    
    # Восстанавливаем старые constraints без ON DELETE
    op.create_foreign_key(
        'notifications_related_item_id_fkey',
        'notifications', 'items',
        ['related_item_id'], ['id']
    )
    op.create_foreign_key(
        'notifications_related_booking_id_fkey',
        'notifications', 'bookings',
        ['related_booking_id'], ['id']
    )
    op.create_foreign_key(
        'notifications_related_report_id_fkey',
        'notifications', 'reports',
        ['related_report_id'], ['id']
    )

