'use client';

import { useEffect } from 'react';

export default function CodeCopy() {
  useEffect(() => {
    const handleCopyClick = async (event: MouseEvent) => {
      const button = event.target as HTMLElement;
      const copyButton = button.closest('[data-copy-code]');
      if (!copyButton) return;

      const code = copyButton.closest('.group')?.querySelector('code');
      if (!code) return;

      try {
        await navigator.clipboard.writeText(code.textContent || '');
        copyButton.classList.add('text-green-500');
        setTimeout(() => copyButton.classList.remove('text-green-500'), 1000);
      } catch (error) {
        console.error('Failed to copy code:', error);
      }
    };

    document.addEventListener('click', handleCopyClick);
    return () => document.removeEventListener('click', handleCopyClick);
  }, []);

  return null;
} 