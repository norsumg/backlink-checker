from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DomainCreate(BaseModel):
    """Schema for creating a new domain."""
    root_domain: str = Field(..., description="The root domain (e.g., 'example.com')")
    etld1: str = Field(..., description="The eTLD+1 domain (e.g., 'example.com')")


class DomainResponse(BaseModel):
    """Schema for domain response."""
    id: int
    root_domain: str
    etld1: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DomainList(BaseModel):
    """Schema for list of domains."""
    domains: list[DomainResponse]
    total: int
    page: int
    size: int
