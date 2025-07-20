/**
 * Log Filters component - improved design for log filtering
 */
import { chakra } from '@chakra-ui/react';
import { FiCalendar, FiFilter, FiList, FiSearch } from 'react-icons/fi';
import Button from '@/components/ui/Button';

export interface LogFilters {
  lines: number;
  since: string;
  until: string;
  priority: string;
  grep: string;
}

interface LogFiltersProps {
  filters: LogFilters;
  onChange: (filters: LogFilters) => void;
  onApply: () => void;
  isLoading?: boolean;
}

const LOG_PRIORITIES = [
  { value: '', label: 'All levels' },
  { value: 'debug', label: 'Debug' },
  { value: 'info', label: 'Info' },
  { value: 'notice', label: 'Notice' },
  { value: 'warning', label: 'Warning' },
  { value: 'err', label: 'Error' },
  { value: 'crit', label: 'Critical' },
  { value: 'alert', label: 'Alert' },
  { value: 'emerg', label: 'Emergency' },
];

const LINE_OPTIONS = [50, 100, 200, 500, 1000, 2000];

const SINCE_PRESETS = [
  { value: '1 hour ago', label: 'Last hour' },
  { value: '6 hours ago', label: 'Last 6 hours' },
  { value: '1 day ago', label: 'Last day' },
  { value: '3 days ago', label: 'Last 3 days' },
  { value: '1 week ago', label: 'Last week' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
];

const LogFilters: React.FC<LogFiltersProps> = ({
  filters,
  onChange,
  onApply,
  isLoading = false,
}) => {
  const updateFilter = (key: keyof LogFilters, value: string | number) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <chakra.div bg="bg.muted" borderRadius="lg" p="6">
      <chakra.div
        alignItems="center"
        display="flex"
        gap="2"
        justifyContent="space-between"
        mb="4"
      >
        <chakra.div alignItems="center" display="flex" gap="2">
          <FiFilter color="var(--chakra-colors-accent)" size={16} />
          <chakra.h4 color="text" fontSize="md" fontWeight="semibold">
            Log Filters
          </chakra.h4>
        </chakra.div>
        <Button
          loading={isLoading}
          onClick={onApply}
          size="sm"
          variant="primary"
        >
          Apply Filters
        </Button>
      </chakra.div>

      <chakra.div
        display="grid"
        gap="4"
        gridTemplateColumns={{
          base: '1fr',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
        }}
      >
        {/* Lines Filter */}
        <chakra.div>
          <chakra.label
            alignItems="center"
            color="text.subtle"
            display="flex"
            fontSize="sm"
            fontWeight="medium"
            gap="2"
            mb="2"
          >
            <FiList size={14} />
            Number of lines
          </chakra.label>
          <chakra.select
            bg="white"
            border="1px solid"
            borderColor="gray.300"
            borderRadius="md"
            fontSize="sm"
            onChange={(e) =>
              updateFilter('lines', Number.parseInt(e.target.value))
            }
            p="2"
            value={filters.lines}
            width="100%"
          >
            {LINE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} lines
              </option>
            ))}
          </chakra.select>
        </chakra.div>

        {/* Priority Filter */}
        <chakra.div>
          <chakra.label
            color="text.subtle"
            display="block"
            fontSize="sm"
            fontWeight="medium"
            mb="2"
          >
            Priority Level
          </chakra.label>
          <chakra.select
            bg="white"
            border="1px solid"
            borderColor="gray.300"
            borderRadius="md"
            fontSize="sm"
            onChange={(e) => updateFilter('priority', e.target.value)}
            p="2"
            value={filters.priority}
            width="100%"
          >
            {LOG_PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </chakra.select>
        </chakra.div>

        {/* Search Text Filter */}
        <chakra.div>
          <chakra.label
            alignItems="center"
            color="text.subtle"
            display="flex"
            fontSize="sm"
            fontWeight="medium"
            gap="2"
            mb="2"
          >
            <FiSearch size={14} />
            Search text
          </chakra.label>
          <chakra.input
            bg="white"
            border="1px solid"
            borderColor="gray.300"
            borderRadius="md"
            fontSize="sm"
            onChange={(e) => updateFilter('grep', e.target.value)}
            p="2"
            placeholder="Search in log entries..."
            value={filters.grep}
            width="100%"
          />
        </chakra.div>

        {/* Since Filter */}
        <chakra.div>
          <chakra.label
            alignItems="center"
            color="text.subtle"
            display="flex"
            fontSize="sm"
            fontWeight="medium"
            gap="2"
            mb="2"
          >
            <FiCalendar size={14} />
            Since
          </chakra.label>
          <chakra.div display="flex" flexDirection="column" gap="2">
            <chakra.select
              bg="white"
              border="1px solid"
              borderColor="gray.300"
              borderRadius="md"
              fontSize="sm"
              onChange={(e) => updateFilter('since', e.target.value)}
              p="2"
              value={
                SINCE_PRESETS.some((p) => p.value === filters.since)
                  ? filters.since
                  : ''
              }
              width="100%"
            >
              <option value="">Custom date/time</option>
              {SINCE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </chakra.select>
            {!SINCE_PRESETS.some((p) => p.value === filters.since) && (
              <chakra.input
                bg="white"
                border="1px solid"
                borderColor="gray.300"
                borderRadius="md"
                fontSize="sm"
                onChange={(e) => updateFilter('since', e.target.value)}
                p="2"
                placeholder="2025-01-20 14:30 or '2 hours ago'"
                value={filters.since}
                width="100%"
              />
            )}
          </chakra.div>
        </chakra.div>

        {/* Until Filter */}
        <chakra.div>
          <chakra.label
            alignItems="center"
            color="text.subtle"
            display="flex"
            fontSize="sm"
            fontWeight="medium"
            gap="2"
            mb="2"
          >
            <FiCalendar size={14} />
            Until
          </chakra.label>
          <chakra.input
            bg="white"
            border="1px solid"
            borderColor="gray.300"
            borderRadius="md"
            fontSize="sm"
            onChange={(e) => updateFilter('until', e.target.value)}
            p="2"
            placeholder="2025-01-20 16:00 (optional)"
            value={filters.until}
            width="100%"
          />
          <chakra.p color="text.subtle" fontSize="xs" mt="1">
            Leave empty for current time
          </chakra.p>
        </chakra.div>
      </chakra.div>

      {/* Quick Actions */}
      <chakra.div
        borderColor="border"
        borderTop="1px solid"
        display="flex"
        flexWrap="wrap"
        gap="2"
        mt="4"
        pt="4"
      >
        <chakra.span color="text.subtle" fontSize="sm" mr="2">
          Quick filters:
        </chakra.span>
        <Button
          onClick={() =>
            onChange({ ...filters, priority: 'err', since: '1 hour ago' })
          }
          size="sm"
          variant="ghost"
        >
          Recent errors
        </Button>
        <Button
          onClick={() =>
            onChange({ ...filters, priority: 'warning', since: '1 day ago' })
          }
          size="sm"
          variant="ghost"
        >
          Today's warnings
        </Button>
        <Button
          onClick={() =>
            onChange({
              lines: 100,
              since: '',
              until: '',
              priority: '',
              grep: '',
            })
          }
          size="sm"
          variant="ghost"
        >
          Reset filters
        </Button>
      </chakra.div>
    </chakra.div>
  );
};

export default LogFilters;
