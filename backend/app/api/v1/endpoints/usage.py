from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User
from app.services.usage_service import usage_service
from app.schemas.usage import UsageStats
from typing import List

router = APIRouter()


@router.get("/stats", response_model=UsageStats)
async def get_usage_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's usage statistics"""
    stats = usage_service.get_usage_stats(db, current_user)
    return stats


# REMOVED: Dangerous /upgrade endpoint that allowed free plan upgrades
# Plan upgrades are now handled exclusively through Stripe webhooks after successful payment


@router.get("/check-limit")
async def check_search_limit(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if user can perform a search"""
    can_search, message = usage_service.can_perform_search(db, current_user)
    
    return {
        "can_search": can_search,
        "message": message,
        "searches_remaining": current_user.searches_remaining,
        "plan_type": current_user.plan_type
    }
