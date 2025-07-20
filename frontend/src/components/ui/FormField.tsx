/**
 * Reusable Form Field component
 */

import { chakra } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { COLORS } from '@/constants/colors';

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
          <chakra.span color="text.subtle" display="block" fontSize="xs" mt="1">
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
      _dark={{
        bg: COLORS.INPUT_BG_DARK,
        borderColor: COLORS.INPUT_BORDER_DARK,
        _placeholder: { color: COLORS.PLACEHOLDER_DARK },
        _focus: {
          boxShadow: `0 0 0 3px ${COLORS.FOCUS_RING_DARK}`,
          bg: COLORS.INPUT_BG_FOCUS_DARK,
        },
        _hover: {
          borderColor: COLORS.INPUT_BORDER_HOVER_DARK,
        },
      }}
      _focus={{
        borderColor: 'brand.400',
        boxShadow: `0 0 0 3px ${COLORS.FOCUS_RING_LIGHT}`,
        outline: 'none',
        bg: COLORS.INPUT_BG_FOCUS_LIGHT,
      }}
      _hover={{
        borderColor: COLORS.INPUT_BORDER_HOVER_LIGHT,
      }}
      _placeholder={{
        color: COLORS.PLACEHOLDER_LIGHT,
      }}
      bg={COLORS.INPUT_BG_LIGHT}
      border="1px solid"
      borderColor={COLORS.INPUT_BORDER_LIGHT}
      borderRadius="xl"
      color="text"
      fontSize="sm"
      h="12"
      px="4"
      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      w="full"
      {...props}
    />
  );
};

export const Textarea: React.FC<any> = (props) => {
  return (
    <chakra.textarea
      _dark={{
        bg: COLORS.INPUT_BG_DARK,
        borderColor: COLORS.INPUT_BORDER_DARK,
        _placeholder: { color: COLORS.PLACEHOLDER_DARK },
        _focus: {
          boxShadow: `0 0 0 3px ${COLORS.FOCUS_RING_DARK}`,
          bg: COLORS.INPUT_BG_FOCUS_DARK,
        },
        _hover: {
          borderColor: COLORS.INPUT_BORDER_HOVER_DARK,
        },
      }}
      _focus={{
        borderColor: 'brand.400',
        boxShadow: `0 0 0 3px ${COLORS.FOCUS_RING_LIGHT}`,
        outline: 'none',
        bg: COLORS.INPUT_BG_FOCUS_LIGHT,
      }}
      _hover={{
        borderColor: COLORS.INPUT_BORDER_HOVER_LIGHT,
      }}
      _placeholder={{
        color: COLORS.PLACEHOLDER_LIGHT,
      }}
      bg={COLORS.INPUT_BG_LIGHT}
      border="1px solid"
      borderColor={COLORS.INPUT_BORDER_LIGHT}
      borderRadius="xl"
      color="text"
      fontSize="sm"
      minH="24"
      px="4"
      py="3"
      resize="vertical"
      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      w="full"
      {...props}
    />
  );
};

export const Select: React.FC<any> = (props) => {
  return (
    <chakra.select
      _dark={{ bg: 'gray.800' }}
      _focus={{
        borderColor: 'accent',
        boxShadow: '0 0 0 1px var(--chakra-colors-accent)',
        outline: 'none',
        bg: 'white',
        _dark: { bg: 'gray.700' },
      }}
      _hover={{
        borderColor: 'border.emphasis',
        bg: 'gray.50',
        _dark: { bg: 'gray.700' },
      }}
      bg="white"
      border="1px solid"
      borderColor="border"
      borderRadius="lg"
      color="text"
      fontSize="sm"
      h="10"
      px="3"
      transition="all 0.2s"
      w="full"
      {...props}
    />
  );
};

export default FormField;
