import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import hljs from 'highlight.js';
import { Article, MapMetadata, TopicMetadata, Doc, TocEntry } from '@/types/content';
import { unified, type Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeStringify from 'rehype-stringify'; // Re-import for final stringification
import { h } from 'hastscript';
import { visit } from 'unist-util-visit';
import { visitParents } from 'unist-util-visit-parents';
import { toString as hastToString } from 'hast-util-to-string';
import type { Root as MdastRoot, Text as MdastText, Code, InlineCode, Html } from 'mdast';
import type { Root as HastRoot, Element as HastElement, Text as HastText, ElementContent } from 'hast';
import type { Node, Parent } from 'unist';
import { toHtml } from 'hast-util-to-html';
import { fromHtml } from 'hast-util-from-html';
import { parseMetadata } from './metadata';
import { VFile } from 'vfile';
import { remarkObsidianCallouts } from './markdown/remark-obsidian-callouts';
import { rehypeObsidianCallouts } from './markdown/rehype-obsidian-callouts';
import rehypeRaw from 'rehype-raw'; // Add import for rehypeRaw

// Cache for map metadata to avoid re-parsing
const mapMetadataMap = new Map<string, MapMetadata>();

// Renamed to baseProcessor: Handles initial parsing only
const baseProcessor = unified()
  .use(remarkParse)       // Parse markdown
  // GFM and Math moved to main processor
;

// Custom Rehype plugin to extract TOC
function rehypeExtractToc() {
  return (tree: HastRoot, file: VFile) => {
    const toc: TocEntry[] = [];
    visit(tree, 'element', (node: HastElement) => {
      // Target heading elements (h1 to h6)
      if (node.tagName && node.tagName.match(/^h[1-6]$/)) {
        const level = parseInt(node.tagName.substring(1), 10);
        const id = node.properties?.id as string;
        
        // Extract text content, excluding the autolink heading anchor
        let text = '';
        if (node.children) {
          // Filter out the anchor link node added by rehype-autolink-headings
          const contentNodes = node.children.filter((child: any) => 
            !(child.type === 'element' && 
              child.tagName === 'a' && 
              child.properties?.className?.includes('heading-link'))
          );
          // Convert the remaining nodes to string
          text = hastToString({ type: 'root', children: contentNodes } as HastRoot).trim();
        }

        // Only add to TOC if we have an ID and non-empty text
        if (id && text) {
          toc.push({ id, text, level });
        }
      }
    });
    // Store the collected TOC data in the vfile
    file.data = file.data || {};
    file.data.toc = toc;
  };
}

// --- HAST-based Footnote Definition Extraction Plugin ---
const visitFootnoteDefinition = (node: HastElement, index: number | undefined, parent: HastRoot | HastElement | undefined, extractedFootnotes: { originalId: string; contentHtml: string; backrefs: string[] }[]) => {
  if (node.tagName === 'div') {
    // Ensure className exists and is an array or string before calling includes
    const className = node.properties?.className;
    const hasFootnotesClass = Array.isArray(className) ? className.includes('footnotes') : String(className).includes('footnotes');

    if (hasFootnotesClass) {
      // Found the footnote container, extract definitions
      visit(node, 'element', (liNode: HastElement) => {
        if (liNode.tagName === 'li' && liNode.properties?.id?.toString().startsWith('fn-')) {
          const originalId = liNode.properties.id.toString().substring(3); // Extract "1" from "fn-1"
          const contentNode = liNode.children?.find(child => child.type === 'element' && child.tagName === 'p') as HastElement | undefined;
          const contentHtml = contentNode ? toHtml(contentNode.children, { allowDangerousHtml: true }) : ''; // Get inner HTML of the first <p>

          // Find back-references (links with data-footnote-backref)
          const backrefs: string[] = [];
          visit(liNode, 'element', (backrefNode: HastElement) => {
            if (backrefNode.tagName === 'a' && backrefNode.properties?.dataFootnoteBackref) {
              const href = backrefNode.properties.href?.toString();
              if (href) backrefs.push(href); // Store the href (e.g., #fnref-1)
            }
          });

          extractedFootnotes.push({ originalId, contentHtml, backrefs });
          // No need to explicitly return visit.SKIP for liNode, default behavior is fine.
        }
      });
      // Remove the original footnote definition section from the tree
      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1);
        // After removing, visiting should stop for this branch anyway.
        // Returning index might be needed if visit allows it to adjust iteration.
        return index; 
      }
    }
  }
};

