"""
Cart API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.cart import CartItem
from app.models.product import Product
from app.schemas.cart import (
    CartItemCreate,
    CartItemUpdate,
    CartItemResponse,
    CartSummary,
    ProductInCart,
)
from app.schemas.common import ResponseSchema
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter()


@router.get("", response_model=ResponseSchema[CartSummary])
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's cart
    """
    # Get cart items with product info
    result = await db.execute(
        select(CartItem, Product)
        .join(Product, CartItem.product_id == Product.product_id)
        .where(CartItem.user_id == current_user.user_id)
        .order_by(CartItem.added_at.desc())
    )
    cart_data = result.all()
    
    # Build response
    items = []
    subtotal = Decimal(0)
    total_discount = Decimal(0)
    
    for cart_item, product in cart_data:
        # Calculate item price
        unit_price = product.price
        discount = unit_price * (product.discount_percent / 100)
        final_price = unit_price - discount
        item_subtotal = final_price * cart_item.quantity
        item_discount = discount * cart_item.quantity
        
        subtotal += item_subtotal
        total_discount += item_discount
        
        items.append(CartItemResponse(
            cart_item_id=cart_item.cart_item_id,
            user_id=cart_item.user_id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            added_at=cart_item.added_at,
            updated_at=cart_item.updated_at,
            product=ProductInCart(
                product_id=product.product_id,
                product_name=product.product_name,
                unit=product.unit,
                price=product.price,
                discount_percent=product.discount_percent,
                thumbnail_url=product.thumbnail_url,
            ),
            unit_price=final_price,
            subtotal=item_subtotal,
        ))
    
    # Calculate shipping fee (free if > 200000, else 30000)
    shipping_fee = Decimal(0) if subtotal >= 200000 else Decimal(30000)
    total = subtotal + shipping_fee
    
    return ResponseSchema(
        success=True,
        data=CartSummary(
            items=items,
            subtotal=subtotal,
            discount_amount=total_discount,
            shipping_fee=shipping_fee,
            total=total,
            total_items=len(items)
        )
    )


@router.post("/items", response_model=ResponseSchema[CartItemResponse])
async def add_to_cart(
    item_data: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add item to cart
    """
    # Check if product exists
    result = await db.execute(
        select(Product).where(Product.product_id == item_data.product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise NotFoundException("Product not found")
    
    if not product.is_active:
        raise BadRequestException("Product is not available")
    
    # Check if item already in cart
    result = await db.execute(
        select(CartItem).where(
            CartItem.user_id == current_user.user_id,
            CartItem.product_id == item_data.product_id
        )
    )
    existing_item = result.scalar_one_or_none()
    
    if existing_item:
        # Update quantity
        existing_item.quantity += item_data.quantity
        await db.commit()
        await db.refresh(existing_item)
        cart_item = existing_item
    else:
        # Create new cart item
        cart_item = CartItem(
            user_id=current_user.user_id,
            product_id=item_data.product_id,
            quantity=item_data.quantity
        )
        db.add(cart_item)
        await db.commit()
        await db.refresh(cart_item)
    
    return ResponseSchema(
        success=True,
        data=CartItemResponse(
            cart_item_id=cart_item.cart_item_id,
            user_id=cart_item.user_id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            added_at=cart_item.added_at,
            updated_at=cart_item.updated_at,
            product=ProductInCart(
                product_id=product.product_id,
                product_name=product.product_name,
                unit=product.unit,
                price=product.price,
                discount_percent=product.discount_percent,
                thumbnail_url=product.thumbnail_url,
            ),
            unit_price=product.price * (1 - product.discount_percent / 100),
            subtotal=product.price * (1 - product.discount_percent / 100) * cart_item.quantity,
        ),
        message="Item added to cart"
    )


@router.put("/items/{cart_item_id}", response_model=ResponseSchema[CartItemResponse])
async def update_cart_item(
    cart_item_id: int,
    item_update: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update cart item quantity
    """
    # Get cart item
    result = await db.execute(
        select(CartItem, Product)
        .join(Product, CartItem.product_id == Product.product_id)
        .where(
            CartItem.cart_item_id == cart_item_id,
            CartItem.user_id == current_user.user_id
        )
    )
    cart_data = result.first()
    
    if not cart_data:
        raise NotFoundException("Cart item not found")
    
    cart_item, product = cart_data
    
    # Update quantity
    cart_item.quantity = item_update.quantity
    await db.commit()
    await db.refresh(cart_item)
    
    return ResponseSchema(
        success=True,
        data=CartItemResponse(
            cart_item_id=cart_item.cart_item_id,
            user_id=cart_item.user_id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            added_at=cart_item.added_at,
            updated_at=cart_item.updated_at,
            product=ProductInCart(
                product_id=product.product_id,
                product_name=product.product_name,
                unit=product.unit,
                price=product.price,
                discount_percent=product.discount_percent,
                thumbnail_url=product.thumbnail_url,
            ),
            unit_price=product.price * (1 - product.discount_percent / 100),
            subtotal=product.price * (1 - product.discount_percent / 100) * cart_item.quantity,
        ),
        message="Cart item updated"
    )


@router.delete("/items/{cart_item_id}")
async def delete_cart_item(
    cart_item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove item from cart
    """
    result = await db.execute(
        select(CartItem).where(
            CartItem.cart_item_id == cart_item_id,
            CartItem.user_id == current_user.user_id
        )
    )
    cart_item = result.scalar_one_or_none()
    
    if not cart_item:
        raise NotFoundException("Cart item not found")
    
    await db.delete(cart_item)
    await db.commit()
    
    return ResponseSchema(
        success=True,
        message="Item removed from cart"
    )


@router.delete("/clear")
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Clear all items from cart
    """
    result = await db.execute(
        select(CartItem).where(CartItem.user_id == current_user.user_id)
    )
    cart_items = result.scalars().all()
    
    for item in cart_items:
        await db.delete(item)
    
    await db.commit()
    
    return ResponseSchema(
        success=True,
        message="Cart cleared"
    )
