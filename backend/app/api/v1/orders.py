"""
Orders API Endpoints with Transaction Support
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from decimal import Decimal

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, Address
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.inventory import Inventory, StockTransaction
from app.models.cart import CartItem
from app.models.system_log import SystemLog
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderDetailResponse,
    OrderCancelRequest,
)
from app.schemas.common import ResponseSchema
from app.core.exceptions import NotFoundException, BadRequestException, InsufficientStockException

router = APIRouter()


@router.post("", response_model=ResponseSchema[OrderDetailResponse])
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create new order with TRANSACTION
    
    Transaction Flow:
    1. Validate address
    2. Lock & Check inventory (FOR UPDATE)
    3. Calculate order total
    4. Create order
    5. Create order items
    6. Update inventory (reserve stock)
    7. Log stock transactions
    8. Create status history
    9. Clear cart
    10. COMMIT (automatic via get_db)
    """
    
    try:
        # Step 1: Validate address
        result = await db.execute(
            select(Address).where(
                Address.address_id == order_data.address_id,
                Address.user_id == current_user.user_id
            )
        )
        address = result.scalar_one_or_none()
        
        if not address:
            raise NotFoundException("Address not found")
        
        # Step 2: Lock & Check inventory (FOR UPDATE to prevent race conditions)
        product_ids = [item.product_id for item in order_data.items]
        
        result = await db.execute(
            select(Inventory, Product)
            .join(Product, Inventory.product_id == Product.product_id)
            .where(Inventory.product_id.in_(product_ids))
            .with_for_update()  # LOCK rows
        )
        inventory_data = result.all()
        
        # Create inventory map
        inventory_map = {inv.product_id: (inv, prod) for inv, prod in inventory_data}
        
        # Validate all products and check stock
        for item in order_data.items:
            if item.product_id not in inventory_map:
                raise NotFoundException(f"Product {item.product_id} not found in inventory")
            
            inventory, product = inventory_map[item.product_id]
            
            # Check if product is active
            if not product.is_active:
                raise BadRequestException(f"Product {product.product_name} is not available")
            
            # Check available quantity
            available = float(inventory.quantity) - float(inventory.reserved_quantity)
            if available < float(item.quantity):
                raise InsufficientStockException(product.product_name)
        
        # Validate payment method
        valid_payment_methods = ['COD', 'BANK_TRANSFER', 'MOMO', 'VNPAY']
        if order_data.payment_method not in valid_payment_methods:
            raise BadRequestException(f"Invalid payment method. Must be one of: {', '.join(valid_payment_methods)}")
        
        # Step 3: Calculate order total
        subtotal = Decimal(0)
        order_items_data = []
        
        for item in order_data.items:
            inventory, product = inventory_map[item.product_id]
            
            unit_price = product.price
            discount_percent = product.discount_percent
            discount = unit_price * (discount_percent / 100)
            final_price = unit_price - discount
            item_subtotal = final_price * item.quantity
            subtotal += item_subtotal
            
            order_items_data.append({
                "product_id": item.product_id,
                "product_name": product.product_name,
                "unit": product.unit,
                "unit_price": unit_price,
                "quantity": item.quantity,
                "discount_percent": discount_percent,
                "subtotal": item_subtotal,
                "inventory_id": inventory.inventory_id,
            })
        
        # Calculate shipping fee (simple logic)
        shipping_fee = Decimal(30000) if subtotal < 200000 else Decimal(0)
        total_amount = subtotal + shipping_fee
        
        # Step 4: Create order
        new_order = Order(
            customer_id=current_user.user_id,
            recipient_name=address.recipient_name,
            recipient_phone=address.phone,
            shipping_address=f"{address.address_line}, {address.ward}, {address.district}, {address.city}",
            subtotal=subtotal,
            discount_amount=Decimal(0),
            shipping_fee=shipping_fee,
            total_amount=total_amount,
            status="PENDING",
            payment_method=order_data.payment_method,
            payment_status="UNPAID",
            notes=order_data.notes,
        )
        
        db.add(new_order)
        await db.flush()  # Get order_id without committing
        
        # Generate order code
        new_order.order_code = f"DH-{datetime.now().strftime('%Y%m%d')}-{new_order.order_id:04d}"
        
        # Step 5: Create order items
        created_items = []
        for item_data in order_items_data:
            order_item = OrderItem(
                order_id=new_order.order_id,
                **item_data
            )
            db.add(order_item)
            created_items.append(order_item)
        
        await db.flush()
        
        # Step 6: Update inventory (reserve stock)
        for item in order_data.items:
            inventory, product = inventory_map[item.product_id]
            
            # Reserve quantity
            inventory.reserved_quantity = float(inventory.reserved_quantity) + float(item.quantity)
            
            # Step 7: Log stock transaction
            stock_transaction = StockTransaction(
                inventory_id=inventory.inventory_id,
                transaction_type="OUT",
                quantity=item.quantity,
                reference_type="SALE",
                reference_id=new_order.order_id,
                notes=f"Reserved for order {new_order.order_code}",
                created_by=current_user.user_id,
            )
            db.add(stock_transaction)
        
        # Step 8: Create order status history
        status_history = OrderStatusHistory(
            order_id=new_order.order_id,
            old_status=None,
            new_status="PENDING",
            notes="Order created",
            changed_by=current_user.user_id,
        )
        db.add(status_history)
        
        # Step 8.1: Log order creation for BANK_TRANSFER
        if order_data.payment_method == "BANK_TRANSFER":
            bank_transfer_log = SystemLog(
                user_id=current_user.user_id,
                action="CREATE_ORDER_BANK_TRANSFER",
                entity_type="Order",
                entity_id=str(new_order.order_id),
                details={
                    "order_code": new_order.order_code,
                    "payment_method": "BANK_TRANSFER",
                    "payment_status": "UNPAID",
                    "total_amount": float(total_amount),
                    "customer_name": current_user.full_name,
                }
            )
            db.add(bank_transfer_log)
        
        # Step 9: Clear cart
        result = await db.execute(
            select(CartItem).where(
                CartItem.user_id == current_user.user_id,
                CartItem.product_id.in_(product_ids)
            )
        )
        cart_items = result.scalars().all()
        
        for cart_item in cart_items:
            await db.delete(cart_item)
        
        # Commit happens automatically via get_db
        await db.commit()
        
        # Refresh to get all data
        await db.refresh(new_order)
        for item in created_items:
            await db.refresh(item)
        
        # Build response
        return ResponseSchema(
            success=True,
            data=OrderDetailResponse(
                order_id=new_order.order_id,
                order_code=new_order.order_code,
                customer_id=new_order.customer_id,
                recipient_name=new_order.recipient_name,
                recipient_phone=new_order.recipient_phone,
                shipping_address=new_order.shipping_address,
                subtotal=new_order.subtotal,
                discount_amount=new_order.discount_amount,
                shipping_fee=new_order.shipping_fee,
                total_amount=new_order.total_amount,
                status=new_order.status,
                payment_method=new_order.payment_method,
                payment_status=new_order.payment_status,
                notes=new_order.notes,
                created_at=new_order.created_at,
                updated_at=new_order.updated_at,
                order_items=[
                    {
                        "order_item_id": item.order_item_id,
                        "product_id": item.product_id,
                        "product_name": item.product_name,
                        "unit": item.unit,
                        "unit_price": item.unit_price,
                        "quantity": item.quantity,
                        "discount_percent": item.discount_percent,
                        "subtotal": item.subtotal,
                    }
                    for item in created_items
                ]
            ),
            message="Order created successfully"
        )
        
    except (NotFoundException, BadRequestException, InsufficientStockException) as e:
        # These exceptions will cause automatic ROLLBACK
        await db.rollback()
        raise e
    except Exception as e:
        # Any other exception will also cause ROLLBACK
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Order creation failed: {str(e)}"
        )


