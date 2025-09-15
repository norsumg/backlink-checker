"""increase_avatar_url_length

Revision ID: 7721db47f14f
Revises: 005_add_stripe_integration
Create Date: 2025-09-15 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7721db47f14f'
down_revision = '005_add_stripe_integration'
branch_labels = None
depends_on = None


def upgrade():
    # Increase avatar_url column length from 500 to 2000 characters
    op.alter_column('users', 'avatar_url',
                    existing_type=sa.String(500),
                    type_=sa.String(2000),
                    existing_nullable=True)


def downgrade():
    # Revert avatar_url column length back to 500 characters
    op.alter_column('users', 'avatar_url',
                    existing_type=sa.String(2000),
                    type_=sa.String(500),
                    existing_nullable=True)
