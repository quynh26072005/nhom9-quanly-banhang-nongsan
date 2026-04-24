"""
Inventory API Endpoints (Admin only)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta
from decimal import Decimal

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.inventory import Inventory, StockTransaction, Warehouse
from app.schemas.common import ResponseSchema
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter()


def check_admin(user: User):
    """Helper to check admin permission"""
    if user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )


@router.get("/inventory", response_model=ResponseSchema)
async def get_inventory(
    warehouse_id: int | None = None,
    product_id: int | None = None,
    low_stock: bool = False,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get inventory list with filters
    """
    await db.refresh(current_user, ["role"])
    check_admin(current_user)
    
    # Build query
    query = select(Inventory, Product, Warehouse).join(
        Product, Inventory.product_id == Product.product_id
    ).join(
        Warehouse, Inventory.warehouse_id == Warehouse.warehouse_id
    )
    
    if warehouse_id:
        query = query.where(Inventory.warehouse_id == warehouse_id)
    
    if product_id:
        query = query.where(Inventory.product_id == product_id)
    
    if low_stock:
        # Consider low stock if available quantity < 10
        query = query.where(
            (Inventory.quantity - Inventory.reserved_quantity) < 10
        )
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Pagination
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    inventory_data = result.all()
    
    return ResponseSchema(
        success=True,
        data=[
            {
                "inventory_id": inv.inventory_id,
                "product_id": inv.product_id,
                "product_name": prod.product_name,
                "unit": prod.unit,
                "warehouse_id": inv.warehouse_id,
                "warehouse_name": wh.warehouse_name,
                "quantity": float(inv.quantity),
                "quantity_in_stock": float(inv.quantity),
                "reserved_quantity": float(inv.reserved_quantity),
                "available_quantity": float(inv.quantity) - float(inv.reserved_quantity),
                "batch_number": inv.batch_number,
                "harvest_date": inv.harvest_date.isoformat() if inv.harvest_date else None,
                "expiry_date": inv.expiry_date.isoformat() if inv.expiry_date else None,
                "updated_at": inv.updated_at.isoformat() if inv.updated_at else None,
                "reorder_level": 10,  # Default reorder level
            }
            for inv, prod, wh in inventory_data
        ],
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit
        }
    )


