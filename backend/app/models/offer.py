from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Offer(Base):
    __tablename__ = "offers"
    
    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False, index=True)
    marketplace_id = Column(Integer, ForeignKey("marketplaces.id"), nullable=False, index=True)
    listing_url = Column(Text, nullable=True)
    price_amount = Column(Numeric(10, 2), nullable=False)
    price_currency = Column(String(3), nullable=False)  # ISO 4217 currency codes
    price_usd = Column(Numeric(10, 2), nullable=True)  # Normalized USD price
    includes_content = Column(Boolean, default=False)
    dofollow = Column(Boolean, default=True)
    first_seen_at = Column(DateTime(timezone=True), nullable=True)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    domain = relationship("Domain", backref="offers")
    marketplace = relationship("Marketplace", backref="offers")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_offers_domain_marketplace', 'domain_id', 'marketplace_id'),
        Index('idx_offers_price_usd', 'price_usd'),
        Index('idx_offers_last_seen', 'last_seen_at'),
    )
    
    def __repr__(self):
        return f"<Offer(id={self.id}, domain_id={self.domain_id}, marketplace_id={self.marketplace_id}, price={self.price_amount} {self.price_currency})>"
