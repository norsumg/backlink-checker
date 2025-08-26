# Stripe Integration Setup Guide

This guide covers setting up Stripe for the $4.99/month unlimited subscription plan.

## 🏗️ **What Was Implemented**

### Backend Changes
- ✅ Added Stripe SDK dependency (`stripe==7.9.0`)
- ✅ Created `StripeService` for all Stripe operations
- ✅ Added Stripe fields to User model (migration 005)
- ✅ Created billing API endpoints (`/api/v1/billing/`)
- ✅ Created webhook handler (`/api/v1/webhooks/stripe`)
- ✅ Simplified plan types to `free` and `unlimited`

### Frontend Changes  
- ✅ Created pricing page (`/pricing`)
- ✅ Created billing management page (`/billing`)
- ✅ Added upgrade prompts and links
- ✅ Updated header with plan-specific navigation
- ✅ Created upgrade prompt component

## 🔧 **Stripe Dashboard Setup**

### 1. Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and create account
2. Complete business verification if needed

### 2. Create Product & Price
1. Go to **Products** in Stripe Dashboard
2. Click **Add Product**
3. Product Information:
   - **Name**: "Unlimited Searches Plan"
   - **Description**: "Unlimited domain searches per month"
4. Pricing Information:
   - **Price**: $4.99
   - **Billing**: Recurring, Monthly
   - **Currency**: USD
5. Save and copy the **Price ID** (starts with `price_`)

### 3. Get API Keys
1. Go to **Developers** → **API Keys**
2. Copy:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### 4. Create Webhook Endpoint
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://backlinkpricechecker.com/api/v1/webhooks/stripe`
4. Select events to send:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Save and copy the **Signing secret** (starts with `whsec_`)

## 🔐 **Environment Variables**

Add these to your production environment:

```bash
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_publishable_key
STRIPE_SECRET_KEY=sk_live_your_actual_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret
STRIPE_PRICE_ID=price_your_actual_price_id  # From step 2 above
```

**For your specific setup, the STRIPE_PRICE_ID should be related to `prod_SwK6hviTuCVhIy`**

## 🚀 **Deployment Process**

### 1. Database Migration
```bash
# Run the new migration
docker exec -it backlink-checker-backend-1 alembic upgrade head
```

### 2. Update Environment Variables
```bash
# Edit your production docker-compose.yml
nano docker-compose.yml

# Add the Stripe environment variables to the backend service
```

### 3. Rebuild and Restart
```bash
# Rebuild with new dependencies
docker-compose down
docker-compose up -d --build

# Verify services are running
docker-compose ps
```

### 4. Test Webhook Endpoint
```bash
# Test that webhook endpoint is accessible
curl https://backlinkpricechecker.com/api/v1/webhooks/stripe/test
```

## 🧪 **Testing**

### Test Mode (Safe Testing)
1. Use test API keys (start with `pk_test_` and `sk_test_`)
2. Use test webhook endpoint URL
3. Use Stripe test credit cards:
   - **Successful payment**: `4242 4242 4242 4242`
   - **Failed payment**: `4000 0000 0000 0002`

### Production Testing Checklist
- [ ] Webhook endpoint responds with 200 status
- [ ] Test subscription creation flow
- [ ] Verify user plan upgrade works
- [ ] Test subscription cancellation
- [ ] Verify webhook events update user status

## 🔄 **User Flow**

### Subscription Creation
1. User clicks "Upgrade" → Redirects to `/pricing`
2. User clicks "Upgrade Now" → API call to `/billing/create-checkout-session`
3. Redirects to Stripe Checkout
4. User completes payment
5. Stripe webhook calls `/webhooks/stripe`
6. User plan_type updated to 'unlimited'
7. User redirected to `/billing?success=true`

### Subscription Management  
1. User goes to `/billing`
2. Can access Stripe Customer Portal
3. Can cancel subscription (remains active until period end)

## 🛠️ **API Endpoints**

### Billing Endpoints
```
POST /api/v1/billing/create-checkout-session
POST /api/v1/billing/create-portal-session  
GET  /api/v1/billing/subscription
POST /api/v1/billing/cancel-subscription
GET  /api/v1/billing/pricing-info
```

### Webhook Endpoint
```
POST /api/v1/webhooks/stripe
GET  /api/v1/webhooks/stripe/test
```

## 🚨 **Security Notes**

### Webhook Security
- ✅ Webhook signature verification implemented
- ✅ Idempotent event handling
- ✅ Error logging and handling

### API Security
- ✅ All billing endpoints require authentication
- ✅ User can only manage their own subscription
- ✅ Stripe handles all payment processing (PCI compliant)

## 🐛 **Troubleshooting**

### Common Issues

**Webhook not receiving events:**
- Check webhook URL is publicly accessible
- Verify webhook secret matches Stripe dashboard
- Check Stripe dashboard webhook logs

**Subscription not upgrading user:**
- Check webhook events are being processed
- Verify user has stripe_customer_id
- Check backend logs for errors

**Payment failing:**
- Verify Stripe keys are correct (test vs live)
- Check Stripe dashboard for declined payments
- Ensure price ID matches the one in Stripe

### Debug Commands
```bash
# Check webhook endpoint
curl -X GET https://backlinkpricechecker.com/api/v1/webhooks/stripe/test

# Check user subscription status
docker exec -it backlink-checker-postgres-1 psql -U postgres -d backlink_checker -c "SELECT email, plan_type, stripe_customer_id, subscription_status FROM users WHERE email='user@example.com';"

# Check backend logs
docker-compose logs backend --tail=100
```

## 📞 **Support**

For Stripe-related issues:
1. Check Stripe Dashboard logs
2. Review webhook delivery attempts
3. Check backend application logs
4. Verify environment variables are set correctly

The integration follows Stripe best practices and includes proper error handling and security measures.
