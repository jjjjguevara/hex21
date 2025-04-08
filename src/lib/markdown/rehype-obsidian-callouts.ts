import { visit } from 'unist-util-visit';
import { h } from 'hastscript';
import type { Root, Element } from 'hast';
import type { Plugin } from 'unified'; // Import Plugin type

/**
 * Rehype plugin to transform blockquotes with callout metadata into styled divs.
 */
export const rehypeObsidianCallouts: Plugin<[], Root> = () => {
  console.log('[Rehype Callouts] Plugin initialized.');

  return (tree: Root) => {
    console.log('[Rehype Callouts] Processing HAST tree.');
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName === 'blockquote') {
        // Check if the blockquote has the data attributes added by the remark plugin via hProperties
        const properties = node.properties || {};
        const type = properties['data-callout-type'] as string;

        if (type) {
          const title = properties['data-callout-title'] as string;
          const icon = properties['data-callout-icon'] as string;
          const classNameFromData = properties['data-callout-className'] as string;

          console.log(`[Rehype Callouts] Found blockquote WITH callout properties: type=${type}, title=${title}`);

          // Create the new div structure
          const calloutDiv = h(
            'div',
            {
              className: ['obsidian-callout', classNameFromData].filter(Boolean).join(' '),
              'data-callout-type': type,
              'data-callout-title': title || '', // Add data attribute for title
            },
            [
              // Header div
              h('div', { className: ['callout-header'] }, [
                // Icon span
                h('span', { className: ['callout-icon'] }, icon),
                // Title span (only if title exists)
                title
                  ? h('span', { className: ['callout-title'] }, title)
                  : null
              ]),
              // Content div (wrap existing children)
              h('div', { className: ['callout-content'] }, node.children)
            ]
          );

          // Replace the blockquote node with the new div node in the parent
          if (parent && index !== undefined) {
            parent.children.splice(index, 1, calloutDiv);
            console.log('[Rehype Callouts] Replaced blockquote with callout div.');
            // Return 'skip' to prevent visiting the children of the new node
            return 'skip';
          } else {
            console.error('[Rehype Callouts] Could not replace node: parent or index missing.');
          }
        } else {
          console.log('[Rehype Callouts] Found blockquote WITHOUT callout properties.');
        }
      }
    });
  };
}
