/**
 * Add Server page - create a new server
 */

import { chakra } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiArrowLeft, FiPlus, FiServer, FiTrash2 } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateServer } from '@/hooks/useApi';
import { useUIStore } from '@/store';
import Button from '@/components/UI/Button';
import Card from '@/components/UI/Card';
import FormField, { Input, Textarea, Select } from '@/components/UI/FormField';
import PageHeader from '@/components/UI/PageHeader';
import { getPageBackground, getDividerStyling } from '@/constants/colors';

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
              ssh_key_passphrase: undefined 
            }
          : { 
              ssh_key_path: data.ssh_key_path,
              ssh_key_passphrase: data.ssh_key_passphrase,
              ssh_password: undefined 
            }
        ),
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
    <chakra.div 
      p="8" 
      minH="100vh"
      {...getPageBackground()}
    >
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
                <chakra.h3 fontSize="lg" fontWeight="semibold" mb="6" color="text">
                  Basic Information
                </chakra.h3>
                
                <FormField
                  label="Hostname or IP Address"
                  required
                  error={errors.hostname?.message}
                  description="The server's hostname, domain name, or IP address"
                >
                  <Input
                    {...register('hostname', { 
                      required: 'Hostname or IP address is required' 
                    })}
                    placeholder="web-server-01.example.com or 192.168.1.100"
                  />
                </FormField>

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
                <chakra.hr {...getDividerStyling()} mb="8" />
                <chakra.h3 fontSize="lg" fontWeight="semibold" mb="6" color="text">
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
                  <>
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
                    
                    <FormField
                      label="SSH Key Passphrase"
                      error={errors.ssh_key_passphrase?.message}
                      description="Passphrase for the SSH key (if encrypted)"
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
                <chakra.h3 fontSize="lg" fontWeight="semibold" mb="6" color="text">
                  Management Settings
                </chakra.h3>
                
                <chakra.div display="flex" flexDirection="column" gap="4">
                  <FormField
                    label="Server Management"
                    description="Control whether this server should be actively managed"
                  >
                    <chakra.label display="flex" alignItems="center" gap="3" cursor="pointer">
                      <chakra.input
                        type="checkbox"
                        {...register('is_enabled')}
                      />
                      <chakra.span fontSize="sm">Enable server management</chakra.span>
                    </chakra.label>
                  </FormField>

                  <FormField
                    label="Service Discovery"
                    description="Automatically discover and monitor services on this server"
                  >
                    <chakra.label display="flex" alignItems="center" gap="3" cursor="pointer">
                      <chakra.input
                        type="checkbox"
                        {...register('auto_discover_services')}
                      />
                      <chakra.span fontSize="sm">Auto-discover services</chakra.span>
                    </chakra.label>
                  </FormField>
                </chakra.div>
              </chakra.div>

              {/* Advanced Settings */}
              <chakra.div>
                <chakra.hr {...getDividerStyling()} mb="8" />
                <chakra.h3 fontSize="lg" fontWeight="semibold" mb="6" color="text">
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
                    label="Connection Retries"
                    error={errors.connection_retries?.message}
                  >
                    <Input
                      type="number"
                      {...register('connection_retries', {
                        min: { value: 0, message: 'Retries cannot be negative' }
                      })}
                    />
                  </FormField>
                </chakra.div>
              </chakra.div>

              {/* Tags */}
              <chakra.div>
                <chakra.hr {...getDividerStyling()} mb="8" />
                <chakra.h3 fontSize="lg" fontWeight="semibold" mb="6" color="text">
                  Tags
                </chakra.h3>
                
                <FormField
                  label="Add Tags"
                  description="Key-value pairs for organizing and categorizing servers"
                >
                  <chakra.div display="flex" gap="3" mb="4">
                    <Input
                      placeholder="Key (e.g., environment)"
                      value={tagKey}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagKey(e.target.value)}
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && e.preventDefault()}
                    />
                    <Input
                      placeholder="Value (e.g., production)"
                      value={tagValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagValue(e.target.value)}
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addTag}
                      disabled={!tagKey.trim() || !tagValue.trim()}
                    >
                      Add
                    </Button>
                  </chakra.div>
                </FormField>

                {/* Display existing tags */}
                {Object.keys(watchedTags).length > 0 && (
                  <chakra.div>
                    <chakra.p fontSize="sm" color="text.subtle" mb="3">Current Tags:</chakra.p>
                    <chakra.div display="flex" flexWrap="wrap" gap="2">
                      {Object.entries(watchedTags).map(([key, value]) => (
                        <chakra.div
                          key={key}
                          display="flex"
                          alignItems="center"
                          gap="2"
                          bg="bg.subtle"
                          borderRadius="md"
                          px="3"
                          py="1"
                          border="1px solid"
                          borderColor="border"
                        >
                          <chakra.span fontSize="sm" color="text">
                            <chakra.span fontWeight="medium">{key}:</chakra.span> {value}
                          </chakra.span>
                          <chakra.button
                            type="button"
                            onClick={() => removeTag(key)}
                            color="text.subtle"
                            _hover={{ color: 'negative' }}
                            display="flex"
                            alignItems="center"
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