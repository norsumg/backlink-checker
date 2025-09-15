from sqlalchemy import Column, Integer, String, DateTime, Boolean, Index, Date, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
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
    is_admin = Column(Boolean, default=False)
    
    # OAuth fields
    google_id = Column(String(255), nullable=True, unique=True, index=True)
    avatar_url = Column(String(2000), nullable=True)
    
    # Usage tracking
    plan_type = Column(String(20), nullable=False, default='free')
    searches_used_this_month = Column(Integer, nullable=False, default=0)
    last_reset_date = Column(Date, nullable=False, server_default=func.current_date())
    
    # Stripe integration
    stripe_customer_id = Column(String(255), nullable=True, unique=True, index=True)
    stripe_subscription_id = Column(String(255), nullable=True, unique=True, index=True)
    subscription_status = Column(String(50), nullable=True, index=True)
    subscription_current_period_end = Column(DateTime(timezone=True), nullable=True)
    subscription_cancel_at_period_end = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    searches = relationship("UserSearch", back_populates="user")
    
    # Create indexes for faster lookups
    __table_args__ = (
        Index('idx_users_email', 'email'),
        Index('idx_users_google_id', 'google_id'),
    )
    
    @property
    def searches_remaining(self) -> int:
        """Calculate remaining searches for the current month"""
        if self.plan_type == 'unlimited':
            return 999  # Show as unlimited
        
        # Free plan gets 3 searches
        limit = 3
        return max(0, limit - self.searches_used_this_month)
    
    @property
    def can_search(self) -> bool:
        """Check if user can perform another search"""
        if self.plan_type == 'unlimited':
            return True
        
        # Free plan gets 3 searches
        return self.searches_used_this_month < 3
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', plan='{self.plan_type}')>"


class UserSearch(Base):
    __tablename__ = "user_searches"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    search_query = Column(Text, nullable=True)
    results_count = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="searches")
    
    # Create indexes for faster lookups
    __table_args__ = (
        Index('idx_user_searches_user_id', 'user_id'),
        Index('idx_user_searches_created_at', 'created_at'),
    )
    
    def __repr__(self):
        return f"<UserSearch(id={self.id}, user_id={self.user_id}, query='{self.search_query[:50]}')>"