@router.post("/inventory", response_model=ResponseSchema)
async def create_inventory(
    inventory_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create new inventory record (add product to warehouse)
    """
    await db.refresh(current_user, ["role"])
    check_admin(current_user)
    
    product_id = inventory_data.get("product_id")
    warehouse_id = inventory_data.get("warehouse_id")
    quantity = Decimal(str(inventory_data.get("quantity")))
    unit_cost = inventory_data.get("unit_cost")
    batch_number = inventory_data.get("batch_number")
    harvest_date = inventory_data.get("harvest_date")
    expiry_date = inventory_data.get("expiry_date")
    notes = inventory_data.get("notes", "")
    
    if quantity < 0:
        raise BadRequestException("Quantity cannot be negative")
    
    # Validate product
    result = await db.execute(
        select(Product).where(Product.product_id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product not found")
    
    # Validate warehouse
    result = await db.execute(
        select(Warehouse).where(Warehouse.warehouse_id == warehouse_id)
    )
    warehouse = result.scalar_one_or_none()
    if not warehouse:
        raise NotFoundException("Warehouse not found")
    
    async with db.begin():
        # Check if inventory record already exists for this product-warehouse combination
        result = await db.execute(
            select(Inventory).where(
                and_(
                    Inventory.product_id == product_id,
                    Inventory.warehouse_id == warehouse_id
                )
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            raise BadRequestException(
                f"Product already exists in this warehouse. Use 'Stock In' to add more quantity."
            )
        
        # Create new inventory record
        inventory = Inventory(
            product_id=product_id,
            warehouse_id=warehouse_id,
            quantity=quantity,
            reserved_quantity=0,
            batch_number=batch_number,
            harvest_date=harvest_date,
            expiry_date=expiry_date,
        )
        db.add(inventory)
        await db.flush()
        
        # Log initial stock transaction
        transaction = StockTransaction(
            inventory_id=inventory.inventory_id,
            transaction_type="IN",
            quantity=quantity,
            unit_cost=unit_cost,
            reference_type="INITIAL",
            notes=f"Initial stock. {notes}",
            created_by=current_user.user_id,
        )
        db.add(transaction)
        
        await db.flush()
    
    return ResponseSchema(
        success=True,
        message=f"Product added to warehouse successfully with quantity: {quantity}",
        data={
            "inventory_id": inventory.inventory_id,
            "product_id": inventory.product_id,
            "warehouse_id": inventory.warehouse_id,
            "quantity": float(inventory.quantity),
        }
    )


@router.get("/inventory/low-stock", response_model=ResponseSchema)
async def get_low_stock(
    threshold: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get products with low stock
    """
    await db.refresh(current_user, ["role"])
    check_admin(current_user)
    
    query = select(Inventory, Product, Warehouse).join(
        Product, Inventory.product_id == Product.product_id
    ).join(
        Warehouse, Inventory.warehouse_id == Warehouse.warehouse_id
    ).where(
        (Inventory.quantity - Inventory.reserved_quantity) < threshold
    )
    
    result = await db.execute(query)
    inventory_data = result.all()
    
    return ResponseSchema(
        success=True,
        data=[
            {
                "inventory_id": inv.inventory_id,
                "product_id": inv.product_id,
                "product_name": prod.product_name,
                "unit": prod.unit,
                "warehouse_id": inv.warehouse_id,
                "warehouse_name": wh.warehouse_name,
                "available_quantity": float(inv.quantity) - float(inv.reserved_quantity),
                "batch_number": inv.batch_number,
                "reorder_level": threshold,
            }
            for inv, prod, wh in inventory_data
        ]
    )


@router.get("/inventory/expiring-soon", response_model=ResponseSchema)
async def get_expiring_soon(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get products expiring within specified days
    """
    await db.refresh(current_user, ["role"])
    check_admin(current_user)
    
    expiry_threshold = datetime.now().date() + timedelta(days=days)
    
    query = select(Inventory, Product, Warehouse).join(
        Product, Inventory.product_id == Product.product_id
    ).join(
        Warehouse, Inventory.warehouse_id == Warehouse.warehouse_id
    ).where(
        and_(
            Inventory.expiry_date.isnot(None),
            Inventory.expiry_date <= expiry_threshold,
            Inventory.expiry_date >= datetime.now().date()
        )
    ).order_by(Inventory.expiry_date.asc())
    
    result = await db.execute(query)
    inventory_data = result.all()
    
    return ResponseSchema(
        success=True,
        data=[
            {
                "inventory_id": inv.inventory_id,
                "product_id": inv.product_id,
                "product_name": prod.product_name,
                "unit": prod.unit,
                "warehouse_id": inv.warehouse_id,
                "warehouse_name": wh.warehouse_name,
                "quantity": float(inv.quantity),
                "batch_number": inv.batch_number,
                "expiry_date": inv.expiry_date.isoformat(),
                "days_until_expiry": (inv.expiry_date - datetime.now().date()).days,
            }
            for inv, prod, wh in inventory_data
        ]
    )


@router.post("/inventory/stock-in", response_model=ResponseSchema)
async def stock_in(
    stock_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add stock (stock in)
    """
    await db.refresh(current_user, ["role"])
    check_admin(current_user)
    
    product_id = stock_data.get("product_id")
    warehouse_id = stock_data.get("warehouse_id")
    quantity = Decimal(str(stock_data.get("quantity")))
    batch_number = stock_data.get("batch_number")
    harvest_date = stock_data.get("harvest_date")
    expiry_date = stock_data.get("expiry_date")
    unit_cost = stock_data.get("unit_cost")
    notes = stock_data.get("notes", "")
    
    if quantity <= 0:
        raise BadRequestException("Quantity must be greater than 0")
    
    # Validate product
    result = await db.execute(
        select(Product).where(Product.product_id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product not found")
    
    # Validate warehouse
    result = await db.execute(
        select(Warehouse).where(Warehouse.warehouse_id == warehouse_id)
    )
    warehouse = result.scalar_one_or_none()
    if not warehouse:
        raise NotFoundException("Warehouse not found")
    
    async with db.begin():
        # Check if inventory record exists for this batch
        result = await db.execute(
            select(Inventory).where(
                and_(
                    Inventory.product_id == product_id,
                    Inventory.warehouse_id == warehouse_id,
                    Inventory.batch_number == batch_number
                )
            )
        )
        inventory = result.scalar_one_or_none()
        
        if inventory:
            # Update existing inventory
            inventory.quantity = float(inventory.quantity) + float(quantity)
        else:
            # Create new inventory record
            inventory = Inventory(
                product_id=product_id,
                warehouse_id=warehouse_id,
                quantity=quantity,
                reserved_quantity=0,
                batch_number=batch_number,
                harvest_date=harvest_date,
                expiry_date=expiry_date,
            )
            db.add(inventory)
            await db.flush()
        
        # Log transaction
        transaction = StockTransaction(
            inventory_id=inventory.inventory_id,
            transaction_type="IN",
            quantity=quantity,
            unit_cost=unit_cost,
            reference_type="PURCHASE",
            notes=notes,
            created_by=current_user.user_id,
        )
        db.add(transaction)
        
        await db.flush()
    
    return ResponseSchema(
        success=True,
        message=f"Stock added successfully. New quantity: {inventory.quantity}"
    )


@router.post("/inventory/stock-out", response_model=ResponseSchema)
async def stock_out(
    stock_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove stock (stock out) - for damage, return, etc.
    """
    await db.refresh(current_user, ["role"])
    check_admin(current_user)
    
    inventory_id = stock_data.get("inventory_id")
    quantity = Decimal(str(stock_data.get("quantity")))
    reference_type = stock_data.get("reference_type", "MANUAL")  # DAMAGE, RETURN, MANUAL
    notes = stock_data.get("notes", "")
    
    if quantity <= 0:
        raise BadRequestException("Quantity must be greater than 0")
    
    async with db.begin():
        # Get inventory
        result = await db.execute(
            select(Inventory).where(Inventory.inventory_id == inventory_id)
        )
        inventory = result.scalar_one_or_none()
        
        if not inventory:
            raise NotFoundException("Inventory not found")
        
        # Check available quantity
        available = float(inventory.quantity) - float(inventory.reserved_quantity)
        if available < float(quantity):
            raise BadRequestException(
                f"Insufficient stock. Available: {available}, Requested: {quantity}"
            )
        
        # Update inventory
        inventory.quantity = float(inventory.quantity) - float(quantity)
        
        # Log transaction
        transaction = StockTransaction(
            inventory_id=inventory.inventory_id,
            transaction_type="OUT",
            quantity=quantity,
            reference_type=reference_type,
            notes=notes,
            created_by=current_user.user_id,
        )
        db.add(transaction)
        
        await db.flush()
    
    return ResponseSchema(
        success=True,
        message=f"Stock removed successfully. New quantity: {inventory.quantity}"
    )


@router.post("/inventory/adjust", response_model=ResponseSchema)
async def adjust_stock(
    adjust_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Adjust stock quantity (for corrections)
    """
    await db.refresh(current_user, ["role"])
    check_admin(current_user)
    
    inventory_id = adjust_data.get("inventory_id")
    new_quantity = Decimal(str(adjust_data.get("new_quantity")))
    notes = adjust_data.get("notes", "")
    
    if new_quantity < 0:
        raise BadRequestException("Quantity cannot be negative")
    
    async with db.begin():
        # Get inventory
        result = await db.execute(
            select(Inventory).where(Inventory.inventory_id == inventory_id)
        )
        inventory = result.scalar_one_or_none()
        
        if not inventory:
            raise NotFoundException("Inventory not found")
        
        old_quantity = inventory.quantity
        adjustment = new_quantity - Decimal(str(old_quantity))
        
        # Update inventory
        inventory.quantity = new_quantity
        
        # Log transaction
        transaction = StockTransaction(
            inventory_id=inventory.inventory_id,
            transaction_type="ADJUST",
            quantity=abs(adjustment),
            reference_type="MANUAL",
            notes=f"Adjustment: {old_quantity} -> {new_quantity}. {notes}",
            created_by=current_user.user_id,
        )
        db.add(transaction)
        
        await db.flush()
    
    return ResponseSchema(
        success=True,
        message=f"Stock adjusted successfully. Old: {old_quantity}, New: {new_quantity}"
    )


@router.get("/inventory/{inventory_id}/transactions", response_model=ResponseSchema)
async def get_inventory_transactions(
    inventory_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get transaction history for an inventory item
    """
    await db.refresh(current_user, ["role"])
    check_admin(current_user)
    
    # Check if inventory exists
    result = await db.execute(
        select(Inventory).where(Inventory.inventory_id == inventory_id)
    )
    inventory = result.scalar_one_or_none()
    
    if not inventory:
        raise NotFoundException("Inventory not found")
    
    # Get transactions
    query = select(StockTransaction).where(
        StockTransaction.inventory_id == inventory_id
    ).order_by(StockTransaction.created_at.desc())
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Pagination
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    transactions = result.scalars().all()
    
    return ResponseSchema(
        success=True,
        data=[
            {
                "transaction_id": t.transaction_id,
                "transaction_type": t.transaction_type,
                "quantity": float(t.quantity),
                "unit_cost": float(t.unit_cost) if t.unit_cost else None,
                "reference_type": t.reference_type,
                "reference_id": t.reference_id,
                "notes": t.notes,
                "created_by": str(t.created_by),
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in transactions
        ],
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit
        }
    )


@router.get("/warehouses", response_model=ResponseSchema)
async def get_warehouses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all warehouses
    """
    await db.refresh(current_user, ["role"])
    check_admin(current_user)
    
    result = await db.execute(
        select(Warehouse).where(Warehouse.is_active == True)
    )
    warehouses = result.scalars().all()
    
    return ResponseSchema(
        success=True,
        data=[
            {
                "warehouse_id": w.warehouse_id,
                "warehouse_name": w.warehouse_name,
                "location": w.location,
                "manager_id": str(w.manager_id) if w.manager_id else None,
                "is_active": w.is_active,
            }
            for w in warehouses
        ]
    )
