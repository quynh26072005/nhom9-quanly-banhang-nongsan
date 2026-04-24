"""
Authentication API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.db.session import get_db
from app.models.user import User, Role
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse
from app.schemas.common import ResponseSchema
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
)

router = APIRouter()


@router.post("/register", response_model=ResponseSchema[UserResponse])
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user (Customer role by default)
    """
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Get Customer role
    result = await db.execute(
        select(Role).where(Role.role_name == "CUSTOMER")
    )
    customer_role = result.scalar_one_or_none()
    
    if not customer_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Customer role not found in database"
        )
    
    # Create new user
    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        phone=user_data.phone,
        role_id=customer_role.role_id,
        oauth_provider="local",
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Load role relationship
    await db.refresh(new_user, ["role"])
    
    return ResponseSchema(
        success=True,
        data=UserResponse.model_validate(new_user),
        message="User registered successfully"
    )


@router.post("/login", response_model=ResponseSchema[TokenResponse])
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password
    """
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == credentials.email)
    )
    user = result.scalar_one_or_none()
    
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Load role relationship
    await db.refresh(user, ["role"])
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Create tokens
    token_data = {
        "sub": str(user.user_id),
        "email": user.email,
        "role": user.role.role_name,
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return ResponseSchema(
        success=True,
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user)
        ),
        message="Login successful"
    )


@router.post("/logout")
async def logout():
    """
    Logout (client should remove tokens)
    """
    return ResponseSchema(
        success=True,
        message="Logout successful"
    )
