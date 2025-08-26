from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CheckoutSessionRequest(BaseModel):
    success_url: str
    cancel_url: str


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str


class CustomerPortalRequest(BaseModel):
    return_url: str


class CustomerPortalResponse(BaseModel):
    portal_url: str


class SubscriptionInfo(BaseModel):
    id: Optional[str] = None
    status: Optional[str] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: Optional[bool] = None
    canceled_at: Optional[datetime] = None


class SubscriptionResponse(BaseModel):
    has_subscription: bool
    subscription: Optional[SubscriptionInfo] = None
    plan_type: str
    stripe_customer_id: Optional[str] = None


class CancelSubscriptionResponse(BaseModel):
    success: bool
    message: str


class WebhookEvent(BaseModel):
    """Basic webhook event structure"""
    id: str
    type: str
    data: dict
