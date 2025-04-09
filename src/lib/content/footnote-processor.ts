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
  const footnoteRefs = container.querySelectorAll<HTMLAnchorElement>('a[id^="user-content-fnref"]');
  console.log(`[Footnote Processor] Found ${footnoteRefs.length} footnote references (a tags with id^=user-content-fnref).`);

  // First, find the footnotes section
  const footnotesSection = container.querySelector<HTMLElement>('section.footnotes');
  
  // Clean up the footnotes heading and separators if found
  if (footnotesSection) {
    console.log('[Footnote Processor] Footnotes section found, cleaning up heading and separators...');
    
    // Remove the h2 heading
    const heading = footnotesSection.querySelector('h2#footnote-label');
    if (heading) {
      console.log('[Footnote Processor] Removing footnotes heading');
      heading.remove();
    }
    
    // Remove HR elements before and after the footnotes section
    const prevElement = footnotesSection.previousElementSibling;
    if (prevElement && prevElement.tagName.toLowerCase() === 'hr') {
      console.log('[Footnote Processor] Removing HR before footnotes');
      prevElement.remove();
    }
    
    const nextElement = footnotesSection.nextElementSibling;
    if (nextElement && nextElement.tagName.toLowerCase() === 'hr') {
      console.log('[Footnote Processor] Removing HR after footnotes');
      nextElement.remove();
    }
    
    // Also remove any HRs inside the footnotes section
    footnotesSection.querySelectorAll('hr').forEach(hr => {
      console.log('[Footnote Processor] Removing HR inside footnotes');
      hr.remove();
    });
  }

  // Get all footnote items and back references
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
  footnoteItems.forEach((item, index) => {
    const backRef = item.querySelector('a[href^="#user-content-fnref"]');
    if (backRef && !backRef.hasAttribute('data-footnote-backref')) {
      backRef.setAttribute('data-footnote-backref', 'true');
      console.log(`[Footnote Processor] Tagged back-reference in item ${item.id}`);
    }

    // Prevent adding duplicate number links if script runs multiple times
    if (item.querySelector('.footnote-number-link')) {
      console.log(`[Footnote Processor] Skipping item ${item.id}, number link already exists.`);
      return;
    }

    // --- START: Inject clickable number span ---
    const numberLink = document.createElement('span');
    numberLink.className = 'footnote-number-link';
    numberLink.innerText = `${index + 1}. `;
    numberLink.style.cursor = 'pointer'; // Add cursor style here

    numberLink.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent triggering other listeners if needed
        const itemId = item.id;
        if (!itemId) {
          console.warn('[Footnote Processor] Clicked footnote number span within item with no ID.');
          return;
        }

        const targetHrefSelector = `a[href="#${itemId}"]`;
        const targetRefLink = container.querySelector<HTMLAnchorElement>(targetHrefSelector);

        console.log(`[Footnote Processor] Footnote number ${index + 1} clicked. Searching for first ref: ${targetHrefSelector}`);

        if (targetRefLink) {
          console.log(`[Footnote Processor] Found target ref link: ${targetRefLink.id}. Scrolling into view.`);
          targetRefLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add highlight class and remove after delay
          targetRefLink.classList.add('footnote-ref-highlighted');
          setTimeout(() => {
            targetRefLink.classList.remove('footnote-ref-highlighted');
          }, 1500); // 1.5 seconds highlight duration

        } else {
          console.warn(`[Footnote Processor] Could not find target ref link for selector: ${targetHrefSelector}`);
        }

        // Remove highlight from the parent item when number is clicked
        item.classList.remove('footnote-item-highlighted');
    });

    // Insert the number link before the paragraph content
    const firstParagraph = item.querySelector('p');
    if (firstParagraph) {
      item.insertBefore(numberLink, firstParagraph);
    } else {
      // Fallback if no paragraph found (shouldn't happen with standard markdown)
      item.prepend(numberLink);
    }
    console.log(`[Footnote Processor] Injected clickable number span for item: ${item.id}`);
    // --- END: Inject clickable number span ---

  });

  // Now re-query to include newly tagged items
  const allBackRefs = container.querySelectorAll<HTMLAnchorElement>('a[data-footnote-backref]');
  console.log(`[Footnote Processor] Found ${allBackRefs.length} back-reference links after tagging.`);

  // Process Footnote References (the links in the main text)
  if (footnoteRefs.length > 0) {
    footnoteRefs.forEach((refLink, index) => {
      const refId = refLink.id; 
      const targetId = refLink.getAttribute('href')?.substring(1); // Get target ID from href (e.g., #user-content-fn-1 -> user-content-fn-1)

      console.log(`[Footnote Processor] Processing ref link #${index + 1}: ID=${refId}, Target=${targetId}`);

      if (!targetId) {
        console.error(`[Footnote Processor] Could not find footnote item with ID: ${targetId}`);
        return; 
      }

      // Ensure the link itself is clickable
      refLink.style.cursor = 'pointer'; // Explicitly set cursor
      refLink.classList.add('footnote-ref-clickable'); // Add class for potential styling

      // Prevent default link behavior and implement smooth scroll + highlight
      refLink.addEventListener('click', (event) => {
        // --- DEBUG LOG --- 
        console.log(`[Footnote Processor] CLICK HANDLER TRIGGERED for ref link: ${refId} targeting ${targetId}`); 
        // --- END DEBUG LOG --- 

        event.preventDefault();
        console.log(`[Footnote Processor] Clicked ref link: ${refId} -> ${targetId}`);

        // Remove highlight from any previously highlighted footnote item
        footnoteItems.forEach(item => item.classList.remove('footnote-item-highlighted'));

        // Scroll to the target footnote item
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          console.log(`[Footnote Processor] Scrolling to target: ${targetId}`);
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add highlight to the target footnote item
          targetElement.classList.add('footnote-item-highlighted');
          console.log(`[Footnote Processor] Highlighted footnote item: ${targetId}`);

          // Check for back-reference link within the highlighted item
          const backRef = targetElement.querySelector<HTMLAnchorElement>('a.data-footnote-backref');
          if (backRef) {
            console.log(`[Footnote Processor] Found back-ref link in highlighted item: ${backRef.outerHTML}`);
          } else {
            console.warn(`[Footnote Processor] No back-ref link found in highlighted item: ${targetId}`);
          }
        } else {
          console.error(`[Footnote Processor] Click handler could not find target element: ${targetId}`);
        }
      });
      console.log(`[Footnote Processor] Added click listener to ref link: ${refId}`);
    });
  } else {
    console.log('[Footnote Processor] No footnote reference links (a tags) found to process.');
  }
  console.log('[Footnote Processor] Finished processing footnote references (a tags).');

  // Process Back-References (the 'return' arrows in the footnote list)
  allBackRefs.forEach((link, index) => {
    // --- START NEW LOGGING ---
    console.log(`[Footnote Processor] Inspecting Back-Ref #${index + 1} - Initial innerHTML: "${link.innerHTML}"`);
    // --- END NEW LOGGING ---

    // --- START FIX: Remove remark-gfm added symbols ---
    link.innerHTML = ''; 
    // --- END FIX ---

    const parentLi = link.closest('li');
    const parentLiId = parentLi ? parentLi.id : 'unknown';
    console.log(`[Footnote Processor] Processing back-ref link #${index + 1} inside li: ${parentLiId}`);

    // Prevent adding listener multiple times
    if (link.dataset.footnoteListenerAttached === 'true') {
      console.log(`[Footnote Processor] Listener already attached to back-ref in ${parentLiId}, skipping.`);
      return;
    }

    // --- FIX: Remove aria-label and ensure correct data attribute --- 
    link.removeAttribute('aria-label'); 
    link.setAttribute('data-footnote-backref', 'true');
    // --- END FIX ---

    const targetRefId = link.getAttribute('href')?.substring(1); // Get target ref ID (e.g., #user-content-fnref-1 -> user-content-fnref-1)
    console.log(`[Footnote Processor] Target reference ID for back-ref in ${parentLiId} is: ${targetRefId}`);

    if (!targetRefId) {
      console.error(`[Footnote Processor] Back-ref link in ${parentLiId} has no valid href.`);
      return;
    }

    // Add the click listener
    link.addEventListener('click', (event) => {
      event.preventDefault();
      console.log(`[Footnote Processor] Clicked back-ref link in ${parentLiId}, scrolling to ${targetRefId}`);

      // --- ADDED BACK --- Explicitly clear content to remove potential emojis
      link.innerHTML = ''; 
      // --- END ADDED BACK ---

      // Remove highlight from the parent <li> when the back-ref is clicked
      if (parentLi) {
        parentLi.classList.remove('footnote-item-highlighted');
        console.log(`[Footnote Processor] Removed highlight from footnote item: ${parentLiId}`);
      }

      // Scroll back to the reference in the main text
      const targetRefElement = document.getElementById(targetRefId);
      if (targetRefElement) {
        targetRefElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
         console.error(`[Footnote Processor] Could not find target reference element: ${targetRefId}`);
      }
    });

    link.dataset.footnoteListenerAttached = 'true'; // Mark as listener attached
    console.log(`[Footnote Processor] Added click listener to back-ref link in ${parentLiId}.`);
  });
  console.log('[Footnote Processor] Finished processing back-references.');
  console.log('[Footnote Processor] Footnote processing complete.');
}