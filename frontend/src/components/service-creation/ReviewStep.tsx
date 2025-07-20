/**
 * Final review step with configuration summary and deployment
 */

import { chakra } from '@chakra-ui/react';
import { useState } from 'react';
import {
  FiAlertCircle,
  FiCheck,
  FiClock,
  FiEye,
  FiFileText,
  FiFolder,
  FiLoader,
  FiPlay,
  FiServer,
  FiSettings,
  FiShield,
  FiUser,
} from 'react-icons/fi';
import { type ServiceFormData, SystemdServiceType } from '@/types';

interface ReviewStepProps {
  formData: ServiceFormData;
  onDeploy: () => Promise<void>;
  isDeploying?: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  onDeploy,
  isDeploying = false,
}) => {
  const [showSystemdPreview, setShowSystemdPreview] = useState(false);

  const getSystemdPreview = () => {
    const lines = [
      '[Unit]',
      `Description=${formData.basicInfo.display_name || formData.basicInfo.name}`,
      'After=network.target',
    ];

    if (formData.advanced.dependencies.after_units?.length) {
      lines.push(
        `After=${formData.advanced.dependencies.after_units.join(' ')}`
      );
    }
    if (formData.advanced.dependencies.wants_units?.length) {
      lines.push(
        `Wants=${formData.advanced.dependencies.wants_units.join(' ')}`
      );
    }
    if (formData.advanced.dependencies.requires_units?.length) {
      lines.push(
        `Requires=${formData.advanced.dependencies.requires_units.join(' ')}`
      );
    }

    lines.push('', '[Service]');
    lines.push(`Type=${formData.serviceType.systemd_type}`);
    lines.push(`ExecStart=${formData.serviceType.exec_start}`);

    if (formData.serviceType.exec_stop) {
      lines.push(`ExecStop=${formData.serviceType.exec_stop}`);
    }
    if (formData.serviceType.exec_reload) {
      lines.push(`ExecReload=${formData.serviceType.exec_reload}`);
    }

    lines.push(`Restart=${formData.serviceType.restart_policy}`);

    if (formData.execution.user) {
      lines.push(`User=${formData.execution.user}`);
    }
    if (formData.execution.group) {
      lines.push(`Group=${formData.execution.group}`);
    }
    if (formData.execution.working_directory) {
      lines.push(`WorkingDirectory=${formData.execution.working_directory}`);
    }

    // Environment variables
    Object.entries(formData.execution.environment_variables).forEach(
      ([key, value]) => {
        lines.push(`Environment="${key}=${value}"`);
      }
    );

    // Security settings
    if (formData.advanced.security.no_new_privileges) {
      lines.push('NoNewPrivileges=true');
    }
    if (formData.advanced.security.private_tmp) {
      lines.push('PrivateTmp=true');
    }
    if (formData.advanced.security.protect_home) {
      lines.push('ProtectHome=true');
    }
    if (formData.advanced.security.protect_system) {
      lines.push(`ProtectSystem=${formData.advanced.security.protect_system}`);
    }

    // Logging
    if (formData.advanced.logging.standard_output !== 'journal') {
      lines.push(`StandardOutput=${formData.advanced.logging.standard_output}`);
    }
    if (formData.advanced.logging.standard_error !== 'journal') {
      lines.push(`StandardError=${formData.advanced.logging.standard_error}`);
    }
    if (formData.advanced.logging.syslog_identifier) {
      lines.push(
        `SyslogIdentifier=${formData.advanced.logging.syslog_identifier}`
      );
    }

    lines.push('', '[Install]');
    lines.push('WantedBy=multi-user.target');

    return lines.join('\n');
  };

  const getTimerPreview = () => {
    if (!formData.timer) return '';

    const lines = [
      '[Unit]',
      `Description=Timer for ${formData.basicInfo.display_name || formData.basicInfo.name}`,
      `Requires=${formData.basicInfo.name}.service`,
      '',
      '[Timer]',
    ];

    if (formData.timer.on_calendar) {
      lines.push(`OnCalendar=${formData.timer.on_calendar}`);
    }
    if (formData.timer.persistent) {
      lines.push('Persistent=true');
    }
    if (formData.timer.wake_system) {
      lines.push('WakeSystem=true');
    }
    if (formData.timer.accuracy_sec) {
      lines.push(`AccuracySec=${formData.timer.accuracy_sec}`);
    }
    if (formData.timer.randomized_delay_sec) {
      lines.push(`RandomizedDelaySec=${formData.timer.randomized_delay_sec}`);
    }

    lines.push('', '[Install]');
    lines.push('WantedBy=timers.target');

    return lines.join('\n');
  };

  const getSummaryItems = () => {
    const items = [
      {
        icon: FiServer,
        label: 'Server',
        value: formData.basicInfo.server_id || 'Not selected',
        color: formData.basicInfo.server_id ? 'green' : 'red',
      },
      {
        icon: FiSettings,
        label: 'Service Name',
        value: formData.basicInfo.name || 'Not set',
        color: formData.basicInfo.name ? 'green' : 'red',
      },
      {
        icon: FiPlay,
        label: 'Service Type',
        value: formData.serviceType.systemd_type || 'Not set',
        color: formData.serviceType.systemd_type ? 'green' : 'red',
      },
      {
        icon: FiClock,
        label: 'Timer',
        value: formData.timer ? 'Enabled' : 'Disabled',
        color: 'blue',
      },
    ];

    if (formData.execution.user) {
      items.push({
        icon: FiUser,
        label: 'User',
        value: `${formData.execution.user}${formData.execution.group ? `:${formData.execution.group}` : ''}`,
        color: 'blue',
      });
    }

    if (formData.execution.working_directory) {
      items.push({
        icon: FiFolder,
        label: 'Working Directory',
        value: formData.execution.working_directory,
        color: 'blue',
      });
    }

    const envCount = Object.keys(
      formData.execution.environment_variables
    ).length;
    if (envCount > 0) {
      items.push({
        icon: FiSettings,
        label: 'Environment Variables',
        value: `${envCount} variable${envCount > 1 ? 's' : ''}`,
        color: 'blue',
      });
    }

    const securityFeatures = [
      formData.advanced.security.no_new_privileges && 'NoNewPrivileges',
      formData.advanced.security.private_tmp && 'PrivateTmp',
      formData.advanced.security.protect_home && 'ProtectHome',
      formData.advanced.security.protect_system && 'ProtectSystem',
    ].filter(Boolean);

    if (securityFeatures.length > 0) {
      items.push({
        icon: FiShield,
        label: 'Security Features',
        value: `${securityFeatures.length} enabled`,
        color: 'green',
      });
    }

    const managementFeatures = [
      formData.management.auto_start && 'Auto Start',
      formData.management.auto_enable && 'Auto Enable',
      formData.management.is_monitored && 'Monitored',
      formData.management.auto_restart && 'Auto Restart',
    ].filter(Boolean);

    if (managementFeatures.length > 0) {
      items.push({
        icon: FiEye,
        label: 'Management',
        value: `${managementFeatures.length} feature${managementFeatures.length > 1 ? 's' : ''}`,
        color: 'purple',
      });
    }

    return items;
  };

  const getValidationErrors = () => {
    const errors = [];

    if (!formData.basicInfo.name) {
      errors.push('Service name is required');
    }
    if (!formData.basicInfo.server_id) {
      errors.push('Target server must be selected');
    }
    if (!formData.serviceType.exec_start) {
      errors.push('Execution command is required');
    }
    if (
      formData.timer &&
      !formData.timer.on_calendar &&
      !formData.timer.cron_expression
    ) {
      errors.push('Timer schedule must be configured');
    }

    return errors;
  };

  const validationErrors = getValidationErrors();
  const isValid = validationErrors.length === 0;

  return (
    <chakra.div display="flex" flexDirection="column" gap="6">
      {/* Configuration Summary */}
      <chakra.div>
        <chakra.h3 fontSize="lg" fontWeight="medium" mb="4">
          Configuration Summary
        </chakra.h3>

        <chakra.div
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          overflow="hidden"
        >
          {getSummaryItems().map((item, index) => {
            const IconComponent = item.icon;

            return (
              <chakra.div
                _dark={{ borderColor: 'gray.700' }}
                _notLast={{ borderBottomWidth: '1px' }}
                alignItems="center"
                borderColor="gray.200"
                display="flex"
                gap="3"
                key={index}
                p="4"
              >
                <chakra.div
                  alignItems="center"
                  bg={`${item.color}.500`}
                  borderRadius="full"
                  color="white"
                  display="flex"
                  h="8"
                  justifyContent="center"
                  w="8"
                >
                  <IconComponent size={16} />
                </chakra.div>

                <chakra.div flex="1">
                  <chakra.div fontSize="sm" fontWeight="medium">
                    {item.label}
                  </chakra.div>
                  <chakra.div
                    _dark={{ color: 'gray.400' }}
                    color="gray.600"
                    fontSize="sm"
                  >
                    {item.value}
                  </chakra.div>
                </chakra.div>
              </chakra.div>
            );
          })}
        </chakra.div>
      </chakra.div>

      {/* Validation */}
      {!isValid && (
        <chakra.div
          _dark={{ bg: 'red.900', borderColor: 'red.700', color: 'red.200' }}
          bg="red.50"
          border="1px solid"
          borderColor="red.200"
          borderRadius="md"
          p="4"
        >
          <chakra.div alignItems="center" display="flex" gap="2" mb="3">
            <FiAlertCircle size={18} />
            <chakra.h4 fontSize="sm" fontWeight="medium">
              Configuration Issues
            </chakra.h4>
          </chakra.div>

          <chakra.ul pl="4" spaceY="1">
            {validationErrors.map((error, index) => (
              <chakra.li fontSize="sm" key={index} listStyleType="disc">
                {error}
              </chakra.li>
            ))}
          </chakra.ul>
        </chakra.div>
      )}

      {/* Systemd File Preview */}
      <chakra.div>
        <chakra.button
          _dark={{ color: 'blue.400' }}
          _hover={{ textDecoration: 'underline' }}
          color="blue.600"
          fontSize="sm"
          onClick={() => setShowSystemdPreview(!showSystemdPreview)}
        >
          {showSystemdPreview ? 'Hide' : 'Show'} systemd file preview
        </chakra.button>

        {showSystemdPreview && (
          <chakra.div mt="3">
            {/* Service file */}
            <chakra.div
              _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              mb="3"
              overflow="hidden"
            >
              <chakra.div
                _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
                bg="gray.100"
                borderBottomWidth="1px"
                borderColor="gray.200"
                fontSize="xs"
                fontWeight="medium"
                px="3"
                py="2"
              >
                {formData.basicInfo.name}.service
              </chakra.div>
              <chakra.pre
                fontFamily="mono"
                fontSize="xs"
                lineHeight="1.4"
                overflow="auto"
                p="3"
                whiteSpace="pre"
              >
                {getSystemdPreview()}
              </chakra.pre>
            </chakra.div>

            {/* Timer file (if applicable) */}
            {formData.timer && (
              <chakra.div
                _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                overflow="hidden"
              >
                <chakra.div
                  _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
                  bg="gray.100"
                  borderBottomWidth="1px"
                  borderColor="gray.200"
                  fontSize="xs"
                  fontWeight="medium"
                  px="3"
                  py="2"
                >
                  {formData.basicInfo.name}.timer
                </chakra.div>
                <chakra.pre
                  fontFamily="mono"
                  fontSize="xs"
                  lineHeight="1.4"
                  overflow="auto"
                  p="3"
                  whiteSpace="pre"
                >
                  {getTimerPreview()}
                </chakra.pre>
              </chakra.div>
            )}
          </chakra.div>
        )}
      </chakra.div>

      {/* Deployment Actions */}
      <chakra.div
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        bg="gray.50"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        p="4"
      >
        <chakra.h4 fontSize="sm" fontWeight="medium" mb="3">
          Deployment Actions
        </chakra.h4>

        <chakra.div
          _dark={{ color: 'gray.400' }}
          color="gray.600"
          fontSize="xs"
          mb="4"
        >
          The following actions will be performed on the target server:
        </chakra.div>

        <chakra.ul fontSize="sm" mb="4" pl="4" spaceY="2">
          <chakra.li listStyleType="disc">
            Create systemd service file: /etc/systemd/system/
            {formData.basicInfo.name}.service
          </chakra.li>
          {formData.timer && (
            <chakra.li listStyleType="disc">
              Create systemd timer file: /etc/systemd/system/
              {formData.basicInfo.name}.timer
            </chakra.li>
          )}
          <chakra.li listStyleType="disc">
            Reload systemd daemon configuration
          </chakra.li>
          {formData.management.auto_enable && (
            <chakra.li listStyleType="disc">
              Enable service for automatic startup
            </chakra.li>
          )}
          {formData.management.auto_start && (
            <chakra.li listStyleType="disc">
              Start the service immediately
            </chakra.li>
          )}
          {formData.management.is_monitored && (
            <chakra.li listStyleType="disc">
              Add service to Owleyes monitoring
            </chakra.li>
          )}
        </chakra.ul>

        <chakra.button
          _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
          _hover={{ bg: isValid ? 'green.600' : undefined }}
          alignItems="center"
          bg={isValid ? 'green.500' : 'gray.400'}
          borderRadius="md"
          color="white"
          disabled={!isValid || isDeploying}
          display="flex"
          fontSize="sm"
          fontWeight="medium"
          gap="2"
          justifyContent="center"
          onClick={onDeploy}
          px="4"
          py="2"
          w="full"
        >
          {isDeploying ? (
            <>
              <chakra.div
                animation="spin 1s linear infinite"
                borderColor="currentColor"
                borderRadius="full"
                borderTopColor="transparent"
                borderWidth="2px"
                h="4"
                w="4"
              />
              <chakra.span>Deploying Service...</chakra.span>
            </>
          ) : (
            <>
              <FiCheck size={16} />
              <chakra.span>Deploy Service</chakra.span>
            </>
          )}
        </chakra.button>

        {!isValid && (
          <chakra.div
            _dark={{ color: 'red.400' }}
            color="red.600"
            fontSize="xs"
            mt="2"
            textAlign="center"
          >
            Please fix the configuration issues above before deploying
          </chakra.div>
        )}
      </chakra.div>
    </chakra.div>
  );
};

export default ReviewStep;
