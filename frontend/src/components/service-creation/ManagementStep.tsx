/**
 * Management settings step for service creation
 */

import { chakra } from '@chakra-ui/react';
import { FiEye, FiPlay, FiRotateCcw, FiSettings } from 'react-icons/fi';
import type { ServiceFormData } from '@/types';

interface ManagementStepProps {
  formData: ServiceFormData;
  updateFormData: (section: keyof ServiceFormData, data: any) => void;
}

const ManagementStep: React.FC<ManagementStepProps> = ({
  formData,
  updateFormData,
}) => {
  const managementOptions = [
    {
      key: 'auto_start' as const,
      label: 'Auto Start',
      description: 'Automatically start the service after creation',
      icon: FiPlay,
      color: 'green',
      recommended: true,
    },
    {
      key: 'auto_enable' as const,
      label: 'Auto Enable',
      description: 'Enable the service to start automatically on boot',
      icon: FiSettings,
      color: 'blue',
      recommended: true,
    },
    {
      key: 'auto_restart' as const,
      label: 'Auto Restart Monitoring',
      description:
        'Monitor service status and restart if failed (Owleyes feature)',
      icon: FiRotateCcw,
      color: 'orange',
      recommended: false,
    },
    {
      key: 'is_managed' as const,
      label: 'Managed by Owleyes',
      description: 'Allow Owleyes to control this service',
      icon: FiSettings,
      color: 'purple',
      recommended: true,
    },
    {
      key: 'is_monitored' as const,
      label: 'Monitored by Owleyes',
      description: 'Include this service in monitoring and status checks',
      icon: FiEye,
      color: 'teal',
      recommended: true,
    },
  ];

  const handleToggle = (
    key: keyof typeof formData.management,
    value: boolean
  ) => {
    updateFormData('management', {
      [key]: value,
    });
  };

  return (
    <chakra.div display="flex" flexDirection="column" gap="6">
      {/* Introduction */}
      <chakra.div
        _dark={{ bg: 'blue.900', borderColor: 'blue.700', color: 'blue.200' }}
        bg="blue.50"
        border="1px solid"
        borderColor="blue.200"
        borderRadius="md"
        color="blue.700"
        p="4"
      >
        <chakra.h3 fontSize="sm" fontWeight="medium" mb="2">
          Service Management Options
        </chakra.h3>
        <chakra.p fontSize="sm">
          Configure how your service will be managed by both systemd and
          Owleyes. These settings control automatic startup, monitoring, and
          restart behavior.
        </chakra.p>
      </chakra.div>

      {/* Management Options */}
      <chakra.div display="flex" flexDirection="column" gap="4">
        {managementOptions.map((option) => {
          const IconComponent = option.icon;
          const isEnabled = formData.management[option.key];
          const colorScheme = option.color;

          return (
            <chakra.div
              _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
              _hover={{
                borderColor: isEnabled ? `${colorScheme}.300` : 'gray.300',
                boxShadow: 'sm',
              }}
              bg="white"
              border="2px solid"
              borderColor={isEnabled ? `${colorScheme}.200` : 'gray.200'}
              borderRadius="lg"
              key={option.key}
              p="4"
              transition="all 0.2s"
            >
              <chakra.div alignItems="flex-start" display="flex" gap="4">
                {/* Icon and Toggle */}
                <chakra.div
                  alignItems="center"
                  display="flex"
                  flexDirection="column"
                  gap="3"
                >
                  <chakra.div
                    alignItems="center"
                    bg={isEnabled ? `${colorScheme}.500` : 'gray.400'}
                    borderRadius="full"
                    color="white"
                    display="flex"
                    h="10"
                    justifyContent="center"
                    transition="all 0.2s"
                    w="10"
                  >
                    <IconComponent size={20} />
                  </chakra.div>

                  <chakra.label
                    alignItems="center"
                    cursor="pointer"
                    display="flex"
                    position="relative"
                  >
                    <chakra.input
                      checked={isEnabled}
                      onChange={(e) =>
                        handleToggle(option.key, e.target.checked)
                      }
                      sr-only
                      type="checkbox"
                    />
                    <chakra.div
                      _dark={{
                        bg: isEnabled ? `${colorScheme}.500` : 'gray.600',
                      }}
                      bg={isEnabled ? `${colorScheme}.500` : 'gray.300'}
                      borderRadius="full"
                      h="6"
                      position="relative"
                      transition="all 0.2s"
                      w="11"
                    >
                      <chakra.div
                        bg="white"
                        borderRadius="full"
                        boxShadow="sm"
                        h="5"
                        left={isEnabled ? '22px' : '2px'}
                        position="absolute"
                        top="2px"
                        transition="all 0.2s"
                        w="5"
                      />
                    </chakra.div>
                  </chakra.label>
                </chakra.div>

                {/* Content */}
                <chakra.div flex="1">
                  <chakra.div alignItems="center" display="flex" gap="2" mb="2">
                    <chakra.h4 fontSize="lg" fontWeight="semibold">
                      {option.label}
                    </chakra.h4>

                    {option.recommended && (
                      <chakra.span
                        _dark={{
                          bg: 'green.900',
                          color: 'green.200',
                        }}
                        bg="green.100"
                        borderRadius="full"
                        color="green.800"
                        fontSize="xs"
                        fontWeight="medium"
                        px="2"
                        py="1"
                      >
                        Recommended
                      </chakra.span>
                    )}
                  </chakra.div>

                  <chakra.p
                    _dark={{ color: 'gray.400' }}
                    color="gray.600"
                    fontSize="sm"
                    lineHeight="1.5"
                  >
                    {option.description}
                  </chakra.p>

                  {/* Additional details for specific options */}
                  {option.key === 'auto_restart' && isEnabled && (
                    <chakra.div
                      _dark={{
                        bg: 'orange.900',
                        borderColor: 'orange.700',
                        color: 'orange.200',
                      }}
                      bg="orange.50"
                      border="1px solid"
                      borderColor="orange.200"
                      borderRadius="md"
                      color="orange.700"
                      fontSize="xs"
                      mt="3"
                      p="3"
                    >
                      <chakra.div fontWeight="medium" mb="1">
                        Auto Restart Monitoring
                      </chakra.div>
                      <chakra.p>
                        Owleyes will periodically check the service status and
                        automatically restart it if it fails. This is separate
                        from systemd's restart policy and provides additional
                        reliability monitoring.
                      </chakra.p>
                    </chakra.div>
                  )}

                  {option.key === 'auto_enable' && isEnabled && (
                    <chakra.div
                      _dark={{
                        bg: 'blue.900',
                        borderColor: 'blue.700',
                        color: 'blue.200',
                      }}
                      bg="blue.50"
                      border="1px solid"
                      borderColor="blue.200"
                      borderRadius="md"
                      color="blue.700"
                      fontSize="xs"
                      mt="3"
                      p="3"
                    >
                      <chakra.div fontWeight="medium" mb="1">
                        Boot Behavior
                      </chakra.div>
                      <chakra.p>
                        The service will be enabled to start automatically when
                        the system boots. For timer services, this enables the
                        timer (not the service itself).
                      </chakra.p>
                    </chakra.div>
                  )}
                </chakra.div>
              </chakra.div>
            </chakra.div>
          );
        })}
      </chakra.div>

      {/* Summary */}
      <chakra.div
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        bg="gray.50"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        p="4"
      >
        <chakra.h4 fontSize="sm" fontWeight="medium" mb="3">
          Configuration Summary
        </chakra.h4>

        <chakra.div display="flex" flexDirection="column" gap="2">
          {managementOptions.map((option) => {
            const isEnabled = formData.management[option.key];
            return (
              <chakra.div
                alignItems="center"
                display="flex"
                fontSize="sm"
                gap="2"
                key={option.key}
              >
                <chakra.div
                  bg={isEnabled ? 'green.500' : 'gray.400'}
                  borderRadius="full"
                  h="2"
                  w="2"
                />
                <chakra.span
                  _dark={{
                    color: isEnabled ? 'green.300' : 'gray.400',
                  }}
                  color={isEnabled ? 'green.700' : 'gray.500'}
                >
                  {option.label}: {isEnabled ? 'Enabled' : 'Disabled'}
                </chakra.span>
              </chakra.div>
            );
          })}
        </chakra.div>

        {/* Deployment Impact */}
        <chakra.div
          _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
          bg="white"
          border="1px solid"
          borderColor="gray.300"
          borderRadius="md"
          fontSize="xs"
          mt="4"
          p="3"
        >
          <chakra.div fontWeight="medium" mb="2">
            What happens after deployment:
          </chakra.div>
          <chakra.ul pl="4" spaceY="1">
            {formData.management.auto_start && (
              <chakra.li listStyleType="disc">
                Service will be started immediately
              </chakra.li>
            )}
            {formData.management.auto_enable && (
              <chakra.li listStyleType="disc">
                Service will be enabled for automatic startup on boot
              </chakra.li>
            )}
            {formData.management.is_monitored && (
              <chakra.li listStyleType="disc">
                Service will appear in Owleyes monitoring dashboard
              </chakra.li>
            )}
            {formData.management.auto_restart && (
              <chakra.li listStyleType="disc">
                Owleyes will monitor and auto-restart the service if it fails
              </chakra.li>
            )}
            {!formData.management.is_managed && (
              <chakra.li
                _dark={{ color: 'orange.400' }}
                color="orange.600"
                listStyleType="disc"
              >
                Service will be created but not manageable through Owleyes
              </chakra.li>
            )}
          </chakra.ul>
        </chakra.div>
      </chakra.div>
    </chakra.div>
  );
};

export default ManagementStep;
