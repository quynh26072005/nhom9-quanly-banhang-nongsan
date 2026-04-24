"""
Reviews API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.review import Review
from app.models.order import Order, OrderItem
from app.schemas.common import ResponseSchema
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter()


@router.get("/products/{product_id}/reviews", response_model=ResponseSchema)
async def get_product_reviews(
    product_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Get reviews for a product (Public - only approved reviews)
    """
    # Check if product exists
    result = await db.execute(
        select(Product).where(Product.product_id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise NotFoundException("Product not found")
    
    # Get approved reviews
    query = select(Review, User).join(
        User, Review.user_id == User.user_id
    ).where(
        and_(
            Review.product_id == product_id,
            Review.is_approved == True
        )
    ).order_by(Review.created_at.desc())
    
    # Count total
    count_query = select(func.count()).select_from(
        select(Review).where(
            and_(
                Review.product_id == product_id,
                Review.is_approved == True
            )
        ).subquery()
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Pagination
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    reviews_data = result.all()
    
    # Calculate average rating
    avg_query = select(func.avg(Review.rating)).where(
        and_(
            Review.product_id == product_id,
            Review.is_approved == True
        )
    )
    avg_result = await db.execute(avg_query)
    avg_rating = avg_result.scalar() or 0
    
    return ResponseSchema(
        success=True,
        data={
            "reviews": [
                {
                    "review_id": review.review_id,
                    "user_name": user.full_name,
                    "rating": review.rating,
                    "comment": review.comment,
                    "is_verified_purchase": review.is_verified_purchase,
                    "created_at": review.created_at.isoformat() if review.created_at else None,
                }
                for review, user in reviews_data
            ],
            "average_rating": round(float(avg_rating), 2),
            "total_reviews": total,
        },
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit
        }
    )


@router.post("/reviews", response_model=ResponseSchema)
async def create_review(
    review_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a review for a product
    """
    product_id = review_data.get("product_id")
    order_id = review_data.get("order_id")
    rating = review_data.get("rating")
    comment = review_data.get("comment", "")
    
    # Validate rating
    if not rating or rating < 1 or rating > 5:
        raise BadRequestException("Rating must be between 1 and 5")
    
    # Check if product exists
    result = await db.execute(
        select(Product).where(Product.product_id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise NotFoundException("Product not found")
    
    # Check if order exists and belongs to user
    is_verified_purchase = False
    if order_id:
        result = await db.execute(
            select(Order, OrderItem).join(
                OrderItem, Order.order_id == OrderItem.order_id
            ).where(
                and_(
                    Order.order_id == order_id,
                    Order.customer_id == current_user.user_id,
                    OrderItem.product_id == product_id,
                    Order.status == "DELIVERED"
                )
            )
        )
        order_data = result.first()
        
        if order_data:
            is_verified_purchase = True
        else:
            raise BadRequestException("Order not found or product not in order or order not delivered")
    
    # Check if user already reviewed this product for this order
    result = await db.execute(
        select(Review).where(
            and_(
                Review.user_id == current_user.user_id,
                Review.product_id == product_id,
                Review.order_id == order_id if order_id else True
            )
        )
    )
    existing_review = result.scalar_one_or_none()
    
    if existing_review:
        raise BadRequestException("You have already reviewed this product")
    
    # Create review
    new_review = Review(
        product_id=product_id,
        user_id=current_user.user_id,
        order_id=order_id,
        rating=rating,
        comment=comment,
        is_verified_purchase=is_verified_purchase,
        is_approved=False,  # Needs admin approval
    )
    
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    
    return ResponseSchema(
        success=True,
        data={
            "review_id": new_review.review_id,
            "product_id": new_review.product_id,
            "rating": new_review.rating,
            "comment": new_review.comment,
            "is_verified_purchase": new_review.is_verified_purchase,
            "is_approved": new_review.is_approved,
        },
        message="Review submitted successfully. It will be visible after admin approval."
    )


@router.get("/my-reviews", response_model=ResponseSchema)
async def get_my_reviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's reviews
    """
    result = await db.execute(
        select(Review, Product).join(
            Product, Review.product_id == Product.product_id
        ).where(
            Review.user_id == current_user.user_id
        ).order_by(Review.created_at.desc())
    )
    reviews_data = result.all()
    
    return ResponseSchema(
        success=True,
        data=[
            {
                "review_id": review.review_id,
                "product_id": review.product_id,
                "product_name": product.product_name,
                "rating": review.rating,
                "comment": review.comment,
                "is_verified_purchase": review.is_verified_purchase,
                "is_approved": review.is_approved,
                "created_at": review.created_at.isoformat() if review.created_at else None,
            }
            for review, product in reviews_data
        ]
    )


@router.put("/reviews/{review_id}", response_model=ResponseSchema)
async def update_review(
    review_id: int,
    review_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update own review
    """
    # Get review
    result = await db.execute(
        select(Review).where(Review.review_id == review_id)
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise NotFoundException("Review not found")
    
    # Check permission
    if review.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this review"
        )
    
    # Update fields
    if "rating" in review_data:
        rating = review_data["rating"]
        if rating < 1 or rating > 5:
            raise BadRequestException("Rating must be between 1 and 5")
        review.rating = rating
    
    if "comment" in review_data:
        review.comment = review_data["comment"]
    
    # Reset approval status when updated
    review.is_approved = False
    
    await db.commit()
    await db.refresh(review)
    
    return ResponseSchema(
        success=True,
        data={
            "review_id": review.review_id,
            "rating": review.rating,
            "comment": review.comment,
            "is_approved": review.is_approved,
        },
        message="Review updated successfully. It will be visible after admin approval."
    )


@router.delete("/reviews/{review_id}")
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete own review
    """
    # Get review
    result = await db.execute(
        select(Review).where(Review.review_id == review_id)
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise NotFoundException("Review not found")
    
    # Check permission
    if review.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this review"
        )
    
    await db.delete(review)
    await db.commit()
    
    return ResponseSchema(
        success=True,
        message="Review deleted successfully"
    )


# =====================================================
# ADMIN ENDPOINTS
# =====================================================

@router.get("/admin/reviews", response_model=ResponseSchema)
async def admin_get_reviews(
    is_approved: bool | None = None,
    product_id: int | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all reviews (Admin only)
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Build query
    query = select(Review, User, Product).join(
        User, Review.user_id == User.user_id
    ).join(
        Product, Review.product_id == Product.product_id
    )
    
    if is_approved is not None:
        query = query.where(Review.is_approved == is_approved)
    
    if product_id:
        query = query.where(Review.product_id == product_id)
    
    query = query.order_by(Review.created_at.desc())
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Pagination
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    reviews_data = result.all()
    
    return ResponseSchema(
        success=True,
        data=[
            {
                "review_id": review.review_id,
                "product_id": review.product_id,
                "product_name": product.product_name,
                "user_id": str(review.user_id),
                "user_name": user.full_name,
                "rating": review.rating,
                "comment": review.comment,
                "is_verified_purchase": review.is_verified_purchase,
                "is_approved": review.is_approved,
                "created_at": review.created_at.isoformat() if review.created_at else None,
            }
            for review, user, product in reviews_data
        ],
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit
        }
    )


@router.put("/admin/reviews/{review_id}/approve")
async def admin_approve_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Approve review (Admin only)
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get review
    result = await db.execute(
        select(Review).where(Review.review_id == review_id)
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise NotFoundException("Review not found")
    
    review.is_approved = True
    
    await db.commit()
    
    return ResponseSchema(
        success=True,
        message="Review approved successfully"
    )


@router.put("/admin/reviews/{review_id}/reject")
async def admin_reject_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reject review (Admin only)
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get review
    result = await db.execute(
        select(Review).where(Review.review_id == review_id)
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise NotFoundException("Review not found")
    
    review.is_approved = False
    
    await db.commit()
    
    return ResponseSchema(
        success=True,
        message="Review rejected successfully"
    )


@router.delete("/admin/reviews/{review_id}")
async def admin_delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete review (Admin only)
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get review
    result = await db.execute(
        select(Review).where(Review.review_id == review_id)
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise NotFoundException("Review not found")
    
    await db.delete(review)
    await db.commit()
    
    return ResponseSchema(
        success=True,
        message="Review deleted successfully"
    )
