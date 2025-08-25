from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import time
from decimal import Decimal

from app.core.database import get_db
from app.schemas.lookup import DomainLookupRequest, DomainLookupResponse, OfferResult
from app.services.domain_service import DomainService
from app.services.offer_service import OfferService
from app.services.fx_service import FXService
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User
from app.services.usage_service import usage_service

router = APIRouter()


@router.post("/", response_model=DomainLookupResponse)
async def lookup_domains(
    request: DomainLookupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lookup domains to find backlink offers from various marketplaces.
    
    This endpoint searches for domains across all marketplaces and returns:
    - All offers found for each domain
    - Normalized USD prices
    - Best price flags
    - Marketplace information
    """
    start_time = time.time()
    
    # Check if user can perform this search
    can_search, message = usage_service.can_perform_search(db, current_user)
    if not can_search:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "Free Search Limit Exceeded",
                "message": message,
                "upgrade_url": "/pricing",
                "current_plan": current_user.plan_type,
                "searches_used": current_user.searches_used_this_month
            }
        )
    
    # Initialize services
    domain_service = DomainService(db)
    offer_service = OfferService(db)
    fx_service = FXService(db)
    
    # Normalize domains (remove www, punycode, etc.)
    normalized_domains = []
    for domain in request.domains:
        normalized = domain_service.normalize_domain(domain)
        if normalized:
            normalized_domains.append(normalized)
    
    if not normalized_domains:
        raise HTTPException(status_code=400, detail="No valid domains provided")
    
    # Get or create domain records
    domain_records = domain_service.get_or_create_domains(normalized_domains)
    
    # Build query filters
    filters = {}
    if request.marketplaces:
        filters['marketplace_slugs'] = request.marketplaces
    if request.min_price_usd:
        filters['min_price_usd'] = request.min_price_usd
    if request.max_price_usd:
        filters['max_price_usd'] = request.max_price_usd
    
    # Get offers for all domains
    all_offers = offer_service.get_offers_for_domains(
        domain_ids=[d.id for d in domain_records],
        filters=filters
    )
    
    # Group offers by domain and identify best prices
    results = []
    domains_with_offers = set()
    
    for domain_record in domain_records:
        domain_offers = [o for o in all_offers if o.domain_id == domain_record.id]
        
        if domain_offers:
            domains_with_offers.add(domain_record.root_domain)
            
            # Find best price (lowest USD price)
            best_price_usd = min(o.price_usd for o in domain_offers if o.price_usd)
            
            # Convert to response format
            for offer in domain_offers:
                is_best_price = offer.price_usd == best_price_usd if offer.price_usd else False
                
                result = OfferResult(
                    domain=domain_record.root_domain,
                    marketplace=offer.marketplace.name,
                    marketplace_slug=offer.marketplace.slug,
                    price_amount=float(offer.price_amount) if offer.price_amount else 0.0,
                    price_currency=offer.price_currency,
                    price_usd=float(offer.price_usd) if offer.price_usd else None,
                    listing_url=offer.listing_url,
                    includes_content=offer.includes_content,
                    dofollow=offer.dofollow,
                    last_seen_at=offer.last_seen_at,
                    is_best_price=is_best_price
                )
                results.append(result)
    
    # Filter to best price only if requested
    if request.best_price_only:
        best_price_results = []
        domain_best_prices = {}
        
        for result in results:
            if result.is_best_price:
                best_price_results.append(result)
                domain_best_prices[result.domain] = result
        
        results = best_price_results
    
    processing_time_ms = int((time.time() - start_time) * 1000)
    
    # Record the search usage
    search_query = f"Searched {len(normalized_domains)} domains: {', '.join(normalized_domains[:3])}"
    if len(normalized_domains) > 3:
        search_query += f" and {len(normalized_domains) - 3} more"
    
    usage_service.record_search(db, current_user, search_query, len(results))
    
    return DomainLookupResponse(
        results=results,
        total_domains_searched=len(normalized_domains),
        domains_with_offers=len(domains_with_offers),
        total_offers_found=len(results),
        processing_time_ms=processing_time_ms
    )


@router.get("/stats")
async def get_lookup_stats(db: Session = Depends(get_db)):
    """
    Get statistics about the lookup system.
    """
    from app.services.offer_service import OfferService
    from app.services.domain_service import DomainService
    
    offer_service = OfferService(db)
    domain_service = DomainService(db)
    
    stats = {
        "total_domains": domain_service.get_total_domains(),
        "total_offers": offer_service.get_total_offers(),
        "total_marketplaces": offer_service.get_total_marketplaces(),
        "avg_price_usd": offer_service.get_average_price_usd(),
        "price_range_usd": offer_service.get_price_range_usd()
    }
    
    return stats
