import React, { useState } from 'react'
import { useMutation } from 'react-query'
import { Upload, FileText, Settings, CheckCircle, AlertCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { uploadCSV } from '../services/api'
import { CSVUploadRequest, ColumnMapping } from '../types'

export function CSVUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [marketplaceData, setMarketplaceData] = useState({
    name: '',
    slug: '',
    region: '',
  })
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    domain_column: '',
    price_column: '',
    currency_column: '',
    url_column: '',
    content_column: '',
    dofollow_column: '',
    marketplace_column: '',
  })
  const [defaults, setDefaults] = useState({
    currency: 'USD',
    content: false,
    dofollow: true,
  })
  const [bulkMarketplace, setBulkMarketplace] = useState({
    enabled: false,
    name: '',
    slug: '',
  })

  const mutation = useMutation(({ file, request }: { file: File; request: Omit<CSVUploadRequest, 'file'> }) => 
    uploadCSV(file, request, (progressEvent) => {
      const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100)
      setUploadProgress(percentage)
      if (percentage === 100) {
        setIsProcessing(true)
      }
    }), {
    onSuccess: (data) => {
      console.log('Upload successful:', data)
      setIsProcessing(false)
      setUploadProgress(0)
      // Reset form
      setFile(null)
      setCsvHeaders([])
      setPreviewData([])
    },
    onError: (error: any) => {
      console.error('Upload failed:', error)
      setIsProcessing(false)
      setUploadProgress(0)
      if (error.response) {
        console.error('Response data:', error.response.data)
        console.error('Response status:', error.response.status)
        
        // Display validation errors to user
        if (error.response.data && error.response.data.detail) {
          const details = error.response.data.detail;
          if (Array.isArray(details)) {
            alert(`Validation errors:\n${details.map((d: any) => d.msg || d).join('\n')}`);
          } else {
            alert(`Error: ${details}`);
          }
        }
      }
    },
  })

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setFile(file)

    Papa.parse(file, {
      header: true,
      preview: 5, // Show first 5 rows
      complete: (results) => {
        setCsvHeaders(Object.keys(results.data[0] || {}))
        setPreviewData(results.data.slice(0, 5))
      },
      error: (error) => {
        console.error('CSV parsing error:', error)
      },
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) return

    // Clean up column mapping - convert empty strings to undefined for optional fields
    const cleanColumnMapping = {
      domain_column: columnMapping.domain_column,
      price_column: columnMapping.price_column,
      currency_column: columnMapping.currency_column || undefined,
      url_column: columnMapping.url_column || undefined,
      content_column: columnMapping.content_column || undefined,
      dofollow_column: columnMapping.dofollow_column || undefined,
      marketplace_column: columnMapping.marketplace_column || undefined,
    }

    // Determine marketplace info based on bulk mode
    let finalMarketplaceName: string
    let finalMarketplaceSlug: string

    if (bulkMarketplace.enabled) {
      finalMarketplaceName = bulkMarketplace.name
      finalMarketplaceSlug = bulkMarketplace.slug
    } else {
      finalMarketplaceName = marketplaceData.name
      finalMarketplaceSlug = marketplaceData.slug
    }

    const request: Omit<CSVUploadRequest, 'file'> = {
      marketplace_name: finalMarketplaceName,
      marketplace_slug: finalMarketplaceSlug,
      region: marketplaceData.region || undefined,
      column_mapping: cleanColumnMapping,
      currency_default: defaults.currency,
      content_default: defaults.content,
      dofollow_default: defaults.dofollow,
    }

    // Validate required fields
    if (!cleanColumnMapping.domain_column || !cleanColumnMapping.price_column) {
      alert('Please select Domain and Price columns')
      return
    }

    // Validate bulk marketplace fields if enabled
    if (bulkMarketplace.enabled) {
      if (!bulkMarketplace.name || !bulkMarketplace.slug) {
        alert('Please fill in both Marketplace Name and Slug for bulk upload')
        return
      }
    } else {
      // Validate regular marketplace fields if not in bulk mode
      if (!marketplaceData.name || !marketplaceData.slug) {
        alert('Please fill in both Marketplace Name and Slug')
        return
      }
    }

    console.log('Sending request:', request)
    setUploadProgress(0)
    setIsProcessing(false)
    mutation.mutate({ file, request })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload CSV</h1>
        <p className="mt-2 text-gray-600">
          Import marketplace data from CSV files to expand your backlink database
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload File</h2>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive
                ? 'Drop the file here...'
                : 'Drag and drop a CSV file here, or click to select'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports CSV, XLS, and XLSX files
            </p>
          </div>

          {file && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-green-600" />
                <span className="ml-2 text-sm text-green-800">{file.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Marketplace Information */}
        {file && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Marketplace Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marketplace Name *
                </label>
                <input
                  type="text"
                  value={marketplaceData.name}
                  onChange={(e) => setMarketplaceData({ ...marketplaceData, name: e.target.value })}
                  className="input"
                  required
                  placeholder="e.g., WhitePress"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={marketplaceData.slug}
                  onChange={(e) => setMarketplaceData({ ...marketplaceData, slug: e.target.value })}
                  className="input"
                  required
                  placeholder="e.g., whitepress"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <input
                  type="text"
                  value={marketplaceData.region}
                  onChange={(e) => setMarketplaceData({ ...marketplaceData, region: e.target.value })}
                  className="input"
                  placeholder="e.g., US, EU"
                />
              </div>
            </div>
          </div>
        )}

        {/* Column Mapping */}
        {csvHeaders.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Column Mapping</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain Column *
                </label>
                <select
                  value={columnMapping.domain_column}
                  onChange={(e) => setColumnMapping({ ...columnMapping, domain_column: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select column</option>
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Column *
                </label>
                <select
                  value={columnMapping.price_column}
                  onChange={(e) => setColumnMapping({ ...columnMapping, price_column: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select column</option>
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Column
                </label>
                <select
                  value={columnMapping.currency_column}
                  onChange={(e) => setColumnMapping({ ...columnMapping, currency_column: e.target.value })}
                  className="input"
                >
                  <option value="">Select column (optional)</option>
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Column
                </label>
                <select
                  value={columnMapping.url_column}
                  onChange={(e) => setColumnMapping({ ...columnMapping, url_column: e.target.value })}
                  className="input"
                >
                  <option value="">Select column (optional)</option>
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marketplace Column
                </label>
                <select
                  value={columnMapping.marketplace_column}
                  onChange={(e) => {
                    const value = e.target.value
                    setColumnMapping({ ...columnMapping, marketplace_column: value })
                    // Enable bulk mode if "bulk" is selected
                    if (value === 'bulk') {
                      setBulkMarketplace({ ...bulkMarketplace, enabled: true })
                    } else {
                      setBulkMarketplace({ ...bulkMarketplace, enabled: false })
                    }
                  }}
                  className="input"
                >
                  <option value="">Select column (optional)</option>
                  <option value="bulk">📦 All same marketplace (bulk upload)</option>
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulk Marketplace Configuration */}
            {bulkMarketplace.enabled && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-md font-semibold text-blue-900 mb-3">
                  📦 Bulk Marketplace Configuration
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  All domains in this CSV will be assigned to the same marketplace. 
                  This is perfect for bulk uploads where all domains come from the same vendor.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-1">
                      Marketplace Name *
                    </label>
                    <input
                      type="text"
                      value={bulkMarketplace.name}
                      onChange={(e) => setBulkMarketplace({ ...bulkMarketplace, name: e.target.value })}
                      className="input border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., WhitePress"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-1">
                      Marketplace Slug *
                    </label>
                    <input
                      type="text"
                      value={bulkMarketplace.slug}
                      onChange={(e) => setBulkMarketplace({ ...bulkMarketplace, slug: e.target.value })}
                      className="input border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., whitepress"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Default Values */}
        {csvHeaders.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Default Values</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Currency
                </label>
                <input
                  type="text"
                  value={defaults.currency}
                  onChange={(e) => setDefaults({ ...defaults, currency: e.target.value })}
                  className="input"
                  placeholder="USD"
                />
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={defaults.content}
                    onChange={(e) => setDefaults({ ...defaults, content: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Includes content by default</span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={defaults.dofollow}
                    onChange={(e) => setDefaults({ ...defaults, dofollow: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Dofollow by default</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {previewData.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Preview</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {csvHeaders.map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      {csvHeaders.map((header) => (
                        <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row[header] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Submit */}
        {file && (
          <div className="space-y-4">
            {/* Progress Bar */}
            {(mutation.isLoading || uploadProgress > 0) && (
              <div className="card bg-blue-50 border-blue-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      {isProcessing ? 'Processing CSV...' : `Uploading... ${uploadProgress}%`}
                    </span>
                    {isProcessing && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ 
                        width: isProcessing ? '100%' : `${uploadProgress}%` 
                      }}
                    ></div>
                  </div>
                  
                  {/* Status Text */}
                  <p className="text-xs text-blue-700">
                    {isProcessing 
                      ? 'File uploaded successfully. Processing rows in batches...'
                      : 'Uploading file to server...'
                    }
                  </p>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={mutation.isLoading || !marketplaceData.name || !marketplaceData.slug || !columnMapping.domain_column || !columnMapping.price_column}
                className="btn btn-primary px-6"
              >
                {mutation.isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{isProcessing ? 'Processing...' : 'Uploading...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload Data</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {mutation.data && (
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Upload successful!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Processed {mutation.data.total_rows_processed} rows</p>
                  <p>Added {mutation.data.new_offers_added} new offers</p>
                  <p>Updated {mutation.data.updated_offers} existing offers</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {mutation.isError && (
          <div className="card bg-red-50 border-red-200">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Upload failed</h3>
                <p className="text-sm text-red-700 mt-1">Please check your file and try again.</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
