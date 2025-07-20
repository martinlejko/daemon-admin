/**
 * Add Server page - create a new server
 */

import { chakra } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiArrowLeft, FiPlus, FiServer, FiTrash2 } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FormField, { Input, Select, Textarea } from '@/components/ui/FormField';
import PageHeader from '@/components/ui/PageHeader';
import { getDividerStyling, getPageBackground } from '@/constants/colors';
import { useCreateServer } from '@/hooks/useApi';
import { useUIStore } from '@/store';

interface ServerFormData {
  hostname: string;
  display_name?: string;
  description?: string;
  ssh_port: number;
  ssh_username: string;
  ssh_password?: string;
  ssh_key_path?: string;
  ssh_key_passphrase?: string;
  connection_timeout: number;
  connection_retries: number;
  is_enabled: boolean;
  auto_discover_services: boolean;
  tags?: Record<string, string>;
}

const AddServer: React.FC = () => {
  const navigate = useNavigate();
  const { setPageTitle, setBreadcrumbs, addNotification } = useUIStore();
  const [authMethod, setAuthMethod] = useState<'password' | 'key'>('password');
  const [tagKey, setTagKey] = useState('');
  const [tagValue, setTagValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<ServerFormData>({
    defaultValues: {
      ssh_port: 22,
      connection_timeout: 30,
      connection_retries: 3,
      is_enabled: true,
      auto_discover_services: true,
      tags: {},
    },
  });

  const createServerMutation = useCreateServer();
  const watchedTags = watch('tags') || {};

  useEffect(() => {
    setPageTitle('Add Server');
    setBreadcrumbs([
      { label: 'Dashboard', href: '/' },
      { label: 'Servers', href: '/servers' },
      { label: 'Add Server' },
    ]);
  }, [setPageTitle, setBreadcrumbs]);

  const addTag = () => {
    if (tagKey.trim() && tagValue.trim()) {
      const currentTags = getValues('tags') || {};
      setValue('tags', {
        ...currentTags,
        [tagKey.trim()]: tagValue.trim(),
      });
      setTagKey('');
      setTagValue('');
    }
  };

  const removeTag = (key: string) => {
    const currentTags = getValues('tags') || {};
    const { [key]: removed, ...remaining } = currentTags;
    setValue('tags', remaining);
  };

  const onSubmit = async (data: ServerFormData) => {
    try {
      const serverData = {
        ...data,
        ssh_port: Number(data.ssh_port),
        connection_timeout: Number(data.connection_timeout),
        connection_retries: Number(data.connection_retries),
        // Only include auth method that's selected
        ...(authMethod === 'password'
          ? {
              ssh_password: data.ssh_password,
              ssh_key_path: undefined,
              ssh_key_passphrase: undefined,
            }
          : {
              ssh_key_path: data.ssh_key_path,
              ssh_key_passphrase: data.ssh_key_passphrase,
              ssh_password: undefined,
            }),
        // Clean up empty tags
        tags: Object.keys(watchedTags).length > 0 ? watchedTags : undefined,
      };

      const result = await createServerMutation.mutateAsync(serverData);

      addNotification({
        type: 'success',
        message: `Server "${data.hostname}" added successfully`,
      });

      navigate(`/servers/${result.id}`);
    } catch (error: any) {
      addNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Failed to add server',
      });
    }
  };

  return (
    <chakra.div minH="100vh" p="8" {...getPageBackground()}>
      <chakra.div maxW="2xl" mx="auto">
        <PageHeader
          actions={
            <Link to="/servers">
              <Button leftIcon={<FiArrowLeft />} variant="secondary">
                Back to Servers
              </Button>
            </Link>
          }
          subtitle="Connect a new server to your infrastructure"
          title="Add Server"
        />

        <Card>
          <chakra.form onSubmit={handleSubmit(onSubmit)}>
            <chakra.div display="flex" flexDirection="column" gap="6">
              {/* Basic Information */}
              <chakra.div>
                <chakra.h3
                  color="text"
                  fontSize="lg"
                  fontWeight="semibold"
                  mb="6"
                >
                  Basic Information
                </chakra.h3>

                <FormField
                  description="The server's hostname, domain name, or IP address"
                  error={errors.hostname?.message}
                  label="Hostname or IP Address"
                  required
                >
                  <Input
                    {...register('hostname', {
                      required: 'Hostname or IP address is required',
                    })}
                    placeholder="web-server-01.example.com or 192.168.1.100"
                  />
                </FormField>

                <FormField
                  description="A friendly name for this server (optional)"
                  error={errors.display_name?.message}
                  label="Display Name"
                >
                  <Input
                    {...register('display_name')}
                    placeholder="Production Web Server"
                  />
                </FormField>

                <FormField
                  description="Additional notes about this server (optional)"
                  error={errors.description?.message}
                  label="Description"
                >
                  <Textarea
                    {...register('description')}
                    placeholder="Production web server running nginx and our main application..."
                  />
                </FormField>
              </chakra.div>

              {/* SSH Configuration */}
              <chakra.div>
                <chakra.hr {...getDividerStyling()} mb="8" />
                <chakra.h3
                  color="text"
                  fontSize="lg"
                  fontWeight="semibold"
                  mb="6"
                >
                  SSH Configuration
                </chakra.h3>

                <chakra.div
                  display="grid"
                  gap="6"
                  gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                >
                  <FormField
                    error={errors.ssh_port?.message}
                    label="SSH Port"
                    required
                  >
                    <Input
                      type="number"
                      {...register('ssh_port', {
                        required: 'SSH port is required',
                        min: {
                          value: 1,
                          message: 'Port must be greater than 0',
                        },
                        max: {
                          value: 65_535,
                          message: 'Port must be less than 65536',
                        },
                      })}
                    />
                  </FormField>

                  <FormField
                    error={errors.ssh_username?.message}
                    label="SSH Username"
                    required
                  >
                    <Input
                      {...register('ssh_username', {
                        required: 'SSH username is required',
                      })}
                      placeholder="root"
                    />
                  </FormField>
                </chakra.div>

                {/* Authentication Method */}
                <FormField label="Authentication Method">
                  <chakra.div display="flex" gap="4" mb="4">
                    <chakra.label
                      alignItems="center"
                      cursor="pointer"
                      display="flex"
                      gap="2"
                    >
                      <chakra.input
                        checked={authMethod === 'password'}
                        onChange={() => setAuthMethod('password')}
                        type="radio"
                        value="password"
                      />
                      <chakra.span fontSize="sm">Password</chakra.span>
                    </chakra.label>
                    <chakra.label
                      alignItems="center"
                      cursor="pointer"
                      display="flex"
                      gap="2"
                    >
                      <chakra.input
                        checked={authMethod === 'key'}
                        onChange={() => setAuthMethod('key')}
                        type="radio"
                        value="key"
                      />
                      <chakra.span fontSize="sm">SSH Key</chakra.span>
                    </chakra.label>
                  </chakra.div>
                </FormField>

                {authMethod === 'password' ? (
                  <FormField
                    description="Password for SSH authentication"
                    error={errors.ssh_password?.message}
                    label="SSH Password"
                  >
                    <Input
                      type="password"
                      {...register('ssh_password')}
                      placeholder="Enter SSH password"
                    />
                  </FormField>
                ) : (
                  <>
                    <FormField
                      description="Path to SSH private key file"
                      error={errors.ssh_key_path?.message}
                      label="SSH Key Path"
                    >
                      <Input
                        {...register('ssh_key_path')}
                        placeholder="/home/user/.ssh/id_rsa"
                      />
                    </FormField>

                    <FormField
                      description="Passphrase for the SSH key (if encrypted)"
                      error={errors.ssh_key_passphrase?.message}
                      label="SSH Key Passphrase"
                    >
                      <Input
                        type="password"
                        {...register('ssh_key_passphrase')}
                        placeholder="Enter key passphrase (optional)"
                      />
                    </FormField>
                  </>
                )}
              </chakra.div>

              {/* Management Settings */}
              <chakra.div>
                <chakra.hr {...getDividerStyling()} mb="8" />
                <chakra.h3
                  color="text"
                  fontSize="lg"
                  fontWeight="semibold"
                  mb="6"
                >
                  Management Settings
                </chakra.h3>

                <chakra.div display="flex" flexDirection="column" gap="4">
                  <FormField
                    description="Control whether this server should be actively managed"
                    label="Server Management"
                  >
                    <chakra.label
                      alignItems="center"
                      cursor="pointer"
                      display="flex"
                      gap="3"
                    >
                      <chakra.input
                        type="checkbox"
                        {...register('is_enabled')}
                      />
                      <chakra.span fontSize="sm">
                        Enable server management
                      </chakra.span>
                    </chakra.label>
                  </FormField>

                  <FormField
                    description="Automatically discover and monitor services on this server"
                    label="Service Discovery"
                  >
                    <chakra.label
                      alignItems="center"
                      cursor="pointer"
                      display="flex"
                      gap="3"
                    >
                      <chakra.input
                        type="checkbox"
                        {...register('auto_discover_services')}
                      />
                      <chakra.span fontSize="sm">
                        Auto-discover services
                      </chakra.span>
                    </chakra.label>
                  </FormField>
                </chakra.div>
              </chakra.div>

              {/* Advanced Settings */}
              <chakra.div>
                <chakra.hr {...getDividerStyling()} mb="8" />
                <chakra.h3
                  color="text"
                  fontSize="lg"
                  fontWeight="semibold"
                  mb="6"
                >
                  Advanced Settings
                </chakra.h3>

                <chakra.div
                  display="grid"
                  gap="6"
                  gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                >
                  <FormField
                    error={errors.connection_timeout?.message}
                    label="Connection Timeout (seconds)"
                  >
                    <Input
                      type="number"
                      {...register('connection_timeout', {
                        min: {
                          value: 1,
                          message: 'Timeout must be at least 1 second',
                        },
                      })}
                    />
                  </FormField>

                  <FormField
                    error={errors.connection_retries?.message}
                    label="Connection Retries"
                  >
                    <Input
                      type="number"
                      {...register('connection_retries', {
                        min: {
                          value: 0,
                          message: 'Retries cannot be negative',
                        },
                      })}
                    />
                  </FormField>
                </chakra.div>
              </chakra.div>

              {/* Tags */}
              <chakra.div>
                <chakra.hr {...getDividerStyling()} mb="8" />
                <chakra.h3
                  color="text"
                  fontSize="lg"
                  fontWeight="semibold"
                  mb="6"
                >
                  Tags
                </chakra.h3>

                <FormField
                  description="Key-value pairs for organizing and categorizing servers"
                  label="Add Tags"
                >
                  <chakra.div display="flex" gap="3" mb="4">
                    <Input
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTagKey(e.target.value)
                      }
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) =>
                        e.key === 'Enter' && e.preventDefault()
                      }
                      placeholder="Key (e.g., environment)"
                      value={tagKey}
                    />
                    <Input
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTagValue(e.target.value)
                      }
                      onKeyPress={(
                        e: React.KeyboardEvent<HTMLInputElement>
                      ) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Value (e.g., production)"
                      value={tagValue}
                    />
                    <Button
                      disabled={!(tagKey.trim() && tagValue.trim())}
                      onClick={addTag}
                      type="button"
                      variant="secondary"
                    >
                      Add
                    </Button>
                  </chakra.div>
                </FormField>

                {/* Display existing tags */}
                {Object.keys(watchedTags).length > 0 && (
                  <chakra.div>
                    <chakra.p color="text.subtle" fontSize="sm" mb="3">
                      Current Tags:
                    </chakra.p>
                    <chakra.div display="flex" flexWrap="wrap" gap="2">
                      {Object.entries(watchedTags).map(([key, value]) => (
                        <chakra.div
                          alignItems="center"
                          bg="bg.subtle"
                          border="1px solid"
                          borderColor="border"
                          borderRadius="md"
                          display="flex"
                          gap="2"
                          key={key}
                          px="3"
                          py="1"
                        >
                          <chakra.span color="text" fontSize="sm">
                            <chakra.span fontWeight="medium">
                              {key}:
                            </chakra.span>{' '}
                            {value}
                          </chakra.span>
                          <chakra.button
                            _hover={{ color: 'negative' }}
                            alignItems="center"
                            color="text.subtle"
                            display="flex"
                            onClick={() => removeTag(key)}
                            type="button"
                          >
                            <FiTrash2 size={12} />
                          </chakra.button>
                        </chakra.div>
                      ))}
                    </chakra.div>
                  </chakra.div>
                )}
              </chakra.div>

              {/* Form Actions */}
              <chakra.div
                borderColor="border.subtle"
                borderTop="1px solid"
                display="flex"
                gap="3"
                justifyContent="flex-end"
                pt="6"
              >
                <Link to="/servers">
                  <Button variant="secondary">Cancel</Button>
                </Link>
                <Button
                  leftIcon={<FiPlus />}
                  loading={createServerMutation.isPending}
                  type="submit"
                >
                  Add Server
                </Button>
              </chakra.div>
            </chakra.div>
          </chakra.form>
        </Card>
      </chakra.div>
    </chakra.div>
  );
};

export default AddServer;
