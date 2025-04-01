import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import lunr from 'lunr';
import { parseMap } from './dita';
import { Article } from '@/types/content';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: 'article' | 'doc' | 'topic';
  slug: string;
  description?: string;
  author?: string;
  date?: string;
  tags?: string[];
  score?: number;
}

interface SearchIndex {
  [key: string]: SearchResult;
}

let searchIndex: lunr.Index | null = null;
let documents: Record<string, any> = {};

async function getAllArticles() {
  const mapsDir = join(process.cwd(), 'content/maps');
  const topicsDir = join(process.cwd(), 'content/topics');
  const files = await readdir(mapsDir);
  
  return Promise.all(
    files
      .filter(file => file.endsWith('.ditamap'))
      .map(async (file) => {
        const filePath = join(mapsDir, file);
        const content = await readFile(filePath, 'utf8');
        const slug = file.replace(/\.ditamap$/, '');
        
        try {
          const { metadata, topics } = await parseMap(content);
          
          // Load topic contents
          const topicContents = await Promise.all(
            topics.map(async (topicId) => {
              const topicPath = join(topicsDir, `${topicId}.mdita`);
              try {
                const topicContent = await readFile(topicPath, 'utf8');
                const { content: mdContent } = matter(topicContent);
                return mdContent;
              } catch (error) {
                console.warn(`Could not read topic file ${topicPath}:`, error);
                return '';
              }
            })
          );
          
          return {
            slug,
            type: 'article',
            title: metadata.title || slug,
            content: topicContents.join('\n'),
            ...metadata
          };
        } catch (error) {
          console.warn(`Error processing map file ${file}:`, error);
          return null;
        }
      })
  );
}

async function getAllDocs() {
  const docsDir = join(process.cwd(), 'content/docs');
  const files = await readdir(docsDir, { recursive: true });
  
  return Promise.all(
    files
      .filter(file => file.endsWith('.mdita') || file.endsWith('.md'))
      .map(async (file) => {
        const filePath = join(docsDir, file);
        const content = await readFile(filePath, 'utf8');
        const { data: metadata, content: mdContent } = matter(content);
        const slug = file.replace(/\.(mdita|md)$/, '');
        
        return {
          slug,
          type: 'documentation',
          title: metadata.title || slug,
          content: mdContent,
          ...metadata
        };
      })
  );
}

async function getAllTopics() {
  const topicsDir = join(process.cwd(), 'content/topics');
  const files = await readdir(topicsDir);
  
  return Promise.all(
    files
      .filter(file => file.endsWith('.mdita'))
      .map(async (file) => {
        const filePath = join(topicsDir, file);
        const content = await readFile(filePath, 'utf8');
        const { data: metadata, content: mdContent } = matter(content);
        const slug = file.replace(/\.mdita$/, '');
        
        return {
          slug,
          type: 'topic',
          title: metadata.title || slug,
          content: mdContent,
          ...metadata
        };
      })
  );
}

export async function buildSearchIndex(): Promise<SearchIndex> {
  const index: SearchIndex = {};

  // Index articles from maps
  const mapsDir = join(process.cwd(), 'content/maps');
  const mapFiles = await readdir(mapsDir);
  
  for (const mapFile of mapFiles) {
    if (!mapFile.endsWith('.ditamap')) continue;
    
    const mapContent = await readFile(join(mapsDir, mapFile), 'utf-8');
    const { data: mapData } = matter(mapContent);
    
    // Only index if not explicitly unlisted
    if (mapData.indexed !== false) {
      index[mapFile] = {
        id: mapFile,
        title: mapData.title || mapFile,
        content: mapContent,
        type: 'article',
        slug: mapFile.replace('.ditamap', ''),
        description: mapData.description,
        author: mapData.author,
        date: mapData.date,
        tags: mapData.tags
      };
    }
  }

  // Index documentation
  const docsDir = join(process.cwd(), 'content/docs');
  const docFiles = await readdir(docsDir);
  
  for (const docFile of docFiles) {
    if (!docFile.endsWith('.mdita') && !docFile.endsWith('.md')) continue;
    
    const docContent = await readFile(join(docsDir, docFile), 'utf-8');
    const { data: docData } = matter(docContent);
    
    // Only index if not explicitly unlisted
    if (docData.indexed !== false) {
      index[docFile] = {
        id: docFile,
        title: docData.title || docFile,
        content: docContent,
        type: 'doc',
        slug: docFile.replace(/\.(mdita|md)$/, ''),
        description: docData.description,
        author: docData.author,
        date: docData.date,
        tags: docData.tags
      };
    }
  }

  // Index topics
  const topicsDir = join(process.cwd(), 'content/topics');
  const topicFiles = await readdir(topicsDir);
  
  for (const topicFile of topicFiles) {
    if (!topicFile.endsWith('.mdita')) continue;
    
    const topicContent = await readFile(join(topicsDir, topicFile), 'utf-8');
    const { data: topicData } = matter(topicContent);
    
    // Only index if not explicitly unlisted
    if (topicData.indexed !== false) {
      index[topicFile] = {
        id: topicFile,
        title: topicData.title || topicFile,
        content: topicContent,
        type: 'topic',
        slug: topicFile.replace('.mdita', ''),
        description: topicData.description,
        author: topicData.author,
        date: topicData.date,
        tags: topicData.tags
      };
    }
  }

  return index;
}

export async function searchContent(query: string): Promise<SearchResult[]> {
  const index = await buildSearchIndex();
  const results: SearchResult[] = [];
  
  const searchTerms = query.toLowerCase().split(' ');
  
  for (const [id, doc] of Object.entries(index)) {
    const content = doc.content.toLowerCase();
    const title = doc.title.toLowerCase();
    
    // Calculate match score
    let score = 0;
    
    for (const term of searchTerms) {
      // Title matches are worth more
      if (title.includes(term)) {
        score += 2;
      }
      
      // Content matches
      if (content.includes(term)) {
        score += 1;
      }
    }
    
    if (score > 0) {
      results.push({
        ...doc,
        score
      });
    }
  }
  
  // Sort by score and type
  return results.sort((a, b) => {
    if (b.score! - a.score! !== 0) {
      return b.score! - a.score!;
    }
    return a.type.localeCompare(b.type);
  });
} 