@router.get("/my-orders", response_model=ResponseSchema[list[OrderResponse]])
async def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's orders
    """
    result = await db.execute(
        select(Order)
        .where(Order.customer_id == current_user.user_id)
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    
    return ResponseSchema(
        success=True,
        data=[OrderResponse.model_validate(order) for order in orders]
    )


@router.get("/{order_id}", response_model=ResponseSchema[OrderDetailResponse])
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get order detail (only own orders for customers)
    """
    result = await db.execute(
        select(Order).where(Order.order_id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Order not found")
    
    # Check permission (customer can only see their own orders)
    if order.customer_id != current_user.user_id:
        # Load user role
        await db.refresh(current_user, ["role"])
        if current_user.role.role_name != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this order"
            )
    
    # Load order items
    result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order_id)
    )
    order_items = result.scalars().all()
    
    return ResponseSchema(
        success=True,
        data=OrderDetailResponse(
            **OrderResponse.model_validate(order).model_dump(),
            order_items=[
                {
                    "order_item_id": item.order_item_id,
                    "product_id": item.product_id,
                    "product_name": item.product_name,
                    "unit": item.unit,
                    "unit_price": item.unit_price,
                    "quantity": item.quantity,
                    "discount_percent": item.discount_percent,
                    "subtotal": item.subtotal,
                }
                for item in order_items
            ]
        )
    )


