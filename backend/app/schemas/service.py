"""Service-related Pydantic schemas for API requests and responses."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.models.service import ServiceStatus, ServiceState, ServiceType


class SystemdServiceType(str, Enum):
    """Systemd service type enumeration for service creation."""
    SIMPLE = "simple"
    FORKING = "forking"
    ONESHOT = "oneshot"
    NOTIFY = "notify"
    IDLE = "idle"


class RestartPolicy(str, Enum):
    """Service restart policy enumeration."""
    NO = "no"
    ON_SUCCESS = "on-success"
    ON_FAILURE = "on-failure"
    ON_ABNORMAL = "on-abnormal"
    ON_WATCHDOG = "on-watchdog"
    ON_ABORT = "on-abort"
    ALWAYS = "always"


class LogLevel(str, Enum):
    """Log level enumeration for filtering service logs."""
    DEBUG = "debug"
    INFO = "info"
    NOTICE = "notice"
    WARNING = "warning"
    ERR = "err"
    CRIT = "crit"
    ALERT = "alert"
    EMERG = "emerg"


class TimerConfiguration(BaseModel):
    """Schema for configuring systemd timer units."""
    
    on_calendar: Optional[str] = Field(None, description="OnCalendar timer specification (e.g., 'daily', '*-*-* 02:00:00')")
    on_boot_sec: Optional[str] = Field(None, description="Run timer after system boot (e.g., '15min')")
    on_startup_sec: Optional[str] = Field(None, description="Run timer after systemd startup (e.g., '30min')")
    on_unit_active_sec: Optional[str] = Field(None, description="Run timer relative to when service was last active (e.g., '1hour')")
    on_unit_inactive_sec: Optional[str] = Field(None, description="Run timer relative to when service was last inactive (e.g., '30min')")
    accuracy_sec: Optional[str] = Field("1min", description="Timer accuracy (default: 1min)")
    randomized_delay_sec: Optional[str] = Field(None, description="Random delay to spread timer activations (e.g., '5min')")
    persistent: bool = Field(False, description="Whether timer should be persistent across reboots")
    wake_system: bool = Field(False, description="Whether timer should wake system from suspend")
    
    # Convenience fields for common cron-like patterns
    cron_expression: Optional[str] = Field(None, description="Cron-style expression (will be converted to OnCalendar)")
    
    @field_validator('on_calendar', 'cron_expression')
    @classmethod
    def validate_timer_schedule(cls, v, info):
        if info.field_name == 'on_calendar' and info.data.get('cron_expression'):
            raise ValueError("Cannot specify both on_calendar and cron_expression")
        return v
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "on_calendar": "daily",
                "persistent": True,
                "accuracy_sec": "1min"
            }
        }
    )


class EnhancedServiceCreateRequest(BaseModel):
    """Enhanced schema for creating custom systemd services."""
    
    # Basic service information
    name: str = Field(..., min_length=1, max_length=255, description="Service name (without .service extension)")
    display_name: Optional[str] = Field(None, max_length=255, description="Human-readable display name")
    description: Optional[str] = Field(None, description="Service description")
    
    # Systemd service configuration
    systemd_type: SystemdServiceType = Field(SystemdServiceType.SIMPLE, description="Systemd service type")
    exec_start: str = Field(..., description="Command to start the service")
    exec_stop: Optional[str] = Field(None, description="Command to stop the service")
    exec_reload: Optional[str] = Field(None, description="Command to reload the service")
    exec_start_pre: Optional[str] = Field(None, description="Command to run before starting the service")
    exec_start_post: Optional[str] = Field(None, description="Command to run after starting the service")
    
    # Service behavior
    restart_policy: RestartPolicy = Field(RestartPolicy.ON_FAILURE, description="When to restart the service")
    restart_sec: Optional[int] = Field(3, ge=0, description="Time to wait before restarting (seconds)")
    timeout_start_sec: Optional[int] = Field(90, ge=1, description="Timeout for service start (seconds)")
    timeout_stop_sec: Optional[int] = Field(90, ge=1, description="Timeout for service stop (seconds)")
    
    # Process configuration
    user: Optional[str] = Field(None, description="User to run the service as")
    group: Optional[str] = Field(None, description="Group to run the service as")
    working_directory: Optional[str] = Field(None, description="Working directory for the service")
    umask: Optional[str] = Field(None, description="File mode creation mask")
    
    # Environment and configuration
    environment_variables: Optional[Dict[str, str]] = Field(None, description="Environment variables")
    environment_file: Optional[str] = Field(None, description="Path to environment file")
    
    # Dependencies
    after_units: Optional[List[str]] = Field(None, description="Units that should be started before this service")
    before_units: Optional[List[str]] = Field(None, description="Units that should be started after this service")
    wants_units: Optional[List[str]] = Field(None, description="Units that this service wants (weak dependency)")
    requires_units: Optional[List[str]] = Field(None, description="Units that this service requires (strong dependency)")
    conflicts_units: Optional[List[str]] = Field(None, description="Units that conflict with this service")
    
    # Security and sandboxing
    no_new_privileges: Optional[bool] = Field(None, description="Disable privilege escalation")
    private_tmp: Optional[bool] = Field(None, description="Use private /tmp directory")
    protect_system: Optional[str] = Field(None, description="Protect system directories (strict/yes/no)")
    protect_home: Optional[bool] = Field(None, description="Protect /home directory")
    read_only_paths: Optional[List[str]] = Field(None, description="Paths to make read-only")
    inaccessible_paths: Optional[List[str]] = Field(None, description="Paths to make inaccessible")
    
    # Logging
    standard_output: Optional[str] = Field("journal", description="Where to send stdout (journal/null/file:path)")
    standard_error: Optional[str] = Field("journal", description="Where to send stderr (journal/null/file:path)")
    syslog_identifier: Optional[str] = Field(None, description="Syslog identifier")
    
    # Timer configuration (if this is a timer-based service)
    timer_config: Optional[TimerConfiguration] = Field(None, description="Timer configuration for scheduled services")
    create_timer: bool = Field(False, description="Whether to create a timer unit for this service")
    
    # Install section
    wanted_by: List[str] = Field(["multi-user.target"], description="Targets that should include this service")
    required_by: Optional[List[str]] = Field(None, description="Units that require this service")
    also: Optional[List[str]] = Field(None, description="Additional units to enable/disable with this service")
    
    # Management settings
    auto_start: bool = Field(True, description="Whether to automatically start the service after creation")
    auto_enable: bool = Field(True, description="Whether to automatically enable the service after creation")
    auto_restart: bool = Field(False, description="Enable automatic restart monitoring in Owleyes")
    is_managed: bool = Field(True, description="Whether this service should be managed by Owleyes")
    is_monitored: bool = Field(True, description="Whether this service should be monitored")
    
    # Additional metadata
    tags: Optional[Dict[str, str]] = Field(None, description="Service tags for organization")
    extra_data: Optional[Dict[str, Any]] = Field(None, description="Additional service metadata")
    
    @field_validator('name')
    @classmethod
    def validate_service_name(cls, v):
        """Validate service name format."""
        import re
        if not re.match(r'^[a-zA-Z0-9._-]+$', v):
            raise ValueError("Service name can only contain letters, numbers, dots, underscores, and hyphens")
        if v.endswith('.service'):
            raise ValueError("Service name should not include the .service extension")
        return v
    
    @field_validator('create_timer')
    @classmethod  
    def validate_timer_creation(cls, v, info):
        """Validate timer creation requirements."""
        if v and not info.data.get('timer_config'):
            raise ValueError("timer_config is required when create_timer is True")
        return v
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "my-python-app",
                "display_name": "My Python Application",
                "description": "A sample Python application service",
                "systemd_type": "simple",
                "exec_start": "uv run python /opt/myapp/main.py",
                "user": "myapp",
                "group": "myapp",
                "working_directory": "/opt/myapp",
                "environment_variables": {
                    "PORT": "8080",
                    "ENV": "production"
                },
                "restart_policy": "on-failure",
                "auto_start": True,
                "auto_enable": True
            }
        }
    )


class ServiceDeployRequest(BaseModel):
    """Schema for deploying a service to a specific server."""
    
    server_id: int = Field(..., description="ID of the server to deploy the service to")
    service_config: EnhancedServiceCreateRequest = Field(..., description="Service configuration")
    dry_run: bool = Field(False, description="Validate configuration without creating the service")


class ServiceDeployResponse(BaseModel):
    """Schema for service deployment results."""
    
    success: bool = Field(description="Whether the deployment was successful")
    message: str = Field(description="Deployment result message")
    service_id: Optional[int] = Field(None, description="ID of the created service (if successful)")
    service_name: str = Field(description="Name of the service")
    server_hostname: str = Field(description="Hostname of the target server")
    created_files: List[str] = Field(default_factory=list, description="List of files created on the server")
    actions_performed: List[str] = Field(default_factory=list, description="List of actions performed")
    timestamp: datetime = Field(description="When the deployment was performed")
    
    # Validation results (for dry_run)
    validation_errors: Optional[List[str]] = Field(None, description="Validation errors found during dry run")
    systemd_files_preview: Optional[Dict[str, str]] = Field(None, description="Preview of generated systemd files")


class ServiceTemplateRequest(BaseModel):
    """Schema for requesting service templates."""
    
    template_type: str = Field(..., description="Type of service template")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Template parameters")


class ServiceTemplateResponse(BaseModel):
    """Schema for service template responses."""
    
    template_name: str = Field(description="Name of the template")
    description: str = Field(description="Template description")
    service_config: EnhancedServiceCreateRequest = Field(description="Pre-configured service configuration")
    required_parameters: List[str] = Field(description="List of required parameters")
    optional_parameters: List[str] = Field(description="List of optional parameters")


class ServiceValidationRequest(BaseModel):
    """Schema for validating service configuration before creation."""
    
    server_id: int = Field(..., description="ID of the target server")
    service_config: EnhancedServiceCreateRequest = Field(..., description="Service configuration to validate")


class ServiceValidationResponse(BaseModel):
    """Schema for service validation results."""
    
    valid: bool = Field(description="Whether the configuration is valid")
    errors: List[str] = Field(default_factory=list, description="Validation errors")
    warnings: List[str] = Field(default_factory=list, description="Validation warnings")
    suggestions: List[str] = Field(default_factory=list, description="Configuration suggestions")
    
    # Path validation results
    execution_path_exists: Optional[bool] = Field(None, description="Whether the execution path exists on the server")
    working_directory_exists: Optional[bool] = Field(None, description="Whether the working directory exists")
    user_exists: Optional[bool] = Field(None, description="Whether the specified user exists")
    group_exists: Optional[bool] = Field(None, description="Whether the specified group exists")
    
    # Dependency validation
    dependency_status: Optional[Dict[str, bool]] = Field(None, description="Status of required dependencies")
    
    timestamp: datetime = Field(description="When the validation was performed")


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
    priority: Optional[LogLevel] = Field(None, description="Filter logs by minimum priority level")
    grep: Optional[str] = Field(None, description="Filter logs containing this text pattern")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "lines": 100,
                "since": "1 hour ago",
                "follow": False,
                "priority": "warning",
                "grep": "error"
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


class ServiceOverrideConfig(BaseModel):
    """Schema for systemd service override configuration."""
    
    # Unit section overrides
    description: Optional[str] = Field(None, description="Override service description")
    after_units: Optional[List[str]] = Field(None, description="Units that should be started before this service")
    before_units: Optional[List[str]] = Field(None, description="Units that should be started after this service")
    wants_units: Optional[List[str]] = Field(None, description="Units that this service wants (weak dependency)")
    requires_units: Optional[List[str]] = Field(None, description="Units that this service requires (strong dependency)")
    conflicts_units: Optional[List[str]] = Field(None, description="Units that conflict with this service")
    
    # Service section overrides
    systemd_type: Optional[SystemdServiceType] = Field(None, description="Systemd service type")
    exec_start: Optional[str] = Field(None, description="Override start command")
    exec_stop: Optional[str] = Field(None, description="Override stop command")
    exec_reload: Optional[str] = Field(None, description="Override reload command")
    exec_start_pre: Optional[str] = Field(None, description="Command to run before starting")
    exec_start_post: Optional[str] = Field(None, description="Command to run after starting")
    
    # Process and behavior overrides
    restart_policy: Optional[RestartPolicy] = Field(None, description="When to restart the service")
    restart_sec: Optional[int] = Field(None, ge=0, description="Time to wait before restarting (seconds)")
    timeout_start_sec: Optional[int] = Field(None, ge=1, description="Timeout for service start (seconds)")
    timeout_stop_sec: Optional[int] = Field(None, ge=1, description="Timeout for service stop (seconds)")
    
    # Process configuration overrides
    user: Optional[str] = Field(None, description="User to run the service as")
    group: Optional[str] = Field(None, description="Group to run the service as")
    working_directory: Optional[str] = Field(None, description="Working directory for the service")
    umask: Optional[str] = Field(None, description="File mode creation mask")
    
    # Environment overrides
    environment_variables: Optional[Dict[str, str]] = Field(None, description="Environment variables")
    environment_file: Optional[str] = Field(None, description="Path to environment file")
    
    # Security and sandboxing overrides
    no_new_privileges: Optional[bool] = Field(None, description="Disable privilege escalation")
    private_tmp: Optional[bool] = Field(None, description="Use private /tmp directory")
    protect_system: Optional[str] = Field(None, description="Protect system directories (strict/yes/no)")
    protect_home: Optional[bool] = Field(None, description="Protect /home directory")
    read_only_paths: Optional[List[str]] = Field(None, description="Paths to make read-only")
    inaccessible_paths: Optional[List[str]] = Field(None, description="Paths to make inaccessible")
    
    # Logging overrides
    standard_output: Optional[str] = Field(None, description="Where to send stdout (journal/null/file:path)")
    standard_error: Optional[str] = Field(None, description="Where to send stderr (journal/null/file:path)")
    syslog_identifier: Optional[str] = Field(None, description="Syslog identifier")
    
    # Install section overrides
    wanted_by: Optional[List[str]] = Field(None, description="Targets that should include this service")
    required_by: Optional[List[str]] = Field(None, description="Units that require this service")
    also: Optional[List[str]] = Field(None, description="Additional units to enable/disable with this service")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "restart_policy": "on-failure",
                "restart_sec": 10,
                "user": "myapp",
                "environment_variables": {
                    "LOG_LEVEL": "INFO"
                },
                "no_new_privileges": True
            }
        }
    )


class ServiceUpdateRequest(BaseModel):
    """Schema for updating an existing service using systemd override directories."""
    
    # Basic information updates
    display_name: Optional[str] = Field(None, max_length=255, description="Human-readable display name")
    description: Optional[str] = Field(None, description="Service description")
    
    # Override configuration for systemd services
    override_config: Optional[ServiceOverrideConfig] = Field(None, description="Systemd override configuration")
    
    # Timer configuration updates (for timer-based services)
    timer_config: Optional[TimerConfiguration] = Field(None, description="Timer configuration updates")
    
    # Management settings
    auto_restart: Optional[bool] = Field(None, description="Enable automatic restart monitoring in Owleyes")
    is_managed: Optional[bool] = Field(None, description="Whether this service should be managed by Owleyes")
    is_monitored: Optional[bool] = Field(None, description="Whether this service should be monitored")
    
    # Additional metadata
    tags: Optional[Dict[str, str]] = Field(None, description="Service tags for organization")
    extra_data: Optional[Dict[str, Any]] = Field(None, description="Additional service metadata")
    
    # Update mode and options
    apply_immediately: bool = Field(True, description="Whether to apply changes immediately or stage them")
    validate_only: bool = Field(False, description="Only validate changes without applying them")
    create_backup: bool = Field(True, description="Create backup of current configuration before applying changes")
    
    @field_validator('override_config')
    @classmethod
    def validate_override_config(cls, v):
        """Validate override configuration."""
        if v and not any([
            v.exec_start, v.restart_policy, v.user, v.group, v.working_directory,
            v.environment_variables, v.timeout_start_sec, v.timeout_stop_sec,
            v.after_units, v.wants_units, v.requires_units, v.no_new_privileges,
            v.private_tmp, v.protect_system, v.standard_output, v.standard_error
        ]):
            raise ValueError("Override configuration must contain at least one field to update")
        return v
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "display_name": "Updated Service Name",
                "override_config": {
                    "restart_policy": "on-failure",
                    "restart_sec": 10,
                    "user": "newuser",
                    "environment_variables": {
                        "LOG_LEVEL": "DEBUG",
                        "MAX_CONNECTIONS": "100"
                    }
                },
                "auto_restart": True,
                "apply_immediately": True,
                "create_backup": True
            }
        }
    )


class ServiceUpdateResponse(BaseModel):
    """Schema for service update operation results."""
    
    success: bool = Field(description="Whether the update was successful")
    message: str = Field(description="Update result message")
    service_id: int = Field(description="ID of the updated service")
    service_name: str = Field(description="Name of the service")
    server_hostname: str = Field(description="Hostname of the server")
    
    # Update details
    changes_applied: List[str] = Field(default_factory=list, description="List of changes that were applied")
    override_file_path: Optional[str] = Field(None, description="Path to the created override file")
    backup_file_path: Optional[str] = Field(None, description="Path to the backup file")
    
    # Validation results (if validate_only=True)
    validation_errors: Optional[List[str]] = Field(None, description="Validation errors found")
    validation_warnings: Optional[List[str]] = Field(None, description="Validation warnings")
    
    # Configuration preview
    override_content_preview: Optional[str] = Field(None, description="Preview of the override file content")
    systemd_reload_required: bool = Field(False, description="Whether systemd daemon reload is required")
    service_restart_required: bool = Field(False, description="Whether service restart is required for changes to take effect")
    
    timestamp: datetime = Field(description="When the update was performed")


class ServiceRollbackRequest(BaseModel):
    """Schema for rolling back service configuration changes."""
    
    rollback_to_backup: bool = Field(True, description="Rollback to the most recent backup")
    backup_file_path: Optional[str] = Field(None, description="Specific backup file to rollback to")
    remove_override: bool = Field(False, description="Remove override file entirely")
    restart_service: bool = Field(True, description="Restart service after rollback")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "rollback_to_backup": True,
                "restart_service": True
            }
        }
    )