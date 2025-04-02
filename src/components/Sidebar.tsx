'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem } from '@/lib/docs';
import { cn } from '@/lib/utils';

interface SidebarProps {
  items?: NavItem[];
}

export default function Sidebar({ items = [] }: SidebarProps) {
  const pathname = usePathname();

  if (!items?.length) {
    return null;
  }

  return (
    <div className="w-64 flex-shrink-0 hidden lg:block border-r border-border/40">
      <nav className="h-full overflow-y-auto py-6 pr-4" aria-label="Documentation">
        <div className="space-y-8">
          {items.map((section) => (
            <div key={section.href} className="space-y-2">
              <h3 className="px-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {section.title}
              </h3>
              {section.items && (
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "block px-3 py-2 text-sm font-medium rounded-md",
                        pathname === item.href
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                          : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      )}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
} 