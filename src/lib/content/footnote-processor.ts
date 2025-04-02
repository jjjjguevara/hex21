/**
 * Processes footnotes in the rendered HTML content
 * Ensures footnote references are clickable and have proper navigation
 */

import { Footnote } from '@/lib/markdown/types';

export function processFootnotes(container: HTMLElement, footnotes: Footnote[] = []) {
  // Find all footnote reference links
  const footnoteRefs = container.querySelectorAll('a[data-footnote-ref]');
  
  // Find the footnotes section if it exists
  const footnotesSection = container.querySelector('section.footnotes');
  
  if (!footnoteRefs.length || !footnotesSection) {
    return; // No footnotes to process
  }

  // Process each footnote reference to make it interactive
  footnoteRefs.forEach(ref => {
    ref.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Get the target footnote ID
      const href = ref.getAttribute('href');
      if (!href) return;
      
      // Find the target footnote and scroll to it
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  // Process back links in footnotes to return to the reference
  const backLinks = footnotesSection.querySelectorAll('a.data-footnote-backref');
  backLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Get the reference ID
      const href = link.getAttribute('href');
      if (!href) return;
      
      // Find the original reference and scroll to it
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
} 