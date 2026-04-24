"""
Categories API Endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.product import Category, Season
from app.schemas.product import CategoryResponse, SeasonResponse
from app.schemas.common import ResponseSchema

router = APIRouter()


@router.get("", response_model=ResponseSchema[list[CategoryResponse]])
async def get_categories(
    db: AsyncSession = Depends(get_db)
):
    """
    Get all categories
    Public endpoint
    """
    result = await db.execute(
        select(Category).where(Category.is_active == True)
    )
    categories = result.scalars().all()
    
    return ResponseSchema(
        success=True,
        data=[CategoryResponse.model_validate(c) for c in categories]
    )


@router.get("/seasons", response_model=ResponseSchema[list[SeasonResponse]])
async def get_seasons(
    db: AsyncSession = Depends(get_db)
):
    """
    Get all seasons
    Public endpoint
    """
    result = await db.execute(select(Season))
    seasons = result.scalars().all()
    
    return ResponseSchema(
        success=True,
        data=[SeasonResponse.model_validate(s) for s in seasons]
    )
