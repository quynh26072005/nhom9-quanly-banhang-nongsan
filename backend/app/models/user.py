"""
User Models
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.base import Base


class Role(Base):
    """Role model"""
    __tablename__ = "roles"
    
    role_id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    users = relationship("User", back_populates="role")


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255))
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20))
    role_id = Column(Integer, ForeignKey("roles.role_id"), nullable=False)
    
    # OAuth fields
    oauth_provider = Column(String(50))  # 'google', 'facebook', 'local'
    oauth_id = Column(String(255))
    
    # API Key
    api_key = Column(String(255), unique=True)
    api_key_expires_at = Column(DateTime(timezone=True))
    
    # Status
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    role = relationship("Role", back_populates="users")
    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="customer")
    reviews = relationship("Review", back_populates="user")


class Address(Base):
    """Address model"""
    __tablename__ = "addresses"
    
    address_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    recipient_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    address_line = Column(Text, nullable=False)
    ward = Column(String(100))
    district = Column(String(100))
    city = Column(String(100), nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="addresses")
