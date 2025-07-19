/**
 * TypeScript type definitions for the application
 */

// Server types
export enum ServerStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error',
}

export interface Server {
  id: number;
  hostname: string;
  display_name?: string;
  description?: string;
  ip_address: string;
  ssh_port: number;
  ssh_username: string;
  status: ServerStatus;
  is_enabled: boolean;
  auto_discover_services: boolean;

  // System information
  os_name?: string;
  os_version?: string;
  kernel_version?: string;
  architecture?: string;
  cpu_cores?: number;
  total_memory_mb?: number;
  total_disk_gb?: number;

  // Connection settings
  connection_timeout: number;
  connection_retries: number;

  // Metadata
  tags?: Record<string, string>;
  extra_data?: Record<string, any>;

  // Audit fields
  created_at: string;
  updated_at: string;
  last_seen?: string;
  last_check?: string;

  // Computed fields
  is_online: boolean;
  uptime_percentage?: number;
  response_time_ms?: number;
}

export interface ServerCreateRequest {
  hostname: string;
  display_name?: string;
  description?: string;
  ip_address: string;
  ssh_port?: number;
  ssh_username: string;
  ssh_password?: string;
  ssh_key_path?: string;
  ssh_key_passphrase?: string;
  connection_timeout?: number;
  connection_retries?: number;
  is_enabled?: boolean;
  auto_discover_services?: boolean;
  tags?: Record<string, string>;
  extra_data?: Record<string, any>;
}

export interface ServerListResponse {
  servers: Server[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ServerConnectionTestResponse {
  success: boolean;
  message: string;
  response_time_ms?: number;
  timestamp: string;
}

export interface ServerStatsResponse {
  total_servers: number;
  online_servers: number;
  offline_servers: number;
  error_servers: number;
  servers_by_status: Record<string, number>;
}

// Service types
export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FAILED = 'failed',
  ACTIVATING = 'activating',
  DEACTIVATING = 'deactivating',
}

export enum ServiceState {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  STATIC = 'static',
  MASKED = 'masked',
}

export enum ServiceType {
  SYSTEMD = 'systemd',
  DOCKER = 'docker',
  CUSTOM = 'custom',
}

export interface Service {
  id: number;
  server_id: number;
  name: string;
  display_name?: string;
  description?: string;

  // Service type and configuration
  service_type: ServiceType;
  unit_file_path?: string;

  // Status information
  status: ServiceStatus;
  state: ServiceState;

  // Process information
  main_pid?: number;
  load_state?: string;
  active_state?: string;
  sub_state?: string;

  // Service configuration
  exec_start?: string;
  exec_reload?: string;
  exec_stop?: string;
  restart_policy?: string;

  // Dependencies and relationships
  dependencies?: string[];
  dependents?: string[];
  conflicts?: string[];

  // Timers and scheduling
  is_timer: boolean;
  timer_schedule?: string;
  next_activation?: string;
  last_activation?: string;

  // Resource usage
  cpu_usage_percent?: number;
  memory_usage_mb?: number;
  memory_limit_mb?: number;

  // Runtime information
  started_at?: string;
  active_duration_seconds?: number;

  // Monitoring and management
  last_status_check?: string;
  status_check_error?: string;
  auto_restart: boolean;

  // Service metadata
  environment_variables?: Record<string, string>;
  service_config?: Record<string, any>;
  override_config?: Record<string, any>;

  // Management settings
  is_managed: boolean;
  is_monitored: boolean;

  // Additional metadata
  tags?: Record<string, string>;
  extra_data?: Record<string, any>;

  // Audit fields
  created_at: string;
  updated_at: string;

  // Computed fields
  is_active: boolean;
  is_failed: boolean;
  is_enabled: boolean;
  unique_name: string;

  // Server information
  server_hostname: string;
}

export interface ServiceListResponse {
  services: Service[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  server_id?: number;
  status_filter?: string;
  search_query?: string;
}

export interface ServiceControlRequest {
  action: 'start' | 'stop' | 'restart' | 'reload' | 'enable' | 'disable';
}

export interface ServiceControlResponse {
  success: boolean;
  message: string;
  service_name: string;
  action: string;
  timestamp: string;
}

export interface ServiceLogsResponse {
  success: boolean;
  logs: string;
  service_name: string;
  lines_returned: number;
  timestamp: string;
}

export interface ServiceDiscoveryResponse {
  success: boolean;
  services_discovered: number;
  services_updated: number;
  services_removed: number;
  error_message?: string;
  timestamp: string;
}

export interface ServiceStatsResponse {
  total_services: number;
  active_services: number;
  inactive_services: number;
  failed_services: number;
  services_by_status: Record<string, number>;
  services_by_server: Record<string, number>;
  timer_services: number;
}

// API Error types
export interface ApiError {
  detail: string;
  status_code: number;
}

// Common pagination params
export interface PaginationParams {
  page?: number;
  per_page?: number;
}

// Common filter params
export interface ServerFilterParams extends PaginationParams {
  search?: string;
  status?: ServerStatus;
  enabled_only?: boolean;
}

export interface ServiceFilterParams extends PaginationParams {
  server_id?: number;
  search?: string;
  status_filter?: ServiceStatus;
  service_type?: ServiceType;
  enabled_only?: boolean;
}
