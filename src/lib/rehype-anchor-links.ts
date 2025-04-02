import { visit } from 'unist-util-visit';
import { h } from 'hastscript';

export function rehypeAnchorLinks() {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      if (/^h[1-6]$/.test(node.tagName) && node.properties.id) {
        const link = h('a', {
          href: `#${node.properties.id}`,
          class: 'anchor-link',
          'aria-label': `Link to ${node.children[0]?.value || node.properties.id}`,
        }, '¶');

        // Create a wrapper span for flexbox layout
        const wrapper = h('span', {
          class: 'heading-wrapper',
        }, [...node.children, link]);

        node.children = [wrapper];
      }
    });
  };
} 