import React, { useState, useEffect, useCallback } from 'react'
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users
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
  const [activeTab, setActiveTab] = useState<'stats' | 'marketplaces' | 'domains' | 'offers' | 'fx_rates' | 'users'>('stats')
  const [authError, setAuthError] = useState('')
  const queryClient = useQueryClient()

  // Server-side pagination, search, and sort state
  const [pagination, setPagination] = useState({
    marketplaces: { limit: 50, offset: 0 },
    domains: { limit: 50, offset: 0 },
    offers: { limit: 50, offset: 0 },
    fx_rates: { limit: 50, offset: 0 },
    users: { limit: 50, offset: 0 }
  })

  const [searchTerms, setSearchTerms] = useState({
    marketplaces: '',
    domains: '',
    offers: '',
    fx_rates: '',
    users: ''
  })

  const [sortConfig, setSortConfig] = useState({
    marketplaces: { key: '', direction: 'asc' as 'asc' | 'desc' },
    domains: { key: '', direction: 'asc' as 'asc' | 'desc' },
    offers: { key: '', direction: 'asc' as 'asc' | 'desc' },
    fx_rates: { key: '', direction: 'asc' as 'asc' | 'desc' },
    users: { key: '', direction: 'asc' as 'asc' | 'desc' }
  })

  // Edit state
  const [editingRows, setEditingRows] = useState<Set<number>>(new Set())
  const [editData, setEditData] = useState<Record<number, any>>({})
  const [saveLoading, setSaveLoading] = useState<Set<number>>(new Set())

  // Debounced search
  const [searchTimeouts, setSearchTimeouts] = useState<Record<string, NodeJS.Timeout>>({})

  // Reset state when switching tabs
  useEffect(() => {
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

  // Queries with server-side parameters
  const statsQuery = useQuery<AdminStats>(
    'admin-stats',
    () => adminApi.getStats(),
    { enabled: isAuthenticated }
  )

  const marketplacesQuery = useQuery(
    ['admin-marketplaces', pagination.marketplaces, searchTerms.marketplaces, sortConfig.marketplaces],
    () => adminApi.getMarketplaces({
      limit: pagination.marketplaces.limit,
      offset: pagination.marketplaces.offset,
      search: searchTerms.marketplaces || undefined,
      sort_by: sortConfig.marketplaces.key || undefined,
      sort_order: sortConfig.marketplaces.direction
    }),
    { 
      enabled: isAuthenticated && activeTab === 'marketplaces',
      keepPreviousData: true
    }
  )

  const domainsQuery = useQuery(
    ['admin-domains', pagination.domains, searchTerms.domains, sortConfig.domains],
    () => adminApi.getDomains({
      limit: pagination.domains.limit,
      offset: pagination.domains.offset,
      search: searchTerms.domains || undefined,
      sort_by: sortConfig.domains.key || undefined,
      sort_order: sortConfig.domains.direction
    }),
    { 
      enabled: isAuthenticated && activeTab === 'domains',
      keepPreviousData: true
    }
  )

  const offersQuery = useQuery(
    ['admin-offers', pagination.offers, searchTerms.offers, sortConfig.offers],
    () => adminApi.getOffers({
      limit: pagination.offers.limit,
      offset: pagination.offers.offset,
      search: searchTerms.offers || undefined,
      sort_by: sortConfig.offers.key || undefined,
      sort_order: sortConfig.offers.direction
    }),
    { 
      enabled: isAuthenticated && activeTab === 'offers',
      keepPreviousData: true
    }
  )

  const fxRatesQuery = useQuery(
    ['admin-fx-rates', pagination.fx_rates, searchTerms.fx_rates, sortConfig.fx_rates],
    () => adminApi.getFxRates({
      limit: pagination.fx_rates.limit,
      offset: pagination.fx_rates.offset,
      search: searchTerms.fx_rates || undefined,
      sort_by: sortConfig.fx_rates.key || undefined,
      sort_order: sortConfig.fx_rates.direction
    }),
    { 
      enabled: isAuthenticated && activeTab === 'fx_rates',
      keepPreviousData: true
    }
  )

  const usersQuery = useQuery(
    ['admin-users', pagination.users, searchTerms.users, sortConfig.users],
    () => adminApi.getUsers({
      limit: pagination.users.limit,
      offset: pagination.users.offset,
      search: searchTerms.users || undefined,
      sort_by: sortConfig.users.key || undefined,
      sort_order: sortConfig.users.direction
    }),
    { 
      enabled: isAuthenticated && activeTab === 'users',
      keepPreviousData: true
    }
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

  const updateUserMutation = useMutation(
    ({ id, userData }: { id: number; userData: any }) => adminApi.updateUser(id, userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-users')
        queryClient.invalidateQueries('admin-stats')
      }
    }
  )

  const deleteUserMutation = useMutation(
    (id: number) => adminApi.deleteUser(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-users')
        queryClient.invalidateQueries('admin-stats')
      }
    }
  )

  // Server-side pagination handlers
  const handlePageChange = useCallback((table: string, page: number) => {
    setPagination(prev => ({
      ...prev,
      [table]: {
        ...prev[table as keyof typeof prev],
        offset: page * prev[table as keyof typeof prev].limit
      }
    }))
  }, [])

  // Debounced search handler
  const handleSearch = useCallback((table: keyof typeof searchTerms, value: string) => {
    // Clear existing timeout
    if (searchTimeouts[table]) {
      clearTimeout(searchTimeouts[table])
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      setSearchTerms(prev => ({ ...prev, [table]: value }))
      // Reset to first page when searching
      setPagination(prev => ({
        ...prev,
        [table]: { ...prev[table], offset: 0 }
      }))
    }, 300)
    
    setSearchTimeouts(prev => ({ ...prev, [table]: timeout }))
  }, [searchTimeouts])

  // Sort handler
  const handleSort = useCallback((table: string, key: string) => {
    setSortConfig(prev => {
      const currentConfig = prev[table as keyof typeof prev]
      const newDirection = currentConfig.key === key && currentConfig.direction === 'asc' ? 'desc' : 'asc'
      
      return {
        ...prev,
        [table]: { key, direction: newDirection }
      }
    })
    
    // Reset to first page when sorting
    setPagination(prev => ({
      ...prev,
      [table]: { ...prev[table as keyof typeof prev], offset: 0 }
    }))
  }, [])

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
    { id: 'fx_rates', label: 'FX Rates', icon: Database },
    { id: 'users', label: 'Users', icon: Users }
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
        case 'user':
          deleteUserMutation.mutate(id)
          break
      }
    }
  }

  // (Server-side handlers defined above)

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
        case 'user':
          await adminApi.updateUser(id, data)
          queryClient.invalidateQueries('admin-users')
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

  // Reusable components
  const SortableHeader = ({ 
    label, 
    sortKey, 
    table,
    className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" 
  }: { 
    label: string
    sortKey: string
    table: string
    className?: string 
  }) => {
    const currentConfig = sortConfig[table as keyof typeof sortConfig]
    
    return (
      <th 
        className={`${className} cursor-pointer hover:bg-gray-100 select-none`}
        onClick={() => handleSort(table, sortKey)}
      >
        <div className="flex items-center space-x-1">
          <span>{label}</span>
          {currentConfig.key === sortKey && (
            <span className="text-gray-400">
              {currentConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          )}
        </div>
      </th>
    )
  }

  const SearchInput = ({ 
    placeholder, 
    table,
    totalCount, 
    isLoading 
  }: {
    placeholder: string
    table: string
    totalCount: number
    isLoading?: boolean
  }) => {
    const [localValue, setLocalValue] = useState(searchTerms[table as keyof typeof searchTerms])
    
    return (
      <div className="mb-4 flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localValue}
            onChange={(e) => {
              setLocalValue(e.target.value)
              handleSearch(table as keyof typeof searchTerms, e.target.value)
            }}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500">
          Total: {totalCount.toLocaleString()} items
        </div>
      </div>
    )
  }

  const Pagination = ({ 
    currentPage, 
    totalItems, 
    itemsPerPage, 
    onPageChange 
  }: {
    currentPage: number
    totalItems: number
    itemsPerPage: number
    onPageChange: (page: number) => void
  }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    
    if (totalPages <= 1) return null
    
    const startItem = currentPage * itemsPerPage + 1
    const endItem = Math.min((currentPage + 1) * itemsPerPage, totalItems)
    
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex justify-between sm:hidden">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{totalItems.toLocaleString()}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = currentPage < 3 ? i : 
                  currentPage > totalPages - 3 ? totalPages - 5 + i : 
                  currentPage - 2 + i
                
                if (pageNum < 0 || pageNum >= totalPages) return null
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
                      pageNum === currentPage
                        ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                )
              })}
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    )
  }

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
                table="marketplaces"
                totalCount={marketplacesQuery.data?.total || 0}
                isLoading={marketplacesQuery.isLoading}
              />
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableHeader label="Name" sortKey="name" table="marketplaces" />
                      <SortableHeader label="Slug" sortKey="slug" table="marketplaces" />
                      <SortableHeader label="Region" sortKey="region" table="marketplaces" />
                      <SortableHeader label="Created" sortKey="created_at" table="marketplaces" />
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {marketplacesQuery.data?.marketplaces?.map((marketplace: any) => {
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
                table="domains"
                totalCount={domainsQuery.data?.total || 0}
                isLoading={domainsQuery.isLoading}
              />
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableHeader label="Domain" sortKey="root_domain" table="domains" />
                      <SortableHeader label="eTLD+1" sortKey="etld1" table="domains" />
                      <SortableHeader label="Offers" sortKey="offer_count" table="domains" />
                      <SortableHeader label="Created" sortKey="created_at" table="domains" />
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
                Offers
              </h3>
              
              <SearchInput
                placeholder="Search offers..."
                table="offers"
                totalCount={offersQuery.data?.total || 0}
                isLoading={offersQuery.isLoading}
              />
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableHeader label="Domain" sortKey="domain" table="offers" />
                      <SortableHeader label="Marketplace" sortKey="marketplace" table="offers" />
                      <SortableHeader label="Price Amount" sortKey="price_amount" table="offers" />
                      <SortableHeader label="Currency" sortKey="price_currency" table="offers" />
                      <SortableHeader label="Price USD" sortKey="price_usd" table="offers" />
                      <SortableHeader label="Content" sortKey="includes_content" table="offers" />
                      <SortableHeader label="Dofollow" sortKey="dofollow" table="offers" />
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {offersQuery.data?.offers?.map((offer: any) => {
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
                table="fx_rates"
                totalCount={fxRatesQuery.data?.total || 0}
                isLoading={fxRatesQuery.isLoading}
              />
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableHeader label="Currency" sortKey="currency" table="fx_rates" />
                      <SortableHeader label="Rate to USD" sortKey="rate_to_usd" table="fx_rates" />
                      <SortableHeader label="Date" sortKey="date" table="fx_rates" />
                      <SortableHeader label="Created" sortKey="created_at" table="fx_rates" />
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

        {activeTab === 'users' && (
          <div className="card overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Users
              </h3>
              
              <SearchInput
                placeholder="Search users..."
                table="users"
                totalCount={usersQuery.data?.total || 0}
                isLoading={usersQuery.isLoading}
              />
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableHeader label="Email" sortKey="email" table="users" />
                      <SortableHeader label="Name" sortKey="full_name" table="users" />
                      <SortableHeader label="Plan" sortKey="plan_type" table="users" />
                      <SortableHeader label="Searches Used" sortKey="searches_used_this_month" table="users" />
                      <SortableHeader label="Status" sortKey="is_active" table="users" />
                      <SortableHeader label="Registered" sortKey="created_at" table="users" />
                      <SortableHeader label="Last Login" sortKey="last_login" table="users" />
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersQuery.data?.users?.map((user: any) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingRows.has(user.id) ? (
                            <EditableCell
                              type="text"
                              isEditing={true}
                              value={editData[user.id]?.full_name ?? user.full_name}
                              onChange={(value) => updateEditData(user.id, 'full_name', value)}
                            />
                          ) : (
                            user.full_name || user.username || '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingRows.has(user.id) ? (
                            <EditableCell
                              type="select"
                              isEditing={true}
                              value={editData[user.id]?.plan_type ?? user.plan_type}
                              onChange={(value) => updateEditData(user.id, 'plan_type', value)}
                              options={[
                                { value: 'free', label: 'Free' },
                                { value: 'unlimited', label: 'Unlimited' }
                              ]}
                            />
                          ) : (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.plan_type === 'unlimited' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.plan_type}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingRows.has(user.id) ? (
                            <EditableCell
                              type="number"
                              isEditing={true}
                              value={editData[user.id]?.searches_used_this_month ?? user.searches_used_this_month}
                              onChange={(value) => updateEditData(user.id, 'searches_used_this_month', value)}
                            />
                          ) : (
                            `${user.searches_used_this_month} / ${user.searches_remaining + user.searches_used_this_month}`
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingRows.has(user.id) ? (
                            <EditableCell
                              type="checkbox"
                              isEditing={true}
                              value={editData[user.id]?.is_active ?? user.is_active}
                              onChange={(value) => updateEditData(user.id, 'is_active', value)}
                            />
                          ) : (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {editingRows.has(user.id) ? (
                            <>
                              <button
                                onClick={() => saveEdit('user', user.id)}
                                disabled={saveLoading.has(user.id)}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => cancelEditing(user.id)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(user.id, user)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete('user', user.id, user.email)}
                                className="text-red-600 hover:text-red-900"
                                disabled={deleteUserMutation.isLoading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
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
