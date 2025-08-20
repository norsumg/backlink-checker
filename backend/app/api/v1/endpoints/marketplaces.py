from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.services.marketplace_service import MarketplaceService
from app.schemas.marketplace import MarketplaceCreate, MarketplaceResponse, MarketplaceList

router = APIRouter()


@router.get("/", response_model=List[MarketplaceResponse])
async def get_marketplaces(db: Session = Depends(get_db)):
    """
    Get all marketplaces.
    """
    marketplace_service = MarketplaceService(db)
    marketplaces = marketplace_service.get_all_marketplaces()
    
    return [
        MarketplaceResponse(
            id=m.id,
            name=m.name,
            slug=m.slug,
            region=m.region,
            notes=m.notes,
            created_at=m.created_at,
            updated_at=m.updated_at
        )
        for m in marketplaces
    ]


@router.post("/", response_model=MarketplaceResponse)
async def create_marketplace(
    marketplace: MarketplaceCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new marketplace.
    """
    marketplace_service = MarketplaceService(db)
    
    # Check if marketplace with same slug already exists
    existing = marketplace_service.get_marketplace_by_slug(marketplace.slug)
    if existing:
        raise HTTPException(status_code=400, detail="Marketplace with this slug already exists")
    
    # Create marketplace
    new_marketplace = marketplace_service.get_or_create_marketplace(
        name=marketplace.name,
        slug=marketplace.slug,
        region=marketplace.region
    )
    
    return MarketplaceResponse(
        id=new_marketplace.id,
        name=new_marketplace.name,
        slug=new_marketplace.slug,
        region=new_marketplace.region,
        notes=new_marketplace.notes,
        created_at=new_marketplace.created_at,
        updated_at=new_marketplace.updated_at
    )


@router.get("/{marketplace_id}", response_model=MarketplaceResponse)
async def get_marketplace(marketplace_id: int, db: Session = Depends(get_db)):
    """
    Get a specific marketplace by ID.
    """
    marketplace_service = MarketplaceService(db)
    marketplace = marketplace_service.get_marketplace_by_id(marketplace_id)
    
    if not marketplace:
        raise HTTPException(status_code=404, detail="Marketplace not found")
    
    return MarketplaceResponse(
        id=marketplace.id,
        name=marketplace.name,
        slug=marketplace.slug,
        region=marketplace.region,
        notes=marketplace.notes,
        created_at=marketplace.created_at,
        updated_at=marketplace.updated_at
    )


@router.get("/{marketplace_id}/stats")
async def get_marketplace_stats(marketplace_id: int, db: Session = Depends(get_db)):
    """
    Get statistics for a specific marketplace.
    """
    marketplace_service = MarketplaceService(db)
    stats = marketplace_service.get_marketplace_stats(marketplace_id)
    
    if not stats:
        raise HTTPException(status_code=404, detail="Marketplace not found")
    
    return stats


@router.delete("/{marketplace_id}")
async def delete_marketplace(marketplace_id: int, db: Session = Depends(get_db)):
    """
    Delete a marketplace and all associated offers.
    """
    marketplace_service = MarketplaceService(db)
    success = marketplace_service.delete_marketplace(marketplace_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Marketplace not found")
    
    return {"message": "Marketplace deleted successfully"}
