'use client';

import React, { useEffect } from 'react';

/**
 * Client-side component to apply syntax highlighting to LaTeX code blocks.
 * This runs after the page loads and adds appropriate span elements with
 * CSS classes for different LaTeX syntax elements.
 */
export default function LaTeXSyntaxHighlighter() {
  useEffect(() => {
    console.log('LaTeXSyntaxHighlighter component mounted');
    // Add a slight delay to ensure DOM is fully rendered
    setTimeout(() => {
      highlightLatexBlocks();
    }, 500);
  }, []);

  return null; // This is a utility component that doesn't render anything
}

/**
 * Finds all LaTeX code blocks and applies syntax highlighting
 */
function highlightLatexBlocks() {
  console.log('Starting LaTeX highlighting process');
  
  // First, try with the class from our custom setup
  let latexBlocks = document.querySelectorAll('pre code.latex-block');
  console.log(`Found ${latexBlocks.length} blocks with 'latex-block' class`);
  
  // If none found, try other possible selectors
  if (latexBlocks.length === 0) {
    latexBlocks = document.querySelectorAll('pre code.language-latex');
    console.log(`Found ${latexBlocks.length} blocks with 'language-latex' class`);
  }
  
  // If still none found, try more general selector
  if (latexBlocks.length === 0) {
    latexBlocks = document.querySelectorAll('pre code');
    console.log(`Found ${latexBlocks.length} blocks with general 'pre code' selector`);
    
    // Filter to only those containing LaTeX-like content
    const filteredBlocks = Array.from(latexBlocks).filter(block => {
      const content = block.textContent || '';
      return content.includes('\\') && (content.includes('$$') || content.includes('$'));
    });
    
    // Process the filtered blocks directly instead of reassigning
    console.log(`Filtered to ${filteredBlocks.length} blocks with LaTeX-like content`);
    processLatexBlocks(filteredBlocks);
    return; // Exit early since we're handling the blocks separately
  }
  
  // Process NodeList objects directly
  processLatexBlocks(latexBlocks);
}

/**
 * Process an array or NodeList of LaTeX code blocks by applying syntax highlighting
 */
function processLatexBlocks(blocks: NodeListOf<Element> | Element[]) {
  console.log('Processing blocks:', blocks);
  
  Array.from(blocks).forEach((block, index) => {
    // Skip if already highlighted
    if (block.getAttribute('data-highlighted') === 'true') {
      console.log(`Block ${index} already highlighted, skipping`);
      return;
    }
    
    // Get the raw LaTeX code
    const code = block.textContent || '';
    console.log(`Block ${index} original content:`, code);
    
    // Apply highlighting
    const highlightedCode = highlightLatex(code);
    console.log(`Block ${index} highlighted content (truncated):`, highlightedCode.substring(0, 100) + '...');
    
    // Replace content with highlighted version
    block.innerHTML = highlightedCode;
    
    // Add explicit classes for styling
    block.classList.add('latex-code-highlighted');
    
    // Mark as highlighted
    block.setAttribute('data-highlighted', 'true');
    console.log(`Block ${index} has been processed and marked as highlighted`);
  });
}

/**
 * Apply syntax highlighting to LaTeX code
 * This follows the exact color scheme from the blog post table:
 * - Commands: #2a9d8f (teal)
 * - Operators: #f4a261 (orange)
 * - Structures: #264653 (dark blue-green)
 * - Delimiters: #6c5b7b (purple)
 * - Braces: #1d3557 (dark blue)
 * - Spacing: #e9c46a (yellow)
 * - Numbers/Symbols: #e76f51 (red-orange)
 * - Text: #d4a5a5 (light brown)
 * - Fonts: #f1faee (very light blue)
 */
