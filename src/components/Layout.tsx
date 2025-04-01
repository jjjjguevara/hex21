'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'nav-link-active' : 'nav-link';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-gray-800">Hex21 CMS</span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link 
                  href="/featured" 
                  className={isActive('/featured')}
                >
                  Featured
                </Link>
                <Link 
                  href="/articles" 
                  className={isActive('/articles')}
                >
                  Articles
                </Link>
                <Link 
                  href="/docs" 
                  className={isActive('/docs')}
                >
                  Documentation
                </Link>
                <Link 
                  href="/search" 
                  className={isActive('/search')}
                >
                  Search
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Hex21 CMS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 