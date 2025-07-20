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
    ServiceUpdateResponse,
    ServiceRollbackRequest,
    EnhancedServiceCreateRequest,
    ServiceDeployRequest,
    ServiceDeployResponse,
    ServiceValidationRequest,
    ServiceValidationResponse,
    ServiceTemplateRequest,
    ServiceTemplateResponse,
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
    since: Optional[str] = Query(None, description="Show logs since this time"),
    until: Optional[str] = Query(None, description="Show logs until this time"), 
    priority: Optional[str] = Query(None, description="Filter logs by minimum priority level"),
    grep: Optional[str] = Query(None, description="Filter logs containing this text pattern"),
    db: AsyncSession = Depends(get_db)
) -> ServiceLogsResponse:
    """Get logs for a service."""
    try:
        logs_response = await service_service.get_service_logs(
            db, service_id, lines, since, until, priority, grep
        )
        
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


@router.get(
    "/templates",
    response_model=List[ServiceTemplateResponse],
    summary="Get service templates",
    description="Get available service templates for common service types.",
)
async def get_service_templates(
    template_type: Optional[str] = Query(None, description="Filter by template type")
) -> List[ServiceTemplateResponse]:
    """Get available service templates."""
    try:
        # Define common service templates
        templates = []
        
        # Python Application Template
        if not template_type or template_type == "python":
            from app.schemas.service import EnhancedServiceCreateRequest, SystemdServiceType, RestartPolicy
            templates.append(ServiceTemplateResponse(
                template_name="python-app",
                description="Python application service with uv",
                service_config=EnhancedServiceCreateRequest(
                    name="my-python-app",
                    display_name="My Python Application",
                    description="A Python application service",
                    systemd_type=SystemdServiceType.SIMPLE,
                    exec_start="uv run python main.py",
                    restart_policy=RestartPolicy.ON_FAILURE,
                    user="app",
                    group="app",
                    working_directory="/opt/app",
                    environment_variables={
                        "PYTHONPATH": "/opt/app",
                        "ENV": "production"
                    },
                    standard_output="journal",
                    standard_error="journal",
                    auto_start=True,
                    auto_enable=True,
                ),
                required_parameters=["name", "exec_start", "working_directory"],
                optional_parameters=["user", "group", "environment_variables"]
            ))
        
        # Timer Service Template
        if not template_type or template_type == "timer":
            from app.schemas.service import TimerConfiguration
            templates.append(ServiceTemplateResponse(
                template_name="scheduled-task",
                description="Scheduled task service with timer",
                service_config=EnhancedServiceCreateRequest(
                    name="my-scheduled-task",
                    display_name="My Scheduled Task",
                    description="A scheduled task service",
                    systemd_type=SystemdServiceType.ONESHOT,
                    exec_start="/usr/bin/python3 /opt/scripts/task.py",
                    restart_policy=RestartPolicy.NO,
                    user="scripts",
                    group="scripts",
                    working_directory="/opt/scripts",
                    standard_output="journal",
                    standard_error="journal",
                    create_timer=True,
                    timer_config=TimerConfiguration(
                        on_calendar="daily",
                        persistent=True,
                        accuracy_sec="1min"
                    ),
                    auto_start=False,
                    auto_enable=True,
                ),
                required_parameters=["name", "exec_start", "timer_config"],
                optional_parameters=["user", "group", "working_directory"]
            ))
        
        # Web Service Template
        if not template_type or template_type == "web":
            templates.append(ServiceTemplateResponse(
                template_name="web-service",
                description="Web service with networking",
                service_config=EnhancedServiceCreateRequest(
                    name="my-web-service",
                    display_name="My Web Service",
                    description="A web service",
                    systemd_type=SystemdServiceType.SIMPLE,
                    exec_start="/usr/bin/node server.js",
                    restart_policy=RestartPolicy.ON_FAILURE,
                    restart_sec=5,
                    user="www-data",
                    group="www-data",
                    working_directory="/opt/webapp",
                    environment_variables={
                        "NODE_ENV": "production",
                        "PORT": "3000"
                    },
                    after_units=["network.target"],
                    wants_units=["network.target"],
                    standard_output="journal",
                    standard_error="journal",
                    auto_start=True,
                    auto_enable=True,
                ),
                required_parameters=["name", "exec_start", "working_directory"],
                optional_parameters=["user", "group", "environment_variables", "after_units"]
            ))
        
        # Backup Script Template
        if not template_type or template_type == "backup":
            templates.append(ServiceTemplateResponse(
                template_name="backup-script",
                description="Backup script with timer",
                service_config=EnhancedServiceCreateRequest(
                    name="backup-service",
                    display_name="Backup Service",
                    description="Automated backup service",
                    systemd_type=SystemdServiceType.ONESHOT,
                    exec_start="/opt/scripts/backup.sh",
                    restart_policy=RestartPolicy.ON_FAILURE,
                    user="backup",
                    group="backup",
                    working_directory="/opt/scripts",
                    environment_variables={
                        "BACKUP_DIR": "/backups",
                        "RETENTION_DAYS": "30"
                    },
                    create_timer=True,
                    timer_config=TimerConfiguration(
                        on_calendar="*-*-* 02:00:00",  # Daily at 2 AM
                        persistent=True,
                        accuracy_sec="5min"
                    ),
                    standard_output="journal",
                    standard_error="journal",
                    auto_start=False,
                    auto_enable=True,
                ),
                required_parameters=["name", "exec_start"],
                optional_parameters=["environment_variables", "timer_config"]
            ))
        
        logger.info("Service templates retrieved via API", 
                   template_type=template_type,
                   count=len(templates))
        
        return templates
        
    except Exception as e:
        logger.error("Failed to get service templates via API", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve service templates"
        )


