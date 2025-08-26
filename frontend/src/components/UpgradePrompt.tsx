import React, { useState } from 'react'
import { useMutation } from 'react-query'
import { Star, X, Loader2 } from 'lucide-react'
import { createCheckoutSession } from '../services/billingApi'

interface UpgradePromptProps {
  onClose: () => void
  searchesUsed?: number
  searchesLimit?: number
}

export function UpgradePrompt({ onClose, searchesUsed, searchesLimit }: UpgradePromptProps) {
  const [loading, setLoading] = useState(false)

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
    setLoading(true)
    
    const baseUrl = window.location.origin
    checkoutMutation.mutate({
      success_url: `${baseUrl}/billing?success=true`,
      cancel_url: `${baseUrl}/lookup`
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-blue-600" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Search Limit Reached
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            {searchesUsed && searchesLimit ? (
              <>You've used {searchesUsed} of {searchesLimit} free searches this month. </>
            ) : (
              <>You've reached your monthly search limit. </>
            )}
            Upgrade to unlimited searches for just <strong>$4.99/month</strong>.
          </p>

          {/* Features */}
          <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">With unlimited plan you get:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Unlimited domain searches</li>
              <li>• Complete marketplace database</li>
              <li>• Priority support</li>
              <li>• Advanced filtering</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Starting Checkout...
                </div>
              ) : (
                'Upgrade to Unlimited - $4.99/month'
              )}
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Maybe Later
            </button>
          </div>

          {/* Fine print */}
          <p className="text-xs text-gray-500 mt-4">
            Cancel anytime. No hidden fees. Secure payment by Stripe.
          </p>
        </div>
      </div>
    </div>
  )
}
