"""Service management service layer."""

import math
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any

import structlog
from sqlalchemy import and_, desc, func, or_
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
)
from app.services.ssh_manager import ssh_manager, SSHConnectionError

logger = structlog.get_logger()


class ServiceService:
    """Service class for service management operations."""
    
    async def get_service(self, db: AsyncSession, service_id: int) -> Optional[ServiceResponse]:
        """Get a service by ID."""
        query = db.query(Service).options(selectinload(Service.server)).filter(Service.id == service_id)
        service = await query.first()
        
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
        query = db.query(Service).options(selectinload(Service.server))
        
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
        total = await query.count()
        
        # Apply pagination and ordering
        query = query.order_by(Service.name, desc(Service.updated_at))
        query = query.offset((page - 1) * per_page).limit(per_page)
        
        services = await query.all()
        service_responses = [ServiceResponse.from_service(service) for service in services]
        
        return service_responses, total
    
    async def control_service(
        self, 
        db: AsyncSession, 
        service_id: int, 
        action: str
    ) -> ServiceControlResponse:
        """Control a service (start, stop, restart, etc.)."""
        query = db.query(Service).options(selectinload(Service.server)).filter(Service.id == service_id)
        service = await query.first()
        
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
        lines: int = 100
    ) -> ServiceLogsResponse:
        """Get logs for a service."""
        query = db.query(Service).options(selectinload(Service.server)).filter(Service.id == service_id)
        service = await query.first()
        
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
                lines
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
        query = db.query(Server).filter(Server.id == server_id)
        server = await query.first()
        
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
            current_services = await db.query(Service).filter(Service.server_id == server_id).all()
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
            status_counts = await db.execute(
                db.query(Service.status, func.count(Service.id))
                .group_by(Service.status)
                .all()
            )
            
            services_by_status = {status.value: count for status, count in status_counts}
            total_services = sum(services_by_status.values())
            
            # Count services by server
            server_counts = await db.execute(
                db.query(Server.hostname, func.count(Service.id))
                .join(Service, Service.server_id == Server.id)
                .group_by(Server.hostname)
                .all()
            )
            
            services_by_server = {hostname: count for hostname, count in server_counts}
            
            # Count timer services
            timer_count = await db.query(Service).filter(Service.is_timer == True).count()
            
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


# Global service service instance
service_service = ServiceService()