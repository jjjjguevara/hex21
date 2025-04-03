'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TocEntry } from '@/types/content'; // Reuse the type
import Link from 'next/link'; // Keep Link for standard linking if needed

interface TableOfContentsProps {
  toc: TocEntry[]; // Use 'toc' consistent with ArticlePage
}

export default function TableOfContents({ toc }: TableOfContentsProps) { // Use 'toc'
  const [activeId, setActiveId] = useState<string>('');
  const pathname = usePathname();

  useEffect(() => {
    if (!toc || toc.length === 0) return; // Check toc

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0% -80% 0%', // Adjust rootMargin as needed for activation point
        threshold: 1.0,
      }
    );

    toc.forEach((heading) => { // Iterate over toc
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [toc]); // Depend on toc

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
    // Optionally update activeId immediately for better responsiveness
    setActiveId(id);
  };

  if (!toc || toc.length === 0) return null; // Check toc

  // Find the minimum heading level to adjust indentation
  const minLevel = Math.min(...toc.map(entry => entry.level));

  return (
    // Styles will be adjusted in the next step for article page layout
    <div className="hidden xl:block w-64 flex-shrink-0 pl-8"> 
      <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto py-6 pr-4"> {/* Adjusted top & added padding-right */}
        <p className="font-medium mb-4 text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          On This Page
        </p>
        <nav className="space-y-1">
          {toc.map((heading) => { // Iterate over toc
            // Calculate indentation based on the heading level relative to the minimum level
            const indentLevel = heading.level - minLevel;
            const paddingLeft = `${indentLevel * 1}rem`; // Adjust multiplier for desired indent

            return (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                onClick={(e) => handleClick(e, heading.id)}
                style={{ paddingLeft }} // Apply dynamic padding
                className={`block py-1 text-sm transition-colors duration-100 ${
                  activeId === heading.id
                    ? 'text-blue-600 dark:text-blue-400 font-medium' // Style active link
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100' // Style inactive link
                }`}
              >
                {heading.text} 
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 