from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User
from app.services.usage_service import usage_service
from app.schemas.usage import UsageStats, PlanUpgrade
from typing import List, Dict

router = APIRouter()


@router.get("/stats", response_model=UsageStats)
async def get_usage_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's usage statistics"""
    stats = usage_service.get_usage_stats(db, current_user)
    return stats


@router.post("/upgrade", response_model=Dict[str, str])
async def upgrade_plan(
    plan_data: PlanUpgrade,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upgrade user's plan (for testing - in production this would be handled by payment provider)"""
    try:
        updated_user = usage_service.upgrade_user_plan(db, current_user, plan_data.plan_type)
        return {
            "message": f"Successfully upgraded to {plan_data.plan_type} plan",
            "plan_type": updated_user.plan_type
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


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
