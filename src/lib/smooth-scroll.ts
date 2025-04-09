/**
 * Smoothly scrolls the page to the specified element, attempting to center it vertically.
 * @param element The target HTMLElement to scroll to.
 * @param callback Optional callback function to execute after scrolling is complete.
 */
export function smoothScrollTo(element: HTMLElement, callback?: () => void): void {
  if (!element) {
    console.error('smoothScrollTo: Target element not provided.');
    return;
  }

  const elementRect = element.getBoundingClientRect();
  const absoluteElementTop = elementRect.top + window.scrollY;
  const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);

  window.scrollTo({
    top: middle,
    behavior: 'smooth'
  });

  // Since 'smooth' behavior doesn't have a native end event reliably across browsers,
  // we use a timeout as an approximation. Adjust duration if needed.
  if (callback) {
    const scrollDuration = 500; // Estimate based on typical smooth scroll time
    setTimeout(callback, scrollDuration);
  }
}
