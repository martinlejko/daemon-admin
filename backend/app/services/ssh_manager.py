"""SSH connection manager using Fabric for remote server operations."""

import asyncio
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from concurrent.futures import ThreadPoolExecutor

import structlog
from fabric import Connection, Config
from invoke import Result
from paramiko.ssh_exception import (
    AuthenticationException,
    NoValidConnectionsError,
    SSHException,
    BadHostKeyException,
)

from app.config import get_settings
from app.models.server import Server
from app.models.service import ServiceStatus, ServiceState

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
        self._executor = ThreadPoolExecutor(
            max_workers=settings.ssh_connection_pool_size
        )
        self._connection_locks: Dict[str, asyncio.Lock] = {}

    def _get_connection_key(self, server: Server) -> str:
        """Generate a unique key for the server connection."""
        return f"{server.hostname}:{server.ssh_port}:{server.ssh_username}"

    async def _execute_ssh_command(
        self, connection: Connection, command: str
    ) -> Result:
        """Execute SSH command in a thread pool to avoid blocking."""
        loop = asyncio.get_event_loop()
        try:
            result = await loop.run_in_executor(
                self._executor, lambda: connection.run(command, hide=True, warn=True)
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
                    "connect_timeout": server.connection_timeout,
                    "timeouts": {"connect": server.connection_timeout},
                    "user": server.ssh_username,
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
                connection.connect_kwargs.update(
                    {
                        "key_filename": server.ssh_key_path,
                        "passphrase": server.ssh_key_passphrase_encrypted,  # TODO: Decrypt
                    }
                )
            elif server.ssh_password_encrypted:
                # Use password authentication
                connection.connect_kwargs.update(
                    {
                        "password": server.ssh_password_encrypted,  # TODO: Decrypt
                    }
                )

            # Test connection
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                self._executor,
                lambda: connection.run('echo "connection_test"', hide=True),
            )

            logger.info("SSH connection established", hostname=server.hostname)
            return connection

        except AuthenticationException as e:
            error_msg = f"Authentication failed: {str(e)}"
            logger.error(
                "SSH authentication failed", hostname=server.hostname, error=error_msg
            )
            raise SSHConnectionError(error_msg)
        except NoValidConnectionsError as e:
            error_msg = f"No valid connections: {str(e)}"
            logger.error(
                "SSH connection failed", hostname=server.hostname, error=error_msg
            )
            raise SSHConnectionError(error_msg)
        except BadHostKeyException as e:
            error_msg = f"Bad host key: {str(e)}"
            logger.error(
                "SSH host key verification failed",
                hostname=server.hostname,
                error=error_msg,
            )
            raise SSHConnectionError(error_msg)
        except SSHException as e:
            error_msg = f"SSH error: {str(e)}"
            logger.error(
                "SSH connection error", hostname=server.hostname, error=error_msg
            )
            raise SSHConnectionError(error_msg)
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(
                "Unexpected SSH error", hostname=server.hostname, error=error_msg
            )
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
                    logger.warning(
                        "Removing dead SSH connection", hostname=server.hostname
                    )
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
            result = await self._execute_ssh_command(
                connection, 'echo "test_successful"'
            )
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
                "os_name": "cat /etc/os-release | grep '^NAME=' | cut -d'=' -f2 | tr -d '\"'",
                "os_version": "cat /etc/os-release | grep '^VERSION=' | cut -d'=' -f2 | tr -d '\"'",
                "kernel_version": "uname -r",
                "architecture": "uname -m",
                "cpu_cores": "nproc",
                "total_memory_mb": "grep MemTotal /proc/meminfo | awk '{print int($2/1024)}'",
                "total_disk_gb": "df -BG / | tail -1 | awk '{print int($2)}'",
            }

            system_info = {}
            for key, command in commands.items():
                try:
                    result = await self._execute_ssh_command(connection, command)
                    if result.ok:
                        value = result.stdout.strip()
                        if key in ["cpu_cores", "total_memory_mb", "total_disk_gb"]:
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
            logger.error(
                "Failed to gather system info", hostname=server.hostname, error=str(e)
            )
            raise SSHConnectionError(f"Failed to gather system info: {str(e)}")

    async def discover_services(self, server: Server) -> List[Dict[str, Any]]:
        """Discover systemd services on the server."""
        try:
            connection = await self.get_connection(server)

            # Get list of all systemd services
            command = (
                "systemctl list-units --type=service --all --no-pager --output=json"
            )
            result = await self._execute_ssh_command(connection, command)

            if not result.ok:
                logger.error(
                    "Failed to list services",
                    hostname=server.hostname,
                    stderr=result.stderr,
                )
                return []

            try:
                services_data = json.loads(result.stdout)
            except json.JSONDecodeError:
                # Fallback to parsing text output
                command = (
                    "systemctl list-units --type=service --all --no-pager --no-legend"
                )
                result = await self._execute_ssh_command(connection, command)
                services_data = self._parse_service_list_text(result.stdout)

            services = []
            for service_data in services_data:
                service_info = await self._get_service_details(
                    connection, service_data.get("unit", "")
                )
                if service_info:
                    services.append(service_info)

            return services

        except Exception as e:
            logger.error(
                "Failed to discover services", hostname=server.hostname, error=str(e)
            )
            raise SSHConnectionError(f"Failed to discover services: {str(e)}")

    def _parse_service_list_text(self, output: str) -> List[Dict[str, str]]:
        """Parse systemctl list output when JSON is not available."""
        services = []
        for line in output.strip().split("\n"):
            if ".service" in line:
                parts = line.split()
                if len(parts) >= 4:
                    services.append(
                        {
                            "unit": parts[0],
                            "load": parts[1],
                            "active": parts[2],
                            "sub": parts[3],
                            "description": (
                                " ".join(parts[4:]) if len(parts) > 4 else ""
                            ),
                        }
                    )
        return services

    async def _get_service_details(
        self, connection: Connection, service_name: str
    ) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific service."""
        if not service_name.endswith(".service"):
            return None

        try:
            # Get service status
            status_cmd = f"systemctl show {service_name} --no-pager"
            result = await self._execute_ssh_command(connection, status_cmd)

            if not result.ok:
                return None

            # Parse service properties
            properties = {}
            for line in result.stdout.strip().split("\n"):
                if "=" in line:
                    key, value = line.split("=", 1)
                    properties[key] = value

            # Map to our service model
            service_info = {
                "name": service_name,
                "description": properties.get("Description", ""),
                "status": self._map_service_status(
                    properties.get("ActiveState", "unknown")
                ),
                "state": self._map_service_state(
                    properties.get("UnitFileState", "unknown")
                ),
                "load_state": properties.get("LoadState", ""),
                "active_state": properties.get("ActiveState", ""),
                "sub_state": properties.get("SubState", ""),
                "main_pid": int(properties.get("MainPID", 0)) or None,
                "exec_start": properties.get("ExecStart", ""),
                "restart_policy": properties.get("Restart", ""),
                "unit_file_path": properties.get("FragmentPath", ""),
            }

            return service_info

        except Exception as e:
            logger.warning(
                "Failed to get service details", service=service_name, error=str(e)
            )
            return None

    def _map_service_status(self, active_state: str) -> ServiceStatus:
        """Map systemd ActiveState to our ServiceStatus enum."""
        mapping = {
            "active": ServiceStatus.ACTIVE,
            "inactive": ServiceStatus.INACTIVE,
            "failed": ServiceStatus.FAILED,
            "activating": ServiceStatus.ACTIVATING,
            "deactivating": ServiceStatus.DEACTIVATING,
        }
        return mapping.get(active_state.lower(), ServiceStatus.UNKNOWN)

    def _map_service_state(self, unit_file_state: str) -> ServiceState:
        """Map systemd UnitFileState to our ServiceState enum."""
        mapping = {
            "enabled": ServiceState.ENABLED,
            "disabled": ServiceState.DISABLED,
            "static": ServiceState.STATIC,
            "masked": ServiceState.MASKED,
        }
        return mapping.get(unit_file_state.lower(), ServiceState.UNKNOWN)

    async def control_service(
        self, server: Server, service_name: str, action: str
    ) -> Tuple[bool, str]:
        """Control a systemd service (start, stop, restart, enable, disable)."""
        valid_actions = ["start", "stop", "restart", "reload", "enable", "disable"]
        if action not in valid_actions:
            return (
                False,
                f"Invalid action: {action}. Valid actions: {', '.join(valid_actions)}",
            )

        try:
            connection = await self.get_connection(server)
            command = f"sudo systemctl {action} {service_name}"
            result = await self._execute_ssh_command(connection, command)

            if result.ok:
                logger.info(
                    "Service action completed",
                    hostname=server.hostname,
                    service=service_name,
                    action=action,
                )
                return True, f"Successfully {action}ed {service_name}"
            else:
                error_msg = (
                    result.stderr.strip() or f"Failed to {action} {service_name}"
                )
                logger.error(
                    "Service action failed",
                    hostname=server.hostname,
                    service=service_name,
                    action=action,
                    error=error_msg,
                )
                return False, error_msg

        except Exception as e:
            error_msg = f"Failed to {action} {service_name}: {str(e)}"
            logger.error(
                "Service control error",
                hostname=server.hostname,
                service=service_name,
                action=action,
                error=str(e),
            )
            return False, error_msg

    async def get_service_logs(
        self,
        server: Server,
        service_name: str,
        lines: int = 100,
        since: Optional[str] = None,
        until: Optional[str] = None,
        priority: Optional[str] = None,
        grep: Optional[str] = None,
    ) -> Tuple[bool, str]:
        """Get logs for a specific service with filtering options."""
        try:
            connection = await self.get_connection(server)

            # Build journalctl command with filters
            cmd_parts = ["sudo", "journalctl", "-u", service_name, "--no-pager"]

            # Add line limit
            cmd_parts.extend(["-n", str(lines)])

            # Add time filters
            if since:
                cmd_parts.extend(["--since", f'"{since}"'])
            if until:
                cmd_parts.extend(["--until", f'"{until}"'])

            # Add priority filter (maps to journalctl priority levels)
            if priority:
                priority_map = {
                    "debug": "7",
                    "info": "6",
                    "notice": "5",
                    "warning": "4",
                    "err": "3",
                    "crit": "2",
                    "alert": "1",
                    "emerg": "0",
                }
                if priority.lower() in priority_map:
                    cmd_parts.extend(["-p", priority_map[priority.lower()]])

            command = " ".join(cmd_parts)

            # Add grep filter if specified
            if grep:
                command += f' | grep "{grep}"'

            result = await self._execute_ssh_command(connection, command)

            if result.ok:
                return True, result.stdout
            else:
                error_msg = (
                    result.stderr.strip() or f"Failed to get logs for {service_name}"
                )
                return False, error_msg

        except Exception as e:
            error_msg = f"Failed to get logs for {service_name}: {str(e)}"
            logger.error(
                "Log retrieval error",
                hostname=server.hostname,
                service=service_name,
                error=str(e),
            )
            return False, error_msg

    def _convert_cron_to_systemd(self, cron_expression: str) -> str:
        """Convert cron expression to systemd OnCalendar format."""
        # Basic cron to systemd conversion
        # This is a simplified conversion - systemd's OnCalendar is more powerful than cron
        cron_patterns = {
            "@yearly": "yearly",
            "@annually": "yearly",
            "@monthly": "monthly",
            "@weekly": "weekly",
            "@daily": "daily",
            "@midnight": "daily",
            "@hourly": "hourly",
        }

        if cron_expression in cron_patterns:
            return cron_patterns[cron_expression]

        # For more complex cron expressions, we'll do a basic conversion
        # This is a simplified implementation - a full implementation would be more comprehensive
        parts = cron_expression.strip().split()
        if len(parts) != 5:
            raise ValueError(f"Invalid cron expression: {cron_expression}")

        minute, hour, day, month, weekday = parts

        # Convert to systemd format: weekday year-month-day hour:minute:second
        systemd_parts = []

        # Handle weekday
        if weekday != "*":
            if weekday.isdigit():
                # Convert 0-6 (Sunday=0) to Mon..Sun format
                days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                systemd_parts.append(days[int(weekday)])
            else:
                systemd_parts.append(weekday)

        # Handle year-month-day
        year = "*"
        if month == "*":
            month = "*"
        if day == "*":
            day = "*"
        systemd_parts.append(f"{year}-{month}-{day}")

        # Handle hour:minute
        if hour == "*":
            hour = "*"
        if minute == "*":
            minute = "*"
        systemd_parts.append(f"{hour}:{minute}:00")

        return " ".join(systemd_parts)

    def _generate_systemd_service_file(self, service_config: Dict[str, Any]) -> str:
        """Generate systemd service file content."""
        lines = ["[Unit]"]

        # Unit section
        if service_config.get("description"):
            lines.append(f"Description={service_config['description']}")

        if service_config.get("after_units"):
            lines.append(f"After={' '.join(service_config['after_units'])}")

        if service_config.get("before_units"):
            lines.append(f"Before={' '.join(service_config['before_units'])}")

        if service_config.get("wants_units"):
            lines.append(f"Wants={' '.join(service_config['wants_units'])}")

        if service_config.get("requires_units"):
            lines.append(f"Requires={' '.join(service_config['requires_units'])}")

        if service_config.get("conflicts_units"):
            lines.append(f"Conflicts={' '.join(service_config['conflicts_units'])}")

        lines.append("")  # Empty line
        lines.append("[Service]")

        # Service section
        systemd_type = service_config.get("systemd_type", "simple")
        lines.append(f"Type={systemd_type}")

        lines.append(f"ExecStart={service_config['exec_start']}")

        if service_config.get("exec_start_pre"):
            lines.append(f"ExecStartPre={service_config['exec_start_pre']}")

        if service_config.get("exec_start_post"):
            lines.append(f"ExecStartPost={service_config['exec_start_post']}")

        if service_config.get("exec_stop"):
            lines.append(f"ExecStop={service_config['exec_stop']}")

        if service_config.get("exec_reload"):
            lines.append(f"ExecReload={service_config['exec_reload']}")

        restart_policy = service_config.get("restart_policy", "on-failure")
        lines.append(f"Restart={restart_policy}")

        if service_config.get("restart_sec"):
            lines.append(f"RestartSec={service_config['restart_sec']}")

        if service_config.get("timeout_start_sec"):
            lines.append(f"TimeoutStartSec={service_config['timeout_start_sec']}")

        if service_config.get("timeout_stop_sec"):
            lines.append(f"TimeoutStopSec={service_config['timeout_stop_sec']}")

        if service_config.get("user"):
            lines.append(f"User={service_config['user']}")

        if service_config.get("group"):
            lines.append(f"Group={service_config['group']}")

        if service_config.get("working_directory"):
            lines.append(f"WorkingDirectory={service_config['working_directory']}")

        if service_config.get("umask"):
            lines.append(f"UMask={service_config['umask']}")

        # Environment variables
        if service_config.get("environment_variables"):
            for key, value in service_config["environment_variables"].items():
                lines.append(f"Environment={key}={value}")

        if service_config.get("environment_file"):
            lines.append(f"EnvironmentFile={service_config['environment_file']}")

        # Security settings
        if service_config.get("no_new_privileges"):
            lines.append("NoNewPrivileges=yes")

        if service_config.get("private_tmp"):
            lines.append("PrivateTmp=yes")

        if service_config.get("protect_system"):
            lines.append(f"ProtectSystem={service_config['protect_system']}")

        if service_config.get("protect_home"):
            lines.append("ProtectHome=yes")

        if service_config.get("read_only_paths"):
            for path in service_config["read_only_paths"]:
                lines.append(f"ReadOnlyPaths={path}")

        if service_config.get("inaccessible_paths"):
            for path in service_config["inaccessible_paths"]:
                lines.append(f"InaccessiblePaths={path}")

        # Logging
        standard_output = service_config.get("standard_output", "journal")
        lines.append(f"StandardOutput={standard_output}")

        standard_error = service_config.get("standard_error", "journal")
        lines.append(f"StandardError={standard_error}")

        if service_config.get("syslog_identifier"):
            lines.append(f"SyslogIdentifier={service_config['syslog_identifier']}")

        lines.append("")  # Empty line
        lines.append("[Install]")

        # Install section
        wanted_by = service_config.get("wanted_by", ["multi-user.target"])
        lines.append(f"WantedBy={' '.join(wanted_by)}")

        if service_config.get("required_by"):
            lines.append(f"RequiredBy={' '.join(service_config['required_by'])}")

        if service_config.get("also"):
            lines.append(f"Also={' '.join(service_config['also'])}")

        return "\n".join(lines) + "\n"

    def _generate_systemd_timer_file(
        self, service_name: str, timer_config: Dict[str, Any]
    ) -> str:
        """Generate systemd timer file content."""
        lines = ["[Unit]"]

        # Unit section
        lines.append(f"Description=Timer for {service_name}")
        lines.append(f"Requires={service_name}.service")

        lines.append("")  # Empty line
        lines.append("[Timer]")

        # Timer section
        if timer_config.get("on_calendar"):
            lines.append(f"OnCalendar={timer_config['on_calendar']}")
        elif timer_config.get("cron_expression"):
            # Convert cron to systemd format
            on_calendar = self._convert_cron_to_systemd(timer_config["cron_expression"])
            lines.append(f"OnCalendar={on_calendar}")

        if timer_config.get("on_boot_sec"):
            lines.append(f"OnBootSec={timer_config['on_boot_sec']}")

        if timer_config.get("on_startup_sec"):
            lines.append(f"OnStartupSec={timer_config['on_startup_sec']}")

        if timer_config.get("on_unit_active_sec"):
            lines.append(f"OnUnitActiveSec={timer_config['on_unit_active_sec']}")

        if timer_config.get("on_unit_inactive_sec"):
            lines.append(f"OnUnitInactiveSec={timer_config['on_unit_inactive_sec']}")

        if timer_config.get("accuracy_sec"):
            lines.append(f"AccuracySec={timer_config['accuracy_sec']}")

        if timer_config.get("randomized_delay_sec"):
            lines.append(f"RandomizedDelaySec={timer_config['randomized_delay_sec']}")

        if timer_config.get("persistent"):
            lines.append("Persistent=yes")

        if timer_config.get("wake_system"):
            lines.append("WakeSystem=yes")

        lines.append("")  # Empty line
        lines.append("[Install]")
        lines.append("WantedBy=timers.target")

        return "\n".join(lines) + "\n"

    async def validate_service_configuration(
        self, server: Server, service_config: Dict[str, Any]
    ) -> Tuple[bool, List[str], List[str]]:
        """Validate service configuration on the target server."""
        try:
            connection = await self.get_connection(server)
            errors = []
            warnings = []

            # Check if service name already exists
            service_name = service_config["name"]
            check_cmd = f"systemctl list-unit-files {service_name}.service"
            result = await self._execute_ssh_command(connection, check_cmd)
            if result.ok and service_name in result.stdout:
                errors.append(f"Service {service_name} already exists")

            # Check if execution path exists and is executable
            exec_start = service_config.get("exec_start", "")
            if exec_start:
                # Extract the command (first part before any arguments)
                command_parts = exec_start.strip().split()
                if command_parts:
                    command_path = command_parts[0]
                    # Check if the command exists
                    check_cmd = f"which {command_path} || test -x {command_path}"
                    result = await self._execute_ssh_command(connection, check_cmd)
                    if not result.ok:
                        errors.append(
                            f"Command not found or not executable: {command_path}"
                        )

            # Check working directory
            working_dir = service_config.get("working_directory")
            if working_dir:
                check_cmd = f"test -d {working_dir}"
                result = await self._execute_ssh_command(connection, check_cmd)
                if not result.ok:
                    warnings.append(f"Working directory does not exist: {working_dir}")

            # Check user exists
            user = service_config.get("user")
            if user:
                check_cmd = f"id {user}"
                result = await self._execute_ssh_command(connection, check_cmd)
                if not result.ok:
                    errors.append(f"User does not exist: {user}")

            # Check group exists
            group = service_config.get("group")
            if group:
                check_cmd = f"getent group {group}"
                result = await self._execute_ssh_command(connection, check_cmd)
                if not result.ok:
                    errors.append(f"Group does not exist: {group}")

            # Check dependencies exist
            for dep_type in [
                "after_units",
                "before_units",
                "wants_units",
                "requires_units",
            ]:
                dependencies = service_config.get(dep_type, [])
                for dep in dependencies:
                    check_cmd = f"systemctl list-unit-files {dep}"
                    result = await self._execute_ssh_command(connection, check_cmd)
                    if not result.ok or dep not in result.stdout:
                        warnings.append(f"Dependency unit not found: {dep}")

            return len(errors) == 0, errors, warnings

        except Exception as e:
            logger.error(
                "Failed to validate service configuration",
                hostname=server.hostname,
                error=str(e),
            )
            return False, [f"Validation failed: {str(e)}"], []

    async def create_systemd_service(
        self, server: Server, service_config: Dict[str, Any], dry_run: bool = False
    ) -> Tuple[bool, str, List[str], Dict[str, str]]:
        """Create systemd service and optionally timer files on the server."""
        try:
            connection = await self.get_connection(server)
            service_name = service_config["name"]
            created_files = []
            systemd_files = {}

            # Generate service file content
            service_file_content = self._generate_systemd_service_file(service_config)
            service_file_path = f"/etc/systemd/system/{service_name}.service"
            systemd_files[f"{service_name}.service"] = service_file_content

            # Generate timer file if needed
            timer_file_content = None
            timer_file_path = None
            if service_config.get("create_timer") and service_config.get(
                "timer_config"
            ):
                timer_file_content = self._generate_systemd_timer_file(
                    service_name, service_config["timer_config"]
                )
                timer_file_path = f"/etc/systemd/system/{service_name}.timer"
                systemd_files[f"{service_name}.timer"] = timer_file_content

            if dry_run:
                return True, "Dry run completed successfully", [], systemd_files

            # Create service file
            create_service_cmd = f"sudo tee {service_file_path} > /dev/null << 'EOF'\n{service_file_content}EOF"
            result = await self._execute_ssh_command(connection, create_service_cmd)
            if not result.ok:
                return (
                    False,
                    f"Failed to create service file: {result.stderr}",
                    [],
                    systemd_files,
                )
            created_files.append(service_file_path)

            # Create timer file if needed
            if timer_file_content:
                create_timer_cmd = f"sudo tee {timer_file_path} > /dev/null << 'EOF'\n{timer_file_content}EOF"
                result = await self._execute_ssh_command(connection, create_timer_cmd)
                if not result.ok:
                    # Clean up service file if timer creation fails
                    await self._execute_ssh_command(
                        connection, f"sudo rm -f {service_file_path}"
                    )
                    return (
                        False,
                        f"Failed to create timer file: {result.stderr}",
                        [],
                        systemd_files,
                    )
                created_files.append(timer_file_path)

            # Reload systemd daemon
            result = await self._execute_ssh_command(
                connection, "sudo systemctl daemon-reload"
            )
            if not result.ok:
                logger.warning(
                    "Failed to reload systemd daemon",
                    hostname=server.hostname,
                    error=result.stderr,
                )

            # Enable service if requested
            if service_config.get("auto_enable", True):
                if timer_file_content:
                    # For timer services, enable the timer instead of the service
                    enable_cmd = f"sudo systemctl enable {service_name}.timer"
                else:
                    enable_cmd = f"sudo systemctl enable {service_name}.service"

                result = await self._execute_ssh_command(connection, enable_cmd)
                if not result.ok:
                    logger.warning(
                        "Failed to enable service",
                        hostname=server.hostname,
                        service=service_name,
                        error=result.stderr,
                    )

            # Start service if requested
            if service_config.get("auto_start", True):
                if timer_file_content:
                    # For timer services, start the timer instead of the service
                    start_cmd = f"sudo systemctl start {service_name}.timer"
                else:
                    start_cmd = f"sudo systemctl start {service_name}.service"

                result = await self._execute_ssh_command(connection, start_cmd)
                if not result.ok:
                    logger.warning(
                        "Failed to start service",
                        hostname=server.hostname,
                        service=service_name,
                        error=result.stderr,
                    )

            logger.info(
                "Systemd service created successfully",
                hostname=server.hostname,
                service_name=service_name,
                created_files=created_files,
                has_timer=timer_file_content is not None,
            )

            return (
                True,
                f"Service {service_name} created successfully",
                created_files,
                systemd_files,
            )

        except Exception as e:
            error_msg = f"Failed to create systemd service: {str(e)}"
            logger.error(
                "Systemd service creation failed",
                hostname=server.hostname,
                service_name=service_config.get("name"),
                error=str(e),
            )
            return False, error_msg, [], {}

    async def remove_systemd_service(
        self, server: Server, service_name: str, remove_timer: bool = False
    ) -> Tuple[bool, str]:
        """Remove systemd service and optionally timer from the server."""
        try:
            connection = await self.get_connection(server)

            # Stop and disable service
            stop_cmd = f"sudo systemctl stop {service_name}.service"
            await self._execute_ssh_command(connection, stop_cmd)

            disable_cmd = f"sudo systemctl disable {service_name}.service"
            await self._execute_ssh_command(connection, disable_cmd)

            # Stop and disable timer if it exists
            if remove_timer:
                stop_timer_cmd = f"sudo systemctl stop {service_name}.timer"
                await self._execute_ssh_command(connection, stop_timer_cmd)

                disable_timer_cmd = f"sudo systemctl disable {service_name}.timer"
                await self._execute_ssh_command(connection, disable_timer_cmd)

            # Remove service file
            service_file_path = f"/etc/systemd/system/{service_name}.service"
            remove_service_cmd = f"sudo rm -f {service_file_path}"
            result = await self._execute_ssh_command(connection, remove_service_cmd)

            # Remove timer file if it exists
            if remove_timer:
                timer_file_path = f"/etc/systemd/system/{service_name}.timer"
                remove_timer_cmd = f"sudo rm -f {timer_file_path}"
                await self._execute_ssh_command(connection, remove_timer_cmd)

            # Reload systemd daemon
            await self._execute_ssh_command(connection, "sudo systemctl daemon-reload")

            logger.info(
                "Systemd service removed successfully",
                hostname=server.hostname,
                service_name=service_name,
                removed_timer=remove_timer,
            )

            return True, f"Service {service_name} removed successfully"

        except Exception as e:
            error_msg = f"Failed to remove systemd service: {str(e)}"
            logger.error(
                "Systemd service removal failed",
                hostname=server.hostname,
                service_name=service_name,
                error=str(e),
            )
            return False, error_msg

    def _generate_override_file_content(self, override_config: Dict[str, Any]) -> str:
        """Generate systemd override file content from configuration."""
        lines = []

        # Unit section overrides
        unit_fields = {
            "description": "Description",
            "after_units": "After",
            "before_units": "Before",
            "wants_units": "Wants",
            "requires_units": "Requires",
            "conflicts_units": "Conflicts",
        }

        unit_section = []
        for field, systemd_key in unit_fields.items():
            if field in override_config and override_config[field] is not None:
                if field.endswith("_units"):
                    # Handle unit lists
                    value = " ".join(override_config[field])
                else:
                    value = override_config[field]
                unit_section.append(f"{systemd_key}={value}")

        if unit_section:
            lines.append("[Unit]")
            lines.extend(unit_section)
            lines.append("")

        # Service section overrides
        service_fields = {
            "systemd_type": "Type",
            "exec_start": "ExecStart",
            "exec_stop": "ExecStop",
            "exec_reload": "ExecReload",
            "exec_start_pre": "ExecStartPre",
            "exec_start_post": "ExecStartPost",
            "restart_policy": "Restart",
            "restart_sec": "RestartSec",
            "timeout_start_sec": "TimeoutStartSec",
            "timeout_stop_sec": "TimeoutStopSec",
            "user": "User",
            "group": "Group",
            "working_directory": "WorkingDirectory",
            "umask": "UMask",
            "environment_file": "EnvironmentFile",
            "no_new_privileges": "NoNewPrivileges",
            "private_tmp": "PrivateTmp",
            "protect_system": "ProtectSystem",
            "protect_home": "ProtectHome",
            "standard_output": "StandardOutput",
            "standard_error": "StandardError",
            "syslog_identifier": "SyslogIdentifier",
        }

        service_section = []
        for field, systemd_key in service_fields.items():
            if field in override_config and override_config[field] is not None:
                value = override_config[field]
                # Handle special cases
                if field == "restart_policy" and hasattr(value, "value"):
                    value = value.value
                elif field == "systemd_type" and hasattr(value, "value"):
                    value = value.value
                elif isinstance(value, bool):
                    value = "yes" if value else "no"
                service_section.append(f"{systemd_key}={value}")

        # Handle environment variables
        if (
            "environment_variables" in override_config
            and override_config["environment_variables"]
        ):
            for key, val in override_config["environment_variables"].items():
                service_section.append(f"Environment={key}={val}")

        # Handle special security paths
        if "read_only_paths" in override_config and override_config["read_only_paths"]:
            for path in override_config["read_only_paths"]:
                service_section.append(f"ReadOnlyPaths={path}")

        if (
            "inaccessible_paths" in override_config
            and override_config["inaccessible_paths"]
        ):
            for path in override_config["inaccessible_paths"]:
                service_section.append(f"InaccessiblePaths={path}")

        if service_section:
            lines.append("[Service]")
            lines.extend(service_section)
            lines.append("")

        # Install section overrides
        install_fields = {
            "wanted_by": "WantedBy",
            "required_by": "RequiredBy",
            "also": "Also",
        }

        install_section = []
        for field, systemd_key in install_fields.items():
            if field in override_config and override_config[field] is not None:
                value = (
                    " ".join(override_config[field])
                    if isinstance(override_config[field], list)
                    else override_config[field]
                )
                install_section.append(f"{systemd_key}={value}")

        if install_section:
            lines.append("[Install]")
            lines.extend(install_section)

        return "\n".join(lines)

    async def create_service_override(
        self,
        server: Server,
        service_name: str,
        override_config: Dict[str, Any],
        create_backup: bool = True,
    ) -> Tuple[bool, str, str, Optional[str]]:
        """Create or update systemd service override file.

        Returns:
            Tuple of (success, message, override_file_path, backup_file_path)
        """
        try:
            connection = await self.get_connection(server)

            # Clean service name (remove .service extension if present)
            clean_service_name = service_name.replace(".service", "")

            # Define paths
            override_dir = f"/etc/systemd/system/{clean_service_name}.service.d"
            override_file = f"{override_dir}/override.conf"
            backup_file = None

            # Create backup if requested and override already exists
            if create_backup:
                check_existing_cmd = f"test -f {override_file}"
                result = await self._execute_ssh_command(connection, check_existing_cmd)
                if result.ok:
                    # Override file exists, create backup
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    backup_file = f"{override_file}.backup_{timestamp}"
                    backup_cmd = f"sudo cp {override_file} {backup_file}"
                    result = await self._execute_ssh_command(connection, backup_cmd)
                    if not result.ok:
                        logger.warning(
                            "Failed to create backup",
                            hostname=server.hostname,
                            service=clean_service_name,
                            error=result.stderr,
                        )

            # Create override directory if it doesn't exist
            mkdir_cmd = f"sudo mkdir -p {override_dir}"
            result = await self._execute_ssh_command(connection, mkdir_cmd)
            if not result.ok:
                return (
                    False,
                    f"Failed to create override directory: {result.stderr}",
                    override_file,
                    backup_file,
                )

            # Generate override file content
            override_content = self._generate_override_file_content(override_config)

            # Write override file
            # Use a temporary file and then move it to avoid partial writes
            temp_file = f"/tmp/override_{clean_service_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.conf"

            # Write content to temporary file
            write_cmd = f"cat > {temp_file} << 'EOF'\n{override_content}\nEOF"
            result = await self._execute_ssh_command(connection, write_cmd)
            if not result.ok:
                return (
                    False,
                    f"Failed to write temporary override file: {result.stderr}",
                    override_file,
                    backup_file,
                )

            # Move temporary file to final location
            move_cmd = f"sudo mv {temp_file} {override_file}"
            result = await self._execute_ssh_command(connection, move_cmd)
            if not result.ok:
                # Cleanup temp file
                cleanup_cmd = f"rm -f {temp_file}"
                await self._execute_ssh_command(connection, cleanup_cmd)
                return (
                    False,
                    f"Failed to move override file to final location: {result.stderr}",
                    override_file,
                    backup_file,
                )

            # Set proper permissions
            chmod_cmd = f"sudo chmod 644 {override_file}"
            result = await self._execute_ssh_command(connection, chmod_cmd)
            if not result.ok:
                logger.warning(
                    "Failed to set override file permissions",
                    hostname=server.hostname,
                    service=clean_service_name,
                    error=result.stderr,
                )

            # Reload systemd daemon to pick up changes
            reload_cmd = "sudo systemctl daemon-reload"
            result = await self._execute_ssh_command(connection, reload_cmd)
            if not result.ok:
                return (
                    False,
                    f"Failed to reload systemd daemon: {result.stderr}",
                    override_file,
                    backup_file,
                )

            logger.info(
                "Service override created successfully",
                hostname=server.hostname,
                service_name=clean_service_name,
                override_file=override_file,
                backup_file=backup_file,
            )

            return (
                True,
                "Override configuration applied successfully",
                override_file,
                backup_file,
            )

        except Exception as e:
            error_msg = f"Failed to create service override: {str(e)}"
            logger.error(
                "Service override creation failed",
                hostname=server.hostname,
                service_name=service_name,
                error=str(e),
            )
            return False, error_msg, "", None

    async def remove_service_override(
        self, server: Server, service_name: str, remove_backup: bool = False
    ) -> Tuple[bool, str]:
        """Remove systemd service override file and optionally backups.

        Returns:
            Tuple of (success, message)
        """
        try:
            connection = await self.get_connection(server)

            # Clean service name
            clean_service_name = service_name.replace(".service", "")

            # Define paths
            override_dir = f"/etc/systemd/system/{clean_service_name}.service.d"
            override_file = f"{override_dir}/override.conf"

            # Check if override file exists
            check_cmd = f"test -f {override_file}"
            result = await self._execute_ssh_command(connection, check_cmd)
            if not result.ok:
                return True, "No override configuration found to remove"

            # Remove override file
            remove_cmd = f"sudo rm -f {override_file}"
            result = await self._execute_ssh_command(connection, remove_cmd)
            if not result.ok:
                return False, f"Failed to remove override file: {result.stderr}"

            # Remove backup files if requested
            if remove_backup:
                remove_backups_cmd = f"sudo rm -f {override_file}.backup_*"
                result = await self._execute_ssh_command(connection, remove_backups_cmd)
                if not result.ok:
                    logger.warning(
                        "Failed to remove backup files",
                        hostname=server.hostname,
                        service=clean_service_name,
                        error=result.stderr,
                    )

            # Check if override directory is empty and remove it
            check_empty_cmd = (
                f'[ -d {override_dir} ] && [ -z "$(ls -A {override_dir})" ]'
            )
            result = await self._execute_ssh_command(connection, check_empty_cmd)
            if result.ok:
                # Directory exists and is empty, remove it
                rmdir_cmd = f"sudo rmdir {override_dir}"
                await self._execute_ssh_command(connection, rmdir_cmd)

            # Reload systemd daemon
            reload_cmd = "sudo systemctl daemon-reload"
            result = await self._execute_ssh_command(connection, reload_cmd)
            if not result.ok:
                return False, f"Failed to reload systemd daemon: {result.stderr}"

            logger.info(
                "Service override removed successfully",
                hostname=server.hostname,
                service_name=clean_service_name,
                removed_backups=remove_backup,
            )

            return True, "Override configuration removed successfully"

        except Exception as e:
            error_msg = f"Failed to remove service override: {str(e)}"
            logger.error(
                "Service override removal failed",
                hostname=server.hostname,
                service_name=service_name,
                error=str(e),
            )
            return False, error_msg

    async def validate_service_override(
        self, server: Server, service_name: str, override_config: Dict[str, Any]
    ) -> Tuple[bool, List[str], List[str]]:
        """Validate service override configuration.

        Returns:
            Tuple of (is_valid, errors, warnings)
        """
        errors = []
        warnings = []

        try:
            connection = await self.get_connection(server)

            # Clean service name
            clean_service_name = service_name.replace(".service", "")

            # Check if the service exists
            check_service_cmd = (
                f"systemctl list-unit-files {clean_service_name}.service"
            )
            result = await self._execute_ssh_command(connection, check_service_cmd)
            if not result.ok or clean_service_name not in result.stdout:
                errors.append(
                    f"Service {clean_service_name} does not exist on the server"
                )
                return False, errors, warnings

            # Validate user and group if specified
            if "user" in override_config and override_config["user"]:
                user_check_cmd = f"id -u {override_config['user']}"
                result = await self._execute_ssh_command(connection, user_check_cmd)
                if not result.ok:
                    errors.append(
                        f"User '{override_config['user']}' does not exist on the server"
                    )

            if "group" in override_config and override_config["group"]:
                group_check_cmd = f"getent group {override_config['group']}"
                result = await self._execute_ssh_command(connection, group_check_cmd)
                if not result.ok:
                    errors.append(
                        f"Group '{override_config['group']}' does not exist on the server"
                    )

            # Validate working directory if specified
            if (
                "working_directory" in override_config
                and override_config["working_directory"]
            ):
                dir_check_cmd = f"test -d {override_config['working_directory']}"
                result = await self._execute_ssh_command(connection, dir_check_cmd)
                if not result.ok:
                    warnings.append(
                        f"Working directory '{override_config['working_directory']}' does not exist"
                    )

            # Validate executable paths in exec commands
            exec_fields = [
                "exec_start",
                "exec_stop",
                "exec_reload",
                "exec_start_pre",
                "exec_start_post",
            ]
            for field in exec_fields:
                if field in override_config and override_config[field]:
                    # Extract the executable (first word) from the command
                    command = override_config[field].strip()
                    if command:
                        executable = command.split()[0]
                        # Check if it's an absolute path
                        if executable.startswith("/"):
                            exec_check_cmd = f"test -x {executable}"
                            result = await self._execute_ssh_command(
                                connection, exec_check_cmd
                            )
                            if not result.ok:
                                warnings.append(
                                    f"Executable '{executable}' in {field} does not exist or is not executable"
                                )

            # Validate paths in security settings
            if (
                "read_only_paths" in override_config
                and override_config["read_only_paths"]
            ):
                for path in override_config["read_only_paths"]:
                    path_check_cmd = f"test -e {path}"
                    result = await self._execute_ssh_command(connection, path_check_cmd)
                    if not result.ok:
                        warnings.append(f"Read-only path '{path}' does not exist")

            if (
                "inaccessible_paths" in override_config
                and override_config["inaccessible_paths"]
            ):
                for path in override_config["inaccessible_paths"]:
                    path_check_cmd = f"test -e {path}"
                    result = await self._execute_ssh_command(connection, path_check_cmd)
                    if not result.ok:
                        warnings.append(f"Inaccessible path '{path}' does not exist")

            # Validate environment file if specified
            if (
                "environment_file" in override_config
                and override_config["environment_file"]
            ):
                env_file_check_cmd = f"test -f {override_config['environment_file']}"
                result = await self._execute_ssh_command(connection, env_file_check_cmd)
                if not result.ok:
                    warnings.append(
                        f"Environment file '{override_config['environment_file']}' does not exist"
                    )

            # Validate unit dependencies
            dependency_fields = [
                "after_units",
                "before_units",
                "wants_units",
                "requires_units",
            ]
            for field in dependency_fields:
                if field in override_config and override_config[field]:
                    for unit in override_config[field]:
                        unit_check_cmd = f"systemctl list-unit-files {unit}"
                        result = await self._execute_ssh_command(
                            connection, unit_check_cmd
                        )
                        if not result.ok:
                            warnings.append(
                                f"Dependency unit '{unit}' in {field} may not exist"
                            )

            is_valid = len(errors) == 0

            logger.info(
                "Service override validation completed",
                hostname=server.hostname,
                service_name=clean_service_name,
                is_valid=is_valid,
                error_count=len(errors),
                warning_count=len(warnings),
            )

            return is_valid, errors, warnings

        except Exception as e:
            error_msg = f"Validation failed: {str(e)}"
            logger.error(
                "Service override validation failed",
                hostname=server.hostname,
                service_name=service_name,
                error=str(e),
            )
            return False, [error_msg], warnings

    async def get_service_override_content(
        self, server: Server, service_name: str
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """Get current override file content for a service.

        Returns:
            Tuple of (success, override_content, override_file_path)
        """
        try:
            connection = await self.get_connection(server)

            # Clean service name
            clean_service_name = service_name.replace(".service", "")

            # Define override file path
            override_file = (
                f"/etc/systemd/system/{clean_service_name}.service.d/override.conf"
            )

            # Check if override file exists and read content
            read_cmd = f"sudo cat {override_file}"
            result = await self._execute_ssh_command(connection, read_cmd)

            if result.ok:
                return True, result.stdout, override_file
            else:
                # File doesn't exist or can't be read
                return True, None, override_file

        except Exception as e:
            logger.error(
                "Failed to read service override content",
                hostname=server.hostname,
                service_name=service_name,
                error=str(e),
            )
            return False, None, None


# Global SSH manager instance
ssh_manager = SSHConnectionManager()
