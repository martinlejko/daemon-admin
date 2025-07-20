/**
 * Edit Server page - update an existing server
 */

import { chakra } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FormField, { Input, Textarea } from '@/components/ui/FormField';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import { getDividerStyling, getPageBackground } from '@/constants/colors';
import { useServer, useUpdateServer } from '@/hooks/useApi';
import { useUIStore } from '@/store';

interface ServerFormData {
  hostname: string;
  display_name?: string;
  description?: string;
  ssh_port: number;
  ssh_username: string;
  ssh_password?: string;
  ssh_key_path?: string;
  connection_timeout: number;
  max_retries: number;
}

const EditServer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPageTitle, setBreadcrumbs, addNotification } = useUIStore();
  const [authMethod, setAuthMethod] = useState<'password' | 'key'>('password');

  const serverId = Number.parseInt(id || '0', 10);
  const { data: server, isLoading, error } = useServer(serverId);
  const updateServerMutation = useUpdateServer(serverId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ServerFormData>();

  useEffect(() => {
    if (server) {
      setPageTitle(`Edit ${server.display_name || server.hostname}`);
      setBreadcrumbs([
        { label: 'Dashboard', href: '/' },
        { label: 'Servers', href: '/servers' },
        {
          label: server.display_name || server.hostname,
          href: `/servers/${server.id}`,
        },
        { label: 'Edit' },
      ]);

      // Set initial auth method based on existing data (assuming password if no key specified)
      setAuthMethod('password');

      // Reset form with server data
      reset({
        hostname: server.hostname,
        display_name: server.display_name || '',
        description: server.description || '',
        ssh_port: server.ssh_port,
        ssh_username: server.ssh_username,
        connection_timeout: server.connection_timeout,
        max_retries: server.connection_retries,
      });
    }
  }, [server, setPageTitle, setBreadcrumbs, reset]);

  const onSubmit = async (data: ServerFormData) => {
    try {
      const serverData = {
        ...data,
        ssh_port: Number(data.ssh_port),
        connection_timeout: Number(data.connection_timeout),
        max_retries: Number(data.max_retries),
        // Only include auth method that's selected
        ...(authMethod === 'password'
          ? { ssh_password: data.ssh_password, ssh_key_path: undefined }
          : { ssh_key_path: data.ssh_key_path, ssh_password: undefined }),
      };

      await updateServerMutation.mutateAsync(serverData);

      addNotification({
        type: 'success',
        message: `Server "${data.hostname}" updated successfully`,
      });

      navigate(`/servers/${serverId}`);
    } catch (error: any) {
      addNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Failed to update server',
      });
    }
  };

  if (isLoading) {
    return (
      <chakra.div p="8" {...getPageBackground()} minH="100vh">
        <chakra.div maxW="2xl" mx="auto">
          <LoadingSpinner fullPage message="Loading server details..." />
        </chakra.div>
      </chakra.div>
    );
  }

  if (error || !server) {
    return (
      <chakra.div p="8" {...getPageBackground()} minH="100vh">
        <chakra.div maxW="2xl" mx="auto">
          <Card>
            <chakra.div py="8" textAlign="center">
              <chakra.h3
                color="text"
                fontSize="lg"
                fontWeight="semibold"
                mb="2"
              >
                Server not found
              </chakra.h3>
              <chakra.p color="text.subtle" mb="6">
                The server you're looking for doesn't exist or has been deleted.
              </chakra.p>
              <Link to="/servers">
                <Button leftIcon={<FiArrowLeft />}>Back to Servers</Button>
              </Link>
            </chakra.div>
          </Card>
        </chakra.div>
      </chakra.div>
    );
  }

  return (
    <chakra.div p="8" {...getPageBackground()} minH="100vh">
      <chakra.div maxW="2xl" mx="auto">
        <PageHeader
          actions={
            <Link to={`/servers/${serverId}`}>
              <Button leftIcon={<FiArrowLeft />} variant="secondary">
                Back to Server
              </Button>
            </Link>
          }
          subtitle={`Update configuration for ${server.display_name || server.hostname}`}
          title="Edit Server"
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
                  error={errors.display_name?.message}
                  label="Display Name"
                >
                  <Input
                    {...register('display_name')}
                    placeholder="Production Web Server"
                  />
                </FormField>

                <FormField
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
                    description="Leave blank to keep existing password"
                    error={errors.ssh_password?.message}
                    label="SSH Password"
                  >
                    <Input
                      type="password"
                      {...register('ssh_password')}
                      placeholder="Enter new SSH password (optional)"
                    />
                  </FormField>
                ) : (
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
                )}
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
                    error={errors.max_retries?.message}
                    label="Max Retries"
                  >
                    <Input
                      type="number"
                      {...register('max_retries', {
                        min: {
                          value: 0,
                          message: 'Retries cannot be negative',
                        },
                      })}
                    />
                  </FormField>
                </chakra.div>
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
                <Link to={`/servers/${serverId}`}>
                  <Button variant="secondary">Cancel</Button>
                </Link>
                <Button
                  leftIcon={<FiSave />}
                  loading={updateServerMutation.isPending}
                  type="submit"
                >
                  Save Changes
                </Button>
              </chakra.div>
            </chakra.div>
          </chakra.form>
        </Card>
      </chakra.div>
    </chakra.div>
  );
};

export default EditServer;
