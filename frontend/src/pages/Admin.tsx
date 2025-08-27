import React, { useState, useEffect, useMemo } from 'react'
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
  AlertTriangle,
  Search,
  Save,
  X,
  ChevronUp,
  ChevronDown
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

  // Search state
  const [searchTerms, setSearchTerms] = useState({
    marketplaces: '',
    domains: '',
    offers: '',
    fx_rates: ''
  })

  // Sort state  
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  }>({ key: '', direction: 'asc' })

  // Edit state
  const [editingRows, setEditingRows] = useState<Set<number>>(new Set())
  const [editData, setEditData] = useState<Record<number, any>>({})
  const [saveLoading, setSaveLoading] = useState<Set<number>>(new Set())

  // Reset search and sort when switching tabs
  useEffect(() => {
    setSearchTerms({
      marketplaces: '',
      domains: '',
      offers: '',
      fx_rates: ''
    })
    setSortConfig({ key: '', direction: 'asc' })
    setEditingRows(new Set())
    setEditData({})
  }, [activeTab])

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

  // Search functionality
  const handleSearch = (table: keyof typeof searchTerms, value: string) => {
    setSearchTerms(prev => ({ ...prev, [table]: value }))
  }

  // Sort functionality
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const sortData = (data: any[], key: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      if (aVal instanceof Date && bVal instanceof Date) {
        return direction === 'asc' 
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime()
      }
      
      const aStr = String(aVal || '').toLowerCase()
      const bStr = String(bVal || '').toLowerCase()
      return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })
  }

  const filterData = (data: any[], searchTerm: string) => {
    if (!searchTerm) return data
    return data.filter(item => 
      Object.values(item).some(value => 
        String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }

  // Edit functionality
  const startEditing = (id: number, currentData: any) => {
    setEditingRows(prev => new Set([...prev, id]))
    setEditData(prev => ({ ...prev, [id]: { ...currentData } }))
  }

  const cancelEditing = (id: number) => {
    setEditingRows(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    setEditData(prev => {
      const newData = { ...prev }
      delete newData[id]
      return newData
    })
  }

  const updateEditData = (id: number, field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }))
  }

  const saveEdit = async (type: string, id: number) => {
    setSaveLoading(prev => new Set([...prev, id]))
    try {
      const data = editData[id]
      switch (type) {
        case 'marketplace':
          await adminApi.updateMarketplace(id, data)
          queryClient.invalidateQueries('admin-marketplaces')
          break
        case 'offer':
          await adminApi.updateOffer(id, data)
          queryClient.invalidateQueries('admin-offers')
          break
      }
      cancelEditing(id)
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setSaveLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  // Processed data with search and sort
  const processedMarketplaces = useMemo(() => {
    if (!marketplacesQuery.data) return []
    const filtered = filterData(marketplacesQuery.data, searchTerms.marketplaces)
    return sortConfig.key ? sortData(filtered, sortConfig.key, sortConfig.direction) : filtered
  }, [marketplacesQuery.data, searchTerms.marketplaces, sortConfig.key, sortConfig.direction])

  const processedDomains = useMemo(() => {
    if (!domainsQuery.data?.domains) return []
    const filtered = filterData(domainsQuery.data.domains, searchTerms.domains)
    return sortConfig.key ? sortData(filtered, sortConfig.key, sortConfig.direction) : filtered
  }, [domainsQuery.data?.domains, searchTerms.domains, sortConfig.key, sortConfig.direction])

  const processedOffers = useMemo(() => {
    if (!offersQuery.data?.offers) return []
    const filtered = filterData(offersQuery.data.offers, searchTerms.offers)
    return sortConfig.key ? sortData(filtered, sortConfig.key, sortConfig.direction) : filtered
  }, [offersQuery.data?.offers, searchTerms.offers, sortConfig.key, sortConfig.direction])

  const processedFxRates = useMemo(() => {
    if (!fxRatesQuery.data?.fx_rates) return []
    const filtered = filterData(fxRatesQuery.data.fx_rates, searchTerms.fx_rates)
    return sortConfig.key ? sortData(filtered, sortConfig.key, sortConfig.direction) : filtered
  }, [fxRatesQuery.data?.fx_rates, searchTerms.fx_rates, sortConfig.key, sortConfig.direction])

  // Reusable components
  const SortableHeader = ({ 
    label, 
    sortKey, 
    className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" 
  }: { 
    label: string
    sortKey: string
    className?: string 
  }) => (
    <th 
      className={`${className} cursor-pointer hover:bg-gray-100 select-none`}
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {sortConfig.key === sortKey && (
          <span className="text-gray-400">
            {sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        )}
      </div>
    </th>
  )

  const SearchInput = ({ 
    placeholder, 
    value, 
    onChange, 
    totalCount, 
    filteredCount 
  }: {
    placeholder: string
    value: string
    onChange: (value: string) => void
    totalCount: number
    filteredCount: number
  }) => (
    <div className="mb-4 flex items-center space-x-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <div className="text-sm text-gray-500">
        {filteredCount} of {totalCount} items
      </div>
    </div>
  )

  const EditableCell = ({ 
    isEditing, 
    value, 
    type = 'text', 
    onChange, 
    options 
  }: {
    isEditing: boolean
    value: any
    type?: 'text' | 'number' | 'select' | 'checkbox'
    onChange?: (value: any) => void
    options?: { value: any; label: string }[]
  }) => {
    if (!isEditing) {
      if (type === 'checkbox') {
        return <span>{value ? 'Yes' : 'No'}</span>
      }
      return <span>{value}</span>
    }

    switch (type) {
      case 'number':
        return (
          <input
            type="number"
            step="0.01"
            value={value || ''}
            onChange={(e) => onChange?.(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange?.(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        )
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )
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
                Marketplaces
              </h3>
              
              <SearchInput
                placeholder="Search marketplaces..."
                value={searchTerms.marketplaces}
                onChange={(value) => handleSearch('marketplaces', value)}
                totalCount={marketplacesQuery.data?.length || 0}
                filteredCount={processedMarketplaces.length}
              />
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableHeader label="Name" sortKey="name" />
                      <SortableHeader label="Slug" sortKey="slug" />
                      <SortableHeader label="Region" sortKey="region" />
                      <SortableHeader label="Created" sortKey="created_at" />
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedMarketplaces.map((marketplace: any) => {
                      const isEditing = editingRows.has(marketplace.id)
                      const editingData = editData[marketplace.id] || marketplace
                      
                      return (
                        <tr key={marketplace.id} className={isEditing ? 'bg-blue-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <EditableCell
                              isEditing={isEditing}
                              value={editingData.name}
                              onChange={(value) => updateEditData(marketplace.id, 'name', value)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <EditableCell
                              isEditing={isEditing}
                              value={editingData.slug}
                              onChange={(value) => updateEditData(marketplace.id, 'slug', value)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <EditableCell
                              isEditing={isEditing}
                              value={editingData.region}
                              onChange={(value) => updateEditData(marketplace.id, 'region', value)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(marketplace.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => saveEdit('marketplace', marketplace.id)}
                                    disabled={saveLoading.has(marketplace.id)}
                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                  >
                                    {saveLoading.has(marketplace.id) ? (
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Save className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => cancelEditing(marketplace.id)}
                                    className="text-gray-600 hover:text-gray-900"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditing(marketplace.id, marketplace)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete('marketplace', marketplace.id, marketplace.name)}
                                    className="text-red-600 hover:text-red-900"
                                    disabled={deleteMarketplaceMutation.isLoading}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
                Domains
              </h3>
              
              <SearchInput
                placeholder="Search domains..."
                value={searchTerms.domains}
                onChange={(value) => handleSearch('domains', value)}
                totalCount={domainsQuery.data?.total || 0}
                filteredCount={processedDomains.length}
              />
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableHeader label="Domain" sortKey="root_domain" />
                      <SortableHeader label="eTLD+1" sortKey="etld1" />
                      <SortableHeader label="Offers" sortKey="offer_count" />
                      <SortableHeader label="Created" sortKey="created_at" />
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedDomains.map((domain: any) => (
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
                Offers
              </h3>
              
              <SearchInput
                placeholder="Search offers..."
                value={searchTerms.offers}
                onChange={(value) => handleSearch('offers', value)}
                totalCount={offersQuery.data?.total || 0}
                filteredCount={processedOffers.length}
              />
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableHeader label="Domain" sortKey="domain" />
                      <SortableHeader label="Marketplace" sortKey="marketplace" />
                      <SortableHeader label="Price Amount" sortKey="price_amount" />
                      <SortableHeader label="Currency" sortKey="price_currency" />
                      <SortableHeader label="Price USD" sortKey="price_usd" />
                      <SortableHeader label="Content" sortKey="includes_content" />
                      <SortableHeader label="Dofollow" sortKey="dofollow" />
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedOffers.map((offer: any) => {
                      const isEditing = editingRows.has(offer.id)
                      const editingData = editData[offer.id] || offer
                      
                      return (
                        <tr key={offer.id} className={isEditing ? 'bg-blue-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {offer.domain}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {offer.marketplace}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <EditableCell
                              isEditing={isEditing}
                              value={editingData.price_amount}
                              type="number"
                              onChange={(value) => updateEditData(offer.id, 'price_amount', value)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <EditableCell
                              isEditing={isEditing}
                              value={editingData.price_currency}
                              onChange={(value) => updateEditData(offer.id, 'price_currency', value)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {offer.price_usd ? `$${offer.price_usd.toFixed(2)}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <EditableCell
                              isEditing={isEditing}
                              value={editingData.includes_content}
                              type="checkbox"
                              onChange={(value) => updateEditData(offer.id, 'includes_content', value)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <EditableCell
                              isEditing={isEditing}
                              value={editingData.dofollow}
                              type="checkbox"
                              onChange={(value) => updateEditData(offer.id, 'dofollow', value)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => saveEdit('offer', offer.id)}
                                    disabled={saveLoading.has(offer.id)}
                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                  >
                                    {saveLoading.has(offer.id) ? (
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Save className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => cancelEditing(offer.id)}
                                    className="text-gray-600 hover:text-gray-900"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditing(offer.id, offer)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete('offer', offer.id, `${offer.domain} - ${offer.marketplace}`)}
                                    className="text-red-600 hover:text-red-900"
                                    disabled={deleteOfferMutation.isLoading}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
                Exchange Rates
              </h3>
              
              <SearchInput
                placeholder="Search FX rates..."
                value={searchTerms.fx_rates}
                onChange={(value) => handleSearch('fx_rates', value)}
                totalCount={fxRatesQuery.data?.total || 0}
                filteredCount={processedFxRates.length}
              />
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableHeader label="Currency" sortKey="currency" />
                      <SortableHeader label="Rate to USD" sortKey="rate_to_usd" />
                      <SortableHeader label="Date" sortKey="date" />
                      <SortableHeader label="Created" sortKey="created_at" />
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedFxRates.map((rate: any) => (
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
