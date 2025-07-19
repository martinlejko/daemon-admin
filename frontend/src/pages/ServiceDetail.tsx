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
  FiFileText,
  FiPause,
  FiPlay,
  FiRefreshCw,
  FiRotateCcw,
  FiServer,
  FiSettings,
} from 'react-icons/fi';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useService,
  useControlService,
  useServiceLogs,
} from '@/hooks/useApi';
import { useUIStore } from '@/store';
import Button from '@/components/UI/Button';
import Card from '@/components/UI/Card';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import PageHeader from '@/components/UI/PageHeader';
import StatusBadge from '@/components/UI/StatusBadge';
import { formatRelativeTime, formatMemoryMB } from '@/utils';

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPageTitle, setBreadcrumbs, addNotification } = useUIStore();
  const [showLogs, setShowLogs] = useState(false);

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
        lines: 100,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to retrieve logs: ${error}`,
      });
    }
  };

  const getStatusType = (status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
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
      <chakra.div p="8" bg="bg.subtle" minH="100vh">
        <chakra.div maxW="6xl" mx="auto">
          <LoadingSpinner fullPage message="Loading service details..." />
        </chakra.div>
      </chakra.div>
    );
  }

  if (error || !service) {
    return (
      <chakra.div p="8" bg="bg.subtle" minH="100vh">
        <chakra.div maxW="6xl" mx="auto">
          <Card>
            <chakra.div textAlign="center" py="8">
              <FiActivity size={48} color="var(--chakra-colors-text-muted)" />
              <chakra.h3 fontSize="lg" fontWeight="semibold" mb="2" color="text" mt="4">
                Service not found
              </chakra.h3>
              <chakra.p color="text.subtle" mb="6">
                The service you're looking for doesn't exist or has been removed.
              </chakra.p>
              <Link to="/services">
                <Button leftIcon={<FiArrowLeft />}>
                  Back to Services
                </Button>
              </Link>
            </chakra.div>
          </Card>
        </chakra.div>
      </chakra.div>
    );
  }

  return (
    <chakra.div p="8" bg="bg.subtle" minH="100vh">
      <chakra.div maxW="6xl" mx="auto">
        <PageHeader
          title={service.display_name || service.name}
          subtitle={`${service.service_type} service on ${service.server_hostname}`}
          actions={
            <chakra.div display="flex" gap="3">
              <Button
                variant="secondary"
                leftIcon={<FiRefreshCw />}
                onClick={() => refetch()}
                loading={isLoading}
              >
                Refresh
              </Button>
              
              {service.is_managed && (
                <>
                  {!service.is_active ? (
                    <Button
                      variant="primary"
                      leftIcon={<FiPlay />}
                      onClick={() => handleServiceControl('start')}
                      loading={controlServiceMutation.isPending}
                    >
                      Start
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      leftIcon={<FiPause />}
                      onClick={() => handleServiceControl('stop')}
                      loading={controlServiceMutation.isPending}
                    >
                      Stop
                    </Button>
                  )}
                  
                  <Button
                    variant="secondary"
                    leftIcon={<FiRotateCcw />}
                    onClick={() => handleServiceControl('restart')}
                    loading={controlServiceMutation.isPending}
                  >
                    Restart
                  </Button>
                </>
              )}

              <Link to="/services">
                <Button variant="ghost" leftIcon={<FiArrowLeft />}>
                  Back to Services
                </Button>
              </Link>
            </chakra.div>
          }
        />

        <chakra.div display="flex" flexDirection="column" gap="8">
          {/* Service Overview */}
          <chakra.div display="grid" gridTemplateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap="6">
            {/* Status Card */}
            <Card>
              <chakra.div display="flex" alignItems="center" justifyContent="space-between" mb="4">
                <chakra.h3 fontSize="lg" fontWeight="semibold" color="text">
                  Service Status
                </chakra.h3>
                <FiActivity color="var(--chakra-colors-accent)" size={20} />
              </chakra.div>
              
              <chakra.div display="flex" flexDirection="column" gap="4">
                <chakra.div display="flex" alignItems="center" justifyContent="space-between">
                  <chakra.span color="text.subtle" fontSize="sm">Status</chakra.span>
                  <StatusBadge status={getStatusType(service.status)} size="md">
                    {service.status}
                  </StatusBadge>
                </chakra.div>
                
                <chakra.div display="flex" alignItems="center" justifyContent="space-between">
                  <chakra.span color="text.subtle" fontSize="sm">State</chakra.span>
                  <chakra.span color="text" fontSize="sm" fontWeight="medium">
                    {service.state}
                  </chakra.span>
                </chakra.div>

                {service.main_pid && (
                  <chakra.div display="flex" alignItems="center" justifyContent="space-between">
                    <chakra.span color="text.subtle" fontSize="sm">Process ID</chakra.span>
                    <chakra.span color="text" fontSize="sm" fontWeight="medium">
                      {service.main_pid}
                    </chakra.span>
                  </chakra.div>
                )}

                {service.last_status_check && (
                  <chakra.div display="flex" alignItems="center" justifyContent="space-between">
                    <chakra.span color="text.subtle" fontSize="sm">Last Check</chakra.span>
                    <chakra.span color="text" fontSize="sm">
                      {formatRelativeTime(service.last_status_check)}
                    </chakra.span>
                  </chakra.div>
                )}
              </chakra.div>
            </Card>

            {/* Resource Usage */}
            <Card>
              <chakra.div display="flex" alignItems="center" justifyContent="space-between" mb="4">
                <chakra.h3 fontSize="lg" fontWeight="semibold" color="text">
                  Resource Usage
                </chakra.h3>
                <FiCpu color="var(--chakra-colors-accent)" size={20} />
              </chakra.div>
              
              <chakra.div display="flex" flexDirection="column" gap="4">
                {service.cpu_usage_percent !== null && service.cpu_usage_percent !== undefined && (
                  <chakra.div display="flex" alignItems="center" justifyContent="space-between">
                    <chakra.span color="text.subtle" fontSize="sm">CPU Usage</chakra.span>
                    <chakra.span color="text" fontSize="sm" fontWeight="medium">
                      {service.cpu_usage_percent.toFixed(1)}%
                    </chakra.span>
                  </chakra.div>
                )}

                {service.memory_usage_mb && (
                  <chakra.div display="flex" alignItems="center" justifyContent="space-between">
                    <chakra.span color="text.subtle" fontSize="sm">Memory Usage</chakra.span>
                    <chakra.span color="text" fontSize="sm" fontWeight="medium">
                      {formatMemoryMB(service.memory_usage_mb)}
                    </chakra.span>
                  </chakra.div>
                )}

                {service.memory_limit_mb && (
                  <chakra.div display="flex" alignItems="center" justifyContent="space-between">
                    <chakra.span color="text.subtle" fontSize="sm">Memory Limit</chakra.span>
                    <chakra.span color="text" fontSize="sm">
                      {formatMemoryMB(service.memory_limit_mb)}
                    </chakra.span>
                  </chakra.div>
                )}

                {service.started_at && (
                  <chakra.div display="flex" alignItems="center" justifyContent="space-between">
                    <chakra.span color="text.subtle" fontSize="sm">Started</chakra.span>
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
            <chakra.div display="flex" alignItems="center" justifyContent="space-between" mb="6">
              <chakra.h3 fontSize="lg" fontWeight="semibold" color="text">
                Configuration
              </chakra.h3>
              <FiSettings color="var(--chakra-colors-accent)" size={20} />
            </chakra.div>
            
            <chakra.div display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="6">
              <chakra.div>
                <chakra.h4 fontSize="md" fontWeight="semibold" mb="3" color="text">
                  Basic Information
                </chakra.h4>
                <chakra.div display="flex" flexDirection="column" gap="3">
                  <chakra.div>
                    <chakra.span color="text.subtle" fontSize="sm" display="block">
                      Service Name
                    </chakra.span>
                    <chakra.span color="text" fontSize="sm" fontFamily="mono">
                      {service.name}
                    </chakra.span>
                  </chakra.div>
                  
                  {service.description && (
                    <chakra.div>
                      <chakra.span color="text.subtle" fontSize="sm" display="block">
                        Description
                      </chakra.span>
                      <chakra.span color="text" fontSize="sm">
                        {service.description}
                      </chakra.span>
                    </chakra.div>
                  )}

                  {service.unit_file_path && (
                    <chakra.div>
                      <chakra.span color="text.subtle" fontSize="sm" display="block">
                        Unit File
                      </chakra.span>
                      <chakra.span color="text" fontSize="sm" fontFamily="mono">
                        {service.unit_file_path}
                      </chakra.span>
                    </chakra.div>
                  )}
                </chakra.div>
              </chakra.div>

              <chakra.div>
                <chakra.h4 fontSize="md" fontWeight="semibold" mb="3" color="text">
                  Execution
                </chakra.h4>
                <chakra.div display="flex" flexDirection="column" gap="3">
                  {service.exec_start && (
                    <chakra.div>
                      <chakra.span color="text.subtle" fontSize="sm" display="block">
                        Start Command
                      </chakra.span>
                      <chakra.span color="text" fontSize="sm" fontFamily="mono">
                        {service.exec_start}
                      </chakra.span>
                    </chakra.div>
                  )}

                  {service.restart_policy && (
                    <chakra.div>
                      <chakra.span color="text.subtle" fontSize="sm" display="block">
                        Restart Policy
                      </chakra.span>
                      <chakra.span color="text" fontSize="sm">
                        {service.restart_policy}
                      </chakra.span>
                    </chakra.div>
                  )}

                  <chakra.div>
                    <chakra.span color="text.subtle" fontSize="sm" display="block">
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
            <chakra.div display="flex" alignItems="center" justifyContent="space-between" mb="6">
              <chakra.h3 fontSize="lg" fontWeight="semibold" color="text">
                Service Logs
              </chakra.h3>
              <Button
                variant="secondary"
                leftIcon={<FiFileText />}
                onClick={handleViewLogs}
                loading={serviceLogsMutation.isPending}
              >
                View Logs
              </Button>
            </chakra.div>

            {serviceLogsMutation.data ? (
              <chakra.div
                bg="bg.subtle"
                borderRadius="lg"
                border="1px solid"
                borderColor="border"
                p="4"
                maxH="400px"
                overflow="auto"
              >
                <chakra.pre
                  fontSize="sm"
                  fontFamily="mono"
                  color="text"
                  whiteSpace="pre-wrap"
                  wordBreak="break-all"
                >
                  {serviceLogsMutation.data.logs}
                </chakra.pre>
              </chakra.div>
            ) : (
              <chakra.div textAlign="center" py="8" color="text.subtle">
                <FiFileText size={32} style={{ margin: '0 auto 16px' }} />
                <chakra.p fontSize="sm">
                  Click "View Logs" to display recent log entries
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