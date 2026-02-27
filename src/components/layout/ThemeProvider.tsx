'use client';

// src/components/layout/ThemeProvider.tsx
// Wraps next-themes ThemeProvider to apply .dark class on <html>.
// RemixEngine is dark-first — defaultTheme is 'dark', enableSystem is disabled.

import { ThemeProvider as NextThemesProvider } from 'next-themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  );
}
