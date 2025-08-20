import { useState } from 'react'
import { useQuery } from 'react-query'
import { getMarketplaces } from '../services/api'

interface Filters {
  marketplaces: string[]
  minPrice: string
  maxPrice: string
  bestPriceOnly: boolean
}

interface FilterPanelProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const { data: marketplaces } = useQuery('marketplaces', getMarketplaces)

  const handleMarketplaceChange = (marketplace: string, checked: boolean) => {
    const newMarketplaces = checked
      ? [...filters.marketplaces, marketplace]
      : filters.marketplaces.filter(m => m !== marketplace)
    
    onFiltersChange({
      ...filters,
      marketplaces: newMarketplaces,
    })
  }

  const handleInputChange = (field: keyof Filters, value: string | boolean) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    })
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Search Filters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Marketplaces */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marketplaces
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {marketplaces?.map((marketplace) => (
              <label key={marketplace.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.marketplaces.includes(marketplace.slug)}
                  onChange={(e) => handleMarketplaceChange(marketplace.slug, e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{marketplace.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range (USD)
          </label>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-500">Minimum</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleInputChange('minPrice', e.target.value)}
                placeholder="0.00"
                className="input text-sm"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Maximum</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                placeholder="1000.00"
                className="input text-sm"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.bestPriceOnly}
                onChange={(e) => handleInputChange('bestPriceOnly', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Best price only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => onFiltersChange({
            marketplaces: [],
            minPrice: '',
            maxPrice: '',
            bestPriceOnly: false,
          })}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Clear all filters
        </button>
      </div>
    </div>
  )
}
