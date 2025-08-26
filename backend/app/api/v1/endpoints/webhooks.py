import stripe
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.services.stripe_service import stripe_service

router = APIRouter()


@router.post("/stripe")
async def handle_stripe_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle Stripe webhook events.
    
    This endpoint receives webhook events from Stripe and processes them
    to update user subscription status in our database.
    """
    payload = await request.body()
    sig_header = request.headers.get('Stripe-Signature')
    
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing Stripe signature header")
    
    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        # Invalid payload
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.SignatureVerificationError:
        # Invalid signature
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    try:
        handled = stripe_service.handle_webhook_event(db, event)
        
        if handled:
            return {"status": "success", "event_type": event['type']}
        else:
            # Event type not handled, but that's ok
            return {"status": "ignored", "event_type": event['type']}
            
    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing webhook")


@router.get("/stripe/test")
async def test_webhook_endpoint():
    """
    Test endpoint to verify webhook URL is accessible.
    This is useful for Stripe webhook endpoint verification.
    """
    return {
        "status": "ok",
        "message": "Webhook endpoint is accessible",
        "webhook_secret_configured": bool(settings.stripe_webhook_secret)
    }
