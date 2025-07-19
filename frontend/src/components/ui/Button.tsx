/**
 * Reusable Button component with different variants
 */

import { chakra } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { COLORS } from '@/constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  [key: string]: any;
}

const variants = {
  primary: {
    bg: 'accent',
    color: 'white',
    _hover: { bg: 'accent.emphasis', transform: 'translateY(-1px)' },
    _active: { transform: 'translateY(0)' },
  },
  secondary: {
    bg: COLORS.BUTTON_SECONDARY_BG_LIGHT,
    color: 'text',
    borderWidth: '1px',
    borderColor: 'border',
    _hover: { 
      bg: COLORS.BUTTON_SECONDARY_HOVER_LIGHT,
      borderColor: 'border.emphasis',
      transform: 'translateY(-1px)'
    },
    _active: { transform: 'translateY(0)' },
    _dark: { 
      bg: COLORS.BUTTON_SECONDARY_BG_DARK,
      _hover: { bg: COLORS.BUTTON_SECONDARY_HOVER_DARK }
    },
  },
  danger: {
    bg: 'negative',
    color: 'white',
    _hover: { bg: 'negative.emphasis', transform: 'translateY(-1px)' },
    _active: { transform: 'translateY(0)' },
  },
  ghost: {
    bg: 'transparent',
    color: 'text.subtle',
    _hover: { 
      bg: COLORS.BUTTON_GHOST_HOVER_LIGHT,
      color: 'text' 
    },
    _dark: {
      _hover: { bg: COLORS.BUTTON_GHOST_HOVER_DARK }
    },
  },
};

const sizes = {
  sm: { px: '3', py: '1.5', fontSize: 'sm', h: '8' },
  md: { px: '4', py: '2', fontSize: 'sm', h: '10' },
  lg: { px: '6', py: '3', fontSize: 'md', h: '12' },
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  ...props
}) => {
  return (
    <chakra.button
      {...variants[variant]}
      {...sizes[size]}
      alignItems="center"
      borderRadius="lg"
      display="flex"
      fontWeight="semibold"
      gap="2"
      justifyContent="center"
      transition="all 0.2s"
      _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      {...props}
    >
      {loading && (
        <chakra.div
          animation="spin 1s linear infinite"
          border="2px solid"
          borderColor="currentColor"
          borderTopColor="transparent"
          borderRadius="full"
          w="4"
          h="4"
        />
      )}
      {!loading && leftIcon && leftIcon}
      {children}
      {!loading && rightIcon && rightIcon}
    </chakra.button>
  );
};

export default Button;