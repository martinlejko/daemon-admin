/**
 * Edit Service page - edit existing service configuration using systemd override directories
 */

import { chakra } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  FiArrowLeft,
  FiCheck,
  FiEdit3,
  FiEye,
  FiRotateCcw,
  FiSave,
  FiSettings,
  FiShield,
} from 'react-icons/fi';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  useRollbackServiceConfiguration,
  useService,
  useUpdateService,
  useValidateServiceUpdate,
} from '@/hooks/useApi';
import { useUIStore } from '@/store';
import type {
  Service,
  ServiceEditFormData,
  ServiceEditFormStep,
  ServiceEditMode,
  ServiceOverrideConfig,
  ServiceUpdateRequest,
  SystemdServiceType,
} from '@/types';
import { RestartPolicy } from '@/types';

const EditService: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPageTitle, setBreadcrumbs, addNotification } = useUIStore();

  const serviceId = Number.parseInt(id || '0', 10);
  const { data: service, isLoading, error, refetch } = useService(serviceId);
  const updateServiceMutation = useUpdateService();
  const validateServiceMutation = useValidateServiceUpdate();
  const rollbackServiceMutation = useRollbackServiceConfiguration();

  const [mode, setMode] = useState<ServiceEditMode>('edit');
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ServiceEditFormData>({
    basicInfo: {
      display_name: '',
      description: '',
    },
    overrideConfig: {},
    management: {
      auto_restart: false,
      is_managed: true,
      is_monitored: true,
    },
    metadata: {
      tags: {},
      extra_data: {},
    },
    options: {
      apply_immediately: true,
      validate_only: false,
      create_backup: true,
    },
  });
  const [validationResult, setValidationResult] = useState<any>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  useEffect(() => {
    if (service) {
      setPageTitle(`Edit ${service.display_name || service.name}`);
      setBreadcrumbs([
        { label: 'Dashboard', href: '/' },
        { label: 'Services', href: '/services' },
        {
          label: service.display_name || service.name,
          href: `/services/${service.id}`,
        },
        { label: 'Edit' },
      ]);

      // Initialize form data from service
      setFormData({
        basicInfo: {
          display_name: service.display_name || '',
          description: service.description || '',
        },
        overrideConfig: service.override_config || {},
        management: {
          auto_restart: service.auto_restart,
          is_managed: service.is_managed,
          is_monitored: service.is_monitored,
        },
        metadata: {
          tags: service.tags || {},
          extra_data: service.extra_data || {},
        },
        options: {
          apply_immediately: true,
          validate_only: false,
          create_backup: true,
        },
      });
    }
  }, [service, setPageTitle, setBreadcrumbs]);

  const steps: ServiceEditFormStep[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Update service name and description',
      icon: 'FiEdit3',
      isValid: true,
    },
    {
      id: 'execution',
      title: 'Execution Settings',
      description: 'Configure service execution parameters',
      icon: 'FiSettings',
      isValid: true,
    },
    {
      id: 'security',
      title: 'Security & Access',
      description: 'Configure security and access controls',
      icon: 'FiShield',
      isValid: true,
      isOptional: true,
    },
    {
      id: 'management',
      title: 'Management',
      description: 'Configure monitoring and management settings',
      icon: 'FiSettings',
      isValid: true,
    },
    {
      id: 'review',
      title: 'Review & Apply',
      description: 'Review changes and apply configuration',
      icon: 'FiCheck',
      isValid: true,
    },
  ];

  const handleFormChange = (
    section: keyof ServiceEditFormData,
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleOverrideConfigChange = (
    field: keyof ServiceOverrideConfig,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      overrideConfig: {
        ...prev.overrideConfig,
        [field]: value,
      },
    }));
  };

  const handleValidate = async () => {
    if (!service) return;

    try {
      const updateRequest: ServiceUpdateRequest = {
        display_name: formData.basicInfo.display_name || undefined,
        description: formData.basicInfo.description || undefined,
        override_config:
          Object.keys(formData.overrideConfig).length > 0
            ? formData.overrideConfig
            : undefined,
        auto_restart: formData.management.auto_restart,
        is_managed: formData.management.is_managed,
        is_monitored: formData.management.is_monitored,
        tags: formData.metadata.tags,
        extra_data: formData.metadata.extra_data,
        validate_only: true,
        create_backup: formData.options.create_backup,
      };

      const result = await validateServiceMutation.mutateAsync({
        serviceId: service.id,
        updateData: updateRequest,
      });

      setValidationResult(result);
      setPreviewContent(result.override_content_preview || null);
      setMode('preview');

      if (result.validation_errors && result.validation_errors.length > 0) {
        addNotification({
          type: 'warning',
          message: `Validation found ${result.validation_errors.length} error(s)`,
        });
      } else {
        addNotification({
          type: 'success',
          message: 'Configuration validation successful',
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Validation failed: ${error}`,
      });
    }
  };

  const handleApply = async () => {
    if (!service) return;

    try {
      const updateRequest: ServiceUpdateRequest = {
        display_name: formData.basicInfo.display_name || undefined,
        description: formData.basicInfo.description || undefined,
        override_config:
          Object.keys(formData.overrideConfig).length > 0
            ? formData.overrideConfig
            : undefined,
        auto_restart: formData.management.auto_restart,
        is_managed: formData.management.is_managed,
        is_monitored: formData.management.is_monitored,
        tags: formData.metadata.tags,
        extra_data: formData.metadata.extra_data,
        apply_immediately: formData.options.apply_immediately,
        validate_only: false,
        create_backup: formData.options.create_backup,
      };

      const result = await updateServiceMutation.mutateAsync({
        serviceId: service.id,
        updateData: updateRequest,
      });

      addNotification({
        type: 'success',
        message: result.message,
      });

      if (result.service_restart_required) {
        addNotification({
          type: 'info',
          message: 'Service restart is required for changes to take effect',
        });
      }

      refetch();
      navigate(`/services/${service.id}`);
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to update service: ${error}`,
      });
    }
  };

  const handleRollback = async () => {
    if (!service) return;

    try {
      const result = await rollbackServiceMutation.mutateAsync({
        serviceId: service.id,
        rollbackData: {
          remove_override: true,
          restart_service: true,
        },
      });

      addNotification({
        type: 'success',
        message: result.message,
      });

      refetch();
      navigate(`/services/${service.id}`);
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to rollback service: ${error}`,
      });
    }
  };

  if (isLoading) {
    return (
      <chakra.div bg="bg.subtle" minH="100vh" p="8">
        <chakra.div maxW="6xl" mx="auto">
          <LoadingSpinner fullPage message="Loading service details..." />
        </chakra.div>
      </chakra.div>
    );
  }

  if (error || !service) {
    return (
      <chakra.div bg="bg.subtle" minH="100vh" p="8">
        <chakra.div maxW="6xl" mx="auto">
          <Card>
            <chakra.div py="8" textAlign="center">
              <FiEdit3 color="var(--chakra-colors-text-muted)" size={48} />
              <chakra.h3
                color="text"
                fontSize="lg"
                fontWeight="semibold"
                mb="2"
                mt="4"
              >
                Service not found
              </chakra.h3>
              <chakra.p color="text.subtle" mb="6">
                The service you're trying to edit doesn't exist or has been
                removed.
              </chakra.p>
              <Link to="/services">
                <Button leftIcon={<FiArrowLeft />}>Back to Services</Button>
              </Link>
            </chakra.div>
          </Card>
        </chakra.div>
      </chakra.div>
    );
  }

  if (!service.is_managed) {
    return (
      <chakra.div bg="bg.subtle" minH="100vh" p="8">
        <chakra.div maxW="6xl" mx="auto">
          <Card>
            <chakra.div py="8" textAlign="center">
              <FiShield color="var(--chakra-colors-text-muted)" size={48} />
              <chakra.h3
                color="text"
                fontSize="lg"
                fontWeight="semibold"
                mb="2"
                mt="4"
              >
                Service not editable
              </chakra.h3>
              <chakra.p color="text.subtle" mb="6">
                This service is not managed by Owleyes and cannot be edited.
                Only managed services can be modified through the web interface.
              </chakra.p>
              <Link to={`/services/${service.id}`}>
                <Button leftIcon={<FiArrowLeft />}>
                  Back to Service Details
                </Button>
              </Link>
            </chakra.div>
          </Card>
        </chakra.div>
      </chakra.div>
    );
  }

  return (
    <chakra.div bg="bg.subtle" minH="100vh" p="8">
      <chakra.div maxW="6xl" mx="auto">
        <PageHeader
          actions={
            <chakra.div display="flex" gap="3">
              {mode === 'preview' && (
                <>
                  <Button
                    leftIcon={<FiEdit3 />}
                    onClick={() => setMode('edit')}
                    variant="secondary"
                  >
                    Edit More
                  </Button>
                  <Button
                    leftIcon={<FiSave />}
                    loading={updateServiceMutation.isPending}
                    onClick={handleApply}
                    variant="primary"
                  >
                    Apply Changes
                  </Button>
                </>
              )}

              {mode === 'edit' && (
                <>
                  <Button
                    leftIcon={<FiEye />}
                    loading={validateServiceMutation.isPending}
                    onClick={handleValidate}
                    variant="secondary"
                  >
                    Preview Changes
                  </Button>
                  <Button
                    leftIcon={<FiSave />}
                    loading={updateServiceMutation.isPending}
                    onClick={handleApply}
                    variant="primary"
                  >
                    Save Changes
                  </Button>
                </>
              )}

              {service.override_config && (
                <Button
                  leftIcon={<FiRotateCcw />}
                  loading={rollbackServiceMutation.isPending}
                  onClick={handleRollback}
                  variant="danger"
                >
                  Rollback
                </Button>
              )}

              <Link to={`/services/${service.id}`}>
                <Button leftIcon={<FiArrowLeft />} variant="ghost">
                  Cancel
                </Button>
              </Link>
            </chakra.div>
          }
          subtitle={`Edit systemd service configuration on ${service.server_hostname}`}
          title={`Edit ${service.display_name || service.name}`}
        />

        {mode === 'preview' && validationResult && (
          <Card mb="6">
            <chakra.div mb="4">
              <chakra.h3
                color="text"
                fontSize="lg"
                fontWeight="semibold"
                mb="2"
              >
                Configuration Preview
              </chakra.h3>
              <chakra.p color="text.subtle" fontSize="sm">
                Review the changes that will be applied to the service
              </chakra.p>
            </chakra.div>

            {validationResult.validation_errors &&
              validationResult.validation_errors.length > 0 && (
                <chakra.div
                  bg="red.50"
                  border="1px solid"
                  borderColor="red.200"
                  borderRadius="md"
                  mb="4"
                  p="4"
                >
                  <chakra.h4
                    color="red.800"
                    fontSize="sm"
                    fontWeight="semibold"
                    mb="2"
                  >
                    Validation Errors
                  </chakra.h4>
                  <chakra.ul color="red.700" fontSize="sm">
                    {validationResult.validation_errors.map(
                      (error: string, index: number) => (
                        <chakra.li key={index} mb="1">
                          • {error}
                        </chakra.li>
                      )
                    )}
                  </chakra.ul>
                </chakra.div>
              )}

            {validationResult.validation_warnings &&
              validationResult.validation_warnings.length > 0 && (
                <chakra.div
                  bg="yellow.50"
                  border="1px solid"
                  borderColor="yellow.200"
                  borderRadius="md"
                  mb="4"
                  p="4"
                >
                  <chakra.h4
                    color="yellow.800"
                    fontSize="sm"
                    fontWeight="semibold"
                    mb="2"
                  >
                    Warnings
                  </chakra.h4>
                  <chakra.ul color="yellow.700" fontSize="sm">
                    {validationResult.validation_warnings.map(
                      (warning: string, index: number) => (
                        <chakra.li key={index} mb="1">
                          • {warning}
                        </chakra.li>
                      )
                    )}
                  </chakra.ul>
                </chakra.div>
              )}

            {previewContent && (
              <chakra.div>
                <chakra.h4
                  color="text"
                  fontSize="sm"
                  fontWeight="semibold"
                  mb="2"
                >
                  Override File Content
                </chakra.h4>
                <chakra.pre
                  bg="bg.subtle"
                  border="1px solid"
                  borderColor="border"
                  borderRadius="md"
                  color="text"
                  fontFamily="mono"
                  fontSize="sm"
                  maxH="400px"
                  overflow="auto"
                  p="4"
                  whiteSpace="pre-wrap"
                >
                  {previewContent}
                </chakra.pre>
              </chakra.div>
            )}

            {validationResult.systemd_reload_required && (
              <chakra.div
                bg="blue.50"
                border="1px solid"
                borderColor="blue.200"
                borderRadius="md"
                mt="4"
                p="3"
              >
                <chakra.div alignItems="center" display="flex" gap="2">
                  <StatusBadge status="info">Info</StatusBadge>
                  <chakra.span color="blue.800" fontSize="sm">
                    Systemd daemon reload will be performed
                  </chakra.span>
                </chakra.div>
              </chakra.div>
            )}

            {validationResult.service_restart_required && (
              <chakra.div
                bg="orange.50"
                border="1px solid"
                borderColor="orange.200"
                borderRadius="md"
                mt="2"
                p="3"
              >
                <chakra.div alignItems="center" display="flex" gap="2">
                  <StatusBadge status="warning">Warning</StatusBadge>
                  <chakra.span color="orange.800" fontSize="sm">
                    Service restart required for changes to take effect
                  </chakra.span>
                </chakra.div>
              </chakra.div>
            )}
          </Card>
        )}

        {mode === 'edit' && (
          <chakra.div display="flex" flexDirection="column" gap="6">
            {/* Basic Information */}
            <Card>
              <chakra.div mb="4">
                <chakra.h3
                  color="text"
                  fontSize="lg"
                  fontWeight="semibold"
                  mb="2"
                >
                  Basic Information
                </chakra.h3>
                <chakra.p color="text.subtle" fontSize="sm">
                  Update the service display name and description
                </chakra.p>
              </chakra.div>

              <chakra.div display="grid" gap="4" gridTemplateColumns="1fr">
                <chakra.div>
                  <chakra.label
                    color="text"
                    display="block"
                    fontSize="sm"
                    fontWeight="medium"
                    mb="1"
                  >
                    Display Name
                  </chakra.label>
                  <chakra.input
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    borderRadius="md"
                    onChange={(e) =>
                      handleFormChange(
                        'basicInfo',
                        'display_name',
                        e.target.value
                      )
                    }
                    p="2"
                    placeholder="Enter display name"
                    value={formData.basicInfo.display_name}
                    width="100%"
                  />
                </chakra.div>

                <chakra.div>
                  <chakra.label
                    color="text"
                    display="block"
                    fontSize="sm"
                    fontWeight="medium"
                    mb="1"
                  >
                    Description
                  </chakra.label>
                  <chakra.textarea
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    borderRadius="md"
                    onChange={(e) =>
                      handleFormChange(
                        'basicInfo',
                        'description',
                        e.target.value
                      )
                    }
                    p="2"
                    placeholder="Enter service description"
                    rows={3}
                    value={formData.basicInfo.description}
                    width="100%"
                  />
                </chakra.div>
              </chakra.div>
            </Card>

            {/* Service Override Configuration */}
            <Card>
              <chakra.div mb="4">
                <chakra.h3
                  color="text"
                  fontSize="lg"
                  fontWeight="semibold"
                  mb="2"
                >
                  Service Configuration Override
                </chakra.h3>
                <chakra.p color="text.subtle" fontSize="sm">
                  Override specific systemd service parameters using override
                  directories
                </chakra.p>
              </chakra.div>

              <chakra.div
                display="grid"
                gap="4"
                gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
              >
                <chakra.div>
                  <chakra.label
                    color="text"
                    display="block"
                    fontSize="sm"
                    fontWeight="medium"
                    mb="1"
                  >
                    Restart Policy
                  </chakra.label>
                  <chakra.select
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    borderRadius="md"
                    onChange={(e) =>
                      handleOverrideConfigChange(
                        'restart_policy',
                        e.target.value as RestartPolicy
                      )
                    }
                    p="2"
                    value={formData.overrideConfig.restart_policy || ''}
                    width="100%"
                  >
                    <option value="">Keep current</option>
                    <option value={RestartPolicy.NO}>No restart</option>
                    <option value={RestartPolicy.ON_FAILURE}>On failure</option>
                    <option value={RestartPolicy.ON_SUCCESS}>On success</option>
                    <option value={RestartPolicy.ALWAYS}>Always</option>
                  </chakra.select>
                </chakra.div>

                <chakra.div>
                  <chakra.label
                    color="text"
                    display="block"
                    fontSize="sm"
                    fontWeight="medium"
                    mb="1"
                  >
                    User
                  </chakra.label>
                  <chakra.input
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    borderRadius="md"
                    onChange={(e) =>
                      handleOverrideConfigChange('user', e.target.value)
                    }
                    p="2"
                    placeholder="Run as user (e.g., www-data)"
                    value={formData.overrideConfig.user || ''}
                    width="100%"
                  />
                </chakra.div>

                <chakra.div>
                  <chakra.label
                    color="text"
                    display="block"
                    fontSize="sm"
                    fontWeight="medium"
                    mb="1"
                  >
                    Working Directory
                  </chakra.label>
                  <chakra.input
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    borderRadius="md"
                    onChange={(e) =>
                      handleOverrideConfigChange(
                        'working_directory',
                        e.target.value
                      )
                    }
                    p="2"
                    placeholder="/path/to/working/directory"
                    value={formData.overrideConfig.working_directory || ''}
                    width="100%"
                  />
                </chakra.div>

                <chakra.div>
                  <chakra.label
                    color="text"
                    display="block"
                    fontSize="sm"
                    fontWeight="medium"
                    mb="1"
                  >
                    Restart Delay (seconds)
                  </chakra.label>
                  <chakra.input
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    borderRadius="md"
                    onChange={(e) =>
                      handleOverrideConfigChange(
                        'restart_sec',
                        Number.parseInt(e.target.value) || undefined
                      )
                    }
                    p="2"
                    placeholder="3"
                    type="number"
                    value={formData.overrideConfig.restart_sec || ''}
                    width="100%"
                  />
                </chakra.div>
              </chakra.div>

              <chakra.div mt="4">
                <chakra.label
                  color="text"
                  display="block"
                  fontSize="sm"
                  fontWeight="medium"
                  mb="1"
                >
                  Override Start Command
                </chakra.label>
                <chakra.input
                  bg="white"
                  border="1px solid"
                  borderColor="gray.300"
                  borderRadius="md"
                  onChange={(e) =>
                    handleOverrideConfigChange('exec_start', e.target.value)
                  }
                  p="2"
                  placeholder="Leave empty to keep current start command"
                  value={formData.overrideConfig.exec_start || ''}
                  width="100%"
                />
                <chakra.p color="text.subtle" fontSize="xs" mt="1">
                  Override the service start command. Leave empty to keep the
                  current command.
                </chakra.p>
              </chakra.div>
            </Card>

            {/* Management Settings */}
            <Card>
              <chakra.div mb="4">
                <chakra.h3
                  color="text"
                  fontSize="lg"
                  fontWeight="semibold"
                  mb="2"
                >
                  Management Settings
                </chakra.h3>
                <chakra.p color="text.subtle" fontSize="sm">
                  Configure how Owleyes manages this service
                </chakra.p>
              </chakra.div>

              <chakra.div display="flex" flexDirection="column" gap="3">
                <chakra.label alignItems="center" display="flex" gap="2">
                  <chakra.input
                    checked={formData.management.auto_restart}
                    onChange={(e) =>
                      handleFormChange(
                        'management',
                        'auto_restart',
                        e.target.checked
                      )
                    }
                    type="checkbox"
                  />
                  <chakra.span color="text" fontSize="sm">
                    Enable automatic restart monitoring
                  </chakra.span>
                </chakra.label>

                <chakra.label alignItems="center" display="flex" gap="2">
                  <chakra.input
                    checked={formData.management.is_managed}
                    onChange={(e) =>
                      handleFormChange(
                        'management',
                        'is_managed',
                        e.target.checked
                      )
                    }
                    type="checkbox"
                  />
                  <chakra.span color="text" fontSize="sm">
                    This service is managed by Owleyes
                  </chakra.span>
                </chakra.label>

                <chakra.label alignItems="center" display="flex" gap="2">
                  <chakra.input
                    checked={formData.management.is_monitored}
                    onChange={(e) =>
                      handleFormChange(
                        'management',
                        'is_monitored',
                        e.target.checked
                      )
                    }
                    type="checkbox"
                  />
                  <chakra.span color="text" fontSize="sm">
                    Monitor this service for status changes
                  </chakra.span>
                </chakra.label>
              </chakra.div>
            </Card>

            {/* Options */}
            <Card>
              <chakra.div mb="4">
                <chakra.h3
                  color="text"
                  fontSize="lg"
                  fontWeight="semibold"
                  mb="2"
                >
                  Update Options
                </chakra.h3>
                <chakra.p color="text.subtle" fontSize="sm">
                  Configure how the update should be applied
                </chakra.p>
              </chakra.div>

              <chakra.div display="flex" flexDirection="column" gap="3">
                <chakra.label alignItems="center" display="flex" gap="2">
                  <chakra.input
                    checked={formData.options.apply_immediately}
                    onChange={(e) =>
                      handleFormChange(
                        'options',
                        'apply_immediately',
                        e.target.checked
                      )
                    }
                    type="checkbox"
                  />
                  <chakra.span color="text" fontSize="sm">
                    Apply changes immediately
                  </chakra.span>
                </chakra.label>

                <chakra.label alignItems="center" display="flex" gap="2">
                  <chakra.input
                    checked={formData.options.create_backup}
                    onChange={(e) =>
                      handleFormChange(
                        'options',
                        'create_backup',
                        e.target.checked
                      )
                    }
                    type="checkbox"
                  />
                  <chakra.span color="text" fontSize="sm">
                    Create backup before applying changes
                  </chakra.span>
                </chakra.label>
              </chakra.div>
            </Card>
          </chakra.div>
        )}
      </chakra.div>
    </chakra.div>
  );
};

export default EditService;
