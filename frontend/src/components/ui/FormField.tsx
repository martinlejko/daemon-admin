/**
 * Reusable Form Field component
 */

import { chakra } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  description?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  children,
  description,
}) => {
  return (
    <chakra.div mb="6">
      <chakra.label display="block" mb="2">
        <chakra.span
          color="text"
          fontSize="sm"
          fontWeight="semibold"
          letterSpacing="wide"
        >
          {label}
          {required && (
            <chakra.span color="negative" ml="1">
              *
            </chakra.span>
          )}
        </chakra.span>
        {description && (
          <chakra.span
            color="text.subtle"
            fontSize="xs"
            display="block"
            mt="1"
          >
            {description}
          </chakra.span>
        )}
      </chakra.label>
      
      {children}
      
      {error && (
        <chakra.p color="negative" fontSize="sm" mt="1">
          {error}
        </chakra.p>
      )}
    </chakra.div>
  );
};

export const Input: React.FC<any> = (props) => {
  return (
    <chakra.input
      bg="bg.surface"
      border="1px solid"
      borderColor="border"
      borderRadius="lg"
      color="text"
      fontSize="sm"
      h="10"
      px="3"
      transition="all 0.2s"
      w="full"
      _focus={{
        borderColor: 'accent',
        boxShadow: '0 0 0 1px var(--chakra-colors-accent)',
        outline: 'none',
      }}
      _hover={{
        borderColor: 'border.emphasis',
      }}
      _placeholder={{
        color: 'text.placeholder',
      }}
      {...props}
    />
  );
};

export const Textarea: React.FC<any> = (props) => {
  return (
    <chakra.textarea
      bg="bg.surface"
      border="1px solid"
      borderColor="border"
      borderRadius="lg"
      color="text"
      fontSize="sm"
      minH="20"
      px="3"
      py="2"
      resize="vertical"
      transition="all 0.2s"
      w="full"
      _focus={{
        borderColor: 'accent',
        boxShadow: '0 0 0 1px var(--chakra-colors-accent)',
        outline: 'none',
      }}
      _hover={{
        borderColor: 'border.emphasis',
      }}
      _placeholder={{
        color: 'text.placeholder',
      }}
      {...props}
    />
  );
};

export const Select: React.FC<any> = (props) => {
  return (
    <chakra.select
      bg="bg.surface"
      border="1px solid"
      borderColor="border"
      borderRadius="lg"
      color="text"
      fontSize="sm"
      h="10"
      px="3"
      transition="all 0.2s"
      w="full"
      _focus={{
        borderColor: 'accent',
        boxShadow: '0 0 0 1px var(--chakra-colors-accent)',
        outline: 'none',
      }}
      _hover={{
        borderColor: 'border.emphasis',
      }}
      {...props}
    />
  );
};

export default FormField;