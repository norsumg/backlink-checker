from sqlalchemy import Column, Integer, String, DateTime, Boolean, Index
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    username = Column(String(100), nullable=True, unique=True)
    full_name = Column(String(255), nullable=True)
    
    # Authentication fields
    hashed_password = Column(String(255), nullable=True)  # Null for OAuth users
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # OAuth fields
    google_id = Column(String(255), nullable=True, unique=True, index=True)
    avatar_url = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Create indexes for faster lookups
    __table_args__ = (
        Index('idx_users_email', 'email'),
        Index('idx_users_google_id', 'google_id'),
    )
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', username='{self.username}')>"
