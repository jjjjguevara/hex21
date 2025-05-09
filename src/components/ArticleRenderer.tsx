'use client';

import React, { lazy, Suspense, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import parse, { domToReact, HTMLReactParserOptions, Element, attributesToProps } from 'html-react-parser';
import { processCallouts } from '@/lib/content/callout-processor';
import { processFootnotes } from '@/lib/content/footnote-processor';

// Dynamically import interactive components
const BrownianMotionSimulation = dynamic(() => import('@/components/interactive/BrownianMotionSimulation'), {
  ssr: false,
  loading: () => <p>Loading simulation...</p>,
});

// Map component names (from data-component attribute) to the actual components
const componentRegistry: { [key: string]: React.ComponentType<any> } = {
  BrownianMotionSimulation: BrownianMotionSimulation,
  // Add other interactive components here
};

// Define prop types for the component
interface ArticleRendererProps {
    htmlContent: string;
}

const ArticleRenderer: React.FC<ArticleRendererProps> = ({ htmlContent }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const didProcessMathJax = useRef<boolean>(false);
  const CONTAINER_ID = "article-content-area"; // Define a constant for the ID

  const parserOptions: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (domNode instanceof Element && domNode.attribs) {
        // Handle data-component for interactive elements
        if (domNode.attribs['data-component']) {
            const componentName = domNode.attribs['data-component'];
            const Component = componentRegistry[componentName];
            if (Component) {
                return (
                    <Suspense fallback={<div>Loading {componentName}...</div>}>
                        <Component {...domNode.attribs} />
                    </Suspense>
                );
            } else {
                return <div className="border border-dashed border-red-500 p-2 text-red-500">{`Unknown component: ${componentName}`}</div>;
            }
        }
        
        // Note: Callouts are now handled by the shared callout-processor

        // *** Handle custom data-component divs ***
        if (domNode.name === 'div' && domNode.attribs['data-component']) {
            const componentName = domNode.attribs['data-component'];
            const Component = componentRegistry[componentName];
            if (Component) {
                return (
                    <Suspense fallback={<div>Loading {componentName}...</div>}>
                        <Component {...domNode.attribs} />
                    </Suspense>
                );
            } else {
                return <div className="border border-dashed border-red-500 p-2 text-red-500">{`Unknown component: ${componentName}`}</div>;
            }
        }

        // Re-add handling for math code, now outputting script tags
        if (domNode.name === 'code' && domNode.attribs.class?.includes('language-math')) {
          let latexString = '';
          if (domNode.children && domNode.children[0] && domNode.children[0].type === 'text') {
            latexString = domNode.children[0].data;
          } else {
            console.warn('[ArticleRenderer Parser] Math code tag did not contain simple text node:', domNode.children);
            return null;
          }
          latexString = latexString.trim();
          if (latexString) {
            const isDisplay = domNode.attribs.class?.includes('math-display'); // Check for display class
            const isLikelyDisplay = isDisplay || /\\[dfisuL]|\\frac|\\int|\\sum|\\lim/.test(latexString); // Heuristic
            if (isLikelyDisplay) {
                console.log('[ArticleRenderer Parser] Found Display Math: Returning React.Fragment with $$ $$');
                // Use $$...$$ delimiters
                return React.createElement(React.Fragment, null, '$$' + latexString + '$$'); 
            } else {
                console.log('[ArticleRenderer Parser] Found Inline Math: Returning React.Fragment with $ $');
                // Use $...$ delimiters
                return React.createElement(React.Fragment, null, '$' + latexString + '$'); 
            }
          } else {
            console.warn('[ArticleRenderer Parser] Math code tag was empty.');
            return null;
          }
        }
      }
      // Return undefined to let the default parsing happen for other nodes
      return undefined;
    },
  };

  // Process callouts AND typeset math on container mount
  useEffect(() => {
    const container = contentRef.current;
    if (!container) {
      console.error('[ArticleRenderer] useEffect Mount: Container ref not found.');
      return;
    }

    console.log(`[ArticleRenderer] useEffect running for container: #${CONTAINER_ID}`);

    // Pass the actual container element to processCallouts
    processCallouts(container); 

    // Then handle MathJax typesetting
    const mathJax = (window as any).MathJax;
    if (mathJax?.startup?.promise) {
      console.log('[ArticleRenderer] useEffect Mount: Found MathJax, waiting for startup...');
      mathJax.startup.promise
        .then(() => {
          console.log('[ArticleRenderer] Startup complete. Typesetting container...');
          // Check the flag *before* typesetting
          if (!didProcessMathJax.current) {
              console.log('[ArticleRenderer] Container innerHTML before typesetting:', container.innerHTML);
              didProcessMathJax.current = true; // Set flag immediately before call
              return mathJax.typesetPromise([container]);
          } else {
              console.log('[ArticleRenderer] Skipping typeset, already processed.');
              return Promise.resolve(); // Resolve promise if skipping
          }
        })
        .then(() => {
          // Log completion only if typesetting was attempted (or handle skipped case)
          if (didProcessMathJax.current) { // Check if we actually ran it (or intended to)
               console.log('[ArticleRenderer] MathJax typesetting process finished (may have been skipped).');
               // --- PROCESS FOOTNOTES AFTER MATHJAX --- 
               console.log('[ArticleRenderer] Processing footnotes after MathJax...');
               processFootnotes(container);
               console.log('[ArticleRenderer] Footnote processing after MathJax complete.');
               // ----------------------------------------
          }
        })
        .catch((err: any) => console.error('[ArticleRenderer] MathJax process failed:', err));
    } else {
       console.warn('[ArticleRenderer] useEffect Mount: MathJax not ready.');
    }
  }, [htmlContent]); // Run when htmlContent changes

  console.log('[ArticleRenderer] Rendering RAW HTML:', htmlContent.substring(0, 200) + '...');
  const elements = parse(htmlContent, parserOptions);

  return (
    <div ref={contentRef} id={CONTAINER_ID} className="prose dark:prose-invert max-w-none">
      {elements}
    </div>
  );
};

export default ArticleRenderer; 