// The plugin function itself
function rehypeProcessFootnotes(this: Processor) {
  return (tree: HastRoot, file: VFile) => {
    const extractedFootnotes: { originalId: string; contentHtml: string; backrefs: string[] }[] = [];
    visit(tree, 'element', (node, index, parent) => visitFootnoteDefinition(node, index, parent, extractedFootnotes));
    file.data.extractedFootnotes = extractedFootnotes; // Attach data to VFile
  };
};

// --- HAST Visitor for Footnote Reference Renumbering ---
function visitFootnoteReference(
  node: Node,
  index: number | null | undefined, // Accept undefined to match visit callback signature
  parent: Parent | null | undefined, // Accept undefined to match visit callback signature
  footnoteMap: Map<string, number> // Pass map directly
): void {
  if (node.type !== 'element' || (node as HastElement).tagName !== 'sup') return;

  const supElement = node as HastElement;
  const linkChild = supElement.children?.[0] as HastElement | undefined;

  if (
    linkChild?.type !== 'element' ||
    linkChild.tagName !== 'a' ||
    !linkChild.properties?.id?.toString().startsWith('fnref-') ||
    linkChild.properties?.dataFootnoteRef === undefined // Check for the specific attribute
  ) {
    return;
  }

  const refId = linkChild.properties.id.toString(); // e.g., fnref-1, fnref-abc
  const originalNumber = refId.substring(6); // Extract '1' or 'abc'
  const newNumber = footnoteMap.get(originalNumber);

  if (newNumber !== undefined) {
    const newRefId = `fnref-${newNumber}`;
    linkChild.properties.id = newRefId;
    linkChild.properties.href = `#fn-${newNumber}`;
    // Update the visible text content if it exists
    const textChild = linkChild.children?.[0] as HastText | undefined;
    if (textChild?.type === 'text') {
      textChild.value = String(newNumber);
    }
    console.log(`  [Ref] Renumbered ${refId} to ${newRefId}`);
  } else {
    console.warn(`  [Ref] Could not find new number for footnote reference: ${refId}`);
    // Optionally remove the node if the corresponding definition is missing?
    // parent?.children.splice(index!, 1);
    // return visit.SKIP; // Adjust visitor flow if removing node
  }
}

// --- Custom Rehype Plugin for Renumbering Footnote References ---
function rehypeRenumberFootnoteRefsPlugin(options: { footnoteMap: Map<string, number> }) {
  const { footnoteMap } = options;
  if (!footnoteMap || footnoteMap.size === 0) {
    // If no map or empty map, no renumbering needed
    return () => {}; // Return an empty transformer
  }

  return (tree: HastRoot) => {
    console.log('[Plugin] Running rehypeRenumberFootnoteRefsPlugin...');
    visit(tree, 'element', (node, index, parent) =>
      visitFootnoteReference(node, index, parent, footnoteMap)
    );
  };
}

// Define types for the wikilink/embed helper functions
type WikilinkProcessor = (target: string, alias?: string) => HastElement | HastText;
type ImageEmbedProcessor = (source: string, altText?: string) => HastElement | HastText;

