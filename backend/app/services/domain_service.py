from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import re
from urllib.parse import urlparse
import tldextract
from datetime import datetime

from app.models.domain import Domain


class DomainService:
    def __init__(self, db: Session):
        self.db = db
    
    def normalize_domain(self, domain: str) -> Optional[str]:
        """
        Normalize a domain to eTLD+1 format.
        
        Args:
            domain: Raw domain string (can be URL, subdomain, etc.)
            
        Returns:
            Normalized domain string or None if invalid
        """
        if not domain:
            return None
        
        # Remove protocol if present
        if domain.startswith(('http://', 'https://')):
            domain = domain.replace('http://', '').replace('https://', '')
        
        # Remove path, query params, etc.
        domain = domain.split('/')[0]
        
        # Remove port if present
        domain = domain.split(':')[0]
        
        # Extract eTLD+1 using tldextract
        try:
            extracted = tldextract.extract(domain)
            if extracted.domain and extracted.suffix:
                normalized = f"{extracted.domain}.{extracted.suffix}"
                return normalized.lower()
        except Exception:
            pass
        
        return None
    
    def get_or_create_domains(self, domains: List[str]) -> List[Domain]:
        """
        Get existing domain records or create new ones.
        
        Args:
            domains: List of normalized domain strings
            
        Returns:
            List of Domain objects
        """
        # Get existing domains
        existing_domains = self.db.query(Domain).filter(
            Domain.root_domain.in_(domains)
        ).all()
        
        existing_domain_map = {d.root_domain: d for d in existing_domains}
        
        # Find domains that need to be created
        domains_to_create = []
        for domain in domains:
            if domain not in existing_domain_map:
                # Extract eTLD+1 for new domains
                extracted = tldextract.extract(domain)
                etld1 = f"{extracted.domain}.{extracted.suffix}" if extracted.domain and extracted.suffix else domain
                
                new_domain = Domain(
                    root_domain=domain,
                    etld1=etld1,
                    created_at=datetime.utcnow()
                )
                domains_to_create.append(new_domain)
        
        # Create new domains
        if domains_to_create:
            self.db.add_all(domains_to_create)
            self.db.commit()
            
            # Refresh to get IDs
            for domain in domains_to_create:
                self.db.refresh(domain)
        
        # Return all domains (existing + newly created)
        result = list(existing_domain_map.values()) + domains_to_create
        return result
    
    def get_domain_by_id(self, domain_id: int) -> Optional[Domain]:
        """Get domain by ID."""
        return self.db.query(Domain).filter(Domain.id == domain_id).first()
    
    def get_domain_by_name(self, domain_name: str) -> Optional[Domain]:
        """Get domain by name."""
        normalized = self.normalize_domain(domain_name)
        if not normalized:
            return None
        return self.db.query(Domain).filter(Domain.root_domain == normalized).first()
    
    def get_total_domains(self) -> int:
        """Get total number of domains in database."""
        return self.db.query(func.count(Domain.id)).scalar()
    
    def search_domains(self, query: str, limit: int = 10) -> List[Domain]:
        """Search domains by partial match."""
        return self.db.query(Domain).filter(
            Domain.root_domain.ilike(f"%{query}%")
        ).limit(limit).all()
