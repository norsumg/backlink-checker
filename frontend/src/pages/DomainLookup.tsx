import { useState } from 'react'
import { useMutation } from 'react-query'
import { Search, Download, Filter, Star } from 'lucide-react'
import { lookupDomains } from '../services/api'
import { DomainLookupRequest, OfferResult } from '../types'
import { ResultsTable } from '../components/ResultsTable'
import { FilterPanel } from '../components/FilterPanel'

export function DomainLookup() {
  const [domains, setDomains] = useState('')
  const [filters, setFilters] = useState({
    marketplaces: [] as string[],
    minPrice: '',
    maxPrice: '',
    bestPriceOnly: false,
  })
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState('')

  const mutation = useMutation(lookupDomains, {
    onSuccess: () => {
      setError('') // Clear any previous errors
    },
    onError: (error: any) => {
      console.error('Lookup failed:', error)
      
      // Handle structured error responses (like search limit exceeded)
      if (error?.response?.data?.detail) {
        const detail = error.response.data.detail
        if (typeof detail === 'object' && detail.error && detail.message) {
          // Structured error with header and message
          setError(`${detail.error}: ${detail.message}`)
        } else if (typeof detail === 'string') {
          setError(detail)
        } else {
          setError('Search failed. Please try again.')
        }
      } else {
        setError(error?.message || 'Search failed. Please try again.')
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('') // Clear any previous errors
    
    const domainList = domains
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0)
    
    if (domainList.length === 0) return

    const request: DomainLookupRequest = {
      domains: domainList,
      marketplaces: filters.marketplaces.length > 0 ? filters.marketplaces : undefined,
      min_price_usd: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
      max_price_usd: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
      best_price_only: filters.bestPriceOnly,
    }

    mutation.mutate(request)
  }

  const handleExportCSV = () => {
    if (!mutation.data?.results) return

    const csvContent = [
      ['Domain', 'Marketplace', 'Price', 'Currency', 'Price (USD)', 'Listing URL', 'Includes Content', 'Dofollow', 'Last Seen', 'Best Price'],
      ...mutation.data.results.map(result => [
        result.domain,
        result.marketplace,
        result.price_amount.toString(),
        result.price_currency,
        result.price_usd ? result.price_usd.toString() : 'N/A',
        result.listing_url || '',
        result.includes_content ? 'Yes' : 'No',
        result.dofollow ? 'Yes' : 'No',
        new Date(result.last_seen_at).toLocaleDateString(),
        result.is_best_price ? 'Yes' : 'No',
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backlink-results-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Domain Lookup</h1>
        <p className="mt-2 text-gray-600">
          Search for domains across all marketplaces to find backlink opportunities
        </p>
      </div>

      {/* Search Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="domains" className="block text-sm font-medium text-gray-700 mb-2">
              Domains to Search
            </label>
            <textarea
              id="domains"
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              placeholder="Enter domains (one per line)&#10;example.com&#10;another-site.com&#10;test-domain.org"
              className="input h-32 resize-none"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter one domain per line. You can include http:// or https:// - they will be automatically removed.
            </p>
          </div>

          {/* Filters Toggle */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
            />
          )}

          {/* Submit Button */}
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={mutation.isLoading || !domains.trim()}
              className="btn btn-primary px-6"
            >
              {mutation.isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span>Search Domains</span>
                </div>
              )}
            </button>

            {mutation.data?.results && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="btn btn-outline px-6"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="ml-3">
                  <div className="text-sm text-red-800">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Results */}
      {mutation.data && (
        <div className="space-y-4">
          {/* Results Summary */}
          <div className="card bg-blue-50 border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-blue-600">Domains Searched</p>
                <p className="text-lg font-semibold text-blue-900">
                  {mutation.data.total_domains_searched}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600">With Offers</p>
                <p className="text-lg font-semibold text-blue-900">
                  {mutation.data.domains_with_offers}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Total Offers</p>
                <p className="text-lg font-semibold text-blue-900">
                  {mutation.data.total_offers_found}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Processing Time</p>
                <p className="text-lg font-semibold text-blue-900">
                  {mutation.data.processing_time_ms}ms
                </p>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <ResultsTable results={mutation.data.results} />
        </div>
      )}
    </div>
  )
}
