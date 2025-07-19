/**
 * Servers list page - view and manage all servers
 */

import { useEffect, useState } from 'react';
import { chakra } from '@chakra-ui/react';
import {
  FiServer,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiWifi,
  FiWifiOff,
  FiAlertCircle,
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useUIStore, useServerStore } from '@/store';
import { useServers, useDeleteServer } from '@/hooks/useApi';
import { ServerStatus, type Server } from '@/types';
import { formatRelativeTime, getServerStatusColor } from '@/utils';

const Servers: React.FC = () => {
  const navigate = useNavigate();
  const { setPageTitle, setBreadcrumbs, addNotification } = useUIStore();
  const { serverFilters, setServerFilters, clearServerFilters } = useServerStore();
  
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
    setBreadcrumbs([
      { label: 'Dashboard', href: '/' },
      { label: 'Servers' },
    ]);
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
    if (window.confirm(`Are you sure you want to delete server "${server.hostname}"? This action cannot be undone.`)) {
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
      <chakra.div display="flex" flexDirection="column" gap="6" alignItems="stretch">
        {/* Header */}
        <chakra.div display="flex" justifyContent="space-between" alignItems="flex-start">
          <chakra.div>
            <chakra.h1 fontSize="2xl" fontWeight="bold" color="gray.900" _dark={{ color: 'white' }}>
              Servers
            </chakra.h1>
            <chakra.p color="gray.600" _dark={{ color: 'gray.400' }}>
              Manage your Linux servers and monitor their status
            </chakra.p>
          </chakra.div>

          <chakra.div display="flex" gap="2">
            <chakra.button
              aria-label="Refresh servers"
              onClick={() => refetch()}
              p="2"
              bg="transparent"
              borderWidth="1px"
              borderColor="gray.300"
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              borderRadius="md"
              disabled={isLoading}
              _disabled={{ opacity: 0.5 }}
            >
              <chakra.div animation={isLoading ? 'spin 1s linear infinite' : undefined}>
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

        {/* Search and Filters */}
        <chakra.div
          bg="white"
          _dark={{ bg: 'gray.900' }}
          borderRadius="lg"
          boxShadow="sm"
          p="4"
        >
          <chakra.div display="flex" gap="4" alignItems="center" flexWrap="wrap">
            {/* Search */}
            <chakra.div display="flex" gap="2" flex="1" minW="300px">
              <chakra.input
                placeholder="Search servers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                px="3"
                py="2"
                borderWidth="1px"
                borderColor="gray.300"
                _dark={{ borderColor: 'gray.600' }}
                borderRadius="md"
                flex="1"
              />
              <chakra.button
                onClick={handleSearch}
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
                <FiSearch />
                <chakra.span display={{ base: 'none', md: 'inline' }}>Search</chakra.span>
              </chakra.button>
            </chakra.div>

            {/* Filter Toggle */}
            <chakra.button
              onClick={() => setShowFilters(!showFilters)}
              borderWidth="1px"
              borderColor="gray.300"
              _dark={{ borderColor: 'gray.600' }}
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              px="4"
              py="2"
              borderRadius="md"
              display="flex"
              alignItems="center"
              gap="2"
            >
              <FiFilter />
              <chakra.span>Filters</chakra.span>
            </chakra.button>

            {/* Clear Filters */}
            {(serverFilters.search || serverFilters.status || serverFilters.enabled_only) && (
              <chakra.button
                onClick={handleClearFilters}
                color="red.500"
                _hover={{ color: 'red.600' }}
                fontSize="sm"
              >
                Clear Filters
              </chakra.button>
            )}
          </chakra.div>

          {/* Expanded Filters */}
          {showFilters && (
            <chakra.div 
              mt="4" 
              pt="4" 
              borderTopWidth="1px" 
              borderColor="gray.200" 
              _dark={{ borderColor: 'gray.700' }}
              display="flex" 
              gap="4" 
              flexWrap="wrap"
            >
              <chakra.div>
                <chakra.label fontSize="sm" fontWeight="medium" mb="1" display="block">
                  Status
                </chakra.label>
                <chakra.select
                  value={serverFilters.status || ''}
                  onChange={(e) => setServerFilters({ status: e.target.value || undefined })}
                  px="3"
                  py="2"
                  borderWidth="1px"
                  borderColor="gray.300"
                  _dark={{ borderColor: 'gray.600' }}
                  borderRadius="md"
                >
                  <option value="">All statuses</option>
                  <option value={ServerStatus.ONLINE}>Online</option>
                  <option value={ServerStatus.OFFLINE}>Offline</option>
                  <option value={ServerStatus.ERROR}>Error</option>
                </chakra.select>
              </chakra.div>

              <chakra.div>
                <chakra.label fontSize="sm" fontWeight="medium" mb="1" display="block">
                  Options
                </chakra.label>
                <chakra.label display="flex" alignItems="center" gap="2">
                  <chakra.input
                    type="checkbox"
                    checked={serverFilters.enabled_only || false}
                    onChange={(e) => setServerFilters({ enabled_only: e.target.checked })}
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
            bg="red.50"
            _dark={{ bg: 'red.900', borderColor: 'red.700' }}
            border="1px solid"
            borderColor="red.200"
            borderRadius="md"
            p="4"
          >
            <chakra.h3 fontWeight="semibold" color="red.800" _dark={{ color: 'red.200' }}>
              Error loading servers
            </chakra.h3>
            <chakra.p color="red.700" _dark={{ color: 'red.300' }}>
              {error.message || 'An unknown error occurred'}
            </chakra.p>
          </chakra.div>
        )}

        {/* Loading State */}
        {isLoading && !serversData && (
          <chakra.div
            bg="white"
            _dark={{ bg: 'gray.900' }}
            borderRadius="lg"
            boxShadow="sm"
            p="8"
          >
            <chakra.div display="flex" flexDirection="column" alignItems="center" gap="4">
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
                Loading servers...
              </chakra.p>
            </chakra.div>
          </chakra.div>
        )}

        {/* Servers List */}
        {serversData && (
          <chakra.div
            bg="white"
            _dark={{ bg: 'gray.900' }}
            borderRadius="lg"
            boxShadow="sm"
            overflow="hidden"
          >
            {serversData.servers.length === 0 ? (
              <chakra.div p="8" textAlign="center">
                <FiServer size={48} color="var(--chakra-colors-gray-400)" style={{ margin: '0 auto 16px' }} />
                <chakra.h3 fontSize="lg" fontWeight="semibold" mb="2">
                  No servers found
                </chakra.h3>
                <chakra.p color="gray.600" _dark={{ color: 'gray.400' }} mb="4">
                  {serverFilters.search || serverFilters.status || serverFilters.enabled_only
                    ? 'No servers match your current filters.'
                    : 'Get started by adding your first server.'}
                </chakra.p>
                <Link to="/servers/new">
                  <chakra.button
                    bg="blue.500"
                    color="white"
                    px="4"
                    py="2"
                    borderRadius="md"
                    _hover={{ bg: 'blue.600' }}
                  >
                    Add Server
                  </chakra.button>
                </Link>
              </chakra.div>
            ) : (
              <>
                {/* Table Header */}
                <chakra.div
                  display="grid"
                  gridTemplateColumns="1fr 120px 150px 150px 120px"
                  gap="4"
                  p="4"
                  borderBottomWidth="1px"
                  borderColor="gray.200"
                  _dark={{ borderColor: 'gray.700' }}
                  bg="gray.50"
                  _dark={{ bg: 'gray.800' }}
                  fontWeight="semibold"
                  fontSize="sm"
                  color="gray.600"
                  _dark={{ color: 'gray.400' }}
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
                    key={server.id}
                    display="grid"
                    gridTemplateColumns="1fr 120px 150px 150px 120px"
                    gap="4"
                    p="4"
                    borderBottomWidth="1px"
                    borderColor="gray.200"
                    _dark={{ borderColor: 'gray.700' }}
                    _hover={{ bg: 'gray.50', _dark: { bg: 'gray.800' } }}
                    alignItems="center"
                  >
                    {/* Server Info */}
                    <chakra.div>
                      <chakra.div display="flex" alignItems="center" gap="3">
                        {getStatusIcon(server.status)}
                        <chakra.div>
                          <chakra.h4 fontWeight="medium" fontSize="sm">
                            {server.display_name || server.hostname}
                          </chakra.h4>
                          <chakra.p fontSize="xs" color="gray.500">
                            {server.ip_address}
                          </chakra.p>
                          {server.description && (
                            <chakra.p fontSize="xs" color="gray.500" mt="1">
                              {server.description}
                            </chakra.p>
                          )}
                        </chakra.div>
                      </chakra.div>
                    </chakra.div>

                    {/* Status */}
                    <chakra.div>
                      <chakra.span
                        bg={`${getServerStatusColor(server.status)}.100`}
                        color={`${getServerStatusColor(server.status)}.800`}
                        _dark={{
                          bg: `${getServerStatusColor(server.status)}.900`,
                          color: `${getServerStatusColor(server.status)}.200`,
                        }}
                        fontSize="xs"
                        px="2"
                        py="1"
                        borderRadius="full"
                        textTransform="capitalize"
                      >
                        {server.status}
                      </chakra.span>
                    </chakra.div>

                    {/* Last Seen */}
                    <chakra.div fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                      {server.last_seen ? formatRelativeTime(server.last_seen) : 'Never'}
                    </chakra.div>

                    {/* System Info */}
                    <chakra.div fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
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
                        aria-label="View server"
                        onClick={() => navigate(`/servers/${server.id}`)}
                        p="1"
                        bg="transparent"
                        _hover={{ bg: 'blue.100', _dark: { bg: 'blue.900' } }}
                        borderRadius="md"
                        color="blue.500"
                      >
                        <FiEye size={16} />
                      </chakra.button>
                      
                      <chakra.button
                        aria-label="Edit server"
                        onClick={() => navigate(`/servers/${server.id}/edit`)}
                        p="1"
                        bg="transparent"
                        _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
                        borderRadius="md"
                        color="gray.500"
                      >
                        <FiEdit2 size={16} />
                      </chakra.button>
                      
                      <chakra.button
                        aria-label="Delete server"
                        onClick={() => handleDeleteServer(server)}
                        p="1"
                        bg="transparent"
                        _hover={{ bg: 'red.100', _dark: { bg: 'red.900' } }}
                        borderRadius="md"
                        color="red.500"
                        disabled={deleteServerMutation.isPending}
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
          <chakra.div display="flex" justifyContent="center" gap="2">
            <chakra.button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              px="3"
              py="2"
              borderWidth="1px"
              borderColor="gray.300"
              _dark={{ borderColor: 'gray.600' }}
              borderRadius="md"
              _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
            >
              Previous
            </chakra.button>
            
            <chakra.div display="flex" alignItems="center" px="4">
              <chakra.span fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                Page {page} of {serversData.total_pages}
              </chakra.span>
            </chakra.div>
            
            <chakra.button
              onClick={() => setPage(page + 1)}
              disabled={page === serversData.total_pages}
              px="3"
              py="2"
              borderWidth="1px"
              borderColor="gray.300"
              _dark={{ borderColor: 'gray.600' }}
              borderRadius="md"
              _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
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