/**
 * Settings page - application configuration
 */

import { chakra } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  FiBell,
  FiDatabase,
  FiMonitor,
  FiMoon,
  FiSave,
  FiShield,
  FiSun,
} from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FormField, { Input, Select } from '@/components/ui/FormField';
import PageHeader from '@/components/ui/PageHeader';
import { useTheme } from '@/hooks/useTheme';
import { useUIStore } from '@/store';

const Settings: React.FC = () => {
  const { setPageTitle, setBreadcrumbs, addNotification } = useUIStore();
  const { theme, setTheme, setLightTheme, setDarkTheme, setSystemTheme } =
    useTheme();

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
    setBreadcrumbs([{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]);
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
    <chakra.div bg="bg.subtle" minH="100vh" p="8">
      <chakra.div maxW="4xl" mx="auto">
        <PageHeader
          actions={
            <chakra.div display="flex" gap="3">
              <Button onClick={handleResetSettings} variant="secondary">
                Reset to Defaults
              </Button>
              <Button leftIcon={<FiSave />} onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </chakra.div>
          }
          subtitle="Customize your Owleyes experience"
          title="Settings"
        />

        <chakra.div display="flex" flexDirection="column" gap="8">
          {/* Appearance Settings */}
          <Card>
            <chakra.div alignItems="center" display="flex" gap="3" mb="6">
              <chakra.div color="accent">
                <FiSun size={20} />
              </chakra.div>
              <chakra.h3 color="text" fontSize="lg" fontWeight="semibold">
                Appearance
              </chakra.h3>
            </chakra.div>

            <FormField
              description="Choose your preferred color scheme"
              label="Theme"
            >
              <chakra.div
                display="grid"
                gap="4"
                gridTemplateColumns="repeat(3, 1fr)"
              >
                {[
                  { value: 'light', label: 'Light', icon: FiSun },
                  { value: 'dark', label: 'Dark', icon: FiMoon },
                  { value: 'system', label: 'System', icon: FiMonitor },
                ].map(({ value, label, icon: Icon }) => (
                  <chakra.button
                    _hover={{ borderColor: 'accent' }}
                    alignItems="center"
                    bg={
                      settings.theme === value ? 'accent.subtle' : 'transparent'
                    }
                    border="1px solid"
                    borderColor={settings.theme === value ? 'accent' : 'border'}
                    borderRadius="lg"
                    display="flex"
                    flexDirection="column"
                    gap="2"
                    key={value}
                    onClick={() => handleThemeChange(value)}
                    p="4"
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
            <chakra.div alignItems="center" display="flex" gap="3" mb="6">
              <chakra.div color="accent">
                <FiBell size={20} />
              </chakra.div>
              <chakra.h3 color="text" fontSize="lg" fontWeight="semibold">
                Notifications
              </chakra.h3>
            </chakra.div>

            <chakra.div
              display="grid"
              gap="6"
              gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
            >
              <FormField label="Enable Notifications">
                <chakra.label
                  alignItems="center"
                  cursor="pointer"
                  display="flex"
                  gap="3"
                >
                  <chakra.input
                    checked={settings.enableNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        enableNotifications: e.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                  <chakra.span fontSize="sm">
                    Show toast notifications for system events
                  </chakra.span>
                </chakra.label>
              </FormField>

              <FormField
                description="How long notifications stay visible (seconds)"
                label="Notification Duration"
              >
                <Select
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSettings({
                      ...settings,
                      notificationDuration: Number(e.target.value),
                    })
                  }
                  value={settings.notificationDuration}
                >
                  <option value={3000}>3 seconds</option>
                  <option value={5000}>5 seconds</option>
                  <option value={10_000}>10 seconds</option>
                  <option value={0}>Until manually closed</option>
                </Select>
              </FormField>
            </chakra.div>
          </Card>

          {/* Monitoring Settings */}
          <Card>
            <chakra.div alignItems="center" display="flex" gap="3" mb="6">
              <chakra.div color="accent">
                <FiDatabase size={20} />
              </chakra.div>
              <chakra.h3 color="text" fontSize="lg" fontWeight="semibold">
                Monitoring
              </chakra.h3>
            </chakra.div>

            <chakra.div
              display="grid"
              gap="6"
              gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
            >
              <FormField
                description="How often to refresh data automatically (seconds)"
                label="Auto Refresh Interval"
              >
                <Select
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSettings({
                      ...settings,
                      autoRefreshInterval: Number(e.target.value),
                    })
                  }
                  value={settings.autoRefreshInterval}
                >
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                  <option value={0}>Disabled</option>
                </Select>
              </FormField>

              <FormField label="Real-time Updates">
                <chakra.label
                  alignItems="center"
                  cursor="pointer"
                  display="flex"
                  gap="3"
                >
                  <chakra.input
                    checked={settings.enableRealTimeUpdates}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        enableRealTimeUpdates: e.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                  <chakra.span fontSize="sm">
                    Enable WebSocket connections for live updates
                  </chakra.span>
                </chakra.label>
              </FormField>

              <FormField
                description="Maximum number of log lines to display"
                label="Max Log Lines"
              >
                <Input
                  max={10_000}
                  min={100}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings({
                      ...settings,
                      maxLogLines: Number(e.target.value),
                    })
                  }
                  step={100}
                  type="number"
                  value={settings.maxLogLines}
                />
              </FormField>

              <FormField label="Enable Caching">
                <chakra.label
                  alignItems="center"
                  cursor="pointer"
                  display="flex"
                  gap="3"
                >
                  <chakra.input
                    checked={settings.enableCaching}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        enableCaching: e.target.checked,
                      })
                    }
                    type="checkbox"
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
            <chakra.div alignItems="center" display="flex" gap="3" mb="6">
              <chakra.div color="accent">
                <FiShield size={20} />
              </chakra.div>
              <chakra.h3 color="text" fontSize="lg" fontWeight="semibold">
                Security
              </chakra.h3>
            </chakra.div>

            <chakra.div
              display="grid"
              gap="6"
              gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
            >
              <FormField
                description="Automatically log out after inactivity (minutes)"
                label="Session Timeout"
              >
                <Select
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSettings({
                      ...settings,
                      sessionTimeout: Number(e.target.value),
                    })
                  }
                  value={settings.sessionTimeout}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={0}>Never</option>
                </Select>
              </FormField>

              <FormField label="Password Confirmation">
                <chakra.label
                  alignItems="center"
                  cursor="pointer"
                  display="flex"
                  gap="3"
                >
                  <chakra.input
                    checked={settings.requirePasswordConfirmation}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        requirePasswordConfirmation: e.target.checked,
                      })
                    }
                    type="checkbox"
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
            <chakra.h3 color="text" fontSize="lg" fontWeight="semibold" mb="4">
              System Information
            </chakra.h3>

            <chakra.div
              display="grid"
              gap="6"
              gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
            >
              <chakra.div>
                <chakra.span color="text.subtle" display="block" fontSize="sm">
                  Application Version
                </chakra.span>
                <chakra.span color="text" fontSize="sm" fontWeight="medium">
                  Owleyes v1.0.0
                </chakra.span>
              </chakra.div>

              <chakra.div>
                <chakra.span color="text.subtle" display="block" fontSize="sm">
                  Build Date
                </chakra.span>
                <chakra.span color="text" fontSize="sm" fontWeight="medium">
                  {new Date().toLocaleDateString()}
                </chakra.span>
              </chakra.div>

              <chakra.div>
                <chakra.span color="text.subtle" display="block" fontSize="sm">
                  API Version
                </chakra.span>
                <chakra.span color="text" fontSize="sm" fontWeight="medium">
                  v1.0.0
                </chakra.span>
              </chakra.div>

              <chakra.div>
                <chakra.span color="text.subtle" display="block" fontSize="sm">
                  Theme
                </chakra.span>
                <chakra.span
                  color="text"
                  fontSize="sm"
                  fontWeight="medium"
                  textTransform="capitalize"
                >
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
