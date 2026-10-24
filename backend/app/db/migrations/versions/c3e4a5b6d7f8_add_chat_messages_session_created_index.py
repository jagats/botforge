"""add composite index on chat_messages(session_id, created_at)

Revision ID: c3e4a5b6d7f8
Revises: b2d3f4a5c6e7
Create Date: 2026-10-24 21:10:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'c3e4a5b6d7f8'
down_revision: Union[str, None] = 'b2d3f4a5c6e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        'idx_chat_messages_session_created',
        'chat_messages',
        ['session_id', 'created_at'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index('idx_chat_messages_session_created', table_name='chat_messages')
