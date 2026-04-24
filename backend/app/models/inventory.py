"""
Inventory Models
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Numeric, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, column_property
from sqlalchemy.sql import func

from app.db.base import Base


class Warehouse(Base):
    """Warehouse model"""
    __tablename__ = "warehouses"
    
    warehouse_id = Column(Integer, primary_key=True, index=True)
    warehouse_name = Column(String(255), nullable=False)
    location = Column(Text, nullable=False)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    inventory_records = relationship("Inventory", back_populates="warehouse")


class Inventory(Base):
    """Inventory model"""
    __tablename__ = "inventory"
    
    inventory_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.warehouse_id"), nullable=False, index=True)
    
    # Quantities
    quantity = Column(Numeric(15, 3), nullable=False, default=0)
    reserved_quantity = Column(Numeric(15, 3), nullable=False, default=0)
    # available_quantity is computed: quantity - reserved_quantity
    
    # Batch information
    batch_number = Column(String(100))
    harvest_date = Column(Date)
    expiry_date = Column(Date, index=True)
    
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="inventory_records")
    warehouse = relationship("Warehouse", back_populates="inventory_records")
    stock_transactions = relationship("StockTransaction", back_populates="inventory")
    order_items = relationship("OrderItem", back_populates="inventory")
    
    @property
    def available_quantity(self):
        """Calculate available quantity"""
        return float(self.quantity) - float(self.reserved_quantity)


class StockTransaction(Base):
    """Stock Transaction model"""
    __tablename__ = "stock_transactions"
    
    transaction_id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey("inventory.inventory_id"), nullable=False, index=True)
    transaction_type = Column(String(20), nullable=False)  # 'IN', 'OUT', 'ADJUST'
    quantity = Column(Numeric(15, 3), nullable=False)
    unit_cost = Column(Numeric(15, 2))
    
    # Reference to related entity
    reference_type = Column(String(50))  # 'PURCHASE', 'SALE', 'RETURN', 'DAMAGE', 'MANUAL'
    reference_id = Column(Integer)
    
    notes = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    inventory = relationship("Inventory", back_populates="stock_transactions")
