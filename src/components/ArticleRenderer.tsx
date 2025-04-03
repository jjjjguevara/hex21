'use client';

import React, { lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';
import parse, { domToReact, HTMLReactParserOptions, Element } from 'html-react-parser'; // Import necessary types

// Dynamically import interactive components
const BrownianMotionSimulation = dynamic(() => import('@/components/interactive/BrownianMotionSimulation'), {
  ssr: false,
  loading: () => <p>Loading simulation...</p>,
});

// Map component names (from data-component attribute) to the actual components
const componentRegistry: { [key: string]: React.LazyExoticComponent<any> } = {
  BrownianMotionSimulation: BrownianMotionSimulation,
  // Add other interactive components here
};

// Define prop types for the component
interface ArticleRendererProps {
    htmlContent: string;
}

const ArticleRenderer: React.FC<ArticleRendererProps> = ({ htmlContent }) => {
  const parserOptions: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (domNode instanceof Element && domNode.attribs) {
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
            // Fallback for unknown components
            return <div className="border border-dashed border-red-500 p-2 text-red-500">{`Unknown component: ${componentName}`}</div>;
          }
        }

        // Handle potential MathJax containers needing display=true fix if needed here,
        // although the server-side fix should ideally handle it.
        if (domNode.tagName === 'mjx-container' && domNode.properties?.display === 'true') {
          // We could potentially modify styles here if needed, but rely on server processing first
        }
      }
      // Return undefined to let the default parsing happen for other nodes
      return undefined;
    },
  };

  // return parse(htmlContent || '', parserOptions);
  // Temporarily disable parser options for debugging content issues
  return <>{parse(htmlContent || '', parserOptions)}</>;
};

export default ArticleRenderer; 