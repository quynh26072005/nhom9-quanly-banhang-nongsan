"""
Users API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, Address
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    PasswordChange,
    AddressCreate,
    AddressUpdate,
    AddressResponse,
)
from app.schemas.common import ResponseSchema
from app.core.security import verify_password, get_password_hash

router = APIRouter()


@router.get("/me", response_model=ResponseSchema[UserResponse])
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user information
    """
    return ResponseSchema(
        success=True,
        data=UserResponse.model_validate(current_user)
    )


@router.put("/me", response_model=ResponseSchema[UserResponse])
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user information
    """
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    
    await db.commit()
    await db.refresh(current_user)
    
    return ResponseSchema(
        success=True,
        data=UserResponse.model_validate(current_user),
        message="User updated successfully"
    )


@router.put("/me/password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change current user password
    """
    # Verify old password
    if not verify_password(password_data.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid old password"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(password_data.new_password)
    await db.commit()
    
    return ResponseSchema(
        success=True,
        message="Password changed successfully"
    )


# Address endpoints
@router.get("/me/addresses", response_model=ResponseSchema[list[AddressResponse]])
async def get_user_addresses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all addresses of current user
    """
    result = await db.execute(
        select(Address)
        .where(Address.user_id == current_user.user_id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
    )
    addresses = result.scalars().all()
    
    return ResponseSchema(
        success=True,
        data=[AddressResponse.model_validate(addr) for addr in addresses]
    )


@router.post("/me/addresses", response_model=ResponseSchema[AddressResponse])
async def create_address(
    address_data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create new address for current user
    """
    # If this is default address, unset other default addresses
    if address_data.is_default:
        result = await db.execute(
            select(Address).where(
                Address.user_id == current_user.user_id,
                Address.is_default == True
            )
        )
        existing_defaults = result.scalars().all()
        for addr in existing_defaults:
            addr.is_default = False
    
    # Create new address
    new_address = Address(
        user_id=current_user.user_id,
        **address_data.model_dump()
    )
    
    db.add(new_address)
    await db.commit()
    await db.refresh(new_address)
    
    return ResponseSchema(
        success=True,
        data=AddressResponse.model_validate(new_address),
        message="Address created successfully"
    )


@router.put("/me/addresses/{address_id}", response_model=ResponseSchema[AddressResponse])
async def update_address(
    address_id: int,
    address_update: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update address
    """
    # Get address
    result = await db.execute(
        select(Address).where(
            Address.address_id == address_id,
            Address.user_id == current_user.user_id
        )
    )
    address = result.scalar_one_or_none()
    
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )
    
    # If setting as default, unset other defaults
    if address_update.is_default:
        result = await db.execute(
            select(Address).where(
                Address.user_id == current_user.user_id,
                Address.is_default == True,
                Address.address_id != address_id
            )
        )
        existing_defaults = result.scalars().all()
        for addr in existing_defaults:
            addr.is_default = False
    
    # Update address
    update_data = address_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(address, field, value)
    
    await db.commit()
    await db.refresh(address)
    
    return ResponseSchema(
        success=True,
        data=AddressResponse.model_validate(address),
        message="Address updated successfully"
    )


@router.delete("/me/addresses/{address_id}")
async def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete address
    """
    result = await db.execute(
        select(Address).where(
            Address.address_id == address_id,
            Address.user_id == current_user.user_id
        )
    )
    address = result.scalar_one_or_none()
    
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )
    
    await db.delete(address)
    await db.commit()
    
    return ResponseSchema(
        success=True,
        message="Address deleted successfully"
    )



# Admin endpoints
@router.get("/admin/users", response_model=ResponseSchema[list[UserResponse]])
async def admin_get_users(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all users (Admin only)
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get users with pagination
    offset = (page - 1) * limit
    
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .order_by(User.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    users = result.scalars().all()
    
    # Get total count
    from sqlalchemy import func
    count_result = await db.execute(select(func.count(User.user_id)))
    total = count_result.scalar()
    
    return ResponseSchema(
        success=True,
        data=[UserResponse.model_validate(user) for user in users],
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit
        }
    )


@router.put("/admin/users/{user_id}/activate")
async def admin_activate_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Activate user (Admin only)
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get user
    result = await db.execute(
        select(User).where(User.user_id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    await db.commit()
    
    return ResponseSchema(
        success=True,
        message="User activated successfully"
    )


@router.put("/admin/users/{user_id}/deactivate")
async def admin_deactivate_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deactivate user (Admin only)
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get user
    result = await db.execute(
        select(User).where(User.user_id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Cannot deactivate self
    if user.user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate yourself"
        )
    
    user.is_active = False
    await db.commit()
    
    return ResponseSchema(
        success=True,
        message="User deactivated successfully"
    )


@router.put("/admin/users/{user_id}/role")
async def admin_update_user_role(
    user_id: str,
    role_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update user role (Admin only)
    """
    # Check admin permission
    await db.refresh(current_user, ["role"])
    if current_user.role.role_name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get user
    result = await db.execute(
        select(User).where(User.user_id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Cannot change own role
    if user.user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    # Get role
    from app.models.user import Role
    role_id = role_data.get("role_id")
    
    result = await db.execute(
        select(Role).where(Role.role_id == role_id)
    )
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    user.role_id = role_id
    await db.commit()
    
    return ResponseSchema(
        success=True,
        message="User role updated successfully"
    )
