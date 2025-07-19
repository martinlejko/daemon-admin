"""Server management service layer."""

import math
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any

import structlog
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.server import Server, ServerStatus
from app.models.service import Service
from app.schemas.server import (
    ServerCreateRequest, 
    ServerUpdateRequest, 
    ServerResponse,
    ServerStatsResponse,
    ServerSystemInfoResponse,
)
from app.services.ssh_manager import ssh_manager, SSHConnectionError

logger = structlog.get_logger()


class ServerService:
    """Service class for server management operations."""
    
    async def create_server(self, db: AsyncSession, server_data: ServerCreateRequest) -> ServerResponse:
        """Create a new server."""
        try:
            # TODO: Encrypt sensitive fields before storing
            # For now, we'll store them as-is but this needs encryption in production
            encrypted_password = server_data.ssh_password  # TODO: Encrypt
            encrypted_passphrase = server_data.ssh_key_passphrase  # TODO: Encrypt
            
            server = Server(
                hostname=server_data.hostname,
                display_name=server_data.display_name,
                description=server_data.description,
                ssh_port=server_data.ssh_port,
                ssh_username=server_data.ssh_username,
                ssh_key_path=server_data.ssh_key_path,
                ssh_password_encrypted=encrypted_password,
                ssh_key_passphrase_encrypted=encrypted_passphrase,
                connection_timeout=server_data.connection_timeout,
                connection_retries=server_data.connection_retries,
                is_enabled=server_data.is_enabled,
                auto_discover_services=server_data.auto_discover_services,
                tags=server_data.tags,
                extra_data=server_data.extra_data,
                status=ServerStatus.OFFLINE,
            )
            
            db.add(server)
            await db.commit()
            await db.refresh(server)
            
            logger.info("Server created", server_id=server.id, hostname=server.hostname)
            
            # Test connection and gather system info if successful
            if server.is_enabled:
                await self._update_server_status(db, server)
            
            return ServerResponse.from_server(server)
            
        except Exception as e:
            await db.rollback()
            logger.error("Failed to create server", error=str(e))
            raise
    
    async def get_server(self, db: AsyncSession, server_id: int) -> Optional[ServerResponse]:
        """Get a server by ID."""
        stmt = select(Server).where(Server.id == server_id)
        result = await db.execute(stmt)
        server = result.scalar_one_or_none()
        
        if not server:
            return None
        
        return ServerResponse.from_server(server)
    
    async def get_server_by_hostname(self, db: AsyncSession, hostname: str) -> Optional[ServerResponse]:
        """Get a server by hostname."""
        stmt = select(Server).where(Server.hostname == hostname)
        result = await db.execute(stmt)
        server = result.scalar_one_or_none()
        
        if not server:
            return None
        
        return ServerResponse.from_server(server)
    
    async def list_servers(
        self,
        db: AsyncSession,
        page: int = 1,
        per_page: int = 10,
        search: Optional[str] = None,
        status_filter: Optional[ServerStatus] = None,
        enabled_only: bool = False,
    ) -> Tuple[List[ServerResponse], int]:
        """List servers with pagination and filtering."""
        # Build base statement
        stmt = select(Server)
        
        # Apply filters
        filters = []
        
        if search:
            search_filter = or_(
                Server.hostname.ilike(f"%{search}%"),
                Server.display_name.ilike(f"%{search}%"),
                Server.description.ilike(f"%{search}%"),
            )
            filters.append(search_filter)
        
        if status_filter:
            filters.append(Server.status == status_filter)
        
        if enabled_only:
            filters.append(Server.is_enabled == True)
        
        if filters:
            stmt = stmt.where(and_(*filters))
        
        # Get total count
        count_stmt = select(func.count(Server.id))
        if filters:
            count_stmt = count_stmt.where(and_(*filters))
        count_result = await db.execute(count_stmt)
        total = count_result.scalar()
        
        # Apply pagination and ordering
        stmt = stmt.order_by(desc(Server.updated_at))
        stmt = stmt.offset((page - 1) * per_page).limit(per_page)
        
        result = await db.execute(stmt)
        servers = result.scalars().all()
        server_responses = [ServerResponse.from_server(server) for server in servers]
        
        return server_responses, total
    
    async def update_server(
        self, 
        db: AsyncSession, 
        server_id: int, 
        server_data: ServerUpdateRequest
    ) -> Optional[ServerResponse]:
        """Update an existing server."""
        stmt = select(Server).where(Server.id == server_id)
        result = await db.execute(stmt)
        server = result.scalar_one_or_none()
        
        if not server:
            return None
        
        try:
            # Update fields that were provided
            update_data = server_data.dict(exclude_unset=True)
            
            # Handle sensitive fields
            if 'ssh_password' in update_data:
                # TODO: Encrypt password
                server.ssh_password_encrypted = update_data.pop('ssh_password')
            
            if 'ssh_key_passphrase' in update_data:
                # TODO: Encrypt passphrase
                server.ssh_key_passphrase_encrypted = update_data.pop('ssh_key_passphrase')
            
            # Update other fields
            for field, value in update_data.items():
                if hasattr(server, field):
                    setattr(server, field, value)
            
            await db.commit()
            await db.refresh(server)
            
            logger.info("Server updated", server_id=server.id, hostname=server.hostname)
            
            # Test connection if enabled
            if server.is_enabled:
                await self._update_server_status(db, server)
            
            return ServerResponse.from_server(server)
            
        except Exception as e:
            await db.rollback()
            logger.error("Failed to update server", server_id=server_id, error=str(e))
            raise
    
    async def delete_server(self, db: AsyncSession, server_id: int) -> bool:
        """Delete a server and all its services."""
        stmt = select(Server).where(Server.id == server_id)
        result = await db.execute(stmt)
        server = result.scalar_one_or_none()
        
        if not server:
            return False
        
        try:
            hostname = server.hostname
            await db.delete(server)
            await db.commit()
            
            logger.info("Server deleted", server_id=server_id, hostname=hostname)
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error("Failed to delete server", server_id=server_id, error=str(e))
            raise
    
    async def test_connection(self, db: AsyncSession, server_id: int) -> Tuple[bool, str, Optional[int]]:
        """Test SSH connection to a server."""
        stmt = select(Server).where(Server.id == server_id)
        result = await db.execute(stmt)
        server = result.scalar_one_or_none()
        
        if not server:
            return False, "Server not found", None
        
        if not server.is_enabled:
            return False, "Server is disabled", None
        
        start_time = datetime.utcnow()
        
        try:
            success, error_msg = await ssh_manager.test_connection(server)
            
            end_time = datetime.utcnow()
            response_time_ms = int((end_time - start_time).total_seconds() * 1000)
            
            if success:
                server.mark_online()
                message = "Connection successful"
            else:
                server.mark_offline(error_msg)
                message = error_msg or "Connection failed"
            
            await db.commit()
            
            logger.info("Connection test completed", 
                       server_id=server_id, 
                       hostname=server.hostname,
                       success=success,
                       response_time_ms=response_time_ms)
            
            return success, message, response_time_ms
            
        except Exception as e:
            error_msg = f"Connection test error: {str(e)}"
            server.mark_error(error_msg)
            await db.commit()
            
            logger.error("Connection test failed", 
                        server_id=server_id, 
                        hostname=server.hostname,
                        error=str(e))
            
            return False, error_msg, None
    
    async def gather_system_info(self, db: AsyncSession, server_id: int) -> Optional[ServerSystemInfoResponse]:
        """Gather system information from a server."""
        stmt = select(Server).where(Server.id == server_id)
        result = await db.execute(stmt)
        server = result.scalar_one_or_none()
        
        if not server:
            return None
        
        if not server.is_enabled:
            logger.warning("Cannot gather system info from disabled server", server_id=server_id)
            return None
        
        try:
            system_info = await ssh_manager.get_system_info(server)
            
            # Update server with system information
            server.update_system_info(**system_info)
            server.mark_online()
            
            await db.commit()
            
            logger.info("System info gathered", 
                       server_id=server_id, 
                       hostname=server.hostname)
            
            return ServerSystemInfoResponse(
                os_name=server.os_name,
                os_version=server.os_version,
                kernel_version=server.kernel_version,
                architecture=server.architecture,
                cpu_cores=server.cpu_cores,
                total_memory_mb=server.total_memory_mb,
                total_disk_gb=server.total_disk_gb,
                last_updated=datetime.utcnow(),
            )
            
        except SSHConnectionError as e:
            server.mark_error(str(e))
            await db.commit()
            logger.error("Failed to gather system info", 
                        server_id=server_id, 
                        hostname=server.hostname,
                        error=str(e))
            return None
        except Exception as e:
            logger.error("Unexpected error gathering system info", 
                        server_id=server_id, 
                        error=str(e))
            return None
    
    async def get_server_stats(self, db: AsyncSession) -> ServerStatsResponse:
        """Get server statistics overview."""
        try:
            # Count servers by status
            stmt = select(Server.status, func.count(Server.id)).group_by(Server.status)
            result = await db.execute(stmt)
            status_counts = result.all()
            
            servers_by_status = {status.value: count for status, count in status_counts}
            total_servers = sum(servers_by_status.values())
            
            return ServerStatsResponse(
                total_servers=total_servers,
                online_servers=servers_by_status.get(ServerStatus.ONLINE.value, 0),
                offline_servers=servers_by_status.get(ServerStatus.OFFLINE.value, 0),
                error_servers=servers_by_status.get(ServerStatus.ERROR.value, 0),
                servers_by_status=servers_by_status,
            )
            
        except Exception as e:
            logger.error("Failed to get server stats", error=str(e))
            raise
    
    async def _update_server_status(self, db: AsyncSession, server: Server) -> None:
        """Update server status and system info in background."""
        try:
            # Test connection
            success, error_msg = await ssh_manager.test_connection(server)
            
            if success:
                # Gather system info
                try:
                    system_info = await ssh_manager.get_system_info(server)
                    server.update_system_info(**system_info)
                except Exception as e:
                    logger.warning("Failed to gather system info during status update", 
                                 server_id=server.id, error=str(e))
                
                server.mark_online()
            else:
                server.mark_offline(error_msg)
            
            await db.commit()
            
        except Exception as e:
            logger.error("Failed to update server status", 
                        server_id=server.id, 
                        error=str(e))


# Global server service instance
server_service = ServerService()