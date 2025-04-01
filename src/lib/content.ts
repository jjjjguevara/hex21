import { promises as fs } from 'fs';
import path from 'path';
import { parseMetadata } from './metadata';
import { Article, MapMetadata, TopicMetadata } from '@/types/content';

export async function getAllArticles(): Promise<Article[]> {
  const contentDir = path.join(process.cwd(), 'content/maps');
  const topicsDir = path.join(process.cwd(), 'content/topics');
  
  try {
    const filenames = await fs.readdir(contentDir);
    console.log('Found map files:', filenames);
    
    const articles = await Promise.all(
      filenames
        .filter((name) => name.endsWith('.ditamap'))
        .map(async (filename) => {
          const filePath = path.join(contentDir, filename);
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const { metadata, topics } = parseMetadata(content, 'map') as { 
              metadata: MapMetadata; 
              topics: string[] 
            };
            
            const slug = filename.replace(/\.ditamap$/, '');
            
            // Load first topic content for preview
            let firstTopicContent = '';
            if (topics && topics.length > 0) {
              const topicPath = path.join(topicsDir, `${topics[0]}.mdita`);
              try {
                const topicContent = await fs.readFile(topicPath, 'utf8');
                const { metadata: topicMetadata } = parseMetadata(topicContent, 'topic');
                firstTopicContent = topicContent;
              } catch (error) {
                console.error(`Error loading topic ${topics[0]}:`, error);
              }
            }
            
            return {
              slug,
              content: firstTopicContent,
              metadata,
              topics: topics.map(id => ({ id }))
            };
          } catch (error) {
            console.error(`Error processing map ${filename}:`, error);
            return null;
          }
        })
    );

    // Filter out failed articles and unpublished ones
    const filteredArticles = articles
      .filter((article): article is Article => article !== null)
      .filter((article) => {
        // Check publish flag and date
        if (!article.metadata.publish) {
          console.log(`Article ${article.slug} not published`);
          return false;
        }
        if (article.metadata.publish_date) {
          const publishDate = new Date(article.metadata.publish_date);
          if (publishDate > new Date()) {
            console.log(`Article ${article.slug} scheduled for future`);
            return false;
          }
        }
        return true;
      });
    
    console.log('Filtered articles:', filteredArticles.length);
    
    return filteredArticles.sort((a, b) => {
      if (!a.metadata.date && !b.metadata.date) return 0;
      if (!a.metadata.date) return 1;
      if (!b.metadata.date) return -1;
      return new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime();
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

export async function getCategories(): Promise<string[]> {
  const articles = await getAllArticles();
  const categories = new Set(articles.map(article => article.metadata.category));
  return Array.from(categories).sort();
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const contentDir = path.join(process.cwd(), 'content/maps');
  const topicsDir = path.join(process.cwd(), 'content/topics');
  const filePath = path.join(contentDir, `${slug}.ditamap`);
  
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const { metadata, topics } = parseMetadata(content, 'map') as {
      metadata: MapMetadata;
      topics: string[];
    };

    // Load all referenced topics
    const articleTopics = await Promise.all(
      topics.map(async (id) => {
        const topicPath = path.join(topicsDir, `${id}.mdita`);
        try {
          const topicContent = await fs.readFile(topicPath, 'utf8');
          const { metadata: topicMetadata } = parseMetadata(topicContent, 'topic');
          return {
            id,
            content: topicContent,
            metadata: topicMetadata as TopicMetadata
          };
        } catch (error) {
          console.error(`Error loading topic ${id}:`, error);
          return null;
        }
      })
    );

    // Filter out failed topic loads
    const validTopics = articleTopics.filter((topic): topic is NonNullable<typeof topic> => topic !== null);
    
    // Use first topic's content as main content if available
    const mainContent = validTopics.length > 0 ? validTopics[0].content : '';
    
    return {
      slug,
      content: mainContent,
      metadata,
      topics: validTopics
    };
  } catch (error) {
    console.error(`Error fetching article ${slug}:`, error);
    return null;
  }
}

export async function getDocs(): Promise<Article[]> {
  const contentDir = path.join(process.cwd(), 'content/docs');
  
  try {
    const filenames = await fs.readdir(contentDir);
    console.log('Found doc files:', filenames);
    
    const docs = await Promise.all(
      filenames
        .filter((name) => name.endsWith('.mdita') || name.endsWith('.md'))
        .map(async (filename) => {
          const filePath = path.join(contentDir, filename);
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const { metadata } = parseMetadata(content);
            const slug = filename.replace(/\.(mdita|md)$/, '');
            
            return {
              slug,
              content: '', // We don't need the full content for the index
              metadata: metadata as MapMetadata,
            };
          } catch (error) {
            console.error(`Error processing doc ${filename}:`, error);
            return null;
          }
        })
    );

    const filteredDocs = docs
      .filter((doc): doc is Article => doc !== null)
      .filter((doc) => doc.metadata.publish !== false);
    
    console.log('Filtered docs:', filteredDocs.length);
    
    return filteredDocs.sort((a, b) => {
      if (!a.metadata.order && !b.metadata.order) return 0;
      if (!a.metadata.order) return 1;
      if (!b.metadata.order) return -1;
      return (a.metadata.order as number) - (b.metadata.order as number);
    });
  } catch (error) {
    console.error('Error fetching docs:', error);
    return [];
  }
}

export async function getDocBySlug(slug: string): Promise<Article | null> {
  const contentDir = path.join(process.cwd(), 'content/docs');
  
  // Try both .mdita and .md extensions
  const extensions = ['.mdita', '.md'];
  
  for (const ext of extensions) {
    const filePath = path.join(contentDir, `${slug}${ext}`);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const { metadata } = parseMetadata(content);
      
      return {
        slug,
        content,
        metadata: metadata as MapMetadata,
      };
    } catch (error) {
      // Continue to next extension if file not found
      continue;
    }
  }
  
  console.error(`Error fetching doc ${slug}: No matching file found`);
  return null;
} 