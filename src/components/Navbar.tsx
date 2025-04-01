'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname?.startsWith(path) ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900';
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Hex21 CMS
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/articles"
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                  isActive('/articles') ? 'border-blue-500' : 'border-transparent'
                } text-sm font-medium ${isActive('/articles')}`}
              >
                Articles
              </Link>
              <Link
                href="/docs"
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                  isActive('/docs') ? 'border-blue-500' : 'border-transparent'
                } text-sm font-medium ${isActive('/docs')}`}
              >
                Documentation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 