import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { Search, Upload, BarChart3, TrendingUp, Globe, DollarSign, Lock } from 'lucide-react'
import { getLookupStats } from '../services/api'
import { Stats } from '../types'
import { useAuth } from '../contexts/AuthContext'

export function Dashboard() {
  const { isAuthenticated } = useAuth()
  // Fetch stats for everyone to show on homepage
  const { data: stats, isLoading, error } = useQuery<Stats>('stats', getLookupStats)

  const quickActions = [
    {
      title: 'Domain Lookup',
      description: 'Search for domains across all marketplaces',
      href: '/lookup',
      icon: Search,
      color: 'bg-blue-500',
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load dashboard data</div>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header - only show for authenticated users */}
      {isAuthenticated && (
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitor your backlink marketplace data and performance
          </p>
        </div>
      )}

      {/* Welcome Section for Non-Authenticated Users */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Backlink Price Checker
          </h2>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Discover backlink opportunities across multiple marketplaces. 
            Compare prices, find domains, and analyze your competition with our comprehensive database.
          </p>
          <Link
            to="/auth"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors inline-flex items-center space-x-2"
          >
            <span>Get Started - Sign Up Free</span>
          </Link>
        </div>
      )}

      {/* Stats Grid for Non-Authenticated Users */}
      {stats && !isAuthenticated && (
        <div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Database at a Glance</h2>
            <p className="text-gray-600">Real-time data from multiple backlink marketplaces</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Globe className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Domains</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.total_domains.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Offers</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.total_offers.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Marketplaces</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.total_marketplaces.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Price (USD)</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${stats.avg_price_usd?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {stats && isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Domains</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.total_domains.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Offers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.total_offers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Marketplaces</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.total_marketplaces.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Price (USD)</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${stats.avg_price_usd?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <div key={action.title} className="relative">
              <Link
                to={action.href}
                className="card hover:shadow-md transition-shadow cursor-pointer block"
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-12 h-12 ${action.color} rounded-lg flex items-center justify-center`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{action.title}</h3>
                    <p className="text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range Chart */}
      {stats && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Price Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Minimum</p>
              <p className="text-lg font-semibold text-gray-900">
                ${stats.price_range_usd.min.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">25th Percentile</p>
              <p className="text-lg font-semibold text-gray-900">
                ${stats.price_range_usd.q25.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">75th Percentile</p>
              <p className="text-lg font-semibold text-gray-900">
                ${stats.price_range_usd.q75.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Maximum</p>
              <p className="text-lg font-semibold text-gray-900">
                ${stats.price_range_usd.max.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
