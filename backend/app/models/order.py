"""
Order Models
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Order(Base):
    """Order model"""
    __tablename__ = "orders"
    
    order_id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False, index=True)
    
    # Shipping information
    recipient_name = Column(String(255), nullable=False)
    recipient_phone = Column(String(20), nullable=False)
    shipping_address = Column(Text, nullable=False)
    
    # Order amounts
    subtotal = Column(Numeric(15, 2), nullable=False)
    discount_amount = Column(Numeric(15, 2), default=0)
    shipping_fee = Column(Numeric(15, 2), default=0)
    total_amount = Column(Numeric(15, 2), nullable=False)
    
    # Status
    status = Column(String(50), nullable=False, default='PENDING', index=True)
    # 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'
    
    # Payment
    payment_method = Column(String(50))  # 'COD', 'BANK_TRANSFER', 'MOMO', 'VNPAY'
    payment_status = Column(String(50), default='UNPAID')  # 'UNPAID', 'PAID', 'REFUNDED'
    
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    confirmed_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))
    cancelled_at = Column(DateTime(timezone=True))
    cancellation_reason = Column(Text)
    
    # Relationships
    customer = relationship("User", back_populates="orders")
    cancellation_requests = relationship("OrderCancellationRequest", back_populates="order", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="order")


class OrderItem(Base):
    """Order Item model"""
    __tablename__ = "order_items"
    
    order_item_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=False, index=True)
    
    # Product info at time of order
    product_name = Column(String(255), nullable=False)
    unit = Column(String(50), nullable=False)
    unit_price = Column(Numeric(15, 2), nullable=False)
    quantity = Column(Numeric(15, 3), nullable=False)
    discount_percent = Column(Numeric(5, 2), default=0)
    subtotal = Column(Numeric(15, 2), nullable=False)
    
    inventory_id = Column(Integer, ForeignKey("inventory.inventory_id"))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")
    inventory = relationship("Inventory", back_populates="order_items")


class OrderStatusHistory(Base):
    """Order Status History model"""
    __tablename__ = "order_status_history"
    
    history_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id", ondelete="CASCADE"), nullable=False, index=True)
    old_status = Column(String(50))
    new_status = Column(String(50), nullable=False)
    notes = Column(Text)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="status_history")
