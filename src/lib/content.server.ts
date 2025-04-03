import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import hljs from 'highlight.js';
import { Article, MapMetadata, TopicMetadata, Doc, TocEntry } from '@/types/content';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeMathjax from 'rehype-mathjax/svg';
import rehypeStringify from 'rehype-stringify';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { h } from 'hastscript';
import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';
import { toHtml } from 'hast-util-to-html';
import { parseMetadata } from './metadata';
import type { Root } from 'hast';
import { VFile } from 'vfile';

// Create the unified processor instance (Restored)
// NOTE: This is now the BASE processor, plugins like footnote processing/stringifying are added manually.
const baseProcessor = unified()
  .use(remarkParse)       // Parse markdown
  .use(remarkGfm)         // Support GFM (includes standard footnotes)
  .use(remarkMath)        // Support math blocks 
  .use(remarkRehype, { 
    allowDangerousHtml: true
  }) // Convert to rehype
  .use(rehypeMathjax, { // Render math content 
    svg: {
      displayAlign: 'center' 
    }
  })
  .use(fixMathDisplayAttribute) // Fix math display block attribute
  .use(rehypeSlug)        // Add IDs to headings
  .use(rehypeAutolinkHeadings, {
    behavior: 'append',
    properties: {
      className: ['anchor', 'heading-link'],
      'aria-hidden': 'true',
      tabIndex: -1,
    },
    content: h('span', { className: 'heading-link-icon' }, '¶')
  })
  .use(rehypeExtractToc); // Extract TOC data
  // NOTE: rehypeProcessFootnotes (extract) and rehypeRenumberFootnoteRefs (renumber)
  // will be run manually in getArticleData using .use() on a cloned processor.
  // rehypeStringify will also be run manually after renumbering.

// Custom Rehype plugin to extract TOC
function rehypeExtractToc() {
  return (tree: any, file: any) => {
    const toc: TocEntry[] = [];
    visit(tree, 'element', (node) => {
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
          text = toString({ type: 'root', children: contentNodes }).trim();
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

// *** RESTORING Rehype plugin to fix display attribute ***
function fixMathDisplayAttribute() {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      // Look for paragraph elements
      if (node.tagName === 'p') {
        if (!node.children || node.children.length === 0) return;

        let mjxContainerNode = null;
        let onlyContainerAndWhitespace = true;

        // Check if paragraph contains ONLY an mjx-container and possibly whitespace/comments
        for (const child of node.children) {
          if (child.type === 'element' && child.tagName === 'mjx-container') {
            if (mjxContainerNode) { // Found more than one container
              onlyContainerAndWhitespace = false;
              break;
            }
            mjxContainerNode = child;
          } else if (child.type === 'text' && child.value.trim() === '') {
            continue;
          } else if (child.type === 'comment') {
            continue;
          } else {
            onlyContainerAndWhitespace = false;
            break;
          }
        }

        // If conditions met, add display="true" to the container's properties
        if (mjxContainerNode && onlyContainerAndWhitespace) {
          mjxContainerNode.properties = mjxContainerNode.properties || {};
          if (mjxContainerNode.properties.display !== 'true') {
            // console.log(`>>> REHYPE FIX: Adding display=true to mjx-container inside <p>`);
            mjxContainerNode.properties.display = 'true';
          }
        }
      }
    });
  };
}

// *** MODIFIED Rehype plugin to ONLY process/extract footnote definitions ***
function rehypeProcessFootnotes() {
  return (tree: any, file: any) => {
    const footnotes: { originalId: string; contentHtml: string; backrefs: string[] }[] = [];

    // Remove any standalone H2 'Footnotes' headings
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'h2' &&
          parent &&
          typeof index === 'number' &&
          toString(node).trim().toLowerCase() === 'footnotes') {

        // console.log(`[rehypeProcessFootnotes - EXTRACT ONLY] Removing standalone H2 'Footnotes' node.`);
        parent.children.splice(index, 1);
        return index; // Adjust index for continuing visit
      }
    });

    // Extract footnote definitions and remove the section
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'section' && node.properties?.className?.includes('footnotes')) {
        // console.log('[rehypeProcessFootnotes - EXTRACT ONLY] Found footnote definition section.');

        visit(node, 'element', (liNode) => {
          if (liNode.tagName === 'li' && liNode.properties?.id) {
            const liNodeId = liNode.properties.id as string;
            // Expect IDs like 'user-content-fn-1' from remark-gfm
            const originalIdMatch = liNodeId.match(/fn-(\d+)$/);

            if (originalIdMatch && originalIdMatch[1]) {
              const extractedNum = originalIdMatch[1];
              const normalizedOriginalId = `fn-${extractedNum}`; // Consistent 'fn-X' format

              const contentNodes = liNode.children?.filter((child: any) =>
                !(child.type === 'element' && child.tagName === 'a' && child.properties?.className?.includes('footnote-backref'))
              ) || [];

              const backrefs = liNode.children?.filter((child: any) =>
                child.type === 'element' && child.tagName === 'a' && child.properties?.className?.includes('footnote-backref')
              ).map((link: any) => link.properties.href as string) || [];

              const contentHtml = toHtml(contentNodes);

              // console.log(`[rehypeProcessFootnotes - EXTRACT ONLY] Extracted footnote: liNodeId=${liNodeId}, normalizedOriginalId=${normalizedOriginalId}`);
              footnotes.push({ originalId: normalizedOriginalId, contentHtml, backrefs });
            } else {
              // console.warn(`[rehypeProcessFootnotes - EXTRACT ONLY] Could not extract normalized ID from li node ID: ${liNodeId}`);
            }
          }
        });

        // Remove the entire footnote section from the tree
        if (parent && typeof index === 'number') {
          // console.log(`[rehypeProcessFootnotes - EXTRACT ONLY] Removing definition section node at index ${index}.`);
          parent.children.splice(index, 1);
          return index;
        } else {
            // console.warn('[rehypeProcessFootnotes - EXTRACT ONLY] Could not remove definition section node - parent or index invalid.');
        }
      }
    });

    // Store extracted footnotes in vfile
    file.data = file.data || {};
    file.data.extractedFootnotes = footnotes;
    // console.log('[rehypeProcessFootnotes - EXTRACT ONLY] Finished extraction.');

    // NO SECOND PASS for marking refs anymore
  };
}

