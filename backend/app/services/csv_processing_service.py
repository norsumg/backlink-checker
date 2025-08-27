import pandas as pd
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import Dict, Any, Optional
from datetime import datetime

from app.schemas.csv_upload import CSVUploadRequest
from app.services.marketplace_service import MarketplaceService
from app.services.domain_service import DomainService
from app.services.offer_service import OfferService
from app.services.fx_service import FXService


class CSVProcessingService:
    def __init__(self, db: Session, request: CSVUploadRequest, df: pd.DataFrame):
        self.db = db
        self.request = request
        self.df = df
        
        # Initialize services
        self.marketplace_service = MarketplaceService(db)
        self.domain_service = DomainService(db)
        self.offer_service = OfferService(db)
        self.fx_service = FXService(db)
        
        # Initialize results tracking
        self.results = {
            "successful_imports": 0,
            "failed_imports": 0,
            "new_domains": 0,
            "new_offers": 0,
            "updated_offers": 0,
            "errors": []
        }
        
        # Get or create marketplace once
        self.marketplace = self._get_or_create_marketplace()

    def process(self) -> Dict[str, Any]:
        """Main processing method with batch processing for better performance."""
        total_rows = len(self.df)
        print(f"Processing {total_rows} rows...")
        
        # Process in batches for better performance and memory management
        batch_size = 100
        processed_count = 0
        
        for start_idx in range(0, total_rows, batch_size):
            end_idx = min(start_idx + batch_size, total_rows)
            batch_df = self.df.iloc[start_idx:end_idx]
            
            print(f"Processing batch {start_idx + 1}-{end_idx} of {total_rows}...")
            
            for index, row in batch_df.iterrows():
                try:
                    self._process_row(index, row)
                    processed_count += 1
                    
                    # Log progress every 1000 rows
                    if processed_count % 1000 == 0:
                        print(f"Processed {processed_count}/{total_rows} rows...")
                        
                except Exception as e:
                    error_msg = f"Row {index + 1}: {str(e)}"
                    print(f"Error processing row {index + 1}: {e}")
                    self.results['errors'].append(error_msg)
                    self.results['failed_imports'] += 1
            
            # Commit batch to database
            try:
                self.db.commit()
                print(f"Committed batch {start_idx + 1}-{end_idx}")
            except Exception as e:
                print(f"Error committing batch: {e}")
                self.db.rollback()
                raise
        
        print(f"Processing complete. Results: {self.results}")
        return self.results

    def _get_or_create_marketplace(self):
        """Get or create the marketplace for this upload."""
        try:
            marketplace = self.marketplace_service.get_or_create_marketplace(
                name=self.request.marketplace_name,
                slug=self.request.marketplace_slug,
                region=self.request.region
            )
            print(f"Marketplace: ID={marketplace.id}, Name='{marketplace.name}', Slug='{marketplace.slug}'")
            return marketplace
        except Exception as e:
            print(f"Error creating/finding marketplace: {e}")
            raise Exception(f"Failed to create/find marketplace: {str(e)}")

    def _process_row(self, index: int, row: pd.Series):
        """Handle individual row processing."""
        # 1. Extract and validate row data
        data = self._extract_row_data(index, row)
        if not data['is_valid']:
            return  # Skip invalid rows

        # 2. Get or create domain
        domain_record = self.domain_service.get_or_create_domains([data['domain']])[0]
        if domain_record.id is None:  # New domain
            self.results['new_domains'] += 1

        # 3. Handle offer creation/update logic
        self._process_offer(domain_record, data)
        self.results['successful_imports'] += 1

    def _extract_row_data(self, index: int, row: pd.Series) -> Dict[str, Any]:
        """Extract and validate data from a single CSV row."""
        try:
            # Extract domain
            domain_raw = str(row[self.request.column_mapping.domain_column]).strip()
            price_raw = row[self.request.column_mapping.price_column]
            
            # Skip empty rows or rows with zero/empty prices
            if not domain_raw or pd.isna(price_raw):
                return {"is_valid": False}
            
            # Check for empty string or zero price values
            price_str = str(price_raw).strip()
            if price_str == '' or price_str == '0' or price_str == '0.0' or price_str == '0.00':
                return {"is_valid": False}
            
            # Normalize domain
            domain = self.domain_service.normalize_domain(domain_raw)
            if not domain:
                self.results['errors'].append(f"Row {index + 1}: Invalid domain '{domain_raw}'")
                return {"is_valid": False}
            
            # Parse price
            try:
                price_amount = float(price_raw)
                price_amount_decimal = Decimal(str(price_amount))
                
                # Skip rows with zero or negative prices
                if price_amount <= 0:
                    return {"is_valid": False}
                    
            except (ValueError, TypeError):
                self.results['errors'].append(f"Row {index + 1}: Invalid price '{price_raw}'")
                return {"is_valid": False}
            
            # Get currency
            currency = self._validate_currency(row)
            
            # Convert to USD
            price_usd = self.fx_service.convert_to_usd(price_amount_decimal, currency)
            if price_usd is None:
                if currency.upper() == 'USD':
                    price_usd = price_amount
                else:
                    price_usd = None
            
            # Debug logging
            print(f"Row {index + 1}: Amount={price_amount}, Currency={currency}, USD={price_usd}")
            
            # Get optional fields
            listing_url = self._extract_optional_field(row, self.request.column_mapping.url_column)
            includes_content = self._extract_boolean_field(row, self.request.column_mapping.content_column, self.request.content_default)
            dofollow = self._extract_boolean_field(row, self.request.column_mapping.dofollow_column, self.request.dofollow_default)
            
            return {
                "is_valid": True,
                "domain": domain,
                "price_amount": price_amount_decimal,
                "currency": currency,
                "price_usd": price_usd,
                "listing_url": listing_url,
                "includes_content": includes_content,
                "dofollow": dofollow
            }
            
        except Exception as e:
            self.results['errors'].append(f"Row {index + 1}: Error extracting data: {str(e)}")
            return {"is_valid": False}

    def _validate_currency(self, row: pd.Series) -> str:
        """Validate and determine the currency for the row."""
        currency = self.request.currency_default
        
        if self.request.column_mapping.currency_column and self.request.column_mapping.currency_column in self.df.columns:
            currency_raw = row[self.request.column_mapping.currency_column]
            if pd.notna(currency_raw) and str(currency_raw).strip():
                currency = str(currency_raw).strip().upper()
        
        return currency

    def _extract_optional_field(self, row: pd.Series, column_name: Optional[str]) -> Optional[str]:
        """Extract an optional string field from the row."""
        if column_name and column_name in self.df.columns:
            value = row[column_name]
            if pd.notna(value) and str(value).strip():
                return str(value).strip()
        return None

    def _extract_boolean_field(self, row: pd.Series, column_name: Optional[str], default_value: bool) -> bool:
        """Extract a boolean field from the row."""
        if column_name and column_name in self.df.columns:
            value = row[column_name]
            if pd.notna(value):
                return bool(value)
        return default_value

    def _process_offer(self, domain_record, data: Dict[str, Any]):
        """Handle the creation or update of an offer."""
        try:
            existing_offer = self.offer_service.get_offer_by_domain_and_marketplace(
                domain_record.id, self.marketplace.id
            )
            
            if existing_offer:
                print(f"Updating existing offer ID {existing_offer.id} for domain {domain_record.root_domain}")
                # Update existing offer
                self.offer_service.update_offer(existing_offer.id, {
                    'price_amount': data['price_amount'],
                    'price_currency': data['currency'],
                    'price_usd': data['price_usd'],
                    'listing_url': data['listing_url'],
                    'includes_content': data['includes_content'],
                    'dofollow': data['dofollow'],
                })
                self.results['updated_offers'] += 1
            else:
                print(f"Creating new offer for domain {domain_record.root_domain}")
                # Create new offer
                offer_data = {
                    'domain_id': domain_record.id,
                    'marketplace_id': self.marketplace.id,
                    'listing_url': data['listing_url'],
                    'price_amount': data['price_amount'],
                    'price_currency': data['currency'],
                    'price_usd': data['price_usd'],
                    'includes_content': data['includes_content'],
                    'dofollow': data['dofollow'],
                }
                print(f"Creating offer with data: {offer_data}")
                
                try:
                    offer = self.offer_service.create_offer(offer_data)
                    print(f"Created offer ID: {offer.id}")
                    self.results['new_offers'] += 1
                except Exception as e:
                    print(f"Error creating offer: {e}")
                    self.results['errors'].append(f"Failed to create offer: {str(e)}")
                    raise
                    
        except Exception as e:
            print(f"Error in offer lookup/creation: {e}")
            self.results['errors'].append(f"Error in offer processing: {str(e)}")
            raise
