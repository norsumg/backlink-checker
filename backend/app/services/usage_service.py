from datetime import datetime, date
from sqlalchemy.orm import Session
from app.models.user import User, UserSearch
from sqlalchemy import func
from typing import Optional


class UsageService:
    
    @staticmethod
    def reset_monthly_usage_if_needed(db: Session, user: User) -> User:
        """Reset user's monthly usage if a new month has started"""
        today = date.today()
        
        # Check if we need to reset (new month)
        if user.last_reset_date.month != today.month or user.last_reset_date.year != today.year:
            user.searches_used_this_month = 0
            user.last_reset_date = today
            db.commit()
            db.refresh(user)
        
        return user
    
    @staticmethod
    def can_perform_search(db: Session, user: User) -> tuple[bool, str]:
        """
        Check if user can perform a search
        Returns: (can_search: bool, message: str)
        """
        # Reset monthly usage if needed
        user = UsageService.reset_monthly_usage_if_needed(db, user)
        
        # Check plan limits
        if user.plan_type == 'unlimited':
            return True, "Unlimited searches available"
        
        plan_limits = {
            'free': 3,
            'pro': 100
        }
        
        limit = plan_limits.get(user.plan_type, 3)
        remaining = limit - user.searches_used_this_month
        
        if remaining <= 0:
            return False, f"Monthly search limit reached. Upgrade to continue searching."
        
        return True, f"{remaining} searches remaining this month"
    
    @staticmethod
    def record_search(db: Session, user: User, search_query: str, results_count: int = 0) -> UserSearch:
        """Record a user search and increment usage counter"""
        # Reset monthly usage if needed
        user = UsageService.reset_monthly_usage_if_needed(db, user)
        
        # Create search record
        search_record = UserSearch(
            user_id=user.id,
            search_query=search_query,
            results_count=results_count
        )
        db.add(search_record)
        
        # Increment usage counter (only for non-unlimited plans)
        if user.plan_type != 'unlimited':
            user.searches_used_this_month += 1
            
        db.commit()
        db.refresh(search_record)
        db.refresh(user)
        
        return search_record
    
    @staticmethod
    def get_usage_stats(db: Session, user: User) -> dict:
        """Get comprehensive usage statistics for a user"""
        # Reset monthly usage if needed
        user = UsageService.reset_monthly_usage_if_needed(db, user)
        
        # Calculate current month stats
        today = date.today()
        start_of_month = date(today.year, today.month, 1)
        
        searches_this_month = db.query(func.count(UserSearch.id)).filter(
            UserSearch.user_id == user.id,
            func.date(UserSearch.created_at) >= start_of_month
        ).scalar() or 0
        
        # Plan limits
        plan_limits = {
            'free': 3,
            'pro': 100,
            'unlimited': -1
        }
        
        limit = plan_limits.get(user.plan_type, 3)
        
        return {
            'plan_type': user.plan_type,
            'searches_used_this_month': user.searches_used_this_month,
            'searches_limit': limit,
            'searches_remaining': user.searches_remaining,
            'can_search': user.can_search,
            'last_reset_date': user.last_reset_date.isoformat(),
            'total_searches_this_month': searches_this_month
        }
    
    @staticmethod
    def upgrade_user_plan(db: Session, user: User, new_plan: str) -> User:
        """Upgrade user to a new plan"""
        valid_plans = ['free', 'pro', 'unlimited']
        
        if new_plan not in valid_plans:
            raise ValueError(f"Invalid plan type: {new_plan}")
        
        user.plan_type = new_plan
        db.commit()
        db.refresh(user)
        
        return user


usage_service = UsageService()
