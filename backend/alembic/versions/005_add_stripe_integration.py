"""add stripe integration

Revision ID: 005
Revises: 004
Create Date: 2025-01-26 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add Stripe-related columns to users table
    op.add_column('users', sa.Column('stripe_customer_id', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('stripe_subscription_id', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('subscription_status', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('subscription_current_period_end', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('subscription_cancel_at_period_end', sa.Boolean(), nullable=True, server_default='false'))
    
    # Create unique indexes for Stripe IDs
    op.create_index('idx_users_stripe_customer_id', 'users', ['stripe_customer_id'], unique=True)
    op.create_index('idx_users_stripe_subscription_id', 'users', ['stripe_subscription_id'], unique=True)
    
    # Create index for subscription status lookups
    op.create_index('idx_users_subscription_status', 'users', ['subscription_status'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_users_subscription_status', table_name='users')
    op.drop_index('idx_users_stripe_subscription_id', table_name='users')
    op.drop_index('idx_users_stripe_customer_id', table_name='users')
    
    # Drop columns
    op.drop_column('users', 'subscription_cancel_at_period_end')
    op.drop_column('users', 'subscription_current_period_end')
    op.drop_column('users', 'subscription_status')
    op.drop_column('users', 'stripe_subscription_id')
    op.drop_column('users', 'stripe_customer_id')
