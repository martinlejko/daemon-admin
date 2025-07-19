/**
 * Settings page - application configuration
 */

import { chakra } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiMoon, FiSun, FiMonitor, FiSave, FiBell, FiShield, FiDatabase } from 'react-icons/fi';
import { useTheme } from '@/hooks/useTheme';
import { useUIStore } from '@/store';
import Button from '@/components/UI/Button';
import Card from '@/components/UI/Card';
import FormField, { Input, Select } from '@/components/UI/FormField';
import PageHeader from '@/components/UI/PageHeader';

const Settings: React.FC = () => {
  const { setPageTitle, setBreadcrumbs, addNotification } = useUIStore();
  const { theme, setTheme, setLightTheme, setDarkTheme, setSystemTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    // Appearance
    theme: theme || 'system',
    
    // Notifications
    enableNotifications: true,
    notificationDuration: 5000,
    
    // Monitoring
    autoRefreshInterval: 30,
    enableRealTimeUpdates: true,
    
    // Security
    sessionTimeout: 30,
    requirePasswordConfirmation: true,
    
    // Performance
    maxLogLines: 1000,
    enableCaching: true,
  });

  useEffect(() => {
    setPageTitle('Settings');
    setBreadcrumbs([
      { label: 'Dashboard', href: '/' },
      { label: 'Settings' },
    ]);
  }, [setPageTitle, setBreadcrumbs]);

  const handleThemeChange = (newTheme: string) => {
    setSettings({ ...settings, theme: newTheme });
    
    switch (newTheme) {
      case 'light':
        setLightTheme();
        break;
      case 'dark':
        setDarkTheme();
        break;
      case 'system':
        setSystemTheme();
        break;
    }
  };

  const handleSaveSettings = () => {
    // In a real app, you'd save to backend/localStorage
    addNotification({
      type: 'success',
      message: 'Settings saved successfully',
    });
  };

  const handleResetSettings = () => {
    setSettings({
      theme: 'system',
      enableNotifications: true,
      notificationDuration: 5000,
      autoRefreshInterval: 30,
      enableRealTimeUpdates: true,
      sessionTimeout: 30,
      requirePasswordConfirmation: true,
      maxLogLines: 1000,
      enableCaching: true,
    });
    setSystemTheme();
    
    addNotification({
      type: 'info',
      message: 'Settings reset to defaults',
    });
  };

  return (
    <chakra.div p="8" bg="bg.subtle" minH="100vh">
      <chakra.div maxW="4xl" mx="auto">
        <PageHeader
          title="Settings"
          subtitle="Customize your Owleyes experience"
          actions={
            <chakra.div display="flex" gap="3">
              <Button variant="secondary" onClick={handleResetSettings}>
                Reset to Defaults
              </Button>
              <Button leftIcon={<FiSave />} onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </chakra.div>
          }
        />

        <chakra.div display="flex" flexDirection="column" gap="8">
          {/* Appearance Settings */}
          <Card>
            <chakra.div display="flex" alignItems="center" gap="3" mb="6">
              <chakra.div color="accent">
                <FiSun size={20} />
              </chakra.div>
              <chakra.h3 fontSize="lg" fontWeight="semibold" color="text">
                Appearance
              </chakra.h3>
            </chakra.div>

            <FormField
              label="Theme"
              description="Choose your preferred color scheme"
            >
              <chakra.div display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="4">
                {[
                  { value: 'light', label: 'Light', icon: FiSun },
                  { value: 'dark', label: 'Dark', icon: FiMoon },
                  { value: 'system', label: 'System', icon: FiMonitor },
                ].map(({ value, label, icon: Icon }) => (
                  <chakra.button
                    key={value}
                    onClick={() => handleThemeChange(value)}
                    border="1px solid"
                    borderColor={settings.theme === value ? 'accent' : 'border'}
                    borderRadius="lg"
                    p="4"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap="2"
                    bg={settings.theme === value ? 'accent.subtle' : 'transparent'}
                    _hover={{ borderColor: 'accent' }}
                    transition="all 0.2s"
                  >
                    <Icon size={24} />
                    <chakra.span fontSize="sm" fontWeight="medium">
                      {label}
                    </chakra.span>
                  </chakra.button>
                ))}
              </chakra.div>
            </FormField>
          </Card>

          {/* Notification Settings */}
          <Card>
            <chakra.div display="flex" alignItems="center" gap="3" mb="6">
              <chakra.div color="accent">
                <FiBell size={20} />
              </chakra.div>
              <chakra.h3 fontSize="lg" fontWeight="semibold" color="text">
                Notifications
              </chakra.h3>
            </chakra.div>

            <chakra.div display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="6">
              <FormField label="Enable Notifications">
                <chakra.label display="flex" alignItems="center" gap="3" cursor="pointer">
                  <chakra.input
                    type="checkbox"
                    checked={settings.enableNotifications}
                    onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                  />
                  <chakra.span fontSize="sm">
                    Show toast notifications for system events
                  </chakra.span>
                </chakra.label>
              </FormField>

              <FormField
                label="Notification Duration"
                description="How long notifications stay visible (seconds)"
              >
                <Select
                  value={settings.notificationDuration}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, notificationDuration: Number(e.target.value) })}
                >
                  <option value={3000}>3 seconds</option>
                  <option value={5000}>5 seconds</option>
                  <option value={10000}>10 seconds</option>
                  <option value={0}>Until manually closed</option>
                </Select>
              </FormField>
            </chakra.div>
          </Card>

          {/* Monitoring Settings */}
          <Card>
            <chakra.div display="flex" alignItems="center" gap="3" mb="6">
              <chakra.div color="accent">
                <FiDatabase size={20} />
              </chakra.div>
              <chakra.h3 fontSize="lg" fontWeight="semibold" color="text">
                Monitoring
              </chakra.h3>
            </chakra.div>

            <chakra.div display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="6">
              <FormField
                label="Auto Refresh Interval"
                description="How often to refresh data automatically (seconds)"
              >
                <Select
                  value={settings.autoRefreshInterval}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, autoRefreshInterval: Number(e.target.value) })}
                >
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                  <option value={0}>Disabled</option>
                </Select>
              </FormField>

              <FormField label="Real-time Updates">
                <chakra.label display="flex" alignItems="center" gap="3" cursor="pointer">
                  <chakra.input
                    type="checkbox"
                    checked={settings.enableRealTimeUpdates}
                    onChange={(e) => setSettings({ ...settings, enableRealTimeUpdates: e.target.checked })}
                  />
                  <chakra.span fontSize="sm">
                    Enable WebSocket connections for live updates
                  </chakra.span>
                </chakra.label>
              </FormField>

              <FormField
                label="Max Log Lines"
                description="Maximum number of log lines to display"
              >
                <Input
                  type="number"
                  value={settings.maxLogLines}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, maxLogLines: Number(e.target.value) })}
                  min={100}
                  max={10000}
                  step={100}
                />
              </FormField>

              <FormField label="Enable Caching">
                <chakra.label display="flex" alignItems="center" gap="3" cursor="pointer">
                  <chakra.input
                    type="checkbox"
                    checked={settings.enableCaching}
                    onChange={(e) => setSettings({ ...settings, enableCaching: e.target.checked })}
                  />
                  <chakra.span fontSize="sm">
                    Cache API responses for better performance
                  </chakra.span>
                </chakra.label>
              </FormField>
            </chakra.div>
          </Card>

          {/* Security Settings */}
          <Card>
            <chakra.div display="flex" alignItems="center" gap="3" mb="6">
              <chakra.div color="accent">
                <FiShield size={20} />
              </chakra.div>
              <chakra.h3 fontSize="lg" fontWeight="semibold" color="text">
                Security
              </chakra.h3>
            </chakra.div>

            <chakra.div display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="6">
              <FormField
                label="Session Timeout"
                description="Automatically log out after inactivity (minutes)"
              >
                <Select
                  value={settings.sessionTimeout}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={0}>Never</option>
                </Select>
              </FormField>

              <FormField label="Password Confirmation">
                <chakra.label display="flex" alignItems="center" gap="3" cursor="pointer">
                  <chakra.input
                    type="checkbox"
                    checked={settings.requirePasswordConfirmation}
                    onChange={(e) => setSettings({ ...settings, requirePasswordConfirmation: e.target.checked })}
                  />
                  <chakra.span fontSize="sm">
                    Require password confirmation for sensitive actions
                  </chakra.span>
                </chakra.label>
              </FormField>
            </chakra.div>
          </Card>

          {/* System Information */}
          <Card>
            <chakra.h3 fontSize="lg" fontWeight="semibold" color="text" mb="4">
              System Information
            </chakra.h3>
            
            <chakra.div display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="6">
              <chakra.div>
                <chakra.span color="text.subtle" fontSize="sm" display="block">
                  Application Version
                </chakra.span>
                <chakra.span color="text" fontSize="sm" fontWeight="medium">
                  Owleyes v1.0.0
                </chakra.span>
              </chakra.div>

              <chakra.div>
                <chakra.span color="text.subtle" fontSize="sm" display="block">
                  Build Date
                </chakra.span>
                <chakra.span color="text" fontSize="sm" fontWeight="medium">
                  {new Date().toLocaleDateString()}
                </chakra.span>
              </chakra.div>

              <chakra.div>
                <chakra.span color="text.subtle" fontSize="sm" display="block">
                  API Version
                </chakra.span>
                <chakra.span color="text" fontSize="sm" fontWeight="medium">
                  v1.0.0
                </chakra.span>
              </chakra.div>

              <chakra.div>
                <chakra.span color="text.subtle" fontSize="sm" display="block">
                  Theme
                </chakra.span>
                <chakra.span color="text" fontSize="sm" fontWeight="medium" textTransform="capitalize">
                  {settings.theme}
                </chakra.span>
              </chakra.div>
            </chakra.div>
          </Card>
        </chakra.div>
      </chakra.div>
    </chakra.div>
  );
};

export default Settings;