"""
Cancellation Request Schemas
"""
from pydantic import BaseModel, field_serializer
from datetime import datetime
from typing import Optional
from uuid import UUID


class CancellationRequestCreate(BaseModel):
    reason: str


class CancellationRequestResponse(BaseModel):
    request_id: int
    order_id: int
    user_id: UUID
    reason: str
    status: str
    admin_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    @field_serializer('user_id')
    def serialize_user_id(self, user_id: UUID, _info):
        return str(user_id)
    
    class Config:
        from_attributes = True


class CancellationRequestUpdate(BaseModel):
    status: str  # APPROVED or REJECTED
    admin_note: Optional[str] = None
