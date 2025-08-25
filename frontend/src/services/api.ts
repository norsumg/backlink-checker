import axios from 'axios'
import {
  DomainLookupRequest,
  DomainLookupResponse,
  CSVUploadRequest,
  CSVUploadResponse,
  Marketplace,
  Stats,
} from '../types'

// Always use relative path to avoid HTTP/HTTPS mixed content issues
const API_BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Domain Lookup API
export const lookupDomains = async (request: DomainLookupRequest): Promise<DomainLookupResponse> => {
  const response = await api.post<DomainLookupResponse>('/lookup/', request)
  return response.data
}

export const getLookupStats = async (): Promise<Stats> => {
  const response = await api.get<Stats>('/lookup/stats')
  return response.data
}

// CSV Upload API
export const uploadCSV = async (
  file: File,
  request: Omit<CSVUploadRequest, 'file'>
): Promise<CSVUploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('data', JSON.stringify(request))

  const response = await api.post<CSVUploadResponse>('/ingest/csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

// Marketplace API
export const getMarketplaces = async (): Promise<Marketplace[]> => {
  const response = await api.get<Marketplace[]>('/marketplaces')
  return response.data
}

export const createMarketplace = async (marketplace: Omit<Marketplace, 'id' | 'created_at' | 'updated_at'>): Promise<Marketplace> => {
  const response = await api.post<Marketplace>('/marketplaces', marketplace)
  return response.data
}

// Health check
export const healthCheck = async (): Promise<{ status: string; version: string }> => {
  const response = await api.get('/health')
  return response.data
}

export default api
