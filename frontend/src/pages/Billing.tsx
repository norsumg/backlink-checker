import React, { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { ExternalLink, CheckCircle, AlertTriangle, Calendar, CreditCard, Loader2 } from 'lucide-react'
import { 
  getSubscription, 
  createCustomerPortalSession, 
  cancelSubscription 
} from '../services/billingApi'
import { useAuth } from '../contexts/AuthContext'

export function Billing() {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [success, setSuccess] = useState(false)

  // Check for success parameter from Stripe redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      setSuccess(true)
      // Refresh user data to get updated plan
      refreshUser()
      // Clear the URL parameter
      window.history.replaceState({}, '', '/billing')
    }
  }, [refreshUser])

  const { data: subscription, isLoading, refetch } = useQuery(
    'subscription',
    getSubscription,
    {
      refetchInterval: success ? 5000 : false, // Refetch every 5s after success for a bit
      refetchIntervalInBackground: false
    }
  )

  const portalMutation = useMutation(createCustomerPortalSession, {
    onSuccess: (data) => {
      window.location.href = data.portal_url
    },
    onError: (error: any) => {
      console.error('Portal error:', error)
      alert('Failed to open billing portal. Please try again.')
    }
  })

  const cancelMutation = useMutation(cancelSubscription, {
    onSuccess: () => {
      setShowCancelConfirm(false)
      refetch()
      refreshUser()
    },
    onError: (error: any) => {
      console.error('Cancel error:', error)
      alert('Failed to cancel subscription. Please try again.')
    }
  })

  const handleOpenPortal = () => {
    const returnUrl = window.location.origin + '/billing'
    portalMutation.mutate({ return_url: returnUrl })
  }

  const handleCancelSubscription = () => {
    cancelMutation.mutate()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="mt-2 text-gray-600">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Subscription Activated!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Welcome to unlimited searches! Your subscription is now active.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* Current Plan */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                user?.plan_type === 'unlimited' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <div>
                <p className="font-medium text-gray-900">
                  {user?.plan_type === 'unlimited' ? 'Unlimited Plan' : 'Free Plan'}
                </p>
                <p className="text-sm text-gray-600">
                  {user?.plan_type === 'unlimited' 
                    ? 'Unlimited domain searches per month'
                    : '3 domain searches per month'
                  }
                </p>
              </div>
            </div>
            
            {user?.plan_type === 'free' && (
              <a
                href="/pricing"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Upgrade to Unlimited
              </a>
            )}
          </div>
        </div>

        {/* Subscription Details */}
        {subscription?.has_subscription && subscription.subscription && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Subscription Details
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Status</span>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    subscription.subscription.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className="font-medium capitalize">
                    {subscription.subscription.status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium">$4.99/month</span>
              </div>
              
              {subscription.subscription.current_period_end && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">
                    {subscription.subscription.cancel_at_period_end ? 'Cancels on' : 'Next billing date'}
                  </span>
                  <span className="font-medium">
                    {formatDate(subscription.subscription.current_period_end)}
                  </span>
                </div>
              )}

              {subscription.subscription.cancel_at_period_end && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Subscription Scheduled for Cancellation
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        You'll continue to have unlimited access until {formatDate(subscription.subscription.current_period_end!)}.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Management Actions */}
        {subscription?.has_subscription && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Manage Subscription
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Payment Method & Billing</p>
                    <p className="text-sm text-gray-600">
                      Update your payment method, view invoices, and download receipts
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleOpenPortal}
                  disabled={portalMutation.isLoading}
                  className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50"
                >
                  {portalMutation.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-1" />
                  )}
                  Manage
                </button>
              </div>

              {!subscription.subscription?.cancel_at_period_end && (
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Cancel Subscription</p>
                      <p className="text-sm text-gray-600">
                        Cancel your subscription (you'll keep access until the end of your billing period)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Subscription?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You'll continue to have unlimited access until the end of your current billing period.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelMutation.isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {cancelMutation.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Cancel Subscription'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
