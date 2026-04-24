"""
Common Schemas
"""
from typing import Generic, TypeVar, Optional, List
from pydantic import BaseModel

T = TypeVar('T')


class ResponseSchema(BaseModel, Generic[T]):
    """Standard API response"""
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None


class PaginationSchema(BaseModel):
    """Pagination metadata"""
    page: int
    limit: int
    total: int
    total_pages: int


class PaginatedResponseSchema(BaseModel, Generic[T]):
    """Paginated API response"""
    success: bool = True
    data: List[T]
    pagination: PaginationSchema
    message: Optional[str] = None
