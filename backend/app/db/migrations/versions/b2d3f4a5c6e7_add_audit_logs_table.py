"""add audit_logs table

Revision ID: b2d3f4a5c6e7
Revises: a1c2e3d4f5b6
Create Date: 2026-10-24 20:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b2d3f4a5c6e7'
down_revision: Union[str, None] = 'a1c2e3d4f5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('actor_email', sa.String(length=320), nullable=False),
        sa.Column('actor_id', sa.UUID(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('target_tenant_id', sa.UUID(), nullable=True),
        sa.Column('detail', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_audit_logs_created', 'audit_logs', ['created_at'], unique=False)
    op.create_index('idx_audit_logs_target', 'audit_logs', ['target_tenant_id'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_audit_logs_target', table_name='audit_logs')
    op.drop_index('idx_audit_logs_created', table_name='audit_logs')
    op.drop_table('audit_logs')
