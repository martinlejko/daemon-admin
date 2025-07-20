/**
 * Resource Usage Card component - displays service resource metrics
 */

import { chakra } from '@chakra-ui/react';
import { FiActivity, FiBarChart, FiCpu } from 'react-icons/fi';
import Card from '@/components/ui/Card';
import type { Service } from '@/types';
import { formatMemoryMB, formatRelativeTime } from '@/utils';

interface ResourceUsageCardProps {
  service: Service;
}

const MetricItem: React.FC<{
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}> = ({ label, value, unit, color = 'text' }) => (
  <chakra.div
    alignItems="center"
    display="flex"
    justifyContent="space-between"
    py="2"
  >
    <chakra.span color="text.subtle" fontSize="sm">
      {label}
    </chakra.span>
    <chakra.span color={color} fontSize="sm" fontWeight="medium">
      {value}
      {unit && <chakra.span color="text.subtle">{unit}</chakra.span>}
    </chakra.span>
  </chakra.div>
);

const ResourceUsageCard: React.FC<ResourceUsageCardProps> = ({ service }) => {
  const hasResourceData =
    service.cpu_usage_percent !== null ||
    service.memory_usage_mb !== null ||
    service.started_at;

  const getCpuColor = (usage: number) => {
    if (usage > 80) return 'red.500';
    if (usage > 60) return 'orange.500';
    if (usage > 40) return 'yellow.500';
    return 'green.500';
  };

  const getMemoryColor = (usage: number, limit?: number) => {
    if (!limit) return 'text';
    const percentage = (usage / limit) * 100;
    if (percentage > 90) return 'red.500';
    if (percentage > 75) return 'orange.500';
    if (percentage > 50) return 'yellow.500';
    return 'green.500';
  };

  return (
    <Card>
      <chakra.div
        alignItems="center"
        display="flex"
        justifyContent="space-between"
        mb="4"
      >
        <chakra.h3 color="text" fontSize="lg" fontWeight="semibold">
          Resource Usage
        </chakra.h3>
        <FiCpu color="var(--chakra-colors-accent)" size={20} />
      </chakra.div>

      {hasResourceData ? (
        <chakra.div display="flex" flexDirection="column" gap="2">
          {service.cpu_usage_percent !== null &&
            service.cpu_usage_percent !== undefined && (
              <MetricItem
                color={getCpuColor(service.cpu_usage_percent)}
                label="CPU Usage"
                unit="%"
                value={service.cpu_usage_percent.toFixed(1)}
              />
            )}

          {service.memory_usage_mb !== null &&
            service.memory_usage_mb !== undefined && (
              <MetricItem
                color={getMemoryColor(
                  service.memory_usage_mb,
                  service.memory_limit_mb || undefined
                )}
                label="Memory Usage"
                value={formatMemoryMB(service.memory_usage_mb)}
              />
            )}

          {service.memory_limit_mb && (
            <MetricItem
              label="Memory Limit"
              value={formatMemoryMB(service.memory_limit_mb)}
            />
          )}

          {service.started_at && (
            <MetricItem
              label="Uptime"
              value={formatRelativeTime(service.started_at)}
            />
          )}

          {service.active_duration_seconds && (
            <MetricItem
              label="Active Duration"
              value={`${Math.floor(service.active_duration_seconds / 3600)}h ${Math.floor((service.active_duration_seconds % 3600) / 60)}m`}
            />
          )}
        </chakra.div>
      ) : (
        <chakra.div
          alignItems="center"
          color="text.subtle"
          display="flex"
          flexDirection="column"
          gap="3"
          py="8"
          textAlign="center"
        >
          <FiBarChart size={32} />
          <chakra.div>
            <chakra.p fontSize="sm" fontWeight="medium" mb="1">
              No resource data available
            </chakra.p>
            <chakra.p fontSize="xs">
              Resource monitoring may not be enabled for this service
            </chakra.p>
          </chakra.div>
        </chakra.div>
      )}
    </Card>
  );
};

export default ResourceUsageCard;
