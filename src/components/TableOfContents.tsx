'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface TableOfContentsProps {
  headings: {
    id: string;
    text: string;
    level: number;
  }[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const pathname = usePathname();

  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0% -80% 0%',
        threshold: 1.0,
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;

    // Update URL without causing a navigation
    window.history.pushState({}, '', `${pathname}#${id}`);

    // Smooth scroll to element
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  if (!headings.length) return null;

  return (
    <div className="hidden xl:block w-64 flex-shrink-0 pl-8">
      <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-6">
        <p className="font-medium mb-4 text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          On This Page
        </p>
        <nav className="space-y-1">
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className={`block py-1 text-sm ${
                heading.level > 2 ? 'pl-4' : ''
              } ${
                activeId === heading.id
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
} 