from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.services.stripe_service import stripe_service
from app.schemas.billing import (
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    CustomerPortalRequest,
    CustomerPortalResponse,
    SubscriptionResponse,
    SubscriptionInfo,
    CancelSubscriptionResponse
)

router = APIRouter()


@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: CheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a Stripe checkout session for subscription signup.
    """
    try:
        # Check if user already has an active subscription
        if current_user.plan_type == 'unlimited' and current_user.stripe_subscription_id:
            raise HTTPException(
                status_code=400, 
                detail="User already has an active subscription"
            )
        
        result = stripe_service.create_checkout_session(
            db=db,
            user=current_user,
            success_url=request.success_url,
            cancel_url=request.cancel_url
        )
        
        return CheckoutSessionResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create-portal-session", response_model=CustomerPortalResponse)
async def create_portal_session(
    request: CustomerPortalRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Create a Stripe customer portal session for subscription management.
    """
    try:
        if not current_user.stripe_customer_id:
            raise HTTPException(
                status_code=400, 
                detail="User has no Stripe customer account"
            )
        
        portal_url = stripe_service.create_customer_portal_session(
            user=current_user,
            return_url=request.return_url
        )
        
        return CustomerPortalResponse(portal_url=portal_url)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's subscription information.
    """
    try:
        subscription_info = None
        has_subscription = False
        
        if current_user.stripe_subscription_id:
            stripe_sub = stripe_service.get_subscription_info(current_user)
            if stripe_sub:
                subscription_info = SubscriptionInfo(**stripe_sub)
                has_subscription = True
        
        return SubscriptionResponse(
            has_subscription=has_subscription,
            subscription=subscription_info,
            plan_type=current_user.plan_type,
            stripe_customer_id=current_user.stripe_customer_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cancel-subscription", response_model=CancelSubscriptionResponse)
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel user's subscription at the end of the current period.
    """
    try:
        if not current_user.stripe_subscription_id:
            raise HTTPException(
                status_code=400, 
                detail="User has no active subscription to cancel"
            )
        
        success = stripe_service.cancel_subscription(current_user)
        
        if success:
            # Update local database
            current_user.subscription_cancel_at_period_end = True
            db.commit()
            
            return CancelSubscriptionResponse(
                success=True,
                message="Subscription will be canceled at the end of the current billing period"
            )
        else:
            return CancelSubscriptionResponse(
                success=False,
                message="Failed to cancel subscription"
            )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/pricing-info")
async def get_pricing_info():
    """
    Get pricing information for the frontend.
    """
    return {
        "plans": [
            {
                "name": "Free",
                "price": 0,
                "currency": "USD",
                "interval": "month",
                "features": [
                    "3 domain searches per month",
                    "Basic marketplace data",
                    "Email support"
                ]
            },
            {
                "name": "Unlimited",
                "price": 4.99,
                "currency": "USD", 
                "interval": "month",
                "features": [
                    "Unlimited domain searches",
                    "Complete marketplace database",
                    "Priority support",
                    "Advanced filtering"
                ]
            }
        ]
    }
