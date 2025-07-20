/**
 * Service creation wizard page
 */

import { chakra } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiClock,
  FiCpu,
  FiFileText,
  FiLayers,
  FiPlay,
  FiSettings,
  FiShield,
  FiUser,
} from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdvancedStep from '@/components/service-creation/AdvancedStep';
// Import service creation components
import BasicInfoStep from '@/components/service-creation/BasicInfoStep';
import ExecutionStep from '@/components/service-creation/ExecutionStep';
import ManagementStep from '@/components/service-creation/ManagementStep';
import ReviewStep from '@/components/service-creation/ReviewStep';
import ServiceTypeStep from '@/components/service-creation/ServiceTypeStep';
import TimerStep from '@/components/service-creation/TimerStep';
import { useUIStore } from '@/store';
import {
  type EnhancedServiceCreateRequest,
  RestartPolicy,
  type ServiceFormData,
  type ServiceFormStep,
  SystemdServiceType,
  type TimerConfiguration,
} from '@/types';

const CreateService: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setPageTitle, setBreadcrumbs, addNotification } = useUIStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get server_id from URL params if present
  const serverIdFromUrl = searchParams.get('server_id');

  // Form data state
  const [formData, setFormData] = useState<ServiceFormData>({
    basicInfo: {
      name: '',
      display_name: '',
      description: '',
      server_id: serverIdFromUrl ? Number.parseInt(serverIdFromUrl, 10) : 0,
    },
    serviceType: {
      systemd_type: SystemdServiceType.SIMPLE,
      exec_start: '',
      restart_policy: RestartPolicy.ON_FAILURE,
    },
    execution: {
      environment_variables: {},
    },
    advanced: {
      dependencies: {
        after_units: [],
        wants_units: [],
        requires_units: [],
      },
      security: {},
      logging: {
        standard_output: 'journal',
        standard_error: 'journal',
      },
    },
    management: {
      auto_start: true,
      auto_enable: true,
      auto_restart: false,
      is_managed: true,
      is_monitored: true,
    },
  });

  // Form steps configuration
  const steps: ServiceFormStep[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Service name, description, and target server',
      component: 'BasicInfoStep',
      isValid: !!(formData.basicInfo.name && formData.basicInfo.server_id),
    },
    {
      id: 'type',
      title: 'Service Type',
      description: 'Service behavior and execution commands',
      component: 'ServiceTypeStep',
      isValid: !!formData.serviceType.exec_start,
    },
    {
      id: 'execution',
      title: 'Execution',
      description: 'User, working directory, and environment',
      component: 'ExecutionStep',
      isValid: true,
      isOptional: true,
    },
    {
      id: 'timer',
      title: 'Timer Configuration',
      description: 'Schedule for timer-based services',
      component: 'TimerStep',
      isValid: true,
      isOptional: true,
    },
    {
      id: 'advanced',
      title: 'Advanced Options',
      description: 'Dependencies, security, and logging',
      component: 'AdvancedStep',
      isValid: true,
      isOptional: true,
    },
    {
      id: 'management',
      title: 'Management',
      description: 'Auto-start, monitoring, and restart policies',
      component: 'ManagementStep',
      isValid: true,
      isOptional: true,
    },
    {
      id: 'review',
      title: 'Review & Deploy',
      description: 'Review configuration and deploy service',
      component: 'ReviewStep',
      isValid: true,
    },
  ];

  useEffect(() => {
    setPageTitle('Create Service');
    setBreadcrumbs([
      { label: 'Dashboard', href: '/' },
      { label: 'Services', href: '/services' },
      { label: 'Create Service' },
    ]);
  }, [setPageTitle, setBreadcrumbs]);

  const updateFormData = (section: keyof ServiceFormData, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
  };

  const canProceed = () => {
    const step = steps[currentStep];
    return step.isValid || step.isOptional;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const convertFormDataToRequest = (): EnhancedServiceCreateRequest => {
    return {
      // Basic info
      name: formData.basicInfo.name,
      display_name: formData.basicInfo.display_name || undefined,
      description: formData.basicInfo.description || undefined,

      // Service type
      systemd_type: formData.serviceType.systemd_type,
      exec_start: formData.serviceType.exec_start,
      exec_stop: formData.serviceType.exec_stop || undefined,
      exec_reload: formData.serviceType.exec_reload || undefined,
      restart_policy: formData.serviceType.restart_policy,

      // Execution
      user: formData.execution.user || undefined,
      group: formData.execution.group || undefined,
      working_directory: formData.execution.working_directory || undefined,
      environment_variables:
        Object.keys(formData.execution.environment_variables).length > 0
          ? formData.execution.environment_variables
          : undefined,

      // Timer
      create_timer: !!formData.timer,
      timer_config: formData.timer || undefined,

      // Advanced - Dependencies
      after_units:
        formData.advanced.dependencies.after_units.length > 0
          ? formData.advanced.dependencies.after_units
          : undefined,
      wants_units:
        formData.advanced.dependencies.wants_units.length > 0
          ? formData.advanced.dependencies.wants_units
          : undefined,
      requires_units:
        formData.advanced.dependencies.requires_units.length > 0
          ? formData.advanced.dependencies.requires_units
          : undefined,

      // Advanced - Security
      no_new_privileges: formData.advanced.security.no_new_privileges,
      private_tmp: formData.advanced.security.private_tmp,
      protect_system: formData.advanced.security.protect_system || undefined,
      protect_home: formData.advanced.security.protect_home,

      // Advanced - Logging
      standard_output: formData.advanced.logging.standard_output,
      standard_error: formData.advanced.logging.standard_error,
      syslog_identifier:
        formData.advanced.logging.syslog_identifier || undefined,

      // Management
      auto_start: formData.management.auto_start,
      auto_enable: formData.management.auto_enable,
      auto_restart: formData.management.auto_restart,
      is_managed: formData.management.is_managed,
      is_monitored: formData.management.is_monitored,
    };
  };

  const handleSubmit = async (isDryRun = false) => {
    try {
      setIsSubmitting(true);

      const serviceConfig = convertFormDataToRequest();

      // TODO: Replace with actual API call
      const deployRequest = {
        server_id: formData.basicInfo.server_id,
        service_config: serviceConfig,
        dry_run: isDryRun,
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (isDryRun) {
        addNotification({
          type: 'success',
          message: 'Service configuration validated successfully',
        });
      } else {
        addNotification({
          type: 'success',
          message: `Service "${formData.basicInfo.name}" created successfully`,
        });
        navigate('/services');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to ${isDryRun ? 'validate' : 'create'} service: ${error}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepIcon = (stepIndex: number) => {
    const step = steps[stepIndex];
    const icons = {
      basic: FiFileText,
      type: FiCpu,
      execution: FiUser,
      timer: FiClock,
      advanced: FiSettings,
      management: FiShield,
      review: FiCheck,
    };
    return icons[step.id as keyof typeof icons] || FiLayers;
  };

  const renderCurrentStep = () => {
    const step = steps[currentStep];
    const commonProps = {
      formData,
      updateFormData,
    };

    switch (step.component) {
      case 'BasicInfoStep':
        return <BasicInfoStep {...commonProps} />;
      case 'ServiceTypeStep':
        return <ServiceTypeStep {...commonProps} />;
      case 'ExecutionStep':
        return <ExecutionStep {...commonProps} />;
      case 'TimerStep':
        return <TimerStep {...commonProps} />;
      case 'AdvancedStep':
        return <AdvancedStep {...commonProps} />;
      case 'ManagementStep':
        return <ManagementStep {...commonProps} />;
      case 'ReviewStep':
        return (
          <ReviewStep
            {...commonProps}
            isDeploying={isSubmitting}
            onDeploy={() => handleSubmit(false)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <chakra.div p="6">
      <chakra.div maxW="6xl" mx="auto">
        {/* Header */}
        <chakra.div mb="8">
          <chakra.h1
            _dark={{ color: 'white' }}
            color="gray.900"
            fontSize="2xl"
            fontWeight="bold"
            mb="2"
          >
            Create New Service
          </chakra.h1>
          <chakra.p _dark={{ color: 'gray.400' }} color="gray.600">
            Create and deploy a custom systemd service to your server
          </chakra.p>
        </chakra.div>

        <chakra.div display="flex" gap="8">
          {/* Sidebar with steps */}
          <chakra.div flexShrink={0} w="300px">
            <chakra.div
              _dark={{ bg: 'gray.900' }}
              bg="white"
              borderRadius="lg"
              boxShadow="sm"
              p="6"
            >
              <chakra.h3 fontSize="lg" fontWeight="semibold" mb="4">
                Steps
              </chakra.h3>

              <chakra.div display="flex" flexDirection="column" gap="2">
                {steps.map((step, index) => {
                  const StepIcon = getStepIcon(index);
                  const isCompleted = index < currentStep;
                  const isCurrent = index === currentStep;
                  const isAccessible =
                    index <= currentStep || steps[index - 1]?.isValid;

                  return (
                    <chakra.div
                      _dark={{
                        bg: isCurrent ? 'blue.900' : 'transparent',
                      }}
                      _hover={
                        isAccessible
                          ? { bg: 'gray.50', _dark: { bg: 'gray.800' } }
                          : {}
                      }
                      alignItems="center"
                      bg={isCurrent ? 'blue.50' : 'transparent'}
                      borderRadius="md"
                      cursor={isAccessible ? 'pointer' : 'default'}
                      display="flex"
                      gap="3"
                      key={step.id}
                      onClick={
                        isAccessible ? () => setCurrentStep(index) : undefined
                      }
                      opacity={isAccessible ? 1 : 0.5}
                      p="3"
                    >
                      {/* Step icon/number */}
                      <chakra.div
                        _dark={{
                          bg: isCompleted
                            ? 'green.500'
                            : isCurrent
                              ? 'blue.500'
                              : 'gray.600',
                        }}
                        alignItems="center"
                        bg={
                          isCompleted
                            ? 'green.500'
                            : isCurrent
                              ? 'blue.500'
                              : 'gray.300'
                        }
                        borderRadius="full"
                        color="white"
                        display="flex"
                        fontSize="sm"
                        fontWeight="semibold"
                        h="8"
                        justifyContent="center"
                        w="8"
                      >
                        {isCompleted ? (
                          <FiCheck size={16} />
                        ) : (
                          <StepIcon size={16} />
                        )}
                      </chakra.div>

                      {/* Step info */}
                      <chakra.div flex="1">
                        <chakra.div
                          _dark={{
                            color: isCurrent ? 'blue.200' : 'gray.100',
                          }}
                          color={isCurrent ? 'blue.700' : 'gray.900'}
                          fontSize="sm"
                          fontWeight="medium"
                        >
                          {step.title}
                          {step.isOptional && (
                            <chakra.span
                              _dark={{ color: 'gray.400' }}
                              color="gray.500"
                              fontSize="xs"
                              ml="1"
                            >
                              (optional)
                            </chakra.span>
                          )}
                        </chakra.div>
                        <chakra.div
                          _dark={{ color: 'gray.400' }}
                          color="gray.600"
                          fontSize="xs"
                        >
                          {step.description}
                        </chakra.div>
                      </chakra.div>
                    </chakra.div>
                  );
                })}
              </chakra.div>
            </chakra.div>
          </chakra.div>

          {/* Main content */}
          <chakra.div flex="1">
            <chakra.div
              _dark={{ bg: 'gray.900' }}
              bg="white"
              borderRadius="lg"
              boxShadow="sm"
              minH="600px"
              overflow="hidden"
            >
              {/* Step header */}
              <chakra.div
                _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                bg="gray.50"
                borderBottomWidth="1px"
                borderColor="gray.200"
                p="6"
              >
                <chakra.div alignItems="center" display="flex" gap="3">
                  <chakra.div
                    alignItems="center"
                    bg="blue.500"
                    borderRadius="full"
                    color="white"
                    display="flex"
                    fontSize="sm"
                    fontWeight="semibold"
                    h="8"
                    justifyContent="center"
                    w="8"
                  >
                    {currentStep + 1}
                  </chakra.div>
                  <chakra.div>
                    <chakra.h2 fontSize="lg" fontWeight="semibold">
                      {steps[currentStep].title}
                    </chakra.h2>
                    <chakra.p
                      _dark={{ color: 'gray.400' }}
                      color="gray.600"
                      fontSize="sm"
                    >
                      {steps[currentStep].description}
                    </chakra.p>
                  </chakra.div>
                </chakra.div>
              </chakra.div>

              {/* Step content */}
              <chakra.div p="6">{renderCurrentStep()}</chakra.div>

              {/* Navigation buttons */}
              {currentStep < steps.length - 1 && (
                <chakra.div
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  bg="gray.50"
                  borderColor="gray.200"
                  borderTopWidth="1px"
                  display="flex"
                  justifyContent="space-between"
                  p="6"
                >
                  <chakra.button
                    _dark={{
                      bg: 'gray.700',
                      color: 'gray.200',
                    }}
                    _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
                    _hover={{ bg: 'gray.200', _dark: { bg: 'gray.700' } }}
                    alignItems="center"
                    bg="gray.100"
                    borderRadius="md"
                    color="gray.700"
                    disabled={currentStep === 0}
                    display="flex"
                    gap="2"
                    onClick={previousStep}
                    px="4"
                    py="2"
                  >
                    <FiArrowLeft size={16} />
                    Previous
                  </chakra.button>

                  <chakra.button
                    _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
                    _hover={{ bg: 'blue.600' }}
                    alignItems="center"
                    bg="blue.500"
                    borderRadius="md"
                    color="white"
                    disabled={!canProceed()}
                    display="flex"
                    gap="2"
                    onClick={nextStep}
                    px="4"
                    py="2"
                  >
                    Next
                    <FiArrowRight size={16} />
                  </chakra.button>
                </chakra.div>
              )}
            </chakra.div>
          </chakra.div>
        </chakra.div>
      </chakra.div>
    </chakra.div>
  );
};

export default CreateService;
