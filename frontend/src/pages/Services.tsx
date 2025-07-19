/**
 * Services list page - view and manage all services
 */

import { useEffect, useState } from 'react';
import { chakra } from '@chakra-ui/react';
import {
  FiActivity,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiPlay,
  FiPause,
  FiRotateCcw,
  FiEye,
  FiFileText,
  FiServer,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useUIStore, useServiceStore } from '@/store';
import { useServices, useControlService, useServiceLogs } from '@/hooks/useApi';
import { ServiceStatus, ServiceType, type Service } from '@/types';
import { formatRelativeTime, getServiceStatusColor } from '@/utils';

const Services: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setPageTitle, setBreadcrumbs, addNotification } = useUIStore();
  const { serviceFilters, setServiceFilters, clearServiceFilters } = useServiceStore();
  
  const [searchTerm, setSearchTerm] = useState(serviceFilters.search || '');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Get server_id from URL params if present
  const serverIdFromUrl = searchParams.get('server_id');
  const currentServerId = serverIdFromUrl ? parseInt(serverIdFromUrl, 10) : serviceFilters.server_id;

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
    setBreadcrumbs([
      { label: 'Dashboard', href: '/' },
      { label: 'Services' },
    ]);

    // Set server filter from URL params
    if (serverIdFromUrl && !serviceFilters.server_id) {
      setServiceFilters({ server_id: parseInt(serverIdFromUrl, 10) });
    }
  }, [setPageTitle, setBreadcrumbs, serverIdFromUrl, serviceFilters.server_id, setServiceFilters]);

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

  const handleServiceControl = async (service: Service, action: 'start' | 'stop' | 'restart') => {
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
    } else if (service.is_failed) {
      return <FiXCircle color="var(--chakra-colors-red-500)" />;
    } else {
      return <FiAlertCircle color="var(--chakra-colors-gray-500)" />;
    }
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
      <chakra.div display="flex" flexDirection="column" gap="6" alignItems="stretch">
        {/* Header */}
        <chakra.div display="flex" justifyContent="space-between" alignItems="flex-start">
          <chakra.div>
            <chakra.h1 fontSize="2xl" fontWeight="bold" color="gray.900" _dark={{ color: 'white' }}>
              Services
            </chakra.h1>
            <chakra.p color="gray.600" _dark={{ color: 'gray.400' }}>
              Monitor and control systemd services across your servers
            </chakra.p>
          </chakra.div>

          <chakra.div display="flex" gap="2">
            <chakra.button
              aria-label="Refresh services"
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
                placeholder="Search services..."
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
            {(serviceFilters.search || serviceFilters.server_id || serviceFilters.status_filter || serviceFilters.service_type || serviceFilters.enabled_only) && (
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
                  value={serviceFilters.status_filter || ''}
                  onChange={(e) => setServiceFilters({ status_filter: e.target.value || undefined })}
                  px="3"
                  py="2"
                  borderWidth="1px"
                  borderColor="gray.300"
                  _dark={{ borderColor: 'gray.600' }}
                  borderRadius="md"
                >
                  <option value="">All statuses</option>
                  <option value={ServiceStatus.ACTIVE}>Active</option>
                  <option value={ServiceStatus.INACTIVE}>Inactive</option>
                  <option value={ServiceStatus.FAILED}>Failed</option>
                  <option value={ServiceStatus.ACTIVATING}>Activating</option>
                  <option value={ServiceStatus.DEACTIVATING}>Deactivating</option>
                </chakra.select>
              </chakra.div>

              <chakra.div>
                <chakra.label fontSize="sm" fontWeight="medium" mb="1" display="block">
                  Type
                </chakra.label>
                <chakra.select
                  value={serviceFilters.service_type || ''}
                  onChange={(e) => setServiceFilters({ service_type: e.target.value || undefined })}
                  px="3"
                  py="2"
                  borderWidth="1px"
                  borderColor="gray.300"
                  _dark={{ borderColor: 'gray.600' }}
                  borderRadius="md"
                >
                  <option value="">All types</option>
                  <option value={ServiceType.SYSTEMD}>Systemd</option>
                  <option value={ServiceType.DOCKER}>Docker</option>
                  <option value={ServiceType.CUSTOM}>Custom</option>
                </chakra.select>
              </chakra.div>

              <chakra.div>
                <chakra.label fontSize="sm" fontWeight="medium" mb="1" display="block">
                  Options
                </chakra.label>
                <chakra.label display="flex" alignItems="center" gap="2">
                  <chakra.input
                    type="checkbox"
                    checked={serviceFilters.enabled_only || false}
                    onChange={(e) => setServiceFilters({ enabled_only: e.target.checked })}
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
              Error loading services
            </chakra.h3>
            <chakra.p color="red.700" _dark={{ color: 'red.300' }}>
              {error.message || 'An unknown error occurred'}
            </chakra.p>
          </chakra.div>
        )}

        {/* Loading State */}
        {isLoading && !servicesData && (
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
                Loading services...
              </chakra.p>
            </chakra.div>
          </chakra.div>
        )}

        {/* Services List */}
        {servicesData && (
          <chakra.div
            bg="white"
            _dark={{ bg: 'gray.900' }}
            borderRadius="lg"
            boxShadow="sm"
            overflow="hidden"
          >
            {servicesData.services.length === 0 ? (
              <chakra.div p="8" textAlign="center">
                <FiActivity size={48} color="var(--chakra-colors-gray-400)" style={{ margin: '0 auto 16px' }} />
                <chakra.h3 fontSize="lg" fontWeight="semibold" mb="2">
                  No services found
                </chakra.h3>
                <chakra.p color="gray.600" _dark={{ color: 'gray.400' }} mb="4">
                  {serviceFilters.search || serviceFilters.server_id || serviceFilters.status_filter || serviceFilters.service_type || serviceFilters.enabled_only
                    ? 'No services match your current filters.'
                    : 'No services are currently being monitored.'}
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
                    Manage Servers
                  </chakra.button>
                </Link>
              </chakra.div>
            ) : (
              <>
                {/* Table Header */}
                <chakra.div
                  display="grid"
                  gridTemplateColumns="1fr 100px 120px 150px 120px 140px"
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
                    key={service.id}
                    display="grid"
                    gridTemplateColumns="1fr 100px 120px 150px 120px 140px"
                    gap="4"
                    p="4"
                    borderBottomWidth="1px"
                    borderColor="gray.200"
                    _dark={{ borderColor: 'gray.700' }}
                    _hover={{ bg: 'gray.50', _dark: { bg: 'gray.800' } }}
                    alignItems="center"
                  >
                    {/* Service Info */}
                    <chakra.div>
                      <chakra.div display="flex" alignItems="center" gap="3">
                        {getStatusIcon(service)}
                        <chakra.div>
                          <chakra.h4 fontWeight="medium" fontSize="sm">
                            {service.display_name || service.name}
                          </chakra.h4>
                          <chakra.p fontSize="xs" color="gray.500">
                            {service.name}
                          </chakra.p>
                          {service.description && (
                            <chakra.p fontSize="xs" color="gray.500" mt="1">
                              {service.description}
                            </chakra.p>
                          )}
                        </chakra.div>
                      </chakra.div>
                    </chakra.div>

                    {/* Type */}
                    <chakra.div display="flex" alignItems="center" gap="2" fontSize="sm">
                      {getServiceTypeIcon(service.service_type)}
                      <chakra.span textTransform="capitalize">{service.service_type}</chakra.span>
                    </chakra.div>

                    {/* Status */}
                    <chakra.div>
                      <chakra.span
                        bg={`${getServiceStatusColor(service.status)}.100`}
                        color={`${getServiceStatusColor(service.status)}.800`}
                        _dark={{
                          bg: `${getServiceStatusColor(service.status)}.900`,
                          color: `${getServiceStatusColor(service.status)}.200`,
                        }}
                        fontSize="xs"
                        px="2"
                        py="1"
                        borderRadius="full"
                        textTransform="capitalize"
                      >
                        {service.status}
                      </chakra.span>
                    </chakra.div>

                    {/* Server */}
                    <chakra.div fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                      <Link to={`/servers/${service.server_id}`}>
                        <chakra.span _hover={{ color: 'blue.500', textDecoration: 'underline' }}>
                          {service.server_hostname}
                        </chakra.span>
                      </Link>
                    </chakra.div>

                    {/* Last Check */}
                    <chakra.div fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                      {service.last_status_check ? formatRelativeTime(service.last_status_check) : 'Never'}
                    </chakra.div>

                    {/* Actions */}
                    <chakra.div display="flex" gap="1">
                      {service.is_managed && (
                        <>
                          {!service.is_active && (
                            <chakra.button
                              aria-label="Start service"
                              onClick={() => handleServiceControl(service, 'start')}
                              p="1"
                              bg="transparent"
                              _hover={{ bg: 'green.100', _dark: { bg: 'green.900' } }}
                              borderRadius="md"
                              color="green.500"
                              disabled={controlServiceMutation.isPending}
                              title="Start service"
                            >
                              <FiPlay size={14} />
                            </chakra.button>
                          )}
                          
                          {service.is_active && (
                            <chakra.button
                              aria-label="Stop service"
                              onClick={() => handleServiceControl(service, 'stop')}
                              p="1"
                              bg="transparent"
                              _hover={{ bg: 'red.100', _dark: { bg: 'red.900' } }}
                              borderRadius="md"
                              color="red.500"
                              disabled={controlServiceMutation.isPending}
                              title="Stop service"
                            >
                              <FiPause size={14} />
                            </chakra.button>
                          )}
                          
                          <chakra.button
                            aria-label="Restart service"
                            onClick={() => handleServiceControl(service, 'restart')}
                            p="1"
                            bg="transparent"
                            _hover={{ bg: 'blue.100', _dark: { bg: 'blue.900' } }}
                            borderRadius="md"
                            color="blue.500"
                            disabled={controlServiceMutation.isPending}
                            title="Restart service"
                          >
                            <FiRotateCcw size={14} />
                          </chakra.button>
                        </>
                      )}
                      
                      <chakra.button
                        aria-label="View logs"
                        onClick={() => handleViewLogs(service)}
                        p="1"
                        bg="transparent"
                        _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
                        borderRadius="md"
                        color="gray.500"
                        disabled={serviceLogsMutation.isPending}
                        title="View logs"
                      >
                        <FiFileText size={14} />
                      </chakra.button>
                      
                      <chakra.button
                        aria-label="View details"
                        onClick={() => navigate(`/services/${service.id}`)}
                        p="1"
                        bg="transparent"
                        _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
                        borderRadius="md"
                        color="gray.500"
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
                Page {page} of {servicesData.total_pages}
              </chakra.span>
            </chakra.div>
            
            <chakra.button
              onClick={() => setPage(page + 1)}
              disabled={page === servicesData.total_pages}
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

export default Services;