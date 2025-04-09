/**
 * A Rehype plugin to clean up the footnotes section by removing:
 * - The "Footnotes" heading
 * - Any horizontal rule (HR) separators around the footnotes section
 */

import { visit } from 'unist-util-visit';
import { h } from 'hastscript';
import type { Plugin } from 'unified';
import type { Root, Element } from 'hast';

/**
 * Rehype plugin to remove the footnotes heading and horizontal rules
 */
export const rehypeCleanFootnotes: Plugin<[], Root> = () => {
  return (tree) => {
    // First remove all HRs before any section with data-footnotes
    visit(tree, 'element', (node, index, parent) => {
      if (node.type === 'element' && 
          (node as Element).tagName === 'hr' && 
          parent && 
          Array.isArray(parent.children) && 
          index !== null && 
          index !== undefined) {
        
        // Check if the next element is the footnotes section
        const nextIdx = index + 1;
        if (nextIdx < parent.children.length) {
          const nextNode = parent.children[nextIdx];
          if (nextNode.type === 'element' && 
              (nextNode as Element).tagName === 'section' && 
              nextNode.properties && 
              nextNode.properties['data-footnotes'] !== undefined) {
            // Remove this HR
            parent.children.splice(index, 1);
            return index; // Return the current index to handle the shifted array
          }
        }
      }
    });

    // Now handle the footnotes section itself
    visit(tree, 'element', (node) => {
      if (node.type === 'element' && 
          (node as Element).tagName === 'section' && 
          node.properties && 
          node.properties['data-footnotes'] !== undefined) {

        // Found the footnotes section - remove the heading
        if (Array.isArray(node.children)) {
          node.children = node.children.filter(child => {
            return !(child.type === 'element' && 
                    (child as Element).tagName === 'h2' && 
                    child.properties && 
                    child.properties.id === 'footnote-label');
          });
        }

        // Also look for HR elements inside the footnotes section and remove them
        if (Array.isArray(node.children)) {
          node.children = node.children.filter(child => {
            return !(child.type === 'element' && 
                    (child as Element).tagName === 'hr');
          });
        }
      }
    });

    // Finally check for HRs after the footnotes section
    visit(tree, 'element', (node, index, parent) => {
      if (node.type === 'element' && 
          (node as Element).tagName === 'section' && 
          node.properties && 
          node.properties['data-footnotes'] !== undefined && 
          parent && 
          Array.isArray(parent.children) && 
          index !== null && 
          index !== undefined) {

        // Check if there's an HR after the footnotes section  
        const nextIdx = index + 1;
        if (nextIdx < parent.children.length) {
          const nextNode = parent.children[nextIdx];
          if (nextNode.type === 'element' && (nextNode as Element).tagName === 'hr') {
            // Remove this HR
            parent.children.splice(nextIdx, 1);
          }
        }
      }
    });
  };
};

export default rehypeCleanFootnotes;
