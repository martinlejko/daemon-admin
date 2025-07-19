/**
 * Dashboard page - main overview of servers and services
 */

import { chakra } from '@chakra-ui/react';
import { useEffect } from 'react';
import {
  FiActivity,
  FiCheckCircle,
  FiPlus,
  FiRefreshCw,
  FiServer,
  FiXCircle,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import {
  useHealthCheck,
  useServerStats,
  useServiceStats,
} from '@/hooks/useApi';
import { useUIStore } from '@/store';

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

  const { error: healthError } = useHealthCheck();

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
      <chakra.div
        alignItems="stretch"
        display="flex"
        flexDirection="column"
        gap="6"
      >
        {/* Header */}
        <chakra.div display="flex" justifyContent="space-between">
          <chakra.div
            alignItems="flex-start"
            display="flex"
            flexDirection="column"
            gap="1"
          >
            <chakra.h1
              _dark={{ color: 'white' }}
              color="gray.900"
              fontSize="2xl"
              fontWeight="bold"
            >
              System Overview
            </chakra.h1>
            <chakra.p _dark={{ color: 'gray.400' }} color="gray.600">
              Monitor your servers and services at a glance
            </chakra.p>
          </chakra.div>

          <chakra.div display="flex" gap="2">
            <chakra.button
              _disabled={{ opacity: 0.5 }}
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              alignItems="center"
              aria-label="Refresh dashboard"
              bg="transparent"
              borderColor="gray.300"
              borderRadius="md"
              borderWidth="1px"
              disabled={isLoading}
              display="flex"
              justifyContent="center"
              onClick={handleRefresh}
              p="2"
            >
              <chakra.div
                animation={isLoading ? 'spin 1s linear infinite' : undefined}
              >
                <FiRefreshCw />
              </chakra.div>
            </chakra.button>
            <Link to="/servers/new">
              <chakra.button
                _hover={{ bg: 'blue.600' }}
                alignItems="center"
                bg="blue.500"
                borderRadius="md"
                color="white"
                display="flex"
                gap="2"
                px="4"
                py="2"
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
            _dark={{ bg: 'red.900', borderColor: 'red.700' }}
            alignItems="center"
            bg="red.50"
            border="1px solid"
            borderColor="red.200"
            borderRadius="md"
            display="flex"
            gap="3"
            p="4"
          >
            <FiXCircle color="var(--chakra-colors-red-500)" />
            <chakra.div>
              <chakra.h3
                _dark={{ color: 'red.200' }}
                color="red.800"
                fontWeight="semibold"
              >
                API Connection Error
              </chakra.h3>
              <chakra.p _dark={{ color: 'red.300' }} color="red.700">
                Unable to connect to the Owleyes API. Please check your
                connection.
              </chakra.p>
            </chakra.div>
          </chakra.div>
        )}

        {/* Loading State */}
        {isLoading && !serverStats && !serviceStats && (
          <chakra.div
            _dark={{ bg: 'gray.900' }}
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            p="8"
          >
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
                h="12"
                w="12"
              />
              <chakra.p _dark={{ color: 'gray.400' }} color="gray.600">
                Loading dashboard data...
              </chakra.p>
            </chakra.div>
          </chakra.div>
        )}

        {/* Stats Grid */}
        {(serverStats || serviceStats) && (
          <chakra.div
            display="grid"
            gap="6"
            gridTemplateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            }}
          >
            {/* Server Stats */}
            {serverStats && (
              <>
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
                  >
                    <chakra.div
                      alignItems="flex-start"
                      display="flex"
                      flexDirection="column"
                      gap="1"
                    >
                      <chakra.p
                        _dark={{ color: 'gray.400' }}
                        color="gray.600"
                        fontSize="sm"
                      >
                        Total Servers
                      </chakra.p>
                      <chakra.p fontSize="2xl" fontWeight="bold">
                        {serverStats.total_servers}
                      </chakra.p>
                    </chakra.div>
                    <chakra.div
                      _dark={{ bg: 'blue.900' }}
                      bg="blue.50"
                      borderRadius="md"
                      p="2"
                    >
                      <FiServer
                        color="var(--chakra-colors-blue-500)"
                        size={20}
                      />
                    </chakra.div>
                  </chakra.div>
                  <chakra.div display="flex" gap="2" mt="3">
                    <chakra.span
                      _dark={{ bg: 'green.900', color: 'green.200' }}
                      bg="green.100"
                      borderRadius="full"
                      color="green.800"
                      fontSize="xs"
                      px="2"
                      py="1"
                    >
                      {serverStats.online_servers} online
                    </chakra.span>
                    {serverStats.offline_servers > 0 && (
                      <chakra.span
                        _dark={{ bg: 'gray.700', color: 'gray.200' }}
                        bg="gray.100"
                        borderRadius="full"
                        color="gray.800"
                        fontSize="xs"
                        px="2"
                        py="1"
                      >
                        {serverStats.offline_servers} offline
                      </chakra.span>
                    )}
                  </chakra.div>
                </chakra.div>

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
                  >
                    <chakra.div
                      alignItems="flex-start"
                      display="flex"
                      flexDirection="column"
                      gap="1"
                    >
                      <chakra.p
                        _dark={{ color: 'gray.400' }}
                        color="gray.600"
                        fontSize="sm"
                      >
                        Online Servers
                      </chakra.p>
                      <chakra.p
                        color="green.500"
                        fontSize="2xl"
                        fontWeight="bold"
                      >
                        {serverStats.online_servers}
                      </chakra.p>
                    </chakra.div>
                    <chakra.div
                      _dark={{ bg: 'green.900' }}
                      bg="green.50"
                      borderRadius="md"
                      p="2"
                    >
                      <FiCheckCircle
                        color="var(--chakra-colors-green-500)"
                        size={20}
                      />
                    </chakra.div>
                  </chakra.div>
                  {serverStats.total_servers > 0 && (
                    <chakra.p color="gray.500" fontSize="sm" mt="2">
                      {Math.round(
                        (serverStats.online_servers /
                          serverStats.total_servers) *
                          100
                      )}
                      % uptime
                    </chakra.p>
                  )}
                </chakra.div>
              </>
            )}

            {/* Service Stats */}
            {serviceStats && (
              <>
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
                  >
                    <chakra.div
                      alignItems="flex-start"
                      display="flex"
                      flexDirection="column"
                      gap="1"
                    >
                      <chakra.p
                        _dark={{ color: 'gray.400' }}
                        color="gray.600"
                        fontSize="sm"
                      >
                        Total Services
                      </chakra.p>
                      <chakra.p fontSize="2xl" fontWeight="bold">
                        {serviceStats.total_services}
                      </chakra.p>
                    </chakra.div>
                    <chakra.div
                      _dark={{ bg: 'purple.900' }}
                      bg="purple.50"
                      borderRadius="md"
                      p="2"
                    >
                      <FiActivity
                        color="var(--chakra-colors-purple-500)"
                        size={20}
                      />
                    </chakra.div>
                  </chakra.div>
                  <chakra.div display="flex" gap="2" mt="3">
                    <chakra.span
                      _dark={{ bg: 'green.900', color: 'green.200' }}
                      bg="green.100"
                      borderRadius="full"
                      color="green.800"
                      fontSize="xs"
                      px="2"
                      py="1"
                    >
                      {serviceStats.active_services} active
                    </chakra.span>
                    {serviceStats.failed_services > 0 && (
                      <chakra.span
                        _dark={{ bg: 'red.900', color: 'red.200' }}
                        bg="red.100"
                        borderRadius="full"
                        color="red.800"
                        fontSize="xs"
                        px="2"
                        py="1"
                      >
                        {serviceStats.failed_services} failed
                      </chakra.span>
                    )}
                  </chakra.div>
                </chakra.div>

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
                  >
                    <chakra.div
                      alignItems="flex-start"
                      display="flex"
                      flexDirection="column"
                      gap="1"
                    >
                      <chakra.p
                        _dark={{ color: 'gray.400' }}
                        color="gray.600"
                        fontSize="sm"
                      >
                        Failed Services
                      </chakra.p>
                      <chakra.p
                        color={
                          serviceStats.failed_services > 0
                            ? 'red.500'
                            : 'green.500'
                        }
                        fontSize="2xl"
                        fontWeight="bold"
                      >
                        {serviceStats.failed_services}
                      </chakra.p>
                    </chakra.div>
                    <chakra.div
                      _dark={{
                        bg:
                          serviceStats.failed_services > 0
                            ? 'red.900'
                            : 'green.900',
                      }}
                      bg={
                        serviceStats.failed_services > 0 ? 'red.50' : 'green.50'
                      }
                      borderRadius="md"
                      p="2"
                    >
                      {serviceStats.failed_services > 0 ? (
                        <FiXCircle
                          color="var(--chakra-colors-red-500)"
                          size={20}
                        />
                      ) : (
                        <FiCheckCircle
                          color="var(--chakra-colors-green-500)"
                          size={20}
                        />
                      )}
                    </chakra.div>
                  </chakra.div>
                  <chakra.p color="gray.500" fontSize="sm" mt="2">
                    {serviceStats.failed_services === 0
                      ? 'All services running'
                      : 'Requires attention'}
                  </chakra.p>
                </chakra.div>
              </>
            )}
          </chakra.div>
        )}

        {/* Quick Actions */}
        <chakra.div
          _dark={{ bg: 'gray.900' }}
          bg="white"
          borderRadius="lg"
          boxShadow="sm"
          p="6"
        >
          <chakra.div
            alignItems="stretch"
            display="flex"
            flexDirection="column"
            gap="4"
          >
            <chakra.h2 fontSize="lg" fontWeight="semibold">
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
              <Link to="/servers">
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
                  <FiServer size={20} />
                  <chakra.div
                    alignItems="flex-start"
                    display="flex"
                    flexDirection="column"
                  >
                    <chakra.p fontWeight="medium">Manage Servers</chakra.p>
                    <chakra.p color="gray.500" fontSize="sm">
                      Add, configure, and monitor servers
                    </chakra.p>
                  </chakra.div>
                </chakra.button>
              </Link>

              <Link to="/services">
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
                    <chakra.p fontWeight="medium">View Services</chakra.p>
                    <chakra.p color="gray.500" fontSize="sm">
                      Monitor and control systemd services
                    </chakra.p>
                  </chakra.div>
                </chakra.button>
              </Link>

              <Link to="/settings">
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
                  <FiRefreshCw size={20} />
                  <chakra.div
                    alignItems="flex-start"
                    display="flex"
                    flexDirection="column"
                  >
                    <chakra.p fontWeight="medium">Settings</chakra.p>
                    <chakra.p color="gray.500" fontSize="sm">
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
            _dark={{ bg: 'yellow.900', borderColor: 'yellow.700' }}
            alignItems="center"
            bg="yellow.50"
            border="1px solid"
            borderColor="yellow.200"
            borderRadius="md"
            display="flex"
            gap="3"
            p="4"
          >
            <FiRefreshCw color="var(--chakra-colors-yellow-500)" />
            <chakra.div>
              <chakra.h3
                _dark={{ color: 'yellow.200' }}
                color="yellow.800"
                fontWeight="semibold"
              >
                Some data could not be loaded
              </chakra.h3>
              <chakra.p _dark={{ color: 'yellow.300' }} color="yellow.700">
                There was an error loading dashboard statistics. Please try
                refreshing the page.
              </chakra.p>
            </chakra.div>
          </chakra.div>
        )}
      </chakra.div>
    </chakra.div>
  );
};

export default Dashboard;
