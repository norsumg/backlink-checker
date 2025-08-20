from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime


class ColumnMapping(BaseModel):
    domain_column: str = Field(..., description="Column name containing domain information")
    price_column: str = Field(..., description="Column name containing price information")
    currency_column: Optional[str] = Field(None, description="Column name containing currency information")
    url_column: Optional[str] = Field(None, description="Column name containing listing URL")
    content_column: Optional[str] = Field(None, description="Column name indicating if content is included")
    dofollow_column: Optional[str] = Field(None, description="Column name indicating if link is dofollow")
    marketplace_column: Optional[str] = Field(None, description="Column name containing marketplace/vendor information")


class CSVUploadRequest(BaseModel):
    marketplace_name: str = Field(..., description="Name of the marketplace")
    marketplace_slug: str = Field(..., description="Slug for the marketplace")
    region: Optional[str] = Field(None, description="Region of the marketplace")
    column_mapping: ColumnMapping
    currency_default: str = Field("USD", description="Default currency if not specified in CSV")
    content_default: bool = Field(False, description="Default value for includes_content if not specified")
    dofollow_default: bool = Field(True, description="Default value for dofollow if not specified")


class CSVUploadResponse(BaseModel):
    marketplace_id: int
    total_rows_processed: int
    successful_imports: int
    failed_imports: int
    new_domains_added: int
    new_offers_added: int
    updated_offers: int
    processing_time_ms: int
    errors: List[str] = []
    
    class Config:
        from_attributes = True
