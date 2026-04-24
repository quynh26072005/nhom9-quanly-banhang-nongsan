"""
Product Schemas
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from decimal import Decimal


class CategoryBase(BaseModel):
    """Base category schema"""
    category_name: str
    description: Optional[str] = None
    parent_category_id: Optional[int] = None
    image_url: Optional[str] = None
    is_active: bool = True


class CategoryCreate(CategoryBase):
    """Category creation schema"""
    pass


class CategoryUpdate(BaseModel):
    """Category update schema"""
    category_name: Optional[str] = None
    description: Optional[str] = None
    parent_category_id: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    """Category response schema"""
    category_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SeasonResponse(BaseModel):
    """Season response schema"""
    season_id: int
    season_name: str
    start_month: Optional[int] = None
    end_month: Optional[int] = None
    description: Optional[str] = None
    
    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    """Base product schema"""
    product_name: str
    category_id: int
    season_id: Optional[int] = None
    description: Optional[str] = None
    unit: str
    price: Decimal = Field(..., ge=0)
    discount_percent: Decimal = Field(default=0, ge=0, le=100)
    origin: Optional[str] = None
    shelf_life_days: Optional[int] = None
    storage_instructions: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_active: bool = True


class ProductCreate(ProductBase):
    """Product creation schema"""
    pass


class ProductUpdate(BaseModel):
    """Product update schema"""
    product_name: Optional[str] = None
    category_id: Optional[int] = None
    season_id: Optional[int] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[Decimal] = Field(None, ge=0)
    discount_percent: Optional[Decimal] = Field(None, ge=0, le=100)
    origin: Optional[str] = None
    shelf_life_days: Optional[int] = None
    storage_instructions: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    """Product response schema"""
    product_id: int
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    season: Optional[SeasonResponse] = None
    
    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    """Product list item response"""
    product_id: int
    product_name: str
    category_id: int
    price: Decimal
    discount_percent: Decimal
    thumbnail_url: Optional[str] = None
    is_active: bool
    origin: Optional[str] = None
    unit: str
    
    class Config:
        from_attributes = True
