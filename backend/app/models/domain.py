from sqlalchemy import Column, Integer, String, DateTime, Index
from sqlalchemy.sql import func
from app.core.database import Base


class Domain(Base):
    __tablename__ = "domains"
    
    id = Column(Integer, primary_key=True, index=True)
    root_domain = Column(String(255), nullable=False, unique=True)
    etld1 = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Create index on etld1 for faster lookups
    __table_args__ = (
        Index('idx_domains_etld1', 'etld1'),
    )
    
    def __repr__(self):
        return f"<Domain(id={self.id}, root_domain='{self.root_domain}', etld1='{self.etld1}')>"
