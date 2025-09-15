from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.services.auth_service import auth_service
from app.schemas.auth import (
    UserCreate, UserLogin, GoogleAuthRequest, Token, UserResponse, PasswordReset, AdminLogin
)
from app.models.user import User
from datetime import timedelta

router = APIRouter()
security = HTTPBearer()


def get_current_admin_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated admin user from JWT token"""
    token = credentials.credentials
    payload = auth_service.verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_str: str = payload.get("sub")
    is_admin: bool = payload.get("is_admin", False)
    
    if user_id_str is None or not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        user_id = int(user_id_str)
        user = db.query(User).filter(User.id == user_id).first()
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user is None or not user.is_admin or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    payload = auth_service.verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        user_id = int(user_id_str)
        user = db.query(User).filter(User.id == user_id).first()
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = auth_service.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = auth_service.create_user(db, user_data)
    
    # Create access token
    access_token_expires = timedelta(minutes=auth_service.access_token_expire_minutes)
    access_token = auth_service.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        expires_in=auth_service.access_token_expire_minutes * 60,
        user=UserResponse.from_orm(user)
    )


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password"""
    user = auth_service.authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Update last login
    user.last_login = db.query(User).filter(User.id == user.id).first().last_login
    
    # Create access token
    access_token_expires = timedelta(minutes=auth_service.access_token_expire_minutes)
    access_token = auth_service.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        expires_in=auth_service.access_token_expire_minutes * 60,
        user=UserResponse.from_orm(user)
    )


@router.post("/google", response_model=Token)
async def google_auth(google_auth: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate with Google OAuth"""
    
    try:
        # Check if Google OAuth is properly configured
        from app.core.config import settings
        if not settings.google_client_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth is not properly configured on the server"
            )
        
        # Handle both ID token and user info approaches
        if google_auth.id_token:
            # Traditional ID token approach
            google_user_info = auth_service.verify_google_token(google_auth.id_token)
            if not google_user_info:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google token"
                )
        elif google_auth.user_info:
            # Popup OAuth approach - user info already provided
            google_user_info = {
                'sub': google_auth.user_info.get('id'),
                'email': google_auth.user_info.get('email'),
                'name': google_auth.user_info.get('name'),
                'picture': google_auth.user_info.get('picture')
            }
            # Basic validation
            if not google_user_info.get('email') or not google_user_info.get('sub'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid user info"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either id_token or user_info must be provided"
            )
        
        # Create or update user
        user = auth_service.create_or_update_google_user(db, google_user_info)
        
        # Create access token
        access_token_expires = timedelta(minutes=auth_service.access_token_expire_minutes)
        access_token = auth_service.create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            expires_in=auth_service.access_token_expire_minutes * 60,
            user=UserResponse.from_orm(user)
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the error for debugging
        print(f"Google authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google authentication failed: {str(e)}"
        )


@router.get("/google-config-check")
async def check_google_config():
    """Debug endpoint to check Google OAuth configuration"""
    from app.core.config import settings
    return {
        "google_client_id_configured": bool(settings.google_client_id),
        "google_client_id_length": len(settings.google_client_id) if settings.google_client_id else 0,
        "google_client_secret_configured": bool(settings.google_client_secret)
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user information"""
    # Ensure admin users have unlimited plan
    current_user = auth_service.ensure_admin_unlimited_plan(db, current_user)
    return UserResponse.from_orm(current_user)


@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: User = Depends(get_current_user)):
    """Refresh access token"""
    # Create new access token
    access_token_expires = timedelta(minutes=auth_service.access_token_expire_minutes)
    access_token = auth_service.create_access_token(
        data={"sub": str(current_user.id)}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        expires_in=auth_service.access_token_expire_minutes * 60,
        user=UserResponse.from_orm(current_user)
    )


@router.post("/admin-reset-password")
async def admin_reset_password(
    reset_data: PasswordReset,
    db: Session = Depends(get_db)
):
    """
    Admin endpoint to reset password using a simple token approach.
    Token format: "admin:{email}" (for admin@test.com, token would be "admin:admin@test.com")
    """
    # Simple token validation for admin
    if not reset_data.token.startswith("admin:"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )
    
    email = reset_data.token.replace("admin:", "")
    
    # Find user by email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Hash new password and update
    hashed_password = auth_service.get_password_hash(reset_data.new_password)
    user.hashed_password = hashed_password
    db.commit()
    
    return {"message": f"Password successfully reset for {email}"}


@router.post("/admin-login", response_model=Token)
async def admin_login(admin_data: AdminLogin, db: Session = Depends(get_db)):
    """
    Secure admin login endpoint that validates credentials and returns JWT token.
    
    This replaces the insecure plain-text password authentication system.
    """
    # Validate admin credentials - check for admin user in database
    # Look up by username OR email to handle both cases
    admin_user = db.query(User).filter(
        or_(User.username == admin_data.username, User.email == admin_data.username),
        User.is_admin == True,
        User.is_active == True
    ).first()
    
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )
    
    # Verify password against hashed password in database
    if not auth_service.verify_password(admin_data.password, admin_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )
    
    # Update last login
    from datetime import datetime
    admin_user.last_login = datetime.utcnow()
    db.commit()
    
    # Create JWT token with admin claims
    access_token = auth_service.create_access_token(
        data={"sub": str(admin_user.id), "is_admin": True},
        expires_delta=timedelta(hours=24)  # Longer session for admin
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=24 * 60 * 60,  # 24 hours in seconds
        user=UserResponse.from_orm(admin_user)
    )
