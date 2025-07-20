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

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  NOTICE = 'notice',
  WARNING = 'warning',
  ERR = 'err',
  CRIT = 'crit',
  ALERT = 'alert',
  EMERG = 'emerg',
}

export interface ServiceLogsRequest {
  lines?: number;
  since?: string;
  until?: string;
  priority?: LogLevel;
  grep?: string;
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

// Enhanced service creation types
export enum SystemdServiceType {
  SIMPLE = 'simple',
  FORKING = 'forking',
  ONESHOT = 'oneshot',
  NOTIFY = 'notify',
  IDLE = 'idle',
}

export enum RestartPolicy {
  NO = 'no',
  ON_SUCCESS = 'on-success',
  ON_FAILURE = 'on-failure',
  ON_ABNORMAL = 'on-abnormal',
  ON_WATCHDOG = 'on-watchdog',
  ON_ABORT = 'on-abort',
  ALWAYS = 'always',
}

export interface TimerConfiguration {
  on_calendar?: string;
  on_boot_sec?: string;
  on_startup_sec?: string;
  on_unit_active_sec?: string;
  on_unit_inactive_sec?: string;
  accuracy_sec?: string;
  randomized_delay_sec?: string;
  persistent?: boolean;
  wake_system?: boolean;
  cron_expression?: string;
}

export interface EnhancedServiceCreateRequest {
  // Basic service information
  name: string;
  display_name?: string;
  description?: string;

  // Systemd service configuration
  systemd_type?: SystemdServiceType;
  exec_start: string;
  exec_stop?: string;
  exec_reload?: string;
  exec_start_pre?: string;
  exec_start_post?: string;

  // Service behavior
  restart_policy?: RestartPolicy;
  restart_sec?: number;
  timeout_start_sec?: number;
  timeout_stop_sec?: number;

  // Process configuration
  user?: string;
  group?: string;
  working_directory?: string;
  umask?: string;

  // Environment and configuration
  environment_variables?: Record<string, string>;
  environment_file?: string;

  // Dependencies
  after_units?: string[];
  before_units?: string[];
  wants_units?: string[];
  requires_units?: string[];
  conflicts_units?: string[];

  // Security and sandboxing
  no_new_privileges?: boolean;
  private_tmp?: boolean;
  protect_system?: string;
  protect_home?: boolean;
  read_only_paths?: string[];
  inaccessible_paths?: string[];

  // Logging
  standard_output?: string;
  standard_error?: string;
  syslog_identifier?: string;

  // Timer configuration
  timer_config?: TimerConfiguration;
  create_timer?: boolean;

  // Install section
  wanted_by?: string[];
  required_by?: string[];
  also?: string[];

  // Management settings
  auto_start?: boolean;
  auto_enable?: boolean;
  auto_restart?: boolean;
  is_managed?: boolean;
  is_monitored?: boolean;

  // Additional metadata
  tags?: Record<string, string>;
  extra_data?: Record<string, any>;
}

export interface ServiceDeployRequest {
  server_id: number;
  service_config: EnhancedServiceCreateRequest;
  dry_run?: boolean;
}

export interface ServiceDeployResponse {
  success: boolean;
  message: string;
  service_id?: number;
  service_name: string;
  server_hostname: string;
  created_files: string[];
  actions_performed: string[];
  timestamp: string;
  validation_errors?: string[];
  systemd_files_preview?: Record<string, string>;
}

export interface ServiceValidationRequest {
  server_id: number;
  service_config: EnhancedServiceCreateRequest;
}

export interface ServiceValidationResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  execution_path_exists?: boolean;
  working_directory_exists?: boolean;
  user_exists?: boolean;
  group_exists?: boolean;
  dependency_status?: Record<string, boolean>;
  timestamp: string;
}

export interface ServiceTemplate {
  template_name: string;
  description: string;
  service_config: EnhancedServiceCreateRequest;
  required_parameters: string[];
  optional_parameters: string[];
}

// Service creation form step types
export interface ServiceFormStep {
  id: string;
  title: string;
  description: string;
  component: string;
  isValid: boolean;
  isOptional?: boolean;
}

