"""Service database model."""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text, Boolean, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ServiceType(str, Enum):
    """Service type enumeration."""
    SYSTEMD = "systemd"
    DOCKER = "docker"
    CUSTOM = "custom"


class ServiceStatus(str, Enum):
    """Service status enumeration."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    FAILED = "failed"
    ACTIVATING = "activating"
    DEACTIVATING = "deactivating"
    UNKNOWN = "unknown"


class ServiceState(str, Enum):
    """Service enabled/disabled state."""
    ENABLED = "enabled"
    DISABLED = "disabled"
    STATIC = "static"
    MASKED = "masked"
    UNKNOWN = "unknown"


class Service(Base):
    """Service model for managing systemd and other services."""
    
    __tablename__ = "services"
    
    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Server relationship
    server_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("servers.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Basic service information
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Service type and configuration
    service_type: Mapped[ServiceType] = mapped_column(
        SQLEnum(ServiceType, name="service_type"),
        default=ServiceType.SYSTEMD,
        nullable=False,
        index=True
    )
    unit_file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Status information
    status: Mapped[ServiceStatus] = mapped_column(
        SQLEnum(ServiceStatus, name="service_status"),
        default=ServiceStatus.UNKNOWN,
        nullable=False,
        index=True
    )
    state: Mapped[ServiceState] = mapped_column(
        SQLEnum(ServiceState, name="service_state"),
        default=ServiceState.UNKNOWN,
        nullable=False,
        index=True
    )
    
    # Process information
    main_pid: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    load_state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    active_state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    sub_state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Service configuration
    exec_start: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    exec_reload: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    exec_stop: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    restart_policy: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Dependencies and relationships
    dependencies: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True)
    dependents: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True)
    conflicts: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True)
    
    # Timers and scheduling (for systemd timer units)
    is_timer: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    timer_schedule: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    next_activation: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_activation: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Resource usage (updated periodically)
    cpu_usage_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    memory_usage_mb: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    memory_limit_mb: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Runtime information
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    active_duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Monitoring and management
    last_status_check: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status_check_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    auto_restart: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Service metadata and configuration
    environment_variables: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    service_config: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    override_config: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Management settings
    is_managed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_monitored: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Additional metadata
    tags: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Relationships
    server: Mapped["Server"] = relationship("Server", back_populates="services")
    
    def __repr__(self) -> str:
        """String representation of the service."""
        return f"<Service(name='{self.name}', server='{self.server.hostname if self.server else 'None'}', status='{self.status}')>"
    
    @property
    def is_active(self) -> bool:
        """Check if service is currently active."""
        return self.status == ServiceStatus.ACTIVE
    
    @property
    def is_failed(self) -> bool:
        """Check if service has failed."""
        return self.status == ServiceStatus.FAILED
    
    @property
    def is_enabled(self) -> bool:
        """Check if service is enabled for auto-start."""
        return self.state == ServiceState.ENABLED
    
    @property
    def unique_name(self) -> str:
        """Get unique service identifier including server."""
        server_hostname = self.server.hostname if self.server else "unknown"
        return f"{server_hostname}:{self.name}"
    
    def update_status(
        self,
        status: ServiceStatus,
        state: Optional[ServiceState] = None,
        main_pid: Optional[int] = None,
        load_state: Optional[str] = None,
        active_state: Optional[str] = None,
        sub_state: Optional[str] = None,
        error: Optional[str] = None,
    ) -> None:
        """Update service status information."""
        self.status = status
        self.last_status_check = datetime.utcnow()
        
        if state is not None:
            self.state = state
        if main_pid is not None:
            self.main_pid = main_pid
        if load_state is not None:
            self.load_state = load_state
        if active_state is not None:
            self.active_state = active_state
        if sub_state is not None:
            self.sub_state = sub_state
        if error is not None:
            self.status_check_error = error
        else:
            self.status_check_error = None
    
    def update_resource_usage(
        self,
        cpu_usage_percent: Optional[float] = None,
        memory_usage_mb: Optional[int] = None,
        memory_limit_mb: Optional[int] = None,
    ) -> None:
        """Update resource usage information."""
        if cpu_usage_percent is not None:
            self.cpu_usage_percent = cpu_usage_percent
        if memory_usage_mb is not None:
            self.memory_usage_mb = memory_usage_mb
        if memory_limit_mb is not None:
            self.memory_limit_mb = memory_limit_mb
    
    def update_timer_info(
        self,
        timer_schedule: Optional[str] = None,
        next_activation: Optional[datetime] = None,
        last_activation: Optional[datetime] = None,
    ) -> None:
        """Update timer-specific information."""
        if timer_schedule is not None:
            self.timer_schedule = timer_schedule
        if next_activation is not None:
            self.next_activation = next_activation
        if last_activation is not None:
            self.last_activation = last_activation
    
    def mark_as_timer(self, schedule: str) -> None:
        """Mark service as a timer unit with schedule."""
        self.is_timer = True
        self.timer_schedule = schedule
    
    def get_systemctl_command(self, action: str) -> str:
        """Get systemctl command for this service."""
        return f"systemctl {action} {self.name}"