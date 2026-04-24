"""
Review Model
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Review(Base):
    """Review model"""
    __tablename__ = "reviews"
    
    review_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text)
    
    is_verified_purchase = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="reviews")
    user = relationship("User", back_populates="reviews")
    order = relationship("Order", back_populates="reviews")