// Custom unified plugin to transform wikilinks/embeds in text nodes
// Accepts helper functions as options
function remarkTransformWikilinks(options: {
  // No longer needs processors, generates placeholders directly
}) {
  // Regex to capture source, optional alias, and optional size attribute
  // Example: ![[source.png|alt text|width=100]]
  const embedRegex = /!\[\[([^|\]]+)(?:\|([^|\]]+))?(?:\|([^\]]+))?\]\]/g;
  const wikilinkRegex = /\[\[([^|\]]+)(?:\|([^|\]]+))?\]\]/g; // Simpler regex for non-embeds

  return (tree: MdastRoot) => {
    // console.log("--- Running remarkTransformWikilinks ---");
    // Use visitParents to get access to the ancestor chain
    visitParents(tree, 'text', (node: MdastText, ancestors: Parent[]) => {
      const parent = ancestors[ancestors.length - 1]; // Direct parent is the last ancestor
      if (!parent || !parent.children) return;

      // Find the index of the current text node within its parent
      const index = parent.children.indexOf(node);
      if (index === -1) return; // Should not happen

      const text = node.value;
      let lastIndex = 0;
      const newChildren: (MdastText | Html)[] = []; // Explicitly type as MDAST nodes

      // Simple check for invalid nesting using the ancestors array
      const isInCode = ancestors.some((a: Node) => a.type === 'code' || a.type === 'inlineCode'); // Add type Node

      while (true) {
        // Find the next match (either embed or wikilink)
        embedRegex.lastIndex = lastIndex; // Reset regex state
        wikilinkRegex.lastIndex = lastIndex;
        const embedMatch = embedRegex.exec(text);
        const wikilinkMatch = wikilinkRegex.exec(text);

        let match: RegExpExecArray | null = null;
        let isEmbed = false;

        // Determine which match comes first, or if only one exists
        if (embedMatch && (!wikilinkMatch || embedMatch.index <= wikilinkMatch.index)) {
          match = embedMatch;
          isEmbed = true;
        } else if (wikilinkMatch) {
          match = wikilinkMatch;
          isEmbed = false;
        } else {
          break; // No more matches
        }

        // Extract parts based on whether it's an embed or wikilink
        const fullMatch = match[0];
        let target: string, alias: string | undefined, size: string | undefined;

        if (isEmbed) {
          [, target, alias, size] = match; // Destructure embed match
          // console.log(`Found embed: ${fullMatch}, target: ${target}, alias: ${alias}, size: ${size}`);
        } else {
          [, target, alias] = match; // Destructure wikilink match
          size = undefined;
          // console.log(`Found wikilink: ${fullMatch}, target: ${target}, alias: ${alias}`);
        }

        // Add text before match
        if (match.index > lastIndex) {
          newChildren.push({ type: 'text', value: text.slice(lastIndex, match.index) });
        }

        // Create placeholder span
        let placeholderNode: HastElement;
        if (isEmbed) {
          // Embed Placeholder
          placeholderNode = h('span', {
            'data-type': 'embed',
            'data-source': target.trim(),
            ...(alias && { 'data-alt': alias.trim() }),
            ...(size && { 'data-size': size.trim() }), // Add data-size attribute
          });
        } else {
          // Wikilink Placeholder
          placeholderNode = h('span', {
            'data-type': 'wikilink',
            'data-target': target.trim(),
            ...(alias && { 'data-alias': alias.trim() }),
          });
        }

        // Add the placeholder HTML to the new children
        newChildren.push({
          type: 'html',
          value: toHtml(placeholderNode, { allowDangerousHtml: true })
        } as Html); // Cast to Mdast HTML type

        lastIndex = match.index + fullMatch.length;
      }

      // If no matches were found, return
      if (newChildren.length === 0) { // No changes made
        return;
      }

      // Add any remaining text after the last match
      if (lastIndex < text.length) { // Always add remaining text if any
        newChildren.push({ type: 'text', value: text.slice(lastIndex) });
      }

      // Replace the original text node with the new children using splice
      // The type assertion for newChildren helps satisfy splice, assuming they are valid MDAST types
      if (parent && parent.children && index !== -1) {
        parent.children.splice(index, 1, ...newChildren);
        // Adjust the visitor index to account for the replaced/inserted nodes
        return index + newChildren.length;
      }
    });
  }
}

// Type guard to check if a node is an MDAST Parent
function isParent(node: Node): node is Parent {
  return node && typeof node === 'object' && 'children' in node && Array.isArray(node.children);
}

// Custom Rehype plugin to apply syntax highlighting using highlight.js
// (Restored definition)
function rehypeHighlightCode(options: { hljs: typeof hljs }) {
  const { hljs } = options;
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: HastElement) => {
      if (node.tagName === 'pre' && node.children && node.children.length > 0) {
        const codeNode = node.children[0];
        if (codeNode.type === 'element' && codeNode.tagName === 'code') {
          // Explicitly find and check language class
          let language: string | null = null;
          const className = codeNode.properties?.className;
          if (Array.isArray(className)) {
            const langClass = className.find(cls => {
              // Ensure it's a string before checking
              return typeof cls === 'string' && cls.startsWith('language-');
            });
            if (typeof langClass === 'string') {
              language = langClass.substring(9);
            }
          } else if (typeof className === 'string' && className.startsWith('language-')) {
            language = className.substring(9);
          }

          if (language && hljs.getLanguage(language)) {
            // Raw code content
            const codeText = hastToString(codeNode);
            // Highlighted HTML content
            const highlighted = hljs.highlight(codeText, { language, ignoreIllegals: true }).value;
            // Parse the HTML string back into HAST nodes
            const highlightedRoot = fromHtml(highlighted, { fragment: true });
            // Replace the original code content with highlighted HAST nodes
            codeNode.children = highlightedRoot.children as ElementContent[]; // Cast to expected type
          }
        }
      }
    });
  };
}

