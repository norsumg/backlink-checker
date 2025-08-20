from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class PriceHistory(Base):
    __tablename__ = "price_history"
    
    id = Column(Integer, primary_key=True, index=True)
    offer_id = Column(Integer, ForeignKey("offers.id"), nullable=False, index=True)
    price_amount = Column(Numeric(10, 2), nullable=False)
    price_currency = Column(String(3), nullable=False)
    price_usd = Column(Numeric(10, 2), nullable=True)
    seen_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    offer = relationship("Offer", backref="price_history")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_price_history_offer_seen', 'offer_id', 'seen_at'),
        Index('idx_price_history_seen_at', 'seen_at'),
    )
    
    def __repr__(self):
        return f"<PriceHistory(id={self.id}, offer_id={self.offer_id}, price={self.price_amount} {self.price_currency}, seen_at={self.seen_at})>"
