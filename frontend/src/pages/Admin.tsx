import React, { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { 
  Settings, 
  Database, 
  Edit, 
  Trash2, 
  Eye, 
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react'
import { adminApi } from '../services/adminApi'

interface AdminStats {
  marketplaces: number
  domains: number
  offers: number
  fx_rates: number
  recent_offers: number
  currencies: number
}

interface AdminData {
  marketplaces: any[]
  domains: any[]
  offers: any[]
  fx_rates: any[]
}

export function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState<'stats' | 'marketplaces' | 'domains' | 'offers' | 'fx_rates'>('stats')
  const [authError, setAuthError] = useState('')
  const queryClient = useQueryClient()

  // Check if already authenticated (from localStorage)
  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_auth')
    if (savedAuth) {
      adminApi.setAuthToken(savedAuth)
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      adminApi.setAuthToken(password)
      // Test the auth by making a stats request
      await adminApi.getStats()
      localStorage.setItem('admin_auth', password)
      setIsAuthenticated(true)
      setAuthError('')
      setPassword('')
    } catch (error) {
      setAuthError('Invalid admin password')
      adminApi.setAuthToken('')
      localStorage.removeItem('admin_auth')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    adminApi.setAuthToken('')
    localStorage.removeItem('admin_auth')
    queryClient.clear()
  }

  // Queries
  const statsQuery = useQuery<AdminStats>(
    'admin-stats',
    () => adminApi.getStats(),
    { enabled: isAuthenticated }
  )

  const marketplacesQuery = useQuery(
    'admin-marketplaces',
    () => adminApi.getMarketplaces(),
    { enabled: isAuthenticated && activeTab === 'marketplaces' }
  )

  const domainsQuery = useQuery(
    'admin-domains',
    () => adminApi.getDomains(),
    { enabled: isAuthenticated && activeTab === 'domains' }
  )

  const offersQuery = useQuery(
    'admin-offers',
    () => adminApi.getOffers(),
    { enabled: isAuthenticated && activeTab === 'offers' }
  )

  const fxRatesQuery = useQuery(
    'admin-fx-rates',
    () => adminApi.getFxRates(),
    { enabled: isAuthenticated && activeTab === 'fx_rates' }
  )

  // Mutations
  const deleteMarketplaceMutation = useMutation(
    (id: number) => adminApi.deleteMarketplace(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-marketplaces')
        queryClient.invalidateQueries('admin-stats')
      }
    }
  )

  const deleteDomainMutation = useMutation(
    (id: number) => adminApi.deleteDomain(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-domains')
        queryClient.invalidateQueries('admin-stats')
      }
    }
  )

  const deleteOfferMutation = useMutation(
    (id: number) => adminApi.deleteOffer(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-offers')
        queryClient.invalidateQueries('admin-stats')
      }
    }
  )

  const deleteFxRateMutation = useMutation(
    (id: number) => adminApi.deleteFxRate(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-fx-rates')
        queryClient.invalidateQueries('admin-stats')
      }
    }
  )

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center bg-red-100 rounded-full">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              Admin Access Required
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter admin password to access database management
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="password" className="sr-only">
                Admin Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Admin password"
                required
              />
            </div>
            {authError && (
              <div className="text-red-600 text-sm text-center">{authError}</div>
            )}
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Unlock className="h-5 w-5 mr-2" />
              Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'stats', label: 'Statistics', icon: Database },
    { id: 'marketplaces', label: 'Marketplaces', icon: Settings },
    { id: 'domains', label: 'Domains', icon: Database },
    { id: 'offers', label: 'Offers', icon: Database },
    { id: 'fx_rates', label: 'FX Rates', icon: Database }
  ] as const

  const handleDelete = (type: string, id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${type} "${name}"? This action cannot be undone.`)) {
      switch (type) {
        case 'marketplace':
          deleteMarketplaceMutation.mutate(id)
          break
        case 'domain':
          deleteDomainMutation.mutate(id)
          break
        case 'offer':
          deleteOfferMutation.mutate(id)
          break
        case 'fx_rate':
          deleteFxRateMutation.mutate(id)
          break
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="mr-3 h-8 w-8" />
            Admin Panel
          </h1>
          <p className="mt-2 text-gray-600">
            Manage database entries and view system statistics
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-outline text-red-600 border-red-600 hover:bg-red-50"
        >
          <Lock className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statsQuery.data && Object.entries(statsQuery.data).map(([key, value]) => (
              <div key={key} className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Database className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {key.replace('_', ' ').toUpperCase()}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {value.toLocaleString()}
                    </dd>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Marketplaces Tab */}
        {activeTab === 'marketplaces' && (
          <div className="card overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Marketplaces ({marketplacesQuery.data?.length || 0})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Region
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {marketplacesQuery.data?.map((marketplace: any) => (
                      <tr key={marketplace.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {marketplace.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {marketplace.slug}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {marketplace.region || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(marketplace.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDelete('marketplace', marketplace.id, marketplace.name)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteMarketplaceMutation.isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Domains Tab */}
        {activeTab === 'domains' && (
          <div className="card overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Domains ({domainsQuery.data?.total || 0})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Domain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        eTLD+1
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Offers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {domainsQuery.data?.domains?.map((domain: any) => (
                      <tr key={domain.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {domain.root_domain}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {domain.etld1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {domain.offer_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(domain.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDelete('domain', domain.id, domain.root_domain)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteDomainMutation.isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Offers Tab */}
        {activeTab === 'offers' && (
          <div className="card overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Offers ({offersQuery.data?.total || 0})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Domain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marketplace
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price USD
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {offersQuery.data?.offers?.map((offer: any) => (
                      <tr key={offer.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {offer.domain}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {offer.marketplace}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {offer.price_amount} {offer.price_currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {offer.price_usd ? `$${offer.price_usd.toFixed(2)}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDelete('offer', offer.id, `${offer.domain} - ${offer.marketplace}`)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteOfferMutation.isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FX Rates Tab */}
        {activeTab === 'fx_rates' && (
          <div className="card overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Exchange Rates ({fxRatesQuery.data?.total || 0})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Currency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate to USD
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fxRatesQuery.data?.fx_rates?.map((rate: any) => (
                      <tr key={rate.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {rate.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rate.rate_to_usd.toFixed(6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rate.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(rate.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDelete('fx_rate', rate.id, `${rate.currency} - ${rate.date}`)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteFxRateMutation.isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
