"""Service management API endpoints."""

import math
from datetime import datetime
from typing import List, Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.service import ServiceStatus, ServiceType
from app.schemas.service import (
    ServiceControlRequest,
    ServiceControlResponse,
    ServiceLogsRequest,
    ServiceLogsResponse,
    ServiceResponse,
    ServiceListResponse,
    ServiceDiscoveryRequest,
    ServiceDiscoveryResponse,
    ServiceStatsResponse,
    ServiceCreateRequest,
    ServiceUpdateRequest,
)
from app.services.service_service import service_service

logger = structlog.get_logger()
router = APIRouter()


@router.get(
    "/",
    response_model=ServiceListResponse,
    summary="List services",
    description="Get a paginated list of services with optional filtering and search.",
)
async def list_services(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    server_id: Optional[int] = Query(None, description="Filter by server ID"),
    search: Optional[str] = Query(None, description="Search in service name, display name, or description"),
    status_filter: Optional[ServiceStatus] = Query(None, description="Filter by service status"),
    service_type: Optional[ServiceType] = Query(None, description="Filter by service type"),
    enabled_only: bool = Query(False, description="Show only enabled services"),
    db: AsyncSession = Depends(get_db)
) -> ServiceListResponse:
    """List services with pagination and filtering."""
    try:
        services, total = await service_service.list_services(
            db, page, per_page, server_id, search, status_filter, service_type, enabled_only
        )
        
        total_pages = math.ceil(total / per_page) if total > 0 else 1
        
        return ServiceListResponse(
            services=services,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
            server_id=server_id,
            status_filter=status_filter.value if status_filter else None,
            search_query=search,
        )
        
    except Exception as e:
        logger.error("Failed to list services via API", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list services"
        )


@router.get(
    "/{service_id}",
    response_model=ServiceResponse,
    summary="Get service details",
    description="Get detailed information about a specific service.",
)
async def get_service(
    service_id: int,
    db: AsyncSession = Depends(get_db)
) -> ServiceResponse:
    """Get service by ID."""
    service = await service_service.get_service(db, service_id)
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service with ID {service_id} not found"
        )
    
    return service


@router.post(
    "/{service_id}/control",
    response_model=ServiceControlResponse,
    summary="Control service",
    description="Perform control operations on a service (start, stop, restart, reload, enable, disable).",
)
async def control_service(
    service_id: int,
    control_request: ServiceControlRequest,
    db: AsyncSession = Depends(get_db)
) -> ServiceControlResponse:
    """Control a service (start, stop, restart, etc.)."""
    try:
        # Validate action
        valid_actions = ["start", "stop", "restart", "reload", "enable", "disable"]
        if control_request.action not in valid_actions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid action '{control_request.action}'. Valid actions: {', '.join(valid_actions)}"
            )
        
        response = await service_service.control_service(
            db, service_id, control_request.action
        )
        
        logger.info("Service control completed via API", 
                   service_id=service_id,
                   action=control_request.action,
                   success=response.success)
        
        return response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to control service via API", 
                    service_id=service_id,
                    action=control_request.action,
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to control service"
        )


@router.get(
    "/{service_id}/logs",
    response_model=ServiceLogsResponse,
    summary="Get service logs",
    description="Retrieve logs for a specific service.",
)
async def get_service_logs(
    service_id: int,
    lines: int = Query(100, ge=1, le=10000, description="Number of log lines to retrieve"),
    db: AsyncSession = Depends(get_db)
) -> ServiceLogsResponse:
    """Get logs for a service."""
    try:
        logs_response = await service_service.get_service_logs(db, service_id, lines)
        
        logger.info("Service logs retrieved via API", 
                   service_id=service_id,
                   lines_returned=logs_response.lines_returned)
        
        return logs_response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Failed to get service logs via API", 
                    service_id=service_id,
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve service logs"
        )


@router.post(
    "/discover/{server_id}",
    response_model=ServiceDiscoveryResponse,
    summary="Discover services",
    description="Discover services on a specific server via SSH connection.",
)
async def discover_services(
    server_id: int,
    discovery_request: ServiceDiscoveryRequest = ServiceDiscoveryRequest(),
    db: AsyncSession = Depends(get_db)
) -> ServiceDiscoveryResponse:
    """Discover services on a server."""
    try:
        discovery_response = await service_service.discover_services(
            db, server_id, discovery_request.force_refresh
        )
        
        logger.info("Service discovery completed via API", 
                   server_id=server_id,
                   services_discovered=discovery_response.services_discovered,
                   services_updated=discovery_response.services_updated,
                   services_removed=discovery_response.services_removed,
                   success=discovery_response.success)
        
        return discovery_response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Failed to discover services via API", 
                    server_id=server_id,
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to discover services"
        )


@router.get(
    "/stats/overview",
    response_model=ServiceStatsResponse,
    summary="Get service statistics",
    description="Get overview statistics for all services.",
)
async def get_service_stats(
    db: AsyncSession = Depends(get_db)
) -> ServiceStatsResponse:
    """Get service statistics overview."""
    try:
        stats = await service_service.get_service_stats(db)
        return stats
        
    except Exception as e:
        logger.error("Failed to get service stats via API", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get service statistics"
        )


@router.post(
    "/",
    response_model=ServiceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create custom service",
    description="Create a custom service definition. Note: This creates a service record but does not deploy it to the server.",
)
async def create_service(
    service_data: ServiceCreateRequest,
    server_id: int = Query(..., description="Server ID where this service will run"),
    db: AsyncSession = Depends(get_db)
) -> ServiceResponse:
    """Create a custom service."""
    # Note: This endpoint is for future implementation
    # Currently, services are discovered via SSH, not manually created
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Custom service creation is not yet implemented. Services are discovered via SSH."
    )


@router.put(
    "/{service_id}",
    response_model=ServiceResponse,
    summary="Update service",
    description="Update service configuration and settings.",
)
async def update_service(
    service_id: int,
    service_data: ServiceUpdateRequest,
    db: AsyncSession = Depends(get_db)
) -> ServiceResponse:
    """Update service configuration."""
    # Note: This endpoint is for future implementation
    # Currently focusing on service control, not configuration updates
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Service configuration updates are not yet implemented."
    )


@router.delete(
    "/{service_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete service",
    description="Delete a service record. This does not stop or remove the service from the server.",
)
async def delete_service(
    service_id: int,
    db: AsyncSession = Depends(get_db)
) -> None:
    """Delete service record."""
    # Note: This endpoint is for future implementation
    # Currently focusing on service discovery and control
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Service deletion is not yet implemented."
    )