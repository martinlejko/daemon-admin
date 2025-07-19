/**
 * Server detail page - view and manage individual server
 */

import { useEffect, useState } from 'react';
import { chakra } from '@chakra-ui/react';
import {
  FiServer,
  FiWifi,
  FiWifiOff,
  FiAlertCircle,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
  FiActivity,
  FiCpu,
  FiHardDrive,
  FiMonitor,
  FiTerminal,
  FiSettings,
} from 'react-icons/fi';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUIStore } from '@/store';
import { 
  useServer, 
  useDeleteServer, 
  useTestServerConnection, 
  useGatherServerInfo,
  useServices 
} from '@/hooks/useApi';
import { ServerStatus } from '@/types';
import { 
  formatRelativeTime, 
  getServerStatusColor, 
  formatMemoryMB, 
  formatDiskGB 
} from '@/utils';

const ServerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPageTitle, setBreadcrumbs, addNotification } = useUIStore();
  
  const serverId = parseInt(id || '0', 10);
  
  const {
    data: server,
    isLoading,
    error,
    refetch,
  } = useServer(serverId);

  const {
    data: servicesData,
    isLoading: isLoadingServices,
  } = useServices({ server_id: serverId, per_page: 5 });

  const deleteServerMutation = useDeleteServer();
  const testConnectionMutation = useTestServerConnection();
  const gatherInfoMutation = useGatherServerInfo();

  useEffect(() => {
    if (server) {
      setPageTitle(server.display_name || server.hostname);
      setBreadcrumbs([
        { label: 'Dashboard', href: '/' },
        { label: 'Servers', href: '/servers' },
        { label: server.display_name || server.hostname },
      ]);
    }
  }, [server, setPageTitle, setBreadcrumbs]);

  const handleDeleteServer = async () => {
    if (!server) return;
    
    if (window.confirm(`Are you sure you want to delete server "${server.hostname}"? This action cannot be undone.`)) {
      try {
        await deleteServerMutation.mutateAsync(server.id);
        addNotification({
          type: 'success',
          message: `Server "${server.hostname}" deleted successfully`,
        });
        navigate('/servers');
      } catch (error) {
        addNotification({
          type: 'error',
          message: `Failed to delete server: ${error}`,
        });
      }
    }
  };

  const handleTestConnection = async () => {
    if (!server) return;
    
    try {
      const result = await testConnectionMutation.mutateAsync(server.id);
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
        message: `Connection test failed: ${error}`,
      });
    }
  };

  const handleGatherInfo = async () => {
    if (!server) return;
    
    try {
      await gatherInfoMutation.mutateAsync(server.id);
      addNotification({
        type: 'success',
        message: 'System information updated successfully',
      });
      refetch();
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to gather system info: ${error}`,
      });
    }
  };

  const getStatusIcon = (status: ServerStatus) => {
    switch (status) {
      case ServerStatus.ONLINE:
        return <FiWifi color="var(--chakra-colors-green-500)" size={20} />;
      case ServerStatus.OFFLINE:
        return <FiWifiOff color="var(--chakra-colors-gray-500)" size={20} />;
      case ServerStatus.ERROR:
        return <FiAlertCircle color="var(--chakra-colors-red-500)" size={20} />;
      default:
        return <FiWifiOff color="var(--chakra-colors-gray-500)" size={20} />;
    }
  };

  if (isLoading) {
    return (
      <chakra.div p="6">
        <chakra.div display="flex" flexDirection="column" alignItems="center" gap="4" py="8">
          <chakra.div
            w="8"
            h="8"
            border="2px solid"
            borderColor="gray.200"
            borderTopColor="blue.500"
            borderRadius="full"
            animation="spin 1s linear infinite"
          />
          <chakra.p color="gray.600" _dark={{ color: 'gray.400' }}>
            Loading server details...
          </chakra.p>
        </chakra.div>
      </chakra.div>
    );
  }

  if (error || !server) {
    return (
      <chakra.div p="6">
        <chakra.div
          bg="red.50"
          _dark={{ bg: 'red.900', borderColor: 'red.700' }}
          border="1px solid"
          borderColor="red.200"
          borderRadius="md"
          p="6"
          textAlign="center"
        >
          <FiAlertCircle size={48} color="var(--chakra-colors-red-500)" style={{ margin: '0 auto 16px' }} />
          <chakra.h3 fontSize="lg" fontWeight="semibold" color="red.800" _dark={{ color: 'red.200' }} mb="2">
            Server not found
          </chakra.h3>
          <chakra.p color="red.700" _dark={{ color: 'red.300' }} mb="4">
            {error?.message || 'The requested server could not be found.'}
          </chakra.p>
          <Link to="/servers">
            <chakra.button
              bg="blue.500"
              color="white"
              px="4"
              py="2"
              borderRadius="md"
              _hover={{ bg: 'blue.600' }}
            >
              Back to Servers
            </chakra.button>
          </Link>
        </chakra.div>
      </chakra.div>
    );
  }

  return (
    <chakra.div p="6">
      <chakra.div display="flex" flexDirection="column" gap="6" alignItems="stretch">
        {/* Header */}
        <chakra.div display="flex" justifyContent="space-between" alignItems="flex-start">
          <chakra.div display="flex" alignItems="center" gap="4">
            {getStatusIcon(server.status)}
            <chakra.div>
              <chakra.h1 fontSize="2xl" fontWeight="bold" color="gray.900" _dark={{ color: 'white' }}>
                {server.display_name || server.hostname}
              </chakra.h1>
              <chakra.p color="gray.600" _dark={{ color: 'gray.400' }}>
                {server.ip_address} • {server.hostname}
              </chakra.p>
              {server.description && (
                <chakra.p color="gray.500" _dark={{ color: 'gray.500' }} fontSize="sm" mt="1">
                  {server.description}
                </chakra.p>
              )}
            </chakra.div>
            <chakra.span
              bg={`${getServerStatusColor(server.status)}.100`}
              color={`${getServerStatusColor(server.status)}.800`}
              _dark={{
                bg: `${getServerStatusColor(server.status)}.900`,
                color: `${getServerStatusColor(server.status)}.200`,
              }}
              fontSize="sm"
              px="3"
              py="1"
              borderRadius="full"
              textTransform="capitalize"
              fontWeight="medium"
            >
              {server.status}
            </chakra.span>
          </chakra.div>

          <chakra.div display="flex" gap="2">
            <chakra.button
              onClick={handleTestConnection}
              isLoading={testConnectionMutation.isPending}
              borderWidth="1px"
              borderColor="gray.300"
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              px="4"
              py="2"
              borderRadius="md"
              display="flex"
              alignItems="center"
              gap="2"
              fontSize="sm"
            >
              <FiWifi />
              Test Connection
            </chakra.button>

            <chakra.button
              onClick={handleGatherInfo}
              isLoading={gatherInfoMutation.isPending}
              borderWidth="1px"
              borderColor="gray.300"
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              px="4"
              py="2"
              borderRadius="md"
              display="flex"
              alignItems="center"
              gap="2"
              fontSize="sm"
            >
              <FiRefreshCw />
              Gather Info
            </chakra.button>

            <Link to={`/servers/${server.id}/edit`}>
              <chakra.button
                bg="blue.500"
                color="white"
                px="4"
                py="2"
                borderRadius="md"
                _hover={{ bg: 'blue.600' }}
                display="flex"
                alignItems="center"
                gap="2"
                fontSize="sm"
              >
                <FiEdit2 />
                Edit
              </chakra.button>
            </Link>

            <chakra.button
              onClick={handleDeleteServer}
              isLoading={deleteServerMutation.isPending}
              bg="red.500"
              color="white"
              px="4"
              py="2"
              borderRadius="md"
              _hover={{ bg: 'red.600' }}
              display="flex"
              alignItems="center"
              gap="2"
              fontSize="sm"
            >
              <FiTrash2 />
              Delete
            </chakra.button>
          </chakra.div>
        </chakra.div>

        {/* Stats Grid */}
        <chakra.div
          display="grid"
          gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
          gap="6"
        >
          {/* Connection Info */}
          <chakra.div
            bg="white"
            _dark={{ bg: 'gray.900' }}
            borderRadius="lg"
            boxShadow="sm"
            p="6"
          >
            <chakra.div display="flex" justifyContent="space-between" alignItems="flex-start" mb="3">
              <chakra.h3 fontSize="sm" fontWeight="medium" color="gray.600" _dark={{ color: 'gray.400' }}>
                Connection
              </chakra.h3>
              <FiWifi color="var(--chakra-colors-blue-500)" />
            </chakra.div>
            <chakra.div>
              <chakra.p fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} mb="1">
                SSH Port: {server.ssh_port}
              </chakra.p>
              <chakra.p fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} mb="1">
                Username: {server.ssh_username}
              </chakra.p>
              {server.last_seen && (
                <chakra.p fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                  Last seen: {formatRelativeTime(server.last_seen)}
                </chakra.p>
              )}
            </chakra.div>
          </chakra.div>

          {/* System Info */}
          <chakra.div
            bg="white"
            _dark={{ bg: 'gray.900' }}
            borderRadius="lg"
            boxShadow="sm"
            p="6"
          >
            <chakra.div display="flex" justifyContent="space-between" alignItems="flex-start" mb="3">
              <chakra.h3 fontSize="sm" fontWeight="medium" color="gray.600" _dark={{ color: 'gray.400' }}>
                System
              </chakra.h3>
              <FiMonitor color="var(--chakra-colors-green-500)" />
            </chakra.div>
            <chakra.div>
              {server.os_name ? (
                <>
                  <chakra.p fontSize="sm" color="gray.900" _dark={{ color: 'white' }} fontWeight="medium" mb="1">
                    {server.os_name} {server.os_version}
                  </chakra.p>
                  <chakra.p fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} mb="1">
                    {server.architecture}
                  </chakra.p>
                  {server.kernel_version && (
                    <chakra.p fontSize="xs" color="gray.500">
                      Kernel: {server.kernel_version}
                    </chakra.p>
                  )}
                </>
              ) : (
                <chakra.p fontSize="sm" color="gray.500">
                  No system info available
                </chakra.p>
              )}
            </chakra.div>
          </chakra.div>

          {/* CPU & Memory */}
          <chakra.div
            bg="white"
            _dark={{ bg: 'gray.900' }}
            borderRadius="lg"
            boxShadow="sm"
            p="6"
          >
            <chakra.div display="flex" justifyContent="space-between" alignItems="flex-start" mb="3">
              <chakra.h3 fontSize="sm" fontWeight="medium" color="gray.600" _dark={{ color: 'gray.400' }}>
                Resources
              </chakra.h3>
              <FiCpu color="var(--chakra-colors-purple-500)" />
            </chakra.div>
            <chakra.div>
              {server.cpu_cores ? (
                <>
                  <chakra.p fontSize="sm" color="gray.900" _dark={{ color: 'white' }} fontWeight="medium" mb="1">
                    {server.cpu_cores} CPU cores
                  </chakra.p>
                  {server.total_memory_mb && (
                    <chakra.p fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                      {formatMemoryMB(server.total_memory_mb)} RAM
                    </chakra.p>
                  )}
                </>
              ) : (
                <chakra.p fontSize="sm" color="gray.500">
                  No resource info available
                </chakra.p>
              )}
            </chakra.div>
          </chakra.div>

          {/* Storage */}
          <chakra.div
            bg="white"
            _dark={{ bg: 'gray.900' }}
            borderRadius="lg"
            boxShadow="sm"
            p="6"
          >
            <chakra.div display="flex" justifyContent="space-between" alignItems="flex-start" mb="3">
              <chakra.h3 fontSize="sm" fontWeight="medium" color="gray.600" _dark={{ color: 'gray.400' }}>
                Storage
              </chakra.h3>
              <FiHardDrive color="var(--chakra-colors-orange-500)" />
            </chakra.div>
            <chakra.div>
              {server.total_disk_gb ? (
                <chakra.p fontSize="sm" color="gray.900" _dark={{ color: 'white' }} fontWeight="medium">
                  {formatDiskGB(server.total_disk_gb)} total
                </chakra.p>
              ) : (
                <chakra.p fontSize="sm" color="gray.500">
                  No storage info available
                </chakra.p>
              )}
            </chakra.div>
          </chakra.div>
        </chakra.div>

        {/* Services Section */}
        <chakra.div
          bg="white"
          _dark={{ bg: 'gray.900' }}
          borderRadius="lg"
          boxShadow="sm"
          p="6"
        >
          <chakra.div display="flex" justifyContent="space-between" alignItems="center" mb="4">
            <chakra.h2 fontSize="lg" fontWeight="semibold" display="flex" alignItems="center" gap="2">
              <FiActivity />
              Services
            </chakra.h2>
            <Link to={`/services?server_id=${server.id}`}>
              <chakra.button
                color="blue.500"
                _hover={{ color: 'blue.600' }}
                fontSize="sm"
              >
                View all services →
              </chakra.button>
            </Link>
          </chakra.div>

          {isLoadingServices ? (
            <chakra.div display="flex" justifyContent="center" py="8">
              <chakra.div
                w="6"
                h="6"
                border="2px solid"
                borderColor="gray.200"
                borderTopColor="blue.500"
                borderRadius="full"
                animation="spin 1s linear infinite"
              />
            </chakra.div>
          ) : servicesData && servicesData.services.length > 0 ? (
            <chakra.div display="flex" flexDirection="column" gap="2">
              {servicesData.services.slice(0, 5).map((service) => (
                <chakra.div
                  key={service.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  p="3"
                  borderWidth="1px"
                  borderColor="gray.200"
                  _dark={{ borderColor: 'gray.700' }}
                  borderRadius="md"
                  _hover={{ bg: 'gray.50', _dark: { bg: 'gray.800' } }}
                >
                  <chakra.div display="flex" alignItems="center" gap="3">
                    <chakra.div
                      w="2"
                      h="2"
                      borderRadius="full"
                      bg={service.is_active ? 'green.500' : service.is_failed ? 'red.500' : 'gray.400'}
                    />
                    <chakra.div>
                      <chakra.h4 fontSize="sm" fontWeight="medium">
                        {service.display_name || service.name}
                      </chakra.h4>
                      {service.description && (
                        <chakra.p fontSize="xs" color="gray.500">
                          {service.description}
                        </chakra.p>
                      )}
                    </chakra.div>
                  </chakra.div>
                  <chakra.span
                    fontSize="xs"
                    px="2"
                    py="1"
                    borderRadius="full"
                    bg={service.is_active ? 'green.100' : service.is_failed ? 'red.100' : 'gray.100'}
                    color={service.is_active ? 'green.800' : service.is_failed ? 'red.800' : 'gray.800'}
                    _dark={{
                      bg: service.is_active ? 'green.900' : service.is_failed ? 'red.900' : 'gray.700',
                      color: service.is_active ? 'green.200' : service.is_failed ? 'red.200' : 'gray.200',
                    }}
                  >
                    {service.status}
                  </chakra.span>
                </chakra.div>
              ))}
              {servicesData.total > 5 && (
                <chakra.p fontSize="sm" color="gray.500" textAlign="center" mt="2">
                  And {servicesData.total - 5} more services...
                </chakra.p>
              )}
            </chakra.div>
          ) : (
            <chakra.div textAlign="center" py="8">
              <FiActivity size={32} color="var(--chakra-colors-gray-400)" style={{ margin: '0 auto 12px' }} />
              <chakra.p color="gray.500" fontSize="sm">
                No services found on this server
              </chakra.p>
            </chakra.div>
          )}
        </chakra.div>

        {/* Quick Actions */}
        <chakra.div
          bg="white"
          _dark={{ bg: 'gray.900' }}
          borderRadius="lg"
          boxShadow="sm"
          p="6"
        >
          <chakra.h2 fontSize="lg" fontWeight="semibold" mb="4">
            Quick Actions
          </chakra.h2>
          
          <chakra.div
            display="grid"
            gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
            gap="4"
          >
            <Link to={`/services?server_id=${server.id}`}>
              <chakra.button
                borderWidth="1px"
                borderColor="gray.200"
                _dark={{ borderColor: 'gray.700' }}
                _hover={{ borderColor: 'blue.300', bg: 'blue.50', _dark: { bg: 'blue.900' } }}
                h="16"
                borderRadius="md"
                p="4"
                display="flex"
                alignItems="center"
                justifyContent="flex-start"
                gap="3"
                width="100%"
              >
                <FiActivity size={20} />
                <chakra.div display="flex" flexDirection="column" alignItems="flex-start">
                  <chakra.p fontWeight="medium">Manage Services</chakra.p>
                  <chakra.p fontSize="sm" color="gray.500">
                    View and control systemd services
                  </chakra.p>
                </chakra.div>
              </chakra.button>
            </Link>

            <chakra.button
              borderWidth="1px"
              borderColor="gray.200"
              _dark={{ borderColor: 'gray.700' }}
              _hover={{ borderColor: 'blue.300', bg: 'blue.50', _dark: { bg: 'blue.900' } }}
              h="16"
              borderRadius="md"
              p="4"
              display="flex"
              alignItems="center"
              justifyContent="flex-start"
              gap="3"
              width="100%"
              disabled
              opacity="0.5"
            >
              <FiTerminal size={20} />
              <chakra.div display="flex" flexDirection="column" alignItems="flex-start">
                <chakra.p fontWeight="medium">SSH Terminal</chakra.p>
                <chakra.p fontSize="sm" color="gray.500">
                  Connect via web terminal (coming soon)
                </chakra.p>
              </chakra.div>
            </chakra.button>

            <Link to={`/servers/${server.id}/edit`}>
              <chakra.button
                borderWidth="1px"
                borderColor="gray.200"
                _dark={{ borderColor: 'gray.700' }}
                _hover={{ borderColor: 'blue.300', bg: 'blue.50', _dark: { bg: 'blue.900' } }}
                h="16"
                borderRadius="md"
                p="4"
                display="flex"
                alignItems="center"
                justifyContent="flex-start"
                gap="3"
                width="100%"
              >
                <FiSettings size={20} />
                <chakra.div display="flex" flexDirection="column" alignItems="flex-start">
                  <chakra.p fontWeight="medium">Server Settings</chakra.p>
                  <chakra.p fontSize="sm" color="gray.500">
                    Configure connection and options
                  </chakra.p>
                </chakra.div>
              </chakra.button>
            </Link>
          </chakra.div>
        </chakra.div>
      </chakra.div>
    </chakra.div>
  );
};

export default ServerDetail;