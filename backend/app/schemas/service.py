"""Service-related Pydantic schemas for API requests and responses."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict

from app.models.service import ServiceStatus, ServiceState, ServiceType


class ServiceControlRequest(BaseModel):
    """Schema for controlling a service (start, stop, restart, etc.)."""
    
    action: str = Field(..., description="Action to perform: start, stop, restart, reload, enable, disable")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "action": "restart"
            }
        }
    )


class ServiceControlResponse(BaseModel):
    """Schema for service control operation results."""
    
    success: bool = Field(description="Whether the operation was successful")
    message: str = Field(description="Success or error message")
    service_name: str = Field(description="Name of the service")
    action: str = Field(description="Action that was performed")
    timestamp: datetime = Field(description="When the operation was performed")


class ServiceLogsRequest(BaseModel):
    """Schema for requesting service logs."""
    
    lines: int = Field(100, ge=1, le=10000, description="Number of log lines to retrieve")
    since: Optional[str] = Field(None, description="Show logs since this time (e.g., '1 hour ago', '2025-01-01')")
    until: Optional[str] = Field(None, description="Show logs until this time")
    follow: bool = Field(False, description="Follow log output (for WebSocket streaming)")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "lines": 100,
                "since": "1 hour ago",
                "follow": False
            }
        }
    )


class ServiceLogsResponse(BaseModel):
    """Schema for service logs response."""
    
    success: bool = Field(description="Whether logs were retrieved successfully")
    logs: str = Field(description="Service log content")
    service_name: str = Field(description="Name of the service")
    lines_returned: int = Field(description="Number of log lines returned")
    timestamp: datetime = Field(description="When logs were retrieved")


class ServiceResponse(BaseModel):
    """Schema for service API responses."""
    
    id: int
    server_id: int
    name: str
    display_name: Optional[str]
    description: Optional[str]
    
    # Service type and configuration
    service_type: ServiceType
    unit_file_path: Optional[str]
    
    # Status information
    status: ServiceStatus
    state: ServiceState
    
    # Process information
    main_pid: Optional[int]
    load_state: Optional[str]
    active_state: Optional[str]
    sub_state: Optional[str]
    
    # Service configuration
    exec_start: Optional[str]
    exec_reload: Optional[str]
    exec_stop: Optional[str]
    restart_policy: Optional[str]
    
    # Dependencies and relationships
    dependencies: Optional[List[str]]
    dependents: Optional[List[str]]
    conflicts: Optional[List[str]]
    
    # Timers and scheduling
    is_timer: bool
    timer_schedule: Optional[str]
    next_activation: Optional[datetime]
    last_activation: Optional[datetime]
    
    # Resource usage
    cpu_usage_percent: Optional[float]
    memory_usage_mb: Optional[int]
    memory_limit_mb: Optional[int]
    
    # Runtime information
    started_at: Optional[datetime]
    active_duration_seconds: Optional[int]
    
    # Monitoring and management
    last_status_check: Optional[datetime]
    status_check_error: Optional[str]
    auto_restart: bool
    
    # Service metadata
    environment_variables: Optional[Dict[str, str]]
    service_config: Optional[Dict[str, Any]]
    override_config: Optional[Dict[str, Any]]
    
    # Management settings
    is_managed: bool
    is_monitored: bool
    
    # Additional metadata
    tags: Optional[Dict[str, str]]
    extra_data: Optional[Dict[str, Any]]
    
    # Audit fields
    created_at: datetime
    updated_at: datetime
    
    # Computed fields
    is_active: bool = Field(description="Whether service is currently active")
    is_failed: bool = Field(description="Whether service has failed")
    is_enabled: bool = Field(description="Whether service is enabled for auto-start")
    unique_name: str = Field(description="Unique service identifier with server")
    
    # Server information
    server_hostname: str = Field(description="Hostname of the server this service runs on")
    
    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def from_service(cls, service) -> "ServiceResponse":
        """Create response from Service model."""
        return cls(
            id=service.id,
            server_id=service.server_id,
            name=service.name,
            display_name=service.display_name,
            description=service.description,
            service_type=service.service_type,
            unit_file_path=service.unit_file_path,
            status=service.status,
            state=service.state,
            main_pid=service.main_pid,
            load_state=service.load_state,
            active_state=service.active_state,
            sub_state=service.sub_state,
            exec_start=service.exec_start,
            exec_reload=service.exec_reload,
            exec_stop=service.exec_stop,
            restart_policy=service.restart_policy,
            dependencies=service.dependencies,
            dependents=service.dependents,
            conflicts=service.conflicts,
            is_timer=service.is_timer,
            timer_schedule=service.timer_schedule,
            next_activation=service.next_activation,
            last_activation=service.last_activation,
            cpu_usage_percent=service.cpu_usage_percent,
            memory_usage_mb=service.memory_usage_mb,
            memory_limit_mb=service.memory_limit_mb,
            started_at=service.started_at,
            active_duration_seconds=service.active_duration_seconds,
            last_status_check=service.last_status_check,
            status_check_error=service.status_check_error,
            auto_restart=service.auto_restart,
            environment_variables=service.environment_variables,
            service_config=service.service_config,
            override_config=service.override_config,
            is_managed=service.is_managed,
            is_monitored=service.is_monitored,
            tags=service.tags,
            extra_data=service.extra_data,
            created_at=service.created_at,
            updated_at=service.updated_at,
            is_active=service.is_active,
            is_failed=service.is_failed,
            is_enabled=service.is_enabled,
            unique_name=service.unique_name,
            server_hostname=service.server.hostname if service.server else "Unknown",
        )


class ServiceListResponse(BaseModel):
    """Schema for paginated service list responses."""
    
    services: List[ServiceResponse]
    total: int
    page: int = Field(ge=1, description="Current page number")
    per_page: int = Field(ge=1, le=100, description="Items per page")
    total_pages: int = Field(description="Total number of pages")
    
    # Filters applied
    server_id: Optional[int] = Field(None, description="Server ID filter applied")
    status_filter: Optional[str] = Field(None, description="Status filter applied")
    search_query: Optional[str] = Field(None, description="Search query applied")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "services": [],
                "total": 50,
                "page": 1,
                "per_page": 20,
                "total_pages": 3,
                "server_id": None,
                "status_filter": "active",
                "search_query": None
            }
        }
    )


class ServiceDiscoveryRequest(BaseModel):
    """Schema for triggering service discovery on a server."""
    
    force_refresh: bool = Field(False, description="Force refresh even if recently discovered")
    service_types: Optional[List[ServiceType]] = Field(None, description="Limit discovery to specific service types")


class ServiceDiscoveryResponse(BaseModel):
    """Schema for service discovery results."""
    
    success: bool = Field(description="Whether discovery was successful")
    services_discovered: int = Field(description="Number of services discovered")
    services_updated: int = Field(description="Number of existing services updated")
    services_removed: int = Field(description="Number of services removed (no longer exist)")
    error_message: Optional[str] = Field(None, description="Error message if discovery failed")
    timestamp: datetime = Field(description="When discovery was performed")


class ServiceStatsResponse(BaseModel):
    """Schema for service statistics overview."""
    
    total_services: int = Field(description="Total number of services")
    active_services: int = Field(description="Number of active services")
    inactive_services: int = Field(description="Number of inactive services")
    failed_services: int = Field(description="Number of failed services")
    services_by_status: Dict[str, int] = Field(description="Count of services by status")
    services_by_server: Dict[str, int] = Field(description="Count of services by server")
    timer_services: int = Field(description="Number of timer services")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_services": 150,
                "active_services": 120,
                "inactive_services": 25,
                "failed_services": 5,
                "services_by_status": {
                    "active": 120,
                    "inactive": 25,
                    "failed": 5
                },
                "services_by_server": {
                    "web-server-01": 45,
                    "db-server-01": 30,
                    "api-server-01": 75
                },
                "timer_services": 15
            }
        }
    )


class ServiceCreateRequest(BaseModel):
    """Schema for creating a custom service."""
    
    name: str = Field(..., min_length=1, max_length=255, description="Service name")
    display_name: Optional[str] = Field(None, max_length=255, description="Display name")
    description: Optional[str] = Field(None, description="Service description")
    
    # Service configuration
    exec_start: str = Field(..., description="Command to start the service")
    exec_stop: Optional[str] = Field(None, description="Command to stop the service")
    exec_reload: Optional[str] = Field(None, description="Command to reload the service")
    restart_policy: str = Field("no", description="Restart policy (no, always, on-failure)")
    
    # Environment and configuration
    environment_variables: Optional[Dict[str, str]] = Field(None, description="Environment variables")
    working_directory: Optional[str] = Field(None, description="Working directory for the service")
    user: Optional[str] = Field(None, description="User to run the service as")
    group: Optional[str] = Field(None, description="Group to run the service as")
    
    # Management settings
    auto_restart: bool = Field(False, description="Enable automatic restart on failure")
    is_managed: bool = Field(True, description="Whether this service should be managed by Owleyes")
    is_monitored: bool = Field(True, description="Whether this service should be monitored")
    
    # Additional metadata
    tags: Optional[Dict[str, str]] = Field(None, description="Service tags")
    extra_data: Optional[Dict[str, Any]] = Field(None, description="Additional service metadata")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "my-custom-service",
                "display_name": "My Custom Service",
                "exec_start": "/usr/bin/python3 /app/scripts/my_service.py",
                "restart_policy": "on-failure",
                "auto_restart": True,
            }
        }
    )


class ServiceUpdateRequest(BaseModel):
    """Schema for updating an existing service."""
    
    display_name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None)
    
    # Management settings
    auto_restart: Optional[bool] = Field(None)
    is_managed: Optional[bool] = Field(None)
    is_monitored: Optional[bool] = Field(None)
    
    # Additional metadata
    tags: Optional[Dict[str, str]] = Field(None)
    extra_data: Optional[Dict[str, Any]] = Field(None)