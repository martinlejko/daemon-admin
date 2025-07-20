"""Server management API endpoints."""

import math
from datetime import datetime
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.server import ServerStatus
from app.schemas.server import (
    ServerCreateRequest,
    ServerUpdateRequest,
    ServerResponse,
    ServerListResponse,
    ServerConnectionTestRequest,
    ServerConnectionTestResponse,
    ServerSystemInfoResponse,
    ServerStatsResponse,
)
from app.services.server_service import server_service

logger = structlog.get_logger()
router = APIRouter()


@router.post(
    "/",
    response_model=ServerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new server",
    description="Add a new Linux server to be managed by Owleyes. This will create the server record and test the SSH connection.",
)
async def create_server(
    server_data: ServerCreateRequest, db: AsyncSession = Depends(get_db)
) -> ServerResponse:
    """Create a new server."""
    try:
        # Check if hostname already exists
        existing_server = await server_service.get_server_by_hostname(
            db, server_data.hostname
        )
        if existing_server:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Server with hostname '{server_data.hostname}' already exists",
            )

        server = await server_service.create_server(db, server_data)

        logger.info(
            "Server created via API", server_id=server.id, hostname=server.hostname
        )

        return server

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create server via API", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create server",
        )


@router.get(
    "/",
    response_model=ServerListResponse,
    summary="List servers",
    description="Get a paginated list of servers with optional filtering and search.",
)
async def list_servers(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(
        None, description="Search in hostname, display name, description, or IP"
    ),
    status: Optional[ServerStatus] = Query(None, description="Filter by server status"),
    enabled_only: bool = Query(False, description="Show only enabled servers"),
    db: AsyncSession = Depends(get_db),
) -> ServerListResponse:
    """List servers with pagination and filtering."""
    try:
        servers, total = await server_service.list_servers(
            db, page, per_page, search, status, enabled_only
        )

        total_pages = math.ceil(total / per_page) if total > 0 else 1

        return ServerListResponse(
            servers=servers,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
        )

    except Exception as e:
        logger.error("Failed to list servers via API", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list servers",
        )


@router.get(
    "/{server_id}",
    response_model=ServerResponse,
    summary="Get server details",
    description="Get detailed information about a specific server.",
)
async def get_server(
    server_id: int, db: AsyncSession = Depends(get_db)
) -> ServerResponse:
    """Get server by ID."""
    server = await server_service.get_server(db, server_id)

    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Server with ID {server_id} not found",
        )

    return server


@router.put(
    "/{server_id}",
    response_model=ServerResponse,
    summary="Update server",
    description="Update server configuration and settings.",
)
async def update_server(
    server_id: int, server_data: ServerUpdateRequest, db: AsyncSession = Depends(get_db)
) -> ServerResponse:
    """Update server configuration."""
    try:
        server = await server_service.update_server(db, server_id, server_data)

        if not server:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Server with ID {server_id} not found",
            )

        logger.info(
            "Server updated via API", server_id=server_id, hostname=server.hostname
        )

        return server

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Failed to update server via API", server_id=server_id, error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update server",
        )


@router.delete(
    "/{server_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete server",
    description="Delete a server and all its associated services. This action cannot be undone.",
)
async def delete_server(server_id: int, db: AsyncSession = Depends(get_db)) -> None:
    """Delete server and all its services."""
    try:
        success = await server_service.delete_server(db, server_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Server with ID {server_id} not found",
            )

        logger.info("Server deleted via API", server_id=server_id)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Failed to delete server via API", server_id=server_id, error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete server",
        )


@router.post(
    "/{server_id}/test-connection",
    response_model=ServerConnectionTestResponse,
    summary="Test server connection",
    description="Test SSH connection to the server and return connection status.",
)
async def test_server_connection(
    server_id: int,
    request: ServerConnectionTestRequest = ServerConnectionTestRequest(),
    db: AsyncSession = Depends(get_db),
) -> ServerConnectionTestResponse:
    """Test SSH connection to server."""
    try:
        success, message, response_time_ms = await server_service.test_connection(
            db, server_id
        )

        return ServerConnectionTestResponse(
            success=success,
            message=message,
            response_time_ms=response_time_ms,
            timestamp=datetime.utcnow(),
        )

    except Exception as e:
        logger.error(
            "Failed to test server connection via API",
            server_id=server_id,
            error=str(e),
        )

        return ServerConnectionTestResponse(
            success=False,
            message=f"Connection test error: {str(e)}",
            response_time_ms=None,
            timestamp=datetime.utcnow(),
        )


@router.post(
    "/{server_id}/gather-info",
    response_model=ServerSystemInfoResponse,
    summary="Gather system information",
    description="Connect to the server and gather current system information.",
)
async def gather_server_info(
    server_id: int, db: AsyncSession = Depends(get_db)
) -> ServerSystemInfoResponse:
    """Gather system information from server."""
    try:
        system_info = await server_service.gather_system_info(db, server_id)

        if not system_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Server with ID {server_id} not found or not accessible",
            )

        logger.info("System info gathered via API", server_id=server_id)

        return system_info

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Failed to gather system info via API", server_id=server_id, error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to gather system information",
        )


@router.get(
    "/stats/overview",
    response_model=ServerStatsResponse,
    summary="Get server statistics",
    description="Get overview statistics for all servers.",
)
async def get_server_stats(db: AsyncSession = Depends(get_db)) -> ServerStatsResponse:
    """Get server statistics overview."""
    try:
        stats = await server_service.get_server_stats(db)
        return stats

    except Exception as e:
        logger.error("Failed to get server stats via API", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get server statistics",
        )