// *** NEW Rehype plugin to renumber footnote references in HAST ***
function rehypeRenumberFootnoteRefs() {
  return (tree: any, file: any) => {
    // Retrieve the map and slug passed via processor.data() or file.data
    const originalToNewIdMap = file.data?.originalToNewIdMap as Map<string, number> | undefined;
    const currentTopicSlug = file.data?.currentTopicSlug as string | undefined;

    if (!originalToNewIdMap || !currentTopicSlug) {
      // console.warn('[rehypeRenumberFootnoteRefs] Missing originalToNewIdMap or currentTopicSlug in file.data. Skipping renumbering.');
      return; // Cannot proceed without the map and slug
    }

    // console.log(`[rehypeRenumberFootnoteRefs] Running for slug: ${currentTopicSlug}. Map size: ${originalToNewIdMap.size}`);

    visit(tree, 'element', (node) => {
      // Find the footnote reference anchors (added by remark-gfm)
      // Example: <a href="#user-content-fn-1" id="user-content-fnref-1" aria-describedby="footnote-label">1</a>
      if (node.tagName === 'a' && node.properties?.href?.startsWith('#user-content-fn-')) {
        const hrefValue = node.properties.href as string;
        const originalIdNumMatch = hrefValue.match(/fn-(\d+)$/);
        const originalIdNum = originalIdNumMatch ? originalIdNumMatch[1] : null;

        if (originalIdNum) {
          const normalizedOriginalId = `fn-${originalIdNum}`; // e.g., 'fn-1'
          const originalKey = `${currentTopicSlug}::${normalizedOriginalId}`; // e.g., 'math-example::fn-1'

          const newNumber = originalToNewIdMap.get(originalKey);

          // console.log(`[rehypeRenumberFootnoteRefs] Found ref: ${hrefValue}. Key: ${originalKey}. Mapped New Number: ${newNumber}`);

          if (newNumber !== undefined) {
            // 1. Update the href attribute
            node.properties.href = `#footnote-${newNumber}`;

            // 2. Update the visible number (assuming it's the first text node child)
            const textNode = node.children?.find((child: any) => child.type === 'text');
            if (textNode) {
              // console.log(`[rehypeRenumberFootnoteRefs] Updating text node from '${textNode.value}' to '${newNumber}'.`);
              textNode.value = String(newNumber);
            } else {
               // console.warn(`[rehypeRenumberFootnoteRefs] Could not find text node child for anchor ${hrefValue} to update number.`);
            }

            // 3. Optional: Clean up remark-gfm specific attributes if desired
            // delete node.properties.id;
            // delete node.properties['aria-describedby'];

            // 4. Remove the temporary data-footnote-ref if it was ever added (it shouldn't be with this flow)
            // delete node.properties['data-footnote-ref'];

          } else {
            // console.warn(`[rehypeRenumberFootnoteRefs] Lookup FAILED for key: ${originalKey}. Map keys:`, Array.from(originalToNewIdMap.keys()));
          }
        } else {
          // console.warn(`[rehypeRenumberFootnoteRefs] Could not extract numeric ID from href: ${hrefValue}`);
        }
      }
    });
  };
}

