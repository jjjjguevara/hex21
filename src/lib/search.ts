import lunr from 'lunr';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { parseMap } from './dita';
import { Article } from '@/types/content';

let searchIndex: lunr.Index | null = null;
let documents: Record<string, any> = {};

async function getAllDocs() {
  const docsDir = path.join(process.cwd(), 'content/docs');
  const files = await fs.readdir(docsDir, { recursive: true });
  
  return Promise.all(
    files
      .filter(file => file.endsWith('.mdita') || file.endsWith('.md'))
      .map(async (file) => {
        const filePath = path.join(docsDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const { data: metadata, content: mdContent } = matter(content);
        const slug = file.replace(/\.(mdita|md)$/, '');
        
        return {
          slug: `docs/${slug}`,
          type: 'documentation',
          title: metadata.title || slug,
          content: mdContent,
          ...metadata
        };
      })
  );
}

async function getAllTopics() {
  const topicsDir = path.join(process.cwd(), 'content/topics');
  const files = await fs.readdir(topicsDir);
  
  return Promise.all(
    files
      .filter(file => file.endsWith('.mdita'))
      .map(async (file) => {
        const filePath = path.join(topicsDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const { data: metadata, content: mdContent } = matter(content);
        const slug = file.replace(/\.mdita$/, '');
        
        return {
          slug: `topics/${slug}`,
          type: 'topic',
          title: metadata.title || slug,
          content: mdContent,
          ...metadata
        };
      })
  );
}

export async function buildSearchIndex() {
  if (searchIndex) return { searchIndex, documents };

  try {
    // Get articles from maps
    const mapsDir = path.join(process.cwd(), 'content/maps');
    const files = await fs.readdir(mapsDir);
    const mapFiles = files.filter(file => file.endsWith('.ditamap'));
    
    const articles = await Promise.all(
      mapFiles.map(async (file) => {
        const slug = file.replace(/\.ditamap$/, '');
        const filePath = path.join(mapsDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        try {
          const { metadata, topics } = await parseMap(content);

          // Load topic contents
          const topicContents = await Promise.all(
            topics.map(async (topicPath) => {
              const normalizedPath = topicPath.replace(/^\.\.\//, '');
              const fullPath = path.join(process.cwd(), 'content', normalizedPath);
              try {
                const topicContent = await fs.readFile(fullPath, 'utf8');
                const { content: mdContent } = matter(topicContent);
                return mdContent;
              } catch (error) {
                console.warn(`Could not read topic file ${fullPath}:`, error);
                return '';
              }
            })
          );

          return {
            slug: `articles/${slug}`,
            type: 'article',
            ...metadata,
            content: topicContents.join('\n')
          };
        } catch (error) {
          console.warn(`Error processing map file ${file}:`, error);
          return null;
        }
      })
    );

    // Get all content types
    const [docs, topics] = await Promise.all([
      getAllDocs(),
      getAllTopics()
    ]);

    const validArticles = articles.filter((a): a is NonNullable<typeof a> => a !== null);
    const allContent = [...validArticles, ...docs, ...topics];

    // Build the index
    searchIndex = lunr(function () {
      // Make search case-insensitive
      this.use(lunr.tokenizer.separator(/[\s\-]+/));
      this.pipeline.remove(lunr.stemmer);
      this.searchPipeline.remove(lunr.stemmer);

      this.field('title', { boost: 10 });
      this.field('content');
      this.field('tags', { boost: 5 });
      this.field('category', { boost: 5 });
      this.field('type', { boost: 3 });
      this.ref('slug');

      allContent.forEach((doc) => {
        // Only index published content or content without a publish flag
        if (doc.publish === false) return;

        this.add({
          slug: doc.slug,
          title: doc.title?.toLowerCase() || '',
          content: doc.content?.toLowerCase() || '',
          tags: doc.tags?.join(' ')?.toLowerCase() || '',
          category: doc.category?.toLowerCase() || '',
          type: doc.type
        });
        // Store the document data for retrieval
        documents[doc.slug] = doc;
      });
    });

    return { searchIndex, documents };
  } catch (error) {
    console.error('Error building search index:', error);
    throw error;
  }
}

export async function search(query: string) {
  try {
    const response = await fetch('/api/search?q=' + encodeURIComponent(query.toLowerCase()));
    if (!response.ok) {
      throw new Error('Search failed');
    }
    return await response.json();
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}