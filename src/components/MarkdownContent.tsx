'use client';

import React, { useEffect, useRef } from 'react';
import { processEmbeds } from '@/lib/content/embed-processor';
import { processLatex } from '@/lib/content/latex-processor';
import { processWikilinks } from '@/lib/content/wikilink-processor';
import { processCallouts } from '@/lib/content/callout-processor';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

interface MarkdownContentProps {
  htmlContent: string;
  basePath?: string;
  assetBasePath?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ htmlContent, basePath, assetBasePath }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      console.log('[MarkdownContent] Running client-side processors...');
      // Process callouts first so other processors work with processed elements
      processCallouts(containerRef.current);
      processEmbeds(containerRef.current, assetBasePath || '/content/assets');
      processWikilinks(containerRef.current, basePath || '');
      processLatex(containerRef.current);
    }
  }, [htmlContent, basePath, assetBasePath]);

  return (
    <article className="markdown-content">
      {/* Metadata section - without the redundant H1 title */}
      <header className="mb-8">
        {/* Removed metadata section for brevity */}
      </header>

      {/* Main content */}
      <div 
        ref={containerRef}
        className="prose prose-slate dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Styling for various markdown elements */}
      <style jsx global>{`
        .markdown-content {
          /* Basic text styling */
          font-size: 1.125rem;
          line-height: 1.75;
          color: #374151;
        }

        /* Wiki links */
        .wiki-link {
          color: #2563eb;
          text-decoration: none;
        }
        .wiki-link:hover {
          text-decoration: underline;
        }
        .wiki-link.broken {
          color: #dc2626;
          border-bottom: 1px dashed currentColor;
        }

        /* Embeds */
        .embed {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
          background-color: #f9fafb;
        }
        .embed-error {
          color: #dc2626;
          font-style: italic;
        }

        /* Highlight */
        mark {
          background-color: #fef08a;
          padding: 0.125em 0.25em;
          border-radius: 0.25em;
        }

        /* Task lists */
        .task-list-item {
          list-style-type: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .task-list-item input[type="checkbox"] {
          margin: 0;
        }

        /* Math equations */
        .math-display {
          overflow-x: auto;
          padding: 1rem 0;
        }

        /* KaTeX styles */
        .katex-display {
          overflow-x: auto;
          overflow-y: hidden;
          padding: 1rem 0;
        }
        .katex {
          font-size: 1.1em;
        }
      `}</style>
    </article>
  );
}