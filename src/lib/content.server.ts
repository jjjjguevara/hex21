import fs from 'fs/promises';
import path from 'path';
import { parseMetadata } from './metadata';
import matter from 'gray-matter';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { Article, MapMetadata, TopicMetadata } from '@/types/content';

// Configure marked with syntax highlighting and other features
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error('Error highlighting code:', err);
      }
    }
    return code;
  },
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: true,
  xhtml: false
});

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
  // Try different extensions and locations
  const possiblePaths = [
    path.join(topicsDir, `${topicId}`), // Exact path
    path.join(topicsDir, `${topicId}.mdita`),
    path.join(topicsDir, `${topicId}.dita`),
    path.join(topicsDir, `${topicId}.xml`),
    // Try without ../topics/ prefix
    path.join(topicsDir, topicId.replace(/^\.\.\/topics\//, '')),
    path.join(topicsDir, `${topicId.replace(/^\.\.\/topics\//, '')}.mdita`),
    path.join(topicsDir, `${topicId.replace(/^\.\.\/topics\//, '')}.dita`),
    path.join(topicsDir, `${topicId.replace(/^\.\.\/topics\//, '')}.xml`),
  ];

  for (const filePath of possiblePaths) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return { path: filePath, content };
    } catch (err) {
      continue;
    }
  }

  console.error(`Could not find topic file for ${topicId} in ${topicsDir}`);
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
      
      const { metadata, topics } = parseMetadata(mapContents, 'map');
      console.log('Parsed metadata:', metadata);
      console.log('Found topics:', topics);

      // Only proceed if the article is published
      if (!metadata.publish) {
        console.log('Article not published:', slug);
        return null;
      }

      // Load all topics referenced in the map
      const topicContents = await Promise.all(
        topics.map(async (topicId) => {
          try {
            const topicFile = await findTopicFile(topicId, topicsDir);
            
            if (!topicFile) {
              console.error(`Topic file not found: ${topicId}`);
              return null;
            }

            console.log('Found topic file:', topicFile.path);
            const { data: topicMetadata, content: markdown } = matter(topicFile.content);
            const html = marked(markdown);
            
            return {
              id: topicId,
              metadata: topicMetadata as TopicMetadata,
              content: html
            };
          } catch (error) {
            console.error(`Error loading topic ${topicId}:`, error);
            return null;
          }
        })
      );

      // Filter out any failed topic loads
      const validTopics = topicContents.filter((topic): topic is NonNullable<typeof topic> => topic !== null);

      if (validTopics.length === 0) {
        console.error('No valid topics found for article:', slug);
        return null;
      }

      // Combine all topic contents with proper spacing and structure
      const combinedContent = validTopics.map(topic => `
        <section class="topic" id="${topic.id}">
          ${topic.content}
        </section>
      `).join('\n');

      return {
        slug,
        content: combinedContent,
        metadata,
        topics: validTopics
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

        const html = marked(markdown);

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

          const html = marked(markdown);

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

  try {
    // Try .mdita first
    const fileContents = await fs.readFile(mditaPath, 'utf8');
    const { data: metadata, content: markdown } = matter(fileContents);
    
    // If publish is explicitly set to false, return null
    if (metadata.publish === false) {
      return null;
    }

    const html = marked(markdown);

    return {
      slug,
      content: html,
      metadata
    };
  } catch (error) {
    // Try .md extension
    try {
      const fileContents = await fs.readFile(mdPath, 'utf8');
      const { data: metadata, content: markdown } = matter(fileContents);
      
      // If publish is explicitly set to false, return null
      if (metadata.publish === false) {
        return null;
      }

      const html = marked(markdown);

      return {
        slug,
        content: html,
        metadata
      };
    } catch (mdError) {
      console.error(`Error fetching doc ${slug}:`, error);
      return null;
    }
  }
} 