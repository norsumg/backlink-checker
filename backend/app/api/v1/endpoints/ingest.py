from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from decimal import Decimal
import pandas as pd
import json
import time

from app.core.database import get_db
from app.core.config import settings
from app.schemas.csv_upload import CSVUploadRequest, CSVUploadResponse
from app.services.csv_processing_service import CSVProcessingService

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
    
    # Check file size
    file_content = await file.read()
    file_size = len(file_content)
    if file_size > settings.max_file_size:
        raise HTTPException(status_code=413, detail=f"File size ({file_size / 1024 / 1024:.1f}MB) exceeds maximum allowed size ({settings.max_file_size / 1024 / 1024:.0f}MB)")
    
    # Reset file pointer for processing
    await file.seek(0)
    
    # Parse request data
    try:
        request_data = json.loads(data)
        upload_request = CSVUploadRequest(**request_data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid request data: {str(e)}")
    
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
        
        # Process CSV using the new service
        csv_processor = CSVProcessingService(db, upload_request, df)
        results = csv_processor.process()
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return CSVUploadResponse(
            marketplace_id=csv_processor.marketplace.id,
            total_rows_processed=len(df),
            successful_imports=results['successful_imports'],
            failed_imports=results['failed_imports'],
            new_domains_added=results['new_domains'],
            new_offers_added=results['new_offers'],
            updated_offers=results['updated_offers'],
            processing_time_ms=processing_time_ms,
            errors=results['errors'][:10]  # Limit errors to first 10
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
