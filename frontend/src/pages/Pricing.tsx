import React, { useState } from 'react'
import { useQuery, useMutation } from 'react-query'
import { Check, Star, Loader2 } from 'lucide-react'
import { getPricingInfo, createCheckoutSession } from '../services/billingApi'
import { useAuth } from '../contexts/AuthContext'

export function Pricing() {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)

  const { data: pricingInfo, isLoading } = useQuery('pricing-info', getPricingInfo)

  const checkoutMutation = useMutation(createCheckoutSession, {
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      window.location.href = data.checkout_url
    },
    onError: (error: any) => {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
      setLoading(false)
    }
  })

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      alert('Please log in to upgrade your plan')
      return
    }

    if (user?.plan_type === 'unlimited') {
      alert('You already have an unlimited plan!')
      return
    }

    setLoading(true)
    
    const baseUrl = window.location.origin
    checkoutMutation.mutate({
      success_url: `${baseUrl}/billing?success=true`,
      cancel_url: `${baseUrl}/pricing?canceled=true`
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  const freePlan = pricingInfo?.plans.find(p => p.name === 'Free')
  const unlimitedPlan = pricingInfo?.plans.find(p => p.name === 'Unlimited')

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free and upgrade when you need unlimited domain searches
          </p>
        </div>

        {/* Current Plan Notice */}
        {isAuthenticated && (
          <div className="text-center mb-8">
            <div className="inline-block bg-blue-50 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              Current Plan: {user?.plan_type === 'unlimited' ? 'Unlimited' : 'Free'}
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {freePlan?.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled={user?.plan_type === 'free'}
              className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
            >
              {user?.plan_type === 'free' ? 'Current Plan' : 'Get Started'}
            </button>
          </div>

          {/* Unlimited Plan */}
          <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500 p-8 relative">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                <Star className="w-4 h-4 mr-1" />
                Most Popular
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Unlimited</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$4.99</span>
                <span className="text-gray-600">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {unlimitedPlan?.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading || user?.plan_type === 'unlimited'}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Starting Checkout...
                </div>
              ) : user?.plan_type === 'unlimited' ? (
                'Current Plan'
              ) : (
                'Upgrade Now'
              )}
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. You'll continue to have unlimited access until the end of your billing period.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                How does the free plan work?
              </h3>
              <p className="text-gray-600">
                The free plan gives you 3 domain searches per month. Perfect for occasional use and trying out our service.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Is my payment information secure?
              </h3>
              <p className="text-gray-600">
                We use Stripe for payment processing, which means we never store your credit card information. Stripe is PCI compliant and trusted by millions.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens if I go over my limit?
              </h3>
              <p className="text-gray-600">
                Free users are limited to 3 searches per month. You'll be prompted to upgrade when you reach your limit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
