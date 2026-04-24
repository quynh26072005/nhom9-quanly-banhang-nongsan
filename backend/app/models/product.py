"""
Product Models
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Category(Base):
    """Category model"""
    __tablename__ = "categories"
    
    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(255), nullable=False)
    description = Column(Text)
    parent_category_id = Column(Integer, ForeignKey("categories.category_id"))
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    products = relationship("Product", back_populates="category")
    parent = relationship("Category", remote_side=[category_id], backref="children")


class Season(Base):
    """Season model"""
    __tablename__ = "seasons"
    
    season_id = Column(Integer, primary_key=True, index=True)
    season_name = Column(String(100), nullable=False)
    start_month = Column(Integer)
    end_month = Column(Integer)
    description = Column(Text)
    
    # Relationships
    products = relationship("Product", back_populates="season")


class Product(Base):
    """Product model"""
    __tablename__ = "products"
    
    product_id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(255), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.category_id"), nullable=False)
    season_id = Column(Integer, ForeignKey("seasons.season_id"))
    description = Column(Text)
    unit = Column(String(50), nullable=False)  # 'kg', 'tấn', 'bó', 'quả'
    
    # Pricing
    price = Column(Numeric(15, 2), nullable=False)
    discount_percent = Column(Numeric(5, 2), default=0)
    
    # Agricultural specific fields
    origin = Column(String(255))  # Nguồn gốc
    shelf_life_days = Column(Integer)  # Hạn sử dụng (số ngày)
    storage_instructions = Column(Text)  # Hướng dẫn bảo quản
    
    # Image
    thumbnail_url = Column(String(500))
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    
    # Relationships
    category = relationship("Category", back_populates="products")
    season = relationship("Season", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    inventory_records = relationship("Inventory", back_populates="product")
    cart_items = relationship("CartItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
    reviews = relationship("Review", back_populates="product")


class ProductImage(Base):
    """Product Image model"""
    __tablename__ = "product_images"
    
    image_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="images")