export interface ServiceFormData {
  basicInfo: {
    name: string;
    display_name: string;
    description: string;
    server_id: number;
  };
  serviceType: {
    systemd_type: SystemdServiceType;
    exec_start: string;
    exec_stop?: string;
    exec_reload?: string;
    restart_policy: RestartPolicy;
  };
  execution: {
    user?: string;
    group?: string;
    working_directory?: string;
    environment_variables: Record<string, string>;
  };
  timer?: TimerConfiguration;
  advanced: {
    dependencies: {
      after_units: string[];
      wants_units: string[];
      requires_units: string[];
    };
    security: {
      no_new_privileges?: boolean;
      private_tmp?: boolean;
      protect_system?: string;
      protect_home?: boolean;
    };
    logging: {
      standard_output: string;
      standard_error: string;
      syslog_identifier?: string;
    };
  };
  management: {
    auto_start: boolean;
    auto_enable: boolean;
    auto_restart: boolean;
    is_managed: boolean;
    is_monitored: boolean;
  };
}

// Service editing types
export interface ServiceOverrideConfig {
  // Unit section overrides
  description?: string;
  after_units?: string[];
  before_units?: string[];
  wants_units?: string[];
  requires_units?: string[];
  conflicts_units?: string[];

  // Service section overrides
  systemd_type?: SystemdServiceType;
  exec_start?: string;
  exec_stop?: string;
  exec_reload?: string;
  exec_start_pre?: string;
  exec_start_post?: string;

  // Process and behavior overrides
  restart_policy?: RestartPolicy;
  restart_sec?: number;
  timeout_start_sec?: number;
  timeout_stop_sec?: number;

  // Process configuration overrides
  user?: string;
  group?: string;
  working_directory?: string;
  umask?: string;

  // Environment overrides
  environment_variables?: Record<string, string>;
  environment_file?: string;

  // Security and sandboxing overrides
  no_new_privileges?: boolean;
  private_tmp?: boolean;
  protect_system?: string;
  protect_home?: boolean;
  read_only_paths?: string[];
  inaccessible_paths?: string[];

  // Logging overrides
  standard_output?: string;
  standard_error?: string;
  syslog_identifier?: string;

  // Install section overrides
  wanted_by?: string[];
  required_by?: string[];
  also?: string[];
}

export interface ServiceUpdateRequest {
  // Basic information updates
  display_name?: string;
  description?: string;

  // Override configuration for systemd services
  override_config?: ServiceOverrideConfig;

  // Timer configuration updates (for timer-based services)
  timer_config?: TimerConfiguration;

  // Management settings
  auto_restart?: boolean;
  is_managed?: boolean;
  is_monitored?: boolean;

  // Additional metadata
  tags?: Record<string, string>;
  extra_data?: Record<string, any>;

  // Update mode and options
  apply_immediately?: boolean;
  validate_only?: boolean;
  create_backup?: boolean;
}

export interface ServiceUpdateResponse {
  success: boolean;
  message: string;
  service_id: number;
  service_name: string;
  server_hostname: string;

  // Update details
  changes_applied: string[];
  override_file_path?: string;
  backup_file_path?: string;

  // Validation results (if validate_only=True)
  validation_errors?: string[];
  validation_warnings?: string[];

  // Configuration preview
  override_content_preview?: string;
  systemd_reload_required?: boolean;
  service_restart_required?: boolean;

  timestamp: string;
}

export interface ServiceRollbackRequest {
  rollback_to_backup?: boolean;
  backup_file_path?: string;
  remove_override?: boolean;
  restart_service?: boolean;
}

// Service edit form data structure
export interface ServiceEditFormData {
  basicInfo: {
    display_name: string;
    description: string;
  };
  overrideConfig: ServiceOverrideConfig;
  timerConfig?: TimerConfiguration;
  management: {
    auto_restart: boolean;
    is_managed: boolean;
    is_monitored: boolean;
  };
  metadata: {
    tags: Record<string, string>;
    extra_data: Record<string, any>;
  };
  options: {
    apply_immediately: boolean;
    validate_only: boolean;
    create_backup: boolean;
  };
}

// Service edit form step types
export interface ServiceEditFormStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  isValid: boolean;
  isOptional?: boolean;
  hasChanges?: boolean;
}

// Service edit validation result
export interface ServiceEditValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  hasChanges: boolean;
  affectedFields: string[];
}

// Service edit mode types
export type ServiceEditMode = 'edit' | 'preview' | 'rollback';

// Service edit context type
export interface ServiceEditContext {
  service: Service;
  originalConfig: ServiceOverrideConfig | null;
  currentConfig: ServiceOverrideConfig;
  mode: ServiceEditMode;
  isModified: boolean;
  validationResult: ServiceEditValidationResult | null;
  isSubmitting: boolean;
  error: string | null;
}
