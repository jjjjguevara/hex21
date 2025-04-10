'use client';

import { useEffect, useRef } from 'react';
import CopyButton from './CopyButton';
import hljs from 'highlight.js';
<<<<<<< Updated upstream
import latex from 'highlight.js/lib/languages/latex';

hljs.registerLanguage('latex', latex);
hljs.registerLanguage('tex', latex);
=======
>>>>>>> Stashed changes

interface CodeBlockProps {
  children: string;
  language?: string;
  className?: string;
}

export default function CodeBlock({ children, language, className = '' }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
<<<<<<< Updated upstream
=======
    // Skip LaTeX-specific initialization since we don't have the module
    // We'll just use highlight.js directly
    
>>>>>>> Stashed changes
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [children, language]);

  const languageClass = language ? `language-${language}` : '';

  return (
    <div className="relative group">
      <pre className={`${className} ${languageClass}`}>
        <code ref={codeRef} className={languageClass}>
          {children}
        </code>
      </pre>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={children} />
      </div>
    </div>
  );
} 