import stripe
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.config import settings
from app.models.user import User

# Initialize Stripe
stripe.api_key = settings.stripe_secret_key


class StripeService:
    """Service for handling Stripe operations"""

    @staticmethod
    def create_customer(user: User) -> str:
        """Create a Stripe customer for the user"""
        try:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.full_name or user.username,
                metadata={
                    'user_id': str(user.id),
                    'plan_type': user.plan_type
                }
            )
            return customer.id
        except stripe.StripeError as e:
            raise Exception(f"Failed to create Stripe customer: {str(e)}")

    @staticmethod
    def get_or_create_customer(db: Session, user: User) -> str:
        """Get existing Stripe customer ID or create a new one"""
        if user.stripe_customer_id:
            return user.stripe_customer_id
        
        # Create new customer
        customer_id = StripeService.create_customer(user)
        
        # Save to database
        user.stripe_customer_id = customer_id
        db.commit()
        db.refresh(user)
        
        return customer_id

    @staticmethod
    def create_checkout_session(db: Session, user: User, success_url: str, cancel_url: str) -> Dict[str, Any]:
        """Create a Stripe checkout session for subscription"""
        try:
            customer_id = StripeService.get_or_create_customer(db, user)
            
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': settings.stripe_price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'user_id': str(user.id)
                },
                subscription_data={
                    'metadata': {
                        'user_id': str(user.id)
                    }
                }
            )
            
            return {
                'checkout_url': session.url,
                'session_id': session.id
            }
            
        except stripe.StripeError as e:
            raise Exception(f"Failed to create checkout session: {str(e)}")

    @staticmethod
    def create_customer_portal_session(user: User, return_url: str) -> str:
        """Create a Stripe customer portal session"""
        try:
            if not user.stripe_customer_id:
                raise Exception("User has no Stripe customer ID")
            
            session = stripe.billing_portal.Session.create(
                customer=user.stripe_customer_id,
                return_url=return_url
            )
            
            return session.url
            
        except stripe.StripeError as e:
            raise Exception(f"Failed to create customer portal session: {str(e)}")

    @staticmethod
    def cancel_subscription(user: User) -> bool:
        """Cancel user's subscription at period end"""
        try:
            if not user.stripe_subscription_id:
                raise Exception("User has no active subscription")
            
            stripe.Subscription.modify(
                user.stripe_subscription_id,
                cancel_at_period_end=True
            )
            
            return True
            
        except stripe.StripeError as e:
            raise Exception(f"Failed to cancel subscription: {str(e)}")

    @staticmethod
    def get_subscription_info(user: User) -> Optional[Dict[str, Any]]:
        """Get subscription information from Stripe"""
        try:
            if not user.stripe_subscription_id:
                return None
            
            subscription = stripe.Subscription.retrieve(user.stripe_subscription_id)
            
            return {
                'id': subscription.id,
                'status': subscription.status,
                'current_period_end': datetime.fromtimestamp(subscription.current_period_end),
                'cancel_at_period_end': subscription.cancel_at_period_end,
                'canceled_at': datetime.fromtimestamp(subscription.canceled_at) if subscription.canceled_at else None
            }
            
        except stripe.StripeError as e:
            raise Exception(f"Failed to retrieve subscription: {str(e)}")

    @staticmethod
    def handle_webhook_event(db: Session, event: Dict[str, Any]) -> bool:
        """Handle Stripe webhook events"""
        try:
            event_type = event['type']
            data = event['data']['object']
            
            if event_type == 'customer.subscription.created':
                return StripeService._handle_subscription_created(db, data)
            
            elif event_type == 'customer.subscription.updated':
                return StripeService._handle_subscription_updated(db, data)
            
            elif event_type == 'customer.subscription.deleted':
                return StripeService._handle_subscription_deleted(db, data)
            
            elif event_type == 'invoice.payment_succeeded':
                return StripeService._handle_payment_succeeded(db, data)
            
            elif event_type == 'invoice.payment_failed':
                return StripeService._handle_payment_failed(db, data)
            
            # Event type not handled
            return False
            
        except Exception as e:
            print(f"Error handling webhook event: {str(e)}")
            return False

    @staticmethod
    def _handle_subscription_created(db: Session, subscription: Dict[str, Any]) -> bool:
        """Handle subscription creation"""
        customer_id = subscription['customer']
        subscription_id = subscription['id']
        
        # Find user by Stripe customer ID
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if not user:
            print(f"User not found for customer ID: {customer_id}")
            return False
        
        # Update user subscription info
        user.stripe_subscription_id = subscription_id
        user.subscription_status = subscription['status']
        user.subscription_current_period_end = datetime.fromtimestamp(subscription['current_period_end'])
        user.subscription_cancel_at_period_end = subscription['cancel_at_period_end']
        
        # Upgrade to unlimited if active
        if subscription['status'] == 'active':
            user.plan_type = 'unlimited'
        
        db.commit()
        print(f"Updated user {user.id} with new subscription {subscription_id}")
        return True

    @staticmethod
    def _handle_subscription_updated(db: Session, subscription: Dict[str, Any]) -> bool:
        """Handle subscription updates"""
        subscription_id = subscription['id']
        
        # Find user by subscription ID
        user = db.query(User).filter(User.stripe_subscription_id == subscription_id).first()
        if not user:
            print(f"User not found for subscription ID: {subscription_id}")
            return False
        
        # Update subscription info
        user.subscription_status = subscription['status']
        user.subscription_current_period_end = datetime.fromtimestamp(subscription['current_period_end'])
        user.subscription_cancel_at_period_end = subscription['cancel_at_period_end']
        
        # Update plan type based on status
        if subscription['status'] == 'active':
            user.plan_type = 'unlimited'
        elif subscription['status'] in ['canceled', 'past_due', 'unpaid']:
            user.plan_type = 'free'
        
        db.commit()
        print(f"Updated user {user.id} subscription status to {subscription['status']}")
        return True

    @staticmethod
    def _handle_subscription_deleted(db: Session, subscription: Dict[str, Any]) -> bool:
        """Handle subscription deletion"""
        subscription_id = subscription['id']
        
        # Find user by subscription ID
        user = db.query(User).filter(User.stripe_subscription_id == subscription_id).first()
        if not user:
            print(f"User not found for subscription ID: {subscription_id}")
            return False
        
        # Downgrade to free plan
        user.plan_type = 'free'
        user.subscription_status = 'canceled'
        user.stripe_subscription_id = None
        user.subscription_current_period_end = None
        user.subscription_cancel_at_period_end = False
        
        db.commit()
        print(f"Downgraded user {user.id} to free plan")
        return True

    @staticmethod
    def _handle_payment_succeeded(db: Session, invoice: Dict[str, Any]) -> bool:
        """Handle successful payment"""
        customer_id = invoice['customer']
        
        # Find user by customer ID
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if not user:
            return False
        
        # Ensure user is on unlimited plan if payment succeeded
        if user.plan_type != 'unlimited':
            user.plan_type = 'unlimited'
            db.commit()
            print(f"Upgraded user {user.id} to unlimited plan after payment")
        
        return True

    @staticmethod
    def _handle_payment_failed(db: Session, invoice: Dict[str, Any]) -> bool:
        """Handle failed payment"""
        customer_id = invoice['customer']
        
        # Find user by customer ID
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if not user:
            return False
        
        print(f"Payment failed for user {user.id}")
        # Note: Don't immediately downgrade on payment failure
        # Stripe will handle retries and eventual cancellation
        return True


stripe_service = StripeService()
