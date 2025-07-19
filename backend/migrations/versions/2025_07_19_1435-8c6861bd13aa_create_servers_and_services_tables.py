"""Create servers and services tables

Revision ID: 8c6861bd13aa
Revises: 
Create Date: 2025-07-19 14:35:18.722754

"""
from typing import Sequence, Union



# revision identifiers, used by Alembic.
revision: str = '8c6861bd13aa'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
