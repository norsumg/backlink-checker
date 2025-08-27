import axios from 'axios'

// Always use relative path to avoid HTTP/HTTPS mixed content issues
const API_BASE_URL = '/api/v1'

class AdminApiService {
  private authToken: string = ''

  private api = axios.create({
    baseURL: `${API_BASE_URL}/admin`,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  constructor() {
    // Add auth interceptor
    this.api.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`
      }
      return config
    })
  }

  setAuthToken(token: string) {
    this.authToken = token
  }

  // Statistics
  async getStats() {
    const response = await this.api.get('/stats')
    return response.data
  }

  // Marketplaces
  async getMarketplaces(params?: {
    limit?: number
    offset?: number
    search?: string
    sort_by?: string
    sort_order?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by)
    if (params?.sort_order) searchParams.append('sort_order', params.sort_order)
    
    const response = await this.api.get(`/marketplaces?${searchParams.toString()}`)
    return response.data
  }

  async deleteMarketplace(id: number) {
    const response = await this.api.delete(`/marketplaces/${id}`)
    return response.data
  }

  async updateMarketplace(id: number, data: any) {
    const response = await this.api.put(`/marketplaces/${id}`, data)
    return response.data
  }

  // Domains
  async getDomains(params?: {
    limit?: number
    offset?: number
    search?: string
    sort_by?: string
    sort_order?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by)
    if (params?.sort_order) searchParams.append('sort_order', params.sort_order)
    
    const response = await this.api.get(`/domains?${searchParams.toString()}`)
    return response.data
  }

  async deleteDomain(id: number) {
    const response = await this.api.delete(`/domains/${id}`)
    return response.data
  }

  // Offers
  async getOffers(params?: {
    limit?: number
    offset?: number
    search?: string
    sort_by?: string
    sort_order?: string
    domain_id?: number
    marketplace_id?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by)
    if (params?.sort_order) searchParams.append('sort_order', params.sort_order)
    if (params?.domain_id) searchParams.append('domain_id', params.domain_id.toString())
    if (params?.marketplace_id) searchParams.append('marketplace_id', params.marketplace_id.toString())
    
    const response = await this.api.get(`/offers?${searchParams.toString()}`)
    return response.data
  }

  async deleteOffer(id: number) {
    const response = await this.api.delete(`/offers/${id}`)
    return response.data
  }

  async updateOffer(id: number, data: any) {
    const response = await this.api.put(`/offers/${id}`, data)
    return response.data
  }

  // FX Rates
  async getFxRates(params?: {
    limit?: number
    offset?: number
    search?: string
    sort_by?: string
    sort_order?: string
    currency?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by)
    if (params?.sort_order) searchParams.append('sort_order', params.sort_order)
    if (params?.currency) searchParams.append('currency', params.currency)
    
    const response = await this.api.get(`/fx-rates?${searchParams.toString()}`)
    return response.data
  }

  async deleteFxRate(id: number) {
    const response = await this.api.delete(`/fx-rates/${id}`)
    return response.data
  }
}

export const adminApi = new AdminApiService()
