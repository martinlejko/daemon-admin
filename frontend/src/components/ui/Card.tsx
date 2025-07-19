/**
 * Reusable Card component for consistent styling
 */

import { chakra } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: string;
  [key: string]: any;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  hover = false, 
  padding = "6",
  ...props 
}) => {
  return (
    <chakra.div
      bg="bg.surface"
      borderRadius="xl"
      boxShadow="md"
      border="1px solid"
      borderColor="border.subtle"
      p={padding}
      _hover={hover ? { 
        transform: 'translateY(-2px)', 
        boxShadow: 'lg',
        borderColor: 'border.emphasis'
      } : undefined}
      transition="all 0.2s"
      {...props}
    >
      {children}
    </chakra.div>
  );
};

export default Card;