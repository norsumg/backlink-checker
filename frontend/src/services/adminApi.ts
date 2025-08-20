import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

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
  async getMarketplaces() {
    const response = await this.api.get('/marketplaces')
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
  async getDomains(limit = 100, offset = 0) {
    const response = await this.api.get(`/domains?limit=${limit}&offset=${offset}`)
    return response.data
  }

  async deleteDomain(id: number) {
    const response = await this.api.delete(`/domains/${id}`)
    return response.data
  }

  // Offers
  async getOffers(limit = 100, offset = 0, domainId?: number, marketplaceId?: number) {
    let url = `/offers?limit=${limit}&offset=${offset}`
    if (domainId) url += `&domain_id=${domainId}`
    if (marketplaceId) url += `&marketplace_id=${marketplaceId}`
    
    const response = await this.api.get(url)
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
  async getFxRates(currency?: string, limit = 100, offset = 0) {
    let url = `/fx-rates?limit=${limit}&offset=${offset}`
    if (currency) url += `&currency=${currency}`
    
    const response = await this.api.get(url)
    return response.data
  }

  async deleteFxRate(id: number) {
    const response = await this.api.delete(`/fx-rates/${id}`)
    return response.data
  }
}

export const adminApi = new AdminApiService()
