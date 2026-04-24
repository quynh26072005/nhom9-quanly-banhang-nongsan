"""
Order Schemas
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from decimal import Decimal
from uuid import UUID


class OrderItemCreate(BaseModel):
    """Order item creation schema"""
    product_id: int
    quantity: Decimal = Field(..., gt=0)


class OrderCreate(BaseModel):
    """Order creation schema"""
    address_id: int
    items: List[OrderItemCreate]
    payment_method: str = Field(..., pattern="^(COD|BANK_TRANSFER|MOMO|VNPAY)$")
    notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    """Order item response schema"""
    order_item_id: int
    product_id: int
    product_name: str
    unit: str
    unit_price: Decimal
    quantity: Decimal
    discount_percent: Decimal
    subtotal: Decimal
    
    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    """Order response schema"""
    order_id: int
    order_code: str
    customer_id: UUID
    recipient_name: str
    recipient_phone: str
    shipping_address: str
    subtotal: Decimal
    discount_amount: Decimal
    shipping_fee: Decimal
    total_amount: Decimal
    status: str
    payment_method: str
    payment_status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    confirmed_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    
    class Config:
        from_attributes = True


class OrderDetailResponse(OrderResponse):
    """Order detail response with items"""
    order_items: List[OrderItemResponse]


class OrderStatusUpdate(BaseModel):
    """Order status update schema"""
    status: str = Field(..., pattern="^(CONFIRMED|PROCESSING|SHIPPING|DELIVERED|CANCELLED)$")
    notes: Optional[str] = None


class OrderCancelRequest(BaseModel):
    """Order cancellation request"""
    cancellation_reason: str


class OrderStatusHistoryResponse(BaseModel):
    """Order status history response"""
    history_id: int
    order_id: int
    old_status: Optional[str] = None
    new_status: str
    notes: Optional[str] = None
    changed_at: datetime
    
    class Config:
        from_attributes = True
