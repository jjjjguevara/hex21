'use client';

import React, { lazy, Suspense, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import parse, { domToReact, HTMLReactParserOptions, Element, attributesToProps } from 'html-react-parser';

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

  // Restore main useEffect for typesetting the whole container - RUN ONLY ONCE
  useEffect(() => {
    // Let the effect body run, but guard the typesetting logic
      const mathJax = (window as any).MathJax;
      const container = contentRef.current;

      if (container && mathJax?.startup?.promise) {
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
            }
          })
          .catch((err: any) => console.error('[ArticleRenderer] MathJax process failed:', err));
      } else {
         if (!container) console.error('[ArticleRenderer] useEffect Mount: Container ref not found.');
         else console.warn('[ArticleRenderer] useEffect Mount: MathJax not ready.');
      }
    // No cleanup needed as we only set a flag
  }, []); // Empty dependency array ensures this runs only once on mount

  console.log('[ArticleRenderer] Rendering RAW HTML:', htmlContent.substring(0, 200) + '...');
  const elements = parse(htmlContent, parserOptions);

  return (
    <div ref={contentRef} className="prose dark:prose-invert max-w-none">
      {elements}
    </div>
  );
};

export default ArticleRenderer; 