@router.post(
    "/validate",
    response_model=ServiceValidationResponse,
    summary="Validate service configuration",
    description="Validate service configuration before deployment without actually creating the service.",
)
async def validate_service(
    validation_request: ServiceValidationRequest,
    db: AsyncSession = Depends(get_db)
) -> ServiceValidationResponse:
    """Validate service configuration before creation."""
    try:
        result = await service_service.validate_service_creation(
            db,
            validation_request.server_id,
            validation_request.service_config
        )
        
        logger.info("Service validation completed via API", 
                   server_id=validation_request.server_id,
                   service_name=validation_request.service_config.name,
                   valid=result.valid)
        
        return result
        
    except Exception as e:
        logger.error("Service validation failed via API", 
                    server_id=validation_request.server_id,
                    service_name=validation_request.service_config.name,
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Service validation failed"
        )


@router.post(
    "/deploy",
    response_model=ServiceDeployResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Deploy custom service",
    description="Create and deploy a custom systemd service to a specified server.",
)
async def deploy_service(
    deploy_request: ServiceDeployRequest,
    db: AsyncSession = Depends(get_db)
) -> ServiceDeployResponse:
    """Deploy a custom service to a server."""
    try:
        result = await service_service.create_custom_service(
            db,
            deploy_request.server_id,
            deploy_request.service_config,
            dry_run=deploy_request.dry_run
        )
        
        logger.info("Service deployment completed via API", 
                   server_id=deploy_request.server_id,
                   service_name=deploy_request.service_config.name,
                   success=result.success,
                   dry_run=deploy_request.dry_run)
        
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.message
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Service deployment failed via API", 
                    server_id=deploy_request.server_id,
                    service_name=deploy_request.service_config.name,
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Service deployment failed"
        )


@router.put(
    "/{service_id}",
    response_model=ServiceUpdateResponse,
    summary="Update service",
    description="Update service configuration using systemd override directories.",
)
async def update_service(
    service_id: int,
    service_data: ServiceUpdateRequest,
    db: AsyncSession = Depends(get_db)
) -> ServiceUpdateResponse:
    """Update service configuration using systemd override directories."""
    try:
        result = await service_service.update_service(db, service_id, service_data)
        
        logger.info("Service update completed via API",
                   service_id=service_id,
                   success=result.success,
                   changes_count=len(result.changes_applied))
        
        if not result.success:
            # Return bad request for business logic failures
            if "not found" in result.message or "not managed" in result.message or "disabled" in result.message:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND if "not found" in result.message else status.HTTP_400_BAD_REQUEST,
                    detail=result.message
                )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Service update failed via API",
                    service_id=service_id,
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Service update failed"
        )


@router.post(
    "/{service_id}/rollback",
    response_model=ServiceUpdateResponse,
    summary="Rollback service configuration",
    description="Rollback service configuration changes by removing override files.",
)
async def rollback_service_configuration(
    service_id: int,
    rollback_request: ServiceRollbackRequest,
    db: AsyncSession = Depends(get_db)
) -> ServiceUpdateResponse:
    """Rollback service configuration changes."""
    try:
        result = await service_service.rollback_service_configuration(
            db, service_id, rollback_request
        )
        
        logger.info("Service rollback completed via API",
                   service_id=service_id,
                   success=result.success,
                   changes_count=len(result.changes_applied))
        
        if not result.success:
            # Return appropriate error codes
            if "not found" in result.message:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=result.message
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=result.message
                )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Service rollback failed via API",
                    service_id=service_id,
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Service rollback failed"
        )


@router.delete(
    "/{service_id}",
    response_model=ServiceDeployResponse,
    summary="Remove custom service",
    description="Remove a custom service record and optionally its files from the server.",
)
async def remove_service(
    service_id: int,
    remove_files: bool = Query(True, description="Whether to remove service files from the server"),
    db: AsyncSession = Depends(get_db)
) -> ServiceDeployResponse:
    """Remove a custom service."""
    try:
        result = await service_service.remove_custom_service(
            db, service_id, remove_files=remove_files
        )
        
        logger.info("Service removal completed via API", 
                   service_id=service_id,
                   success=result.success,
                   remove_files=remove_files)
        
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.message
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Service removal failed via API", 
                    service_id=service_id,
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Service removal failed"
        )