// Helper to stringify AST nodes, filtering for brevity
function stringifyNodeForLog(node: any): string {
  return JSON.stringify(node, (key, value) => {
    if (key === 'position') return undefined; // Omit position info
    if (key === 'children' && Array.isArray(value) && value.length > 5) {
      return `[Array(${value.length})]`; // Summarize large children arrays
    }
    return value;
  }, 2);
}

// Helper function to find a document by its custom slug metadata
async function findDocByCustomSlug(targetSlug: string): Promise<string | null> {
  console.log(`[DEBUG] findDocByCustomSlug called with targetSlug: "${targetSlug}"`);
  
  // Early exit for obviously non-custom slugs (containing paths)
  if (targetSlug.includes('/')) {
    console.log(`[DEBUG] Skipping custom slug search since it contains a path: ${targetSlug}`);
    return null;
  }
  
  try {
    const articlesDir = path.join(process.cwd(), 'content/articles');
    console.log(`[DEBUG] Searching for custom slug in articles directory: ${articlesDir}`);
    
    // Helper function to recursively search directories
    async function scanForSlug(dir: string): Promise<string | null> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      console.log(`[DEBUG] Scanning directory: ${dir} - Found ${entries.length} entries`);
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively search subdirectories
          console.log(`[DEBUG] Entering directory: ${entry.name}`);
          const result = await scanForSlug(fullPath);
          if (result) return result;
        } else if ((entry.name.endsWith('.md') || entry.name.endsWith('.mdita'))) {
          // Check if this file has the target slug in its metadata
          try {
            console.log(`[DEBUG] Checking file for custom slug: ${entry.name}`);
            const content = await fs.readFile(fullPath, 'utf8');
            const { data: metadata } = matter(content);
            
            console.log(`[DEBUG] File ${entry.name} has metadata slug: ${metadata?.slug || 'undefined'}`);
            
            if (metadata && metadata.slug === targetSlug) {
              console.log(`[DEBUG] ✅ MATCH FOUND! File ${entry.name} has custom slug: ${targetSlug}`);
              // Return the relative path from the articles directory
              const relativePath = path.relative(articlesDir, fullPath).replace(/\.(md|mdita)$/, '');
              console.log(`[DEBUG] Returning relative path: ${relativePath}`);
              return relativePath;
            }
          } catch (error) {
            console.error(`Error reading metadata from ${fullPath}:`, error);
          }
        }
      }
      
      return null;
    }
    
    const result = await scanForSlug(articlesDir);
    console.log(`[DEBUG] Custom slug search result: ${result || 'null'}`);
    return result;
  } catch (error) {
    console.error('Error searching for custom slug:', error);
    return null;
  }
}

