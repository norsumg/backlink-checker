"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create marketplaces table
    op.create_table('marketplaces',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('region', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_marketplaces_id'), 'marketplaces', ['id'], unique=False)
    op.create_index(op.f('ix_marketplaces_name'), 'marketplaces', ['name'], unique=True)
    op.create_index(op.f('ix_marketplaces_slug'), 'marketplaces', ['slug'], unique=True)
    
    # Create domains table
    op.create_table('domains',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('root_domain', sa.String(length=255), nullable=False),
        sa.Column('etld1', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_domains_id'), 'domains', ['id'], unique=False)
    op.create_index(op.f('ix_domains_root_domain'), 'domains', ['root_domain'], unique=True)
    op.create_index(op.f('ix_domains_etld1'), 'domains', ['etld1'], unique=False)
    op.create_index('idx_domains_etld1', 'domains', ['etld1'], unique=False)
    
    # Create fx_rates table
    op.create_table('fx_rates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('rate_to_usd', sa.Numeric(precision=10, scale=6), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fx_rates_id'), 'fx_rates', ['id'], unique=False)
    op.create_index(op.f('ix_fx_rates_date'), 'fx_rates', ['date'], unique=False)
    op.create_index(op.f('ix_fx_rates_currency'), 'fx_rates', ['currency'], unique=False)
    op.create_index('idx_fx_rates_date_currency', 'fx_rates', ['date', 'currency'], unique=True)
    op.create_index('idx_fx_rates_currency', 'fx_rates', ['currency'], unique=False)
    
    # Create offers table
    op.create_table('offers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('domain_id', sa.Integer(), nullable=False),
        sa.Column('marketplace_id', sa.Integer(), nullable=False),
        sa.Column('listing_url', sa.Text(), nullable=True),
        sa.Column('price_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('price_currency', sa.String(length=3), nullable=False),
        sa.Column('price_usd', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('includes_content', sa.Boolean(), nullable=True),
        sa.Column('dofollow', sa.Boolean(), nullable=True),
        sa.Column('first_seen_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('last_seen_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['domain_id'], ['domains.id'], ),
        sa.ForeignKeyConstraint(['marketplace_id'], ['marketplaces.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_offers_id'), 'offers', ['id'], unique=False)
    op.create_index(op.f('ix_offers_domain_id'), 'offers', ['domain_id'], unique=False)
    op.create_index(op.f('ix_offers_marketplace_id'), 'offers', ['marketplace_id'], unique=False)
    op.create_index('idx_offers_domain_marketplace', 'offers', ['domain_id', 'marketplace_id'], unique=False)
    op.create_index('idx_offers_price_usd', 'offers', ['price_usd'], unique=False)
    op.create_index('idx_offers_last_seen', 'offers', ['last_seen_at'], unique=False)
    
    # Create price_history table
    op.create_table('price_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('offer_id', sa.Integer(), nullable=False),
        sa.Column('price_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('price_currency', sa.String(length=3), nullable=False),
        sa.Column('price_usd', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('seen_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['offer_id'], ['offers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_price_history_id'), 'price_history', ['id'], unique=False)
    op.create_index(op.f('ix_price_history_offer_id'), 'price_history', ['offer_id'], unique=False)
    op.create_index('idx_price_history_offer_seen', 'price_history', ['offer_id', 'seen_at'], unique=False)
    op.create_index('idx_price_history_seen_at', 'price_history', ['seen_at'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_price_history_seen_at', table_name='price_history')
    op.drop_index('idx_price_history_offer_seen', table_name='price_history')
    op.drop_index(op.f('ix_price_history_offer_id'), table_name='price_history')
    op.drop_index(op.f('ix_price_history_id'), table_name='price_history')
    op.drop_table('price_history')
    op.drop_index('idx_offers_last_seen', table_name='offers')
    op.drop_index('idx_offers_price_usd', table_name='offers')
    op.drop_index('idx_offers_domain_marketplace', table_name='offers')
    op.drop_index(op.f('ix_offers_marketplace_id'), table_name='offers')
    op.drop_index(op.f('ix_offers_domain_id'), table_name='offers')
    op.drop_index(op.f('ix_offers_id'), table_name='offers')
    op.drop_table('offers')
    op.drop_index('idx_fx_rates_currency', table_name='fx_rates')
    op.drop_index('idx_fx_rates_date_currency', table_name='fx_rates')
    op.drop_index(op.f('ix_fx_rates_currency'), table_name='fx_rates')
    op.drop_index(op.f('ix_fx_rates_date'), table_name='fx_rates')
    op.drop_index(op.f('ix_fx_rates_id'), table_name='fx_rates')
    op.drop_table('fx_rates')
    op.drop_index('idx_domains_etld1', table_name='domains')
    op.drop_index(op.f('ix_domains_etld1'), table_name='domains')
    op.drop_index(op.f('ix_domains_root_domain'), table_name='domains')
    op.drop_index(op.f('ix_domains_id'), table_name='domains')
    op.drop_table('domains')
    op.drop_index(op.f('ix_marketplaces_slug'), table_name='marketplaces')
    op.drop_index(op.f('ix_marketplaces_name'), table_name='marketplaces')
    op.drop_index(op.f('ix_marketplaces_id'), table_name='marketplaces')
    op.drop_table('marketplaces')
