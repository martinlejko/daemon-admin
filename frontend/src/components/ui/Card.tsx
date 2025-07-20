/**
 * Reusable Card component for consistent styling
 */

import { chakra } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { COLORS, getCardBackground } from '@/constants/colors';

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
  padding = '6',
  ...props
}) => {
  return (
    <chakra.div
      {...getCardBackground()}
      _dark={{
        bg: COLORS.CARD_BG_DARK,
        boxShadow:
          '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        borderColor: COLORS.BORDER_DARK,
      }}
      _hover={
        hover
          ? {
              transform: 'translateY(-4px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              _dark: {
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              },
            }
          : undefined
      }
      border="1px solid"
      borderColor={COLORS.BORDER_LIGHT}
      borderRadius="2xl"
      boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      p={padding}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      {...props}
    >
      {children}
    </chakra.div>
  );
};

export default Card;
