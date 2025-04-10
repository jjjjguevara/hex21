import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { Article, Doc, MapMetadata, TopicMetadata } from '@/types/content';
import { getDocData } from './content.server';

const ARTICLES_PATH = path.join(process.cwd(), 'content/articles');

// Helper function to check if metadata has required fields for an Article
function isArticleMetadata(metadata: any): metadata is TopicMetadata & { title: string, date: string } {
  return metadata && typeof metadata.title === 'string' && typeof metadata.date === 'string';
}

// Recursively fetches all articles from the articles directory and subdirectories
async function getArticleSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  const topicSlugs: Set<string> = new Set();
  const ditamapSlugs: Set<string> = new Set();

  // Helper function for recursive directory traversal
  async function scanDirectory(dirPath: string): Promise<void> {
    try {
      const dirents = await fs.readdir(dirPath, { withFileTypes: true });
      
      // First pass: collect all ditamap entries to identify topics
      for (const dirent of dirents) {
        const fullPath = path.join(dirPath, dirent.name);
        const relativePath = path.relative(ARTICLES_PATH, fullPath);
        
        if (dirent.isDirectory()) {
          // Recursively scan subdirectories
          await scanDirectory(fullPath);
        } else if (dirent.isFile()) {
          if (dirent.name.endsWith('.ditamap')) {
            // Found a ditamap file, add it to our collection
            const ditamapSlug = relativePath.replace(/\.ditamap$/, '');
            ditamapSlugs.add(ditamapSlug);
            
            // Now read the ditamap file to find topic references
            try {
              const content = await fs.readFile(fullPath, 'utf8');
              
              // First, try XML parsing approach for topicrefs
              const topicRefsXml = content.match(/<topicref\s+[^>]*href\s*=\s*["']([^"']+)["']/g);
              
              if (topicRefsXml) {
                for (const match of topicRefsXml) {
                  const hrefMatch = match.match(/href\s*=\s*["']([^"']+)["']/);
                  if (hrefMatch && hrefMatch[1]) {
                    processTopicRef(hrefMatch[1], fullPath);
                  }
                }
              }
              
              // Then check for Markdown wiki link syntax ([[path|title]])
              const wikiLinkMatches = content.match(/\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g);
              if (wikiLinkMatches) {
                for (const match of wikiLinkMatches) {
                  const linkMatch = match.match(/\[\[([^|\]]+)/);
                  if (linkMatch && linkMatch[1]) {
                    processTopicRef(linkMatch[1], fullPath);
                  }
                }
              }
              
              // Also check for regular Markdown links [title](path)
              const mdLinkMatches = content.match(/\[([^\]]+)\]\(([^)]+)\)/g);
              if (mdLinkMatches) {
                for (const match of mdLinkMatches) {
                  const linkMatch = match.match(/\]\(([^)]+)\)/);
                  if (linkMatch && linkMatch[1]) {
                    processTopicRef(linkMatch[1], fullPath);
                  }
                }
              }
              
              // Legacy regex for mixed formats
              const hrefMatches = content.match(/href=['"]([^'"]+)['"]\s+format=['"](markdown|md)['"]|href=['"](.*?\.md)['"]|href=['"](.*?\.mdita)['"]|href=['"](.*?\.dita)['"]|href=['"](.*?)['"]\s+format=['"](markdown|md)['"]|href=['"](.*?)['"]\s+format=['"](markdown|md)['"]\s+/g);
              
              if (hrefMatches) {
                for (const match of hrefMatches) {
                  // Extract the href value
                  const hrefMatch = match.match(/href=['"](.*?)['"]/);
                  if (hrefMatch && hrefMatch[1]) {
                    processTopicRef(hrefMatch[1], fullPath);
                  }
                }
              }
            } catch (readError) {
              console.error(`Error reading ditamap file ${fullPath}:`, readError);
            }
          } else if (dirent.name.endsWith('.md') || dirent.name.endsWith('.mdita')) {
            // Add to all markdown files for now, we'll filter later
            const slug = relativePath.replace(/\.(md|mdita)$/, '');
            slugs.push(slug);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }
    
    // Helper function to process topic references
    function processTopicRef(topicPath: string, ditamapPath: string) {
      // Handle relative paths to the ditamap
      console.log(`Processing topic reference: ${topicPath} from ${ditamapPath}`);
      
      // Clean up any format attributes that might be in the path
      let cleanPath = topicPath.split(/\s+format=/)[0].trim();
      
      // Remove quotes if they exist
      cleanPath = cleanPath.replace(/^["'](.+)["']$/, '$1');
      
      const dirName = path.dirname(ditamapPath);
      let topicFullPath;
      
      // Handle special cases for paths
      if (cleanPath.startsWith('../') || cleanPath.startsWith('./')) {
        // Relative path
        topicFullPath = path.resolve(dirName, cleanPath);
      } else if (path.isAbsolute(cleanPath)) {
        // Absolute path
        topicFullPath = cleanPath;
      } else {
        // Assume path is relative to the ditamap location
        topicFullPath = path.join(dirName, cleanPath);
      }
      
      // Try to find the file with or without extension
      let fileToCheck = topicFullPath;
      if (!fileToCheck.endsWith('.md') && !fileToCheck.endsWith('.mdita') && !fileToCheck.endsWith('.dita')) {
        fileToCheck = `${topicFullPath}.md`;
        if (!existsSync(fileToCheck)) {
          fileToCheck = `${topicFullPath}.mdita`;
          if (!existsSync(fileToCheck)) {
            fileToCheck = `${topicFullPath}.dita`;
          }
        }
      }
      
      const topicRelPath = path.relative(ARTICLES_PATH, topicFullPath);
      
      // Remove extension if present
      const topicSlug = topicRelPath.replace(/\.(md|mdita|dita|xml)$/, '');
      console.log(`Added topic slug: ${topicSlug}`);
      topicSlugs.add(topicSlug);
    }
  }

  // Start recursive scan
  await scanDirectory(ARTICLES_PATH);
  
  // Filter out any topics that are part of a ditamap
  const standaloneArticleSlugs = slugs.filter(slug => !topicSlugs.has(slug));
  
  // Combine standalone articles with ditamap articles
  const allArticleSlugs = [...standaloneArticleSlugs, ...ditamapSlugs];
  
  console.log(`Found ${allArticleSlugs.length} articles: ${ditamapSlugs.size} ditamaps and ${standaloneArticleSlugs.length} standalone articles`);
  return allArticleSlugs;
}

// Fetches all articles with basic metadata for listing
export async function getArticles(): Promise<Article[]> {
  const slugs = await getArticleSlugs();
  
  // Add logging to debug
  console.log(`Found ${slugs.length} article slugs:`, slugs);
  
  const articlesPromises = slugs.map(async (slug) => {
    try {
      // Check if this is a ditamap file
      const isDitamap = slug.endsWith('.ditamap');
      const actualSlug = isDitamap ? slug.replace(/\.ditamap$/, '') : slug;
      
      const docData = await getDocData(actualSlug);
      if (docData && docData.metadata) {
        // Ensure the required fields exist, but be more flexible with validation
        const hasRequiredFields = typeof docData.metadata.title === 'string';
        
        if (hasRequiredFields) {
          // Use custom slug from metadata if available, otherwise use a URL-friendly version of the file slug
          let urlSlug = actualSlug;
          
          // If metadata has a custom slug, use that instead
          if (docData.metadata.slug && typeof docData.metadata.slug === 'string') {
            urlSlug = docData.metadata.slug;
          } 
          // Otherwise, if the slug contains special characters, spaces or is very long, create a clean version
          else if (actualSlug.includes(' ') || actualSlug.length > 80) {
            // Extract the last segment for nested paths
            const lastSegment = actualSlug.split('/').pop() || actualSlug;
            // Create a URL-friendly version (remove special chars, convert spaces to dashes)
            urlSlug = lastSegment
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
              .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
          }
          
          return {
            ...docData,
            slug: urlSlug, // Use the URL-friendly slug or custom slug
            originalPath: actualSlug, // Keep the original path for reference
            content: docData.content.replace(/<[^>]*>/g, ' ').trim(), // Strip HTML and trim whitespace
            metadata: {
              ...docData.metadata,
              // Ensure consistent date format
              date: docData.metadata.date ? new Date(docData.metadata.date).toISOString() : undefined
            },
            category: docData.metadata.category || 'Uncategorized',
            toc: docData.toc || [], // Pass TOC if needed
          } as Article;
        }
      }
    } catch (error) {
      console.error(`Failed to get data for article slug ${slug}:`, error);
    }
    return null;
  });

  const articles = (await Promise.all(articlesPromises)).filter(Boolean) as Article[];
  
  console.log(`Successfully loaded ${articles.length} articles`);

  // Filter out null articles and sort by date in descending order
  return articles
    .filter((article): article is NonNullable<typeof article> => article !== null)
    .sort((a, b) => {
      if (!a.metadata.date && !b.metadata.date) return 0;
      if (!a.metadata.date) return 1;
      if (!b.metadata.date) return -1;
      return new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime();
    });
}