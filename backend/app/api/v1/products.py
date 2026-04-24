"""
Products API Endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from math import ceil

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.product import Product, Category, Season
from app.schemas.product import (
    ProductResponse,
    ProductListResponse,
    CategoryResponse,
    SeasonResponse,
)
from app.schemas.common import ResponseSchema, PaginatedResponseSchema, PaginationSchema
from app.config import settings

router = APIRouter()


@router.get("", response_model=PaginatedResponseSchema[ProductListResponse])
async def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = None,
    season_id: Optional[int] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    in_stock: Optional[bool] = None,
    sort_by: str = Query("created_at", pattern="^(price|product_name|created_at)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of products with filters and pagination
    Public endpoint
    """
    # Build query
    query = select(Product).where(Product.is_active == True)
    
    # Apply filters
    if category_id:
        query = query.where(Product.category_id == category_id)
    
    if season_id:
        query = query.where(Product.season_id == season_id)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Product.product_name.ilike(search_pattern),
                Product.description.ilike(search_pattern),
                Product.origin.ilike(search_pattern)
            )
        )
    
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    
    if max_price is not None:
        query = query.where(Product.price <= max_price)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply sorting
    if order == "asc":
        query = query.order_by(getattr(Product, sort_by).asc())
    else:
        query = query.order_by(getattr(Product, sort_by).desc())
    
    # Apply pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    products = result.scalars().all()
    
    # Calculate pagination
    total_pages = ceil(total / limit) if total > 0 else 0
    
    return PaginatedResponseSchema(
        success=True,
        data=[ProductListResponse.model_validate(p) for p in products],
        pagination=PaginationSchema(
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages
        )
    )


@router.get("/{product_id}", response_model=ResponseSchema[ProductResponse])
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get product by ID
    Public endpoint
    """
    result = await db.execute(
        select(Product).where(Product.product_id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Load relationships
    await db.refresh(product, ["category", "season"])
    
    return ResponseSchema(
        success=True,
        data=ProductResponse.model_validate(product)
    )


@router.get("/category/{category_id}", response_model=ResponseSchema[list[ProductListResponse]])
async def get_products_by_category(
    category_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get products by category
    Public endpoint
    """
    result = await db.execute(
        select(Product).where(
            Product.category_id == category_id,
            Product.is_active == True
        )
    )
    products = result.scalars().all()
    
    return ResponseSchema(
        success=True,
        data=[ProductListResponse.model_validate(p) for p in products]
    )


@router.get("/season/{season_id}", response_model=ResponseSchema[list[ProductListResponse]])
async def get_products_by_season(
    season_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get products by season
    Public endpoint
    """
    result = await db.execute(
        select(Product).where(
            Product.season_id == season_id,
            Product.is_active == True
        )
    )
    products = result.scalars().all()
    
    return ResponseSchema(
        success=True,
        data=[ProductListResponse.model_validate(p) for p in products]
    )



# =====================================================
# ADMIN ENDPOINTS
# =====================================================

@router.post("/admin/products", response_model=ResponseSchema[ProductResponse])
async def admin_create_product(
    product_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create new product (Admin only)
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Validate category exists
    result = await db.execute(
        select(Category).where(Category.category_id == product_data.get("category_id"))
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Validate season if provided
    if product_data.get("season_id"):
        result = await db.execute(
            select(Season).where(Season.season_id == product_data.get("season_id"))
        )
        season = result.scalar_one_or_none()
        if not season:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Season not found"
            )
    
    # Create product
    new_product = Product(
        product_name=product_data.get("product_name"),
        category_id=product_data.get("category_id"),
        season_id=product_data.get("season_id"),
        description=product_data.get("description"),
        unit=product_data.get("unit"),
        price=product_data.get("price"),
        discount_percent=product_data.get("discount_percent", 0),
        origin=product_data.get("origin"),
        shelf_life_days=product_data.get("shelf_life_days"),
        storage_instructions=product_data.get("storage_instructions"),
        thumbnail_url=product_data.get("thumbnail_url"),
        is_active=product_data.get("is_active", True),
        created_by=current_user.user_id
    )
    
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product, ["category", "season"])
    
    return ResponseSchema(
        success=True,
        data=ProductResponse.model_validate(new_product),
        message="Product created successfully"
    )


@router.put("/admin/products/{product_id}", response_model=ResponseSchema[ProductResponse])
async def admin_update_product(
    product_id: int,
    product_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update product (Admin only)
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get product
    result = await db.execute(
        select(Product).where(Product.product_id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Validate category if provided
    if "category_id" in product_data:
        result = await db.execute(
            select(Category).where(Category.category_id == product_data["category_id"])
        )
        category = result.scalar_one_or_none()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
    
    # Validate season if provided
    if "season_id" in product_data and product_data["season_id"]:
        result = await db.execute(
            select(Season).where(Season.season_id == product_data["season_id"])
        )
        season = result.scalar_one_or_none()
        if not season:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Season not found"
            )
    
    # Update fields
    update_fields = [
        "product_name", "category_id", "season_id", "description", "unit",
        "price", "discount_percent", "origin", "shelf_life_days",
        "storage_instructions", "thumbnail_url", "is_active"
    ]
    
    for field in update_fields:
        if field in product_data:
            setattr(product, field, product_data[field])
    
    await db.commit()
    await db.refresh(product)
    
    # Load relationships explicitly
    if product.category_id:
        result = await db.execute(
            select(Category).where(Category.category_id == product.category_id)
        )
        product.category = result.scalar_one_or_none()
    
    if product.season_id:
        result = await db.execute(
            select(Season).where(Season.season_id == product.season_id)
        )
        product.season = result.scalar_one_or_none()
    
    return ResponseSchema(
        success=True,
        data=ProductResponse.model_validate(product),
        message="Product updated successfully"
    )


@router.delete("/admin/products/{product_id}")
async def admin_delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete product (soft delete - set is_active to False) (Admin only)
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get product
    result = await db.execute(
        select(Product).where(Product.product_id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Soft delete
    product.is_active = False
    
    await db.commit()
    
    return ResponseSchema(
        success=True,
        message="Product deleted successfully"
    )


@router.post("/admin/categories", response_model=ResponseSchema[CategoryResponse])
async def admin_create_category(
    category_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create new category (Admin only)
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Create category
    new_category = Category(
        category_name=category_data.get("category_name"),
        description=category_data.get("description"),
        parent_category_id=category_data.get("parent_category_id"),
        image_url=category_data.get("image_url"),
        is_active=category_data.get("is_active", True)
    )
    
    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)
    
    return ResponseSchema(
        success=True,
        data=CategoryResponse.model_validate(new_category),
        message="Category created successfully"
    )


@router.put("/admin/categories/{category_id}", response_model=ResponseSchema[CategoryResponse])
async def admin_update_category(
    category_id: int,
    category_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update category (Admin only)
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get category
    result = await db.execute(
        select(Category).where(Category.category_id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Update fields
    update_fields = ["category_name", "description", "parent_category_id", "image_url", "is_active"]
    
    for field in update_fields:
        if field in category_data:
            setattr(category, field, category_data[field])
    
    await db.commit()
    await db.refresh(category)
    
    return ResponseSchema(
        success=True,
        data=CategoryResponse.model_validate(category),
        message="Category updated successfully"
    )
