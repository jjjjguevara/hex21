'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TableOfContents from '@/components/TableOfContents';
import Breadcrumbs from '@/components/Breadcrumbs';
import { NavItem } from '@/lib/docs';

export default function DocsClient({
  children,
  navigation,
}: {
  children: React.ReactNode;
  navigation: NavItem[];
}) {
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number; }[]>([]);

  useEffect(() => {
    // Function to update headings
    const updateHeadings = () => {
      // Only select headings from the main content area
      const mainContent = document.querySelector('article.prose');
      if (!mainContent) return;
      
      const elements = mainContent.querySelectorAll('h1, h2, h3');
      const headingsList = Array.from(elements).map((element) => ({
        id: element.id,
        text: element.textContent?.replace('¶', '').trim() || '',
        level: parseInt(element.tagName[1]),
      }));
      setHeadings(headingsList);
    };

    // Initial update
    updateHeadings();

    // Set up mutation observer to watch for changes in the content
    const observer = new MutationObserver(updateHeadings);
    const mainContent = document.querySelector('article.prose');
    
    if (mainContent) {
      observer.observe(mainContent, {
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar items={navigation} />
      <div className="flex-1 min-w-0">
        <div className="sticky top-14 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Breadcrumbs navigation={navigation} />
        </div>
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <TableOfContents headings={headings} />
    </div>
  );
} 