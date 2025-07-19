/**
 * Services list page - view and manage all services
 */

import { chakra } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFileText,
  FiFilter,
  FiPause,
  FiPlay,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
  FiServer,
  FiXCircle,
} from 'react-icons/fi';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useControlService, useServiceLogs, useServices } from '@/hooks/useApi';
import { useServiceStore, useUIStore } from '@/store';
import { type Service, ServiceStatus, ServiceType } from '@/types';
import { formatRelativeTime, getServiceStatusColor } from '@/utils';

const Services: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setPageTitle, setBreadcrumbs, addNotification } = useUIStore();
  const { serviceFilters, setServiceFilters, clearServiceFilters } =
    useServiceStore();

  const [searchTerm, setSearchTerm] = useState(serviceFilters.search || '');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Get server_id from URL params if present
  const serverIdFromUrl = searchParams.get('server_id');
  const currentServerId = serverIdFromUrl
    ? Number.parseInt(serverIdFromUrl, 10)
    : serviceFilters.server_id;

  const {
    data: servicesData,
    isLoading,
    error,
    refetch,
  } = useServices({
    page,
    per_page: 20,
    server_id: currentServerId,
    search: serviceFilters.search,
    status_filter: serviceFilters.status_filter as ServiceStatus,
    service_type: serviceFilters.service_type as ServiceType,
    enabled_only: serviceFilters.enabled_only,
  });

  const controlServiceMutation = useControlService();
  const serviceLogsMutation = useServiceLogs();

  useEffect(() => {
    setPageTitle('Services');
    setBreadcrumbs([{ label: 'Dashboard', href: '/' }, { label: 'Services' }]);

    // Set server filter from URL params
    if (serverIdFromUrl && !serviceFilters.server_id) {
      setServiceFilters({ server_id: Number.parseInt(serverIdFromUrl, 10) });
    }
  }, [
    setPageTitle,
    setBreadcrumbs,
    serverIdFromUrl,
    serviceFilters.server_id,
    setServiceFilters,
  ]);

  const handleSearch = () => {
    setServiceFilters({ search: searchTerm });
    setPage(1);
  };

  const handleClearFilters = () => {
    clearServiceFilters();
    setSearchTerm('');
    setPage(1);
    // Clear URL params
    navigate('/services', { replace: true });
  };

  const handleServiceControl = async (
    service: Service,
    action: 'start' | 'stop' | 'restart'
  ) => {
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

  const handleViewLogs = async (service: Service) => {
    try {
      const result = await serviceLogsMutation.mutateAsync({
        serviceId: service.id,
        lines: 100,
      });

      // For now, just show success/error - in a real app you'd open a modal or navigate to logs page
      addNotification({
        type: result.success ? 'info' : 'error',
        message: result.success
          ? `Retrieved ${result.lines_returned} log lines for ${service.name}`
          : `Failed to retrieve logs: ${result.logs}`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to retrieve logs: ${error}`,
      });
    }
  };

  const getStatusIcon = (service: Service) => {
    if (service.is_active) {
      return <FiCheckCircle color="var(--chakra-colors-green-500)" />;
    }
    if (service.is_failed) {
      return <FiXCircle color="var(--chakra-colors-red-500)" />;
    }
    return <FiAlertCircle color="var(--chakra-colors-gray-500)" />;
  };

  const getServiceTypeIcon = (type: ServiceType) => {
    switch (type) {
      case ServiceType.SYSTEMD:
        return <FiActivity size={16} />;
      case ServiceType.DOCKER:
        return <FiServer size={16} />;
      case ServiceType.CUSTOM:
        return <FiClock size={16} />;
      default:
        return <FiActivity size={16} />;
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
              Services
            </chakra.h1>
            <chakra.p _dark={{ color: 'gray.400' }} color="gray.600">
              Monitor and control systemd services across your servers
            </chakra.p>
          </chakra.div>

          <chakra.div display="flex" gap="2">
            <chakra.button
              _disabled={{ opacity: 0.5 }}
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              aria-label="Refresh services"
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
                placeholder="Search services..."
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
            {(serviceFilters.search ||
              serviceFilters.server_id ||
              serviceFilters.status_filter ||
              serviceFilters.service_type ||
              serviceFilters.enabled_only) && (
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
                    setServiceFilters({
                      status_filter: e.target.value || undefined,
                    })
                  }
                  px="3"
                  py="2"
                  value={serviceFilters.status_filter || ''}
                >
                  <option value="">All statuses</option>
                  <option value={ServiceStatus.ACTIVE}>Active</option>
                  <option value={ServiceStatus.INACTIVE}>Inactive</option>
                  <option value={ServiceStatus.FAILED}>Failed</option>
                  <option value={ServiceStatus.ACTIVATING}>Activating</option>
                  <option value={ServiceStatus.DEACTIVATING}>
                    Deactivating
                  </option>
                </chakra.select>
              </chakra.div>

              <chakra.div>
                <chakra.label
                  display="block"
                  fontSize="sm"
                  fontWeight="medium"
                  mb="1"
                >
                  Type
                </chakra.label>
                <chakra.select
                  _dark={{ borderColor: 'gray.600' }}
                  borderColor="gray.300"
                  borderRadius="md"
                  borderWidth="1px"
                  onChange={(e) =>
                    setServiceFilters({
                      service_type: e.target.value || undefined,
                    })
                  }
                  px="3"
                  py="2"
                  value={serviceFilters.service_type || ''}
                >
                  <option value="">All types</option>
                  <option value={ServiceType.SYSTEMD}>Systemd</option>
                  <option value={ServiceType.DOCKER}>Docker</option>
                  <option value={ServiceType.CUSTOM}>Custom</option>
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
                    checked={serviceFilters.enabled_only}
                    onChange={(e) =>
                      setServiceFilters({ enabled_only: e.target.checked })
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
              Error loading services
            </chakra.h3>
            <chakra.p _dark={{ color: 'red.300' }} color="red.700">
              {error.message || 'An unknown error occurred'}
            </chakra.p>
          </chakra.div>
        )}

        {/* Loading State */}
        {isLoading && !servicesData && (
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
                Loading services...
              </chakra.p>
            </chakra.div>
          </chakra.div>
        )}

        {/* Services List */}
        {servicesData && (
          <chakra.div
            _dark={{ bg: 'gray.900' }}
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            overflow="hidden"
          >
            {servicesData.services.length === 0 ? (
              <chakra.div p="8" textAlign="center">
                <FiActivity
                  color="var(--chakra-colors-gray-400)"
                  size={48}
                  style={{ margin: '0 auto 16px' }}
                />
                <chakra.h3 fontSize="lg" fontWeight="semibold" mb="2">
                  No services found
                </chakra.h3>
                <chakra.p _dark={{ color: 'gray.400' }} color="gray.600" mb="4">
                  {serviceFilters.search ||
                  serviceFilters.server_id ||
                  serviceFilters.status_filter ||
                  serviceFilters.service_type ||
                  serviceFilters.enabled_only
                    ? 'No services match your current filters.'
                    : 'No services are currently being monitored.'}
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
                    Manage Servers
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
                  gridTemplateColumns="1fr 100px 120px 150px 120px 140px"
                  p="4"
                >
                  <chakra.div>Service</chakra.div>
                  <chakra.div>Type</chakra.div>
                  <chakra.div>Status</chakra.div>
                  <chakra.div>Server</chakra.div>
                  <chakra.div>Last Check</chakra.div>
                  <chakra.div>Actions</chakra.div>
                </chakra.div>

                {/* Table Rows */}
                {servicesData.services.map((service) => (
                  <chakra.div
                    _dark={{ borderColor: 'gray.700' }}
                    _hover={{ bg: 'gray.50', _dark: { bg: 'gray.800' } }}
                    alignItems="center"
                    borderBottomWidth="1px"
                    borderColor="gray.200"
                    display="grid"
                    gap="4"
                    gridTemplateColumns="1fr 100px 120px 150px 120px 140px"
                    key={service.id}
                    p="4"
                  >
                    {/* Service Info */}
                    <chakra.div>
                      <chakra.div alignItems="center" display="flex" gap="3">
                        {getStatusIcon(service)}
                        <chakra.div>
                          <chakra.h4 fontSize="sm" fontWeight="medium">
                            {service.display_name || service.name}
                          </chakra.h4>
                          <chakra.p color="gray.500" fontSize="xs">
                            {service.name}
                          </chakra.p>
                          {service.description && (
                            <chakra.p color="gray.500" fontSize="xs" mt="1">
                              {service.description}
                            </chakra.p>
                          )}
                        </chakra.div>
                      </chakra.div>
                    </chakra.div>

                    {/* Type */}
                    <chakra.div
                      alignItems="center"
                      display="flex"
                      fontSize="sm"
                      gap="2"
                    >
                      {getServiceTypeIcon(service.service_type)}
                      <chakra.span textTransform="capitalize">
                        {service.service_type}
                      </chakra.span>
                    </chakra.div>

                    {/* Status */}
                    <chakra.div>
                      <chakra.span
                        _dark={{
                          bg: `${getServiceStatusColor(service.status)}.900`,
                          color: `${getServiceStatusColor(service.status)}.200`,
                        }}
                        bg={`${getServiceStatusColor(service.status)}.100`}
                        borderRadius="full"
                        color={`${getServiceStatusColor(service.status)}.800`}
                        fontSize="xs"
                        px="2"
                        py="1"
                        textTransform="capitalize"
                      >
                        {service.status}
                      </chakra.span>
                    </chakra.div>

                    {/* Server */}
                    <chakra.div
                      _dark={{ color: 'gray.400' }}
                      color="gray.600"
                      fontSize="sm"
                    >
                      <Link to={`/servers/${service.server_id}`}>
                        <chakra.span
                          _hover={{
                            color: 'blue.500',
                            textDecoration: 'underline',
                          }}
                        >
                          {service.server_hostname}
                        </chakra.span>
                      </Link>
                    </chakra.div>

                    {/* Last Check */}
                    <chakra.div
                      _dark={{ color: 'gray.400' }}
                      color="gray.600"
                      fontSize="sm"
                    >
                      {service.last_status_check
                        ? formatRelativeTime(service.last_status_check)
                        : 'Never'}
                    </chakra.div>

                    {/* Actions */}
                    <chakra.div display="flex" gap="1">
                      {service.is_managed && (
                        <>
                          {!service.is_active && (
                            <chakra.button
                              _hover={{
                                bg: 'green.100',
                                _dark: { bg: 'green.900' },
                              }}
                              aria-label="Start service"
                              bg="transparent"
                              borderRadius="md"
                              color="green.500"
                              disabled={controlServiceMutation.isPending}
                              onClick={() =>
                                handleServiceControl(service, 'start')
                              }
                              p="1"
                              title="Start service"
                            >
                              <FiPlay size={14} />
                            </chakra.button>
                          )}

                          {service.is_active && (
                            <chakra.button
                              _hover={{
                                bg: 'red.100',
                                _dark: { bg: 'red.900' },
                              }}
                              aria-label="Stop service"
                              bg="transparent"
                              borderRadius="md"
                              color="red.500"
                              disabled={controlServiceMutation.isPending}
                              onClick={() =>
                                handleServiceControl(service, 'stop')
                              }
                              p="1"
                              title="Stop service"
                            >
                              <FiPause size={14} />
                            </chakra.button>
                          )}

                          <chakra.button
                            _hover={{
                              bg: 'blue.100',
                              _dark: { bg: 'blue.900' },
                            }}
                            aria-label="Restart service"
                            bg="transparent"
                            borderRadius="md"
                            color="blue.500"
                            disabled={controlServiceMutation.isPending}
                            onClick={() =>
                              handleServiceControl(service, 'restart')
                            }
                            p="1"
                            title="Restart service"
                          >
                            <FiRotateCcw size={14} />
                          </chakra.button>
                        </>
                      )}

                      <chakra.button
                        _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
                        aria-label="View logs"
                        bg="transparent"
                        borderRadius="md"
                        color="gray.500"
                        disabled={serviceLogsMutation.isPending}
                        onClick={() => handleViewLogs(service)}
                        p="1"
                        title="View logs"
                      >
                        <FiFileText size={14} />
                      </chakra.button>

                      <chakra.button
                        _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
                        aria-label="View details"
                        bg="transparent"
                        borderRadius="md"
                        color="gray.500"
                        onClick={() => navigate(`/services/${service.id}`)}
                        p="1"
                        title="View details"
                      >
                        <FiEye size={14} />
                      </chakra.button>
                    </chakra.div>
                  </chakra.div>
                ))}
              </>
            )}
          </chakra.div>
        )}

        {/* Pagination */}
        {servicesData && servicesData.total_pages > 1 && (
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
                Page {page} of {servicesData.total_pages}
              </chakra.span>
            </chakra.div>

            <chakra.button
              _dark={{ borderColor: 'gray.600' }}
              _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              borderColor="gray.300"
              borderRadius="md"
              borderWidth="1px"
              disabled={page === servicesData.total_pages}
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

export default Services;
