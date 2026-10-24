"""add allowed_domains to tenants

Revision ID: a1c2e3d4f5b6
Revises: f8b23c91d4e2
Create Date: 2026-10-24 20:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1c2e3d4f5b6'
down_revision: Union[str, None] = 'f8b23c91d4e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'tenants',
        sa.Column(
            'allowed_domains',
            postgresql.ARRAY(sa.String()),
            server_default=sa.text("'{}'::text[]"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column('tenants', 'allowed_domains')
