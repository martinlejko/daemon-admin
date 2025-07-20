/**
 * Execution environment step for service creation
 */

import { chakra } from '@chakra-ui/react';
import { useState } from 'react';
import { FiFolder, FiPlus, FiTrash2, FiUser } from 'react-icons/fi';
import type { ServiceFormData } from '@/types';

interface ExecutionStepProps {
  formData: ServiceFormData;
  updateFormData: (section: keyof ServiceFormData, data: any) => void;
}

const ExecutionStep: React.FC<ExecutionStepProps> = ({
  formData,
  updateFormData,
}) => {
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

  const addEnvironmentVariable = () => {
    if (newEnvKey.trim() && newEnvValue.trim()) {
      updateFormData('execution', {
        environment_variables: {
          ...formData.execution.environment_variables,
          [newEnvKey]: newEnvValue,
        },
      });
      setNewEnvKey('');
      setNewEnvValue('');
    }
  };

  const removeEnvironmentVariable = (key: string) => {
    const newEnvVars = { ...formData.execution.environment_variables };
    delete newEnvVars[key];
    updateFormData('execution', {
      environment_variables: newEnvVars,
    });
  };

  const updateEnvironmentVariable = (
    oldKey: string,
    newKey: string,
    value: string
  ) => {
    const newEnvVars = { ...formData.execution.environment_variables };
    delete newEnvVars[oldKey];
    newEnvVars[newKey] = value;
    updateFormData('execution', {
      environment_variables: newEnvVars,
    });
  };

  const getCommonUsers = () => {
    return [
      { user: 'www-data', group: 'www-data', description: 'Web server user' },
      { user: 'nobody', group: 'nogroup', description: 'Unprivileged user' },
      { user: 'app', group: 'app', description: 'Generic application user' },
      {
        user: 'service',
        group: 'service',
        description: 'Generic service user',
      },
      {
        user: 'backup',
        group: 'backup',
        description: 'Backup operations user',
      },
    ];
  };

  const getCommonDirectories = () => {
    return [
      '/opt/app',
      '/opt/scripts',
      '/srv/app',
      '/var/lib/app',
      '/usr/local/bin',
      '/home/app',
    ];
  };

  const getCommonEnvVars = () => {
    return [
      { key: 'ENV', value: 'production', description: 'Environment type' },
      { key: 'PORT', value: '8080', description: 'Application port' },
      { key: 'LOG_LEVEL', value: 'info', description: 'Logging level' },
      {
        key: 'PYTHONPATH',
        value: '/opt/app',
        description: 'Python module path',
      },
      {
        key: 'NODE_ENV',
        value: 'production',
        description: 'Node.js environment',
      },
      {
        key: 'PATH',
        value: '/usr/local/bin:/usr/bin:/bin',
        description: 'Executable paths',
      },
    ];
  };

  return (
    <chakra.div display="flex" flexDirection="column" gap="6">
      {/* User and Group */}
      <chakra.div>
        <chakra.div alignItems="center" display="flex" gap="2" mb="4">
          <FiUser size={18} />
          <chakra.h3 fontSize="lg" fontWeight="medium">
            User & Group
          </chakra.h3>
        </chakra.div>

        <chakra.div display="grid" gap="4" gridTemplateColumns="1fr 1fr">
          {/* User */}
          <chakra.div>
            <chakra.label
              _dark={{ color: 'gray.300' }}
              color="gray.700"
              display="block"
              fontSize="sm"
              fontWeight="medium"
              mb="2"
            >
              User (Optional)
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
                updateFormData('execution', { user: e.target.value })
              }
              placeholder="www-data"
              px="3"
              py="2"
              value={formData.execution.user || ''}
              w="full"
            />
          </chakra.div>

          {/* Group */}
          <chakra.div>
            <chakra.label
              _dark={{ color: 'gray.300' }}
              color="gray.700"
              display="block"
              fontSize="sm"
              fontWeight="medium"
              mb="2"
            >
              Group (Optional)
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
                updateFormData('execution', { group: e.target.value })
              }
              placeholder="www-data"
              px="3"
              py="2"
              value={formData.execution.group || ''}
              w="full"
            />
          </chakra.div>
        </chakra.div>

        {/* Common User/Group Combinations */}
        <chakra.div mt="3">
          <chakra.details>
            <chakra.summary
              _dark={{ color: 'blue.400' }}
              _hover={{ textDecoration: 'underline' }}
              color="blue.600"
              cursor="pointer"
              fontSize="xs"
            >
              Common user/group combinations
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
                {getCommonUsers().map((combo) => (
                  <chakra.div
                    alignItems="center"
                    display="flex"
                    justifyContent="space-between"
                    key={combo.user}
                  >
                    <chakra.div>
                      <chakra.div fontSize="xs" fontWeight="medium">
                        {combo.user}:{combo.group}
                      </chakra.div>
                      <chakra.div
                        _dark={{ color: 'gray.400' }}
                        color="gray.600"
                        fontSize="xs"
                      >
                        {combo.description}
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
                      onClick={() =>
                        updateFormData('execution', {
                          user: combo.user,
                          group: combo.group,
                        })
                      }
                      px="2"
                      py="1"
                    >
                      Use
                    </chakra.button>
                  </chakra.div>
                ))}
              </chakra.div>
            </chakra.div>
          </chakra.details>
        </chakra.div>
      </chakra.div>

      {/* Working Directory */}
      <chakra.div>
        <chakra.div alignItems="center" display="flex" gap="2" mb="3">
          <FiFolder size={18} />
          <chakra.label
            _dark={{ color: 'gray.300' }}
            color="gray.700"
            fontSize="sm"
            fontWeight="medium"
          >
            Working Directory (Optional)
          </chakra.label>
        </chakra.div>

        <chakra.input
          _dark={{ borderColor: 'gray.600', bg: 'gray.800' }}
          _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
          borderColor="gray.300"
          borderRadius="md"
          borderWidth="1px"
          onChange={(e) =>
            updateFormData('execution', { working_directory: e.target.value })
          }
          placeholder="/opt/app"
          px="3"
          py="2"
          value={formData.execution.working_directory || ''}
          w="full"
        />

        <chakra.p
          _dark={{ color: 'gray.400' }}
          color="gray.500"
          fontSize="xs"
          mt="1"
        >
          Directory where the service will run (absolute path recommended)
        </chakra.p>

        {/* Common Directories */}
        <chakra.div mt="3">
          <chakra.details>
            <chakra.summary
              _dark={{ color: 'blue.400' }}
              _hover={{ textDecoration: 'underline' }}
              color="blue.600"
              cursor="pointer"
              fontSize="xs"
            >
              Common directories
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
              <chakra.div display="flex" flexWrap="wrap" gap="2">
                {getCommonDirectories().map((dir) => (
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
                    key={dir}
                    onClick={() =>
                      updateFormData('execution', { working_directory: dir })
                    }
                    px="2"
                    py="1"
                  >
                    {dir}
                  </chakra.button>
                ))}
              </chakra.div>
            </chakra.div>
          </chakra.details>
        </chakra.div>
      </chakra.div>

      {/* Environment Variables */}
      <chakra.div>
        <chakra.h3 fontSize="lg" fontWeight="medium" mb="4">
          Environment Variables
        </chakra.h3>

        {/* Existing environment variables */}
        {Object.keys(formData.execution.environment_variables).length > 0 && (
          <chakra.div
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            mb="4"
            overflow="hidden"
          >
            {Object.entries(formData.execution.environment_variables).map(
              ([key, value]) => (
                <chakra.div
                  _dark={{ borderColor: 'gray.700' }}
                  _notLast={{ borderBottomWidth: '1px' }}
                  alignItems="center"
                  borderColor="gray.200"
                  display="grid"
                  gap="3"
                  gridTemplateColumns="1fr 2fr auto"
                  key={key}
                  p="3"
                >
                  <chakra.input
                    _dark={{ borderColor: 'gray.600', bg: 'gray.700' }}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 1px blue.500',
                    }}
                    borderColor="gray.300"
                    borderRadius="sm"
                    borderWidth="1px"
                    fontSize="sm"
                    onChange={(e) =>
                      updateEnvironmentVariable(key, e.target.value, value)
                    }
                    px="2"
                    py="1"
                    value={key}
                  />
                  <chakra.input
                    _dark={{ borderColor: 'gray.600', bg: 'gray.700' }}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 1px blue.500',
                    }}
                    borderColor="gray.300"
                    borderRadius="sm"
                    borderWidth="1px"
                    fontSize="sm"
                    onChange={(e) =>
                      updateEnvironmentVariable(key, key, e.target.value)
                    }
                    px="2"
                    py="1"
                    value={value}
                  />
                  <chakra.button
                    _hover={{ color: 'red.600' }}
                    color="red.500"
                    onClick={() => removeEnvironmentVariable(key)}
                    p="1"
                  >
                    <FiTrash2 size={16} />
                  </chakra.button>
                </chakra.div>
              )
            )}
          </chakra.div>
        )}

        {/* Add new environment variable */}
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
                Key
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
                onChange={(e) => setNewEnvKey(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' && addEnvironmentVariable()
                }
                placeholder="PORT"
                px="2"
                py="2"
                value={newEnvKey}
              />
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
                Value
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
                onChange={(e) => setNewEnvValue(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' && addEnvironmentVariable()
                }
                placeholder="8080"
                px="2"
                py="2"
                value={newEnvValue}
              />
            </chakra.div>

            <chakra.button
              _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
              _hover={{ bg: 'blue.600' }}
              alignItems="center"
              bg="blue.500"
              borderRadius="md"
              color="white"
              disabled={!(newEnvKey.trim() && newEnvValue.trim())}
              display="flex"
              gap="1"
              onClick={addEnvironmentVariable}
              px="3"
              py="2"
            >
              <FiPlus size={16} />
              Add
            </chakra.button>
          </chakra.div>
        </chakra.div>

        {/* Common Environment Variables */}
        <chakra.div mt="3">
          <chakra.details>
            <chakra.summary
              _dark={{ color: 'blue.400' }}
              _hover={{ textDecoration: 'underline' }}
              color="blue.600"
              cursor="pointer"
              fontSize="xs"
            >
              Common environment variables
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
                {getCommonEnvVars().map((envVar) => (
                  <chakra.div
                    alignItems="center"
                    display="flex"
                    justifyContent="space-between"
                    key={envVar.key}
                  >
                    <chakra.div>
                      <chakra.div fontSize="xs" fontWeight="medium">
                        {envVar.key}={envVar.value}
                      </chakra.div>
                      <chakra.div
                        _dark={{ color: 'gray.400' }}
                        color="gray.600"
                        fontSize="xs"
                      >
                        {envVar.description}
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
                        updateFormData('execution', {
                          environment_variables: {
                            ...formData.execution.environment_variables,
                            [envVar.key]: envVar.value,
                          },
                        });
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
    </chakra.div>
  );
};

export default ExecutionStep;
