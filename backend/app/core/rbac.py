"""
Role-Based Access Control (RBAC)
"""
from functools import wraps
from typing import List
from fastapi import HTTPException, status


class RoleChecker:
    """
    Dependency to check user roles
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles
    
    def __call__(self, current_user: dict):
        if current_user.get("role") not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this resource"
            )
        return current_user


# Pre-defined role checkers
require_admin = RoleChecker(["ADMIN"])
require_customer = RoleChecker(["CUSTOMER", "ADMIN"])
require_any_user = RoleChecker(["CUSTOMER", "ADMIN"])
