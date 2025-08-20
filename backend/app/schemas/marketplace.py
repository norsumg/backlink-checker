from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MarketplaceCreate(BaseModel):
    name: str = Field(..., description="Marketplace name", min_length=1, max_length=255)
    slug: str = Field(..., description="Marketplace slug", min_length=1, max_length=100)
    region: Optional[str] = Field(None, description="Marketplace region", max_length=100)
    notes: Optional[str] = Field(None, description="Additional notes")


class MarketplaceResponse(BaseModel):
    id: int
    name: str
    slug: str
    region: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class MarketplaceList(BaseModel):
    marketplaces: list[MarketplaceResponse]
    total: int
    
    class Config:
        from_attributes = True
