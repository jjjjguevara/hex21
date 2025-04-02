'use client';

import React, { useEffect, useRef } from 'react';
import { ProcessedContent } from '@/lib/markdown/types';
import { processEmbeds } from '@/lib/content/embed-processor';
import { processLatex } from '@/lib/content/latex-processor';
import { processWikilinks } from '@/lib/content/wikilink-processor';
import { processFootnotes } from '@/lib/content/footnote-processor';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

interface MarkdownContentProps {
  content: ProcessedContent;
  basePath?: string;
}

export function MarkdownContent({ content, basePath = '' }: MarkdownContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Process embeds
    processEmbeds(container, content.embeds, basePath);
    
    // Process LaTeX
    processLatex(container);
    
    // Process wikilinks
    processWikilinks(container, basePath);
    
    // Process footnotes
    processFootnotes(container, content.footnotes);
  }, [content, basePath]);

  return (
    <article className="markdown-content">
      {/* Metadata section */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{content.frontmatter.title}</h1>
        <div className="text-gray-600">
          {content.frontmatter.author && (
            <p>By {content.frontmatter.author} • {new Date(content.frontmatter.date).toLocaleDateString()}</p>
          )}
          {content.frontmatter.tags.length > 0 && (
            <div className="flex gap-2 mt-2">
              {content.frontmatter.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <div 
        ref={containerRef}
        className="prose prose-slate dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content.html }}
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