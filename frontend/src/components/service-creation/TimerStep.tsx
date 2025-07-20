/**
 * Timer configuration step with cron-like scheduling
 */

import { chakra } from '@chakra-ui/react';
import { useState } from 'react';
import { FiCalendar, FiClock, FiInfo, FiRepeat } from 'react-icons/fi';
import type { ServiceFormData, TimerConfiguration } from '@/types';

interface TimerStepProps {
  formData: ServiceFormData;
  updateFormData: (section: keyof ServiceFormData, data: any) => void;
}

const TimerStep: React.FC<TimerStepProps> = ({ formData, updateFormData }) => {
  const [scheduleType, setScheduleType] = useState<
    'none' | 'preset' | 'calendar' | 'cron'
  >('none');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isTimerEnabled = !!formData.timer;

  const presetSchedules = [
    { label: 'Every minute', value: 'minutely', description: '*:*:00' },
    {
      label: 'Every 5 minutes',
      value: '*:0/5:00',
      description: 'Every 5 minutes',
    },
    {
      label: 'Every 15 minutes',
      value: '*:0/15:00',
      description: 'Every 15 minutes',
    },
    {
      label: 'Every 30 minutes',
      value: '*:0/30:00',
      description: 'Every 30 minutes',
    },
    { label: 'Hourly', value: 'hourly', description: '*-*-* *:00:00' },
    {
      label: 'Daily at midnight',
      value: 'daily',
      description: '*-*-* 00:00:00',
    },
    {
      label: 'Daily at 2 AM',
      value: '*-*-* 02:00:00',
      description: 'Daily at 2:00 AM',
    },
    {
      label: 'Weekly (Sundays)',
      value: 'weekly',
      description: 'Sun *-*-* 00:00:00',
    },
    { label: 'Monthly', value: 'monthly', description: '*-*-01 00:00:00' },
    { label: 'Yearly', value: 'yearly', description: '*-01-01 00:00:00' },
  ];

  const handleTimerToggle = (enabled: boolean) => {
    if (enabled) {
      updateFormData('timer', {
        on_calendar: 'daily',
        persistent: true,
        accuracy_sec: '1min',
      } as TimerConfiguration);
      setScheduleType('preset');
    } else {
      updateFormData('timer', undefined);
      setScheduleType('none');
    }
  };

  const handleScheduleTypeChange = (type: typeof scheduleType) => {
    setScheduleType(type);

    if (type === 'none') {
      updateFormData('timer', undefined);
    } else if (!formData.timer) {
      updateFormData('timer', {
        on_calendar: 'daily',
        persistent: true,
        accuracy_sec: '1min',
      } as TimerConfiguration);
    }
  };

  const handlePresetChange = (value: string) => {
    updateFormData('timer', {
      ...formData.timer,
      on_calendar: value,
      cron_expression: undefined,
    });
  };

  const handleCalendarChange = (value: string) => {
    updateFormData('timer', {
      ...formData.timer,
      on_calendar: value,
      cron_expression: undefined,
    });
  };

  const handleCronChange = (value: string) => {
    updateFormData('timer', {
      ...formData.timer,
      cron_expression: value,
      on_calendar: undefined,
    });
  };

  const getCronExamples = () => {
    return [
      {
        label: 'Every minute',
        cron: '* * * * *',
        description: 'Run every minute',
      },
      {
        label: 'Every 5 minutes',
        cron: '*/5 * * * *',
        description: 'Run every 5 minutes',
      },
      {
        label: 'Daily at 2:30 AM',
        cron: '30 2 * * *',
        description: 'Run at 2:30 AM daily',
      },
      {
        label: 'Weekdays at 9 AM',
        cron: '0 9 * * 1-5',
        description: 'Run at 9 AM, Monday to Friday',
      },
      {
        label: 'First day of month',
        cron: '0 0 1 * *',
        description: 'Run at midnight on the 1st',
      },
      {
        label: 'Weekends at noon',
        cron: '0 12 * * 0,6',
        description: 'Run at noon on weekends',
      },
    ];
  };

  return (
    <chakra.div display="flex" flexDirection="column" gap="6">
      {/* Timer Enable/Disable */}
      <chakra.div>
        <chakra.div alignItems="center" display="flex" gap="3" mb="4">
          <chakra.input
            checked={isTimerEnabled}
            h="4"
            onChange={(e) => handleTimerToggle(e.target.checked)}
            type="checkbox"
            w="4"
          />
          <chakra.label fontSize="lg" fontWeight="medium">
            Enable Timer/Scheduling
          </chakra.label>
        </chakra.div>

        <chakra.div
          _dark={{ bg: 'blue.900', borderColor: 'blue.700', color: 'blue.200' }}
          bg="blue.50"
          border="1px solid"
          borderColor="blue.200"
          borderRadius="md"
          color="blue.700"
          p="4"
        >
          <chakra.div alignItems="center" display="flex" gap="2" mb="2">
            <FiInfo size={16} />
            <chakra.span fontSize="sm" fontWeight="medium">
              Timer Services
            </chakra.span>
          </chakra.div>
          <chakra.div fontSize="sm">
            When enabled, this creates a systemd timer that runs your service on
            a schedule. The service type is automatically set to "oneshot" for
            timer-based execution. The timer controls when the service runs,
            while the service defines what gets executed.
          </chakra.div>
        </chakra.div>
      </chakra.div>

      {isTimerEnabled && (
        <>
          {/* Schedule Type Selection */}
          <chakra.div>
            <chakra.label
              _dark={{ color: 'gray.300' }}
              color="gray.700"
              display="block"
              fontSize="sm"
              fontWeight="medium"
              mb="3"
            >
              Schedule Type
            </chakra.label>

            <chakra.div display="flex" flexWrap="wrap" gap="2">
              {[
                { value: 'preset', label: 'Common Presets', icon: FiClock },
                {
                  value: 'calendar',
                  label: 'Systemd Calendar',
                  icon: FiCalendar,
                },
                { value: 'cron', label: 'Cron Expression', icon: FiRepeat },
              ].map((option) => {
                const IconComponent = option.icon;
                const isSelected = scheduleType === option.value;

                return (
                  <chakra.button
                    _dark={{
                      borderColor: isSelected ? 'blue.500' : 'gray.600',
                      bg: isSelected ? 'blue.900' : 'gray.800',
                    }}
                    _hover={{ borderColor: 'blue.300' }}
                    alignItems="center"
                    bg={isSelected ? 'blue.50' : 'white'}
                    border="2px solid"
                    borderColor={isSelected ? 'blue.500' : 'gray.200'}
                    borderRadius="md"
                    display="flex"
                    gap="2"
                    key={option.value}
                    onClick={() =>
                      handleScheduleTypeChange(
                        option.value as typeof scheduleType
                      )
                    }
                    p="3"
                  >
                    <IconComponent size={16} />
                    <chakra.span fontSize="sm">{option.label}</chakra.span>
                  </chakra.button>
                );
              })}
            </chakra.div>
          </chakra.div>

          {/* Preset Schedules */}
          {scheduleType === 'preset' && (
            <chakra.div>
              <chakra.label
                _dark={{ color: 'gray.300' }}
                color="gray.700"
                display="block"
                fontSize="sm"
                fontWeight="medium"
                mb="3"
              >
                Select Schedule
              </chakra.label>

              <chakra.div
                display="grid"
                gap="2"
                gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))"
              >
                {presetSchedules.map((preset) => {
                  const isSelected =
                    formData.timer?.on_calendar === preset.value;

                  return (
                    <chakra.button
                      _dark={{
                        borderColor: isSelected ? 'blue.500' : 'gray.600',
                        bg: isSelected ? 'blue.900' : 'gray.800',
                      }}
                      _hover={{ borderColor: 'blue.300' }}
                      bg={isSelected ? 'blue.50' : 'white'}
                      border="2px solid"
                      borderColor={isSelected ? 'blue.500' : 'gray.200'}
                      borderRadius="md"
                      key={preset.value}
                      onClick={() => handlePresetChange(preset.value)}
                      p="3"
                      textAlign="left"
                    >
                      <chakra.div fontSize="sm" fontWeight="medium" mb="1">
                        {preset.label}
                      </chakra.div>
                      <chakra.div
                        _dark={{ color: 'gray.400' }}
                        color="gray.600"
                        fontSize="xs"
                      >
                        {preset.description}
                      </chakra.div>
                    </chakra.button>
                  );
                })}
              </chakra.div>
            </chakra.div>
          )}

          {/* Systemd Calendar Expression */}
          {scheduleType === 'calendar' && (
            <chakra.div>
              <chakra.label
                _dark={{ color: 'gray.300' }}
                color="gray.700"
                display="block"
                fontSize="sm"
                fontWeight="medium"
                mb="2"
              >
                OnCalendar Expression
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
                onChange={(e) => handleCalendarChange(e.target.value)}
                placeholder="*-*-* 02:00:00"
                px="3"
                py="2"
                value={formData.timer?.on_calendar || ''}
                w="full"
              />

              <chakra.div
                _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                fontSize="xs"
                mt="2"
                p="3"
              >
                <chakra.div fontWeight="medium" mb="1">
                  Systemd Calendar Format:
                </chakra.div>
                <chakra.ul pl="4">
                  <chakra.li>
                    <chakra.code>daily</chakra.code> - Every day at midnight
                  </chakra.li>
                  <chakra.li>
                    <chakra.code>weekly</chakra.code> - Every Sunday at midnight
                  </chakra.li>
                  <chakra.li>
                    <chakra.code>*-*-* 15:30:00</chakra.code> - Daily at 3:30 PM
                  </chakra.li>
                  <chakra.li>
                    <chakra.code>Mon *-*-* 09:00:00</chakra.code> - Mondays at 9
                    AM
                  </chakra.li>
                  <chakra.li>
                    <chakra.code>*-*-01 00:00:00</chakra.code> - First day of
                    every month
                  </chakra.li>
                </chakra.ul>
              </chakra.div>
            </chakra.div>
          )}

          {/* Cron Expression */}
          {scheduleType === 'cron' && (
            <chakra.div>
              <chakra.label
                _dark={{ color: 'gray.300' }}
                color="gray.700"
                display="block"
                fontSize="sm"
                fontWeight="medium"
                mb="2"
              >
                Cron Expression
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
                onChange={(e) => handleCronChange(e.target.value)}
                placeholder="0 2 * * *"
                px="3"
                py="2"
                value={formData.timer?.cron_expression || ''}
                w="full"
              />

              <chakra.div
                _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                fontSize="xs"
                mt="2"
                p="3"
              >
                <chakra.div fontWeight="medium" mb="2">
                  Cron Format: minute hour day month weekday
                </chakra.div>

                <chakra.div
                  display="grid"
                  gap="2"
                  gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))"
                >
                  {getCronExamples().map((example) => (
                    <chakra.div key={example.cron}>
                      <chakra.div
                        alignItems="center"
                        display="flex"
                        justifyContent="space-between"
                      >
                        <chakra.span fontWeight="medium">
                          {example.label}
                        </chakra.span>
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
                          onClick={() => handleCronChange(example.cron)}
                          px="2"
                          py="1"
                        >
                          Use
                        </chakra.button>
                      </chakra.div>
                      <chakra.code
                        _dark={{ bg: 'gray.900' }}
                        bg="gray.100"
                        borderRadius="sm"
                        display="block"
                        p="1"
                      >
                        {example.cron}
                      </chakra.code>
                      <chakra.div
                        _dark={{ color: 'gray.400' }}
                        color="gray.600"
                      >
                        {example.description}
                      </chakra.div>
                    </chakra.div>
                  ))}
                </chakra.div>
              </chakra.div>
            </chakra.div>
          )}

          {/* Advanced Timer Options */}
          <chakra.div>
            <chakra.button
              _dark={{ color: 'blue.400' }}
              _hover={{ textDecoration: 'underline' }}
              color="blue.600"
              fontSize="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} advanced timer options
            </chakra.button>

            {showAdvanced && (
              <chakra.div
                _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                mt="3"
                p="4"
              >
                <chakra.div display="flex" flexDirection="column" gap="4">
                  {/* Persistent */}
                  <chakra.div alignItems="center" display="flex" gap="3">
                    <chakra.input
                      checked={formData.timer?.persistent ?? true}
                      h="4"
                      onChange={(e) =>
                        updateFormData('timer', {
                          ...formData.timer,
                          persistent: e.target.checked,
                        })
                      }
                      type="checkbox"
                      w="4"
                    />
                    <chakra.div>
                      <chakra.label fontSize="sm" fontWeight="medium">
                        Persistent timer
                      </chakra.label>
                      <chakra.div
                        _dark={{ color: 'gray.400' }}
                        color="gray.600"
                        fontSize="xs"
                      >
                        Run immediately if missed while system was down
                      </chakra.div>
                    </chakra.div>
                  </chakra.div>

                  {/* Wake System */}
                  <chakra.div alignItems="center" display="flex" gap="3">
                    <chakra.input
                      checked={formData.timer?.wake_system ?? false}
                      h="4"
                      onChange={(e) =>
                        updateFormData('timer', {
                          ...formData.timer,
                          wake_system: e.target.checked,
                        })
                      }
                      type="checkbox"
                      w="4"
                    />
                    <chakra.div>
                      <chakra.label fontSize="sm" fontWeight="medium">
                        Wake system
                      </chakra.label>
                      <chakra.div
                        _dark={{ color: 'gray.400' }}
                        color="gray.600"
                        fontSize="xs"
                      >
                        Wake system from suspend to run timer
                      </chakra.div>
                    </chakra.div>
                  </chakra.div>

                  {/* Accuracy */}
                  <chakra.div>
                    <chakra.label
                      _dark={{ color: 'gray.300' }}
                      color="gray.700"
                      display="block"
                      fontSize="sm"
                      fontWeight="medium"
                      mb="2"
                    >
                      Accuracy
                    </chakra.label>
                    <chakra.select
                      _dark={{ borderColor: 'gray.600', bg: 'gray.700' }}
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 1px blue.500',
                      }}
                      borderColor="gray.300"
                      borderRadius="md"
                      borderWidth="1px"
                      onChange={(e) =>
                        updateFormData('timer', {
                          ...formData.timer,
                          accuracy_sec: e.target.value,
                        })
                      }
                      px="3"
                      py="2"
                      value={formData.timer?.accuracy_sec || '1min'}
                      w="full"
                    >
                      <option value="1s">1 second</option>
                      <option value="1min">1 minute (default)</option>
                      <option value="5min">5 minutes</option>
                      <option value="15min">15 minutes</option>
                      <option value="1h">1 hour</option>
                    </chakra.select>
                  </chakra.div>

                  {/* Randomized Delay */}
                  <chakra.div>
                    <chakra.label
                      _dark={{ color: 'gray.300' }}
                      color="gray.700"
                      display="block"
                      fontSize="sm"
                      fontWeight="medium"
                      mb="2"
                    >
                      Randomized Delay (Optional)
                    </chakra.label>
                    <chakra.input
                      _dark={{ borderColor: 'gray.600', bg: 'gray.700' }}
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 1px blue.500',
                      }}
                      borderColor="gray.300"
                      borderRadius="md"
                      borderWidth="1px"
                      onChange={(e) =>
                        updateFormData('timer', {
                          ...formData.timer,
                          randomized_delay_sec: e.target.value || undefined,
                        })
                      }
                      placeholder="5min"
                      px="3"
                      py="2"
                      value={formData.timer?.randomized_delay_sec || ''}
                      w="full"
                    />
                    <chakra.p
                      _dark={{ color: 'gray.400' }}
                      color="gray.500"
                      fontSize="xs"
                      mt="1"
                    >
                      Add random delay to spread timer activations (e.g.,
                      "5min", "30s")
                    </chakra.p>
                  </chakra.div>
                </chakra.div>
              </chakra.div>
            )}
          </chakra.div>
        </>
      )}
    </chakra.div>
  );
};

export default TimerStep;
