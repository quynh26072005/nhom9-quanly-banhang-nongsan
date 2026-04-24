"""
User Schemas
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    full_name: str
    phone: Optional[str] = None


class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """User update schema"""
    full_name: Optional[str] = None
    phone: Optional[str] = None


class RoleResponse(BaseModel):
    """Role response schema"""
    role_id: int
    role_name: str
    
    class Config:
        from_attributes = True


class UserResponse(UserBase):
    """User response schema"""
    user_id: UUID
    role: RoleResponse
    is_active: bool
    email_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class PasswordChange(BaseModel):
    """Password change schema"""
    old_password: str
    new_password: str = Field(..., min_length=6)


class AddressBase(BaseModel):
    """Base address schema"""
    recipient_name: str
    phone: str
    address_line: str
    ward: Optional[str] = None
    district: Optional[str] = None
    city: str
    is_default: bool = False


class AddressCreate(AddressBase):
    """Address creation schema"""
    pass


class AddressUpdate(BaseModel):
    """Address update schema"""
    recipient_name: Optional[str] = None
    phone: Optional[str] = None
    address_line: Optional[str] = None
    ward: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    is_default: Optional[bool] = None


class AddressResponse(AddressBase):
    """Address response schema"""
    address_id: int
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
