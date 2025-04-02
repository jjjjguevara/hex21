import fs from 'fs/promises';
import path from 'path';
import { parseMetadata } from './metadata';
import matter from 'gray-matter';
import hljs from 'highlight.js';
import { Article, MapMetadata, TopicMetadata } from '@/types/content';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import { parse } from 'node-html-parser';

// Create the unified processor instance
const processor = unified()
  .use(remarkParse)       // Parse markdown
  .use(remarkGfm)         // Support GFM (includes standard footnotes)
  .use(remarkMath)        // Support math blocks
  .use(remarkRehype)      // Convert to rehype
  .use(rehypeKatex)       // Render math with KaTeX
  .use(rehypeStringify);  // Convert HTML AST to string

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

async function findTopicFile(topicId: string, topicsDir: string): Promise<{ path: string; content: string } | null> {
  // Clean up the topic ID by removing any leading slashes or ../topics/
  const cleanTopicId = topicId.replace(/^\.\.\/topics\//, '').replace(/^\//, '');
  
  // Try different extensions and locations
  const possiblePaths = [
    path.join(topicsDir, cleanTopicId), // Exact path
    path.join(topicsDir, `${cleanTopicId}.mdita`),
    path.join(topicsDir, `${cleanTopicId}.md`),
    path.join(topicsDir, `${cleanTopicId}.dita`),
    path.join(topicsDir, `${cleanTopicId}.xml`),
  ];

  console.log('Looking for topic file:', topicId);
  console.log('Cleaned topic ID:', cleanTopicId);
  console.log('Possible paths:', possiblePaths);

  for (const filePath of possiblePaths) {
    try {
      console.log('Trying path:', filePath);
      const content = await fs.readFile(filePath, 'utf8');
      console.log('Found topic file at:', filePath);
      return { path: filePath, content };
    } catch (err) {
      console.log('Not found at:', filePath);
      continue;
    }
  }

  console.error(`Could not find topic file for ${topicId} in ${topicsDir}`);
  console.error('Tried paths:', possiblePaths.join(', '));
  return null;
}

export async function getArticleData(slug: string): Promise<Article | null> {
  try {
    // First try to find the article in the maps directory
    const mapsDir = path.join(process.cwd(), 'content/maps');
    const articlesDir = path.join(process.cwd(), 'content/articles');
    const topicsDir = path.join(process.cwd(), 'content/topics');
    
    // Try to read from maps directory first
    try {
      const mapPath = path.join(mapsDir, `${slug}.ditamap`);
      const mapContents = await fs.readFile(mapPath, 'utf8');
      console.log('Reading map file:', mapPath);
      
      const { metadata, topics } = await parseMetadata(mapContents, 'map');
      console.log('Parsed metadata:', metadata);
      console.log('Found topics:', topics);

      // Only proceed if the article is published
      if (!metadata.publish) {
        console.log('Article not published:', slug);
        return null;
      }

      // Initialize arrays to hold main content and footnote list items
      const topicMainContents: { id: string; metadata: TopicMetadata; content: string }[] = [];
      const allFootnotes: { 
        originalId: string; 
        content: string; 
        topicId: string; 
        backrefId: string;
        topicIndex: number;
        originalName?: string; // Add originalName to track named footnotes
      }[] = [];
      
      // Track topic index for proper footnote ordering
      let topicIndex = 0;

      // Load and process all topics referenced in the map
      await Promise.all(
        (topics || []).map(async (topicId, index) => {
          try {
            const topicFile = await findTopicFile(topicId, topicsDir);
            
            if (!topicFile) {
              console.error(`Topic file not found: ${topicId}`);
              return; // Skip this topic
            }

            console.log('Found topic file:', topicFile.path);
            const { data: topicMetadata, content: markdown } = matter(topicFile.content);
            
            // Handle inline footnotes before processing
            const processedMarkdown = processInlineFootnotes(markdown);
            
            // Process markdown to HTML using unified
            const file = await processor.process(processedMarkdown);
            const html = file.toString();

            // Parse the generated HTML
            const root = parse(html);

            // Find and extract footnote list items
            const footnotesSection = root.querySelector('section.footnotes[data-footnotes]');
            if (footnotesSection) {
              const footnoteItems = footnotesSection.querySelectorAll('li');
              
              // Extract and store the footnotes with their original info
              footnoteItems.forEach(li => {
                const originalId = li.getAttribute('id') || '';
                const originalName = originalId.replace('user-content-fn-', ''); // Capture the original name
                const backrefLinks = li.querySelectorAll('a.data-footnote-backref');
                
                backrefLinks.forEach(backrefLink => {
                  const backrefId = backrefLink.getAttribute('href')?.replace('#', '') || '';
                  const content = li.innerHTML;
                
                  allFootnotes.push({
                    originalId,
                    originalName, // Store the original name
                    content,
                    topicId,
                    backrefId,
                    topicIndex: index // Store topic order
                  });
                });
              });
              
              // Remove the footnotes section from this topic's HTML
              footnotesSection.remove();
            }
            
            // Remove any manual "Footnotes" headings (case insensitive)
            const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach(heading => {
              if (heading.textContent.trim().toLowerCase() === 'footnotes') {
                heading.remove();
              }
            });

            // Store the modified main content (without footnotes section)
            topicMainContents.push({
              id: topicId,
              metadata: topicMetadata as TopicMetadata,
              content: root.toString() // Get HTML string from the modified root
            });

          } catch (error) {
            console.error(`Error loading topic ${topicId}:`, error);
          }
        })
      );

      // Ensure topics maintain their original order from the map
      const orderedTopics = (topics || []).map(topicId => 
        topicMainContents.find(t => t.id === topicId)
      ).filter((topic): topic is NonNullable<typeof topic> => topic !== null);

      if (orderedTopics.length === 0) {
        console.error('No valid topics found for article:', slug);
        return null;
      }

      // Sort footnotes by topic order and then by their occurrence in the document
      // This ensures footnotes appear in reading order
      allFootnotes.sort((a, b) => {
        if (a.topicIndex !== b.topicIndex) {
          return a.topicIndex - b.topicIndex;
        }
        // Try to sort by natural order if the IDs are numeric
        const aNum = parseInt(a.originalName || '0', 10);
        const bNum = parseInt(b.originalName || '0', 10);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        // Otherwise use string comparison
        return (a.originalName || '').localeCompare(b.originalName || '');
      });

      // Create a sequential ID for each unique footnote while preserving original IDs
      const uniqueFootnotes = new Map<string, { 
        newId: string, 
        originalName: string,
        content: string,
        references: { originalRefId: string, newRefId: string }[]
      }>();
      
      // First pass: create a mapping of all footnotes with their new IDs
      // Instead of starting from 1 each time, we'll use the original numeric IDs
      // from the Markdown files when possible
      
      for (const footnote of allFootnotes) {
        const key = `${footnote.topicId}-${footnote.originalId}`;
        
        if (!uniqueFootnotes.has(key)) {
          // Get the original numeric ID if possible
          let numericId = parseInt(footnote.originalName || '0', 10);
          
          // Ensure the ID is valid
          if (isNaN(numericId) || numericId <= 0) {
            // Use a default ID if not valid
            numericId = uniqueFootnotes.size + 1;
          }
          
          uniqueFootnotes.set(key, {
            newId: `user-content-fn-${numericId}`,
            originalName: footnote.originalName || String(numericId),
            content: footnote.content,
            references: [{
              originalRefId: footnote.backrefId,
              newRefId: `user-content-fnref-${numericId}`
            }]
          });
        } else {
          // If we've seen this footnote before, just add this reference to it
          const existingFootnote = uniqueFootnotes.get(key)!;
          existingFootnote.references.push({
            originalRefId: footnote.backrefId,
            newRefId: `user-content-fnref-${existingFootnote.references.length + 1}-${existingFootnote.newId.split('-').pop()}`
          });
        }
      }
      
      // Create a mapping from original reference IDs to new reference IDs
      const refIdMap = new Map<string, { newRefId: string, footnoteId: string }>();
      // Also create a mapping from originalName to newId for named footnotes
      const nameIdMap = new Map<string, string>();
      
      // Process the uniqueFootnotes map to extract all reference mappings
      for (const [key, footnote] of uniqueFootnotes.entries()) {
        // Add mapping by originalName (for named references like [^energy])
        nameIdMap.set(footnote.originalName, footnote.newId);
        
        for (const ref of footnote.references) {
          refIdMap.set(ref.originalRefId, {
            newRefId: ref.newRefId,
            footnoteId: footnote.newId
          });
        }
      }
      
      // Process each topic's content to update footnote references
      const processedTopics = orderedTopics.map(topic => {
        // Parse the topic content to update footnote references
        const topicRoot = parse(topic.content);
        
        // Update all footnote reference links
        const footnoteRefs = topicRoot.querySelectorAll('a[data-footnote-ref]');
        footnoteRefs.forEach(ref => {
          const href = ref.getAttribute('href');
          if (href) {
            const targetId = href.replace('#', '');
            // Try to get the named part of the id
            const namePart = targetId.replace('user-content-fn-', '');
            
            // First check if we have a direct mapping for this targetId
            const mapping = refIdMap.get(targetId);
            
            if (mapping) {
              // Direct mapping exists, use it
              ref.setAttribute('href', `#${mapping.footnoteId}`);
              ref.setAttribute('id', mapping.newRefId);
              
              // Update the text content to match the numeric ID
              const numericId = mapping.footnoteId.split('-').pop();
              ref.textContent = numericId;
            } else if (nameIdMap.has(namePart)) {
              // This is a named footnote reference like [^energy]
              const newFootnoteId = nameIdMap.get(namePart)!;
              const numericId = newFootnoteId.split('-').pop();
              const newRefId = `user-content-fnref-${numericId}`;
              
              ref.setAttribute('href', `#${newFootnoteId}`);
              ref.setAttribute('id', newRefId);
              
              // Update the text content to match the numeric ID
              ref.textContent = numericId;
              
              // Also add this to refIdMap for backrefs
              refIdMap.set(targetId, {
                newRefId: newRefId,
                footnoteId: newFootnoteId
              });
            }
          }
        });
        
        // Return the processed topic content
        return {
          ...topic,
          content: topicRoot.toString()
        };
      });
      
      // Combine all topic main contents with proper spacing and structure
      let combinedContent = processedTopics.map(topic => `
        <section class="topic" id="${topic.id.replace(/[^a-zA-Z0-9-_]/g, '_')}">
          ${topic.content}
        </section>
      `).join('\n');

      // If there were any footnotes collected, append the combined footnote section
      if (uniqueFootnotes.size > 0) {
        const footnoteLiElements: string[] = [];
        
        // Iterate through uniqueFootnotes in order of their new IDs
        Array.from(uniqueFootnotes.values())
          .sort((a, b) => {
            const aId = parseInt(a.newId.split('-').pop() || '0', 10);
            const bId = parseInt(b.newId.split('-').pop() || '0', 10);
            return aId - bId;
          })
          .forEach(footnote => {
            // Parse the content to update backlinks
            const parser = parse(footnote.content);
            
            // Find and update all backref links
            const backrefLinks = parser.querySelectorAll('a.data-footnote-backref');
            
            // If there are multiple backref links, we need to handle them
            if (backrefLinks.length === 1 && footnote.references.length === 1) {
              // Simple case: one link to one reference
              backrefLinks[0].setAttribute('href', `#${footnote.references[0].newRefId}`);
            } else if (backrefLinks.length >= 1 && footnote.references.length >= 1) {
              // Complex case: possibly multiple links or references
              backrefLinks.forEach((link, idx) => {
                // If we have a corresponding reference, use it
                if (idx < footnote.references.length) {
                  link.setAttribute('href', `#${footnote.references[idx].newRefId}`);
                } else {
                  // Otherwise use the first reference
                  link.setAttribute('href', `#${footnote.references[0].newRefId}`);
                }
              });
            }
            
            // Create the footnote list item
            const newLi = `<li id="${footnote.newId}">
              ${parser.toString()}
            </li>`;
            
            footnoteLiElements.push(newLi);
          });
        
        const finalFootnotesSection = `
          <section data-footnotes class="footnotes">
            <h2 class="sr-only" id="footnote-label">Footnotes</h2>
            <ol>
              ${footnoteLiElements.join('\n')}
            </ol>
          </section>
        `;
        combinedContent += finalFootnotesSection;
      }

      return {
        slug,
        content: combinedContent,
        metadata,
        topics: orderedTopics // Return the ordered, processed topics
      };
    } catch (mapError) {
      // If not found in maps, try articles directory
      try {
        const articlePath = path.join(articlesDir, `${slug}.mdita`);
        const articleContents = await fs.readFile(articlePath, 'utf8');
        console.log('Reading article file:', articlePath);
        
        const { data: metadata, content: markdown } = matter(articleContents);
        
        // Only proceed if the article is published
        if (!metadata.publish) {
          console.log('Article not published:', slug);
          return null;
        }

        const file = await processor.process(markdown);
        const html = file.toString();

        return {
          slug,
          content: html,
          metadata: metadata as MapMetadata
        };
      } catch (articleError) {
        // Try .md extension as last resort
        try {
          const mdPath = path.join(articlesDir, `${slug}.md`);
          const mdContents = await fs.readFile(mdPath, 'utf8');
          console.log('Reading markdown file:', mdPath);
          
          const { data: metadata, content: markdown } = matter(mdContents);
          
          // Only proceed if the article is published
          if (!metadata.publish) {
            console.log('Article not published:', slug);
            return null;
          }

          const file = await processor.process(markdown);
          const html = file.toString();

          return {
            slug,
            content: html,
            metadata: metadata as MapMetadata
          };
        } catch (mdError) {
          console.error(`Article not found in any location: ${slug}`);
          return null;
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching article ${slug}:`, error);
    return null;
  }
}

export async function getDocData(slug: string) {
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

  // Replace marked with processor.process
  const file = await processor.process(markdown);
  const html = file.toString();

  return {
    slug,
    content: html,
    metadata
  };
}

// Helper function to process inline footnotes
function processInlineFootnotes(markdown: string): string {
  // Find inline footnotes with the pattern ^[footnote text]
  const inlineFootnoteRegex = /\^\[([\s\S]*?)\]/g;
  
  let match;
  let counter = 1;
  let processedMarkdown = markdown;
  
  // Keep track of existing footnote references to avoid ID collisions
  const existingRefs = new Set<number>();
  const refRegex = /\[\^(\d+)\]/g;
  let refMatch;
  
  while ((refMatch = refRegex.exec(markdown)) !== null) {
    existingRefs.add(parseInt(refMatch[1]));
  }
  
  // Find the highest existing footnote number
  let footnoteSuffix = 1;
  while (existingRefs.has(footnoteSuffix)) {
    footnoteSuffix++;
  }
  
  // Replace inline footnotes with reference-style footnotes
  while ((match = inlineFootnoteRegex.exec(markdown)) !== null) {
    const [fullMatch, content] = match;
    const footnoteRef = `[^${footnoteSuffix}]`;
    const footnoteDefinition = `\n\n[^${footnoteSuffix}]: ${content}\n\n`;
    
    // Replace the inline footnote with a reference
    processedMarkdown = processedMarkdown.replace(fullMatch, footnoteRef);
    
    // Add the footnote definition at the end of the document
    processedMarkdown += footnoteDefinition;
    
    footnoteSuffix++;
  }
  
  return processedMarkdown;
} 