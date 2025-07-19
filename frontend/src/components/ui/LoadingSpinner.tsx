/**
 * Reusable Loading Spinner component
 */

import { chakra } from '@chakra-ui/react';
import Card from './Card';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullPage?: boolean;
}

const sizes = {
  sm: '4',
  md: '8',
  lg: '12',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  fullPage = false,
}) => {
  const spinner = (
    <chakra.div
      alignItems="center"
      display="flex"
      flexDirection="column"
      gap="4"
      py={fullPage ? "12" : "8"}
    >
      <chakra.div
        animation="spin 1s linear infinite"
        border="3px solid"
        borderColor="border.muted"
        borderRadius="full"
        borderTopColor="accent"
        h={sizes[size]}
        w={sizes[size]}
      />
      {message && (
        <chakra.div textAlign="center">
          <chakra.p color="text" fontWeight="semibold" fontSize="lg">
            {message}
          </chakra.p>
          <chakra.p color="text.subtle" fontSize="sm" mt="1">
            Please wait while we process your request
          </chakra.p>
        </chakra.div>
      )}
    </chakra.div>
  );

  if (fullPage) {
    return <Card>{spinner}</Card>;
  }

  return spinner;
};

export default LoadingSpinner;