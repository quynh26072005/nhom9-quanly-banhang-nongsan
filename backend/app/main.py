"""
Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="API for Agricultural Product Management System",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
    }


# Import and include routers
from app.api.v1 import auth, users, products, categories, cart, orders, inventory, reviews, cancellation_requests

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(categories.router, prefix="/api/v1/categories", tags=["Categories"])
app.include_router(cart.router, prefix="/api/v1/cart", tags=["Cart"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(inventory.router, prefix="/api/v1/admin", tags=["Inventory (Admin)"])
app.include_router(reviews.router, prefix="/api/v1", tags=["Reviews"])
app.include_router(cancellation_requests.router, prefix="/api/v1", tags=["Cancellation Requests"])
# app.include_router(inventory.router, prefix="/api/v1/admin/inventory", tags=["Inventory"])
# app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["Reviews"])
# app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.ENVIRONMENT == "development" else False,
    )
