"""Server database model."""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from sqlalchemy import DateTime, Enum as SQLEnum, Integer, String, Text, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ServerStatus(str, Enum):
    """Server connection status enumeration."""

    ONLINE = "online"
    OFFLINE = "offline"
    CONNECTING = "connecting"
    ERROR = "error"
    MAINTENANCE = "maintenance"


class Server(Base):
    """Server model for managing Linux server connections."""

    __tablename__ = "servers"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Basic server information
    hostname: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    display_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Network configuration
    ssh_port: Mapped[int] = mapped_column(Integer, default=22, nullable=False)

    # SSH configuration
    ssh_username: Mapped[str] = mapped_column(String(255), nullable=False)
    ssh_key_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    ssh_password_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ssh_key_passphrase_encrypted: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )

    # Connection settings
    connection_timeout: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    connection_retries: Mapped[int] = mapped_column(Integer, default=3, nullable=False)

    # Status and monitoring
    status: Mapped[ServerStatus] = mapped_column(
        SQLEnum(ServerStatus, name="server_status"),
        default=ServerStatus.OFFLINE,
        nullable=False,
        index=True,
    )
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # System information (populated after successful connection)
    os_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    os_version: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    kernel_version: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    architecture: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Hardware information
    cpu_cores: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_memory_mb: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_disk_gb: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Additional metadata
    tags: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Management settings
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    auto_discover_services: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    # Relationships
    services: Mapped[List["Service"]] = relationship(
        "Service", back_populates="server", cascade="all, delete-orphan", lazy="dynamic"
    )

    def __repr__(self) -> str:
        """String representation of the server."""
        return f"<Server(hostname='{self.hostname}', status='{self.status}')>"

    @property
    def is_online(self) -> bool:
        """Check if server is currently online."""
        return self.status == ServerStatus.ONLINE

    @property
    def ssh_connection_string(self) -> str:
        """Get SSH connection string for this server."""
        return f"{self.ssh_username}@{self.hostname}:{self.ssh_port}"

    def update_system_info(
        self,
        os_name: Optional[str] = None,
        os_version: Optional[str] = None,
        kernel_version: Optional[str] = None,
        architecture: Optional[str] = None,
        cpu_cores: Optional[int] = None,
        total_memory_mb: Optional[int] = None,
        total_disk_gb: Optional[int] = None,
    ) -> None:
        """Update system information after successful connection."""
        if os_name is not None:
            self.os_name = os_name
        if os_version is not None:
            self.os_version = os_version
        if kernel_version is not None:
            self.kernel_version = kernel_version
        if architecture is not None:
            self.architecture = architecture
        if cpu_cores is not None:
            self.cpu_cores = cpu_cores
        if total_memory_mb is not None:
            self.total_memory_mb = total_memory_mb
        if total_disk_gb is not None:
            self.total_disk_gb = total_disk_gb

    def mark_online(self) -> None:
        """Mark server as online and update last seen timestamp."""
        self.status = ServerStatus.ONLINE
        self.last_seen_at = datetime.utcnow()
        self.last_error = None

    def mark_offline(self, error: Optional[str] = None) -> None:
        """Mark server as offline with optional error message."""
        self.status = ServerStatus.OFFLINE
        if error:
            self.last_error = error

    def mark_error(self, error: str) -> None:
        """Mark server as having an error."""
        self.status = ServerStatus.ERROR
        self.last_error = error
