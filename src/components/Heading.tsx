'use client';

import { createElement } from 'react';

interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}

export default function Heading({ level, children, className = '' }: HeadingProps) {
  // Convert heading text to a URL-friendly slug
  const text = typeof children === 'string' ? children : '';
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return createElement(
    `h${level}`,
    {
      id: slug,
      className: `group flex items-center gap-2 ${className}`,
    },
    <>
      {children}
      <a
        href={`#${slug}`}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        aria-label={`Link to ${text}`}
      >
        ¶
      </a>
    </>
  );
} 