function highlightLatex(code: string): string {
  console.log('Original code to highlight:', code);
  
  // Escape HTML to prevent XSS
  let processedCode = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Create a wrapper to ensure we're working with inline HTML elements
  let result = '';
  
  // Split the code into tokens we can process
  // This tokenizer approach gives us more control than regex replacements
  let pos = 0;
  const len = processedCode.length;
  
  while (pos < len) {
    let char = processedCode[pos];
    let remaining = processedCode.substring(pos);
    
    // 1. Commands (teal #2a9d8f) - including beginning with backslash
    if (char === '\\' && pos + 1 < len && /[a-zA-Z]/.test(processedCode[pos + 1])) {
      let match = remaining.match(/\\[a-zA-Z]+/);
      if (match && match[0]) {
        result += `<span class="latex-command" style="color: #2a9d8f !important;">${match[0]}</span>`;
        pos += match[0].length;
        continue;
      }
    }
    
    // 2. Greek letters and special symbols (red-orange #e76f51)
    if (char === '\\') {
      const symbolMatch = remaining.match(/\\(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|infty|partial)/);
      if (symbolMatch && symbolMatch[0]) {
        result += `<span class="latex-symbol" style="color: #e76f51 !important;">${symbolMatch[0]}</span>`;
        pos += symbolMatch[0].length;
        continue;
      }
    }
    
    // 3. Spacing commands (yellow #e9c46a)
    if (char === '\\') {
      const spacingMatch = remaining.match(/\\(,|;|!|:|>|space|quad|qquad)/);
      if (spacingMatch && spacingMatch[0]) {
        result += `<span class="latex-spacing" style="color: #e9c46a !important;">${spacingMatch[0]}</span>`;
        pos += spacingMatch[0].length;
        continue;
      }
    }
    
    // 4. Structure commands (dark blue-green #264653)
    if (char === '\\') {
      const structureMatch = remaining.match(/\\(begin|end)\{[^}]*\}/);
      if (structureMatch && structureMatch[0]) {
        result += `<span class="latex-structure" style="color: #264653 !important;">${structureMatch[0]}</span>`;
        pos += structureMatch[0].length;
        continue;
      }
    }
    
    // 5. Font commands (very light blue #f1faee)
    if (char === '\\') {
      const fontMatch = remaining.match(/\\(mathrm|mathbf|mathit|mathsf|mathtt|mathcal|mathscr|mathfrak|mathbb)\{[^}]*\}/);
      if (fontMatch && fontMatch[0]) {
        result += `<span class="latex-font" style="color: #f1faee !important;">${fontMatch[0]}</span>`;
        pos += fontMatch[0].length;
        continue;
      }
    }
    
    // 6. Text commands (light brown #d4a5a5)
    if (char === '\\') {
      const textMatch = remaining.match(/\\text\{[^}]*\}/);
      if (textMatch && textMatch[0]) {
        result += `<span class="latex-text" style="color: #d4a5a5 !important;">${textMatch[0]}</span>`;
        pos += textMatch[0].length;
        continue;
      }
    }
    
    // 7. Operators (orange #f4a261)
    if (/[+\-*=\/^_]/.test(char)) {
      result += `<span class="latex-operator" style="color: #f4a261 !important;">${char}</span>`;
      pos++;
      continue;
    }
    
    // 8. Delimiters (purple #6c5b7b)
    if (char === '{' || char === '}') {
      result += `<span class="latex-delimiter" style="color: #6c5b7b !important;">${char}</span>`;
      pos++;
      continue;
    }
    
    // 9. Braces (dark blue #1d3557)
    if (char === '(' || char === ')' || char === '[' || char === ']') {
      result += `<span class="latex-brace" style="color: #1d3557 !important;">${char}</span>`;
      pos++;
      continue;
    }
    
    // 10. Numbers (red-orange #e76f51)
    if (/\d/.test(char)) {
      let match = remaining.match(/\d+(\.\d+)?/);
      if (match && match[0]) {
        result += `<span class="latex-number" style="color: #e76f51 !important;">${match[0]}</span>`;
        pos += match[0].length;
        continue;
      }
    }
    
    // Default: just add the character without styling
    result += char;
    pos++;
  }
  
  console.log('Highlighted code (first 100 chars):', result.substring(0, 100));
  return result;
}
