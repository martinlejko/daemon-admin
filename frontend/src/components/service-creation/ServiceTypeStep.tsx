/**
 * Service type configuration step
 */

import { chakra } from '@chakra-ui/react';
import { useState } from 'react';
import { FiClock, FiCpu, FiInfo, FiPlay, FiRotateCcw } from 'react-icons/fi';
import {
  RestartPolicy,
  type ServiceFormData,
  SystemdServiceType,
} from '@/types';

interface ServiceTypeStepProps {
  formData: ServiceFormData;
  updateFormData: (section: keyof ServiceFormData, data: any) => void;
}

const ServiceTypeStep: React.FC<ServiceTypeStepProps> = ({
  formData,
  updateFormData,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const serviceTypeOptions = [
    {
      value: SystemdServiceType.SIMPLE,
      label: 'Simple',
      description: 'Default type for services that run continuously',
      icon: FiPlay,
      use_case: 'Web servers, APIs, long-running processes',
    },
    {
      value: SystemdServiceType.ONESHOT,
      label: 'Oneshot',
      description: 'For services that run once and exit',
      icon: FiClock,
      use_case: 'Scripts, backup tasks, one-time operations',
    },
    {
      value: SystemdServiceType.FORKING,
      label: 'Forking',
      description: 'Traditional daemons that fork processes',
      icon: FiCpu,
      use_case: 'Traditional Unix daemons',
    },
    {
      value: SystemdServiceType.NOTIFY,
      label: 'Notify',
      description: 'Services that notify systemd when ready',
      icon: FiInfo,
      use_case: 'Services with sd_notify() support',
    },
  ];

  const restartPolicyOptions = [
    {
      value: RestartPolicy.NO,
      label: 'No',
      description: 'Never restart the service',
    },
    {
      value: RestartPolicy.ON_FAILURE,
      label: 'On Failure',
      description: 'Restart only if the service fails',
    },
    {
      value: RestartPolicy.ON_ABNORMAL,
      label: 'On Abnormal',
      description: 'Restart on abnormal exit (signals, timeouts)',
    },
    {
      value: RestartPolicy.ALWAYS,
      label: 'Always',
      description: 'Always restart the service',
    },
  ];

  const handleExecStartChange = (value: string) => {
    updateFormData('serviceType', { exec_start: value });

    // Auto-detect if this might be a timer service based on command patterns
    const timerPatterns = [
      /backup/i,
      /cron/i,
      /schedule/i,
      /batch/i,
      /\.py.*--schedule/i,
      /\.sh.*daily|weekly|monthly/i,
    ];

    const looksLikeTimer = timerPatterns.some((pattern) => pattern.test(value));

    if (
      looksLikeTimer &&
      formData.serviceType.systemd_type === SystemdServiceType.SIMPLE
    ) {
      // Suggest oneshot for timer services
      updateFormData('serviceType', {
        systemd_type: SystemdServiceType.ONESHOT,
      });
    }
  };

  const getCommonCommands = () => {
    return [
      {
        label: 'Python with UV',
        command: 'uv run python main.py',
        description: 'Run Python script with uv package manager',
      },
      {
        label: 'Node.js',
        command: 'node server.js',
        description: 'Run Node.js application',
      },
      {
        label: 'Python Script',
        command: '/usr/bin/python3 /opt/scripts/script.py',
        description: 'Run Python script with absolute paths',
      },
      {
        label: 'Shell Script',
        command: '/bin/bash /opt/scripts/script.sh',
        description: 'Execute shell script',
      },
      {
        label: 'Custom Binary',
        command: '/usr/local/bin/myapp --config /etc/myapp/config.yml',
        description: 'Run custom application with config',
      },
    ];
  };

  return (
    <chakra.div display="flex" flexDirection="column" gap="6">
      {/* Service Type Selection */}
      <chakra.div>
        <chakra.label
          _dark={{ color: 'gray.300' }}
          color="gray.700"
          display="block"
          fontSize="sm"
          fontWeight="medium"
          mb="3"
        >
          Service Type *
        </chakra.label>

        <chakra.div
          display="grid"
          gap="3"
          gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))"
        >
          {serviceTypeOptions.map((option) => {
            const IconComponent = option.icon;
            const isSelected =
              formData.serviceType.systemd_type === option.value;

            return (
              <chakra.div
                _dark={{
                  borderColor: isSelected ? 'blue.500' : 'gray.600',
                  bg: isSelected ? 'blue.900' : 'gray.800',
                }}
                _hover={{ borderColor: 'blue.300' }}
                bg={isSelected ? 'blue.50' : 'white'}
                border="2px solid"
                borderColor={isSelected ? 'blue.500' : 'gray.200'}
                borderRadius="md"
                cursor="pointer"
                key={option.value}
                onClick={() =>
                  updateFormData('serviceType', { systemd_type: option.value })
                }
                p="4"
              >
                <chakra.div alignItems="center" display="flex" gap="3" mb="2">
                  <chakra.div
                    alignItems="center"
                    bg={isSelected ? 'blue.500' : 'gray.400'}
                    borderRadius="full"
                    color="white"
                    display="flex"
                    h="8"
                    justifyContent="center"
                    w="8"
                  >
                    <IconComponent size={16} />
                  </chakra.div>
                  <chakra.div fontSize="sm" fontWeight="medium">
                    {option.label}
                  </chakra.div>
                </chakra.div>

                <chakra.div
                  _dark={{ color: 'gray.400' }}
                  color="gray.600"
                  fontSize="xs"
                  mb="2"
                >
                  {option.description}
                </chakra.div>

                <chakra.div
                  _dark={{ color: 'gray.500' }}
                  color="gray.500"
                  fontSize="xs"
                  fontStyle="italic"
                >
                  Use for: {option.use_case}
                </chakra.div>
              </chakra.div>
            );
          })}
        </chakra.div>
      </chakra.div>

      {/* Execution Command */}
      <chakra.div>
        <chakra.label
          _dark={{ color: 'gray.300' }}
          color="gray.700"
          display="block"
          fontSize="sm"
          fontWeight="medium"
          mb="2"
        >
          Execution Command *
        </chakra.label>

        <chakra.input
          _dark={{ borderColor: 'gray.600', bg: 'gray.800' }}
          _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
          borderColor="gray.300"
          borderRadius="md"
          borderWidth="1px"
          onChange={(e) => handleExecStartChange(e.target.value)}
          placeholder="uv run python main.py"
          px="3"
          py="2"
          value={formData.serviceType.exec_start}
          w="full"
        />

        <chakra.p
          _dark={{ color: 'gray.400' }}
          color="gray.500"
          fontSize="xs"
          mt="1"
        >
          Full command to start your service (use absolute paths when possible)
        </chakra.p>

        {/* Common Commands */}
        <chakra.div mt="3">
          <chakra.details>
            <chakra.summary
              _dark={{ color: 'blue.400' }}
              _hover={{ textDecoration: 'underline' }}
              color="blue.600"
              cursor="pointer"
              fontSize="xs"
            >
              Common command examples
            </chakra.summary>

            <chakra.div
              _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              mt="2"
              p="3"
            >
              <chakra.div display="flex" flexDirection="column" gap="2">
                {getCommonCommands().map((cmd) => (
                  <chakra.div key={cmd.label}>
                    <chakra.div
                      alignItems="center"
                      display="flex"
                      gap="2"
                      justifyContent="space-between"
                    >
                      <chakra.div>
                        <chakra.div fontSize="xs" fontWeight="medium">
                          {cmd.label}
                        </chakra.div>
                        <chakra.div
                          _dark={{ color: 'gray.400' }}
                          color="gray.600"
                          fontSize="xs"
                        >
                          {cmd.description}
                        </chakra.div>
                      </chakra.div>
                      <chakra.button
                        _dark={{
                          bg: 'blue.900',
                          color: 'blue.200',
                          _hover: { bg: 'blue.800' },
                        }}
                        _hover={{ bg: 'blue.100' }}
                        bg="blue.50"
                        borderRadius="sm"
                        color="blue.700"
                        fontSize="xs"
                        onClick={() => handleExecStartChange(cmd.command)}
                        px="2"
                        py="1"
                      >
                        Use
                      </chakra.button>
                    </chakra.div>
                    <chakra.code
                      _dark={{ bg: 'gray.900', color: 'gray.300' }}
                      bg="gray.100"
                      borderRadius="sm"
                      color="gray.700"
                      display="block"
                      fontSize="xs"
                      mt="1"
                      p="1"
                    >
                      {cmd.command}
                    </chakra.code>
                  </chakra.div>
                ))}
              </chakra.div>
            </chakra.div>
          </chakra.details>
        </chakra.div>
      </chakra.div>

      {/* Restart Policy */}
      <chakra.div>
        <chakra.label
          _dark={{ color: 'gray.300' }}
          color="gray.700"
          display="block"
          fontSize="sm"
          fontWeight="medium"
          mb="2"
        >
          Restart Policy
        </chakra.label>

        <chakra.select
          _dark={{ borderColor: 'gray.600', bg: 'gray.800' }}
          _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
          borderColor="gray.300"
          borderRadius="md"
          borderWidth="1px"
          onChange={(e) =>
            updateFormData('serviceType', {
              restart_policy: e.target.value as RestartPolicy,
            })
          }
          px="3"
          py="2"
          value={formData.serviceType.restart_policy}
          w="full"
        >
          {restartPolicyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} - {option.description}
            </option>
          ))}
        </chakra.select>
      </chakra.div>

      {/* Advanced Options Toggle */}
      <chakra.div>
        <chakra.button
          _dark={{ color: 'blue.400' }}
          _hover={{ textDecoration: 'underline' }}
          color="blue.600"
          fontSize="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide' : 'Show'} advanced options
        </chakra.button>

        {showAdvanced && (
          <chakra.div
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            mt="3"
            p="4"
          >
            <chakra.div display="flex" flexDirection="column" gap="4">
              {/* Stop Command */}
              <chakra.div>
                <chakra.label
                  _dark={{ color: 'gray.300' }}
                  color="gray.700"
                  display="block"
                  fontSize="sm"
                  fontWeight="medium"
                  mb="2"
                >
                  Stop Command (Optional)
                </chakra.label>
                <chakra.input
                  _dark={{ borderColor: 'gray.600', bg: 'gray.700' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 1px blue.500',
                  }}
                  borderColor="gray.300"
                  borderRadius="md"
                  borderWidth="1px"
                  onChange={(e) =>
                    updateFormData('serviceType', { exec_stop: e.target.value })
                  }
                  placeholder="/bin/kill -TERM $MAINPID"
                  px="3"
                  py="2"
                  value={formData.serviceType.exec_stop || ''}
                  w="full"
                />
                <chakra.p
                  _dark={{ color: 'gray.400' }}
                  color="gray.500"
                  fontSize="xs"
                  mt="1"
                >
                  Custom command to stop the service
                </chakra.p>
              </chakra.div>

              {/* Reload Command */}
              <chakra.div>
                <chakra.label
                  _dark={{ color: 'gray.300' }}
                  color="gray.700"
                  display="block"
                  fontSize="sm"
                  fontWeight="medium"
                  mb="2"
                >
                  Reload Command (Optional)
                </chakra.label>
                <chakra.input
                  _dark={{ borderColor: 'gray.600', bg: 'gray.700' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 1px blue.500',
                  }}
                  borderColor="gray.300"
                  borderRadius="md"
                  borderWidth="1px"
                  onChange={(e) =>
                    updateFormData('serviceType', {
                      exec_reload: e.target.value,
                    })
                  }
                  placeholder="/bin/kill -HUP $MAINPID"
                  px="3"
                  py="2"
                  value={formData.serviceType.exec_reload || ''}
                  w="full"
                />
                <chakra.p
                  _dark={{ color: 'gray.400' }}
                  color="gray.500"
                  fontSize="xs"
                  mt="1"
                >
                  Command to reload service configuration
                </chakra.p>
              </chakra.div>
            </chakra.div>
          </chakra.div>
        )}
      </chakra.div>

      {/* Validation */}
      {!formData.serviceType.exec_start && (
        <chakra.div
          _dark={{ bg: 'red.900', borderColor: 'red.700', color: 'red.200' }}
          bg="red.50"
          border="1px solid"
          borderColor="red.200"
          borderRadius="md"
          color="red.700"
          p="3"
        >
          <chakra.div alignItems="center" display="flex" gap="2">
            <FiInfo size={16} />
            <chakra.span fontSize="sm">
              Execution command is required to continue.
            </chakra.span>
          </chakra.div>
        </chakra.div>
      )}
    </chakra.div>
  );
};

export default ServiceTypeStep;
