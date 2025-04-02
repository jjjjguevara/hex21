'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300';
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                Hex21 CMS
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/articles"
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                  isActive('/articles')
                    ? 'border-blue-500 dark:border-blue-400'
                    : 'border-transparent'
                } text-sm font-medium ${isActive('/articles')}`}
              >
                Articles
              </Link>
              <Link
                href="/featured"
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                  isActive('/featured')
                    ? 'border-blue-500 dark:border-blue-400'
                    : 'border-transparent'
                } text-sm font-medium ${isActive('/featured')}`}
              >
                Featured
              </Link>
              <Link
                href="/docs"
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                  isActive('/docs')
                    ? 'border-blue-500 dark:border-blue-400'
                    : 'border-transparent'
                } text-sm font-medium ${isActive('/docs')}`}
              >
                Documentation
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
} 