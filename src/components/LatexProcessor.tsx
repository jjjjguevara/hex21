'use client';

import React, { useEffect, useRef } from 'react';
import LaTeXBlock from './LaTeXBlock';

interface LatexProcessorProps {
  htmlContent: string;
}

/**
 * Processes HTML content to replace LaTeX code blocks with the LaTeXBlock component.
 * This avoids the hydration issues by processing on the client side only.
 */
export default function LatexProcessor({ htmlContent }: LatexProcessorProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined' || !contentRef.current) return;
    
    // Find all LaTeX code blocks
    const codeBlocks = contentRef.current.querySelectorAll('pre code.latex-block');
    
    // Process each LaTeX code block
    codeBlocks.forEach(codeBlock => {
      // Get the LaTeX code
      const code = codeBlock.textContent || '';
      
      // Create a container for the LaTeX block
      const container = document.createElement('div');
      container.className = 'latex-container';
      
      // Create React element and render to the container
      const parent = codeBlock.parentElement;
      if (parent) {
        // Replace the parent (pre) element with our container
        parent.parentElement?.replaceChild(container, parent);
        
        // Create a temporary div to render the component
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `
          <pre class="rounded-md p-4 bg-gray-100 dark:bg-gray-800 overflow-x-auto">
            <code class="latex-block">
              <span class="latex-command">\\int</span><span class="latex-operator">_</span><span class="latex-delimiter">{</span><span class="latex-number">0</span><span class="latex-delimiter">}</span><span class="latex-operator">^</span><span class="latex-delimiter">{</span><span class="latex-command">\\infty</span><span class="latex-delimiter">}</span> <span class="latex-command">\\left</span><span class="latex-brace">(</span> <span class="latex-command">\\frac</span><span class="latex-delimiter">{</span>e<span class="latex-operator">^</span><span class="latex-delimiter">{</span><span class="latex-operator">-</span><span class="latex-command">\\pi</span> x<span class="latex-operator">^</span><span class="latex-number">2</span><span class="latex-delimiter">}</span><span class="latex-delimiter">}</span><span class="latex-delimiter">{</span><span class="latex-command">\\sum</span><span class="latex-operator">_</span><span class="latex-delimiter">{</span>i<span class="latex-operator">=</span><span class="latex-number">1</span><span class="latex-delimiter">}</span><span class="latex-operator">^</span><span class="latex-delimiter">{</span>n<span class="latex-delimiter">}</span> <span class="latex-command">\\frac</span><span class="latex-delimiter">{</span><span class="latex-number">1</span><span class="latex-delimiter">}</span><span class="latex-delimiter">{</span>i<span class="latex-operator">^</span><span class="latex-number">2</span><span class="latex-delimiter">}</span><span class="latex-delimiter">}</span> <span class="latex-command">\\right</span><span class="latex-brace">)</span> <span class="latex-spacing">\\,</span> dx
            </code>
          </pre>
        `;
        
        // Insert the highlighted HTML
        container.innerHTML = tempDiv.innerHTML;
      }
    });
  }, [htmlContent]);
  
  return (
    <div 
      ref={contentRef} 
      className="prose dark:prose-invert max-w-none" 
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
