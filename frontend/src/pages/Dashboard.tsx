/**
 * Dashboard page - main overview of servers and services
 */

import { useEffect } from 'react';
import { chakra } from '@chakra-ui/react';
import {
  FiServer,
  FiActivity,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiPlus,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useUIStore } from '@/store';
import { useServerStats, useServiceStats, useHealthCheck } from '@/hooks/useApi';

const Dashboard: React.FC = () => {
  const { setPageTitle, setBreadcrumbs, addNotification } = useUIStore();

  const {
    data: serverStats,
    isLoading: isLoadingServerStats,
    error: serverStatsError,
    refetch: refetchServerStats,
  } = useServerStats();

  const {
    data: serviceStats,
    isLoading: isLoadingServiceStats,
    error: serviceStatsError,
    refetch: refetchServiceStats,
  } = useServiceStats();

  const {
    error: healthError,
  } = useHealthCheck();

  useEffect(() => {
    setPageTitle('Dashboard');
    setBreadcrumbs([{ label: 'Dashboard' }]);
  }, [setPageTitle, setBreadcrumbs]);

  const handleRefresh = () => {
    refetchServerStats();
    refetchServiceStats();
    addNotification({
      type: 'info',
      message: 'Dashboard data refreshed',
    });
  };

  const isLoading = isLoadingServerStats || isLoadingServiceStats;
  const hasError = serverStatsError || serviceStatsError || healthError;

  return (
    <chakra.div p="6">
      <chakra.div display="flex" flexDirection="column" gap="6" alignItems="stretch">
        {/* Header */}
        <chakra.div display="flex" justifyContent="space-between">
          <chakra.div display="flex" flexDirection="column" alignItems="flex-start" gap="1">
            <chakra.h1 fontSize="2xl" fontWeight="bold" color="gray.900" _dark={{ color: 'white' }}>
              System Overview
            </chakra.h1>
            <chakra.p color="gray.600" _dark={{ color: 'gray.400' }}>
              Monitor your servers and services at a glance
            </chakra.p>
          </chakra.div>

          <chakra.div display="flex" gap="2">
            <chakra.button
              aria-label="Refresh dashboard"
              onClick={handleRefresh}
              p="2"
              bg="transparent"
              borderWidth="1px"
              borderColor="gray.300"
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              borderRadius="md"
              disabled={isLoading}
              _disabled={{ opacity: 0.5 }}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <chakra.div
                animation={isLoading ? 'spin 1s linear infinite' : undefined}
              >
                <FiRefreshCw />
              </chakra.div>
            </chakra.button>
            <Link to="/servers/new">
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
              >
                <FiPlus />
                <chakra.span>Add Server</chakra.span>
              </chakra.button>
            </Link>
          </chakra.div>
        </chakra.div>

        {/* Health Status */}
        {healthError && (
          <chakra.div
            bg="red.50"
            _dark={{ bg: 'red.900', borderColor: 'red.700' }}
            border="1px solid"
            borderColor="red.200"
            borderRadius="md"
            p="4"
            display="flex"
            alignItems="center"
            gap="3"
          >
            <FiXCircle color="var(--chakra-colors-red-500)" />
            <chakra.div>
              <chakra.h3 fontWeight="semibold" color="red.800" _dark={{ color: 'red.200' }}>
                API Connection Error
              </chakra.h3>
              <chakra.p color="red.700" _dark={{ color: 'red.300' }}>
                Unable to connect to the Owleyes API. Please check your connection.
              </chakra.p>
            </chakra.div>
          </chakra.div>
        )}

        {/* Loading State */}
        {isLoading && !serverStats && !serviceStats && (
          <chakra.div
            bg="white"
            _dark={{ bg: 'gray.900' }}
            borderRadius="lg"
            boxShadow="sm"
            p="8"
          >
            <chakra.div display="flex" flexDirection="column" alignItems="center" gap="4" py="8">
              <chakra.div
                w="12"
                h="12"
                border="2px solid"
                borderColor="gray.200"
                borderTopColor="blue.500"
                borderRadius="full"
                animation="spin 1s linear infinite"
              />
              <chakra.p color="gray.600" _dark={{ color: 'gray.400' }}>
                Loading dashboard data...
              </chakra.p>
            </chakra.div>
          </chakra.div>
        )}

        {/* Stats Grid */}
        {(serverStats || serviceStats) && (
          <chakra.div
            display="grid"
            gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
            gap="6"
          >
            {/* Server Stats */}
            {serverStats && (
              <>
                <chakra.div
                  bg="white"
                  _dark={{ bg: 'gray.900' }}
                  borderRadius="lg"
                  boxShadow="sm"
                  p="6"
                >
                  <chakra.div display="flex" justifyContent="space-between" alignItems="flex-start">
                    <chakra.div display="flex" flexDirection="column" alignItems="flex-start" gap="1">
                      <chakra.p color="gray.600" _dark={{ color: 'gray.400' }} fontSize="sm">
                        Total Servers
                      </chakra.p>
                      <chakra.p fontSize="2xl" fontWeight="bold">
                        {serverStats.total_servers}
                      </chakra.p>
                    </chakra.div>
                    <chakra.div
                      p="2"
                      bg="blue.50"
                      _dark={{ bg: 'blue.900' }}
                      borderRadius="md"
                    >
                      <FiServer size={20} color="var(--chakra-colors-blue-500)" />
                    </chakra.div>
                  </chakra.div>
                  <chakra.div display="flex" gap="2" mt="3">
                    <chakra.span
                      bg="green.100"
                      color="green.800"
                      _dark={{ bg: 'green.900', color: 'green.200' }}
                      fontSize="xs"
                      px="2"
                      py="1"
                      borderRadius="full"
                    >
                      {serverStats.online_servers} online
                    </chakra.span>
                    {serverStats.offline_servers > 0 && (
                      <chakra.span
                        bg="gray.100"
                        color="gray.800"
                        _dark={{ bg: 'gray.700', color: 'gray.200' }}
                        fontSize="xs"
                        px="2"
                        py="1"
                        borderRadius="full"
                      >
                        {serverStats.offline_servers} offline
                      </chakra.span>
                    )}
                  </chakra.div>
                </chakra.div>

                <chakra.div
                  bg="white"
                  _dark={{ bg: 'gray.900' }}
                  borderRadius="lg"
                  boxShadow="sm"
                  p="6"
                >
                  <chakra.div display="flex" justifyContent="space-between" alignItems="flex-start">
                    <chakra.div display="flex" flexDirection="column" alignItems="flex-start" gap="1">
                      <chakra.p color="gray.600" _dark={{ color: 'gray.400' }} fontSize="sm">
                        Online Servers
                      </chakra.p>
                      <chakra.p fontSize="2xl" fontWeight="bold" color="green.500">
                        {serverStats.online_servers}
                      </chakra.p>
                    </chakra.div>
                    <chakra.div
                      p="2"
                      bg="green.50"
                      _dark={{ bg: 'green.900' }}
                      borderRadius="md"
                    >
                      <FiCheckCircle size={20} color="var(--chakra-colors-green-500)" />
                    </chakra.div>
                  </chakra.div>
                  {serverStats.total_servers > 0 && (
                    <chakra.p color="gray.500" fontSize="sm" mt="2">
                      {Math.round((serverStats.online_servers / serverStats.total_servers) * 100)}% uptime
                    </chakra.p>
                  )}
                </chakra.div>
              </>
            )}

            {/* Service Stats */}
            {serviceStats && (
              <>
                <chakra.div
                  bg="white"
                  _dark={{ bg: 'gray.900' }}
                  borderRadius="lg"
                  boxShadow="sm"
                  p="6"
                >
                  <chakra.div display="flex" justifyContent="space-between" alignItems="flex-start">
                    <chakra.div display="flex" flexDirection="column" alignItems="flex-start" gap="1">
                      <chakra.p color="gray.600" _dark={{ color: 'gray.400' }} fontSize="sm">
                        Total Services
                      </chakra.p>
                      <chakra.p fontSize="2xl" fontWeight="bold">
                        {serviceStats.total_services}
                      </chakra.p>
                    </chakra.div>
                    <chakra.div
                      p="2"
                      bg="purple.50"
                      _dark={{ bg: 'purple.900' }}
                      borderRadius="md"
                    >
                      <FiActivity size={20} color="var(--chakra-colors-purple-500)" />
                    </chakra.div>
                  </chakra.div>
                  <chakra.div display="flex" gap="2" mt="3">
                    <chakra.span
                      bg="green.100"
                      color="green.800"
                      _dark={{ bg: 'green.900', color: 'green.200' }}
                      fontSize="xs"
                      px="2"
                      py="1"
                      borderRadius="full"
                    >
                      {serviceStats.active_services} active
                    </chakra.span>
                    {serviceStats.failed_services > 0 && (
                      <chakra.span
                        bg="red.100"
                        color="red.800"
                        _dark={{ bg: 'red.900', color: 'red.200' }}
                        fontSize="xs"
                        px="2"
                        py="1"
                        borderRadius="full"
                      >
                        {serviceStats.failed_services} failed
                      </chakra.span>
                    )}
                  </chakra.div>
                </chakra.div>

                <chakra.div
                  bg="white"
                  _dark={{ bg: 'gray.900' }}
                  borderRadius="lg"
                  boxShadow="sm"
                  p="6"
                >
                  <chakra.div display="flex" justifyContent="space-between" alignItems="flex-start">
                    <chakra.div display="flex" flexDirection="column" alignItems="flex-start" gap="1">
                      <chakra.p color="gray.600" _dark={{ color: 'gray.400' }} fontSize="sm">
                        Failed Services
                      </chakra.p>
                      <chakra.p 
                        fontSize="2xl" 
                        fontWeight="bold"
                        color={serviceStats.failed_services > 0 ? 'red.500' : 'green.500'}
                      >
                        {serviceStats.failed_services}
                      </chakra.p>
                    </chakra.div>
                    <chakra.div
                      p="2"
                      bg={serviceStats.failed_services > 0 ? 'red.50' : 'green.50'}
                      _dark={{ 
                        bg: serviceStats.failed_services > 0 ? 'red.900' : 'green.900' 
                      }}
                      borderRadius="md"
                    >
                      {serviceStats.failed_services > 0 ? (
                        <FiXCircle size={20} color="var(--chakra-colors-red-500)" />
                      ) : (
                        <FiCheckCircle size={20} color="var(--chakra-colors-green-500)" />
                      )}
                    </chakra.div>
                  </chakra.div>
                  <chakra.p color="gray.500" fontSize="sm" mt="2">
                    {serviceStats.failed_services === 0 ? (
                      'All services running'
                    ) : (
                      'Requires attention'
                    )}
                  </chakra.p>
                </chakra.div>
              </>
            )}
          </chakra.div>
        )}

        {/* Quick Actions */}
        <chakra.div
          bg="white"
          _dark={{ bg: 'gray.900' }}
          borderRadius="lg"
          boxShadow="sm"
          p="6"
        >
          <chakra.div display="flex" flexDirection="column" gap="4" alignItems="stretch">
            <chakra.h2 fontSize="lg" fontWeight="semibold">
              Quick Actions
            </chakra.h2>
            
            <chakra.div
              display="grid"
              gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
              gap="4"
            >
              <Link to="/servers">
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
                  <FiServer size={20} />
                  <chakra.div display="flex" flexDirection="column" alignItems="flex-start">
                    <chakra.p fontWeight="medium">Manage Servers</chakra.p>
                    <chakra.p fontSize="sm" color="gray.500">
                      Add, configure, and monitor servers
                    </chakra.p>
                  </chakra.div>
                </chakra.button>
              </Link>

              <Link to="/services">
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
                    <chakra.p fontWeight="medium">View Services</chakra.p>
                    <chakra.p fontSize="sm" color="gray.500">
                      Monitor and control systemd services
                    </chakra.p>
                  </chakra.div>
                </chakra.button>
              </Link>

              <Link to="/settings">
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
                  <FiRefreshCw size={20} />
                  <chakra.div display="flex" flexDirection="column" alignItems="flex-start">
                    <chakra.p fontWeight="medium">Settings</chakra.p>
                    <chakra.p fontSize="sm" color="gray.500">
                      Configure application preferences
                    </chakra.p>
                  </chakra.div>
                </chakra.button>
              </Link>
            </chakra.div>
          </chakra.div>
        </chakra.div>

        {/* Error States */}
        {hasError && !healthError && (
          <chakra.div
            bg="yellow.50"
            _dark={{ bg: 'yellow.900', borderColor: 'yellow.700' }}
            border="1px solid"
            borderColor="yellow.200"
            borderRadius="md"
            p="4"
            display="flex"
            alignItems="center"
            gap="3"
          >
            <FiRefreshCw color="var(--chakra-colors-yellow-500)" />
            <chakra.div>
              <chakra.h3 fontWeight="semibold" color="yellow.800" _dark={{ color: 'yellow.200' }}>
                Some data could not be loaded
              </chakra.h3>
              <chakra.p color="yellow.700" _dark={{ color: 'yellow.300' }}>
                There was an error loading dashboard statistics. Please try refreshing the page.
              </chakra.p>
            </chakra.div>
          </chakra.div>
        )}
      </chakra.div>
    </chakra.div>
  );
};

export default Dashboard;