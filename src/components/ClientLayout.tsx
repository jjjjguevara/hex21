'use client';

import { useState, useEffect } from 'react';
import { Theme } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';
import CommandPalette from '@/components/CommandPalette';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import MathJaxConfig from './MathJaxConfig';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Cast window.MathJax to any to bypass TypeScript error
    const mathJax = (window as any).MathJax;
    if (typeof window !== 'undefined' && mathJax?.typesetPromise) {
      mathJax.typesetPromise()
        .catch((err: any) => console.error('MathJax typesetting failed:', err)); // Keep error logging
    }
  }, [pathname]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <MathJaxConfig />
      <Theme>
        <Navbar setIsSearchOpen={setIsSearchOpen} />
        <CommandPalette isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} />
        <main className="flex-1">{children}</main>
      </Theme>
    </ThemeProvider>
  );
} 