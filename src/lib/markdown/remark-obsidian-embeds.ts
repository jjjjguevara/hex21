/**
 * Custom remark plugin for processing Obsidian-style embeds (e.g., ![[image.png]])
 */

import { visit } from 'unist-util-visit';
import path from 'path';

// List of supported image extensions
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'];

interface EmbedOptions {
  // Base path for resolving assets
  assetBasePath?: string;
}

/**
 * Remark plugin to transform ![[file.png]] syntax into proper image elements
 */
export function remarkObsidianEmbeds(options: EmbedOptions = {}) {
  const assetBasePath = options.assetBasePath || '/content/assets';
  
  return (tree: any) => {
    visit(tree, 'text', (node: any, index, parent) => {
      // Early return if parent is undefined or index is undefined/null
      if (!parent || typeof index !== 'number') return;
      
      const text = node.value;
      const embedRegex = /!\[\[(.*?)\]\]/g;
      let match;
      let lastIndex = 0;
      const newChildren = [];
      
      while ((match = embedRegex.exec(text)) !== null) {
        const [fullMatch, innerContent] = match;
        let source = '';
        let altText = '';
        let size = '';
        
        // Split inner content by '|' to separate parts
        const parts = innerContent.split('|').map(p => p.trim());
        source = parts[0] || ''; // First part is always the source
        
        // Check remaining parts for size or alt text
        if (parts.length > 1) {
          // Check if the second part looks like a size attribute (e.g., "100", "100x50", "width=100", "height=50")
          if (/^\d+(x\d+)?$/.test(parts[1]) || /^(width|height)=\d+%?$/.test(parts[1])) {
            size = parts[1];
            altText = parts[2] || ''; // If size is second, alt is third (if present)
          } else {
            altText = parts[1]; // If second part isn't size, assume it's alt
            size = parts[2] || ''; // If alt is second, size is third (if present)
          }
        }
        
        console.log(`[Remark Embeds] Parsed: source=${source}, alt=${altText}, size=${size}`);
        
        // Add text before the embed
        if (match.index > lastIndex) {
          newChildren.push({
            type: 'text',
            value: text.slice(lastIndex, match.index)
          });
        }
        
        const dataAttrs = {
          'data-type': 'embed',
          'data-source': source,
          ...(altText && { 'data-alt': altText }), // Conditionally add data-alt
          ...(size && { 'data-size': size })      // Conditionally add data-size
        };
        
        const placeholderHtml = `<span ${Object.entries(dataAttrs).map(([key, value]) => `${key}="${value}"`).join(' ')}}></span>`;
        
        newChildren.push({
          type: 'html',
          value: placeholderHtml
        });
        
        lastIndex = match.index + fullMatch.length;
      }
      
      // Add any remaining text
      if (lastIndex < text.length) {
        newChildren.push({
          type: 'text',
          value: text.slice(lastIndex)
        });
      }
      
      if (newChildren.length > 0) {
        parent.children.splice(index, 1, ...newChildren);
        return index + newChildren.length;
      }
    });
  };
}
