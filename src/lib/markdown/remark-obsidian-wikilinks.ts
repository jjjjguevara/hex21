/**
 * Custom remark plugin for processing Obsidian-style wikilinks (e.g., [[Page]] or [[Page|Alias]])
 */

import { visit } from 'unist-util-visit';
import path from 'path';

// List of supported image extensions
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'];
// Document extensions
const DOC_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

interface WikiLinkOptions {
  // Base path for resolving relative links
  basePath?: string;
}

/**
 * Remark plugin to transform [[Page]] or [[Page|Alias]] syntax into HTML links
 */
export function remarkObsidianWikilinks(options: WikiLinkOptions = {}) {
  const basePath = options.basePath || '';
  
  return (tree: any) => {
    visit(tree, 'text', (node: any, index, parent) => {
      // Early return if parent is undefined or index is undefined/null
      if (!parent || typeof index !== 'number') return;
      
      const text = node.value;
      // Regex to match [[target]] or [[target|alias]]
      const wikiLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
      let match;
      let lastIndex = 0;
      const newChildren = [];
      
      while ((match = wikiLinkRegex.exec(text)) !== null) {
        const [fullMatch, target, alias] = match;
        
        // Add the text before the wikilink
        if (match.index > lastIndex) {
          newChildren.push({
            type: 'text',
            value: text.slice(lastIndex, match.index)
          });
        }
        
        // Process the target to determine what kind of link it is
        const targetLower = target.toLowerCase();
        let url = '';
        let classes = ['wiki-link'];
        let attrs = ` class="${classes.join(' ')}" data-target="${target}"${alias ? ` data-alias="${alias}"` : ''}`;
        
        // Determine the link type and URL
        if (targetLower.startsWith('http://') || targetLower.startsWith('https://')) {
          // External URL
          url = target;
          attrs += ' target="_blank" rel="noopener noreferrer"';
        } 
        else if (IMAGE_EXTENSIONS.some(ext => targetLower.endsWith(ext))) {
          // Image file
          url = `/content/assets/${target}`;
        }
        else if (DOC_EXTENSIONS.some(ext => targetLower.endsWith(ext))) {
          // Document file
          url = `/content/assets/${target}`;
          attrs += ' target="_blank"';
        }
        else if (targetLower.includes('.md')) {
          // Markdown file link - strip .md extension
          const slug = targetLower
            .replace(/\.md$/i, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-_/]/g, '');
          
          url = basePath 
            ? `${basePath}/${slug}`
            : `/${slug}`;
        }
        else {
          // Wiki page link (no extension)
          const slug = target
            .replace(/\s+/g, '-')
            .toLowerCase()
            .replace(/[^a-z0-9-_/]/g, '');
          
          url = basePath 
            ? `${basePath}/${slug}`
            : `/${slug}`;
        }
        
        // --- Change: Create a placeholder span instead of a direct <a> tag ---
        // Define data attributes for the placeholder
        const dataAttrs = {
          'data-type': 'wikilink',
          'data-target': target,
          ...(alias && { 'data-alias': alias }) // Conditionally add data-alias
        };

        // Construct the placeholder span HTML string
        const placeholderHtml = `<span ${Object.entries(dataAttrs).map(([key, value]) => `${key}="${value}"`).join(' ')}}></span>`;
        
        newChildren.push({
          type: 'html',
          value: placeholderHtml // Use the placeholder HTML
        });
        // --- End Change ---

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
