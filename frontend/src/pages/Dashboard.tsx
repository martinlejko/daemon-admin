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
    <chakra.div bg="bg.subtle" minH="100vh" p="8">
      <chakra.div
        alignItems="stretch"
        display="flex"
        flexDirection="column"
        gap="8"
        maxW="7xl"
        mx="auto"
      >
        {/* Header */}
        <chakra.div
          alignItems={{ base: 'flex-start', md: 'center' }}
          display="flex"
          flexDirection={{ base: 'column', md: 'row' }}
          gap="4"
          justifyContent="space-between"
        >
          <chakra.div
            alignItems="flex-start"
            display="flex"
            flexDirection="column"
            gap="2"
          >
            <chakra.h1
              color="text"
              fontSize="3xl"
              fontWeight="bold"
              letterSpacing="tight"
            >
              System Overview
            </chakra.h1>
            <chakra.p color="text.subtle" fontSize="lg">
              Monitor your servers and services at a glance
            </chakra.p>
          </chakra.div>

          <chakra.div display="flex" gap="3">
            <chakra.button
              _disabled={{ opacity: 0.5 }}
              _hover={{ bg: 'bg.subtle', transform: 'translateY(-1px)' }}
              alignItems="center"
              aria-label="Refresh dashboard"
              bg="bg.surface"
              borderColor="border"
              borderRadius="lg"
              borderWidth="1px"
              boxShadow="sm"
              color="text.subtle"
              disabled={isLoading}
              display="flex"
              justifyContent="center"
              onClick={handleRefresh}
              p="3"
              transition="all 0.2s"
            >
              <chakra.div
                animation={isLoading ? 'spin 1s linear infinite' : undefined}
              >
                <FiRefreshCw size={18} />
              </chakra.div>
            </chakra.button>
            <Link to="/servers/new">
              <chakra.button
                _hover={{
                  bg: 'accent.emphasis',
                  transform: 'translateY(-1px)',
                }}
                alignItems="center"
                bg="accent"
                borderRadius="lg"
                boxShadow="sm"
                color="white"
                display="flex"
                fontWeight="semibold"
                gap="2"
                px="6"
                py="3"
                transition="all 0.2s"
              >
                <FiPlus size={18} />
                <chakra.span>Add Server</chakra.span>
              </chakra.button>
            </Link>
          </chakra.div>
        </chakra.div>

        {/* Health Status */}
        {healthError && (
          <chakra.div
            alignItems="center"
            bg="negative.subtle"
            border="1px solid"
            borderColor="negative.muted"
            borderRadius="xl"
            boxShadow="sm"
            display="flex"
            gap="4"
            p="6"
          >
            <chakra.div bg="negative" borderRadius="full" color="white" p="2">
              <FiXCircle size={20} />
            </chakra.div>
            <chakra.div>
              <chakra.h3
                color="negative.emphasis"
                fontSize="lg"
                fontWeight="semibold"
              >
                API Connection Error
              </chakra.h3>
              <chakra.p color="negative" fontSize="sm" mt="1">
                Unable to connect to the Owleyes API. Please check your
                connection.
              </chakra.p>
            </chakra.div>
          </chakra.div>
        )}

        {/* Loading State */}
        {isLoading && !serverStats && !serviceStats && (
          <chakra.div
            bg="bg.surface"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="xl"
            boxShadow="md"
            p="12"
          >
            <chakra.div
              alignItems="center"
              display="flex"
              flexDirection="column"
              gap="6"
            >
              <chakra.div
                animation="spin 1s linear infinite"
                border="3px solid"
                borderColor="border.muted"
                borderRadius="full"
                borderTopColor="accent"
                h="16"
                w="16"
              />
              <chakra.div textAlign="center">
                <chakra.p color="text" fontSize="lg" fontWeight="semibold">
                  Loading dashboard data...
                </chakra.p>
                <chakra.p color="text.subtle" fontSize="sm" mt="1">
                  Please wait while we gather your system information
                </chakra.p>
              </chakra.div>
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
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            }}
          >
            {/* Server Stats */}
            {serverStats && (
              <>
                <chakra.div
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                  bg="bg.surface"
                  border="1px solid"
                  borderColor="border.subtle"
                  borderRadius="xl"
                  boxShadow="md"
                  p="6"
                  transition="all 0.2s"
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
                      gap="2"
                    >
                      <chakra.p
                        color="text.subtle"
                        fontSize="sm"
                        fontWeight="medium"
                        letterSpacing="wide"
                        textTransform="uppercase"
                      >
                        Total Servers
                      </chakra.p>
                      <chakra.p color="text" fontSize="3xl" fontWeight="bold">
                        {serverStats.total_servers}
                      </chakra.p>
                    </chakra.div>
                    <chakra.div
                      bg="accent.subtle"
                      borderRadius="lg"
                      color="accent"
                      p="3"
                    >
                      <FiServer size={24} />
                    </chakra.div>
                  </chakra.div>
                  <chakra.div display="flex" gap="2" mt="4">
                    <chakra.span
                      bg="positive.muted"
                      borderRadius="full"
                      color="positive.emphasis"
                      fontSize="xs"
                      fontWeight="semibold"
                      px="3"
                      py="1"
                    >
                      {serverStats.online_servers} online
                    </chakra.span>
                    {serverStats.offline_servers > 0 && (
                      <chakra.span
                        bg="text.muted"
                        borderRadius="full"
                        color="white"
                        fontSize="xs"
                        fontWeight="semibold"
                        px="3"
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
