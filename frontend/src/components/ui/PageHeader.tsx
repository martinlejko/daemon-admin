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
      alignItems={{ base: 'flex-start', md: 'center' }}
      display="flex"
      flexDirection={{ base: 'column', md: 'row' }}
      gap="4"
      justifyContent="space-between"
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
        <chakra.div display="flex" flexShrink="0" gap="3">
          {actions}
        </chakra.div>
      )}
    </chakra.div>
  );
};

export default PageHeader;
