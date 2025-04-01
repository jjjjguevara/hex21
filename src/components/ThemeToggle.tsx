'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@radix-ui/themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="2"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      aria-label="Toggle theme"
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800"
    >
      {theme === 'light' ? (
        <Sun className="h-5 w-5 text-gray-600 hover:text-gray-900" />
      ) : (
        <Moon className="h-5 w-5 text-gray-400 hover:text-gray-100" />
      )}
    </Button>
  );
} 