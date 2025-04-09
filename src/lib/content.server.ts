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
import remarkObsidianCallouts from './markdown/remark-obsidian-callouts';
import { rehypeObsidianCallouts } from './markdown/rehype-obsidian-callouts';
import rehypeRaw from 'rehype-raw'; // Add import for rehypeRaw
import { glob } from 'glob'; // Add glob import

// Cache for map metadata to avoid re-parsing
const mapMetadataMap = new Map<string, MapMetadata>();

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
    let hasFootnotesClass = false;
    if (Array.isArray(className)) {
      hasFootnotesClass = className.includes('footnotes');
    } else if (typeof className === 'string') {
      hasFootnotesClass = className.includes('footnotes');
    }

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
type WikilinkProcessor = (
  target: string,
  alias?: string,
  resolvedSlug?: string | null // Add optional resolvedSlug
) => HastElement | HastText;
type ImageEmbedProcessor = (
  source: string,
  alias?: string,
  size?: string
) => HastElement | HastText;

// Type definition for the wikilink resolver function
type WikilinkResolver = (target: string) => Promise<string | null>;

// Custom unified plugin to transform wikilinks/embeds in text nodes
// Accepts helper functions as options
function remarkTransformWikilinks(options: {
  processWikilink: WikilinkProcessor;
  processEmbed: ImageEmbedProcessor;
  resolveWikilink: WikilinkResolver; // Add resolver option
}) {
  const { processWikilink, processEmbed, resolveWikilink } = options;
  // Regex to capture source, optional alias, and optional size attribute
  // Example: ![[source.png|alt text|width=100]]
  const embedRegex = /!\[\[([^|\]]+)(?:\|([^|\]]+))?(?:\|([^\]]+))?\]\]/g;
  const wikilinkRegex = /\[\[([^|\]]+)(?:\|([^|\]]+))?\]\]/g; // Simpler regex for non-embeds

  return async (tree: MdastRoot, file: VFile): Promise<void> => {
    // --- Step 1: Build Parent Map --- 
    const parentMap = new Map<Node, Parent>();
    visit(tree, (node: Node) => {
      if ('children' in node) {
        (node as Parent).children.forEach(child => {
          parentMap.set(child, node as Parent);
        });
      }
    });

    // --- Step 2: Visit and Transform Text Nodes --- 
    const transformations: Promise<void>[] = []; // Collect promises for async operations
    visit(tree, 'text', (node: MdastText, index: number | undefined, parent: Parent | undefined) => {
      if (!node.value || !parent || index === undefined) return;

      const processNode = async () => {
        let currentText = node.value;
        const newChildren: (MdastText | Html)[] = [];
        let lastIndex = 0;

        // --- Process Image Embeds --- 
        const embedMatches = [...currentText.matchAll(embedRegex)];
        embedMatches.forEach((match) => {
          const startIndex = match.index!;
          const endIndex = startIndex + match[0].length;
          const source = match[1]?.trim();
          const alias = match[2]?.trim();
          const size = match[3]?.trim(); // Capture size

          if (startIndex > lastIndex) {
            newChildren.push({ type: 'text', value: currentText.slice(lastIndex, startIndex) });
          }

          const embedHast = processEmbed(source, alias, size); // Pass size
          if (embedHast) {
            const htmlValue = toHtml(embedHast, { allowDangerousHtml: true });
            newChildren.push({ type: 'html', value: htmlValue });
          }
          lastIndex = endIndex;
        });
        currentText = currentText.slice(lastIndex); // Remaining text after embeds
        // < -------------------------

        // --- Process Wikilinks --- 
        let wikilinkLastIndex = 0;
        const wikilinkMatches = [...currentText.matchAll(wikilinkRegex)];

        for (const match of wikilinkMatches) { // Use for...of for async loop
          const startIndex = match.index!;
          const endIndex = startIndex + match[0].length;
          const target = match[1]?.trim();
          const alias = match[2]?.trim();

          if (startIndex > wikilinkLastIndex) {
            newChildren.push({ type: 'text', value: currentText.slice(wikilinkLastIndex, startIndex) });
          }

          let resolvedSlug: string | null = null;
          if (target && !target.startsWith('http')) {
            try {
              resolvedSlug = await resolveWikilink(target);
            } catch (error) {
              console.error(`Error resolving wikilink target '${target}':`, error);
            }
          }

          const linkHast = processWikilink(target, alias, resolvedSlug); // Pass resolvedSlug
          if (linkHast) {
            const htmlValue = toHtml(linkHast, { allowDangerousHtml: true });
            newChildren.push({ type: 'html', value: htmlValue });
          }

          wikilinkLastIndex = endIndex;
        }

        // Add any remaining text after the last wikilink
        if (wikilinkLastIndex < currentText.length) {
            newChildren.push({ type: 'text', value: currentText.slice(wikilinkLastIndex) });
        }
        // < ----------------------

        // --- Replace Node --- 
        if (newChildren.length > 0) {
          // Check if the overall content actually changed
          const originalValue = node.value;
          const newValue = newChildren.map(child => child.type === 'html' ? child.value : (child as MdastText).value).join('');
          
          // Only replace if content genuinely changed to avoid infinite loops/unnecessary work
          if (newValue !== originalValue) { 
            parent.children.splice(index, 1, ...newChildren);
            // Note: This modification might affect subsequent visits in the same pass.
            // 'unist-util-visit-parents' might offer more robust modification patterns,
            // but this should work for non-overlapping matches within a single text node.
          }
        } else {
           // This case should ideally not happen if regex matched, but good to handle.
           console.warn('Wikilink/Embed processing resulted in no children for node:', node.value);
        }
      };

      transformations.push(processNode());
    });

    // --- Step 3: Wait for all async transformations --- 
    await Promise.all(transformations);
    // Transformer doesn't need to return the tree explicitly unless modifying it directly
    // The modifications happen in-place via parent.children.splice.
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
  
  // --- HAST Processing Helper Functions (Wikilinks and Embeds) ---
  
  // Caching mechanism for resolved wikilink slugs to avoid redundant searches
  const wikilinkSlugCache = new Map<string, string | null>();

  // Helper to find the correct slug for a given wikilink target filename/path
  const resolveWikilinkSlug: WikilinkResolver = async (target) => {
    const normalizedTarget = target.replace(/\.md$/i, '').toLowerCase();
    const cacheKey = normalizedTarget;

    if (wikilinkSlugCache.has(cacheKey)) {
      return wikilinkSlugCache.get(cacheKey)!;
    }

    if (normalizedTarget.includes('/')) {
      // If it's already a path, assume it's correct relative to docs root
      // TODO: Could still validate this path exists?
      wikilinkSlugCache.set(cacheKey, normalizedTarget);
      return normalizedTarget;
    }

    // Search within content/docs for the filename
    const docsDir = path.join(process.cwd(), 'content', 'docs');
    const searchPattern = path.join(docsDir, '**', `${normalizedTarget}.md`).replace(/\//g, '/'); // Ensure forward slashes for glob

    try {
      const matchingFiles = await glob(searchPattern, { nodir: true, nocase: true }); // Corrected option

      if (matchingFiles.length > 0) {
        // Take the first match (potential ambiguity if multiple files have the same name)
        const fullPath = matchingFiles[0];
        const relativePath = path.relative(docsDir, fullPath);
        const slug = relativePath.replace(/\.md$/i, '').replace(/\//g, '/'); // Ensure forward slashes
        wikilinkSlugCache.set(cacheKey, slug);
        return slug;
      }
    } catch (err) {
      console.error(`Error searching for wikilink target '${target}' with pattern '${searchPattern}':`, err);
    }

    console.warn(`Wikilink target '${target}' could not be resolved to a slug.`);
    wikilinkSlugCache.set(cacheKey, null); // Cache null to avoid re-searching
    return null;
  };

  // Function to process a wikilink into an HAST <a> element
  const processWikilinkToHast = (
    target: string,
    alias?: string,
    resolvedSlug?: string | null // Accept resolvedSlug
  ): HastElement | HastText => {
    if (!target) return { type: 'text', value: '' };

    target = target.trim();
    alias = alias ? alias.trim() : '';
    const displayText = alias || target;

    let url = '';
    let section = '';
    const properties: Record<string, any> = {};

    // Handle section links (#)
    if (target.includes('#')) {
      const [base, hash] = target.split('#');
      target = base; // Target becomes the base part for resolution
      section = `#${hash}`;
      properties['data-section'] = hash;
    }

    if (target.startsWith('http')) {
      // External Link
      url = target + section; // Append section if present
      properties.href = url;
      properties.className = 'external-link';
      properties.target = '_blank';
      properties.rel = 'noopener noreferrer';
    } else {
      // Internal Link
      properties.className = 'wiki-link';
      properties['data-target'] = target; // Store original target

      if (resolvedSlug) {
        // Use the resolved slug if found
        url = `/docs/${resolvedSlug}${section}`;
      } else {
        // Fallback if not resolved (e.g., render differently or link to search?)
        // For now, link to a non-existent path based on original target to indicate failure
        console.warn(`Using fallback URL for unresolved wikilink: ${target}`);
        const slugifiedTarget = target.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-_]/g, '');
        url = `/docs/unresolved/${slugifiedTarget}${section}`;
        properties.className += ' unresolved-link'; // Add class to style differently
      }
      properties.href = url;
    }

    return h('a', properties, displayText);
  };

  // Function to process an image embed into an HAST <img> element
  const processImageEmbedToHast = (
    source: string,
    alias?: string,
    size?: string
  ): HastElement | HastText => {
    if (!source) return { type: 'text', value: '' };

    source = source.trim();
    alias = alias ? alias.trim() : '';
    const altText = alias || source.split('/').pop()?.split('.')[0] || 'Embedded image'; // Basic alt text

    // Assets are copied to /public/content/assets/
    const sourceFileName = source.split('/').pop(); // Get only the filename
    const imageUrl = sourceFileName ? `/content/assets/${sourceFileName}` : '/content/assets/placeholder.png'; // Correct path to match copy script

    const properties: Record<string, any> = {
      src: imageUrl,
      alt: altText,
      class: 'markdown-image', // Add a class for styling
      loading: 'lazy',
      decoding: 'async',
      'data-embed': source, // Store original source
    };

    // Basic size handling (e.g., |100 or |100x50)
    if (size) {
      size = size.trim();
      if (size.includes('x')) {
        const [width, height] = size.split('x');
        if (width) properties.width = parseInt(width, 10);
        if (height) properties.height = parseInt(height, 10);
      } else {
        const width = parseInt(size, 10);
        if (!isNaN(width)) {
          properties.width = width;
        }
      }
      properties['data-size'] = size; // Store original size attribute
    }

    return h('img', properties);
  };

  // --- Unified Processor Definition ---
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    // Add Obsidian callouts processing before math to avoid syntax conflicts
    .use(remarkObsidianCallouts)
    // Add math processing after callouts are handled
    .use(remarkMath)
    // Custom plugin MUST run before remarkRehype
    .use(remarkTransformWikilinks, {
      processWikilink: processWikilinkToHast,
      processEmbed: processImageEmbedToHast,
      resolveWikilink: resolveWikilinkSlug, // Pass the resolver
    })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw) // Process raw HTML inserted by our plugin
    // Add other rehype plugins AFTER raw HTML and callouts are processed
    .use(rehypeHighlightCode, { hljs })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { 
      behavior: 'prepend',
      properties: {
        className: ['pilcrow-link'], 
        'aria-hidden': 'true',
        tabIndex: -1,
        'data-heading-link': true, 
      },
      content: [] // EXPLICITLY set empty content
    })
    .use(rehypeExtractToc)
    .use(rehypeProcessFootnotes)
    .use(rehypeRenumberFootnoteRefsPlugin, { footnoteMap: new Map() })
    .use(rehypeStringify);

  // --- File Loading Logic --- 
  let filePath: string | null = null;
  let fileContents: string | null = null;

  const docsDir = path.join(process.cwd(), 'content', 'docs');
  const articlesDir = path.join(process.cwd(), 'content', 'articles');
  const extensionsToTry = ['.md', '.mdita', '.ditamap']; // Prioritize .md

  // Determine the base path for relative link resolution *before* finding the file
  // This assumes the slug structure mirrors the directory structure under docs/
  const slugParts = slugOrPath.split('/');
  slugParts.pop(); // Remove filename part
  const basePath = path.posix.join('/docs', ...slugParts); // Base URL path for relative links

  // Check if a custom slug maps to this path
  const customSlugMatch = await findDocByCustomSlug(slugOrPath);
  const adjustedSlug = customSlugMatch || slugOrPath;
  const usingCustomSlug = !!customSlugMatch;

  if (usingCustomSlug) {
    // If custom slug, it points directly to a file (likely in articles)
    // We need the full path to read it, even if the slug is custom.
    const potentialPathBase = path.join(articlesDir, adjustedSlug); // Assume custom slugs are for articles
    for (const ext of extensionsToTry) {
      const potentialPath = potentialPathBase + ext;
      try {
        fileContents = await fs.readFile(potentialPath, 'utf8');
        filePath = potentialPath;
        console.log(`Successfully loaded custom slug match: ${filePath}`);
        break; 
      } catch (e: any) {
        if (e.code !== 'ENOENT') console.error(`Error reading ${potentialPath}:`, e);
      }
    }
    if (!filePath) {
       console.error(`Custom slug match file not found for slug "${slugOrPath}" -> "${adjustedSlug}"`);
       return null;
    }
  } else {
    // Try loading from docsDir first, then articlesDir
    const dirsToTry = [docsDir, articlesDir];
    console.log(`Attempting to load slug "${adjustedSlug}" from docs/ then articles/`);
    
    outerLoop: // Label for breaking out of nested loops
    for (const dir of dirsToTry) {
      for (const ext of extensionsToTry) {
        const potentialPath = path.join(dir, `${adjustedSlug}${ext}`);
        try {
          fileContents = await fs.readFile(potentialPath, 'utf8');
          filePath = potentialPath;
          console.log(`Successfully loaded: ${filePath}`);
          break outerLoop; // File found, exit both loops
        } catch (error: any) {
          if (error.code !== 'ENOENT') { // Log errors other than 'file not found'
            console.error(`Error reading ${potentialPath}:`, error);
          }
          // Continue to next extension or directory
        }
      }
    }

    // Check if file was found after trying all options
    if (!filePath || !fileContents) {
      console.error(`File not found for slug "${adjustedSlug}" in docs/ or articles/ - tried extensions: ${extensionsToTry.join(', ')}`);
      return null; // Not found
    }
  }

  const markdownContentString = String(fileContents);
  const { data: metadata, content: markdown } = matter(markdownContentString);

  // If publish is explicitly set to false, return null
  if (metadata.publish === false) {
    console.log('Doc not published:', adjustedSlug);
    return null;
  }

  // Create VFile with the markdown content and path
  const file = new VFile({ value: markdown, path: filePath });

  console.log(`[getDocData] About to call processor.process() for file: ${file.path}`);
  const processedResult = await processor.process(file); // Use the single processor
  console.log('--- Processed HTML Start ---');
  console.log(processedResult.value);
  console.log('--- Processed HTML End ---');

  const contentHtml = String(processedResult); // Get the final HTML string

  // Extract Footnotes after processing
  const extractedFootnotes = (file.data.extractedFootnotes as any[]) || [];

  // Generate Table of Contents from HAST tree
  const toc = (file.data.toc || []) as TocEntry[];

  // Return the final Doc object
  return {
    slug: adjustedSlug, // Use the adjusted slug
    content: contentHtml, // Return the final HTML string
    metadata: metadata as TopicMetadata, // Assuming doc uses TopicMetadata structure
    toc,
    footnotes: extractedFootnotes // Add footnotes here
  };
 }

// --- Custom Rehype Plugins (Defined at top level) ---
// Custom Rehype plugin to apply syntax highlighting using highlight.js
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
            try {
              const highlighted = hljs.highlight(codeText, { language, ignoreIllegals: true }).value;
              // Parse the HTML string back into HAST nodes
              const highlightedRoot = fromHtml(highlighted, { fragment: true });
              // Replace the original code content with highlighted HAST nodes
              codeNode.children = highlightedRoot.children as ElementContent[]; // Cast to expected type
            } catch (error) {
              console.error(`Error highlighting code block (lang: ${language}):`, error);
              // Keep original code content if highlighting fails
            }
          } else if (language) {
             console.warn(`highlight.js does not support language: ${language}`);
          }
        }
      }
    });
  };
}