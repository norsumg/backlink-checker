from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class OfferCreate(BaseModel):
    """Schema for creating a new offer."""
    domain_id: int = Field(..., description="ID of the domain")
    marketplace_id: int = Field(..., description="ID of the marketplace")
    listing_url: str = Field(..., description="URL of the listing")
    price_amount: Decimal = Field(..., description="Price amount")
    price_currency: str = Field(..., description="Currency code (e.g., 'USD', 'EUR')")
    includes_content: bool = Field(default=False, description="Whether the offer includes content")
    dofollow: bool = Field(default=True, description="Whether the link is dofollow")
    first_seen_at: datetime = Field(default_factory=datetime.utcnow, description="When the offer was first seen")
    last_seen_at: datetime = Field(default_factory=datetime.utcnow, description="When the offer was last seen")


class OfferResponse(BaseModel):
    """Schema for offer response."""
    id: int
    domain_id: int
    marketplace_id: int
    listing_url: str
    price_amount: Decimal
    price_currency: str
    price_usd: Optional[Decimal] = None
    includes_content: bool
    dofollow: bool
    first_seen_at: datetime
    last_seen_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OfferList(BaseModel):
    """Schema for list of offers."""
    offers: list[OfferResponse]
    total: int
    page: int
    size: int


class OfferLookupResponse(BaseModel):
    """Schema for offer lookup response."""
    id: int
    marketplace_name: str
    marketplace_slug: str
    listing_url: str
    price_amount: Decimal
    price_currency: str
    price_usd: Optional[Decimal] = None
    includes_content: bool
    dofollow: bool
    last_seen_at: datetime
    is_best_price: bool = False

    class Config:
        from_attributes = True
