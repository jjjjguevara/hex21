'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem } from '@/lib/docs';

interface BreadcrumbsProps {
  navigation?: NavItem[];
}

export default function Breadcrumbs({ navigation = [] }: BreadcrumbsProps) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // Function to check if a path exists in the navigation structure
  const isValidPath = (path: string): boolean => {
    // Always allow the root docs page
    if (path === '/docs') return true;

    // Remove leading slash for comparison
    const pathWithoutSlash = path.startsWith('/') ? path.slice(1) : path;
    const pathSegments = pathWithoutSlash.split('/');

    // For section paths (e.g., /docs/api), check if the section exists and has items
    if (pathSegments.length === 2) {
      const section = navigation.find(item => {
        const itemPath = item.href.split('/');
        return itemPath[itemPath.length - 1] === pathSegments[1];
      });
      return section !== undefined && Array.isArray(section.items) && section.items.length > 0;
    }

    // For deeper paths, check if the exact page exists
    let currentLevel = navigation;
    let found = false;

    for (let i = 1; i < pathSegments.length; i++) {
      // Skip 'docs' in the path check as it's our root
      if (pathSegments[i] === 'docs') continue;

      // First find the section
      if (i === 1) {
        const section = currentLevel.find(item => {
          const itemPath = item.href.split('/');
          return itemPath[itemPath.length - 1] === pathSegments[i];
        });
        if (!section?.items) return false;
        currentLevel = section.items;
        found = true;
        continue;
      }

      // Then look for the exact page
      found = currentLevel.some(item => {
        const itemPath = item.href.split('/');
        return itemPath[itemPath.length - 1] === pathSegments[i];
      });
    }

    return found;
  };

  // Function to get the title for a segment
  const getSegmentTitle = (segment: string, index: number): string => {
    if (segment === 'docs') return 'Documentation';

    if (index === 1) {
      // Look for section title
      const section = navigation.find(item => {
        const itemPath = item.href.split('/');
        return itemPath[itemPath.length - 1] === segment;
      });
      return section?.title || segment;
    }

    // Look for page title in the current section
    const section = navigation.find(item => {
      const itemPath = item.href.split('/');
      return itemPath[itemPath.length - 1] === segments[1];
    });

    if (section?.items) {
      const page = section.items.find(item => {
        const itemPath = item.href.split('/');
        return itemPath[itemPath.length - 1] === segment;
      });
      return page?.title || segment;
    }

    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <nav aria-label="Breadcrumb" className="px-4 sm:px-6 lg:px-8 py-4">
      <ol className="flex items-center space-x-2 text-sm">
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const isLast = index === segments.length - 1;
          const title = getSegmentTitle(segment, index);
          const isValid = isValidPath(href);

          return (
            <li key={segment} className="flex items-center">
              {index > 0 && (
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              {isValid && !isLast ? (
                <Link
                  href={href}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 ml-2"
                >
                  {title}
                </Link>
              ) : (
                <span className="text-gray-900 dark:text-gray-100 ml-2">
                  {title}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
} 