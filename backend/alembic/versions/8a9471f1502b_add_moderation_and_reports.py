"""add_moderation_and_reports

Revision ID: 8a9471f1502b
Revises: 0623c46c157e
Create Date: 2025-11-25 19:02:08.505452

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '8a9471f1502b'
down_revision = '0623c46c157e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DO $$ BEGIN CREATE TYPE moderationstatus AS ENUM ('PENDING', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE userrole AS ENUM ('USER', 'MODERATOR', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE reportstatus AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE reportreason AS ENUM ('INAPPROPRIATE_CONTENT', 'SPAM', 'FAKE', 'SCAM', 'OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    userrole_enum = postgresql.ENUM('USER', 'MODERATOR', 'ADMIN', name='userrole', create_type=False)
    moderationstatus_enum = postgresql.ENUM('PENDING', 'APPROVED', 'REJECTED', name='moderationstatus', create_type=False)
    
    op.add_column('users', sa.Column('role', userrole_enum, nullable=True))
    op.execute("UPDATE users SET role = 'USER' WHERE role IS NULL")
    op.alter_column('users', 'role', nullable=False)
    
    op.add_column('items', sa.Column('moderation_status', moderationstatus_enum, nullable=True))
    op.execute("UPDATE items SET moderation_status = 'APPROVED' WHERE moderation_status IS NULL")
    op.alter_column('items', 'moderation_status', nullable=False)
    
    op.add_column('items', sa.Column('moderation_comment', sa.Text(), nullable=True))
    op.add_column('items', sa.Column('moderated_by_id', sa.Integer(), nullable=True))
    op.add_column('items', sa.Column('moderated_at', sa.DateTime(timezone=True), nullable=True))
    op.create_foreign_key('items_moderated_by_id_fkey', 'items', 'users', ['moderated_by_id'], ['id'])
    
    reportreason_enum = postgresql.ENUM('INAPPROPRIATE_CONTENT', 'SPAM', 'FAKE', 'SCAM', 'OTHER', name='reportreason', create_type=False)
    reportstatus_enum = postgresql.ENUM('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED', name='reportstatus', create_type=False)
    
    op.create_table('reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('reporter_id', sa.Integer(), nullable=False),
        sa.Column('reason', reportreason_enum, nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', reportstatus_enum, nullable=False),
        sa.Column('reviewed_by_id', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['item_id'], ['items.id'], ),
        sa.ForeignKeyConstraint(['reporter_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['reviewed_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reports_id'), 'reports', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_reports_id'), table_name='reports')
    op.drop_table('reports')
    op.drop_constraint('items_moderated_by_id_fkey', 'items', type_='foreignkey')
    op.drop_column('items', 'moderated_at')
    op.drop_column('items', 'moderated_by_id')
    op.drop_column('items', 'moderation_comment')
    op.drop_column('items', 'moderation_status')
    op.drop_column('users', 'role')
    
    op.execute("DROP TYPE IF EXISTS reportreason")
    op.execute("DROP TYPE IF EXISTS reportstatus")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS moderationstatus")




