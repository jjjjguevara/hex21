// Client-side utility functions

/**
 * Copies code to clipboard and shows visual feedback
 */
export async function copyCode(e: MouseEvent) {
  const code = (e.currentTarget as HTMLElement).closest('.group')?.querySelector('code');
  if (code) {
    try {
      await navigator.clipboard.writeText(code.textContent || '');
      const button = e.currentTarget as HTMLElement;
      button.classList.add('text-green-500');
      setTimeout(() => button.classList.remove('text-green-500'), 1000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
}

// Make copyCode available globally
if (typeof window !== 'undefined') {
  (window as any).copyCode = copyCode;
} 