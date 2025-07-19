/**
 * Reusable Empty State component
 */

import { chakra } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import Card from './Card';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <Card padding="12">
      <chakra.div textAlign="center">
        {icon && (
          <chakra.div
            display="flex"
            justifyContent="center"
            mb="4"
            color="text.muted"
          >
            {icon}
          </chakra.div>
        )}
        <chakra.h3 fontSize="lg" fontWeight="semibold" mb="2" color="text">
          {title}
        </chakra.h3>
        {description && (
          <chakra.p color="text.subtle" mb="6" maxW="md" mx="auto">
            {description}
          </chakra.p>
        )}
        {action && action}
      </chakra.div>
    </Card>
  );
};

export default EmptyState;