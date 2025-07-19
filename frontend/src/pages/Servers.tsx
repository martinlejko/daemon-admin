/**
 * Servers list page - view and manage all servers
 */

import { chakra } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  FiAlertCircle,
  FiEdit2,
  FiEye,
  FiFilter,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiServer,
  FiTrash2,
  FiWifi,
  FiWifiOff,
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useDeleteServer, useServers } from '@/hooks/useApi';
import { useServerStore, useUIStore } from '@/store';
import { type Server, ServerStatus } from '@/types';
import { formatRelativeTime, getServerStatusColor } from '@/utils';

const Servers: React.FC = () => {
  const navigate = useNavigate();
  const { setPageTitle, setBreadcrumbs, addNotification } = useUIStore();
  const { serverFilters, setServerFilters, clearServerFilters } =
    useServerStore();

  const [searchTerm, setSearchTerm] = useState(serverFilters.search || '');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: serversData,
    isLoading,
    error,
    refetch,
  } = useServers({
    page,
    per_page: 20,
    search: serverFilters.search,
    status: serverFilters.status as ServerStatus,
    enabled_only: serverFilters.enabled_only,
  });

  const deleteServerMutation = useDeleteServer();

  useEffect(() => {
    setPageTitle('Servers');
    setBreadcrumbs([{ label: 'Dashboard', href: '/' }, { label: 'Servers' }]);
  }, [setPageTitle, setBreadcrumbs]);

  const handleSearch = () => {
    setServerFilters({ search: searchTerm });
    setPage(1);
  };

  const handleClearFilters = () => {
    clearServerFilters();
    setSearchTerm('');
    setPage(1);
  };

  const handleDeleteServer = async (server: Server) => {
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
      } catch (error) {
        addNotification({
          type: 'error',
          message: `Failed to delete server: ${error}`,
        });
      }
    }
  };

  const getStatusIcon = (status: ServerStatus) => {
    switch (status) {
      case ServerStatus.ONLINE:
        return <FiWifi color="var(--chakra-colors-green-500)" />;
      case ServerStatus.OFFLINE:
        return <FiWifiOff color="var(--chakra-colors-gray-500)" />;
      case ServerStatus.ERROR:
        return <FiAlertCircle color="var(--chakra-colors-red-500)" />;
      default:
        return <FiWifiOff color="var(--chakra-colors-gray-500)" />;
    }
  };

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
          <chakra.div>
            <chakra.h1
              _dark={{ color: 'white' }}
              color="gray.900"
              fontSize="2xl"
              fontWeight="bold"
            >
              Servers
            </chakra.h1>
            <chakra.p _dark={{ color: 'gray.400' }} color="gray.600">
              Manage your Linux servers and monitor their status
            </chakra.p>
          </chakra.div>

          <chakra.div display="flex" gap="2">
            <chakra.button
              _disabled={{ opacity: 0.5 }}
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              aria-label="Refresh servers"
              bg="transparent"
              borderColor="gray.300"
              borderRadius="md"
              borderWidth="1px"
              disabled={isLoading}
              onClick={() => refetch()}
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

        {/* Search and Filters */}
        <chakra.div
          _dark={{ bg: 'gray.900' }}
          bg="white"
          borderRadius="lg"
          boxShadow="sm"
          p="4"
        >
          <chakra.div
            alignItems="center"
            display="flex"
            flexWrap="wrap"
            gap="4"
          >
            {/* Search */}
            <chakra.div display="flex" flex="1" gap="2" minW="300px">
              <chakra.input
                _dark={{ borderColor: 'gray.600' }}
                borderColor="gray.300"
                borderRadius="md"
                borderWidth="1px"
                flex="1"
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search servers..."
                px="3"
                py="2"
                value={searchTerm}
              />
              <chakra.button
                _hover={{ bg: 'blue.600' }}
                alignItems="center"
                bg="blue.500"
                borderRadius="md"
                color="white"
                display="flex"
                gap="2"
                onClick={handleSearch}
                px="4"
                py="2"
              >
                <FiSearch />
                <chakra.span display={{ base: 'none', md: 'inline' }}>
                  Search
                </chakra.span>
              </chakra.button>
            </chakra.div>

            {/* Filter Toggle */}
            <chakra.button
              _dark={{ borderColor: 'gray.600' }}
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              alignItems="center"
              borderColor="gray.300"
              borderRadius="md"
              borderWidth="1px"
              display="flex"
              gap="2"
              onClick={() => setShowFilters(!showFilters)}
              px="4"
              py="2"
            >
              <FiFilter />
              <chakra.span>Filters</chakra.span>
            </chakra.button>

            {/* Clear Filters */}
            {(serverFilters.search ||
              serverFilters.status ||
              serverFilters.enabled_only) && (
              <chakra.button
                _hover={{ color: 'red.600' }}
                color="red.500"
                fontSize="sm"
                onClick={handleClearFilters}
              >
                Clear Filters
              </chakra.button>
            )}
          </chakra.div>

          {/* Expanded Filters */}
          {showFilters && (
            <chakra.div
              _dark={{ borderColor: 'gray.700' }}
              borderColor="gray.200"
              borderTopWidth="1px"
              display="flex"
              flexWrap="wrap"
              gap="4"
              mt="4"
              pt="4"
            >
              <chakra.div>
                <chakra.label
                  display="block"
                  fontSize="sm"
                  fontWeight="medium"
                  mb="1"
                >
                  Status
                </chakra.label>
                <chakra.select
                  _dark={{ borderColor: 'gray.600' }}
                  borderColor="gray.300"
                  borderRadius="md"
                  borderWidth="1px"
                  onChange={(e) =>
                    setServerFilters({ status: e.target.value || undefined })
                  }
                  px="3"
                  py="2"
                  value={serverFilters.status || ''}
                >
                  <option value="">All statuses</option>
                  <option value={ServerStatus.ONLINE}>Online</option>
                  <option value={ServerStatus.OFFLINE}>Offline</option>
                  <option value={ServerStatus.ERROR}>Error</option>
                </chakra.select>
              </chakra.div>

              <chakra.div>
                <chakra.label
                  display="block"
                  fontSize="sm"
                  fontWeight="medium"
                  mb="1"
                >
                  Options
                </chakra.label>
                <chakra.label alignItems="center" display="flex" gap="2">
                  <chakra.input
                    checked={serverFilters.enabled_only}
                    onChange={(e) =>
                      setServerFilters({ enabled_only: e.target.checked })
                    }
                    type="checkbox"
                  />
                  <chakra.span fontSize="sm">Enabled only</chakra.span>
                </chakra.label>
              </chakra.div>
            </chakra.div>
          )}
        </chakra.div>

        {/* Error State */}
        {error && (
          <chakra.div
            _dark={{ bg: 'red.900', borderColor: 'red.700' }}
            bg="red.50"
            border="1px solid"
            borderColor="red.200"
            borderRadius="md"
            p="4"
          >
            <chakra.h3
              _dark={{ color: 'red.200' }}
              color="red.800"
              fontWeight="semibold"
            >
              Error loading servers
            </chakra.h3>
            <chakra.p _dark={{ color: 'red.300' }} color="red.700">
              {error.message || 'An unknown error occurred'}
            </chakra.p>
          </chakra.div>
        )}

        {/* Loading State */}
        {isLoading && !serversData && (
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
                Loading servers...
              </chakra.p>
            </chakra.div>
          </chakra.div>
        )}

        {/* Servers List */}
        {serversData && (
          <chakra.div
            _dark={{ bg: 'gray.900' }}
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            overflow="hidden"
          >
            {serversData.servers.length === 0 ? (
              <chakra.div p="8" textAlign="center">
                <FiServer
                  color="var(--chakra-colors-gray-400)"
                  size={48}
                  style={{ margin: '0 auto 16px' }}
                />
                <chakra.h3 fontSize="lg" fontWeight="semibold" mb="2">
                  No servers found
                </chakra.h3>
                <chakra.p _dark={{ color: 'gray.400' }} color="gray.600" mb="4">
                  {serverFilters.search ||
                  serverFilters.status ||
                  serverFilters.enabled_only
                    ? 'No servers match your current filters.'
                    : 'Get started by adding your first server.'}
                </chakra.p>
                <Link to="/servers/new">
                  <chakra.button
                    _hover={{ bg: 'blue.600' }}
                    bg="blue.500"
                    borderRadius="md"
                    color="white"
                    px="4"
                    py="2"
                  >
                    Add Server
                  </chakra.button>
                </Link>
              </chakra.div>
            ) : (
              <>
                {/* Table Header */}
                <chakra.div
                  _dark={{ borderColor: 'gray.700', bg: 'gray.800', color: 'gray.400' }}
                  bg="gray.50"
                  borderBottomWidth="1px"
                  borderColor="gray.200"
                  color="gray.600"
                  display="grid"
                  fontSize="sm"
                  fontWeight="semibold"
                  gap="4"
                  gridTemplateColumns="1fr 120px 150px 150px 120px"
                  p="4"
                >
                  <chakra.div>Server</chakra.div>
                  <chakra.div>Status</chakra.div>
                  <chakra.div>Last Seen</chakra.div>
                  <chakra.div>System</chakra.div>
                  <chakra.div>Actions</chakra.div>
                </chakra.div>

                {/* Table Rows */}
                {serversData.servers.map((server) => (
                  <chakra.div
                    _dark={{ borderColor: 'gray.700' }}
                    _hover={{ bg: 'gray.50', _dark: { bg: 'gray.800' } }}
                    alignItems="center"
                    borderBottomWidth="1px"
                    borderColor="gray.200"
                    display="grid"
                    gap="4"
                    gridTemplateColumns="1fr 120px 150px 150px 120px"
                    key={server.id}
                    p="4"
                  >
                    {/* Server Info */}
                    <chakra.div>
                      <chakra.div alignItems="center" display="flex" gap="3">
                        {getStatusIcon(server.status)}
                        <chakra.div>
                          <chakra.h4 fontSize="sm" fontWeight="medium">
                            {server.display_name || server.hostname}
                          </chakra.h4>
                          <chakra.p color="gray.500" fontSize="xs">
                            {server.ip_address}
                          </chakra.p>
                          {server.description && (
                            <chakra.p color="gray.500" fontSize="xs" mt="1">
                              {server.description}
                            </chakra.p>
                          )}
                        </chakra.div>
                      </chakra.div>
                    </chakra.div>

                    {/* Status */}
                    <chakra.div>
                      <chakra.span
                        _dark={{
                          bg: `${getServerStatusColor(server.status)}.900`,
                          color: `${getServerStatusColor(server.status)}.200`,
                        }}
                        bg={`${getServerStatusColor(server.status)}.100`}
                        borderRadius="full"
                        color={`${getServerStatusColor(server.status)}.800`}
                        fontSize="xs"
                        px="2"
                        py="1"
                        textTransform="capitalize"
                      >
                        {server.status}
                      </chakra.span>
                    </chakra.div>

                    {/* Last Seen */}
                    <chakra.div
                      _dark={{ color: 'gray.400' }}
                      color="gray.600"
                      fontSize="sm"
                    >
                      {server.last_seen
                        ? formatRelativeTime(server.last_seen)
                        : 'Never'}
                    </chakra.div>

                    {/* System Info */}
                    <chakra.div
                      _dark={{ color: 'gray.400' }}
                      color="gray.600"
                      fontSize="sm"
                    >
                      {server.os_name ? (
                        <chakra.div>
                          <chakra.div>{server.os_name}</chakra.div>
                          {server.cpu_cores && (
                            <chakra.div fontSize="xs">
                              {server.cpu_cores} cores
                            </chakra.div>
                          )}
                        </chakra.div>
                      ) : (
                        'Unknown'
                      )}
                    </chakra.div>

                    {/* Actions */}
                    <chakra.div display="flex" gap="1">
                      <chakra.button
                        _hover={{ bg: 'blue.100', _dark: { bg: 'blue.900' } }}
                        aria-label="View server"
                        bg="transparent"
                        borderRadius="md"
                        color="blue.500"
                        onClick={() => navigate(`/servers/${server.id}`)}
                        p="1"
                      >
                        <FiEye size={16} />
                      </chakra.button>

                      <chakra.button
                        _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
                        aria-label="Edit server"
                        bg="transparent"
                        borderRadius="md"
                        color="gray.500"
                        onClick={() => navigate(`/servers/${server.id}/edit`)}
                        p="1"
                      >
                        <FiEdit2 size={16} />
                      </chakra.button>

                      <chakra.button
                        _hover={{ bg: 'red.100', _dark: { bg: 'red.900' } }}
                        aria-label="Delete server"
                        bg="transparent"
                        borderRadius="md"
                        color="red.500"
                        disabled={deleteServerMutation.isPending}
                        onClick={() => handleDeleteServer(server)}
                        p="1"
                      >
                        <FiTrash2 size={16} />
                      </chakra.button>
                    </chakra.div>
                  </chakra.div>
                ))}
              </>
            )}
          </chakra.div>
        )}

        {/* Pagination */}
        {serversData && serversData.total_pages > 1 && (
          <chakra.div display="flex" gap="2" justifyContent="center">
            <chakra.button
              _dark={{ borderColor: 'gray.600' }}
              _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              borderColor="gray.300"
              borderRadius="md"
              borderWidth="1px"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              px="3"
              py="2"
            >
              Previous
            </chakra.button>

            <chakra.div alignItems="center" display="flex" px="4">
              <chakra.span
                _dark={{ color: 'gray.400' }}
                color="gray.600"
                fontSize="sm"
              >
                Page {page} of {serversData.total_pages}
              </chakra.span>
            </chakra.div>

            <chakra.button
              _dark={{ borderColor: 'gray.600' }}
              _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              borderColor="gray.300"
              borderRadius="md"
              borderWidth="1px"
              disabled={page === serversData.total_pages}
              onClick={() => setPage(page + 1)}
              px="3"
              py="2"
            >
              Next
            </chakra.button>
          </chakra.div>
        )}
      </chakra.div>
    </chakra.div>
  );
};

export default Servers;
