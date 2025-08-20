from pydantic import BaseModel, Field
from typing import List, Optional
from decimal import Decimal
from datetime import datetime


class DomainLookupRequest(BaseModel):
    domains: List[str] = Field(..., description="List of domains to lookup", min_items=1, max_items=1000)
    marketplaces: Optional[List[str]] = Field(None, description="Filter by specific marketplaces")
    min_price_usd: Optional[float] = Field(None, description="Minimum price in USD")
    max_price_usd: Optional[float] = Field(None, description="Maximum price in USD")
    best_price_only: Optional[bool] = Field(False, description="Return only the best price per domain")


class OfferResult(BaseModel):
    domain: str
    marketplace: str
    marketplace_slug: str
    price_amount: float
    price_currency: str
    price_usd: Optional[float]
    listing_url: Optional[str]
    includes_content: bool
    dofollow: bool
    last_seen_at: datetime
    is_best_price: bool
    
    class Config:
        from_attributes = True


class DomainLookupResponse(BaseModel):
    results: List[OfferResult]
    total_domains_searched: int
    domains_with_offers: int
    total_offers_found: int
    processing_time_ms: int
    
    class Config:
        from_attributes = True
