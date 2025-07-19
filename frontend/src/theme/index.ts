/**
 * Modern theme configuration for Owleyes
 */

import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Brand colors
        brand: {
          50: { value: '#f0f9ff' },
          100: { value: '#e0f2fe' },
          200: { value: '#bae6fd' },
          300: { value: '#7dd3fc' },
          400: { value: '#38bdf8' },
          500: { value: '#0ea5e9' },
          600: { value: '#0284c7' },
          700: { value: '#0369a1' },
          800: { value: '#075985' },
          900: { value: '#0c4a6e' },
          950: { value: '#082f49' },
        },
        // Modern grays
        gray: {
          50: { value: '#f8fafc' },
          100: { value: '#f1f5f9' },
          200: { value: '#e2e8f0' },
          300: { value: '#cbd5e1' },
          400: { value: '#94a3b8' },
          500: { value: '#64748b' },
          600: { value: '#475569' },
          700: { value: '#334155' },
          800: { value: '#1e293b' },
          900: { value: '#0f172a' },
          950: { value: '#020617' },
        },
        // Status colors
        success: {
          50: { value: '#f0fdf4' },
          100: { value: '#dcfce7' },
          200: { value: '#bbf7d0' },
          300: { value: '#86efac' },
          400: { value: '#4ade80' },
          500: { value: '#22c55e' },
          600: { value: '#16a34a' },
          700: { value: '#15803d' },
          800: { value: '#166534' },
          900: { value: '#14532d' },
        },
        warning: {
          50: { value: '#fffbeb' },
          100: { value: '#fef3c7' },
          200: { value: '#fde68a' },
          300: { value: '#fcd34d' },
          400: { value: '#fbbf24' },
          500: { value: '#f59e0b' },
          600: { value: '#d97706' },
          700: { value: '#b45309' },
          800: { value: '#92400e' },
          900: { value: '#78350f' },
        },
        error: {
          50: { value: '#fef2f2' },
          100: { value: '#fee2e2' },
          200: { value: '#fecaca' },
          300: { value: '#fca5a5' },
          400: { value: '#f87171' },
          500: { value: '#ef4444' },
          600: { value: '#dc2626' },
          700: { value: '#b91c1c' },
          800: { value: '#991b1b' },
          900: { value: '#7f1d1d' },
        },
      },
      fonts: {
        heading: { value: 'Inter, system-ui, sans-serif' },
        body: { value: 'Inter, system-ui, sans-serif' },
        mono: { value: 'JetBrains Mono, Consolas, monospace' },
      },
      fontSizes: {
        xs: { value: '0.75rem' },
        sm: { value: '0.875rem' },
        md: { value: '1rem' },
        lg: { value: '1.125rem' },
        xl: { value: '1.25rem' },
        '2xl': { value: '1.5rem' },
        '3xl': { value: '1.875rem' },
        '4xl': { value: '2.25rem' },
        '5xl': { value: '3rem' },
      },
      fontWeights: {
        normal: { value: '400' },
        medium: { value: '500' },
        semibold: { value: '600' },
        bold: { value: '700' },
      },
      radii: {
        sm: { value: '0.375rem' },
        md: { value: '0.5rem' },
        lg: { value: '0.75rem' },
        xl: { value: '1rem' },
        '2xl': { value: '1.5rem' },
      },
      shadows: {
        xs: { value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
        sm: { value: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
        md: { value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
        lg: { value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' },
        xl: { value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
      },
      spacing: {
        px: { value: '1px' },
        0: { value: '0' },
        0.5: { value: '0.125rem' },
        1: { value: '0.25rem' },
        1.5: { value: '0.375rem' },
        2: { value: '0.5rem' },
        2.5: { value: '0.625rem' },
        3: { value: '0.75rem' },
        3.5: { value: '0.875rem' },
        4: { value: '1rem' },
        5: { value: '1.25rem' },
        6: { value: '1.5rem' },
        7: { value: '1.75rem' },
        8: { value: '2rem' },
        9: { value: '2.25rem' },
        10: { value: '2.5rem' },
        12: { value: '3rem' },
        14: { value: '3.5rem' },
        16: { value: '4rem' },
        20: { value: '5rem' },
        24: { value: '6rem' },
        28: { value: '7rem' },
        32: { value: '8rem' },
      },
    },
    semanticTokens: {
      colors: {
        // Background colors
        bg: {
          DEFAULT: { value: { base: 'white', _dark: 'gray.950' } },
          subtle: { value: { base: 'gray.50', _dark: 'gray.900' } },
          surface: { value: { base: 'white', _dark: 'gray.900' } },
          elevated: { value: { base: 'white', _dark: 'gray.800' } },
          overlay: { value: { base: 'white', _dark: 'gray.800' } },
        },
        // Text colors
        text: {
          DEFAULT: { value: { base: 'gray.900', _dark: 'gray.50' } },
          subtle: { value: { base: 'gray.600', _dark: 'gray.400' } },
          muted: { value: { base: 'gray.500', _dark: 'gray.500' } },
          placeholder: { value: { base: 'gray.400', _dark: 'gray.600' } },
          disabled: { value: { base: 'gray.400', _dark: 'gray.600' } },
          inverted: { value: { base: 'white', _dark: 'gray.900' } },
        },
        // Border colors
        border: {
          DEFAULT: { value: { base: 'gray.200', _dark: 'gray.700' } },
          subtle: { value: { base: 'gray.100', _dark: 'gray.800' } },
          muted: { value: { base: 'gray.100', _dark: 'gray.800' } },
          emphasis: { value: { base: 'gray.300', _dark: 'gray.600' } },
        },
        // Interactive colors
        accent: {
          DEFAULT: { value: { base: 'brand.500', _dark: 'brand.400' } },
          emphasis: { value: { base: 'brand.600', _dark: 'brand.300' } },
          subtle: { value: { base: 'brand.50', _dark: 'brand.900' } },
          muted: { value: { base: 'brand.100', _dark: 'brand.800' } },
        },
        // Status colors with semantic meanings
        positive: {
          DEFAULT: { value: { base: 'success.500', _dark: 'success.400' } },
          emphasis: { value: { base: 'success.600', _dark: 'success.300' } },
          subtle: { value: { base: 'success.50', _dark: 'success.900' } },
          muted: { value: { base: 'success.100', _dark: 'success.800' } },
        },
        negative: {
          DEFAULT: { value: { base: 'error.500', _dark: 'error.400' } },
          emphasis: { value: { base: 'error.600', _dark: 'error.300' } },
          subtle: { value: { base: 'error.50', _dark: 'error.900' } },
          muted: { value: { base: 'error.100', _dark: 'error.800' } },
        },
        warning: {
          DEFAULT: { value: { base: 'warning.500', _dark: 'warning.400' } },
          emphasis: { value: { base: 'warning.600', _dark: 'warning.300' } },
          subtle: { value: { base: 'warning.50', _dark: 'warning.900' } },
          muted: { value: { base: 'warning.100', _dark: 'warning.800' } },
        },
      },
    },
  },
});

export const theme = createSystem(defaultConfig, customConfig);
export default theme;