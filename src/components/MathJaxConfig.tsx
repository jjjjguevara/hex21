'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    MathJax: any;
  }
}

export default function MathJaxConfig() {
  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typeset();
    }
  }, []);

  return null;
} 