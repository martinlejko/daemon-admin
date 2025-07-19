/**
 * Theme provider component that combines Chakra UI with next-themes
 */

import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { theme } from '@/theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="owleyes-theme"
    >
      <ChakraProvider value={theme}>
        {children}
      </ChakraProvider>
    </NextThemeProvider>
  );
};

export default ThemeProvider;