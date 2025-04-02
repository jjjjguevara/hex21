'use client';

import { useState } from 'react';
import { Theme } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';
import ThemeToggle from '@/components/ThemeToggle';
import CommandPalette from '@/components/CommandPalette';
import SearchButton from '@/components/SearchButton';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Theme>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center">
              <div className="mr-4 flex">
                <a className="mr-6 flex items-center space-x-2" href="/">
                  <span className="font-bold">
                    Hex 21
                  </span>
                </a>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                  <a href="/featured" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Featured</a>
                  <a href="/articles" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Articles</a>
                  <a href="/docs" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Docs</a>
                  <a href="/blog" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Blog</a>
                  <a href="/about" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">About</a>
                </nav>
              </div>
              <div className="flex flex-1 items-center justify-end space-x-2">
                <SearchButton setIsOpen={setIsSearchOpen} />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <CommandPalette isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} />
          <main className="flex-1">{children}</main>
        </div>
      </Theme>
    </ThemeProvider>
  );
} 