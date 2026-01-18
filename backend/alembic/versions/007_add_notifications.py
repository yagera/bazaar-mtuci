"""Add notifications table

Revision ID: 007_add_notifications
Revises: 8a9471f1502b
Create Date: 2025-01-01 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '007_add_notifications'
down_revision = '8a9471f1502b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum type for notification types
    op.execute("DO $$ BEGIN CREATE TYPE notificationtype AS ENUM ('ITEM_REMOVED_BY_REPORT', 'ITEM_APPROVED', 'ITEM_REJECTED', 'NEW_BOOKING_REQUEST', 'BOOKING_CANCELLED_BY_RENTER', 'BOOKING_CONFIRMED', 'BOOKING_REJECTED', 'BOOKING_CANCELLED_BY_OWNER'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    notificationtype_enum = postgresql.ENUM('ITEM_REMOVED_BY_REPORT', 'ITEM_APPROVED', 'ITEM_REJECTED', 'NEW_BOOKING_REQUEST', 'BOOKING_CANCELLED_BY_RENTER', 'BOOKING_CONFIRMED', 'BOOKING_REJECTED', 'BOOKING_CANCELLED_BY_OWNER', name='notificationtype', create_type=False)
    
    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', notificationtype_enum, nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('related_item_id', sa.Integer(), nullable=True),
        sa.Column('related_booking_id', sa.Integer(), nullable=True),
        sa.Column('related_report_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['related_item_id'], ['items.id'], ),
        sa.ForeignKeyConstraint(['related_booking_id'], ['bookings.id'], ),
        sa.ForeignKeyConstraint(['related_report_id'], ['reports.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    op.create_index(op.f('ix_notifications_is_read'), 'notifications', ['is_read'], unique=False)
    op.create_index(op.f('ix_notifications_created_at'), 'notifications', ['created_at'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_notifications_created_at'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_is_read'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    
    # Drop notifications table
    op.drop_table('notifications')
    
    # Drop enum type
    op.execute('DROP TYPE notificationtype')

