from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import hashlib
import os

from app.core.database import get_db
from app.models.marketplace import Marketplace
from app.models.domain import Domain
from app.models.offer import Offer
from app.models.fx_rate import FXRate
from app.schemas.marketplace import MarketplaceResponse, MarketplaceCreate
from app.services.marketplace_service import MarketplaceService
from app.services.domain_service import DomainService
from app.services.offer_service import OfferService
from app.services.fx_service import FXService

router = APIRouter()

# Simple admin authentication - in production, use proper JWT/OAuth
ADMIN_PASSWORD_HASH = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"  # "password"

def verify_admin_auth(authorization: str = Header(None)):
    """Simple admin authentication"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Admin authorization required")
    
    # Expect "Bearer <password>"
    try:
        scheme, password = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        if password_hash != ADMIN_PASSWORD_HASH:
            raise HTTPException(status_code=401, detail="Invalid admin password")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization format")

# Marketplace Admin Endpoints
@router.get("/marketplaces", response_model=List[MarketplaceResponse])
async def admin_get_marketplaces(
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin_auth)
):
    """Admin: Get all marketplaces with full details"""
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

@router.delete("/marketplaces/{marketplace_id}")
async def admin_delete_marketplace(
    marketplace_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin_auth)
):
    """Admin: Delete a marketplace and all its offers"""
    marketplace_service = MarketplaceService(db)
    success = marketplace_service.delete_marketplace(marketplace_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Marketplace not found")
    
    return {"message": f"Marketplace {marketplace_id} deleted successfully"}

@router.put("/marketplaces/{marketplace_id}", response_model=MarketplaceResponse)
async def admin_update_marketplace(
    marketplace_id: int,
    marketplace_data: MarketplaceCreate,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin_auth)
):
    """Admin: Update a marketplace"""
    marketplace = db.query(Marketplace).filter(Marketplace.id == marketplace_id).first()
    if not marketplace:
        raise HTTPException(status_code=404, detail="Marketplace not found")
    
    marketplace.name = marketplace_data.name
    marketplace.slug = marketplace_data.slug
    marketplace.region = marketplace_data.region
    marketplace.notes = marketplace_data.notes
    
    db.commit()
    db.refresh(marketplace)
    
    return MarketplaceResponse(
        id=marketplace.id,
        name=marketplace.name,
        slug=marketplace.slug,
        region=marketplace.region,
        notes=marketplace.notes,
        created_at=marketplace.created_at,
        updated_at=marketplace.updated_at
    )

# Domain Admin Endpoints
@router.get("/domains")
async def admin_get_domains(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin_auth)
):
    """Admin: Get all domains with pagination"""
    domains = db.query(Domain).offset(offset).limit(limit).all()
    total = db.query(Domain).count()
    
    return {
        "domains": [
            {
                "id": d.id,
                "root_domain": d.root_domain,
                "etld1": d.etld1,
                "created_at": d.created_at,
                "updated_at": d.updated_at,
                "offer_count": len(d.offers) if hasattr(d, 'offers') else 0
            }
            for d in domains
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }

@router.delete("/domains/{domain_id}")
async def admin_delete_domain(
    domain_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin_auth)
):
    """Admin: Delete a domain and all its offers"""
    domain = db.query(Domain).filter(Domain.id == domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    # Delete all offers for this domain first
    db.query(Offer).filter(Offer.domain_id == domain_id).delete()
    db.delete(domain)
    db.commit()
    
    return {"message": f"Domain {domain_id} and all its offers deleted successfully"}

# Offer Admin Endpoints
@router.get("/offers")
async def admin_get_offers(
    limit: int = 100,
    offset: int = 0,
    domain_id: Optional[int] = None,
    marketplace_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin_auth)
):
    """Admin: Get all offers with pagination and filters"""
    query = db.query(Offer).options(
        joinedload(Offer.domain),
        joinedload(Offer.marketplace)
    )
    
    if domain_id:
        query = query.filter(Offer.domain_id == domain_id)
    if marketplace_id:
        query = query.filter(Offer.marketplace_id == marketplace_id)
    
    offers = query.offset(offset).limit(limit).all()
    total = query.count()
    
    return {
        "offers": [
            {
                "id": o.id,
                "domain": o.domain.root_domain,
                "marketplace": o.marketplace.name,
                "marketplace_slug": o.marketplace.slug,
                "price_amount": float(o.price_amount) if o.price_amount else 0,
                "price_currency": o.price_currency,
                "price_usd": float(o.price_usd) if o.price_usd else None,
                "listing_url": o.listing_url,
                "includes_content": o.includes_content,
                "dofollow": o.dofollow,
                "first_seen_at": o.first_seen_at,
                "last_seen_at": o.last_seen_at
            }
            for o in offers
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }

@router.delete("/offers/{offer_id}")
async def admin_delete_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin_auth)
):
    """Admin: Delete a specific offer"""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    db.delete(offer)
    db.commit()
    
    return {"message": f"Offer {offer_id} deleted successfully"}

@router.put("/offers/{offer_id}")
async def admin_update_offer(
    offer_id: int,
    offer_data: dict,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin_auth)
):
    """Admin: Update a specific offer"""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Update allowed fields
    allowed_fields = ['price_amount', 'price_currency', 'price_usd', 'listing_url', 
                     'includes_content', 'dofollow']
    
    for field, value in offer_data.items():
        if field in allowed_fields and hasattr(offer, field):
            setattr(offer, field, value)
    
    db.commit()
    db.refresh(offer)
    
    return {"message": f"Offer {offer_id} updated successfully"}

# FX Rate Admin Endpoints
@router.get("/fx-rates")
async def admin_get_fx_rates(
    currency: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin_auth)
):
    """Admin: Get FX rates"""
    query = db.query(FXRate)
    
    if currency:
        query = query.filter(FXRate.currency == currency.upper())
    
    rates = query.order_by(FXRate.date.desc()).offset(offset).limit(limit).all()
    total = query.count()
    
    return {
        "fx_rates": [
            {
                "id": r.id,
                "date": r.date.isoformat(),
                "currency": r.currency,
                "rate_to_usd": float(r.rate_to_usd) if r.rate_to_usd else 0,
                "created_at": r.created_at
            }
            for r in rates
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }

@router.delete("/fx-rates/{rate_id}")
async def admin_delete_fx_rate(
    rate_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin_auth)
):
    """Admin: Delete an FX rate"""
    rate = db.query(FXRate).filter(FXRate.id == rate_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail="FX rate not found")
    
    db.delete(rate)
    db.commit()
    
    return {"message": f"FX rate {rate_id} deleted successfully"}

# Database Statistics
@router.get("/stats")
async def admin_get_stats(
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin_auth)
):
    """Admin: Get comprehensive database statistics"""
    return {
        "marketplaces": db.query(Marketplace).count(),
        "domains": db.query(Domain).count(),
        "offers": db.query(Offer).count(),
        "fx_rates": db.query(FXRate).count(),
        "recent_offers": db.query(Offer).order_by(Offer.last_seen_at.desc()).limit(10).count(),
        "currencies": db.query(Offer.price_currency).distinct().count()
    }
