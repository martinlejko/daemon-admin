/**
 * Add Server page - create a new server
 */

import { chakra } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiArrowLeft, FiPlus, FiServer } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateServer } from '@/hooks/useApi';
import { useUIStore } from '@/store';
import Button from '@/components/UI/Button';
import Card from '@/components/UI/Card';
import FormField, { Input, Textarea, Select } from '@/components/UI/FormField';
import PageHeader from '@/components/UI/PageHeader';

interface ServerFormData {
  hostname: string;
  ip_address: string;
  display_name?: string;
  description?: string;
  ssh_port: number;
  ssh_username: string;
  ssh_password?: string;
  ssh_key_path?: string;
  connection_timeout: number;
  max_retries: number;
  tags?: Record<string, string>;
}

const AddServer: React.FC = () => {
  const navigate = useNavigate();
  const { setPageTitle, setBreadcrumbs, addNotification } = useUIStore();
  const [authMethod, setAuthMethod] = useState<'password' | 'key'>('password');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ServerFormData>({
    defaultValues: {
      ssh_port: 22,
      connection_timeout: 30,
      max_retries: 3,
    },
  });

  const createServerMutation = useCreateServer();

  useEffect(() => {
    setPageTitle('Add Server');
    setBreadcrumbs([
      { label: 'Dashboard', href: '/' },
      { label: 'Servers', href: '/servers' },
      { label: 'Add Server' },
    ]);
  }, [setPageTitle, setBreadcrumbs]);

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
          : { ssh_key_path: data.ssh_key_path, ssh_password: undefined }
        ),
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
    <chakra.div p="8" bg="bg.subtle" minH="100vh">
      <chakra.div maxW="2xl" mx="auto">
        <PageHeader
          title="Add Server"
          subtitle="Connect a new server to your infrastructure"
          actions={
            <Link to="/servers">
              <Button variant="secondary" leftIcon={<FiArrowLeft />}>
                Back to Servers
              </Button>
            </Link>
          }
        />

        <Card>
          <chakra.form onSubmit={handleSubmit(onSubmit)}>
            <chakra.div display="flex" flexDirection="column" gap="6">
              {/* Basic Information */}
              <chakra.div>
                <chakra.h3 fontSize="lg" fontWeight="semibold" mb="4" color="text">
                  Basic Information
                </chakra.h3>
                
                <chakra.div display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="6">
                  <FormField
                    label="Hostname"
                    required
                    error={errors.hostname?.message}
                    description="The server's hostname or domain name"
                  >
                    <Input
                      {...register('hostname', { 
                        required: 'Hostname is required' 
                      })}
                      placeholder="web-server-01"
                    />
                  </FormField>

                  <FormField
                    label="IP Address"
                    required
                    error={errors.ip_address?.message}
                    description="The server's IP address"
                  >
                    <Input
                      {...register('ip_address', { 
                        required: 'IP address is required',
                        pattern: {
                          value: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
                          message: 'Invalid IP address format'
                        }
                      })}
                      placeholder="192.168.1.100"
                    />
                  </FormField>
                </chakra.div>

                <FormField
                  label="Display Name"
                  error={errors.display_name?.message}
                  description="A friendly name for this server (optional)"
                >
                  <Input
                    {...register('display_name')}
                    placeholder="Production Web Server"
                  />
                </FormField>

                <FormField
                  label="Description"
                  error={errors.description?.message}
                  description="Additional notes about this server (optional)"
                >
                  <Textarea
                    {...register('description')}
                    placeholder="Production web server running nginx and our main application..."
                  />
                </FormField>
              </chakra.div>

              {/* SSH Configuration */}
              <chakra.div>
                <chakra.h3 fontSize="lg" fontWeight="semibold" mb="4" color="text">
                  SSH Configuration
                </chakra.h3>
                
                <chakra.div display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="6">
                  <FormField
                    label="SSH Port"
                    required
                    error={errors.ssh_port?.message}
                  >
                    <Input
                      type="number"
                      {...register('ssh_port', { 
                        required: 'SSH port is required',
                        min: { value: 1, message: 'Port must be greater than 0' },
                        max: { value: 65535, message: 'Port must be less than 65536' }
                      })}
                    />
                  </FormField>

                  <FormField
                    label="SSH Username"
                    required
                    error={errors.ssh_username?.message}
                  >
                    <Input
                      {...register('ssh_username', { 
                        required: 'SSH username is required' 
                      })}
                      placeholder="root"
                    />
                  </FormField>
                </chakra.div>

                {/* Authentication Method */}
                <FormField label="Authentication Method">
                  <chakra.div display="flex" gap="4" mb="4">
                    <chakra.label display="flex" alignItems="center" gap="2" cursor="pointer">
                      <chakra.input
                        type="radio"
                        value="password"
                        checked={authMethod === 'password'}
                        onChange={() => setAuthMethod('password')}
                      />
                      <chakra.span fontSize="sm">Password</chakra.span>
                    </chakra.label>
                    <chakra.label display="flex" alignItems="center" gap="2" cursor="pointer">
                      <chakra.input
                        type="radio"
                        value="key"
                        checked={authMethod === 'key'}
                        onChange={() => setAuthMethod('key')}
                      />
                      <chakra.span fontSize="sm">SSH Key</chakra.span>
                    </chakra.label>
                  </chakra.div>
                </FormField>

                {authMethod === 'password' ? (
                  <FormField
                    label="SSH Password"
                    error={errors.ssh_password?.message}
                    description="Password for SSH authentication"
                  >
                    <Input
                      type="password"
                      {...register('ssh_password')}
                      placeholder="Enter SSH password"
                    />
                  </FormField>
                ) : (
                  <FormField
                    label="SSH Key Path"
                    error={errors.ssh_key_path?.message}
                    description="Path to SSH private key file"
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
                <chakra.h3 fontSize="lg" fontWeight="semibold" mb="4" color="text">
                  Advanced Settings
                </chakra.h3>
                
                <chakra.div display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="6">
                  <FormField
                    label="Connection Timeout (seconds)"
                    error={errors.connection_timeout?.message}
                  >
                    <Input
                      type="number"
                      {...register('connection_timeout', {
                        min: { value: 1, message: 'Timeout must be at least 1 second' }
                      })}
                    />
                  </FormField>

                  <FormField
                    label="Max Retries"
                    error={errors.max_retries?.message}
                  >
                    <Input
                      type="number"
                      {...register('max_retries', {
                        min: { value: 0, message: 'Retries cannot be negative' }
                      })}
                    />
                  </FormField>
                </chakra.div>
              </chakra.div>

              {/* Form Actions */}
              <chakra.div 
                display="flex" 
                gap="3" 
                justifyContent="flex-end"
                pt="6"
                borderTop="1px solid"
                borderColor="border.subtle"
              >
                <Link to="/servers">
                  <Button variant="secondary">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  loading={createServerMutation.isPending}
                  leftIcon={<FiPlus />}
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