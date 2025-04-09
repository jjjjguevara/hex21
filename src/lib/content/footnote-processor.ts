/**
 * Processes footnotes in the rendered HTML content
 * Ensures footnote references are clickable and have proper navigation
 */

import type { Footnote } from '@/lib/markdown/types';
import { smoothScrollTo } from '../smooth-scroll';

console.log('[Footnote Processor] Script loaded');

const HIGHLIGHT_CLASS = 'footnote-highlight';
const HIGHLIGHT_DURATION = 1500; // ms

// Helper function to handle scroll and highlight
function scrollToAndHighlight(targetElement: HTMLElement | null) {
  if (!targetElement) {
    console.error('[Footnote Processor] scrollToAndHighlight: Target element is null.');
    return;
  }

  console.log(`[Footnote Processor] Attempting to highlight and scroll to: ${targetElement.id}`);

  // Clear any existing highlights first
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach(el => {
    el.classList.remove(HIGHLIGHT_CLASS);
  });

  // Add highlight class
  // Make sure we are adding it to the parent LI if the target is the footnote itself
  let elementToHighlight = targetElement;
  if (targetElement.tagName === 'LI' && targetElement.id.startsWith('user-content-fn-')) {
    elementToHighlight = targetElement;
    console.log(`[Footnote Processor] Highlighting LI element: ${elementToHighlight.id}`);
  } else if (targetElement.id.startsWith('user-content-fnref-')) {
    // If it's the reference, don't highlight it, just scroll
    console.log(`[Footnote Processor] Target is a reference (${targetElement.id}), not highlighting.`);
  } else {
    // Find the parent LI if the target is inside a footnote item
    const parentLi = targetElement.closest('li[id^="user-content-fn-"]');
    if (parentLi instanceof HTMLElement) {
      elementToHighlight = parentLi;
      console.log(`[Footnote Processor] Highlighting parent LI element: ${elementToHighlight.id}`);
    } else {
      console.log(`[Footnote Processor] Could not find parent LI for ${targetElement.id}, highlighting target directly.`);
    }
  }

  elementToHighlight.classList.add(HIGHLIGHT_CLASS);
  console.log(`[Footnote Processor] Added highlight class '${HIGHLIGHT_CLASS}' to: ${elementToHighlight.id}`);

  // Check if the back-ref link exists within the highlighted element now
  const backRefLink = elementToHighlight.querySelector('a[data-footnote-backref]');
  if (backRefLink) {
    console.log(`[Footnote Processor] Back reference link found within highlighted element:`, backRefLink);
  } else {
    console.warn(`[Footnote Processor] No back reference link found within highlighted element: ${elementToHighlight.id}`);
  }

  // Scroll the original target element into view
  targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  console.log(`[Footnote Processor] Scrolled to: ${targetElement.id}`);
}

// Helper function to create click handlers
function createClickHandler(targetId: string | null) {
  return function (event: MouseEvent) {
    event.preventDefault();
    if (!targetId) return;

    // Remove highlight from any previously highlighted footnotes
    document.querySelectorAll('.footnote-highlight').forEach(el => {
      el.classList.remove('footnote-highlight');
    });

    const targetElement = document.getElementById(targetId);
    console.log(`[Footnote Processor] Clicked link, scrolling to target: #${targetId}`, targetElement);
    scrollToAndHighlight(targetElement);
  };
}

