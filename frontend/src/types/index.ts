// API Response Types
export interface DomainLookupRequest {
  domains: string[]
  marketplaces?: string[]
  min_price_usd?: number
  max_price_usd?: number
  best_price_only?: boolean
}

export interface OfferResult {
  domain: string
  marketplace: string
  marketplace_slug: string
  price_amount: number
  price_currency: string
  price_usd: number | null
  listing_url?: string
  includes_content: boolean
  dofollow: boolean
  last_seen_at: string
  is_best_price: boolean
}

export interface DomainLookupResponse {
  results: OfferResult[]
  total_domains_searched: number
  domains_with_offers: number
  total_offers_found: number
  processing_time_ms: number
}

export interface CSVUploadRequest {
  marketplace_name: string
  marketplace_slug: string
  region?: string
  column_mapping: ColumnMapping
  currency_default: string
  content_default: boolean
  dofollow_default: boolean
}

export interface ColumnMapping {
  domain_column: string
  price_column: string
  currency_column?: string
  url_column?: string
  content_column?: string
  dofollow_column?: string
  marketplace_column?: string
}

export interface CSVUploadResponse {
  marketplace_id: number
  total_rows_processed: number
  successful_imports: number
  failed_imports: number
  new_domains_added: number
  new_offers_added: number
  updated_offers: number
  processing_time_ms: number
  errors: string[]
}

export interface Marketplace {
  id: number
  name: string
  slug: string
  region?: string
  notes?: string
  created_at: string
  updated_at?: string
}

export interface Stats {
  total_domains: number
  total_offers: number
  total_marketplaces: number
  avg_price_usd: number
  price_range_usd: {
    min: number
    max: number
    q25: number
    q75: number
  }
}

// UI Component Types
export interface TableColumn<T> {
  key: keyof T
  label: string
  render?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
}

export interface FilterOption {
  value: string
  label: string
}
