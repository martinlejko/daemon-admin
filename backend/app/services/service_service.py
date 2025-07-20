"""Service management service layer."""

import math
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any

import structlog
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.server import Server, ServerStatus
from app.models.service import Service, ServiceStatus, ServiceState, ServiceType
from app.schemas.service import (
    ServiceControlRequest,
    ServiceControlResponse,
    ServiceLogsResponse,
    ServiceResponse,
    ServiceDiscoveryResponse,
    ServiceStatsResponse,
    EnhancedServiceCreateRequest,
    ServiceDeployResponse,
    ServiceValidationResponse,
    ServiceUpdateRequest,
    ServiceUpdateResponse,
    ServiceRollbackRequest,
)
from app.services.ssh_manager import ssh_manager, SSHConnectionError

logger = structlog.get_logger()


class ServiceService:
    """Service class for service management operations."""
    
    async def get_service(self, db: AsyncSession, service_id: int) -> Optional[ServiceResponse]:
        """Get a service by ID."""
        query = select(Service).options(selectinload(Service.server)).filter(Service.id == service_id)
        result = await db.execute(query)
        service = result.scalar_one_or_none()
        
        if not service:
            return None
        
        return ServiceResponse.from_service(service)
    
    async def list_services(
        self,
        db: AsyncSession,
        page: int = 1,
        per_page: int = 20,
        server_id: Optional[int] = None,
        search: Optional[str] = None,
        status_filter: Optional[ServiceStatus] = None,
        service_type: Optional[ServiceType] = None,
        enabled_only: bool = False,
    ) -> Tuple[List[ServiceResponse], int]:
        """List services with pagination and filtering."""
        query = select(Service).options(selectinload(Service.server))
        
        # Apply filters
        filters = []
        
        if server_id:
            filters.append(Service.server_id == server_id)
        
        if search:
            search_filter = or_(
                Service.name.ilike(f"%{search}%"),
                Service.display_name.ilike(f"%{search}%"),
                Service.description.ilike(f"%{search}%"),
            )
            filters.append(search_filter)
        
        if status_filter:
            filters.append(Service.status == status_filter)
        
        if service_type:
            filters.append(Service.service_type == service_type)
        
        if enabled_only:
            filters.append(Service.state == ServiceState.ENABLED)
        
        if filters:
            query = query.filter(and_(*filters))
        
        # Get total count
        count_query = select(func.count(Service.id))
        if filters:
            count_query = count_query.filter(and_(*filters))
        count_result = await db.execute(count_query)
        total = count_result.scalar()
        
        # Apply pagination and ordering
        query = query.order_by(Service.name, desc(Service.updated_at))
        query = query.offset((page - 1) * per_page).limit(per_page)
        
        result = await db.execute(query)
        services = result.scalars().all()
        service_responses = [ServiceResponse.from_service(service) for service in services]
        
        return service_responses, total
    
    async def control_service(
        self, 
        db: AsyncSession, 
        service_id: int, 
        action: str
    ) -> ServiceControlResponse:
        """Control a service (start, stop, restart, etc.)."""
        query = select(Service).options(selectinload(Service.server)).filter(Service.id == service_id)
        result = await db.execute(query)
        service = result.scalar_one_or_none()
        
        if not service:
            raise ValueError(f"Service with ID {service_id} not found")
        
        if not service.server:
            raise ValueError(f"Service {service.name} has no associated server")
        
        if not service.server.is_enabled:
            raise ValueError(f"Server {service.server.hostname} is disabled")
        
        if not service.is_managed:
            raise ValueError(f"Service {service.name} is not managed by Owleyes")
        
        try:
            success, message = await ssh_manager.control_service(
                service.server, 
                service.name, 
                action
            )
            
            # Update service status after successful control operation
            if success and action in ['start', 'stop', 'restart']:
                # Refresh service status
                await self._refresh_service_status(db, service)
            
            logger.info("Service control completed", 
                       service_id=service_id,
                       service_name=service.name,
                       server_hostname=service.server.hostname,
                       action=action,
                       success=success)
            
            return ServiceControlResponse(
                success=success,
                message=message,
                service_name=service.name,
                action=action,
                timestamp=datetime.utcnow(),
            )
            
        except SSHConnectionError as e:
            error_msg = f"SSH connection failed: {str(e)}"
            logger.error("Service control failed - SSH error", 
                        service_id=service_id,
                        action=action,
                        error=str(e))
            
            return ServiceControlResponse(
                success=False,
                message=error_msg,
                service_name=service.name,
                action=action,
                timestamp=datetime.utcnow(),
            )
        except Exception as e:
            error_msg = f"Service control failed: {str(e)}"
            logger.error("Service control failed - unexpected error", 
                        service_id=service_id,
                        action=action,
                        error=str(e))
            
            return ServiceControlResponse(
                success=False,
                message=error_msg,
                service_name=service.name,
                action=action,
                timestamp=datetime.utcnow(),
            )
    
    async def get_service_logs(
        self, 
        db: AsyncSession, 
        service_id: int, 
        lines: int = 100,
        since: Optional[str] = None,
        until: Optional[str] = None,
        priority: Optional[str] = None,
        grep: Optional[str] = None
    ) -> ServiceLogsResponse:
        """Get logs for a service."""
        query = select(Service).options(selectinload(Service.server)).filter(Service.id == service_id)
        result = await db.execute(query)
        service = result.scalar_one_or_none()
        
        if not service:
            raise ValueError(f"Service with ID {service_id} not found")
        
        if not service.server:
            raise ValueError(f"Service {service.name} has no associated server")
        
        if not service.server.is_enabled:
            raise ValueError(f"Server {service.server.hostname} is disabled")
        
        try:
            success, logs = await ssh_manager.get_service_logs(
                service.server, 
                service.name, 
                lines,
                since,
                until,
                priority,
                grep
            )
            
            if success:
                # Count actual lines returned
                lines_returned = len(logs.strip().split('\n')) if logs.strip() else 0
                
                logger.info("Service logs retrieved", 
                           service_id=service_id,
                           service_name=service.name,
                           lines_returned=lines_returned)
                
                return ServiceLogsResponse(
                    success=True,
                    logs=logs,
                    service_name=service.name,
                    lines_returned=lines_returned,
                    timestamp=datetime.utcnow(),
                )
            else:
                logger.error("Failed to retrieve service logs", 
                           service_id=service_id,
                           error=logs)
                
                return ServiceLogsResponse(
                    success=False,
                    logs=f"Error retrieving logs: {logs}",
                    service_name=service.name,
                    lines_returned=0,
                    timestamp=datetime.utcnow(),
                )
                
        except SSHConnectionError as e:
            error_msg = f"SSH connection failed: {str(e)}"
            logger.error("Failed to retrieve service logs - SSH error", 
                        service_id=service_id,
                        error=str(e))
            
            return ServiceLogsResponse(
                success=False,
                logs=error_msg,
                service_name=service.name,
                lines_returned=0,
                timestamp=datetime.utcnow(),
            )
        except Exception as e:
            error_msg = f"Failed to retrieve logs: {str(e)}"
            logger.error("Failed to retrieve service logs - unexpected error", 
                        service_id=service_id,
                        error=str(e))
            
            return ServiceLogsResponse(
                success=False,
                logs=error_msg,
                service_name=service.name,
                lines_returned=0,
                timestamp=datetime.utcnow(),
            )
    
    async def discover_services(
        self, 
        db: AsyncSession, 
        server_id: int,
        force_refresh: bool = False
    ) -> ServiceDiscoveryResponse:
        """Discover services on a server."""
        query = select(Server).filter(Server.id == server_id)
        result = await db.execute(query)
        server = result.scalar_one_or_none()
        
        if not server:
            raise ValueError(f"Server with ID {server_id} not found")
        
        if not server.is_enabled:
            raise ValueError(f"Server {server.hostname} is disabled")
        
        if not server.auto_discover_services and not force_refresh:
            return ServiceDiscoveryResponse(
                success=False,
                services_discovered=0,
                services_updated=0,
                services_removed=0,
                error_message="Auto-discovery is disabled for this server",
                timestamp=datetime.utcnow(),
            )
        
        try:
            # Get current services from database
            current_services_query = select(Service).filter(Service.server_id == server_id)
            current_services_result = await db.execute(current_services_query)
            current_services = current_services_result.scalars().all()
            current_service_names = {service.name for service in current_services}
            
            # Discover services via SSH
            discovered_services = await ssh_manager.discover_services(server)
            discovered_service_names = {service['name'] for service in discovered_services}
            
            services_discovered = 0
            services_updated = 0
            services_removed = 0
            
            # Add or update discovered services
            for service_data in discovered_services:
                service_name = service_data['name']
                existing_service = next(
                    (s for s in current_services if s.name == service_name), 
                    None
                )
                
                if existing_service:
                    # Update existing service
                    existing_service.update_status(
                        status=service_data['status'],
                        state=service_data['state'],
                        main_pid=service_data.get('main_pid'),
                        load_state=service_data.get('load_state'),
                        active_state=service_data.get('active_state'),
                        sub_state=service_data.get('sub_state'),
                    )
                    
                    # Update other fields
                    existing_service.description = service_data.get('description')
                    existing_service.exec_start = service_data.get('exec_start')
                    existing_service.restart_policy = service_data.get('restart_policy')
                    existing_service.unit_file_path = service_data.get('unit_file_path')
                    
                    services_updated += 1
                else:
                    # Create new service
                    new_service = Service(
                        server_id=server_id,
                        name=service_name,
                        description=service_data.get('description'),
                        service_type=ServiceType.SYSTEMD,
                        unit_file_path=service_data.get('unit_file_path'),
                        status=service_data['status'],
                        state=service_data['state'],
                        main_pid=service_data.get('main_pid'),
                        load_state=service_data.get('load_state'),
                        active_state=service_data.get('active_state'),
                        sub_state=service_data.get('sub_state'),
                        exec_start=service_data.get('exec_start'),
                        restart_policy=service_data.get('restart_policy'),
                        last_status_check=datetime.utcnow(),
                    )
                    
                    db.add(new_service)
                    services_discovered += 1
            
            # Remove services that no longer exist
            for service in current_services:
                if service.name not in discovered_service_names and service.service_type == ServiceType.SYSTEMD:
                    await db.delete(service)
                    services_removed += 1
            
            await db.commit()
            
            logger.info("Service discovery completed", 
                       server_id=server_id,
                       server_hostname=server.hostname,
                       services_discovered=services_discovered,
                       services_updated=services_updated,
                       services_removed=services_removed)
            
            return ServiceDiscoveryResponse(
                success=True,
                services_discovered=services_discovered,
                services_updated=services_updated,
                services_removed=services_removed,
                error_message=None,
                timestamp=datetime.utcnow(),
            )
            
        except SSHConnectionError as e:
            error_msg = f"SSH connection failed: {str(e)}"
            logger.error("Service discovery failed - SSH error", 
                        server_id=server_id,
                        error=str(e))
            
            return ServiceDiscoveryResponse(
                success=False,
                services_discovered=0,
                services_updated=0,
                services_removed=0,
                error_message=error_msg,
                timestamp=datetime.utcnow(),
            )
        except Exception as e:
            await db.rollback()
            error_msg = f"Service discovery failed: {str(e)}"
            logger.error("Service discovery failed - unexpected error", 
                        server_id=server_id,
                        error=str(e))
            
            return ServiceDiscoveryResponse(
                success=False,
                services_discovered=0,
                services_updated=0,
                services_removed=0,
                error_message=error_msg,
                timestamp=datetime.utcnow(),
            )
    
    async def get_service_stats(self, db: AsyncSession) -> ServiceStatsResponse:
        """Get service statistics overview."""
        try:
            # Count services by status
            status_query = select(Service.status, func.count(Service.id)).group_by(Service.status)
            status_result = await db.execute(status_query)
            status_counts = status_result.all()
            
            services_by_status = {status.value: count for status, count in status_counts}
            total_services = sum(services_by_status.values())
            
            # Count services by server
            server_query = select(Server.hostname, func.count(Service.id)).join(Service, Service.server_id == Server.id).group_by(Server.hostname)
            server_result = await db.execute(server_query)
            server_counts = server_result.all()
            
            services_by_server = {hostname: count for hostname, count in server_counts}
            
            # Count timer services
            timer_query = select(func.count(Service.id)).filter(Service.is_timer == True)
            timer_result = await db.execute(timer_query)
            timer_count = timer_result.scalar()
            
            return ServiceStatsResponse(
                total_services=total_services,
                active_services=services_by_status.get(ServiceStatus.ACTIVE.value, 0),
                inactive_services=services_by_status.get(ServiceStatus.INACTIVE.value, 0),
                failed_services=services_by_status.get(ServiceStatus.FAILED.value, 0),
                services_by_status=services_by_status,
                services_by_server=services_by_server,
                timer_services=timer_count,
            )
            
        except Exception as e:
            logger.error("Failed to get service stats", error=str(e))
            raise
    
    async def _refresh_service_status(self, db: AsyncSession, service: Service) -> None:
        """Refresh the status of a single service."""
        try:
            if not service.server or not service.server.is_enabled:
                return
            
            service_details = await ssh_manager._get_service_details(
                await ssh_manager.get_connection(service.server),
                service.name
            )
            
            if service_details:
                service.update_status(
                    status=service_details['status'],
                    state=service_details['state'],
                    main_pid=service_details.get('main_pid'),
                    load_state=service_details.get('load_state'),
                    active_state=service_details.get('active_state'),
                    sub_state=service_details.get('sub_state'),
                )
                
                await db.commit()
                
        except Exception as e:
            logger.warning("Failed to refresh service status", 
                          service_id=service.id,
                          service_name=service.name,
                          error=str(e))
    
    async def validate_service_creation(
        self,
        db: AsyncSession,
        server_id: int,
        service_config: EnhancedServiceCreateRequest
    ) -> ServiceValidationResponse:
        """Validate service configuration before creation."""
        try:
            # Get server
            query = select(Server).filter(Server.id == server_id)
            result = await db.execute(query)
            server = result.scalar_one_or_none()
            
            if not server:
                return ServiceValidationResponse(
                    valid=False,
                    errors=[f"Server with ID {server_id} not found"],
                    warnings=[],
                    suggestions=[],
                    timestamp=datetime.utcnow(),
                )
            
            if not server.is_enabled:
                return ServiceValidationResponse(
                    valid=False,
                    errors=[f"Server {server.hostname} is disabled"],
                    warnings=[],
                    suggestions=[],
                    timestamp=datetime.utcnow(),
                )
            
            # Check if service name already exists in database
            existing_service_query = select(Service).filter(
                Service.server_id == server_id,
                Service.name == f"{service_config.name}.service"
            )
            existing_service_result = await db.execute(existing_service_query)
            existing_service = existing_service_result.scalar_one_or_none()
            
            errors = []
            warnings = []
            suggestions = []
            
            if existing_service:
                errors.append(f"Service {service_config.name} already exists in database")
            
            # Validate via SSH
            try:
                # Convert Pydantic model to dict for SSH manager
                service_dict = service_config.model_dump()
                
                is_valid, ssh_errors, ssh_warnings = await ssh_manager.validate_service_configuration(
                    server, service_dict
                )
                
                errors.extend(ssh_errors)
                warnings.extend(ssh_warnings)
                
            except SSHConnectionError as e:
                errors.append(f"SSH connection failed: {str(e)}")
            except Exception as e:
                errors.append(f"Validation failed: {str(e)}")
            
            # Add suggestions based on validation results
            if warnings:
                suggestions.append("Review warnings to ensure optimal service configuration")
            
            if service_config.user and not service_config.group:
                suggestions.append("Consider specifying a group when setting a user")
            
            if not service_config.working_directory and service_config.exec_start:
                suggestions.append("Consider setting a working directory for better service isolation")
            
            return ServiceValidationResponse(
                valid=len(errors) == 0,
                errors=errors,
                warnings=warnings,
                suggestions=suggestions,
                timestamp=datetime.utcnow(),
            )
            
        except Exception as e:
            logger.error("Service validation failed", 
                        server_id=server_id,
                        service_name=service_config.name,
                        error=str(e))
            
            return ServiceValidationResponse(
                valid=False,
                errors=[f"Validation failed: {str(e)}"],
                warnings=[],
                suggestions=[],
                timestamp=datetime.utcnow(),
            )
    
    async def create_custom_service(
        self,
        db: AsyncSession,
        server_id: int,
        service_config: EnhancedServiceCreateRequest,
        dry_run: bool = False
    ) -> ServiceDeployResponse:
        """Create a custom systemd service on the specified server."""
        try:
            # Get server
            query = select(Server).filter(Server.id == server_id)
            result = await db.execute(query)
            server = result.scalar_one_or_none()
            
            if not server:
                return ServiceDeployResponse(
                    success=False,
                    message=f"Server with ID {server_id} not found",
                    service_name=service_config.name,
                    server_hostname="Unknown",
                    created_files=[],
                    actions_performed=[],
                    timestamp=datetime.utcnow(),
                )
            
            if not server.is_enabled:
                return ServiceDeployResponse(
                    success=False,
                    message=f"Server {server.hostname} is disabled",
                    service_name=service_config.name,
                    server_hostname=server.hostname,
                    created_files=[],
                    actions_performed=[],
                    timestamp=datetime.utcnow(),
                )
            
            # Check if service already exists in database
            existing_service_query = select(Service).filter(
                Service.server_id == server_id,
                Service.name == f"{service_config.name}.service"
            )
            existing_service_result = await db.execute(existing_service_query)
            existing_service = existing_service_result.scalar_one_or_none()
            
            if existing_service and not dry_run:
                return ServiceDeployResponse(
                    success=False,
                    message=f"Service {service_config.name} already exists",
                    service_name=service_config.name,
                    server_hostname=server.hostname,
                    created_files=[],
                    actions_performed=[],
                    timestamp=datetime.utcnow(),
                )
            
            # Convert Pydantic model to dict for SSH manager
            service_dict = service_config.model_dump()
            
            # Create service via SSH
            try:
                success, message, created_files, systemd_files = await ssh_manager.create_systemd_service(
                    server, service_dict, dry_run=dry_run
                )
                
                if not success:
                    return ServiceDeployResponse(
                        success=False,
                        message=message,
                        service_name=service_config.name,
                        server_hostname=server.hostname,
                        created_files=[],
                        actions_performed=[],
                        timestamp=datetime.utcnow(),
                    )
                
                # If this is a dry run, return the preview
                if dry_run:
                    return ServiceDeployResponse(
                        success=True,
                        message="Dry run validation successful",
                        service_name=service_config.name,
                        server_hostname=server.hostname,
                        created_files=[],
                        actions_performed=["Generated systemd files", "Validated configuration"],
                        timestamp=datetime.utcnow(),
                        systemd_files_preview=systemd_files,
                    )
                
                # Create service record in database
                new_service = Service(
                    server_id=server_id,
                    name=f"{service_config.name}.service",
                    display_name=service_config.display_name,
                    description=service_config.description,
                    service_type=ServiceType.SYSTEMD,
                    unit_file_path=f"/etc/systemd/system/{service_config.name}.service",
                    
                    # Service configuration
                    exec_start=service_config.exec_start,
                    exec_reload=service_config.exec_reload,
                    exec_stop=service_config.exec_stop,
                    exec_start_pre=service_config.exec_start_pre,
                    exec_start_post=service_config.exec_start_post,
                    restart_policy=service_config.restart_policy.value,
                    restart_sec=service_config.restart_sec,
                    
                    # Systemd configuration
                    systemd_type=service_config.systemd_type.value,
                    working_directory=service_config.working_directory,
                    user=service_config.user,
                    group=service_config.group,
                    
                    # Security settings
                    no_new_privileges=service_config.no_new_privileges,
                    private_tmp=service_config.private_tmp,
                    protect_system=service_config.protect_system,
                    protect_home=service_config.protect_home,
                    
                    # Logging
                    standard_output=service_config.standard_output,
                    standard_error=service_config.standard_error,
                    syslog_identifier=service_config.syslog_identifier,
                    
                    # Timer configuration
                    is_timer=service_config.create_timer,
                    timer_schedule=service_config.timer_config.on_calendar if service_config.timer_config else None,
                    timer_file_path=f"/etc/systemd/system/{service_config.name}.timer" if service_config.create_timer else None,
                    
                    # Dependencies
                    dependencies=service_config.after_units or [],
                    dependents=service_config.before_units or [],
                    conflicts=service_config.conflicts_units or [],
                    
                    # Environment and metadata
                    environment_variables=service_config.environment_variables,
                    service_config=service_dict,
                    
                    # Management settings
                    auto_restart=service_config.auto_restart,
                    is_managed=service_config.is_managed,
                    is_monitored=service_config.is_monitored,
                    is_custom_created=True,
                    creation_source="created",
                    
                    # Additional metadata
                    tags=service_config.tags,
                    extra_data=service_config.extra_data,
                    
                    # Initial status
                    status=ServiceStatus.ACTIVE if service_config.auto_start else ServiceStatus.INACTIVE,
                    state=ServiceState.ENABLED if service_config.auto_enable else ServiceState.DISABLED,
                    last_status_check=datetime.utcnow(),
                )
                
                db.add(new_service)
                await db.commit()
                
                # Get the created service with its ID
                await db.refresh(new_service)
                
                # Prepare actions performed list
                actions_performed = ["Created systemd service file"]
                if service_config.create_timer:
                    actions_performed.append("Created systemd timer file")
                if service_config.auto_enable:
                    actions_performed.append("Enabled service")
                if service_config.auto_start:
                    actions_performed.append("Started service")
                
                logger.info("Custom service created successfully", 
                           server_id=server_id,
                           server_hostname=server.hostname,
                           service_name=service_config.name,
                           service_id=new_service.id,
                           created_files=created_files,
                           has_timer=service_config.create_timer)
                
                return ServiceDeployResponse(
                    success=True,
                    message=f"Service {service_config.name} created successfully",
                    service_id=new_service.id,
                    service_name=service_config.name,
                    server_hostname=server.hostname,
                    created_files=created_files,
                    actions_performed=actions_performed,
                    timestamp=datetime.utcnow(),
                )
                
            except SSHConnectionError as e:
                error_msg = f"SSH connection failed: {str(e)}"
                logger.error("Service creation failed - SSH error", 
                            server_id=server_id,
                            service_name=service_config.name,
                            error=str(e))
                
                return ServiceDeployResponse(
                    success=False,
                    message=error_msg,
                    service_name=service_config.name,
                    server_hostname=server.hostname,
                    created_files=[],
                    actions_performed=[],
                    timestamp=datetime.utcnow(),
                )
                
        except Exception as e:
            await db.rollback()
            error_msg = f"Service creation failed: {str(e)}"
            logger.error("Service creation failed - unexpected error", 
                        server_id=server_id,
                        service_name=service_config.name if hasattr(service_config, 'name') else 'unknown',
                        error=str(e))
            
            return ServiceDeployResponse(
                success=False,
                message=error_msg,
                service_name=service_config.name if hasattr(service_config, 'name') else 'unknown',
                server_hostname=server.hostname if 'server' in locals() and server else "Unknown",
                created_files=[],
                actions_performed=[],
                timestamp=datetime.utcnow(),
            )
    
    async def remove_custom_service(
        self,
        db: AsyncSession,
        service_id: int,
        remove_files: bool = True
    ) -> ServiceDeployResponse:
        """Remove a custom service and optionally its files from the server."""
        try:
            # Get service with server relationship
            query = select(Service).options(selectinload(Service.server)).filter(Service.id == service_id)
            result = await db.execute(query)
            service = result.scalar_one_or_none()
            
            if not service:
                return ServiceDeployResponse(
                    success=False,
                    message=f"Service with ID {service_id} not found",
                    service_name="Unknown",
                    server_hostname="Unknown",
                    created_files=[],
                    actions_performed=[],
                    timestamp=datetime.utcnow(),
                )
            
            if not service.is_custom_created:
                return ServiceDeployResponse(
                    success=False,
                    message=f"Service {service.name} is not a custom-created service",
                    service_name=service.name,
                    server_hostname=service.server.hostname if service.server else "Unknown",
                    created_files=[],
                    actions_performed=[],
                    timestamp=datetime.utcnow(),
                )
            
            server = service.server
            if not server:
                return ServiceDeployResponse(
                    success=False,
                    message=f"Service {service.name} has no associated server",
                    service_name=service.name,
                    server_hostname="Unknown",
                    created_files=[],
                    actions_performed=[],
                    timestamp=datetime.utcnow(),
                )
            
            actions_performed = []
            
            # Remove service files from server if requested
            if remove_files and server.is_enabled:
                try:
                    # Extract service name without .service extension
                    service_name_clean = service.name.replace('.service', '')
                    
                    success, message = await ssh_manager.remove_systemd_service(
                        server, service_name_clean, remove_timer=service.is_timer
                    )
                    
                    if success:
                        actions_performed.extend([
                            "Stopped service",
                            "Disabled service", 
                            "Removed service file"
                        ])
                        if service.is_timer:
                            actions_performed.append("Removed timer file")
                        actions_performed.append("Reloaded systemd daemon")
                    else:
                        logger.warning("Failed to remove service files", 
                                     service_id=service_id,
                                     error=message)
                        
                except SSHConnectionError as e:
                    logger.warning("SSH connection failed during service removal", 
                                 service_id=service_id,
                                 error=str(e))
            
            # Remove service from database
            await db.delete(service)
            await db.commit()
            actions_performed.append("Removed service from database")
            
            logger.info("Custom service removed successfully", 
                       service_id=service_id,
                       service_name=service.name,
                       server_hostname=server.hostname,
                       removed_files=remove_files)
            
            return ServiceDeployResponse(
                success=True,
                message=f"Service {service.name} removed successfully",
                service_name=service.name,
                server_hostname=server.hostname,
                created_files=[],
                actions_performed=actions_performed,
                timestamp=datetime.utcnow(),
            )
            
        except Exception as e:
            await db.rollback()
            error_msg = f"Service removal failed: {str(e)}"
            logger.error("Service removal failed", 
                        service_id=service_id,
                        error=str(e))
            
            return ServiceDeployResponse(
                success=False,
                message=error_msg,
                service_name="Unknown",
                server_hostname="Unknown",
                created_files=[],
                actions_performed=[],
                timestamp=datetime.utcnow(),
            )
    
    async def update_service(
        self,
        db: AsyncSession,
        service_id: int,
        update_request: ServiceUpdateRequest
    ) -> ServiceUpdateResponse:
        """Update service configuration using systemd override directories."""
        try:
            # Get service with server relationship
            query = select(Service).options(selectinload(Service.server)).filter(Service.id == service_id)
            result = await db.execute(query)
            service = result.scalar_one_or_none()
            
            if not service:
                return ServiceUpdateResponse(
                    success=False,
                    message=f"Service with ID {service_id} not found",
                    service_id=service_id,
                    service_name="Unknown",
                    server_hostname="Unknown",
                    changes_applied=[],
                    timestamp=datetime.utcnow(),
                )
            
            if not service.server:
                return ServiceUpdateResponse(
                    success=False,
                    message=f"Service {service.name} has no associated server",
                    service_id=service_id,
                    service_name=service.name,
                    server_hostname="Unknown",
                    changes_applied=[],
                    timestamp=datetime.utcnow(),
                )
            
            if not service.server.is_enabled:
                return ServiceUpdateResponse(
                    success=False,
                    message=f"Server {service.server.hostname} is disabled",
                    service_id=service_id,
                    service_name=service.name,
                    server_hostname=service.server.hostname,
                    changes_applied=[],
                    timestamp=datetime.utcnow(),
                )
            
            # Only allow editing of managed services
            if not service.is_managed:
                return ServiceUpdateResponse(
                    success=False,
                    message=f"Service {service.name} is not managed by Owleyes and cannot be edited",
                    service_id=service_id,
                    service_name=service.name,
                    server_hostname=service.server.hostname,
                    changes_applied=[],
                    timestamp=datetime.utcnow(),
                )
            
            changes_applied = []
            override_file_path = None
            backup_file_path = None
            validation_errors = []
            validation_warnings = []
            
            # Handle override configuration
            if update_request.override_config:
                try:
                    # Convert Pydantic model to dict for SSH manager
                    override_dict = update_request.override_config.model_dump(exclude_none=True)
                    
                    # Validate override configuration if validation is requested
                    if update_request.validate_only:
                        is_valid, errors, warnings = await ssh_manager.validate_service_override(
                            service.server, service.name, override_dict
                        )
                        validation_errors.extend(errors)
                        validation_warnings.extend(warnings)
                        
                        if not is_valid:
                            return ServiceUpdateResponse(
                                success=False,
                                message="Override configuration validation failed",
                                service_id=service_id,
                                service_name=service.name,
                                server_hostname=service.server.hostname,
                                changes_applied=[],
                                validation_errors=validation_errors,
                                validation_warnings=validation_warnings,
                                timestamp=datetime.utcnow(),
                            )
                    
                    # Generate override content preview
                    override_content_preview = ssh_manager._generate_override_file_content(override_dict)
                    
                    # If this is validate_only mode, return preview
                    if update_request.validate_only:
                        return ServiceUpdateResponse(
                            success=True,
                            message="Override configuration validation successful",
                            service_id=service_id,
                            service_name=service.name,
                            server_hostname=service.server.hostname,
                            changes_applied=["Configuration validated"],
                            validation_errors=validation_errors,
                            validation_warnings=validation_warnings,
                            override_content_preview=override_content_preview,
                            systemd_reload_required=True,
                            service_restart_required=True,
                            timestamp=datetime.utcnow(),
                        )
                    
                    # Apply override configuration if not validate_only
                    if update_request.apply_immediately:
                        success, message, override_path, backup_path = await ssh_manager.create_service_override(
                            service.server,
                            service.name,
                            override_dict,
                            create_backup=update_request.create_backup
                        )
                        
                        if not success:
                            return ServiceUpdateResponse(
                                success=False,
                                message=f"Failed to apply override configuration: {message}",
                                service_id=service_id,
                                service_name=service.name,
                                server_hostname=service.server.hostname,
                                changes_applied=[],
                                timestamp=datetime.utcnow(),
                            )
                        
                        override_file_path = override_path
                        backup_file_path = backup_path
                        changes_applied.append("Applied systemd override configuration")
                        
                        # Update override_config in database
                        service.override_config = override_dict
                
                except Exception as e:
                    logger.error("Failed to handle override configuration",
                                service_id=service_id,
                                error=str(e))
                    return ServiceUpdateResponse(
                        success=False,
                        message=f"Override configuration error: {str(e)}",
                        service_id=service_id,
                        service_name=service.name,
                        server_hostname=service.server.hostname,
                        changes_applied=[],
                        timestamp=datetime.utcnow(),
                    )
            
            # Update basic service information in database
            if update_request.display_name is not None:
                service.display_name = update_request.display_name
                changes_applied.append("Updated display name")
            
            if update_request.description is not None:
                service.description = update_request.description
                changes_applied.append("Updated description")
            
            if update_request.auto_restart is not None:
                service.auto_restart = update_request.auto_restart
                changes_applied.append(f"{'Enabled' if update_request.auto_restart else 'Disabled'} auto-restart")
            
            if update_request.is_managed is not None:
                service.is_managed = update_request.is_managed
                changes_applied.append(f"{'Enabled' if update_request.is_managed else 'Disabled'} management")
            
            if update_request.is_monitored is not None:
                service.is_monitored = update_request.is_monitored
                changes_applied.append(f"{'Enabled' if update_request.is_monitored else 'Disabled'} monitoring")
            
            if update_request.tags is not None:
                service.tags = update_request.tags
                changes_applied.append("Updated tags")
            
            if update_request.extra_data is not None:
                service.extra_data = update_request.extra_data
                changes_applied.append("Updated extra data")
            
            # Handle timer configuration updates
            if update_request.timer_config and service.is_timer:
                # Timer configuration updates would require more complex logic
                # For now, we'll store it in service_config and require manual service restart
                if not service.service_config:
                    service.service_config = {}
                service.service_config['timer_config'] = update_request.timer_config.model_dump(exclude_none=True)
                changes_applied.append("Updated timer configuration (requires manual timer restart)")
            
            # Commit database changes
            await db.commit()
            
            logger.info("Service updated successfully",
                       service_id=service_id,
                       service_name=service.name,
                       server_hostname=service.server.hostname,
                       changes_applied=changes_applied,
                       override_applied=override_file_path is not None)
            
            return ServiceUpdateResponse(
                success=True,
                message=f"Service {service.name} updated successfully",
                service_id=service_id,
                service_name=service.name,
                server_hostname=service.server.hostname,
                changes_applied=changes_applied,
                override_file_path=override_file_path,
                backup_file_path=backup_file_path,
                validation_errors=validation_errors,
                validation_warnings=validation_warnings,
                systemd_reload_required=override_file_path is not None,
                service_restart_required=override_file_path is not None,
                timestamp=datetime.utcnow(),
            )
            
        except Exception as e:
            await db.rollback()
            error_msg = f"Service update failed: {str(e)}"
            logger.error("Service update failed",
                        service_id=service_id,
                        error=str(e))
            
            return ServiceUpdateResponse(
                success=False,
                message=error_msg,
                service_id=service_id,
                service_name=service.name if 'service' in locals() and service else "Unknown",
                server_hostname=service.server.hostname if 'service' in locals() and service and service.server else "Unknown",
                changes_applied=[],
                timestamp=datetime.utcnow(),
            )
    
    async def rollback_service_configuration(
        self,
        db: AsyncSession,
        service_id: int,
        rollback_request: ServiceRollbackRequest
    ) -> ServiceUpdateResponse:
        """Rollback service configuration changes."""
        try:
            # Get service with server relationship
            query = select(Service).options(selectinload(Service.server)).filter(Service.id == service_id)
            result = await db.execute(query)
            service = result.scalar_one_or_none()
            
            if not service:
                return ServiceUpdateResponse(
                    success=False,
                    message=f"Service with ID {service_id} not found",
                    service_id=service_id,
                    service_name="Unknown",
                    server_hostname="Unknown",
                    changes_applied=[],
                    timestamp=datetime.utcnow(),
                )
            
            if not service.server or not service.server.is_enabled:
                return ServiceUpdateResponse(
                    success=False,
                    message=f"Server {service.server.hostname if service.server else 'Unknown'} is not available",
                    service_id=service_id,
                    service_name=service.name,
                    server_hostname=service.server.hostname if service.server else "Unknown",
                    changes_applied=[],
                    timestamp=datetime.utcnow(),
                )
            
            changes_applied = []
            
            if rollback_request.remove_override:
                # Remove override file entirely
                success, message = await ssh_manager.remove_service_override(
                    service.server,
                    service.name,
                    remove_backup=False
                )
                
                if success:
                    changes_applied.append("Removed override configuration")
                    # Clear override_config from database
                    service.override_config = None
                else:
                    return ServiceUpdateResponse(
                        success=False,
                        message=f"Failed to remove override configuration: {message}",
                        service_id=service_id,
                        service_name=service.name,
                        server_hostname=service.server.hostname,
                        changes_applied=[],
                        timestamp=datetime.utcnow(),
                    )
            
            # Restart service if requested
            if rollback_request.restart_service and service.is_managed:
                try:
                    success, restart_message = await ssh_manager.control_service(
                        service.server, service.name, "restart"
                    )
                    if success:
                        changes_applied.append("Restarted service")
                        # Refresh service status
                        await self._refresh_service_status(db, service)
                    else:
                        logger.warning("Failed to restart service after rollback",
                                     service_id=service_id,
                                     error=restart_message)
                except Exception as e:
                    logger.warning("Failed to restart service after rollback",
                                 service_id=service_id,
                                 error=str(e))
            
            # Commit database changes
            await db.commit()
            
            logger.info("Service configuration rolled back successfully",
                       service_id=service_id,
                       service_name=service.name,
                       server_hostname=service.server.hostname,
                       changes_applied=changes_applied)
            
            return ServiceUpdateResponse(
                success=True,
                message=f"Service {service.name} configuration rolled back successfully",
                service_id=service_id,
                service_name=service.name,
                server_hostname=service.server.hostname,
                changes_applied=changes_applied,
                timestamp=datetime.utcnow(),
            )
            
        except Exception as e:
            await db.rollback()
            error_msg = f"Service rollback failed: {str(e)}"
            logger.error("Service rollback failed",
                        service_id=service_id,
                        error=str(e))
            
            return ServiceUpdateResponse(
                success=False,
                message=error_msg,
                service_id=service_id,
                service_name=service.name if 'service' in locals() and service else "Unknown",
                server_hostname=service.server.hostname if 'service' in locals() and service and service.server else "Unknown",
                changes_applied=[],
                timestamp=datetime.utcnow(),
            )


# Global service service instance
service_service = ServiceService()