@router.put("/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    cancel_data: OrderCancelRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel order (only if status is PENDING)
    """
    # Get order
    result = await db.execute(
        select(Order).where(Order.order_id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Order not found")
    
    # Check permission
    if order.customer_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to cancel this order"
        )
    
    # Check if can cancel
    if order.status != "PENDING":
        raise BadRequestException("Can only cancel pending orders")
    
    # Check if payment is already made
    if order.payment_status == "PAID":
        raise BadRequestException("Cannot cancel paid order. Please contact admin for refund.")
    
    # Get order items to release inventory
    result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order_id)
    )
    order_items = result.scalars().all()
    
    # Release reserved inventory
    for item in order_items:
        if item.inventory_id:
            result = await db.execute(
                select(Inventory).where(Inventory.inventory_id == item.inventory_id)
            )
            inventory = result.scalar_one_or_none()
            
            if inventory:
                inventory.reserved_quantity = float(inventory.reserved_quantity) - float(item.quantity)
    
    # Update order status
    order.status = "CANCELLED"
    order.cancelled_at = datetime.utcnow()
    order.cancellation_reason = cancel_data.cancellation_reason
    
    # Create status history
    status_history = OrderStatusHistory(
        order_id=order.order_id,
        old_status="PENDING",
        new_status="CANCELLED",
        notes=cancel_data.cancellation_reason,
        changed_by=current_user.user_id,
    )
    db.add(status_history)
    
    await db.commit()
    
    return ResponseSchema(
        success=True,
        message="Order cancelled successfully"
    )


# =====================================================
# ADMIN ENDPOINTS
# =====================================================

@router.get("/admin/orders", response_model=ResponseSchema)
async def admin_get_orders(
    status: str | None = None,
    payment_method: str | None = None,
    payment_status: str | None = None,
    customer_id: str | None = None,
    from_date: str | None = None,
    to_date: str | None = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all orders (Admin only)
    Filter by status, payment_method, payment_status, customer, date range
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Build query
    query = select(Order)
    
    if status:
        query = query.where(Order.status == status)
    
    if payment_method:
        query = query.where(Order.payment_method == payment_method)
    
    if payment_status:
        query = query.where(Order.payment_status == payment_status)
    
    if customer_id:
        query = query.where(Order.customer_id == customer_id)
    
    if from_date:
        query = query.where(Order.created_at >= from_date)
    
    if to_date:
        query = query.where(Order.created_at <= to_date)
    
    # Count total
    from sqlalchemy import func
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Pagination
    query = query.order_by(Order.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    orders = result.scalars().all()
    
    return ResponseSchema(
        success=True,
        data=[OrderResponse.model_validate(order) for order in orders],
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit
        }
    )


@router.get("/admin/orders/{order_id}", response_model=ResponseSchema[OrderDetailResponse])
async def admin_get_order_detail(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get order detail (Admin only)
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get order
    result = await db.execute(
        select(Order).where(Order.order_id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Load order items
    result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order_id)
    )
    order_items = result.scalars().all()
    
    # Create response
    order_dict = {
        "order_id": order.order_id,
        "order_code": order.order_code,
        "customer_id": order.customer_id,
        "recipient_name": order.recipient_name,
        "recipient_phone": order.recipient_phone,
        "shipping_address": order.shipping_address,
        "subtotal": order.subtotal,
        "discount_amount": order.discount_amount,
        "shipping_fee": order.shipping_fee,
        "total_amount": order.total_amount,
        "status": order.status,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "notes": order.notes,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "confirmed_at": order.confirmed_at,
        "delivered_at": order.delivered_at,
        "cancelled_at": order.cancelled_at,
        "cancellation_reason": order.cancellation_reason,
        "order_items": [
            {
                "order_item_id": item.order_item_id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "unit": item.unit,
                "unit_price": float(item.unit_price),
                "quantity": float(item.quantity),
                "discount_percent": float(item.discount_percent) if item.discount_percent else 0,
                "subtotal": float(item.subtotal),
            }
            for item in order_items
        ]
    }
    
    return ResponseSchema(
        success=True,
        data=order_dict
    )


@router.put("/admin/orders/{order_id}/status")
async def admin_update_order_status(
    order_id: int,
    status_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update order status (Admin only)
    Valid transitions:
    - PENDING -> CONFIRMED
    - CONFIRMED -> PROCESSING
    - PROCESSING -> SHIPPING
    - SHIPPING -> DELIVERED
    - Any -> CANCELLED
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Get order
        result = await db.execute(
            select(Order).where(Order.order_id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise NotFoundException("Order not found")
        
        new_status = status_data.get("status")
        notes = status_data.get("notes", "")
        
        # Validate status transition
        valid_statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED", "CANCELLED"]
        if new_status not in valid_statuses:
            raise BadRequestException(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        
        # Check if already in this status
        if order.status == new_status:
            raise BadRequestException(f"Order is already {new_status}")
        
        # IMPORTANT: Check payment status for BANK_TRANSFER orders
        if new_status == "CONFIRMED" and order.payment_method == "BANK_TRANSFER" and order.payment_status != "PAID":
            raise BadRequestException("Cannot confirm order with unpaid bank transfer. Please confirm payment first.")
        
        old_status = order.status
        
        # Update order
        order.status = new_status
        
        if new_status == "CONFIRMED":
            order.confirmed_at = datetime.utcnow()
            # When admin confirms order, mark payment as paid
            order.payment_status = "PAID"
        elif new_status == "DELIVERED":
            order.delivered_at = datetime.utcnow()
            order.payment_status = "PAID"  # Auto mark as paid when delivered
            
            # Release reserved inventory and deduct actual quantity
            result = await db.execute(
                select(OrderItem).where(OrderItem.order_id == order_id)
            )
            order_items = result.scalars().all()
            
            for item in order_items:
                if item.inventory_id:
                    result = await db.execute(
                        select(Inventory).where(Inventory.inventory_id == item.inventory_id)
                    )
                    inventory = result.scalar_one_or_none()
                    
                    if inventory:
                        # Release reserved and deduct from actual quantity
                        inventory.reserved_quantity = float(inventory.reserved_quantity) - float(item.quantity)
                        inventory.quantity = float(inventory.quantity) - float(item.quantity)
        
        elif new_status == "CANCELLED":
            order.cancelled_at = datetime.utcnow()
            order.cancellation_reason = notes
            
            # If order was paid, mark as refunded
            if order.payment_status == "PAID":
                order.payment_status = "REFUNDED"
            
            # Release reserved inventory
            result = await db.execute(
                select(OrderItem).where(OrderItem.order_id == order_id)
            )
            order_items = result.scalars().all()
            
            for item in order_items:
                if item.inventory_id:
                    result = await db.execute(
                        select(Inventory).where(Inventory.inventory_id == item.inventory_id)
                    )
                    inventory = result.scalar_one_or_none()
                    
                    if inventory:
                        # Release reserved quantity
                        inventory.reserved_quantity = float(inventory.reserved_quantity) - float(item.quantity)
        
        # Create status history
        status_history = OrderStatusHistory(
            order_id=order.order_id,
            old_status=old_status,
            new_status=new_status,
            notes=notes,
            changed_by=current_user.user_id,
        )
        db.add(status_history)
        
        # Log the change
        log = SystemLog(
            user_id=current_user.user_id,
            action="UPDATE_ORDER_STATUS",
            entity_type="Order",
            entity_id=str(order_id),
            details={"old_status": old_status, "new_status": new_status, "notes": notes}
        )
        db.add(log)
        
        await db.commit()
        await db.refresh(order)
        
        return ResponseSchema(
            success=True,
            message=f"Order status updated to {new_status}",
            data={"order_id": order_id, "status": new_status}
        )
        
    except (NotFoundException, BadRequestException) as e:
        await db.rollback()
        raise e
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/admin/orders/{order_id}/payment-status")
async def admin_update_payment_status(
    order_id: int,
    payment_data: dict,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update payment status (Admin only)
    Used for manual payment confirmation for BANK_TRANSFER orders
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Get order
        result = await db.execute(
            select(Order).where(Order.order_id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise NotFoundException("Order not found")
        
        new_payment_status = payment_data.get("payment_status")
        
        # Validate payment status
        valid_payment_statuses = ["UNPAID", "PAID", "REFUNDED"]
        if new_payment_status not in valid_payment_statuses:
            raise BadRequestException(f"Invalid payment status. Must be one of: {', '.join(valid_payment_statuses)}")
        
        # Store old payment status for logging
        old_payment_status = order.payment_status
        
        # Update payment status
        order.payment_status = new_payment_status
        order.updated_at = datetime.utcnow()
        
        # Get IP address and user agent
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent", "")
        
        # Log the change with full details
        log = SystemLog(
            user_id=current_user.user_id,
            action="CONFIRM_PAYMENT" if new_payment_status == "PAID" else "UPDATE_PAYMENT_STATUS",
            entity_type="Order",
            entity_id=str(order_id),
            ip_address=ip_address,
            user_agent=user_agent,
            details={
                "order_code": order.order_code,
                "old_payment_status": old_payment_status,
                "new_payment_status": new_payment_status,
                "admin_id": str(current_user.user_id),
                "admin_name": current_user.full_name,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        db.add(log)
        
        await db.commit()
        await db.refresh(order)
        
        return ResponseSchema(
            success=True,
            message=f"Payment status updated to {new_payment_status}",
            data={"order_id": order_id, "payment_status": new_payment_status}
        )
        
    except (NotFoundException, BadRequestException) as e:
        await db.rollback()
        raise e
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment confirmation failed: {str(e)}"
        )



@router.get("/admin/orders/{order_id}/history")
async def admin_get_order_history(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get order status history (Admin only)
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Check if order exists
    result = await db.execute(
        select(Order).where(Order.order_id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Order not found")
    
    # Get history
    result = await db.execute(
        select(OrderStatusHistory)
        .where(OrderStatusHistory.order_id == order_id)
        .order_by(OrderStatusHistory.changed_at.desc())
    )
    history = result.scalars().all()
    
    return ResponseSchema(
        success=True,
        data=[
            {
                "history_id": h.history_id,
                "old_status": h.old_status,
                "new_status": h.new_status,
                "notes": h.notes,
                "changed_by": str(h.changed_by),
                "changed_at": h.changed_at.isoformat() if h.changed_at else None,
            }
            for h in history
        ]
    )
