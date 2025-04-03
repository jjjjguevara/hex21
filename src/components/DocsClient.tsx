'use client';

import React, { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import TableOfContents from '@/components/TableOfContents';
import Breadcrumbs from '@/components/Breadcrumbs';
import { NavItem } from '@/lib/docs';
import { TocEntry } from '@/types/content';

export default function DocsClient({
  children,
  navigation,
}: {
  children: React.ReactNode;
  navigation: NavItem[];
}) {
  const [headings, setHeadings] = useState<TocEntry[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mainContentElement = contentRef.current;
    if (!mainContentElement) return;

    const updateHeadings = () => {
      const proseContainer = mainContentElement.querySelector('.prose');
      const elements = proseContainer ? proseContainer.querySelectorAll('h1, h2, h3, h4, h5, h6') : [];
      const headingsList = Array.from(elements).map((element) => ({
        id: element.id,
        text: element.textContent?.replace('¶', '').trim() || '',
        level: parseInt(element.tagName.substring(1), 10),
      })).filter(h => h.id && h.text);
      setHeadings(headingsList);
    };

    updateHeadings();

    const observer = new MutationObserver(updateHeadings);
    observer.observe(mainContentElement, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [children]);

  return (
    <div className="flex flex-col md:flex-row max-w-screen-xl mx-auto md:px-8">
      <Sidebar items={navigation} />
      <div className="flex-1 min-w-0">
        <div className="sticky top-14 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Breadcrumbs navigation={navigation} />
        </div>
        <main ref={contentRef} className="flex-1 pt-2 pb-6 px-4 md:pl-6 md:pr-8">
          {children}
        </main>
      </div>
      <aside className="w-64 flex-shrink-0 hidden md:block md:sticky md:top-20 md:max-h-[calc(100vh-5rem)] px-4 md:px-0">
        {headings && headings.length > 0 && <TableOfContents toc={headings} />}
      </aside>
    </div>
  );
} 