// --- Main Function to Get Document Data ---
export async function getDocData(slugOrPath: string): Promise<Doc | null> {
  // Reset Map Metadata for each document processing
  mapMetadataMap.clear();

  // Handle arrays from catch-all routes
  const normalizedSlug = Array.isArray(slugOrPath) ? slugOrPath.join('/') : slugOrPath;
  
  // First, try to see if this is a custom slug lookup
  // We need to scan the articles directory to find any file with this slug in its metadata
  let usingCustomSlug = false;
  const customSlugMatch = await findDocByCustomSlug(normalizedSlug);
  if (customSlugMatch) {
    console.log(`Found document by custom slug: ${normalizedSlug} -> ${customSlugMatch}`);
    // Use the actual file path instead of the slug for further processing
    slugOrPath = customSlugMatch;
    usingCustomSlug = true;
  }
  
  // Determine which content directory to use based on the slug
  // First, normalize the slug by removing any 'articles/' prefix and handle catch-all routes
  let adjustedSlug = normalizedSlug;
  if (adjustedSlug.startsWith('articles/')) {
    adjustedSlug = adjustedSlug.substring('articles/'.length);
  }
  
  // Determine the content type based on the path structure
  const isArticle = !adjustedSlug.startsWith('docs/') && 
                   (adjustedSlug.includes('/') || 
                    adjustedSlug === 'sample-article' || 
                    adjustedSlug.endsWith('.ditamap') ||
                    ['papers', 'catoblepas', 'collaborative', 'el-catoblepas'].some(dir => 
                      adjustedSlug.startsWith(dir) || adjustedSlug.includes('/' + dir)));
  
  // Setup content directories
  const baseDir = path.join(process.cwd(), 'content');
  const articlesDir = path.join(baseDir, 'articles');
  const docsDir = path.join(baseDir, 'docs');
  
  // Determine the content directory to use
  const contentDir = isArticle ? articlesDir : docsDir;
  
  // Adjust slug for docs prefix if needed
  if (adjustedSlug.startsWith('docs/')) {
    adjustedSlug = adjustedSlug.substring('docs/'.length);
  }
  
  // Remove extension if present
  adjustedSlug = adjustedSlug.replace(/\.(md|mdita|ditamap)$/, '');
  
  // Build potential file paths
  let mdPath, mditaPath, ditamapPath;
  
  if (usingCustomSlug) {
    // If we found a custom slug match, use the exact file path directly
    mdPath = path.join(articlesDir, `${slugOrPath}.md`);
    mditaPath = path.join(articlesDir, `${slugOrPath}.mdita`);
    ditamapPath = path.join(articlesDir, `${slugOrPath}.ditamap`);
  } else {
    // Otherwise use the standard paths
    mdPath = path.join(contentDir, `${adjustedSlug}.md`);
    mditaPath = path.join(contentDir, `${adjustedSlug}.mdita`);
    ditamapPath = path.join(contentDir, `${adjustedSlug}.ditamap`);
  }

  // Debug logging
  console.log(`Attempting to load: ${mdPath}`);
  
  let filePath: string | null = null;
  let fileContents: string | null = null;

  // Try loading file with different extensions
  try {
    // Try .md first
    fileContents = await fs.readFile(mdPath, 'utf8');
    filePath = mdPath;
    console.log(`Successfully loaded: ${mdPath}`);
  } catch (mdError) {
    try {
      // Try .mdita next
      fileContents = await fs.readFile(mditaPath, 'utf8');
      filePath = mditaPath;
      console.log(`Successfully loaded: ${mditaPath}`);
    } catch (mditaError) {
      try {
        // Finally try .ditamap
        fileContents = await fs.readFile(ditamapPath, 'utf8');
        filePath = ditamapPath;
        console.log(`Successfully loaded: ${ditamapPath}`);
      } catch (ditamapError) {
        console.error(`File not found for slug "${adjustedSlug}" - tried: .md, .mdita, .ditamap`);
        return null; // Not found
      }
    }
  }

  if (!fileContents || !filePath) {
    return null; // Should not happen if try succeeded
  }

  const fileContentString = String(fileContents);
  const { data: metadata, content: markdown } = matter(fileContentString);

  // If publish is explicitly set to false, return null
  if (metadata.publish === false) {
    console.log('Doc not published:', adjustedSlug);
    return null;
  }

  // --- Calculate Base Path Early ---
  const basePath = adjustedSlug.includes('/') ? `/docs/${adjustedSlug.split('/').slice(0, -1).join('/')}` : '/docs';

  // --- HAST Processing Helper Functions (Wikilinks and Embeds) ---
  
  // Function to process a wikilink into an HAST <a> element
  const processWikilinkToHast = (target: string, alias?: string): HastElement | HastText => {
    if (!target) return { type: 'text', value: '' };

    target = target.trim();
    alias = alias ? alias.trim() : '';
    const displayText = alias || target;

    let url = '';
    let section = '';
    const properties: Record<string, any> = {};

    if (target.includes('#')) {
      const [base, hash] = target.split('#');
      target = base;
      section = `#${hash}`;
      properties['data-section'] = hash;
    }

    if (target.startsWith('http')) {
      // External Link
      url = target;
      properties.href = url;
      properties.className = 'external-link';
      properties.target = '_blank';
      properties.rel = 'noopener noreferrer';
    } else {
      // Internal Link
      properties.className = 'wiki-link';
      properties['data-target'] = target; // Store original target

      let targetPath = target.replace(/\.md$/i, '');
      const slugifiedPath = targetPath
        .split('/')
        .map((part: string) =>
          part.trim()
            .replace(/\s+/g, '-')
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, '')
        )
        .join('/');

      if (slugifiedPath.startsWith('/')) {
        url = slugifiedPath + section;
      } else {
        // Resolve relative to the current doc's directory
        url = path.posix.join(basePath, slugifiedPath) + section;
      }
      properties.href = url;
    }

    return h('a', properties, displayText);
  };

  // Function to process an image embed into an HAST <img> element
  const processImageEmbedToHast = (source: string, altText?: string): HastElement | HastText => {
    if (!source) return { type: 'text', value: '' };

    source = source.trim();
    const extension = path.extname(source);
    const isImage = /\.(png|jpg|jpeg|gif|svg|webp|avif)$/i.test(source);

    if (isImage) {
      let imgPath = source;
      // Path Logic:
      // 1. Remove leading slash if present to normalize.
      imgPath = imgPath.startsWith('/') ? imgPath.substring(1) : imgPath;
      // 2. Assume relative paths are relative to the MD file's directory
      // (This needs refinement based on actual asset location - are they all in /content/assets?)
      // For now, assume they *should* be in /content/assets and prefix if not already there.
      if (!imgPath.startsWith('content/assets/') && !imgPath.startsWith('http')) {
        // If it doesn't look like an absolute URL or a path already inside content/assets,
        // prepend the expected asset path.
        imgPath = path.posix.join('/content/assets', imgPath);
      } else if (imgPath.startsWith('content/assets/')) {
        // Ensure it starts with a single leading slash for the web URL
        imgPath = `/${imgPath}`;
      }
      // Else: it's likely an external http URL, leave it as is.

      const alt = altText ? altText.trim() : '';
      return h('img', {
        src: imgPath, // Use the constructed path
        alt: alt,
        className: 'markdown-image',
        loading: 'lazy',
        decoding: 'async',
        'data-embed': source, // Store original source
      });
    } else {
      // Handle non-image embeds as placeholders or render as text
      console.warn(`Attempted to embed non-image file: ${source}`);
      return { type: 'text', value: `[[${source}${altText ? '|' + altText : ''}]]` };
    }
  };

  // --- Unified Processing Pipeline (Refactored) ---
  // 1. Parse Markdown -> MDAST
  const file = new VFile({ value: markdown, path: filePath }); // Create VFile
  const mdast = baseProcessor.parse(file);

  // console.log('\n--- DEBUG LOG 1: Initial MDAST ---');
  // visit(mdast, (node) => {
  //   if (node.type === 'code' || node.type === 'inlineCode') {
  //     console.log(stringifyNodeForLog(node));
  //   }
  // });
  // console.log('--- END DEBUG LOG 1 ---');

  // 2. Process MDAST (Apply wikilink transforms)
  const mdastProcessor = unified()
    .use(remarkTransformWikilinks, { // Must run before remarkRehype
      // No longer needs processors, generates placeholders directly
    });
  const processedMdast = await mdastProcessor.run(mdast, file) as MdastRoot;

  // console.log('\n--- DEBUG LOG 2: MDAST after remarkTransformWikilinks ---');
  // visit(processedMdast, (node) => {
  //   if (node.type === 'code' || node.type === 'inlineCode') {
  //     console.log(stringifyNodeForLog(node));
  //   }
  // });
  // console.log('--- END DEBUG LOG 2 ---');

  // console.log('\n--- DEBUG LOG 3: Final MDAST before HAST conversion ---');
  // visit(processedMdast, (node) => {
  //   if (node.type === 'code' || node.type === 'inlineCode') {
  //     console.log(stringifyNodeForLog(node));
  //   }
  // });
  // console.log('--- END DEBUG LOG 3 ---');

  // 3. Convert MDAST -> HAST (Explicit conversion step)
  // Note: remarkRehype itself is a transformer, not just a plugin for .use()
  // We need to import it directly if using it this way.
  // Let's revert to using it in a processor chain as the standalone usage seems less common/documented.
  // 2b. Create processor for MDAST -> HAST + HAST Plugins
  const hastProcessor = unified()
    // Apply GFM and Math after our wikilink transforms were already applied
    .use(remarkGfm)                       // Support GFM (tables, strikethrough, etc.)
    .use(remarkObsidianCallouts)          // Add callout support
    .use(remarkMath)                      // Support math syntax
    .use(remarkRehype, { // Convert to HAST, allowing generated elements through
      allowDangerousHtml: true,
      // passThrough: ['element'] // Removed due to type issues and potentially unneeded now
    } as any) // <<< Cast options to 'any' as a workaround for persistent type error
    .use(rehypeObsidianCallouts)         // Transform callouts BEFORE rehypeRaw
    .use(rehypeRaw)                      // IMPORTANT: Process raw HTML potentially added by remark plugins or in source
    .use(rehypeSlug)                     // Add IDs to headings
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      content: h('span.heading-link', '#') // Use hastscript for content
    })
    .use(rehypeExtractToc)               // Custom plugin to extract TOC
    .use(rehypeHighlightCode, { hljs })  // Apply syntax highlighting BEFORE footnote processing
    .use(rehypeProcessFootnotes);        // Custom plugin to EXTRACT footnote definitions

  // Run processor: MDAST Parse -> MDAST Transform -> HAST Convert -> HAST Transform
  let hastTree = await hastProcessor.run(processedMdast, file) as HastRoot; // Start with processed MDAST

  // console.log('\n--- DEBUG LOG 4: Initial HAST ---');
  // visit(hastTree, 'element', (node: HastElement) => {
  //   // Corrected check for className array and ensure element is string
  //   if (node.tagName === 'code' && Array.isArray(node.properties?.className) && typeof node.properties.className[0] === 'string' && node.properties.className[0].startsWith('language-')) {
  //     // Log fenced code blocks
  //     console.log(stringifyNodeForLog(node));
  //   } else if (node.tagName === 'code' && !node.properties?.className) {
  //     // Log inline code blocks (heuristic: no class)
  //     console.log(stringifyNodeForLog(node));
  //   }
  // });
  // console.log('--- END DEBUG LOG 4 ---');

  // Apply highlighting separately to log its effect
  const highlightProcessor = unified().use(rehypeHighlightCode, { hljs });
  hastTree = await highlightProcessor.run(hastTree, file) as HastRoot;

  // console.log('\n--- DEBUG LOG 5: HAST after rehypeHighlightCode ---');
  // visit(hastTree, 'element', (node: HastElement) => {
  //   if (node.tagName === 'code') { // Log all code elements after highlighting
  //     console.log(stringifyNodeForLog(node));
  //   }
  // });
  // console.log('--- END DEBUG LOG 5 ---');

  let toc = (file.data.toc || []) as TocEntry[];
  const extractedFootnotes = (file.data.extractedFootnotes || []) as { originalId: string; contentHtml: string; backrefs: string[] }[];

  // --- Footnote Processing (Renumbering and Appending) ---
  let html = ''; // Define html variable
  const footnoteMap = file.data.footnoteMap as Map<string, number> || new Map();

  // Create the final processor pipeline (includes renumbering and stringifying)
  const finalProcessor = unified()
    .use(rehypeRenumberFootnoteRefsPlugin, { footnoteMap }) // Pass the map, plugin handles empty map
    .use(rehypeStringify, { allowDangerousHtml: true });

  // Stringify the HAST tree (renumbering happens via the plugin)
  html = finalProcessor.stringify(hastTree);

  // Build the footnote HTML section string separately if definitions exist
  const footnoteDefs = file.data.footnoteDefs as HastRoot | undefined;
  if (footnoteDefs) { // Check if footnote definitions were extracted and are valid
    const footnoteListItems: string[] = [];
    visit(footnoteDefs, 'element', (node: HastElement) => {
      if (node.tagName === 'li' && node.properties?.id?.toString().startsWith('fn-')) {
        const originalId = node.properties.id.toString();
        const originalNumber = originalId.substring(3); // 'fn-' prefix
        const newNumber = footnoteMap.get(originalNumber);

        if (newNumber !== undefined) { // Check if this footnote is actually referenced
          // Create a temporary processor to stringify just this node
          const itemProcessor = unified()
            .use(rehypeRenumberFootnoteRefsPlugin, { footnoteMap: new Map([[originalNumber, newNumber]]) }) // Map only this ref
            .use(rehypeStringify, {allowDangerousHtml: true});

          // Modify properties for the new number *before* stringifying
          node.properties.id = `fn-${newNumber}`;
          visit(node, 'element', (linkNode: HastElement) => {
            if (linkNode.tagName === 'a' && linkNode.properties?.href === `#fnref-${originalNumber}`) {
              linkNode.properties.href = `#fnref-${newNumber}`;
            }
          });

          footnoteListItems.push(toHtml(node)); // Use hast-util-to-html for direct stringification
        } else {
          console.warn(`Footnote definition '${originalId}' found but not referenced in content.`);
        }
      }
    });

    // Sort the footnotes based on the new number before joining
    footnoteListItems.sort((a, b) => {
      const numA = parseInt(a.match(/id="fn-(\d+)"/)?.[1] || '0');
      const numB = parseInt(b.match(/id="fn-(\d+)"/)?.[1] || '0');
      return numA - numB;
    });

    // Append the generated footnote section to the main HTML string
    html += `\n\n<section data-footnotes class="footnotes mt-12 pt-8 border-t border-border">\n<h2 class="sr-only" id="footnotes-section-label">Footnotes</h2>\n<ol>\n${footnoteListItems.join('\n')}\n</ol>\n</section>`;
  } else {
    // console.warn("Footnotes referenced, but no definition section (footnotesHast) found.");
  }

  // console.log('\n--- DEBUG LOG 6: Final HAST Tree ---');
  // console.log(stringifyNodeForLog(hastTree));
  // console.log('--- END DEBUG LOG 6 ---');

  // Special handling for ditamaps - process and combine topic files
  if (filePath && filePath.endsWith('.ditamap')) {
    try {
      console.log(`Processing ditamap file: ${filePath}`);
      const ditamapContent = fileContents || '';
      const hrefMatches = ditamapContent.match(/href=['"]([^'"]+)['"]\s+format=['"](markdown|md)['"]|href=['"](.*?\.md)['"]|href=['"](.*?\.mdita)['"]|href=['"](.*?\.dita)['"]|href=['"](.*?)['"]\s+format=['"](markdown|md)['"]|href=['"](.*?)['"]\s+format=['"](markdown|md)['"]\s+/g);
      
      if (hrefMatches) {
        // Extract all topic references
        const topicContents: {content: string, toc: TocEntry[]}[] = [];
        const dirName = path.dirname(filePath);
        
        for (const match of hrefMatches) {
          // Extract the href value
          const hrefMatch = match.match(/href=['"]([^'"]+)['"]/); 
          if (hrefMatch && hrefMatch[1]) {
            let topicPath = hrefMatch[1];
            
            // Compute full path to the topic file relative to the ditamap
            const topicFullPath = path.resolve(dirName, topicPath);
            
            console.log(`Loading topic from ditamap: ${topicFullPath}`);
            
            try {
              // Try to load the topic directly
              const topicContent = await fs.readFile(topicFullPath, 'utf8');
              const { content: parsedContent, data: topicMetadata } = matter(topicContent);
              
              // Process the topic content
              // Reuse the main document processing logic with a simplified interface
              const tempDoc = await processMarkdownToHtml(parsedContent, path.dirname(topicFullPath), topicMetadata);
              if (tempDoc) {
                topicContents.push({
                  content: tempDoc.content,
                  toc: tempDoc.toc || []
                });
              }
            } catch (topicError) {
              console.error(`Error loading topic from ditamap: ${topicFullPath}`, topicError);
            }
          }
        }
        
        // Combine all topic contents into a single HTML document
        if (topicContents.length > 0) {
          // Merge all contents and TOCs
          let combinedContent = '';
          let combinedToc: TocEntry[] = [];
          let tocOffset = 0;
          
          topicContents.forEach((topic, index) => {
            // Add a separator between topics
            if (index > 0) {
              combinedContent += '\n<hr class="topic-separator" />\n';
            }
            
            // Add the topic content
            combinedContent += topic.content;
            
            // Offset TOC entries and add to combined TOC
            const adjustedToc = topic.toc.map(entry => ({
              ...entry,
              id: `topic-${index}-${entry.id}` // Make IDs unique across topics
            }));
            
            combinedToc = [...combinedToc, ...adjustedToc];
          });
          
          // Update the html variable to contain all merged content
          html = combinedContent;
          toc = combinedToc;
        }
      }
    } catch (ditamapError) {
      console.error(`Error processing ditamap file: ${filePath}`, ditamapError);
    }
  }
  
  // Helper function to process individual topic markdown to HTML
  // This is used when processing ditamap topics
  async function processMarkdownToHtml(markdownContent: string, baseDirPath: string, metadata: any): Promise<{ content: string, toc: TocEntry[] } | null> {
    try {
      // Create temporary VFile
      const file = new VFile({ value: markdownContent });
      
      // Parse the markdown to MDAST
      const mdast = baseProcessor.parse(file);
      
      // Use a simplified pipeline for processing topics
      const hastResult = await unified()
        .use(remarkGfm)
        .use(remarkMath)
        .use(remarkTransformWikilinks, {})
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeSlug)
        .use(rehypeAutolinkHeadings, {
          behavior: 'append',
          properties: { className: ['heading-link'] },
          content: h('span', { className: ['heading-link-icon'], 'aria-hidden': 'true' }, '#')
        })
        .use(rehypeExtractToc)
        // .use(rehypeRawHTML) - removed as it's not defined
        .use(rehypeHighlightCode, { hljs })
        .use(rehypeProcessFootnotes)
        .use(rehypeStringify, { allowDangerousHtml: true })
        .run(mdast);
      
      // Get the HTML string and TOC
      const topicHtml = String(hastResult);
      const topicToc = (file.data?.toc || []) as TocEntry[];
      
      return {
        content: topicHtml,
        toc: topicToc
      };
    } catch (error) {
      console.error('Error processing topic markdown:', error);
      return null;
    }
  }
  
  // Return the final Doc object
  return {
    slug: adjustedSlug, // Use the adjusted slug
    content: html, // Return the final HTML string
    metadata: metadata as TopicMetadata, // Assuming doc uses TopicMetadata structure
    toc,
  };
}