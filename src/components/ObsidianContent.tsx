'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Metadata } from '@/lib/markdown/types';
import { MarkdownContent } from './MarkdownContent';
import path from 'path';

interface ObsidianContentProps {
  content: string; // Raw HTML content
  metadata?: Metadata; // Optional metadata 
  basePath?: string;
}

/**
 * A component that pre-processes Obsidian-style Markdown content
 * before passing it to the standard MarkdownContent component
 */
// Helper function to escape special regex characters
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function ObsidianContent({ content, metadata, basePath = '' }: ObsidianContentProps) {
  const [processedHtml, setProcessedHtml] = useState<string>(content);
  const contentRef = useRef<HTMLDivElement>(null);

  // First pass: only remove duplicate H1 title if present
  useEffect(() => {
    let newHtml = content;
    
    // Remove the H1 title if it matches the document title
    // This prevents duplicate titles (one in the header, one in the content)
    if (metadata?.title) {
      const titlePattern = new RegExp(`<h1.*?>\\s*${escapeRegExp(metadata.title)}\\s*(<a.*?>.*?</a>)?\\s*</h1>`, 'i');
      newHtml = newHtml.replace(titlePattern, '');
    }

    // Set processed content with just title removal
    setProcessedHtml(newHtml);
  }, [content, metadata]);

  // Second pass: process wikilinks and embeds using DOM manipulation after render
  useEffect(() => {
    if (!contentRef.current) return;
    
    // console.log('[ObsidianContent] Processing DOM for client-side transformations');

    // Process all paragraph text nodes to find and replace Obsidian syntax
    const processWikiLinks = () => {
      const container = contentRef.current;
      if (!container) return;

      // Get all text nodes within the container that aren't in code blocks
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Check if the node or any ancestor is a PRE or CODE element
            const closestCodeOrPre = node.parentElement?.closest('pre, code');
            if (closestCodeOrPre) {
              // console.log(`[acceptNode] REJECTING node in ${closestCodeOrPre.tagName}:`, node.nodeValue); // DEBUG: Uncomment if needed
              return NodeFilter.FILTER_REJECT; // Reject nodes within code blocks
            }
            // Log accepted nodes that contain the target patterns
            if (node.nodeValue && (node.nodeValue.includes('![[') || node.nodeValue.includes('[['))) {
              // console.log(`[acceptNode] ACCEPTING node:`, node.nodeValue?.trim());
              // Log parent structure for context
              // console.log(`  -> Parent:`, node.parentElement?.tagName, `Attrs:`, node.parentElement?.attributes);
              // Check closest again just to be sure
              // console.log(`  -> Closest pre/code:`, node.parentElement?.closest('pre, code')?.tagName || 'None');
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const nodesToProcess: { node: Text; value: string }[] = [];
      let currentNode: Text | null;
      
      // Collect all text nodes that need processing
      while ((currentNode = walker.nextNode() as Text | null)) {
        if (currentNode && (
            currentNode.nodeValue?.includes('[[') ||
            currentNode.nodeValue?.includes('![['))
        ) {
          nodesToProcess.push({ 
            node: currentNode, 
            value: currentNode.nodeValue || ''
          });
        }
      }

      // Process each node that contains wikilinks or embeds
      nodesToProcess.forEach(({ node, value }) => {
        let newHtml = value;
        let changed = false;
        
        // Process wikilinks [[page]] or [[page|alias]]
        newHtml = newHtml.replace(
          /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
          (match, target, alias) => {
            changed = true;
            
            // Determine the URL based on the target
            let url = target;
            let classes = 'wiki-link';
            let attrs = '';
            
            // Normalize target by trimming whitespace
            target = target.trim();
            
            if (target.startsWith('http://') || target.startsWith('https://')) {
              // External URL
              attrs = ' target="_blank" rel="noopener noreferrer"';
              url = target; // Use the actual URL for external links
            } else if (/\.(png|jpg|jpeg|gif|svg|webp|avif)$/i.test(target)) {
              // Image file - point to assets folder
              url = `/content/assets/${target}`;
            } else if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(target)) {
              // Document file - point to assets folder
              url = `/content/assets/${target}`;
              attrs = ' target="_blank"';
            } else {
              // Wiki page link - handle relative paths and sections
              let targetPath = target;
              let section = '';
              
              // Handle section links with # syntax
              if (target.includes('#')) {
                const parts = target.split('#');
                targetPath = parts[0];
                section = parts[1] ? `#${parts[1]}` : '';
              }
              
              // Remove .md extension if present
              targetPath = targetPath.replace(/\.md$/i, '');
              
              // Convert to slug format - carefully preserving path structure
              const slug = targetPath
                .split('/')
                .map((part: string) => 
                  part.trim()
                    .replace(/\s+/g, '-')
                    .toLowerCase()
                    .replace(/[^a-z0-9-_]/g, '')
                )
                .join('/');
              
              // Determine the full URL based on basePath
              if (slug.startsWith('/')) {
                // Absolute path from site root
                url = slug + section; 
              } else {
                // Relative path - use basePath
                // Ensure basePath doesn't have a trailing slash
                const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
                url = normalizedBasePath ? `${normalizedBasePath}/${slug}${section}` : `/${slug}${section}`;
              }
            }
            
            // Create an anchor tag with the processed URL
            return `<a href="${url}" class="${classes}" data-target="${target}"${attrs}>${alias || target}</a>`;
          }
        );
        
        // Process image embeds ![[image.png]] or ![[image.png|alt text]]
        newHtml = newHtml.replace(
          /!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
          (match, source, altText) => {
            changed = true;
            
            // Normalize the source by trimming whitespace
            source = source.trim();
            const extension = path.extname(source).toLowerCase();
            const isImage = /\.(png|jpg|jpeg|gif|svg|webp|avif)$/i.test(source);
            
            if (isImage) {
              // Format the image path - normalize slashes and handle relative paths
              let imgPath = source;
              
              // Make sure the path starts with the assets directory
              if (!imgPath.startsWith('/')) {
                imgPath = `/content/assets/${imgPath}`;
              } else if (!imgPath.startsWith('/content/assets/')) {
                imgPath = `/content/assets${imgPath}`;
              }
              
              // Create the alt text - use provided alt text or filename without extension
              const alt = altText ? altText.trim() : path.basename(source, extension);
              
              // Build a complete, self-contained img tag to ensure proper rendering
              return `<img src="${imgPath}" alt="${alt}" class="markdown-image" loading="lazy" decoding="async" data-embed="${source}" />`;
            } else {
              // For non-image embeds, create a placeholder
              return `<div class="embed-placeholder" data-source="${source}">${altText || `Embed: ${source}`}</div>`;
            }
          }
        );
        
        // Replace the node with the new HTML if changes were made
        if (changed) {
          const span = document.createElement('span');
          span.innerHTML = newHtml;
          const fragment = document.createDocumentFragment();
          while (span.firstChild) {
            fragment.appendChild(span.firstChild);
          }
          node.parentNode?.replaceChild(fragment, node);
        }
      });
    };
    
    // Run the processing
    processWikiLinks();
  }, [processedHtml, basePath]); // This effect runs after the content is rendered

  return (
    <div ref={contentRef}>
      <MarkdownContent 
        htmlContent={processedHtml} 
        basePath={basePath} 
        assetBasePath="/content/assets" 
      />
    </div>
  );
}
