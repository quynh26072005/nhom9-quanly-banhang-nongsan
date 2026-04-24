"""
Cancellation Request API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.order import Order
from app.models.cancellation_request import OrderCancellationRequest, CancellationStatus
from app.schemas.cancellation_request import (
    CancellationRequestCreate,
    CancellationRequestResponse,
    CancellationRequestUpdate,
)
from app.schemas.common import ResponseSchema

router = APIRouter()


@router.post("/orders/{order_id}/cancellation-request", response_model=ResponseSchema[CancellationRequestResponse])
async def create_cancellation_request(
    order_id: int,
    request_data: CancellationRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Customer creates cancellation request
    """
    # Check if order exists and belongs to user
    result = await db.execute(
        select(Order).where(
            Order.order_id == order_id,
            Order.customer_id == current_user.user_id
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if order can be cancelled
    if order.status in ['DELIVERED', 'CANCELLED']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot request cancellation for this order"
        )
    
    # Check if already has pending request
    result = await db.execute(
        select(OrderCancellationRequest).where(
            OrderCancellationRequest.order_id == order_id,
            OrderCancellationRequest.status == CancellationStatus.PENDING
        )
    )
    existing_request = result.scalar_one_or_none()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already have a pending cancellation request"
        )
    
    # Create request
    new_request = OrderCancellationRequest(
        order_id=order_id,
        user_id=current_user.user_id,
        reason=request_data.reason,
        status=CancellationStatus.PENDING
    )
    
    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)
    
    return ResponseSchema(
        success=True,
        data=CancellationRequestResponse.model_validate(new_request),
        message="Cancellation request submitted successfully"
    )


@router.get("/admin/cancellation-requests", response_model=ResponseSchema)
async def get_cancellation_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin gets all cancellation requests
    """
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(OrderCancellationRequest, Order)
        .join(Order, OrderCancellationRequest.order_id == Order.order_id)
        .order_by(OrderCancellationRequest.created_at.desc())
    )
    requests_data = result.all()
    
    requests_list = []
    for req, order in requests_data:
        requests_list.append({
            "request_id": req.request_id,
            "order_id": req.order_id,
            "order_code": order.order_code,
            "user_id": req.user_id,
            "reason": req.reason,
            "status": req.status,
            "admin_note": req.admin_note,
            "created_at": req.created_at,
            "updated_at": req.updated_at,
        })
    
    return ResponseSchema(
        success=True,
        data=requests_list
    )


@router.put("/admin/cancellation-requests/{request_id}", response_model=ResponseSchema)
async def update_cancellation_request(
    request_id: int,
    update_data: CancellationRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin approves or rejects cancellation request
    """
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get request
    result = await db.execute(
        select(OrderCancellationRequest).where(
            OrderCancellationRequest.request_id == request_id
        )
    )
    cancel_request = result.scalar_one_or_none()
    
    if not cancel_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cancellation request not found"
        )
    
    # Update request
    cancel_request.status = update_data.status
    cancel_request.admin_note = update_data.admin_note
    
    # If approved, cancel the order
    if update_data.status == "APPROVED":
        result = await db.execute(
            select(Order).where(Order.order_id == cancel_request.order_id)
        )
        order = result.scalar_one_or_none()
        
        if order:
            # Cancel order logic here (same as existing cancel endpoint)
            from datetime import datetime
            order.status = 'CANCELLED'
            order.cancelled_at = datetime.utcnow()
            order.cancellation_reason = f"Customer request: {cancel_request.reason}"
    
    await db.commit()
    await db.refresh(cancel_request)
    
    return ResponseSchema(
        success=True,
        data=CancellationRequestResponse.model_validate(cancel_request),
        message="Cancellation request updated successfully"
    )
