'use client';

import React, { useMemo } from 'react';

interface LaTeXBlockProps {
  code: string;
  inline?: boolean;
}

/**
 * LaTeXBlock component - Provides syntax highlighting for LaTeX code
 * 
 * This uses a render-time regex approach to apply syntax highlighting to LaTeX code.
 * Since it's a client component, it won't cause hydration mismatches.
 */
export default function LaTeXBlock({ code, inline = false }: LaTeXBlockProps) {
  // Process LaTeX code with highlighting
  const highlightedCode = useMemo(() => {
    // First escape HTML entities to prevent XSS
    let processedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Apply highlighting with regex replacements
    // Commands (e.g., \int, \sum, \pi, etc.)
    processedCode = processedCode.replace(/(\\[a-zA-Z]+)/g, '<span class="latex-command">$1</span>');
    
    // Operators (+, -, =, ^, _, etc.)
    processedCode = processedCode.replace(/([+\-*=\/^_])/g, '<span class="latex-operator">$1</span>');
    
    // Delimiters (braces)
    processedCode = processedCode.replace(/([{}])/g, '<span class="latex-delimiter">$1</span>');
    
    // Braces (parentheses, brackets)
    processedCode = processedCode.replace(/([()[\]])/g, '<span class="latex-brace">$1</span>');
    
    // Spacing commands
    processedCode = processedCode.replace(/(\\[,;!\s]|\\quad|\\qquad)/g, '<span class="latex-spacing">$1</span>');
    
    // Numbers
    processedCode = processedCode.replace(/(\b\d+(\.\d+)?)\b/g, '<span class="latex-number">$1</span>');
    
    return processedCode;
  }, [code]);
  
  // If inline, display as inline code, otherwise as a block
  if (inline) {
    return (
      <code 
        className="latex-block inline-block px-1" 
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    );
  }
  
  return (
    <pre className="rounded-md p-4 bg-gray-100 dark:bg-gray-800 overflow-x-auto">
      <code 
        className="latex-block block" 
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </pre>
  );
}
