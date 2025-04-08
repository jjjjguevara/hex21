'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import SearchButton from '@/components/SearchButton';
// Note: We need access to the state for the search palette (isSearchOpen, setIsSearchOpen)
// This suggests Navbar might need these props passed down from ClientLayout,
// or we need a shared state management solution (like Context or Zustand).
// For now, let's assume setIsSearchOpen is passed as a prop for SearchButton.

// Define the props interface if we pass down setIsSearchOpen
interface NavbarProps {
  setIsSearchOpen: (isOpen: boolean) => void;
}

// Update the component to accept props if needed, otherwise remove NavbarProps
export default function Navbar({ setIsSearchOpen }: NavbarProps) {
  const pathname = usePathname();

  // Original navigation links
  const navLinks = [
    { href: '/featured', label: 'Featured' },
    { href: '/articles', label: 'Articles' },
    { href: '/docs', label: 'Docs' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
  ];

  return (
    // Applying original header styles: sticky, background, border, etc.
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Using original layout structure: max-width, padding, flex */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center">
        {/* Left side: Logo and Nav */}
        <div className="mr-4 flex">
          {/* Original Logo/Title */}
          <Link className="mr-6 flex items-center space-x-2" href="/">
            <span className="font-bold">Hex 21</span>
          </Link>
          {/* Original Nav Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                // Basic active state styling (can be refined)
                className={`transition-colors ${
                  pathname?.startsWith(link.href)
                    ? 'text-foreground'
                    : 'text-foreground/60 hover:text-foreground/80'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side: Search and Theme Toggle */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Pass the necessary prop to SearchButton */}
          <SearchButton setIsOpen={setIsSearchOpen} />
          <ThemeToggle />
        </div>

        {/* Consider adding a mobile menu toggle button here later */}

      </div>
    </header>
  );
} 