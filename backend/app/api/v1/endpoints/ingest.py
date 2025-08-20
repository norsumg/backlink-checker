from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from decimal import Decimal
import pandas as pd
import json
import time

from app.core.database import get_db
from app.schemas.csv_upload import CSVUploadRequest, CSVUploadResponse
from app.services.marketplace_service import MarketplaceService
from app.services.domain_service import DomainService
from app.services.offer_service import OfferService
from app.services.fx_service import FXService

router = APIRouter()


@router.post("/csv", response_model=CSVUploadResponse)
async def upload_csv(
    file: UploadFile = File(...),
    data: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Upload and process a CSV file containing marketplace data.
    
    This endpoint:
    1. Validates the uploaded file
    2. Maps columns according to the provided mapping
    3. Creates or updates marketplace records
    4. Processes domain and offer data
    5. Returns processing statistics
    """
    start_time = time.time()
    
    # Validate file type
    if not file.filename.lower().endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be CSV, XLS, or XLSX")
    
    # Parse request data
    try:
        request_data = json.loads(data)
        upload_request = CSVUploadRequest(**request_data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid request data: {str(e)}")
    
    # Initialize services
    marketplace_service = MarketplaceService(db)
    domain_service = DomainService(db)
    offer_service = OfferService(db)
    fx_service = FXService(db)
    
    try:
        # Read file
        if file.filename.lower().endswith('.csv'):
            df = pd.read_csv(file.file)
        else:
            df = pd.read_excel(file.file)
        
        # Validate required columns exist
        required_columns = [upload_request.column_mapping.domain_column, upload_request.column_mapping.price_column]
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing_columns}")
        
        # Get or create marketplace
        # Note: Currently all offers use the same marketplace from the form
        # Future enhancement: Support individual marketplace columns from CSV
        marketplace = marketplace_service.get_or_create_marketplace(
            name=upload_request.marketplace_name,
            slug=upload_request.marketplace_slug,
            region=upload_request.region
        )
        
        # Process data
        total_rows = len(df)
        successful_imports = 0
        failed_imports = 0
        new_domains = 0
        new_offers = 0
        updated_offers = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Extract data from row
                domain_raw = str(row[upload_request.column_mapping.domain_column]).strip()
                price_raw = row[upload_request.column_mapping.price_column]
                
                # Skip empty rows
                if not domain_raw or pd.isna(price_raw):
                    continue
                
                # Normalize domain
                domain = domain_service.normalize_domain(domain_raw)
                if not domain:
                    errors.append(f"Row {index + 1}: Invalid domain '{domain_raw}'")
                    failed_imports += 1
                    continue
                
                # Get or create domain
                domain_record = domain_service.get_or_create_domains([domain])[0]
                if domain_record.id is None:  # New domain
                    new_domains += 1
                
                # Parse price
                try:
                    price_amount = float(price_raw)
                except (ValueError, TypeError):
                    errors.append(f"Row {index + 1}: Invalid price '{price_raw}'")
                    failed_imports += 1
                    continue
                
                # Get currency
                currency = upload_request.currency_default
                if upload_request.column_mapping.currency_column and upload_request.column_mapping.currency_column in df.columns:
                    currency_raw = row[upload_request.column_mapping.currency_column]
                    if pd.notna(currency_raw) and str(currency_raw).strip():
                        currency = str(currency_raw).strip().upper()
                
                # Convert to USD
                price_usd = fx_service.convert_to_usd(price_amount_decimal, currency)
                # If conversion fails, use original price as fallback
                if price_usd is None:
                    if currency.upper() == 'USD':
                        price_usd = price_amount
                    else:
                        # For non-USD currencies, try to get rate from database
                        # If still no rate, set to None (will be handled by frontend)
                        price_usd = None
                
                # Debug logging
                print(f"Row {index + 1}: Amount={price_amount}, Currency={currency}, USD={price_usd}")
                
                # Ensure price_amount is properly formatted for database
                try:
                    price_amount_decimal = Decimal(str(price_amount))
                except (ValueError, TypeError):
                    errors.append(f"Row {index + 1}: Invalid price amount '{price_amount}'")
                    failed_imports += 1
                    continue
                
                # Get optional fields
                listing_url = None
                if upload_request.column_mapping.url_column and upload_request.column_mapping.url_column in df.columns:
                    url_raw = row[upload_request.column_mapping.url_column]
                    if pd.notna(url_raw) and str(url_raw).strip():
                        listing_url = str(url_raw).strip()
                
                includes_content = upload_request.content_default
                if upload_request.column_mapping.content_column and upload_request.column_mapping.content_column in df.columns:
                    content_raw = row[upload_request.column_mapping.content_column]
                    if pd.notna(content_raw):
                        includes_content = bool(content_raw)
                
                dofollow = upload_request.dofollow_default
                if upload_request.column_mapping.dofollow_column and upload_request.column_mapping.dofollow_column in df.columns:
                    dofollow_raw = row[upload_request.column_mapping.dofollow_column]
                    if pd.notna(dofollow_raw):
                        dofollow = bool(dofollow_raw)
                
                # Check if offer already exists
                existing_offer = offer_service.get_offer_by_domain_and_marketplace(
                    domain_record.id, marketplace.id
                )
                
                if existing_offer:
                    # Update existing offer
                    offer_service.update_offer(existing_offer.id, {
                        'price_amount': price_amount_decimal,
                        'price_currency': currency,
                        'price_usd': price_usd,
                        'listing_url': listing_url,
                        'includes_content': includes_content,
                        'dofollow': dofollow,
                    })
                    updated_offers += 1
                else:
                    # Create new offer
                    offer_data = {
                        'domain_id': domain_record.id,
                        'marketplace_id': marketplace.id,
                        'listing_url': listing_url,
                        'price_amount': price_amount_decimal,
                        'price_currency': currency,
                        'price_usd': price_usd,
                        'includes_content': includes_content,
                        'dofollow': dofollow,
                    }
                    print(f"Creating offer with data: {offer_data}")
                    try:
                        offer = offer_service.create_offer(offer_data)
                        print(f"Created offer ID: {offer.id}")
                        new_offers += 1
                    except Exception as e:
                        print(f"Error creating offer: {e}")
                        errors.append(f"Row {index + 1}: Failed to create offer: {str(e)}")
                        failed_imports += 1
                        continue
                
                successful_imports += 1
                
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
                failed_imports += 1
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return CSVUploadResponse(
            marketplace_id=marketplace.id,
            total_rows_processed=total_rows,
            successful_imports=successful_imports,
            failed_imports=failed_imports,
            new_domains_added=new_domains,
            new_offers_added=new_offers,
            updated_offers=updated_offers,
            processing_time_ms=processing_time_ms,
            errors=errors[:10]  # Limit errors to first 10
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
