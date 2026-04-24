"""
System Log Model
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func

from app.db.base import Base


class SystemLog(Base):
    """System Log model"""
    __tablename__ = "system_logs"
    
    log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), index=True)
    entity_id = Column(String(100))
    ip_address = Column(String(45))
    user_agent = Column(Text)
    details = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