export function processFootnotes(container: HTMLElement): void {
  if (!container) {
    console.error('[Footnote Processor] processFootnotes called with null container.');
    return;
  }
  console.log('[Footnote Processor] Starting footnote processing...');

  // Find all footnote references and footnote back-references
  const footnoteRefs = container.querySelectorAll<HTMLElement>('sup[id^="user-content-fnref"]');
  console.log(`[Footnote Processor] Found ${footnoteRefs.length} footnote references (sup tags).`);

  const footnotesSection = container.querySelector<HTMLElement>('section.footnotes');
  const footnoteItems = container.querySelectorAll<HTMLElement>('li[id^="user-content-fn"]');
  const backRefs = container.querySelectorAll<HTMLAnchorElement>('a[data-footnote-backref]'); 

  console.log(`[Footnote Processor] Found ${footnoteItems.length} footnote items.`);

  // Basic error checking
  if (!footnotesSection && footnoteRefs.length > 0) {
     console.log('[Footnote Processor] Warning: Footnotes section not found but references exist.');
  }

  if (footnoteRefs.length === 0 && backRefs.length === 0) {
    console.log('[Footnote Processor] No footnote references or back-references found. Exiting.');
    return;
  }

  // Process all footnote items first to ensure they have properly tagged back-references
  footnoteItems.forEach(item => {
    const backRef = item.querySelector('a[href^="#user-content-fnref"]');
    if (backRef && !backRef.hasAttribute('data-footnote-backref')) {
      backRef.setAttribute('data-footnote-backref', 'true');
      console.log(`[Footnote Processor] Tagged back-reference in item ${item.id}`);
    }
  });

  // Now re-query to include newly tagged items
  const allBackRefs = container.querySelectorAll<HTMLAnchorElement>('a[data-footnote-backref]');
  console.log(`[Footnote Processor] Found ${allBackRefs.length} back-reference links after tagging.`);

  // Process Footnote References (the superscript numbers)
  footnoteRefs.forEach((sup, index) => {
    console.log(`[Footnote Processor] Processing sup ref #${index + 1}, ID: ${sup.id}`);
    // Prevent adding listener multiple times
    if (sup.dataset.footnoteListenerAttached === 'true') {
      console.log(`[Footnote Processor] Listener already attached to ${sup.id}, skipping.`);
      return;
    }

    // Find the link inside the sup element
    let link = sup.querySelector('a');

    if (!link) {
      console.warn(`[Footnote Processor] No link found inside ${sup.id}. Attempting to create one.`);
      // If there's no link, create one
      link = document.createElement('a');
      link.innerHTML = sup.innerHTML;
      sup.innerHTML = '';
      sup.appendChild(link);
      
      // Set href attribute to the corresponding footnote ID
      const footnoteId = sup.id.replace('fnref', 'fn');
      link.setAttribute('href', `#${footnoteId}`);
      console.log(`[Footnote Processor] Created link for ${sup.id} with href: ${link.getAttribute('href')}`);
    } else {
      console.log(`[Footnote Processor] Found existing link inside ${sup.id}:`, link);
    }

    // Ensure the link has the required attributes
    link.setAttribute('data-footnote-ref', 'true');
    link.setAttribute('aria-describedby', 'footnote-label');

    // Get the target footnote ID
    const targetId = link.getAttribute('href')?.substring(1);
    if (!targetId) {
      console.error(`[Footnote Processor] Could not extract targetId from href for ${sup.id}`);
      return;
    }

    console.log(`[Footnote Processor] Target footnote ID for ${sup.id} is: ${targetId}`);

    // Make sure the link is properly styled
    if (link instanceof HTMLElement) {
      console.log(`[Footnote Processor] Applying styles to link in ${sup.id}`);
      link.style.color = 'var(--text-link)';
      // Ensure link is clickable
      link.style.pointerEvents = 'auto'; 
    }

    // Add click handler directly to the link for proper event handling
    link.addEventListener('click', createClickHandler(targetId));
    console.log(`[Footnote Processor] Added click listener to link inside ${sup.id} for target ${targetId}.`);

    // Also make the entire sup element clickable as a fallback
    sup.style.cursor = 'pointer';
    sup.addEventListener('click', (event) => {
      // Only handle if the click was directly on the sup (not the link)
      if (event.target === sup) {
        event.preventDefault();
        const handler = createClickHandler(targetId);
        handler(event);
      }
    });
    
    sup.dataset.footnoteListenerAttached = 'true';
  });

  console.log('[Footnote Processor] Finished processing footnote references (sup).');

  // Process Back-References (the return link arrows in each footnote)
  allBackRefs.forEach((link, index) => {
    const parentLi = link.closest('li');
    const parentLiId = parentLi ? parentLi.id : 'unknown';
    console.log(`[Footnote Processor] Processing back-ref link #${index + 1} inside li: ${parentLiId}`);

    // Prevent adding listener multiple times
    if (link.dataset.footnoteListenerAttached === 'true') {
      console.log(`[Footnote Processor] Listener already attached to back-ref in ${parentLiId}, skipping.`);
      return;
    }

    const targetId = link.getAttribute('href')?.substring(1);
    if (!targetId) {
      console.error(`[Footnote Processor] Could not extract targetId from back-ref href in ${parentLiId}`);
      return;
    }

    console.log(`[Footnote Processor] Target reference ID for back-ref in ${parentLiId} is: ${targetId}`);

    // Ensure the link is properly tagged for styling
    link.classList.add('data-footnote-backref');
    
    // Make the back arrow more semantic with proper attributes
    link.setAttribute('aria-label', 'Return to reference');
    
    // Clear inner content and let CSS handle the display of the arrow
    link.innerHTML = '';

    // Add the click handler
    link.addEventListener('click', (event) => {
      event.preventDefault();
      
      // Remove highlight from the footnote item
      const footnoteItem = link.closest('li');
      if (footnoteItem) {
        console.log(`[Footnote Processor] Back-ref clicked in ${parentLiId}. Removing highlight from footnote.`);
        footnoteItem.classList.remove(HIGHLIGHT_CLASS);
      }
      
      // Scroll to and highlight the original reference
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        console.log(`[Footnote Processor] Found target element ${targetId} for back-ref.`);
        scrollToAndHighlight(targetElement);
      } else {
        console.error(`[Footnote Processor] Could not find target element #${targetId} for back-ref from ${parentLiId}`);
      }
    });
    
    console.log(`[Footnote Processor] Added click listener to back-ref link in ${parentLiId}.`);
    
    link.dataset.footnoteListenerAttached = 'true';
  });

  console.log('[Footnote Processor] Finished processing back-references.');
  console.log('[Footnote Processor] Footnote processing complete.');
}