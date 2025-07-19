/**
 * Reusable Page Header component
 */

import { chakra } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  actions?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  children,
  actions,
}) => {
  return (
    <chakra.div
      display="flex"
      justifyContent="space-between"
      alignItems={{ base: 'flex-start', md: 'center' }}
      flexDirection={{ base: 'column', md: 'row' }}
      gap="4"
      mb="8"
    >
      <chakra.div>
        <chakra.h1
          color="text"
          fontSize="3xl"
          fontWeight="bold"
          letterSpacing="tight"
        >
          {title}
        </chakra.h1>
        {subtitle && (
          <chakra.p color="text.subtle" fontSize="lg" mt="1">
            {subtitle}
          </chakra.p>
        )}
        {children}
      </chakra.div>
      
      {actions && (
        <chakra.div display="flex" gap="3" flexShrink="0">
          {actions}
        </chakra.div>
      )}
    </chakra.div>
  );
};

export default PageHeader;