export async function getContentSlugs() {
  try {
    const mapsDir = path.join(process.cwd(), 'content/maps');
    const articlesDir = path.join(process.cwd(), 'content/articles');
    
    const [mapFiles, articleFiles] = await Promise.all([
      fs.readdir(mapsDir).catch(() => []),
      fs.readdir(articlesDir).catch(() => [])
    ]);

    const mapSlugs = mapFiles
      .filter((name) => name.endsWith('.ditamap'))
      .map((name) => name.replace(/\.ditamap$/, ''));

    const articleSlugs = articleFiles
      .filter((name) => name.endsWith('.mdita') || name.endsWith('.md'))
      .map((name) => name.replace(/\.(mdita|md)$/, ''));

    return [...mapSlugs, ...articleSlugs];
  } catch (error) {
    console.error('Error reading content slugs:', error);
    return [];
  }
}

// --- Start Re-added Helper Functions ---

// Helper function to find topic file with various extensions
async function findTopicFile(topicId: string, topicsDir: string): Promise<{ path: string; content: string } | null> {
  const cleanTopicId = topicId.replace(/^\.\.\/topics\//, '').replace(/^\//, '');
  const possiblePaths = [
    path.join(topicsDir, cleanTopicId), // Assume it might be passed with extension already
    path.join(topicsDir, `${cleanTopicId}.mdita`),
    path.join(topicsDir, `${cleanTopicId}.md`),
    path.join(topicsDir, `${cleanTopicId}.dita`),
    path.join(topicsDir, `${cleanTopicId}.xml`),
  ];

  // console.log('[findTopicFile] Looking for:', topicId, '(Clean:', cleanTopicId, ')');

  for (const filePath of possiblePaths) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      // console.log('[findTopicFile] Found at:', filePath);
      return { path: filePath, content };
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error(`[findTopicFile] Error reading potential topic file ${filePath}:`, err);
      }
    }
  }

  console.error(`[findTopicFile] Could not find topic file for ${topicId} in ${topicsDir}`);
  return null;
}

// Helper function to process inline footnotes into standard refs/defs
function processInlineFootnotes(markdown: string): string {
  const inlineFootnoteRegex = /\^\[([\s\S]*?)\]/g;
  let footnoteIndex = 1;
  const footnoteDefs: string[] = [];
  
  // Determine the starting index for new footnote refs
  const existingRefs = new Set<number>();
  const refRegex = /\[\^(\d+)\]/g;
  let refMatch;
  while ((refMatch = refRegex.exec(markdown)) !== null) {
      existingRefs.add(parseInt(refMatch[1]));
  }
  while (existingRefs.has(footnoteIndex)) {
      footnoteIndex++;
  }

  const processedMarkdown = markdown.replace(inlineFootnoteRegex, (match, footnoteText) => {
    const footnoteId = footnoteIndex++; // Use and increment
    footnoteDefs.push(`[^${footnoteId}]: ${footnoteText}`);
    return `[^${footnoteId}]`;
  });

  if (footnoteDefs.length > 0) {
    return `${processedMarkdown}\n\n${footnoteDefs.join('\n')}`;
  }
  return processedMarkdown;
}

