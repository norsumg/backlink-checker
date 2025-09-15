from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from typing import List, Optional
import hashlib
import os

from app.core.database import get_db
from app.models.marketplace import Marketplace
from app.models.domain import Domain
from app.models.offer import Offer
from app.models.fx_rate import FXRate
from app.models.user import User
from app.schemas.marketplace import MarketplaceResponse, MarketplaceCreate
from app.services.marketplace_service import MarketplaceService
from app.services.domain_service import DomainService
from app.services.offer_service import OfferService
from app.services.fx_service import FXService
from app.api.v1.endpoints.auth import get_current_admin_user

router = APIRouter()

from app.core.config import settings

# REMOVED: Insecure plain-text admin authentication
# Admin authentication now uses secure JWT tokens with admin claims
# See get_current_admin_user in auth.py for the secure implementation

# Marketplace Admin Endpoints
@router.get("/marketplaces")
async def admin_get_marketplaces(
    limit: int = 100,
    offset: int = 0,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc",
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Admin: Get marketplaces with search, sort, and pagination"""
    # Build base query
    query = db.query(Marketplace)
    
    # Apply search filter
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                Marketplace.name.ilike(search_term),
                Marketplace.slug.ilike(search_term),
                Marketplace.region.ilike(search_term)
            )
        )
    
    # Apply sorting
    if sort_by:
        if hasattr(Marketplace, sort_by):
            column = getattr(Marketplace, sort_by)
            if sort_order.lower() == "desc":
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())
    else:
        # Default sort by name
        query = query.order_by(Marketplace.name.asc())
    
    # Get total count before pagination
    total = query.count()
    
    # Apply pagination
    marketplaces = query.offset(offset).limit(limit).all()
    
    return {
        "marketplaces": [
            {
                "id": m.id,
                "name": m.name,
                "slug": m.slug,
                "region": m.region,
                "notes": m.notes,
                "created_at": m.created_at,
                "updated_at": m.updated_at
            }
            for m in marketplaces
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }

@router.delete("/marketplaces/{marketplace_id}")
async def admin_delete_marketplace(
    marketplace_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
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
    admin_user: User = Depends(get_current_admin_user)
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
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc",
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Admin: Get domains with search, sort, and pagination"""
    # Build base query with offer count
    query = db.query(
        Domain,
        func.count(Offer.id).label('offer_count')
    ).outerjoin(Offer).group_by(Domain.id)
    
    # Apply search filter
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                Domain.root_domain.ilike(search_term),
                Domain.etld1.ilike(search_term)
            )
        )
    
    # Apply sorting
    if sort_by:
        if sort_by == "offer_count":
            # Sort by the computed offer count
            if sort_order.lower() == "desc":
                query = query.order_by(func.count(Offer.id).desc())
            else:
                query = query.order_by(func.count(Offer.id).asc())
        elif hasattr(Domain, sort_by):
            column = getattr(Domain, sort_by)
            if sort_order.lower() == "desc":
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())
    else:
        # Default sort by root_domain
        query = query.order_by(Domain.root_domain.asc())
    
    # Get total count before pagination
    total = query.count()
    
    # Apply pagination
    results = query.offset(offset).limit(limit).all()
    
    return {
        "domains": [
            {
                "id": d.Domain.id,
                "root_domain": d.Domain.root_domain,
                "etld1": d.Domain.etld1,
                "created_at": d.Domain.created_at,
                "updated_at": d.Domain.updated_at,
                "offer_count": d.offer_count
            }
            for d in results
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }

@router.delete("/domains/{domain_id}")
async def admin_delete_domain(
    domain_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
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
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc",
    domain_id: Optional[int] = None,
    marketplace_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Admin: Get offers with search, sort, and pagination"""
    query = db.query(Offer).options(
        joinedload(Offer.domain),
        joinedload(Offer.marketplace)
    )
    
    # Apply existing filters
    if domain_id:
        query = query.filter(Offer.domain_id == domain_id)
    if marketplace_id:
        query = query.filter(Offer.marketplace_id == marketplace_id)
    
    # Apply search filter
    if search:
        search_term = f"%{search.lower()}%"
        query = query.join(Domain).join(Marketplace).filter(
            or_(
                Domain.root_domain.ilike(search_term),
                Marketplace.name.ilike(search_term),
                Offer.price_currency.ilike(search_term),
                Offer.listing_url.ilike(search_term)
            )
        )
    
    # Apply sorting
    if sort_by:
        if sort_by == "domain":
            # Sort by domain name
            query = query.join(Domain)
            if sort_order.lower() == "desc":
                query = query.order_by(Domain.root_domain.desc())
            else:
                query = query.order_by(Domain.root_domain.asc())
        elif sort_by == "marketplace":
            # Sort by marketplace name
            query = query.join(Marketplace)
            if sort_order.lower() == "desc":
                query = query.order_by(Marketplace.name.desc())
            else:
                query = query.order_by(Marketplace.name.asc())
        elif hasattr(Offer, sort_by):
            column = getattr(Offer, sort_by)
            if sort_order.lower() == "desc":
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())
    else:
        # Default sort by last_seen_at desc (newest first)
        query = query.order_by(Offer.last_seen_at.desc())
    
    # Get total count before pagination
    total = query.count()
    
    # Apply pagination
    offers = query.offset(offset).limit(limit).all()
    
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

@router.get("/offers/zero-price")
async def admin_get_zero_price_offers(
    limit: int = 50,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Admin: Get offers with zero or null price_usd for inspection"""
    offer_service = OfferService(db)
    count = offer_service.count_zero_price_offers()
    offers = offer_service.get_zero_price_offers(limit)
    
    return {
        "total_zero_price_offers": count,
        "sample_offers": [
            {
                "id": o.id,
                "domain": o.domain.root_domain,
                "marketplace": o.marketplace.name,
                "price_amount": float(o.price_amount) if o.price_amount else 0,
                "price_currency": o.price_currency,
                "price_usd": float(o.price_usd) if o.price_usd else None,
                "first_seen_at": o.first_seen_at,
                "last_seen_at": o.last_seen_at
            }
            for o in offers
        ],
        "limit": limit,
        "message": f"Found {count} offers with zero or null USD prices"
    }

@router.delete("/offers/zero-price")
async def admin_delete_zero_price_offers(
    confirm: bool = False,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Admin: Delete all offers with zero or null price_usd"""
    if not confirm:
        return {
            "error": "This action requires confirmation",
            "message": "Add ?confirm=true to the URL to confirm deletion of zero-price offers"
        }
    
    offer_service = OfferService(db)
    deleted_count = offer_service.delete_zero_price_offers()
    
    return {
        "message": f"Successfully deleted {deleted_count} offers with zero or null USD prices",
        "deleted_count": deleted_count
    }

@router.delete("/offers/{offer_id}")
async def admin_delete_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
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
    admin_user: User = Depends(get_current_admin_user)
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
    limit: int = 100,
    offset: int = 0,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "desc",
    currency: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Admin: Get FX rates with search, sort, and pagination"""
    query = db.query(FXRate)
    
    # Apply legacy currency filter
    if currency:
        query = query.filter(FXRate.currency == currency.upper())
    
    # Apply search filter
    if search:
        search_term = f"%{search.upper()}%"
        query = query.filter(FXRate.currency.ilike(search_term))
    
    # Apply sorting
    if sort_by:
        if hasattr(FXRate, sort_by):
            column = getattr(FXRate, sort_by)
            if sort_order.lower() == "desc":
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())
    else:
        # Default sort by date desc (newest first)
        query = query.order_by(FXRate.date.desc())
    
    # Get total count before pagination
    total = query.count()
    
    # Apply pagination
    rates = query.offset(offset).limit(limit).all()
    
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
    admin_user: User = Depends(get_current_admin_user)
):
    """Admin: Delete an FX rate"""
    rate = db.query(FXRate).filter(FXRate.id == rate_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail="FX rate not found")
    
    db.delete(rate)
    db.commit()
    
    return {"message": f"FX rate {rate_id} deleted successfully"}

# User Admin Endpoints
@router.get("/users")
async def admin_get_users(
    limit: int = 100,
    offset: int = 0,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "desc",
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Admin: Get users with search, sort, and pagination"""
    query = db.query(User)
    
    # Apply search filter
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                User.email.ilike(search_term),
                User.full_name.ilike(search_term),
                User.username.ilike(search_term)
            )
        )
    
    # Apply sorting
    if sort_by:
        if hasattr(User, sort_by):
            column = getattr(User, sort_by)
            if sort_order.lower() == "desc":
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())
    else:
        # Default sort by created_at desc (newest first)
        query = query.order_by(User.created_at.desc())
    
    # Get total count before pagination
    total = query.count()
    
    # Apply pagination
    users = query.offset(offset).limit(limit).all()
    
    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "full_name": u.full_name,
                "plan_type": u.plan_type,
                "searches_used_this_month": u.searches_used_this_month,
                "searches_remaining": u.searches_remaining,
                "is_active": u.is_active,
                "is_verified": u.is_verified,
                "is_admin": u.is_admin,
                "created_at": u.created_at,
                "last_login": u.last_login,
                "subscription_status": u.subscription_status
            }
            for u in users
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }

@router.put("/users/{user_id}")
async def admin_update_user(
    user_id: int,
    user_data: dict,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Admin: Update a specific user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update allowed fields
    allowed_fields = ['plan_type', 'is_active', 'is_verified', 'is_admin', 'searches_used_this_month']
    
    for field, value in user_data.items():
        if field in allowed_fields and hasattr(user, field):
            setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return {"message": f"User {user_id} updated successfully"}

@router.delete("/users/{user_id}")
async def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Admin: Delete a specific user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"message": f"User {user_id} deleted successfully"}

# Database Statistics
@router.get("/stats")
async def admin_get_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
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
