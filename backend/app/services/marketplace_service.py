from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from app.models.marketplace import Marketplace


class MarketplaceService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_or_create_marketplace(self, name: str, slug: str, region: str = None) -> Marketplace:
        """
        Get existing marketplace or create a new one.
        
        Args:
            name: Marketplace name
            slug: Marketplace slug
            region: Marketplace region (optional)
            
        Returns:
            Marketplace object
        """
        # Try to find existing marketplace by slug
        marketplace = self.db.query(Marketplace).filter(Marketplace.slug == slug).first()
        
        if marketplace:
            # Update name and region if provided
            updated = False
            if name and marketplace.name != name:
                marketplace.name = name
                updated = True
            if region and marketplace.region != region:
                marketplace.region = region
                updated = True
            
            if updated:
                marketplace.updated_at = datetime.utcnow()
                self.db.commit()
            return marketplace
        
        # Create new marketplace
        marketplace = Marketplace(
            name=name,
            slug=slug,
            region=region,
            created_at=datetime.utcnow()
        )
        self.db.add(marketplace)
        self.db.commit()
        self.db.refresh(marketplace)
        
        return marketplace
    
    def get_marketplace_by_id(self, marketplace_id: int) -> Optional[Marketplace]:
        """Get marketplace by ID."""
        return self.db.query(Marketplace).filter(Marketplace.id == marketplace_id).first()
    
    def get_marketplace_by_slug(self, slug: str) -> Optional[Marketplace]:
        """Get marketplace by slug."""
        return self.db.query(Marketplace).filter(Marketplace.slug == slug).first()
    
    def get_all_marketplaces(self) -> List[Marketplace]:
        """Get all marketplaces."""
        return self.db.query(Marketplace).order_by(Marketplace.name).all()
    
    def get_marketplaces_with_offers(self) -> List[Marketplace]:
        """Get marketplaces that have offers."""
        return self.db.query(Marketplace).join(Marketplace.offers).distinct().all()
    
    def delete_marketplace(self, marketplace_id: int) -> bool:
        """Delete marketplace and all associated offers."""
        marketplace = self.get_marketplace_by_id(marketplace_id)
        if not marketplace:
            return False
        
        self.db.delete(marketplace)
        self.db.commit()
        return True
    
    def get_marketplace_stats(self, marketplace_id: int) -> dict:
        """Get statistics for a specific marketplace."""
        marketplace = self.get_marketplace_by_id(marketplace_id)
        if not marketplace:
            return {}
        
        total_offers = len(marketplace.offers)
        unique_domains = len(set(offer.domain_id for offer in marketplace.offers))
        
        # Calculate price statistics
        prices = [offer.price_usd for offer in marketplace.offers if offer.price_usd]
        avg_price = sum(prices) / len(prices) if prices else 0
        min_price = min(prices) if prices else 0
        max_price = max(prices) if prices else 0
        
        return {
            'id': marketplace.id,
            'name': marketplace.name,
            'slug': marketplace.slug,
            'total_offers': total_offers,
            'unique_domains': unique_domains,
            'avg_price_usd': avg_price,
            'min_price_usd': min_price,
            'max_price_usd': max_price,
        }
