from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Dict, Optional, List
from decimal import Decimal
import requests
from datetime import date, datetime, timedelta
import logging

from app.models.fx_rate import FXRate
from app.models.offer import Offer
from app.core.config import settings

logger = logging.getLogger(__name__)


class FXService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_exchange_rate(self, currency: str, target_date: date = None) -> Optional[Decimal]:
        """
        Get exchange rate for a currency to USD.
        
        Args:
            currency: Source currency code (e.g., 'EUR', 'GBP')
            target_date: Date for the rate (defaults to today)
            
        Returns:
            Exchange rate as Decimal or None if not found
        """
        if not target_date:
            target_date = date.today()
        
        # Try to get from database first
        rate = self.db.query(FXRate).filter(
            and_(
                FXRate.currency == currency.upper(),
                FXRate.date == target_date
            )
        ).first()
        
        if rate:
            return rate.rate_to_usd
        
        # If not in database, try to fetch from API
        return self._fetch_and_store_rate(currency, target_date)
    
    def _fetch_and_store_rate(self, currency: str, target_date: date) -> Optional[Decimal]:
        """
        Fetch exchange rate from external API and store in database.
        
        Args:
            currency: Source currency code
            target_date: Date for the rate
            
        Returns:
            Exchange rate as Decimal or None if failed
        """
        try:
            # Use a free exchange rate API
            response = requests.get(
                f"https://api.exchangerate-api.com/v4/latest/{currency.upper()}",
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            if 'rates' in data and 'USD' in data['rates']:
                rate = Decimal(str(data['rates']['USD']))
                
                # Store in database
                fx_rate = FXRate(
                    date=target_date,
                    currency=currency.upper(),
                    rate_to_usd=rate,
                    created_at=datetime.utcnow()
                )
                self.db.add(fx_rate)
                self.db.commit()
                
                return rate
                
        except Exception as e:
            logger.error(f"Failed to fetch exchange rate for {currency}: {e}")
        
        return None
    
    def convert_to_usd(self, amount: Decimal, currency: str) -> Optional[Decimal]:
        """
        Convert an amount from a given currency to USD.
        
        Args:
            amount: Amount to convert
            currency: Source currency code
            
        Returns:
            Amount in USD or None if conversion failed
        """
        if currency.upper() == 'USD':
            return amount
        
        rate = self.get_exchange_rate(currency)
        if rate:
            return amount * rate
        
        return None
    
    def update_daily_rates(self) -> Dict[str, bool]:
        """
        Update exchange rates for all currencies we have offers for.
        
        Returns:
            Dictionary mapping currency codes to success status
        """
        # Get all unique currencies from offers
        currencies = self.db.query(func.distinct(Offer.price_currency)).all()
        currencies = [c[0] for c in currencies if c[0] and c[0].upper() != 'USD']
        
        results = {}
        for currency in currencies:
            try:
                rate = self._fetch_and_store_rate(currency, date.today())
                results[currency] = rate is not None
            except Exception as e:
                logger.error(f"Failed to update rate for {currency}: {e}")
                results[currency] = False
        
        return results
    
    def get_rate_history(self, currency: str, days: int = 30) -> List[Dict]:
        """
        Get exchange rate history for a currency.
        
        Args:
            currency: Currency code
            days: Number of days to look back
            
        Returns:
            List of rate records
        """
        cutoff_date = date.today() - timedelta(days=days)
        
        rates = self.db.query(FXRate).filter(
            and_(
                FXRate.currency == currency.upper(),
                FXRate.date >= cutoff_date
            )
        ).order_by(FXRate.date.desc()).all()
        
        return [
            {
                "date": rate.date.isoformat(),
                "rate": float(rate.rate_to_usd)
            }
            for rate in rates
        ]
