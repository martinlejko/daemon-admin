/**
 * Advanced configuration step for dependencies, security, and logging
 */

import { chakra } from '@chakra-ui/react';
import { useState } from 'react';
import { FiFileText, FiLink, FiPlus, FiShield, FiTrash2 } from 'react-icons/fi';
import type { ServiceFormData } from '@/types';

interface AdvancedStepProps {
  formData: ServiceFormData;
  updateFormData: (section: keyof ServiceFormData, data: any) => void;
}

const AdvancedStep: React.FC<AdvancedStepProps> = ({
  formData,
  updateFormData,
}) => {
  const [newDependency, setNewDependency] = useState('');
  const [dependencyType, setDependencyType] = useState<
    'after_units' | 'wants_units' | 'requires_units'
  >('after_units');

  const addDependency = () => {
    if (newDependency.trim()) {
      const currentDeps = formData.advanced.dependencies[dependencyType] || [];
      updateFormData('advanced', {
        dependencies: {
          ...formData.advanced.dependencies,
          [dependencyType]: [...currentDeps, newDependency.trim()],
        },
      });
      setNewDependency('');
    }
  };

  const removeDependency = (
    type: keyof typeof formData.advanced.dependencies,
    index: number
  ) => {
    const currentDeps = formData.advanced.dependencies[type] || [];
    const newDeps = currentDeps.filter((_, i) => i !== index);
    updateFormData('advanced', {
      dependencies: {
        ...formData.advanced.dependencies,
        [type]: newDeps,
      },
    });
  };

  const getCommonDependencies = () => {
    return [
      { unit: 'network.target', description: 'Network is available' },
      {
        unit: 'network-online.target',
        description: 'Network is online and configured',
      },
      { unit: 'multi-user.target', description: 'Multi-user system is ready' },
      {
        unit: 'graphical.target',
        description: 'Graphical interface is available',
      },
      { unit: 'postgresql.service', description: 'PostgreSQL database' },
      { unit: 'mysql.service', description: 'MySQL database' },
      { unit: 'redis.service', description: 'Redis cache' },
      { unit: 'nginx.service', description: 'Nginx web server' },
      { unit: 'apache2.service', description: 'Apache web server' },
      { unit: 'docker.service', description: 'Docker daemon' },
    ];
  };

  const dependencyTypes = [
    {
      key: 'after_units' as const,
      label: 'After',
      description: 'Start this service after these units',
      icon: '→',
    },
    {
      key: 'wants_units' as const,
      label: 'Wants',
      description: 'Weak dependency - prefer these units to be running',
      icon: '⚡',
    },
    {
      key: 'requires_units' as const,
      label: 'Requires',
      description: 'Strong dependency - these units must be running',
      icon: '⚠',
    },
  ];

  return (
    <chakra.div display="flex" flexDirection="column" gap="8">
      {/* Dependencies */}
      <chakra.div>
        <chakra.div alignItems="center" display="flex" gap="2" mb="4">
          <FiLink size={18} />
          <chakra.h3 fontSize="lg" fontWeight="medium">
            Dependencies
          </chakra.h3>
        </chakra.div>

        {/* Existing Dependencies */}
        <chakra.div display="flex" flexDirection="column" gap="4" mb="4">
          {dependencyTypes.map((type) => {
            const dependencies = formData.advanced.dependencies[type.key] || [];
            if (dependencies.length === 0) return null;

            return (
              <chakra.div key={type.key}>
                <chakra.div
                  _dark={{ color: 'gray.300' }}
                  color="gray.700"
                  fontSize="sm"
                  fontWeight="medium"
                  mb="2"
                >
                  {type.icon} {type.label} ({dependencies.length})
                </chakra.div>
                <chakra.div
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  p="3"
                >
                  <chakra.div display="flex" flexWrap="wrap" gap="2">
                    {dependencies.map((dep, index) => (
                      <chakra.div
                        _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
                        alignItems="center"
                        bg="white"
                        border="1px solid"
                        borderColor="gray.300"
                        borderRadius="md"
                        display="flex"
                        gap="2"
                        key={index}
                        px="3"
                        py="2"
                      >
                        <chakra.span fontSize="sm">{dep}</chakra.span>
                        <chakra.button
                          _hover={{ color: 'red.600' }}
                          color="red.500"
                          onClick={() => removeDependency(type.key, index)}
                        >
                          <FiTrash2 size={14} />
                        </chakra.button>
                      </chakra.div>
                    ))}
                  </chakra.div>
                </chakra.div>
              </chakra.div>
            );
          })}
        </chakra.div>

        {/* Add New Dependency */}
        <chakra.div
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          p="4"
        >
          <chakra.div
            alignItems="end"
            display="grid"
            gap="3"
            gridTemplateColumns="1fr 2fr auto"
          >
            <chakra.div>
              <chakra.label
                _dark={{ color: 'gray.300' }}
                color="gray.700"
                display="block"
                fontSize="xs"
                fontWeight="medium"
                mb="1"
              >
                Type
              </chakra.label>
              <chakra.select
                _dark={{ borderColor: 'gray.600', bg: 'gray.800' }}
                _focus={{
                  borderColor: 'blue.500',
                  boxShadow: '0 0 0 1px blue.500',
                }}
                borderColor="gray.300"
                borderRadius="md"
                borderWidth="1px"
                fontSize="sm"
                onChange={(e) =>
                  setDependencyType(e.target.value as typeof dependencyType)
                }
                px="2"
                py="2"
                value={dependencyType}
              >
                {dependencyTypes.map((type) => (
                  <option key={type.key} value={type.key}>
                    {type.label}
                  </option>
                ))}
              </chakra.select>
            </chakra.div>

            <chakra.div>
              <chakra.label
                _dark={{ color: 'gray.300' }}
                color="gray.700"
                display="block"
                fontSize="xs"
                fontWeight="medium"
                mb="1"
              >
                Unit Name
              </chakra.label>
              <chakra.input
                _dark={{ borderColor: 'gray.600', bg: 'gray.800' }}
                _focus={{
                  borderColor: 'blue.500',
                  boxShadow: '0 0 0 1px blue.500',
                }}
                borderColor="gray.300"
                borderRadius="md"
                borderWidth="1px"
                fontSize="sm"
                onChange={(e) => setNewDependency(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDependency()}
                placeholder="network.target"
                px="2"
                py="2"
                value={newDependency}
              />
            </chakra.div>

            <chakra.button
              _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
              _hover={{ bg: 'blue.600' }}
              alignItems="center"
              bg="blue.500"
              borderRadius="md"
              color="white"
              disabled={!newDependency.trim()}
              display="flex"
              gap="1"
              onClick={addDependency}
              px="3"
              py="2"
            >
              <FiPlus size={16} />
              Add
            </chakra.button>
          </chakra.div>

          <chakra.div
            _dark={{ color: 'gray.400' }}
            color="gray.600"
            fontSize="xs"
            mt="2"
          >
            {dependencyTypes.find((t) => t.key === dependencyType)?.description}
          </chakra.div>
        </chakra.div>

        {/* Common Dependencies */}
        <chakra.div mt="3">
          <chakra.details>
            <chakra.summary
              _dark={{ color: 'blue.400' }}
              _hover={{ textDecoration: 'underline' }}
              color="blue.600"
              cursor="pointer"
              fontSize="xs"
            >
              Common dependencies
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
                {getCommonDependencies().map((dep) => (
                  <chakra.div
                    alignItems="center"
                    display="flex"
                    justifyContent="space-between"
                    key={dep.unit}
                  >
                    <chakra.div>
                      <chakra.div fontSize="xs" fontWeight="medium">
                        {dep.unit}
                      </chakra.div>
                      <chakra.div
                        _dark={{ color: 'gray.400' }}
                        color="gray.600"
                        fontSize="xs"
                      >
                        {dep.description}
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
                      onClick={() => {
                        setNewDependency(dep.unit);
                        addDependency();
                      }}
                      px="2"
                      py="1"
                    >
                      Add
                    </chakra.button>
                  </chakra.div>
                ))}
              </chakra.div>
            </chakra.div>
          </chakra.details>
        </chakra.div>
      </chakra.div>

      {/* Security */}
      <chakra.div>
        <chakra.div alignItems="center" display="flex" gap="2" mb="4">
          <FiShield size={18} />
          <chakra.h3 fontSize="lg" fontWeight="medium">
            Security & Sandboxing
          </chakra.h3>
        </chakra.div>

        <chakra.div display="flex" flexDirection="column" gap="4">
          {/* No New Privileges */}
          <chakra.div alignItems="center" display="flex" gap="3">
            <chakra.input
              checked={formData.advanced.security.no_new_privileges ?? false}
              h="4"
              onChange={(e) =>
                updateFormData('advanced', {
                  security: {
                    ...formData.advanced.security,
                    no_new_privileges: e.target.checked || undefined,
                  },
                })
              }
              type="checkbox"
              w="4"
            />
            <chakra.div>
              <chakra.label fontSize="sm" fontWeight="medium">
                No New Privileges
              </chakra.label>
              <chakra.div
                _dark={{ color: 'gray.400' }}
                color="gray.600"
                fontSize="xs"
              >
                Prevent the service from gaining additional privileges
              </chakra.div>
            </chakra.div>
          </chakra.div>

          {/* Private Tmp */}
          <chakra.div alignItems="center" display="flex" gap="3">
            <chakra.input
              checked={formData.advanced.security.private_tmp ?? false}
              h="4"
              onChange={(e) =>
                updateFormData('advanced', {
                  security: {
                    ...formData.advanced.security,
                    private_tmp: e.target.checked || undefined,
                  },
                })
              }
              type="checkbox"
              w="4"
            />
            <chakra.div>
              <chakra.label fontSize="sm" fontWeight="medium">
                Private /tmp
              </chakra.label>
              <chakra.div
                _dark={{ color: 'gray.400' }}
                color="gray.600"
                fontSize="xs"
              >
                Use a private /tmp directory for the service
              </chakra.div>
            </chakra.div>
          </chakra.div>

          {/* Protect Home */}
          <chakra.div alignItems="center" display="flex" gap="3">
            <chakra.input
              checked={formData.advanced.security.protect_home ?? false}
              h="4"
              onChange={(e) =>
                updateFormData('advanced', {
                  security: {
                    ...formData.advanced.security,
                    protect_home: e.target.checked || undefined,
                  },
                })
              }
              type="checkbox"
              w="4"
            />
            <chakra.div>
              <chakra.label fontSize="sm" fontWeight="medium">
                Protect /home
              </chakra.label>
              <chakra.div
                _dark={{ color: 'gray.400' }}
                color="gray.600"
                fontSize="xs"
              >
                Make /home directory inaccessible to the service
              </chakra.div>
            </chakra.div>
          </chakra.div>

          {/* Protect System */}
          <chakra.div>
            <chakra.label
              _dark={{ color: 'gray.300' }}
              color="gray.700"
              display="block"
              fontSize="sm"
              fontWeight="medium"
              mb="2"
            >
              Protect System Directories
            </chakra.label>
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
                updateFormData('advanced', {
                  security: {
                    ...formData.advanced.security,
                    protect_system: e.target.value || undefined,
                  },
                })
              }
              px="3"
              py="2"
              value={formData.advanced.security.protect_system || ''}
              w="full"
            >
              <option value="">No protection</option>
              <option value="yes">Read-only system directories</option>
              <option value="strict">
                Read-only system directories + /etc
              </option>
            </chakra.select>
            <chakra.p
              _dark={{ color: 'gray.400' }}
              color="gray.500"
              fontSize="xs"
              mt="1"
            >
              Protect critical system directories from modification
            </chakra.p>
          </chakra.div>
        </chakra.div>
      </chakra.div>

      {/* Logging */}
      <chakra.div>
        <chakra.div alignItems="center" display="flex" gap="2" mb="4">
          <FiFileText size={18} />
          <chakra.h3 fontSize="lg" fontWeight="medium">
            Logging Configuration
          </chakra.h3>
        </chakra.div>

        <chakra.div display="grid" gap="4" gridTemplateColumns="1fr 1fr">
          {/* Standard Output */}
          <chakra.div>
            <chakra.label
              _dark={{ color: 'gray.300' }}
              color="gray.700"
              display="block"
              fontSize="sm"
              fontWeight="medium"
              mb="2"
            >
              Standard Output
            </chakra.label>
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
                updateFormData('advanced', {
                  logging: {
                    ...formData.advanced.logging,
                    standard_output: e.target.value,
                  },
                })
              }
              px="3"
              py="2"
              value={formData.advanced.logging.standard_output}
              w="full"
            >
              <option value="journal">Journal (systemd)</option>
              <option value="null">Discard</option>
              <option value="syslog">Syslog</option>
              <option value="file:/var/log/myapp.log">File</option>
            </chakra.select>
          </chakra.div>

          {/* Standard Error */}
          <chakra.div>
            <chakra.label
              _dark={{ color: 'gray.300' }}
              color="gray.700"
              display="block"
              fontSize="sm"
              fontWeight="medium"
              mb="2"
            >
              Standard Error
            </chakra.label>
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
                updateFormData('advanced', {
                  logging: {
                    ...formData.advanced.logging,
                    standard_error: e.target.value,
                  },
                })
              }
              px="3"
              py="2"
              value={formData.advanced.logging.standard_error}
              w="full"
            >
              <option value="journal">Journal (systemd)</option>
              <option value="null">Discard</option>
              <option value="syslog">Syslog</option>
              <option value="file:/var/log/myapp-error.log">File</option>
            </chakra.select>
          </chakra.div>
        </chakra.div>

        {/* Syslog Identifier */}
        <chakra.div mt="4">
          <chakra.label
            _dark={{ color: 'gray.300' }}
            color="gray.700"
            display="block"
            fontSize="sm"
            fontWeight="medium"
            mb="2"
          >
            Syslog Identifier (Optional)
          </chakra.label>
          <chakra.input
            _dark={{ borderColor: 'gray.600', bg: 'gray.800' }}
            _focus={{
              borderColor: 'blue.500',
              boxShadow: '0 0 0 1px blue.500',
            }}
            borderColor="gray.300"
            borderRadius="md"
            borderWidth="1px"
            onChange={(e) =>
              updateFormData('advanced', {
                logging: {
                  ...formData.advanced.logging,
                  syslog_identifier: e.target.value || undefined,
                },
              })
            }
            placeholder="my-service"
            px="3"
            py="2"
            value={formData.advanced.logging.syslog_identifier || ''}
            w="full"
          />
          <chakra.p
            _dark={{ color: 'gray.400' }}
            color="gray.500"
            fontSize="xs"
            mt="1"
          >
            Custom identifier for syslog entries
          </chakra.p>
        </chakra.div>
      </chakra.div>
    </chakra.div>
  );
};

export default AdvancedStep;
