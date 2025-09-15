from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from google.auth.transport import requests
from google.oauth2 import id_token
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import UserCreate
from sqlalchemy.orm import Session
import requests as http_requests


class AuthService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.secret_key = settings.secret_key
        self.algorithm = settings.algorithm
        self.access_token_expire_minutes = settings.access_token_expire_minutes
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        return self.pwd_context.hash(password)
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[dict]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            return None
    
    def verify_google_token(self, id_token_str: str) -> Optional[dict]:
        """Verify Google ID token and return user info"""
        try:
            # Check if Google Client ID is configured
            if not settings.google_client_id:
                print("Google Client ID is not configured")
                return None
            
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(
                id_token_str, 
                requests.Request(), 
                settings.google_client_id
            )
            
            # Check if the token is valid
            if idinfo['aud'] != settings.google_client_id:
                raise ValueError('Wrong audience.')
            
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            return idinfo
        except Exception as e:
            print(f"Google token verification failed: {e}")
            print(f"Google Client ID configured: {bool(settings.google_client_id)}")
            return None
    
    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate a user with email and password"""
        user = db.query(User).filter(User.email == email).first()
        if not user or not user.hashed_password:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        
        # Ensure admin users have unlimited plan
        user = self.ensure_admin_unlimited_plan(db, user)
        return user
    
    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    def get_user_by_google_id(self, db: Session, google_id: str) -> Optional[User]:
        """Get user by Google ID"""
        return db.query(User).filter(User.google_id == google_id).first()
    
    def create_user(self, db: Session, user_data: UserCreate) -> User:
        """Create a new user"""
        hashed_password = None
        if user_data.password:
            hashed_password = self.get_password_hash(user_data.password)
        
        # Set plan_type to unlimited for admin users
        plan_type = 'unlimited' if user_data.is_admin else 'free'
        
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            is_verified=True if not user_data.password else False,  # OAuth users are pre-verified
            is_admin=user_data.is_admin,
            plan_type=plan_type
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    def create_or_update_google_user(self, db: Session, google_user_info: dict) -> User:
        """Create or update user from Google OAuth"""
        google_id = google_user_info['sub']
        email = google_user_info['email']
        
        # Check if user exists
        user = self.get_user_by_google_id(db, google_id)
        if not user:
            # Check if user exists with same email
            user = self.get_user_by_email(db, email)
            if user:
                # Link existing user to Google
                user.google_id = google_id
                user.avatar_url = google_user_info.get('picture')
                user.is_verified = True
            else:
                # Create new user
                user = User(
                    email=email,
                    full_name=google_user_info.get('name'),
                    username=google_user_info.get('email', '').split('@')[0],
                    google_id=google_id,
                    avatar_url=google_user_info.get('picture'),
                    is_verified=True,
                    is_active=True
                )
                db.add(user)
        else:
            # Update existing user info
            user.full_name = google_user_info.get('name', user.full_name)
            user.avatar_url = google_user_info.get('picture', user.avatar_url)
        
        user.last_login = datetime.utcnow()
        
        # Ensure admin users have unlimited plan
        user = self.ensure_admin_unlimited_plan(db, user)
        
        db.commit()
        db.refresh(user)
        return user
    
    def ensure_admin_unlimited_plan(self, db: Session, user: User) -> User:
        """Ensure admin users have unlimited plan type"""
        if user.is_admin and user.plan_type != 'unlimited':
            user.plan_type = 'unlimited'
            db.commit()
            db.refresh(user)
        return user


auth_service = AuthService()
