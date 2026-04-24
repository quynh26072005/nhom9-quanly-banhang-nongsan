"""
Cart Schemas
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from decimal import Decimal
from uuid import UUID


class CartItemCreate(BaseModel):
    """Cart item creation schema"""
    product_id: int
    quantity: Decimal = Field(..., gt=0)


class CartItemUpdate(BaseModel):
    """Cart item update schema"""
    quantity: Decimal = Field(..., gt=0)


class ProductInCart(BaseModel):
    """Product info in cart"""
    product_id: int
    product_name: str
    unit: str
    price: Decimal
    discount_percent: Decimal
    thumbnail_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class CartItemResponse(BaseModel):
    """Cart item response schema"""
    cart_item_id: int
    user_id: UUID
    product_id: int
    quantity: Decimal
    added_at: datetime
    updated_at: datetime
    
    # Product info
    product: ProductInCart
    unit_price: Decimal  # Price after discount
    subtotal: Decimal  # unit_price * quantity
    
    class Config:
        from_attributes = True


class CartSummary(BaseModel):
    """Cart summary"""
    items: List[CartItemResponse]
    subtotal: Decimal
    discount_amount: Decimal
    shipping_fee: Decimal
    total: Decimal
    total_items: int
