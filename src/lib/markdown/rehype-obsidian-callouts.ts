import { visit, SKIP } from 'unist-util-visit';
import { h } from 'hastscript';
import type { Root, Element } from 'hast';
import type { Transformer } from 'unified'; // Import Transformer type

// Helper function to map Obsidian callout types to Radix accent colors
// Based on the mappings observed in globals.css
function mapTypeToRadixColor(type: string): string {
  switch (type?.toLowerCase()) {
    case 'note': return 'blue';
    case 'abstract':
    case 'summary':
    case 'tldr': return 'indigo';
    case 'info': return 'cyan';
    case 'todo': return 'sky';
    case 'tip':
    case 'hint':
    case 'important': return 'teal';
    case 'success':
    case 'check':
    case 'done': return 'green';
    case 'question':
    case 'help':
    case 'faq': return 'violet';
    case 'warning':
    case 'caution':
    case 'attention':
    case 'disclaimer':
    case 'descargo': return 'amber';
    case 'failure':
    case 'fail':
    case 'missing':
    case 'danger':
    case 'error': return 'red';
    case 'bug': return 'rose';
    case 'example': return 'purple';
    case 'quote':
    case 'cite': return 'gray';
    default: return 'gray'; // Default color
  }
}

/**
 * Rehype plugin to transform blockquotes with callout metadata into Radix UI Callout structure.
 */
export function rehypeObsidianCallouts(): Transformer<Root> {
  return (tree: Root, file) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      // Ensure we are operating on a blockquote identified by the remark plugin
      if (node.tagName === 'blockquote' && node.properties?.dataCalloutType) {
        const calloutType = node.properties.dataCalloutType as string;
        const calloutTitle = node.properties.dataCalloutTitle as string;
        const calloutIcon = node.properties.dataCalloutIcon as string;
        // const calloutClassName = node.properties.dataCalloutClassName as string; // No longer needed for base Radix?

        const radixColor = mapTypeToRadixColor(calloutType);

        // Create the Radix Callout structure
        const calloutRoot = h('div.rt-CalloutRoot.rt-r-size-2.rt-variant-surface', { 'data-accent-color': radixColor }, [
          // Icon Container
          h('div.rt-CalloutIcon', [h('span', calloutIcon || '❓')] ), // Span for emoji or default
          // Text Container
          h('div.rt-CalloutText', [
            // Title (optional)
            calloutTitle ? h('strong.rt-Strong', calloutTitle) : null,
            // Original Content (add space if title exists and content follows)
            (calloutTitle ? ' ' : ''), // Add space only if title exists
            ...node.children // Spread the original children (paragraphs, etc.)
          ])
        ]);

        // Replace the original blockquote node with the new Radix structure
        if (parent && index !== undefined && parent.children) {
            parent.children.splice(index, 1, calloutRoot);
            return [SKIP, index]; // Use the imported SKIP symbol
        } else {
            console.error('[Rehype Callouts] Could not replace node: parent or index missing.');
        }

      } else if (node.tagName === 'blockquote') {
        // Handle blockquotes that were NOT identified as callouts
        // console.log('[Rehype Callouts] Found standard blockquote (not a callout).');
      }
    });
  };
}

// Helper function to capitalize a string (Keep for potential use?)
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
