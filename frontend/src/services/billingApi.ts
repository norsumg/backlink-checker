import api from './api'

// Types for billing API
export interface CheckoutSessionRequest {
  success_url: string
  cancel_url: string
}

export interface CheckoutSessionResponse {
  checkout_url: string
  session_id: string
}

export interface CustomerPortalRequest {
  return_url: string
}

export interface CustomerPortalResponse {
  portal_url: string
}

export interface SubscriptionInfo {
  id?: string
  status?: string
  current_period_end?: string
  cancel_at_period_end?: boolean
  canceled_at?: string
}

export interface SubscriptionResponse {
  has_subscription: boolean
  subscription?: SubscriptionInfo
  plan_type: string
  stripe_customer_id?: string
}

export interface CancelSubscriptionResponse {
  success: boolean
  message: string
}

export interface PricingPlan {
  name: string
  price: number
  currency: string
  interval: string
  features: string[]
}

export interface PricingInfo {
  plans: PricingPlan[]
}

// Billing API functions
export const createCheckoutSession = async (
  request: CheckoutSessionRequest
): Promise<CheckoutSessionResponse> => {
  const response = await api.post<CheckoutSessionResponse>('/billing/create-checkout-session', request)
  return response.data
}

export const createCustomerPortalSession = async (
  request: CustomerPortalRequest
): Promise<CustomerPortalResponse> => {
  const response = await api.post<CustomerPortalResponse>('/billing/create-portal-session', request)
  return response.data
}

export const getSubscription = async (): Promise<SubscriptionResponse> => {
  const response = await api.get<SubscriptionResponse>('/billing/subscription')
  return response.data
}

export const cancelSubscription = async (): Promise<CancelSubscriptionResponse> => {
  const response = await api.post<CancelSubscriptionResponse>('/billing/cancel-subscription')
  return response.data
}

export const getPricingInfo = async (): Promise<PricingInfo> => {
  const response = await api.get<PricingInfo>('/billing/pricing-info')
  return response.data
}