// --- End Re-added Helper Functions ---

export async function getArticleData(slug: string): Promise<Article | null> {
  console.log(`[getArticleData V2] Starting processing for slug: ${slug}`);
  try {
    const mapsDir = path.join(process.cwd(), 'content/maps');
    const articlesDir = path.join(process.cwd(), 'content/articles');
    const topicsDir = path.join(process.cwd(), 'content/topics');

    // Try processing as a DITA map first
    try {
      const mapPath = path.join(mapsDir, `${slug}.ditamap`);
      const mapContents = await fs.readFile(mapPath, 'utf8');
      console.log('[getArticleData V2] Reading map file:', mapPath);

      const { metadata, topics } = await parseMetadata(mapContents, 'map');
      console.log('[getArticleData V2] Parsed map metadata:', metadata);
      console.log('[getArticleData V2] Found topics in map:', topics);

      if (!metadata.publish) {
        console.log(`[getArticleData V2] Map article ${slug} not published.`);
        return null;
      }

      if (!topics || topics.length === 0) {
        console.warn(`[getArticleData V2] Map ${slug} contains no topics.`);
        throw new Error("Map contains no topics");
      }

      // --- Pass 1: Process Markdown -> HAST & Extract Footnotes ---
      console.log('[getArticleData V2] --- Starting Pass 1: HAST Generation & Footnote Extraction ---');
      // Clone the base processor and add the extraction plugin
      const extractProcessor = baseProcessor().use(rehypeProcessFootnotes);

      const topicPass1Results = await Promise.all(topics.map(async (topicId, index) => {
        const topicSlug = topicId.replace(/^\.\.\/topics\//, '').replace(/^\//, '').replace(/(mdita|md|dita|xml)$/, '');
        try {
          const topicFile = await findTopicFile(topicId, topicsDir);
          if (!topicFile) {
            console.error(`[getArticleData V2 Pass 1] Topic file not found: ${topicId}`);
            return null;
          }
          console.log('[getArticleData V2 Pass 1] Processing topic:', topicFile.path);
          const { content: markdown } = matter(topicFile.content); // Don't need metadata here
          const processedMarkdown = processInlineFootnotes(markdown);

          // Run the processor to get HAST and extracted data
          // Use parse() and run() instead of process() as we don't have a compiler yet
          const mdast = extractProcessor.parse(processedMarkdown);
          const vfile = new VFile({ value: processedMarkdown }); // Create VFile instance
          const hastTree = await extractProcessor.run(mdast, vfile); // Pass VFile

          // Access data from the VFile instance
          const extractedFootnotes = (vfile.data?.extractedFootnotes || []) as { originalId: string; contentHtml: string; backrefs: string[] }[];
          const topicToc = (vfile.data?.toc || []) as TocEntry[];

          console.log(`[getArticleData V2 Pass 1] Topic ${topicSlug} processed. Extracted ${extractedFootnotes.length} footnotes.`);

          return {
            slug: topicSlug,
            order: index,
            hastTree: hastTree, // Store HAST
            extractedFootnotes: extractedFootnotes,
            toc: topicToc
          };
        } catch (error) {
          console.error(`[getArticleData V2 Pass 1] Error processing topic ${topicId}:`, error);
          return null;
        }
      }));

      const validTopicDataPass1 = topicPass1Results.filter((topic): topic is NonNullable<typeof topic> => topic !== null);

      if (validTopicDataPass1.length === 0) {
        console.error(`[getArticleData V2] No valid topics could be processed in Pass 1 for map: ${slug}`);
        return null;
      }

      // --- Build Footnote Maps ---
      console.log('[getArticleData V2] --- Building Footnote Maps ---');
      let globalFootnoteCounter = 0;
      const finalFootnotesMap = new Map<number, { contentHtml: string; backRefHrefs: string[] }>();
      const originalToNewIdMap = new Map<string, number>(); // Key: topicSlug::fn-X

      validTopicDataPass1.forEach(topic => {
        if (Array.isArray(topic.extractedFootnotes)) {
            topic.extractedFootnotes.forEach(fn => {
                const originalKey = `${topic.slug}::${fn.originalId}`; 
                if (!originalToNewIdMap.has(originalKey)) { // Avoid duplicates if somehow extracted twice
                    globalFootnoteCounter++;
                    originalToNewIdMap.set(originalKey, globalFootnoteCounter);
                    console.log(`[getArticleData V2 Mapping] Key: ${originalKey} -> New ID: ${globalFootnoteCounter}`);
                    finalFootnotesMap.set(globalFootnoteCounter, {
                        contentHtml: fn.contentHtml,
                        backRefHrefs: fn.backrefs, // Store original backrefs if needed later
                    });
                } else {
                     console.warn(`[getArticleData V2 Mapping] Duplicate original key detected: ${originalKey}. Ignoring subsequent.`);
                }
            });
        }
      });
      console.log('[getArticleData V2 Mapping] Finished. originalToNewIdMap size:', originalToNewIdMap.size);

      // --- Pass 2: Renumber Refs in HAST & Stringify ---
      console.log('[getArticleData V2] --- Starting Pass 2: Renumbering Refs & Stringifying HAST ---');
      const finalTopicHtmls = await Promise.all(validTopicDataPass1.map(async (topic) => {
          try {
              // Create a processor with the necessary data for renumbering
              const renumberStringifyProcessor = (unified() as any)
                  .data('originalToNewIdMap', originalToNewIdMap)
                  .data('currentTopicSlug', topic.slug)
                  .use(rehypeRenumberFootnoteRefs)
                  .use(rehypeStringify, { allowDangerousHtml: true });
             
              // IMPORTANT: Process the HAST tree directly.
              // process() expects a string, so we use runSync() and stringify() manually
              const vfileForProcessing = new VFile(); // Create VFile for processing
              vfileForProcessing.data = { // Explicitly pass data via the file object
                  originalToNewIdMap: originalToNewIdMap,
                  currentTopicSlug: topic.slug
              };
             
              // Run the plugins on the HAST tree, passing the file object with data
              const transformedTree = await renumberStringifyProcessor.run(topic.hastTree as Root, vfileForProcessing);
             
              // Stringify the transformed tree
              const finalHtml = renumberStringifyProcessor.stringify(transformedTree as Root);

              console.log(`[getArticleData V2 Pass 2] Stringified HTML for topic: ${topic.slug} (Length: ${finalHtml.length})`);
              return { html: finalHtml, order: topic.order };
          } catch (error) {
              console.error(`[getArticleData V2 Pass 2] Error processing HAST for topic ${topic.slug}:`, error);
              return null; // Handle error for this specific topic
          }
      }));

      // Filter out any null results from errors and sort
      const validFinalHtmls = finalTopicHtmls
          .filter((result): result is NonNullable<typeof result> => result !== null)
          .sort((a, b) => a.order - b.order)
          .map(result => result.html);

      if (validFinalHtmls.length !== validTopicDataPass1.length) {
          console.warn(`[getArticleData V2 Pass 2] Some topics failed during HAST processing/stringifying.`);
          // Decide if partial content is acceptable or if we should fail
          if (validFinalHtmls.length === 0) {
              console.error(`[getArticleData V2] All topics failed in Pass 2 for map: ${slug}`);
              return null;
          }
      }

      // --- Combine & Finalize ---
      console.log('[getArticleData V2] --- Combining HTML and Appending Footnotes ---');
      let combinedHtml = validFinalHtmls.join('\n\n<hr class="my-8 border-border" />\n\n');

      // Append Final Footnote Section
      if (finalFootnotesMap.size > 0) {
        const footnoteLiElements = Array.from(finalFootnotesMap.entries())
          .sort(([idA], [idB]) => idA - idB)
          .map(([newId, { contentHtml }]) => {
            const wrappedContent = contentHtml.trim().startsWith('<p') ? contentHtml : `<p>${contentHtml.trim()}</p>`;
            // Remove the placeholder addition - rely on the backref from Pass 1 extraction
            // const contentWithBackrefPlaceholder = wrappedContent.replace(/<\/p>\s*$/, ` <a href="#placeholder-backref-${newId}" data-footnote-backref aria-label="Back to reference ${newId}" class="data-footnote-backref">↩</a></p>`);
            // Use the wrapped content directly, which should already contain the correct backref
            return `<li id="footnote-${newId}">${wrappedContent}</li>`; 
          }).join('\n');

        combinedHtml += `\n\n<section data-footnotes class="footnotes mt-12 pt-8 border-t border-border">\n<h2 class="sr-only" id="footnotes-section-label">Footnotes</h2>\n<ol>\n${footnoteLiElements}\n</ol>\n</section>`;
         console.log(`[getArticleData V2] Appended footnote section with ${finalFootnotesMap.size} items.`);
      } else {
          console.log(`[getArticleData V2] No footnotes found to append.`);
      }

      // Combine TOCs from all valid topics
      const combinedToc = validTopicDataPass1.flatMap(t => t.toc || []);

      console.log(`[getArticleData V2] Successfully processed map ${slug}, returning data.`);
      return {
        slug,
        metadata: metadata as MapMetadata,
        content: combinedHtml,
        toc: combinedToc,
      };

    } catch (mapError: any) {
        // --- Standalone Article Fallback Path (largely unchanged, but simplified footnote handling) ---
        console.log(`[getArticleData V2] Map processing failed for ${slug}, trying as standalone. Error: ${mapError.message}`);
        const possibleExtensions = ['.mdita', '.md'];
        for (const ext of possibleExtensions) {
            const standaloneFilePath = path.join(articlesDir, `${slug}${ext}`);
            try {
                const fileContents = await fs.readFile(standaloneFilePath, 'utf8');
                console.log(`[getArticleData V2 Standalone] Reading: ${standaloneFilePath}`);
                const { data: metadata, content: markdown } = matter(fileContents);

                if (!metadata.publish) {
                    console.log(`[getArticleData V2 Standalone] ${slug}${ext} not published.`);
                    continue; // Try next extension or fail
                }

                const processedMarkdown = processInlineFootnotes(markdown);

                // Processor for standalone: includes extract + stringify
                // Clone base, add extract plugin, add stringify
                const standaloneProcessor = baseProcessor()
                    .use(rehypeProcessFootnotes) // Extract definitions
                    .use(rehypeStringify, { allowDangerousHtml: true }); // ADDED OPTION

                const file = await standaloneProcessor.process(processedMarkdown);
                let html = file.toString(); // .toString() uses the processor's stringify options
                const toc = (file.data.toc || []) as TocEntry[];
                const extractedFootnotes = (file.data.extractedFootnotes || []) as { originalId: string; contentHtml: string; backrefs: string[] }[];

                // Append extracted footnotes (no renumbering, use original IDs/structure)
                if (extractedFootnotes && extractedFootnotes.length > 0) {
                    console.log(`[getArticleData V2 Standalone] Processing ${extractedFootnotes.length} footnotes for ${slug}${ext}`);
                    const finalFootnotesHtmlStandalone: string[] = [];
                    let counterStandalone = 0;

                    extractedFootnotes.forEach(fn => {
                        counterStandalone++; // Simple counter for li id
                        const originalNumericId = fn.originalId.replace(/^fn-/, ''); // '1', '2' etc.
                        // Construct the expected back-ref target ID from remark-gfm
                        const backRefTargetId = `#user-content-fnref-${originalNumericId}`;

                        const wrappedContent = fn.contentHtml.trim().startsWith('<p') ? fn.contentHtml : `<p>${fn.contentHtml.trim()}</p>`;
                        const contentWithBackref = wrappedContent.replace(/<\/p>\s*$/, ` <a href="${backRefTargetId}" data-footnote-backref aria-label="Back to reference ${counterStandalone}" class="data-footnote-backref">↩</a></p>`);
                       
                        // Use the counter for the list ID, link back to the original ref ID
                        finalFootnotesHtmlStandalone.push(
                            `<li id="footnote-${counterStandalone}">${contentWithBackref}</li>`
                        );
                    });

                    html += `\n\n<section data-footnotes class="footnotes mt-12 pt-8 border-t border-border">\n<h2 class="sr-only" id="footnotes-section-label">Footnotes</h2>\n<ol>\n${finalFootnotesHtmlStandalone.join('\n')}\n</ol>\n</section>`;
                }

                console.log(`[getArticleData V2 Standalone] Successfully processed ${slug}${ext}.`);
                return {
                    slug,
                    metadata: metadata as TopicMetadata, // Assuming standalone has TopicMetadata
                    content: html,
                    toc,
                };
            } catch (error: any) {
                if (error.code !== 'ENOENT') {
                    console.error(`[getArticleData V2 Standalone] Error reading ${standaloneFilePath}:`, error.message);
                } else {
                    console.log(`[getArticleData V2 Standalone] File not found: ${standaloneFilePath}`);
                }
            }
        } // End loop through extensions

        console.error(`[getArticleData V2] Failed to find or process slug ${slug} as map or standalone article.`);
        return null; // Failed to find as map or standalone

    } // End catch mapError / Fallback block

  } catch (generalError: any) {
    console.error(`[getArticleData V2] General error processing ${slug}: ${generalError.message}`);
    return null; // General failure
  }
}

export async function getDocData(slug: string): Promise<Doc | null> {
  const docsDir = path.join(process.cwd(), 'content/docs');
  // Handle nested paths by joining with the slug directly
  const mditaPath = path.join(docsDir, `${slug}.mdita`);
  const mdPath = path.join(docsDir, `${slug}.md`);

  let filePath: string | null = null;
  let fileContents: string | null = null;

  try {
    // Try .mdita first
    fileContents = await fs.readFile(mditaPath, 'utf8');
    filePath = mditaPath;
  } catch (error) {
    // Try .md extension
    try {
      fileContents = await fs.readFile(mdPath, 'utf8');
      filePath = mdPath;
    } catch (mdError) {
      console.error(`Documentation file not found: ${slug}`);
      return null; // Not found
    }
  }

  if (!fileContents || !filePath) {
     return null; // Should not happen if one try succeeded
  }

  const { data: metadata, content: markdown } = matter(fileContents);
    
  // If publish is explicitly set to false, return null
  if (metadata.publish === false) {
    console.log('Doc not published:', slug);
    return null;
  }

  // Process using the shared processor that includes TOC extraction
  // For docs, we probably don't need footnote renumbering, just extract+stringify
  const docProcessor = baseProcessor()
      .use(rehypeProcessFootnotes) // Add extraction
      .use(rehypeStringify);      // Add stringify
     
  const file = await docProcessor.process(markdown);
  let html = file.toString();
  const toc = (file.data.toc || []) as TocEntry[]; // Extract TOC data
  const extractedFootnotes = (file.data.extractedFootnotes || []) as { originalId: string; contentHtml: string; backrefs: string[] }[];

  // Append footnotes if any (similar to standalone article logic)
  if (extractedFootnotes && extractedFootnotes.length > 0) {
    console.log(`[getDocData] Processing ${extractedFootnotes.length} footnotes for doc: ${slug}`);
    const finalFootnotesHtml: string[] = [];
    let counter = 0;
    extractedFootnotes.forEach(fn => {
        counter++;
        const originalNumericId = fn.originalId.replace(/^fn-/, ''); 
        const backRefTargetId = `#user-content-fnref-${originalNumericId}`;
        const wrappedContent = fn.contentHtml.trim().startsWith('<p') ? fn.contentHtml : `<p>${fn.contentHtml.trim()}</p>`;
        const contentWithBackref = wrappedContent.replace(/<\/p>\s*$/, ` <a href="${backRefTargetId}" data-footnote-backref aria-label="Back to reference ${counter}" class="data-footnote-backref">↩</a></p>`);
        finalFootnotesHtml.push(
            `<li id="footnote-${counter}">${contentWithBackref}</li>`
        );
    });
    html += `\n\n<section data-footnotes class="footnotes mt-12 pt-8 border-t border-border">\n<h2 class="sr-only" id="footnotes-section-label">Footnotes</h2>\n<ol>\n${finalFootnotesHtml.join('\n')}\n</ol>\n</section>`;
  }

  // --- ADD DECODING STEP ---
  // Ensure our specific component placeholder is not entity encoded
  html = html.replace(/&#x3C;div data-component="([^"]+)"&#x3E;&#x3C;\/div&#x3E;/g, '<div data-component="$1"></div>');
  // --- END DECODING STEP ---

  return {
    slug,
    content: html,
    metadata: metadata as TopicMetadata,
    toc, 
  };
} 