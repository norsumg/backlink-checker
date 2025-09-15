from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: Optional[str] = None  # Optional for OAuth users
    is_admin: bool = False


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    id_token: Optional[str] = None
    user_info: Optional[dict] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserResponse"


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    is_admin: bool = False
    avatar_url: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    plan_type: Optional[str] = None
    
    class Config:
        from_attributes = True


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str


class AdminLogin(BaseModel):
    username: str
    password: str


# Update Token schema to avoid circular import
Token.model_rebuild()
