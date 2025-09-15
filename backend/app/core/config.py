from pydantic_settings import BaseSettings
from typing import Optional
import os
import sys


class Settings(BaseSettings):
    # Application
    app_name: str = "Backlink Price Finder"
    version: str = "1.0.0"
    debug: bool = False
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./backlink_checker.db")
    
    # Security
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    admin_password: str = os.getenv("ADMIN_PASSWORD", "change-this-admin-password")
    
    # API
    api_v1_prefix: str = "/api/v1"
    
    # CORS - Only HTTPS in production for security
    allowed_origins: list = [
        "https://backlinkpricechecker.com",
        # Development origins (only when DEBUG=True)
        *([
            "http://localhost:3000", 
            "http://localhost:8000"
        ] if os.getenv("DEBUG", "false").lower() == "true" else [])
    ]
    
    # File upload
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    allowed_file_types: list = [".csv", ".xlsx", ".xls"]
    
    # External APIs
    exchange_rate_api_url: str = "https://api.exchangerate-api.com/v4/latest/USD"
    
    # Google OAuth
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    
    # Stripe
    stripe_publishable_key: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    stripe_secret_key: str = os.getenv("STRIPE_SECRET_KEY", "")
    stripe_webhook_secret: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    stripe_price_id: str = os.getenv("STRIPE_PRICE_ID", "")  # prod_SwK6hviTuCVhIy
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._validate_production_security()
    
    def _validate_production_security(self):
        """Validate security settings in production"""
        if not self.debug:  # Production mode
            # Check for weak default secrets
            weak_secrets = []
            
            if self.secret_key == "your-secret-key-change-in-production":
                weak_secrets.append("SECRET_KEY")
            
            # Note: ADMIN_PASSWORD check removed - we now use JWT authentication
            
            if weak_secrets:
                print("🚨 SECURITY ERROR: Weak default secrets detected in production!")
                print(f"   Please set secure values for: {', '.join(weak_secrets)}")
                print("   Application startup aborted for security.")
                sys.exit(1)
            
            # Validate secret key strength
            if len(self.secret_key) < 32:
                print("🚨 SECURITY WARNING: SECRET_KEY should be at least 32 characters long")
                print("   Current length:", len(self.secret_key))
                sys.exit(1)
            
            print("✅ Production security validation passed")


settings = Settings()
