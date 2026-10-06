"""create chat_sessions and chat_messages tables

Revision ID: 44750554ab41
Revises: 7d32b6ea0771
Create Date: 2026-10-06 17:36:49.704692

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '44750554ab41'
down_revision: Union[str, None] = '7d32b6ea0771'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('chat_sessions',
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('visitor_id', sa.Text(), nullable=True),
    sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_sessions_tenant', 'chat_sessions', ['tenant_id'], unique=False)
    op.create_table('chat_messages',
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('session_id', sa.UUID(), nullable=False),
    sa.Column('role', sa.String(length=50), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('retrieved_chunk_ids', postgresql.ARRAY(sa.UUID()), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_messages_session', 'chat_messages', ['session_id'], unique=False)
    op.create_index(op.f('ix_chat_messages_tenant_id'), 'chat_messages', ['tenant_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_chat_messages_tenant_id'), table_name='chat_messages')
    op.drop_index('idx_messages_session', table_name='chat_messages')
    op.drop_table('chat_messages')
    op.drop_index('idx_sessions_tenant', table_name='chat_sessions')
    op.drop_table('chat_sessions')
