/**
 * Server detail page - view and manage individual server
 */

import { chakra } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  FiActivity,
  FiAlertCircle,
  FiCpu,
  FiEdit2,
  FiHardDrive,
  FiMonitor,
  FiRefreshCw,
  FiServer,
  FiSettings,
  FiTerminal,
  FiTrash2,
  FiWifi,
  FiWifiOff,
} from 'react-icons/fi';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useDeleteServer,
  useGatherServerInfo,
  useServer,
  useServices,
  useTestServerConnection,
} from '@/hooks/useApi';
import { useUIStore } from '@/store';
import { ServerStatus } from '@/types';
import {
  formatDiskGB,
  formatMemoryMB,
  formatRelativeTime,
  getServerStatusColor,
} from '@/utils';

const ServerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPageTitle, setBreadcrumbs, addNotification } = useUIStore();

  const serverId = Number.parseInt(id || '0', 10);

  const { data: server, isLoading, error, refetch } = useServer(serverId);

  const { data: servicesData, isLoading: isLoadingServices } = useServices({
    server_id: serverId,
    per_page: 5,
  });

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

    if (
      window.confirm(
        `Are you sure you want to delete server "${server.hostname}"? This action cannot be undone.`
      )
    ) {
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
        <chakra.div
          alignItems="center"
          display="flex"
          flexDirection="column"
          gap="4"
          py="8"
        >
          <chakra.div
            animation="spin 1s linear infinite"
            border="2px solid"
            borderColor="gray.200"
            borderRadius="full"
            borderTopColor="blue.500"
            h="8"
            w="8"
          />
          <chakra.p _dark={{ color: 'gray.400' }} color="gray.600">
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
          _dark={{ bg: 'red.900', borderColor: 'red.700' }}
          bg="red.50"
          border="1px solid"
          borderColor="red.200"
          borderRadius="md"
          p="6"
          textAlign="center"
        >
          <FiAlertCircle
            color="var(--chakra-colors-red-500)"
            size={48}
            style={{ margin: '0 auto 16px' }}
          />
          <chakra.h3
            _dark={{ color: 'red.200' }}
            color="red.800"
            fontSize="lg"
            fontWeight="semibold"
            mb="2"
          >
            Server not found
          </chakra.h3>
          <chakra.p _dark={{ color: 'red.300' }} color="red.700" mb="4">
            {error?.message || 'The requested server could not be found.'}
          </chakra.p>
          <Link to="/servers">
            <chakra.button
              _hover={{ bg: 'blue.600' }}
              bg="blue.500"
              borderRadius="md"
              color="white"
              px="4"
              py="2"
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
      <chakra.div
        alignItems="stretch"
        display="flex"
        flexDirection="column"
        gap="6"
      >
        {/* Header */}
        <chakra.div
          alignItems="flex-start"
          display="flex"
          justifyContent="space-between"
        >
          <chakra.div alignItems="center" display="flex" gap="4">
            {getStatusIcon(server.status)}
            <chakra.div>
              <chakra.h1
                _dark={{ color: 'white' }}
                color="gray.900"
                fontSize="2xl"
                fontWeight="bold"
              >
                {server.display_name || server.hostname}
              </chakra.h1>
              <chakra.p _dark={{ color: 'gray.400' }} color="gray.600">
                {server.hostname}
              </chakra.p>
              {server.description && (
                <chakra.p
                  _dark={{ color: 'gray.500' }}
                  color="gray.500"
                  fontSize="sm"
                  mt="1"
                >
                  {server.description}
                </chakra.p>
              )}
            </chakra.div>
            <chakra.span
              _dark={{
                bg: `${getServerStatusColor(server.status)}.900`,
                color: `${getServerStatusColor(server.status)}.200`,
              }}
              bg={`${getServerStatusColor(server.status)}.100`}
              borderRadius="full"
              color={`${getServerStatusColor(server.status)}.800`}
              fontSize="sm"
              fontWeight="medium"
              px="3"
              py="1"
              textTransform="capitalize"
            >
              {server.status}
            </chakra.span>
          </chakra.div>

          <chakra.div display="flex" gap="2">
            <chakra.button
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              alignItems="center"
              borderColor="gray.300"
              borderRadius="md"
              borderWidth="1px"
              disabled={testConnectionMutation.isPending}
              display="flex"
              fontSize="sm"
              gap="2"
              onClick={handleTestConnection}
              px="4"
              py="2"
            >
              <FiWifi />
              Test Connection
            </chakra.button>

            <chakra.button
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              alignItems="center"
              borderColor="gray.300"
              borderRadius="md"
              borderWidth="1px"
              disabled={gatherInfoMutation.isPending}
              display="flex"
              fontSize="sm"
              gap="2"
              onClick={handleGatherInfo}
              px="4"
              py="2"
            >
              <FiRefreshCw />
              Gather Info
            </chakra.button>

            <Link to={`/servers/${server.id}/edit`}>
              <chakra.button
                _hover={{ bg: 'blue.600' }}
                alignItems="center"
                bg="blue.500"
                borderRadius="md"
                color="white"
                display="flex"
                fontSize="sm"
                gap="2"
                px="4"
                py="2"
              >
                <FiEdit2 />
                Edit
              </chakra.button>
            </Link>

            <chakra.button
              _hover={{ bg: 'red.600' }}
              alignItems="center"
              bg="red.500"
              borderRadius="md"
              color="white"
              disabled={deleteServerMutation.isPending}
              display="flex"
              fontSize="sm"
              gap="2"
              onClick={handleDeleteServer}
              px="4"
              py="2"
            >
              <FiTrash2 />
              Delete
            </chakra.button>
          </chakra.div>
        </chakra.div>

        {/* Stats Grid */}
        <chakra.div
          display="grid"
          gap="6"
          gridTemplateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          }}
        >
          {/* Connection Info */}
          <chakra.div
            _dark={{ bg: 'gray.900' }}
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            p="6"
          >
            <chakra.div
              alignItems="flex-start"
              display="flex"
              justifyContent="space-between"
              mb="3"
            >
              <chakra.h3
                _dark={{ color: 'gray.400' }}
                color="gray.600"
                fontSize="sm"
                fontWeight="medium"
              >
                Connection
              </chakra.h3>
              <FiWifi color="var(--chakra-colors-blue-500)" />
            </chakra.div>
            <chakra.div>
              <chakra.p
                _dark={{ color: 'gray.400' }}
                color="gray.600"
                fontSize="sm"
                mb="1"
              >
                SSH Port: {server.ssh_port}
              </chakra.p>
              <chakra.p
                _dark={{ color: 'gray.400' }}
                color="gray.600"
                fontSize="sm"
                mb="1"
              >
                Username: {server.ssh_username}
              </chakra.p>
              {server.last_seen && (
                <chakra.p
                  _dark={{ color: 'gray.400' }}
                  color="gray.600"
                  fontSize="sm"
                >
                  Last seen: {formatRelativeTime(server.last_seen)}
                </chakra.p>
              )}
            </chakra.div>
          </chakra.div>

          {/* System Info */}
          <chakra.div
            _dark={{ bg: 'gray.900' }}
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            p="6"
          >
            <chakra.div
              alignItems="flex-start"
              display="flex"
              justifyContent="space-between"
              mb="3"
            >
              <chakra.h3
                _dark={{ color: 'gray.400' }}
                color="gray.600"
                fontSize="sm"
                fontWeight="medium"
              >
                System
              </chakra.h3>
              <FiMonitor color="var(--chakra-colors-green-500)" />
            </chakra.div>
            <chakra.div>
              {server.os_name ? (
                <>
                  <chakra.p
                    _dark={{ color: 'white' }}
                    color="gray.900"
                    fontSize="sm"
                    fontWeight="medium"
                    mb="1"
                  >
                    {server.os_name} {server.os_version}
                  </chakra.p>
                  <chakra.p
                    _dark={{ color: 'gray.400' }}
                    color="gray.600"
                    fontSize="sm"
                    mb="1"
                  >
                    {server.architecture}
                  </chakra.p>
                  {server.kernel_version && (
                    <chakra.p color="gray.500" fontSize="xs">
                      Kernel: {server.kernel_version}
                    </chakra.p>
                  )}
                </>
              ) : (
                <chakra.p color="gray.500" fontSize="sm">
                  No system info available
                </chakra.p>
              )}
            </chakra.div>
          </chakra.div>

          {/* CPU & Memory */}
          <chakra.div
            _dark={{ bg: 'gray.900' }}
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            p="6"
          >
            <chakra.div
              alignItems="flex-start"
              display="flex"
              justifyContent="space-between"
              mb="3"
            >
              <chakra.h3
                _dark={{ color: 'gray.400' }}
                color="gray.600"
                fontSize="sm"
                fontWeight="medium"
              >
                Resources
              </chakra.h3>
              <FiCpu color="var(--chakra-colors-purple-500)" />
            </chakra.div>
            <chakra.div>
              {server.cpu_cores ? (
                <>
                  <chakra.p
                    _dark={{ color: 'white' }}
                    color="gray.900"
                    fontSize="sm"
                    fontWeight="medium"
                    mb="1"
                  >
                    {server.cpu_cores} CPU cores
                  </chakra.p>
                  {server.total_memory_mb && (
                    <chakra.p
                      _dark={{ color: 'gray.400' }}
                      color="gray.600"
                      fontSize="sm"
                    >
                      {formatMemoryMB(server.total_memory_mb)} RAM
                    </chakra.p>
                  )}
                </>
              ) : (
                <chakra.p color="gray.500" fontSize="sm">
                  No resource info available
                </chakra.p>
              )}
            </chakra.div>
          </chakra.div>

          {/* Storage */}
          <chakra.div
            _dark={{ bg: 'gray.900' }}
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            p="6"
          >
            <chakra.div
              alignItems="flex-start"
              display="flex"
              justifyContent="space-between"
              mb="3"
            >
              <chakra.h3
                _dark={{ color: 'gray.400' }}
                color="gray.600"
                fontSize="sm"
                fontWeight="medium"
              >
                Storage
              </chakra.h3>
              <FiHardDrive color="var(--chakra-colors-orange-500)" />
            </chakra.div>
            <chakra.div>
              {server.total_disk_gb ? (
                <chakra.p
                  _dark={{ color: 'white' }}
                  color="gray.900"
                  fontSize="sm"
                  fontWeight="medium"
                >
                  {formatDiskGB(server.total_disk_gb)} total
                </chakra.p>
              ) : (
                <chakra.p color="gray.500" fontSize="sm">
                  No storage info available
                </chakra.p>
              )}
            </chakra.div>
          </chakra.div>
        </chakra.div>

        {/* Services Section */}
        <chakra.div
          _dark={{ bg: 'gray.900' }}
          bg="white"
          borderRadius="lg"
          boxShadow="sm"
          p="6"
        >
          <chakra.div
            alignItems="center"
            display="flex"
            justifyContent="space-between"
            mb="4"
          >
            <chakra.h2
              alignItems="center"
              display="flex"
              fontSize="lg"
              fontWeight="semibold"
              gap="2"
            >
              <FiActivity />
              Services
            </chakra.h2>
            <Link to={`/services?server_id=${server.id}`}>
              <chakra.button
                _hover={{ color: 'blue.600' }}
                color="blue.500"
                fontSize="sm"
              >
                View all services →
              </chakra.button>
            </Link>
          </chakra.div>

          {isLoadingServices ? (
            <chakra.div display="flex" justifyContent="center" py="8">
              <chakra.div
                animation="spin 1s linear infinite"
                border="2px solid"
                borderColor="gray.200"
                borderRadius="full"
                borderTopColor="blue.500"
                h="6"
                w="6"
              />
            </chakra.div>
          ) : servicesData && servicesData.services.length > 0 ? (
            <chakra.div display="flex" flexDirection="column" gap="2">
              {servicesData.services.slice(0, 5).map((service) => (
                <chakra.div
                  _dark={{ borderColor: 'gray.700' }}
                  _hover={{ bg: 'gray.50', _dark: { bg: 'gray.800' } }}
                  alignItems="center"
                  borderColor="gray.200"
                  borderRadius="md"
                  borderWidth="1px"
                  display="flex"
                  justifyContent="space-between"
                  key={service.id}
                  p="3"
                >
                  <chakra.div alignItems="center" display="flex" gap="3">
                    <chakra.div
                      bg={
                        service.is_active
                          ? 'green.500'
                          : service.is_failed
                            ? 'red.500'
                            : 'gray.400'
                      }
                      borderRadius="full"
                      h="2"
                      w="2"
                    />
                    <chakra.div>
                      <chakra.h4 fontSize="sm" fontWeight="medium">
                        {service.display_name || service.name}
                      </chakra.h4>
                      {service.description && (
                        <chakra.p color="gray.500" fontSize="xs">
                          {service.description}
                        </chakra.p>
                      )}
                    </chakra.div>
                  </chakra.div>
                  <chakra.span
                    _dark={{
                      bg: service.is_active
                        ? 'green.900'
                        : service.is_failed
                          ? 'red.900'
                          : 'gray.700',
                      color: service.is_active
                        ? 'green.200'
                        : service.is_failed
                          ? 'red.200'
                          : 'gray.200',
                    }}
                    bg={
                      service.is_active
                        ? 'green.100'
                        : service.is_failed
                          ? 'red.100'
                          : 'gray.100'
                    }
                    borderRadius="full"
                    color={
                      service.is_active
                        ? 'green.800'
                        : service.is_failed
                          ? 'red.800'
                          : 'gray.800'
                    }
                    fontSize="xs"
                    px="2"
                    py="1"
                  >
                    {service.status}
                  </chakra.span>
                </chakra.div>
              ))}
              {servicesData.total > 5 && (
                <chakra.p
                  color="gray.500"
                  fontSize="sm"
                  mt="2"
                  textAlign="center"
                >
                  And {servicesData.total - 5} more services...
                </chakra.p>
              )}
            </chakra.div>
          ) : (
            <chakra.div py="8" textAlign="center">
              <FiActivity
                color="var(--chakra-colors-gray-400)"
                size={32}
                style={{ margin: '0 auto 12px' }}
              />
              <chakra.p color="gray.500" fontSize="sm">
                No services found on this server
              </chakra.p>
            </chakra.div>
          )}
        </chakra.div>

        {/* Quick Actions */}
        <chakra.div
          _dark={{ bg: 'gray.900' }}
          bg="white"
          borderRadius="lg"
          boxShadow="sm"
          p="6"
        >
          <chakra.h2 fontSize="lg" fontWeight="semibold" mb="4">
            Quick Actions
          </chakra.h2>

          <chakra.div
            display="grid"
            gap="4"
            gridTemplateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            }}
          >
            <Link to={`/services?server_id=${server.id}`}>
              <chakra.button
                _dark={{ borderColor: 'gray.700' }}
                _hover={{
                  borderColor: 'blue.300',
                  bg: 'blue.50',
                  _dark: { bg: 'blue.900' },
                }}
                alignItems="center"
                borderColor="gray.200"
                borderRadius="md"
                borderWidth="1px"
                display="flex"
                gap="3"
                h="16"
                justifyContent="flex-start"
                p="4"
                width="100%"
              >
                <FiActivity size={20} />
                <chakra.div
                  alignItems="flex-start"
                  display="flex"
                  flexDirection="column"
                >
                  <chakra.p fontWeight="medium">Manage Services</chakra.p>
                  <chakra.p color="gray.500" fontSize="sm">
                    View and control systemd services
                  </chakra.p>
                </chakra.div>
              </chakra.button>
            </Link>

            <chakra.button
              _dark={{ borderColor: 'gray.700' }}
              _hover={{
                borderColor: 'blue.300',
                bg: 'blue.50',
                _dark: { bg: 'blue.900' },
              }}
              alignItems="center"
              borderColor="gray.200"
              borderRadius="md"
              borderWidth="1px"
              disabled
              display="flex"
              gap="3"
              h="16"
              justifyContent="flex-start"
              opacity="0.5"
              p="4"
              width="100%"
            >
              <FiTerminal size={20} />
              <chakra.div
                alignItems="flex-start"
                display="flex"
                flexDirection="column"
              >
                <chakra.p fontWeight="medium">SSH Terminal</chakra.p>
                <chakra.p color="gray.500" fontSize="sm">
                  Connect via web terminal (coming soon)
                </chakra.p>
              </chakra.div>
            </chakra.button>

            <Link to={`/servers/${server.id}/edit`}>
              <chakra.button
                _dark={{ borderColor: 'gray.700' }}
                _hover={{
                  borderColor: 'blue.300',
                  bg: 'blue.50',
                  _dark: { bg: 'blue.900' },
                }}
                alignItems="center"
                borderColor="gray.200"
                borderRadius="md"
                borderWidth="1px"
                display="flex"
                gap="3"
                h="16"
                justifyContent="flex-start"
                p="4"
                width="100%"
              >
                <FiSettings size={20} />
                <chakra.div
                  alignItems="flex-start"
                  display="flex"
                  flexDirection="column"
                >
                  <chakra.p fontWeight="medium">Server Settings</chakra.p>
                  <chakra.p color="gray.500" fontSize="sm">
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
