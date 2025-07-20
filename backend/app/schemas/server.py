"""Server-related Pydantic schemas for API requests and responses."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, validator, ConfigDict

from app.models.server import ServerStatus


class ServerCreateRequest(BaseModel):
    """Schema for creating a new server."""

    hostname: str = Field(
        ..., min_length=1, max_length=255, description="Server hostname or IP address"
    )
    display_name: Optional[str] = Field(
        None, max_length=255, description="Display name for the server"
    )
    description: Optional[str] = Field(None, description="Server description")

    # Network configuration
    ssh_port: int = Field(22, ge=1, le=65535, description="SSH port number")

    # SSH configuration
    ssh_username: str = Field(
        ..., min_length=1, max_length=255, description="SSH username"
    )
    ssh_key_path: Optional[str] = Field(
        None, max_length=500, description="Path to SSH private key"
    )
    ssh_password: Optional[str] = Field(
        None, description="SSH password (will be encrypted)"
    )
    ssh_key_passphrase: Optional[str] = Field(
        None, description="SSH key passphrase (will be encrypted)"
    )

    # Connection settings
    connection_timeout: int = Field(
        30, ge=5, le=300, description="Connection timeout in seconds"
    )
    connection_retries: int = Field(
        3, ge=1, le=10, description="Number of connection retries"
    )

    # Management settings
    is_enabled: bool = Field(
        True, description="Whether the server is enabled for management"
    )
    auto_discover_services: bool = Field(
        True, description="Automatically discover services on this server"
    )

    # Additional metadata
    tags: Optional[Dict[str, str]] = Field(None, description="Server tags")
    extra_data: Optional[Dict[str, Any]] = Field(
        None, description="Additional server metadata"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "hostname": "web-server-01.example.com",
                "display_name": "Web Server 01",
                "description": "Primary web server for production",
                "ssh_port": 22,
                "ssh_username": "admin",
                "ssh_key_path": "/home/user/.ssh/id_rsa",
                "connection_timeout": 30,
                "connection_retries": 3,
                "is_enabled": True,
                "auto_discover_services": True,
                "tags": {"environment": "production", "role": "web"},
            }
        }
    )

    @validator("hostname")
    def validate_hostname(cls, v):
        """Validate hostname or IP address format."""
        import re
        import ipaddress

        if not v:
            raise ValueError("Hostname or IP address is required")

        # Try to parse as IP address first
        try:
            ipaddress.ip_address(v)
            return v
        except ValueError:
            pass

        # Validate as hostname (allows single words like 'localhost' or FQDNs)
        if re.match(
            r"^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$",
            v,
        ):
            return v

        raise ValueError("Invalid hostname or IP address format")
        return v


class ServerUpdateRequest(BaseModel):
    """Schema for updating an existing server."""

    display_name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None)

    # Network configuration
    ssh_port: Optional[int] = Field(None, ge=1, le=65535)

    # SSH configuration
    ssh_username: Optional[str] = Field(None, min_length=1, max_length=255)
    ssh_key_path: Optional[str] = Field(None, max_length=500)
    ssh_password: Optional[str] = Field(None)
    ssh_key_passphrase: Optional[str] = Field(None)

    # Connection settings
    connection_timeout: Optional[int] = Field(None, ge=5, le=300)
    connection_retries: Optional[int] = Field(None, ge=1, le=10)

    # Management settings
    is_enabled: Optional[bool] = Field(None)
    auto_discover_services: Optional[bool] = Field(None)

    # Additional metadata
    tags: Optional[Dict[str, str]] = Field(None)
    extra_data: Optional[Dict[str, Any]] = Field(None)


class ServerResponse(BaseModel):
    """Schema for server API responses."""

    id: int
    hostname: str
    display_name: Optional[str]
    description: Optional[str]

    # Network configuration
    ssh_port: int

    # SSH configuration (sensitive fields excluded)
    ssh_username: str
    ssh_key_path: Optional[str]
    has_ssh_password: bool = Field(
        description="Whether server has SSH password configured"
    )
    has_ssh_key_passphrase: bool = Field(description="Whether SSH key has passphrase")

    # Connection settings
    connection_timeout: int
    connection_retries: int

    # Status and monitoring
    status: ServerStatus
    last_seen_at: Optional[datetime]
    last_error: Optional[str]

    # System information
    os_name: Optional[str]
    os_version: Optional[str]
    kernel_version: Optional[str]
    architecture: Optional[str]

    # Hardware information
    cpu_cores: Optional[int]
    total_memory_mb: Optional[int]
    total_disk_gb: Optional[int]

    # Management settings
    is_enabled: bool
    auto_discover_services: bool

    # Additional metadata
    tags: Optional[Dict[str, str]]
    extra_data: Optional[Dict[str, Any]]

    # Audit fields
    created_at: datetime
    updated_at: datetime

    # Computed fields
    ssh_connection_string: str = Field(description="SSH connection string")
    is_online: bool = Field(description="Whether server is currently online")

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_server(cls, server) -> "ServerResponse":
        """Create response from Server model."""
        return cls(
            id=server.id,
            hostname=server.hostname,
            display_name=server.display_name,
            description=server.description,
            ssh_port=server.ssh_port,
            ssh_username=server.ssh_username,
            ssh_key_path=server.ssh_key_path,
            has_ssh_password=bool(server.ssh_password_encrypted),
            has_ssh_key_passphrase=bool(server.ssh_key_passphrase_encrypted),
            connection_timeout=server.connection_timeout,
            connection_retries=server.connection_retries,
            status=server.status,
            last_seen_at=server.last_seen_at,
            last_error=server.last_error,
            os_name=server.os_name,
            os_version=server.os_version,
            kernel_version=server.kernel_version,
            architecture=server.architecture,
            cpu_cores=server.cpu_cores,
            total_memory_mb=server.total_memory_mb,
            total_disk_gb=server.total_disk_gb,
            is_enabled=server.is_enabled,
            auto_discover_services=server.auto_discover_services,
            tags=server.tags,
            extra_data=server.extra_data,
            created_at=server.created_at,
            updated_at=server.updated_at,
            ssh_connection_string=server.ssh_connection_string,
            is_online=server.is_online,
        )


class ServerListResponse(BaseModel):
    """Schema for paginated server list responses."""

    servers: List[ServerResponse]
    total: int
    page: int = Field(ge=1, description="Current page number")
    per_page: int = Field(ge=1, le=100, description="Items per page")
    total_pages: int = Field(description="Total number of pages")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "servers": [],
                "total": 25,
                "page": 1,
                "per_page": 10,
                "total_pages": 3,
            }
        }
    )


class ServerConnectionTestRequest(BaseModel):
    """Schema for testing server connection."""

    timeout: int = Field(30, ge=5, le=120, description="Connection timeout in seconds")


class ServerConnectionTestResponse(BaseModel):
    """Schema for connection test results."""

    success: bool = Field(description="Whether connection test was successful")
    message: Optional[str] = Field(description="Success or error message")
    response_time_ms: Optional[int] = Field(
        description="Connection response time in milliseconds"
    )
    timestamp: datetime = Field(description="When the test was performed")


class ServerSystemInfoResponse(BaseModel):
    """Schema for server system information."""

    os_name: Optional[str]
    os_version: Optional[str]
    kernel_version: Optional[str]
    architecture: Optional[str]
    cpu_cores: Optional[int]
    total_memory_mb: Optional[int]
    total_disk_gb: Optional[int]
    last_updated: datetime = Field(
        description="When this information was last collected"
    )


class ServerStatsResponse(BaseModel):
    """Schema for server statistics overview."""

    total_servers: int = Field(description="Total number of servers")
    online_servers: int = Field(description="Number of online servers")
    offline_servers: int = Field(description="Number of offline servers")
    error_servers: int = Field(description="Number of servers with errors")
    servers_by_status: Dict[str, int] = Field(description="Count of servers by status")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_servers": 10,
                "online_servers": 8,
                "offline_servers": 1,
                "error_servers": 1,
                "servers_by_status": {"online": 8, "offline": 1, "error": 1},
            }
        }
    )
