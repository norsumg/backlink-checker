from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Application
    app_name: str = "Backlink Price Finder"
    version: str = "1.0.0"
    debug: bool = False
    
    # Database
    database_url: str = "sqlite:///./backlink_checker.db"
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # API
    api_v1_prefix: str = "/api/v1"
    
    # CORS
    allowed_origins: list = ["http://localhost:3000", "http://localhost:8000"]
    
    # File upload
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    allowed_file_types: list = [".csv", ".xlsx", ".xls"]
    
    # External APIs
    exchange_rate_api_url: str = "https://api.exchangerate-api.com/v4/latest/USD"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
