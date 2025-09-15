from pydantic import BaseModel


class UsageStats(BaseModel):
    plan_type: str
    searches_used_this_month: int
    searches_limit: int  # -1 for unlimited
    searches_remaining: int
    can_search: bool
    last_reset_date: str
    total_searches_this_month: int
    
    class Config:
        from_attributes = True


# REMOVED: PlanUpgrade schema - no longer needed after removing dangerous upgrade endpoint


class SearchCheck(BaseModel):
    can_search: bool
    message: str
    searches_remaining: int
    plan_type: str
