from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.services.usage_service import usage_service
from typing import Tuple


def check_search_limit(
    current_user: User = Depends(None),  # This will be replaced with actual auth dependency
    db: Session = Depends(get_db)
) -> Tuple[bool, str]:
    """
    Middleware to check if user can perform a search
    Returns: (can_search: bool, message: str)
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to search"
        )
    
    can_search, message = usage_service.can_perform_search(db, current_user)
    
    if not can_search:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "Search limit exceeded",
                "message": message,
                "upgrade_url": "/pricing",
                "current_plan": current_user.plan_type,
                "searches_used": current_user.searches_used_this_month
            }
        )
    
    return can_search, message


def record_search_usage(
    search_query: str,
    results_count: int = 0,
    current_user: User = Depends(None),  # This will be replaced with actual auth dependency
    db: Session = Depends(get_db)
) -> None:
    """
    Middleware to record a search after it's performed
    """
    if current_user:
        usage_service.record_search(db, current_user, search_query, results_count)
