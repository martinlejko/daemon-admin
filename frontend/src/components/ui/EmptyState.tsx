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
            color="text.muted"
            display="flex"
            justifyContent="center"
            mb="4"
          >
            {icon}
          </chakra.div>
        )}
        <chakra.h3 color="text" fontSize="lg" fontWeight="semibold" mb="2">
          {title}
        </chakra.h3>
        {description && (
          <chakra.p color="text.subtle" maxW="md" mb="6" mx="auto">
            {description}
          </chakra.p>
        )}
        {action && action}
      </chakra.div>
    </Card>
  );
};

export default EmptyState;
