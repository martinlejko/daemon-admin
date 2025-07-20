/**
 * Service Detail page - view and manage individual service
 */

import { chakra } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  FiActivity,
  FiArrowLeft,
  FiClock,
  FiCpu,
  FiEdit3,
  FiFileText,
  FiPause,
  FiPlay,
  FiRefreshCw,
  FiRotateCcw,
  FiServer,
  FiSettings,
} from 'react-icons/fi';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { useControlService, useService, useServiceLogs } from '@/hooks/useApi';
import { useUIStore } from '@/store';
import { formatMemoryMB, formatRelativeTime } from '@/utils';

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPageTitle, setBreadcrumbs, addNotification } = useUIStore();
  const [showLogs, setShowLogs] = useState(false);
  const [logFilters, setLogFilters] = useState({
    lines: 100,
    since: '',
    until: '',
    priority: '',
    grep: '',
  });

  const serviceId = Number.parseInt(id || '0', 10);
  const { data: service, isLoading, error, refetch } = useService(serviceId);
  const controlServiceMutation = useControlService();
  const serviceLogsMutation = useServiceLogs();

  useEffect(() => {
    if (service) {
      setPageTitle(service.display_name || service.name);
      setBreadcrumbs([
        { label: 'Dashboard', href: '/' },
        { label: 'Services', href: '/services' },
        { label: service.display_name || service.name },
      ]);
    }
  }, [service, setPageTitle, setBreadcrumbs]);

  const handleServiceControl = async (action: 'start' | 'stop' | 'restart') => {
    if (!service) return;

    try {
      const result = await controlServiceMutation.mutateAsync({
        serviceId: service.id,
        action,
      });

      addNotification({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });

      if (result.success) {
        refetch();
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to ${action} service: ${error}`,
      });
    }
  };

  const handleViewLogs = async () => {
    if (!service) return;

    try {
      setShowLogs(true);
      await serviceLogsMutation.mutateAsync({
        serviceId: service.id,
        lines: logFilters.lines,
        since: logFilters.since || undefined,
        until: logFilters.until || undefined,
        priority: logFilters.priority || undefined,
        grep: logFilters.grep || undefined,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to retrieve logs: ${error}`,
      });
    }
  };

  const getStatusType = (
    status: string
  ): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'failed':
        return 'error';
      case 'inactive':
        return 'neutral';
      case 'activating':
      case 'deactivating':
        return 'warning';
      default:
        return 'info';
    }
  };

  if (isLoading) {
    return (
      <chakra.div bg="bg.subtle" minH="100vh" p="8">
        <chakra.div maxW="6xl" mx="auto">
          <LoadingSpinner fullPage message="Loading service details..." />
        </chakra.div>
      </chakra.div>
    );
  }

  if (error || !service) {
    return (
      <chakra.div bg="bg.subtle" minH="100vh" p="8">
        <chakra.div maxW="6xl" mx="auto">
          <Card>
            <chakra.div py="8" textAlign="center">
              <FiActivity color="var(--chakra-colors-text-muted)" size={48} />
              <chakra.h3
                color="text"
                fontSize="lg"
                fontWeight="semibold"
                mb="2"
                mt="4"
              >
                Service not found
              </chakra.h3>
              <chakra.p color="text.subtle" mb="6">
                The service you're looking for doesn't exist or has been
                removed.
              </chakra.p>
              <Link to="/services">
                <Button leftIcon={<FiArrowLeft />}>Back to Services</Button>
              </Link>
            </chakra.div>
          </Card>
        </chakra.div>
      </chakra.div>
    );
  }

  return (
    <chakra.div bg="bg.subtle" minH="100vh" p="8">
      <chakra.div maxW="6xl" mx="auto">
        <PageHeader
          actions={
            <chakra.div display="flex" gap="3">
              <Button
                leftIcon={<FiRefreshCw />}
                loading={isLoading}
                onClick={() => refetch()}
                variant="secondary"
              >
                Refresh
              </Button>

              {service.is_managed && (
                <>
                  <Link to={`/services/${service.id}/edit`}>
                    <Button leftIcon={<FiEdit3 />} variant="secondary">
                      Edit
                    </Button>
                  </Link>

                  {service.is_active ? (
                    <Button
                      leftIcon={<FiPause />}
                      loading={controlServiceMutation.isPending}
                      onClick={() => handleServiceControl('stop')}
                      variant="danger"
                    >
                      Stop
                    </Button>
                  ) : (
                    <Button
                      leftIcon={<FiPlay />}
                      loading={controlServiceMutation.isPending}
                      onClick={() => handleServiceControl('start')}
                      variant="primary"
                    >
                      Start
                    </Button>
                  )}

                  <Button
                    leftIcon={<FiRotateCcw />}
                    loading={controlServiceMutation.isPending}
                    onClick={() => handleServiceControl('restart')}
                    variant="secondary"
                  >
                    Restart
                  </Button>
                </>
              )}

              <Link to="/services">
                <Button leftIcon={<FiArrowLeft />} variant="ghost">
                  Back to Services
                </Button>
              </Link>
            </chakra.div>
          }
          subtitle={`${service.service_type} service on ${service.server_hostname}`}
          title={service.display_name || service.name}
        />

        <chakra.div display="flex" flexDirection="column" gap="8">
          {/* Service Overview */}
          <chakra.div
            display="grid"
            gap="6"
            gridTemplateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
          >
            {/* Status Card */}
            <Card>
              <chakra.div
                alignItems="center"
                display="flex"
                justifyContent="space-between"
                mb="4"
              >
                <chakra.h3 color="text" fontSize="lg" fontWeight="semibold">
                  Service Status
                </chakra.h3>
                <FiActivity color="var(--chakra-colors-accent)" size={20} />
              </chakra.div>

              <chakra.div display="flex" flexDirection="column" gap="4">
                <chakra.div
                  alignItems="center"
                  display="flex"
                  justifyContent="space-between"
                >
                  <chakra.span color="text.subtle" fontSize="sm">
                    Status
                  </chakra.span>
                  <StatusBadge size="md" status={getStatusType(service.status)}>
                    {service.status}
                  </StatusBadge>
                </chakra.div>

                <chakra.div
                  alignItems="center"
                  display="flex"
                  justifyContent="space-between"
                >
                  <chakra.span color="text.subtle" fontSize="sm">
                    State
                  </chakra.span>
                  <chakra.span color="text" fontSize="sm" fontWeight="medium">
                    {service.state}
                  </chakra.span>
                </chakra.div>

                {service.main_pid && (
                  <chakra.div
                    alignItems="center"
                    display="flex"
                    justifyContent="space-between"
                  >
                    <chakra.span color="text.subtle" fontSize="sm">
                      Process ID
                    </chakra.span>
                    <chakra.span color="text" fontSize="sm" fontWeight="medium">
                      {service.main_pid}
                    </chakra.span>
                  </chakra.div>
                )}

                {service.last_status_check && (
                  <chakra.div
                    alignItems="center"
                    display="flex"
                    justifyContent="space-between"
                  >
                    <chakra.span color="text.subtle" fontSize="sm">
                      Last Check
                    </chakra.span>
                    <chakra.span color="text" fontSize="sm">
                      {formatRelativeTime(service.last_status_check)}
                    </chakra.span>
                  </chakra.div>
                )}
              </chakra.div>
            </Card>

            {/* Resource Usage */}
            <Card>
              <chakra.div
                alignItems="center"
                display="flex"
                justifyContent="space-between"
                mb="4"
              >
                <chakra.h3 color="text" fontSize="lg" fontWeight="semibold">
                  Resource Usage
                </chakra.h3>
                <FiCpu color="var(--chakra-colors-accent)" size={20} />
              </chakra.div>

              <chakra.div display="flex" flexDirection="column" gap="4">
                {service.cpu_usage_percent !== null &&
                  service.cpu_usage_percent !== undefined && (
                    <chakra.div
                      alignItems="center"
                      display="flex"
                      justifyContent="space-between"
                    >
                      <chakra.span color="text.subtle" fontSize="sm">
                        CPU Usage
                      </chakra.span>
                      <chakra.span
                        color="text"
                        fontSize="sm"
                        fontWeight="medium"
                      >
                        {service.cpu_usage_percent.toFixed(1)}%
                      </chakra.span>
                    </chakra.div>
                  )}

                {service.memory_usage_mb && (
                  <chakra.div
                    alignItems="center"
                    display="flex"
                    justifyContent="space-between"
                  >
                    <chakra.span color="text.subtle" fontSize="sm">
                      Memory Usage
                    </chakra.span>
                    <chakra.span color="text" fontSize="sm" fontWeight="medium">
                      {formatMemoryMB(service.memory_usage_mb)}
                    </chakra.span>
                  </chakra.div>
                )}

                {service.memory_limit_mb && (
                  <chakra.div
                    alignItems="center"
                    display="flex"
                    justifyContent="space-between"
                  >
                    <chakra.span color="text.subtle" fontSize="sm">
                      Memory Limit
                    </chakra.span>
                    <chakra.span color="text" fontSize="sm">
                      {formatMemoryMB(service.memory_limit_mb)}
                    </chakra.span>
                  </chakra.div>
                )}

                {service.started_at && (
                  <chakra.div
                    alignItems="center"
                    display="flex"
                    justifyContent="space-between"
                  >
                    <chakra.span color="text.subtle" fontSize="sm">
                      Started
                    </chakra.span>
                    <chakra.span color="text" fontSize="sm">
                      {formatRelativeTime(service.started_at)}
                    </chakra.span>
                  </chakra.div>
                )}
              </chakra.div>
            </Card>
          </chakra.div>

          {/* Service Configuration */}
          <Card>
            <chakra.div
              alignItems="center"
              display="flex"
              justifyContent="space-between"
              mb="6"
            >
              <chakra.h3 color="text" fontSize="lg" fontWeight="semibold">
                Configuration
              </chakra.h3>
              <FiSettings color="var(--chakra-colors-accent)" size={20} />
            </chakra.div>

            <chakra.div
              display="grid"
              gap="6"
              gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
            >
              <chakra.div>
                <chakra.h4
                  color="text"
                  fontSize="md"
                  fontWeight="semibold"
                  mb="3"
                >
                  Basic Information
                </chakra.h4>
                <chakra.div display="flex" flexDirection="column" gap="3">
                  <chakra.div>
                    <chakra.span
                      color="text.subtle"
                      display="block"
                      fontSize="sm"
                    >
                      Service Name
                    </chakra.span>
                    <chakra.span color="text" fontFamily="mono" fontSize="sm">
                      {service.name}
                    </chakra.span>
                  </chakra.div>

                  {service.description && (
                    <chakra.div>
                      <chakra.span
                        color="text.subtle"
                        display="block"
                        fontSize="sm"
                      >
                        Description
                      </chakra.span>
                      <chakra.span color="text" fontSize="sm">
                        {service.description}
                      </chakra.span>
                    </chakra.div>
                  )}

                  {service.unit_file_path && (
                    <chakra.div>
                      <chakra.span
                        color="text.subtle"
                        display="block"
                        fontSize="sm"
                      >
                        Unit File
                      </chakra.span>
                      <chakra.span color="text" fontFamily="mono" fontSize="sm">
                        {service.unit_file_path}
                      </chakra.span>
                    </chakra.div>
                  )}
                </chakra.div>
              </chakra.div>

              <chakra.div>
                <chakra.h4
                  color="text"
                  fontSize="md"
                  fontWeight="semibold"
                  mb="3"
                >
                  Execution
                </chakra.h4>
                <chakra.div display="flex" flexDirection="column" gap="3">
                  {service.exec_start && (
                    <chakra.div>
                      <chakra.span
                        color="text.subtle"
                        display="block"
                        fontSize="sm"
                      >
                        Start Command
                      </chakra.span>
                      <chakra.span color="text" fontFamily="mono" fontSize="sm">
                        {service.exec_start}
                      </chakra.span>
                    </chakra.div>
                  )}

                  {service.restart_policy && (
                    <chakra.div>
                      <chakra.span
                        color="text.subtle"
                        display="block"
                        fontSize="sm"
                      >
                        Restart Policy
                      </chakra.span>
                      <chakra.span color="text" fontSize="sm">
                        {service.restart_policy}
                      </chakra.span>
                    </chakra.div>
                  )}

                  <chakra.div>
                    <chakra.span
                      color="text.subtle"
                      display="block"
                      fontSize="sm"
                    >
                      Management
                    </chakra.span>
                    <chakra.div display="flex" gap="2" mt="1">
                      {service.is_managed && (
                        <StatusBadge status="success">Managed</StatusBadge>
                      )}
                      {service.is_monitored && (
                        <StatusBadge status="info">Monitored</StatusBadge>
                      )}
                      {service.auto_restart && (
                        <StatusBadge status="warning">Auto-restart</StatusBadge>
                      )}
                    </chakra.div>
                  </chakra.div>
                </chakra.div>
              </chakra.div>
            </chakra.div>
          </Card>

          {/* Logs Section */}
          <Card>
            <chakra.div
              alignItems="center"
              display="flex"
              justifyContent="space-between"
              mb="4"
            >
              <chakra.h3 color="text" fontSize="lg" fontWeight="semibold">
                Service Logs
              </chakra.h3>
              <Button
                leftIcon={<FiFileText />}
                loading={serviceLogsMutation.isPending}
                onClick={handleViewLogs}
                variant="secondary"
              >
                View Logs
              </Button>
            </chakra.div>

            {/* Log Filters */}
            <chakra.div bg="bg.muted" borderRadius="md" mb="4" p="4">
              <chakra.h4
                color="text"
                fontSize="sm"
                fontWeight="semibold"
                mb="3"
              >
                Log Filters
              </chakra.h4>
              <chakra.div
                display="grid"
                gap="3"
                gridTemplateColumns={{
                  base: '1fr',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                }}
              >
                <chakra.div>
                  <chakra.label
                    color="text.subtle"
                    display="block"
                    fontSize="xs"
                    fontWeight="medium"
                    mb="1"
                  >
                    Lines
                  </chakra.label>
                  <chakra.input
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    borderRadius="md"
                    fontSize="sm"
                    onChange={(e) =>
                      setLogFilters((prev) => ({
                        ...prev,
                        lines: Number.parseInt(e.target.value) || 100,
                      }))
                    }
                    p="2"
                    type="number"
                    value={logFilters.lines}
                    width="100%"
                  />
                </chakra.div>

                <chakra.div>
                  <chakra.label
                    color="text.subtle"
                    display="block"
                    fontSize="xs"
                    fontWeight="medium"
                    mb="1"
                  >
                    Priority Level
                  </chakra.label>
                  <chakra.select
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    borderRadius="md"
                    fontSize="sm"
                    onChange={(e) =>
                      setLogFilters((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    p="2"
                    value={logFilters.priority}
                    width="100%"
                  >
                    <option value="">All levels</option>
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="notice">Notice</option>
                    <option value="warning">Warning</option>
                    <option value="err">Error</option>
                    <option value="crit">Critical</option>
                    <option value="alert">Alert</option>
                    <option value="emerg">Emergency</option>
                  </chakra.select>
                </chakra.div>

                <chakra.div>
                  <chakra.label
                    color="text.subtle"
                    display="block"
                    fontSize="xs"
                    fontWeight="medium"
                    mb="1"
                  >
                    Search Text
                  </chakra.label>
                  <chakra.input
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    borderRadius="md"
                    fontSize="sm"
                    onChange={(e) =>
                      setLogFilters((prev) => ({
                        ...prev,
                        grep: e.target.value,
                      }))
                    }
                    p="2"
                    placeholder="Filter by text..."
                    value={logFilters.grep}
                    width="100%"
                  />
                </chakra.div>

                <chakra.div>
                  <chakra.label
                    color="text.subtle"
                    display="block"
                    fontSize="xs"
                    fontWeight="medium"
                    mb="1"
                  >
                    Since
                  </chakra.label>
                  <chakra.input
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    borderRadius="md"
                    fontSize="sm"
                    onChange={(e) =>
                      setLogFilters((prev) => ({
                        ...prev,
                        since: e.target.value,
                      }))
                    }
                    p="2"
                    placeholder="1 hour ago, today..."
                    value={logFilters.since}
                    width="100%"
                  />
                </chakra.div>

                <chakra.div>
                  <chakra.label
                    color="text.subtle"
                    display="block"
                    fontSize="xs"
                    fontWeight="medium"
                    mb="1"
                  >
                    Until
                  </chakra.label>
                  <chakra.input
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    borderRadius="md"
                    fontSize="sm"
                    onChange={(e) =>
                      setLogFilters((prev) => ({
                        ...prev,
                        until: e.target.value,
                      }))
                    }
                    p="2"
                    placeholder="2025-01-01 12:00..."
                    value={logFilters.until}
                    width="100%"
                  />
                </chakra.div>
              </chakra.div>
            </chakra.div>

            {serviceLogsMutation.data ? (
              <chakra.div>
                <chakra.div
                  alignItems="center"
                  display="flex"
                  gap="2"
                  justifyContent="space-between"
                  mb="2"
                >
                  <chakra.p color="text.subtle" fontSize="sm">
                    {serviceLogsMutation.data.lines_returned} lines returned
                  </chakra.p>
                  <chakra.p color="text.subtle" fontSize="xs">
                    Retrieved at{' '}
                    {new Date(
                      serviceLogsMutation.data.timestamp
                    ).toLocaleString()}
                  </chakra.p>
                </chakra.div>
                <chakra.div
                  bg="bg.subtle"
                  border="1px solid"
                  borderColor="border"
                  borderRadius="lg"
                  maxH="400px"
                  overflow="auto"
                  p="4"
                >
                  <chakra.pre
                    color="text"
                    fontFamily="mono"
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                    wordBreak="break-all"
                  >
                    {serviceLogsMutation.data.logs}
                  </chakra.pre>
                </chakra.div>
              </chakra.div>
            ) : (
              <chakra.div color="text.subtle" py="8" textAlign="center">
                <FiFileText size={32} style={{ margin: '0 auto 16px' }} />
                <chakra.p fontSize="sm">
                  Configure filters above and click "View Logs" to display log
                  entries
                </chakra.p>
              </chakra.div>
            )}
          </Card>
        </chakra.div>
      </chakra.div>
    </chakra.div>
  );
};

export default ServiceDetail;
