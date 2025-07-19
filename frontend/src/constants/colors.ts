/**
 * Centralized color constants for the application
 */

export const COLORS = {
  // Page backgrounds
  PAGE_BG_LIGHT: '#f5f5f5',
  PAGE_BG_DARK: '#1a1a1a',
  
  // Card/Form backgrounds
  CARD_BG_LIGHT: '#f5f5f5',
  CARD_BG_DARK: '#1a1a1a',
  
  // Input field backgrounds
  INPUT_BG_LIGHT: '#f8fafc', // gray.50
  INPUT_BG_DARK: '#374151',   // gray.700
  INPUT_BG_FOCUS_LIGHT: '#ffffff',
  INPUT_BG_FOCUS_DARK: '#4b5563', // gray.600
  
  // Border colors
  BORDER_LIGHT: '#e5e5e5',
  BORDER_DARK: '#404040',
  INPUT_BORDER_LIGHT: '#e2e8f0', // gray.200
  INPUT_BORDER_DARK: '#4b5563',   // gray.600
  INPUT_BORDER_HOVER_LIGHT: '#cbd5e1', // gray.300
  INPUT_BORDER_HOVER_DARK: '#6b7280',   // gray.500
  
  // Focus ring colors
  FOCUS_RING_LIGHT: 'rgba(59, 130, 246, 0.1)',
  FOCUS_RING_DARK: 'rgba(59, 130, 246, 0.2)',
  
  // Text colors
  PLACEHOLDER_LIGHT: '#94a3b8', // gray.400
  PLACEHOLDER_DARK: '#6b7280',  // gray.500
  
  // Divider colors
  DIVIDER_LIGHT: '#e2e8f0', // gray.200
  DIVIDER_DARK: '#374151',  // gray.700
  
  // Button colors
  BUTTON_SECONDARY_BG_LIGHT: '#ffffff',
  BUTTON_SECONDARY_BG_DARK: '#1f2937', // gray.800
  BUTTON_SECONDARY_HOVER_LIGHT: '#f8fafc', // gray.50
  BUTTON_SECONDARY_HOVER_DARK: '#374151', // gray.700
  BUTTON_GHOST_HOVER_LIGHT: '#f3f4f6', // gray.100
  BUTTON_GHOST_HOVER_DARK: '#1f2937',  // gray.800
} as const;

// Helper functions for easy usage
export const getPageBackground = () => ({
  bg: COLORS.PAGE_BG_LIGHT,
  _dark: { bg: COLORS.PAGE_BG_DARK }
});

export const getCardBackground = () => ({
  bg: COLORS.CARD_BG_LIGHT,
  _dark: { bg: COLORS.CARD_BG_DARK }
});

export const getInputStyling = () => ({
  bg: COLORS.INPUT_BG_LIGHT,
  borderColor: COLORS.INPUT_BORDER_LIGHT,
  _focus: {
    borderColor: 'brand.400',
    boxShadow: `0 0 0 3px ${COLORS.FOCUS_RING_LIGHT}`,
    bg: COLORS.INPUT_BG_FOCUS_LIGHT
  },
  _hover: {
    borderColor: COLORS.INPUT_BORDER_HOVER_LIGHT
  },
  _placeholder: {
    color: COLORS.PLACEHOLDER_LIGHT
  },
  _dark: {
    bg: COLORS.INPUT_BG_DARK,
    borderColor: COLORS.INPUT_BORDER_DARK,
    _placeholder: { color: COLORS.PLACEHOLDER_DARK },
    _focus: {
      boxShadow: `0 0 0 3px ${COLORS.FOCUS_RING_DARK}`,
      bg: COLORS.INPUT_BG_FOCUS_DARK
    },
    _hover: {
      borderColor: COLORS.INPUT_BORDER_HOVER_DARK
    }
  }
});

export const getDividerStyling = () => ({
  borderColor: COLORS.DIVIDER_LIGHT,
  _dark: { borderColor: COLORS.DIVIDER_DARK }
}); 