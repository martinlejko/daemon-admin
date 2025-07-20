"""Pydantic schemas for API requests and responses."""

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

__all__ = [
    # Server schemas
    "ServerCreateRequest",
    "ServerUpdateRequest",
    "ServerResponse",
    "ServerListResponse",
    "ServerConnectionTestRequest",
    "ServerConnectionTestResponse",
    "ServerSystemInfoResponse",
    "ServerStatsResponse",
    # Service schemas
    "ServiceControlRequest",
    "ServiceControlResponse",
    "ServiceLogsRequest",
    "ServiceLogsResponse",
    "ServiceResponse",
    "ServiceListResponse",
    "ServiceDiscoveryRequest",
    "ServiceDiscoveryResponse",
    "ServiceStatsResponse",
    "ServiceCreateRequest",
    "ServiceUpdateRequest",
]
