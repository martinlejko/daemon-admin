"""SSH connection manager using Fabric for remote server operations."""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager

import structlog
from fabric import Connection, Config
from fabric.exceptions import GroupException
from invoke import Result
from paramiko.ssh_exception import (
    AuthenticationException,
    NoValidConnectionsError,
    SSHException,
    BadHostKeyException,
)

from app.config import get_settings
from app.models.server import Server, ServerStatus
from app.models.service import Service, ServiceStatus, ServiceState

logger = structlog.get_logger()
settings = get_settings()


class SSHConnectionError(Exception):
    """Custom exception for SSH connection errors."""
    pass


class SSHCommandError(Exception):
    """Custom exception for SSH command execution errors."""
    pass


class SSHConnectionManager:
    """Manager for SSH connections with connection pooling and error handling."""
    
    def __init__(self):
        self._connections: Dict[str, Connection] = {}
        self._executor = ThreadPoolExecutor(max_workers=settings.ssh_connection_pool_size)
        self._connection_locks: Dict[str, asyncio.Lock] = {}
    
    def _get_connection_key(self, server: Server) -> str:
        """Generate a unique key for the server connection."""
        return f"{server.hostname}:{server.ssh_port}:{server.ssh_username}"
    
    async def _execute_ssh_command(self, connection: Connection, command: str) -> Result:
        """Execute SSH command in a thread pool to avoid blocking."""
        loop = asyncio.get_event_loop()
        try:
            result = await loop.run_in_executor(
                self._executor,
                lambda: connection.run(command, hide=True, warn=True)
            )
            return result
        except Exception as e:
            logger.error("SSH command execution failed", command=command, error=str(e))
            raise SSHCommandError(f"Command failed: {str(e)}")
    
    async def _create_connection(self, server: Server) -> Connection:
        """Create a new SSH connection for the server."""
        try:
            # Create Fabric config
            config = Config(
                overrides={
                    'connect_timeout': server.connection_timeout,
                    'timeouts': {'connect': server.connection_timeout},
                    'user': server.ssh_username,
                }
            )
            
            # Create connection object
            connection = Connection(
                host=server.hostname,
                port=server.ssh_port,
                user=server.ssh_username,
                config=config,
            )
            
            # Configure authentication
            if server.ssh_key_path:
                # Use SSH key authentication
                connection.connect_kwargs.update({
                    'key_filename': server.ssh_key_path,
                    'passphrase': server.ssh_key_passphrase_encrypted,  # TODO: Decrypt
                })
            elif server.ssh_password_encrypted:
                # Use password authentication
                connection.connect_kwargs.update({
                    'password': server.ssh_password_encrypted,  # TODO: Decrypt
                })
            
            # Test connection
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                self._executor,
                lambda: connection.run('echo "connection_test"', hide=True)
            )
            
            logger.info("SSH connection established", hostname=server.hostname)
            return connection
            
        except AuthenticationException as e:
            error_msg = f"Authentication failed: {str(e)}"
            logger.error("SSH authentication failed", hostname=server.hostname, error=error_msg)
            raise SSHConnectionError(error_msg)
        except NoValidConnectionsError as e:
            error_msg = f"No valid connections: {str(e)}"
            logger.error("SSH connection failed", hostname=server.hostname, error=error_msg)
            raise SSHConnectionError(error_msg)
        except BadHostKeyException as e:
            error_msg = f"Bad host key: {str(e)}"
            logger.error("SSH host key verification failed", hostname=server.hostname, error=error_msg)
            raise SSHConnectionError(error_msg)
        except SSHException as e:
            error_msg = f"SSH error: {str(e)}"
            logger.error("SSH connection error", hostname=server.hostname, error=error_msg)
            raise SSHConnectionError(error_msg)
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error("Unexpected SSH error", hostname=server.hostname, error=error_msg)
            raise SSHConnectionError(error_msg)
    
    async def get_connection(self, server: Server) -> Connection:
        """Get or create an SSH connection for the server."""
        connection_key = self._get_connection_key(server)
        
        # Ensure we have a lock for this connection
        if connection_key not in self._connection_locks:
            self._connection_locks[connection_key] = asyncio.Lock()
        
        async with self._connection_locks[connection_key]:
            # Check if we have an existing connection
            if connection_key in self._connections:
                connection = self._connections[connection_key]
                try:
                    # Test if connection is still alive
                    await self._execute_ssh_command(connection, 'echo "ping"')
                    return connection
                except Exception:
                    # Connection is dead, remove it
                    logger.warning("Removing dead SSH connection", hostname=server.hostname)
                    self._close_connection(connection_key)
            
            # Create new connection
            connection = await self._create_connection(server)
            self._connections[connection_key] = connection
            return connection
    
    def _close_connection(self, connection_key: str) -> None:
        """Close and remove a connection."""
        if connection_key in self._connections:
            try:
                self._connections[connection_key].close()
            except Exception:
                pass  # Ignore errors when closing
            del self._connections[connection_key]
    
    async def close_all_connections(self) -> None:
        """Close all active connections."""
        for key in list(self._connections.keys()):
            self._close_connection(key)
        self._executor.shutdown(wait=True)
    
    async def test_connection(self, server: Server) -> Tuple[bool, Optional[str]]:
        """Test SSH connection to a server."""
        try:
            connection = await self.get_connection(server)
            result = await self._execute_ssh_command(connection, 'echo "test_successful"')
            if result.ok and "test_successful" in result.stdout:
                return True, None
            else:
                return False, f"Test command failed: {result.stderr}"
        except Exception as e:
            return False, str(e)
    
    async def get_system_info(self, server: Server) -> Dict[str, Any]:
        """Gather system information from the server."""
        try:
            connection = await self.get_connection(server)
            
            commands = {
                'os_name': "cat /etc/os-release | grep '^NAME=' | cut -d'=' -f2 | tr -d '\"'",
                'os_version': "cat /etc/os-release | grep '^VERSION=' | cut -d'=' -f2 | tr -d '\"'",
                'kernel_version': "uname -r",
                'architecture': "uname -m",
                'cpu_cores': "nproc",
                'total_memory_mb': "grep MemTotal /proc/meminfo | awk '{print int($2/1024)}'",
                'total_disk_gb': "df -BG / | tail -1 | awk '{print int($2)}'",
            }
            
            system_info = {}
            for key, command in commands.items():
                try:
                    result = await self._execute_ssh_command(connection, command)
                    if result.ok:
                        value = result.stdout.strip()
                        if key in ['cpu_cores', 'total_memory_mb', 'total_disk_gb']:
                            system_info[key] = int(value) if value.isdigit() else None
                        else:
                            system_info[key] = value
                    else:
                        system_info[key] = None
                except Exception as e:
                    logger.warning("Failed to get system info", key=key, error=str(e))
                    system_info[key] = None
            
            return system_info
            
        except Exception as e:
            logger.error("Failed to gather system info", hostname=server.hostname, error=str(e))
            raise SSHConnectionError(f"Failed to gather system info: {str(e)}")
    
    async def discover_services(self, server: Server) -> List[Dict[str, Any]]:
        """Discover systemd services on the server."""
        try:
            connection = await self.get_connection(server)
            
            # Get list of all systemd services
            command = "systemctl list-units --type=service --all --no-pager --output=json"
            result = await self._execute_ssh_command(connection, command)
            
            if not result.ok:
                logger.error("Failed to list services", hostname=server.hostname, stderr=result.stderr)
                return []
            
            try:
                services_data = json.loads(result.stdout)
            except json.JSONDecodeError:
                # Fallback to parsing text output
                command = "systemctl list-units --type=service --all --no-pager --no-legend"
                result = await self._execute_ssh_command(connection, command)
                services_data = self._parse_service_list_text(result.stdout)
            
            services = []
            for service_data in services_data:
                service_info = await self._get_service_details(connection, service_data.get('unit', ''))
                if service_info:
                    services.append(service_info)
            
            return services
            
        except Exception as e:
            logger.error("Failed to discover services", hostname=server.hostname, error=str(e))
            raise SSHConnectionError(f"Failed to discover services: {str(e)}")
    
    def _parse_service_list_text(self, output: str) -> List[Dict[str, str]]:
        """Parse systemctl list output when JSON is not available."""
        services = []
        for line in output.strip().split('\n'):
            if '.service' in line:
                parts = line.split()
                if len(parts) >= 4:
                    services.append({
                        'unit': parts[0],
                        'load': parts[1],
                        'active': parts[2],
                        'sub': parts[3],
                        'description': ' '.join(parts[4:]) if len(parts) > 4 else ''
                    })
        return services
    
    async def _get_service_details(self, connection: Connection, service_name: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific service."""
        if not service_name.endswith('.service'):
            return None
        
        try:
            # Get service status
            status_cmd = f"systemctl show {service_name} --no-pager"
            result = await self._execute_ssh_command(connection, status_cmd)
            
            if not result.ok:
                return None
            
            # Parse service properties
            properties = {}
            for line in result.stdout.strip().split('\n'):
                if '=' in line:
                    key, value = line.split('=', 1)
                    properties[key] = value
            
            # Map to our service model
            service_info = {
                'name': service_name,
                'description': properties.get('Description', ''),
                'status': self._map_service_status(properties.get('ActiveState', 'unknown')),
                'state': self._map_service_state(properties.get('UnitFileState', 'unknown')),
                'load_state': properties.get('LoadState', ''),
                'active_state': properties.get('ActiveState', ''),
                'sub_state': properties.get('SubState', ''),
                'main_pid': int(properties.get('MainPID', 0)) or None,
                'exec_start': properties.get('ExecStart', ''),
                'restart_policy': properties.get('Restart', ''),
                'unit_file_path': properties.get('FragmentPath', ''),
            }
            
            return service_info
            
        except Exception as e:
            logger.warning("Failed to get service details", service=service_name, error=str(e))
            return None
    
    def _map_service_status(self, active_state: str) -> ServiceStatus:
        """Map systemd ActiveState to our ServiceStatus enum."""
        mapping = {
            'active': ServiceStatus.ACTIVE,
            'inactive': ServiceStatus.INACTIVE,
            'failed': ServiceStatus.FAILED,
            'activating': ServiceStatus.ACTIVATING,
            'deactivating': ServiceStatus.DEACTIVATING,
        }
        return mapping.get(active_state.lower(), ServiceStatus.UNKNOWN)
    
    def _map_service_state(self, unit_file_state: str) -> ServiceState:
        """Map systemd UnitFileState to our ServiceState enum."""
        mapping = {
            'enabled': ServiceState.ENABLED,
            'disabled': ServiceState.DISABLED,
            'static': ServiceState.STATIC,
            'masked': ServiceState.MASKED,
        }
        return mapping.get(unit_file_state.lower(), ServiceState.UNKNOWN)
    
    async def control_service(self, server: Server, service_name: str, action: str) -> Tuple[bool, str]:
        """Control a systemd service (start, stop, restart, enable, disable)."""
        valid_actions = ['start', 'stop', 'restart', 'reload', 'enable', 'disable']
        if action not in valid_actions:
            return False, f"Invalid action: {action}. Valid actions: {', '.join(valid_actions)}"
        
        try:
            connection = await self.get_connection(server)
            command = f"sudo systemctl {action} {service_name}"
            result = await self._execute_ssh_command(connection, command)
            
            if result.ok:
                logger.info("Service action completed", 
                           hostname=server.hostname, 
                           service=service_name, 
                           action=action)
                return True, f"Successfully {action}ed {service_name}"
            else:
                error_msg = result.stderr.strip() or f"Failed to {action} {service_name}"
                logger.error("Service action failed", 
                            hostname=server.hostname, 
                            service=service_name, 
                            action=action, 
                            error=error_msg)
                return False, error_msg
                
        except Exception as e:
            error_msg = f"Failed to {action} {service_name}: {str(e)}"
            logger.error("Service control error", 
                        hostname=server.hostname, 
                        service=service_name, 
                        action=action, 
                        error=str(e))
            return False, error_msg
    
    async def get_service_logs(self, server: Server, service_name: str, lines: int = 100) -> Tuple[bool, str]:
        """Get logs for a specific service."""
        try:
            connection = await self.get_connection(server)
            command = f"sudo journalctl -u {service_name} -n {lines} --no-pager"
            result = await self._execute_ssh_command(connection, command)
            
            if result.ok:
                return True, result.stdout
            else:
                error_msg = result.stderr.strip() or f"Failed to get logs for {service_name}"
                return False, error_msg
                
        except Exception as e:
            error_msg = f"Failed to get logs for {service_name}: {str(e)}"
            logger.error("Log retrieval error", 
                        hostname=server.hostname, 
                        service=service_name, 
                        error=str(e))
            return False, error_msg


# Global SSH manager instance
ssh_manager = SSHConnectionManager()