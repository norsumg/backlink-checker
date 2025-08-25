"""add usage tracking

Revision ID: 003
Revises: 002
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add usage tracking columns to users table
    op.add_column('users', sa.Column('plan_type', sa.String(length=20), nullable=False, server_default='free'))
    op.add_column('users', sa.Column('searches_used_this_month', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('last_reset_date', sa.Date(), nullable=False, server_default=sa.text('CURRENT_DATE')))
    
    # Create user_searches table for tracking individual searches
    op.create_table('user_searches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('search_query', sa.Text(), nullable=True),
        sa.Column('results_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for performance
    op.create_index('idx_user_searches_user_id', 'user_searches', ['user_id'])
    op.create_index('idx_user_searches_created_at', 'user_searches', ['created_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_user_searches_created_at', table_name='user_searches')
    op.drop_index('idx_user_searches_user_id', table_name='user_searches')
    
    # Drop user_searches table
    op.drop_table('user_searches')
    
    # Remove columns from users table
    op.drop_column('users', 'last_reset_date')
    op.drop_column('users', 'searches_used_this_month')
    op.drop_column('users', 'plan_type')
