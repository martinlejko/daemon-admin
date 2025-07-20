/**
 * Basic information step for service creation
 */

import { chakra } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiInfo, FiServer } from 'react-icons/fi';
import { useServers } from '@/hooks/useApi';
import type { Server, ServiceFormData } from '@/types';

interface BasicInfoStepProps {
  formData: ServiceFormData;
  updateFormData: (section: keyof ServiceFormData, data: any) => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  updateFormData,
}) => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { data: serversData, isLoading: serversLoading } = useServers({
    enabled_only: true,
  });

  const servers = serversData?.servers || [];

  useEffect(() => {
    validateForm();
  }, [formData.basicInfo]);

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.basicInfo.name.trim()) {
      errors.push('Service name is required');
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.basicInfo.name)) {
      errors.push(
        'Service name can only contain letters, numbers, dots, underscores, and hyphens'
      );
    } else if (formData.basicInfo.name.endsWith('.service')) {
      errors.push('Service name should not include the .service extension');
    }

    if (!formData.basicInfo.server_id) {
      errors.push('Target server is required');
    }

    setValidationErrors(errors);
  };

  const handleNameChange = (value: string) => {
    updateFormData('basicInfo', { name: value });

    // Auto-generate display name if it's empty
    if (!formData.basicInfo.display_name) {
      const displayName = value
        .split(/[-_.]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      updateFormData('basicInfo', { display_name: displayName });
    }
  };

  const selectedServer = servers.find(
    (s) => s.id === formData.basicInfo.server_id
  );

  return (
    <chakra.div display="flex" flexDirection="column" gap="6">
      {/* Service Name */}
      <chakra.div>
        <chakra.label
          _dark={{ color: 'gray.300' }}
          color="gray.700"
          display="block"
          fontSize="sm"
          fontWeight="medium"
          mb="2"
        >
          Service Name *
        </chakra.label>
        <chakra.input
          _dark={{ borderColor: 'gray.600', bg: 'gray.800' }}
          _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
          borderColor="gray.300"
          borderRadius="md"
          borderWidth="1px"
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="my-service"
          px="3"
          py="2"
          value={formData.basicInfo.name}
          w="full"
        />
        <chakra.p
          _dark={{ color: 'gray.400' }}
          color="gray.500"
          fontSize="xs"
          mt="1"
        >
          Unique name for your service (without .service extension)
        </chakra.p>
      </chakra.div>

      {/* Display Name */}
      <chakra.div>
        <chakra.label
          _dark={{ color: 'gray.300' }}
          color="gray.700"
          display="block"
          fontSize="sm"
          fontWeight="medium"
          mb="2"
        >
          Display Name
        </chakra.label>
        <chakra.input
          _dark={{ borderColor: 'gray.600', bg: 'gray.800' }}
          _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
          borderColor="gray.300"
          borderRadius="md"
          borderWidth="1px"
          onChange={(e) =>
            updateFormData('basicInfo', { display_name: e.target.value })
          }
          placeholder="My Service"
          px="3"
          py="2"
          value={formData.basicInfo.display_name}
          w="full"
        />
        <chakra.p
          _dark={{ color: 'gray.400' }}
          color="gray.500"
          fontSize="xs"
          mt="1"
        >
          Human-readable name for the service
        </chakra.p>
      </chakra.div>

      {/* Description */}
      <chakra.div>
        <chakra.label
          _dark={{ color: 'gray.300' }}
          color="gray.700"
          display="block"
          fontSize="sm"
          fontWeight="medium"
          mb="2"
        >
          Description
        </chakra.label>
        <chakra.textarea
          _dark={{ borderColor: 'gray.600', bg: 'gray.800' }}
          _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
          borderColor="gray.300"
          borderRadius="md"
          borderWidth="1px"
          onChange={(e) =>
            updateFormData('basicInfo', { description: e.target.value })
          }
          placeholder="Brief description of what this service does"
          px="3"
          py="2"
          resize="vertical"
          rows={3}
          value={formData.basicInfo.description}
          w="full"
        />
      </chakra.div>

      {/* Target Server */}
      <chakra.div>
        <chakra.label
          _dark={{ color: 'gray.300' }}
          color="gray.700"
          display="block"
          fontSize="sm"
          fontWeight="medium"
          mb="2"
        >
          Target Server *
        </chakra.label>

        {serversLoading ? (
          <chakra.div
            _dark={{ color: 'gray.400' }}
            alignItems="center"
            color="gray.600"
            display="flex"
            gap="2"
            p="3"
          >
            <chakra.div
              animation="spin 1s linear infinite"
              border="2px solid"
              borderColor="gray.200"
              borderRadius="full"
              borderTopColor="blue.500"
              h="4"
              w="4"
            />
            Loading servers...
          </chakra.div>
        ) : (
          <chakra.select
            _dark={{ borderColor: 'gray.600', bg: 'gray.800' }}
            _focus={{
              borderColor: 'blue.500',
              boxShadow: '0 0 0 1px blue.500',
            }}
            borderColor="gray.300"
            borderRadius="md"
            borderWidth="1px"
            onChange={(e) =>
              updateFormData('basicInfo', {
                server_id: Number.parseInt(e.target.value, 10) || 0,
              })
            }
            px="3"
            py="2"
            value={formData.basicInfo.server_id || ''}
            w="full"
          >
            <option value="">Select a server</option>
            {servers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.display_name || server.hostname}
                {server.is_online ? ' (Online)' : ' (Offline)'}
              </option>
            ))}
          </chakra.select>
        )}

        {selectedServer && (
          <chakra.div
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            mt="3"
            p="3"
          >
            <chakra.div alignItems="center" display="flex" gap="2" mb="2">
              <FiServer size={16} />
              <chakra.span fontSize="sm" fontWeight="medium">
                {selectedServer.display_name || selectedServer.hostname}
              </chakra.span>
              <chakra.span
                _dark={{
                  bg: selectedServer.is_online ? 'green.900' : 'red.900',
                  color: selectedServer.is_online ? 'green.200' : 'red.200',
                }}
                bg={selectedServer.is_online ? 'green.100' : 'red.100'}
                borderRadius="full"
                color={selectedServer.is_online ? 'green.800' : 'red.800'}
                fontSize="xs"
                px="2"
                py="1"
              >
                {selectedServer.is_online ? 'Online' : 'Offline'}
              </chakra.span>
            </chakra.div>

            <chakra.div
              _dark={{ color: 'gray.400' }}
              color="gray.600"
              fontSize="xs"
            >
              {selectedServer.description && (
                <chakra.div mb="1">{selectedServer.description}</chakra.div>
              )}
              <chakra.div>
                OS: {selectedServer.os_name} {selectedServer.os_version} | Arch:{' '}
                {selectedServer.architecture} |{selectedServer.cpu_cores} CPU
                cores
              </chakra.div>
            </chakra.div>
          </chakra.div>
        )}

        {!serversLoading && servers.length === 0 && (
          <chakra.div
            _dark={{
              bg: 'yellow.900',
              borderColor: 'yellow.700',
              color: 'yellow.200',
            }}
            bg="yellow.50"
            border="1px solid"
            borderColor="yellow.200"
            borderRadius="md"
            color="yellow.800"
            mt="2"
            p="3"
          >
            <chakra.div alignItems="center" display="flex" gap="2">
              <FiInfo size={16} />
              <chakra.span fontSize="sm">
                No enabled servers available. Please add and enable servers
                first.
              </chakra.span>
            </chakra.div>
          </chakra.div>
        )}
      </chakra.div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <chakra.div
          _dark={{ bg: 'red.900', borderColor: 'red.700', color: 'red.200' }}
          bg="red.50"
          border="1px solid"
          borderColor="red.200"
          borderRadius="md"
          color="red.700"
          p="4"
        >
          <chakra.div fontSize="sm" fontWeight="medium" mb="2">
            Please fix the following errors:
          </chakra.div>
          <chakra.ul fontSize="sm" pl="4">
            {validationErrors.map((error, index) => (
              <chakra.li key={index} listStyleType="disc">
                {error}
              </chakra.li>
            ))}
          </chakra.ul>
        </chakra.div>
      )}
    </chakra.div>
  );
};

export default BasicInfoStep;
