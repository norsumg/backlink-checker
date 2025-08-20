from sqlalchemy import Column, Integer, String, DateTime, Numeric, Index, Date
from sqlalchemy.sql import func
from app.core.database import Base


class FXRate(Base):
    __tablename__ = "fx_rates"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    currency = Column(String(3), nullable=False)  # ISO 4217 currency codes
    rate_to_usd = Column(Numeric(10, 6), nullable=False)  # Rate to convert to USD
    created_at = Column(DateTime(timezone=True), nullable=True)
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_fx_rates_date_currency', 'date', 'currency', unique=True),
        Index('idx_fx_rates_currency', 'currency'),
    )
    
    def __repr__(self):
        return f"<FXRate(id={self.id}, date={self.date}, currency='{self.currency}', rate_to_usd={self.rate_to_usd})>"
