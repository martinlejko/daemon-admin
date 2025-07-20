"""API v1 router configuration."""

from fastapi import APIRouter

from app.api.v1.endpoints import health, servers, services

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(servers.router, prefix="/servers", tags=["servers"])
api_router.include_router(services.router, prefix="/services", tags=["services"])

# TODO: Add more endpoint routers as they are implemented
# api_router.include_router(logs.router, prefix="/logs", tags=["logs"])
