/**
 * Reusable Status Badge component
 */

import { chakra } from '@chakra-ui/react';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: StatusType;
  children: string;
  size?: 'sm' | 'md';
}

const statusColors = {
  success: {
    bg: 'positive.muted',
    color: 'positive.emphasis',
  },
  warning: {
    bg: 'warning.muted',
    color: 'warning.emphasis',
  },
  error: {
    bg: 'negative.muted',
    color: 'negative.emphasis',
  },
  info: {
    bg: 'accent.muted',
    color: 'accent.emphasis',
  },
  neutral: {
    bg: 'bg.subtle',
    color: 'text.subtle',
  },
};

const sizes = {
  sm: { px: '2', py: '1', fontSize: 'xs' },
  md: { px: '3', py: '1', fontSize: 'sm' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  size = 'sm',
}) => {
  return (
    <chakra.span
      {...statusColors[status]}
      {...sizes[size]}
      alignItems="center"
      borderRadius="full"
      display="inline-flex"
      fontWeight="semibold"
      textTransform="capitalize"
      whiteSpace="nowrap"
    >
      {children}
    </chakra.span>
  );
};

export default StatusBadge;
