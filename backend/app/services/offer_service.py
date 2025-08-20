from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import List, Dict, Optional
from decimal import Decimal
from datetime import datetime

from app.models.offer import Offer
from app.models.marketplace import Marketplace


class OfferService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_offers_for_domains(
        self, 
        domain_ids: List[int], 
        filters: Dict = None
    ) -> List[Offer]:
        """
        Get offers for specific domains with optional filters.
        
        Args:
            domain_ids: List of domain IDs to search
            filters: Optional filters (marketplace_slugs, min_price_usd, max_price_usd)
            
        Returns:
            List of Offer objects with marketplace relationship loaded
        """
        query = self.db.query(Offer).options(
            joinedload(Offer.marketplace),
            joinedload(Offer.domain)
        ).filter(Offer.domain_id.in_(domain_ids))
        
        # Apply filters
        if filters:
            if 'marketplace_slugs' in filters:
                query = query.join(Marketplace).filter(
                    Marketplace.slug.in_(filters['marketplace_slugs'])
                )
            
            if 'min_price_usd' in filters:
                query = query.filter(Offer.price_usd >= filters['min_price_usd'])
            
            if 'max_price_usd' in filters:
                query = query.filter(Offer.price_usd <= filters['max_price_usd'])
        
        return query.all()
    
    def get_offers_by_marketplace(self, marketplace_id: int) -> List[Offer]:
        """Get all offers for a specific marketplace."""
        return self.db.query(Offer).filter(
            Offer.marketplace_id == marketplace_id
        ).all()
    
    def get_offers_by_domain(self, domain_id: int) -> List[Offer]:
        """Get all offers for a specific domain."""
        return self.db.query(Offer).options(
            joinedload(Offer.marketplace)
        ).filter(Offer.domain_id == domain_id).all()
    
    def create_offer(self, offer_data: Dict) -> Offer:
        """Create a new offer."""
        now = datetime.utcnow()
        offer_data['first_seen_at'] = now
        offer_data['last_seen_at'] = now
        offer = Offer(**offer_data)
        self.db.add(offer)
        self.db.commit()
        self.db.refresh(offer)
        return offer
    
    def update_offer(self, offer_id: int, update_data: Dict) -> Optional[Offer]:
        """Update an existing offer."""
        offer = self.db.query(Offer).filter(Offer.id == offer_id).first()
        if not offer:
            return None
        
        for key, value in update_data.items():
            setattr(offer, key, value)
        
        # Update last_seen_at timestamp
        offer.last_seen_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(offer)
        return offer
    
    def get_total_offers(self) -> int:
        """Get total number of offers in database."""
        return self.db.query(func.count(Offer.id)).scalar()
    
    def get_total_marketplaces(self) -> int:
        """Get total number of marketplaces with offers."""
        return self.db.query(func.count(func.distinct(Offer.marketplace_id))).scalar()
    
    def get_average_price_usd(self) -> Optional[Decimal]:
        """Get average USD price across all offers."""
        result = self.db.query(func.avg(Offer.price_usd)).filter(
            Offer.price_usd.isnot(None)
        ).scalar()
        return result if result else None
    
    def get_price_range_usd(self) -> Dict:
        """Get price range statistics in USD."""
        # Get min and max prices
        result = self.db.query(
            func.min(Offer.price_usd),
            func.max(Offer.price_usd)
        ).filter(Offer.price_usd.isnot(None)).first()
        
        if result and result[0] is not None:
            min_price = result[0]
            max_price = result[1]
            
            # For SQLite, we'll calculate quartiles manually
            # Get all prices sorted
            prices = [row[0] for row in self.db.query(Offer.price_usd).filter(
                Offer.price_usd.isnot(None)
            ).order_by(Offer.price_usd.asc()).all()]
            
            if prices:
                n = len(prices)
                q25_idx = int(0.25 * n)
                q75_idx = int(0.75 * n)
                q25 = prices[q25_idx] if q25_idx < n else prices[0]
                q75 = prices[q75_idx] if q75_idx < n else prices[-1]
                
                return {
                    "min": min_price,
                    "max": max_price,
                    "q25": q25,
                    "q75": q75
                }
        
        return {"min": 0, "max": 0, "q25": 0, "q75": 0}
    
    def get_offers_by_price_range(
        self, 
        min_price: Decimal, 
        max_price: Decimal
    ) -> List[Offer]:
        """Get offers within a specific price range."""
        return self.db.query(Offer).options(
            joinedload(Offer.marketplace),
            joinedload(Offer.domain)
        ).filter(
            and_(
                Offer.price_usd >= min_price,
                Offer.price_usd <= max_price
            )
        ).all()
    
    def get_best_offers_by_domain(self, domain_ids: List[int]) -> List[Offer]:
        """Get the best (lowest USD price) offer for each domain."""
        # This is a complex query that finds the minimum price per domain
        # and then gets the corresponding offers
        subquery = self.db.query(
            Offer.domain_id,
            func.min(Offer.price_usd).label('min_price')
        ).filter(
            and_(
                Offer.domain_id.in_(domain_ids),
                Offer.price_usd.isnot(None)
            )
        ).group_by(Offer.domain_id).subquery()
        
        return self.db.query(Offer).options(
            joinedload(Offer.marketplace),
            joinedload(Offer.domain)
        ).join(
            subquery,
            and_(
                Offer.domain_id == subquery.c.domain_id,
                Offer.price_usd == subquery.c.min_price
            )
        ).all()
    
    def get_offer_by_domain_and_marketplace(self, domain_id: int, marketplace_id: int) -> Optional[Offer]:
        """Get offer by domain and marketplace combination."""
        return self.db.query(Offer).filter(
            and_(
                Offer.domain_id == domain_id,
                Offer.marketplace_id == marketplace_id
            )
        ).first()
