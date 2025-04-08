import path from 'path';
import { promises as fs } from 'fs';
import { Article, Doc, MapMetadata, TopicMetadata } from '@/types/content';
import { getDocData } from './content.server';

const ARTICLES_PATH = path.join(process.cwd(), 'content/articles');

// Helper function to check if metadata has required fields for an Article
function isArticleMetadata(metadata: any): metadata is TopicMetadata & { title: string, date: string } {
  return metadata && typeof metadata.title === 'string' && typeof metadata.date === 'string';
}

// Fetches slugs for all articles (assuming a flat structure in content/articles)
// Placeholder: Replace this with actual logic if needed.
// It might involve reading directory contents.
async function getArticleSlugs(): Promise<string[]> {
  console.warn("Using placeholder getArticleSlugs. Replace with actual implementation.");
  try {
    const dirents = await fs.readdir(ARTICLES_PATH, { withFileTypes: true });
    return dirents
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.md'))
      .map(dirent => dirent.name.replace(/\.md$/, ''));
  } catch (error) {
    console.error("Error reading articles directory:", error);
    return []; // Return empty array on error
  }
}

// Fetches all articles with basic metadata for listing
export async function getArticles(): Promise<Article[]> {
  const slugs = await getArticleSlugs();
  const articlesPromises = slugs.map(async (slug) => {
    try {
      const docData = await getDocData(slug);
      if (docData && isArticleMetadata(docData.metadata)) {
        return {
          ...docData,
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
    } catch (error) {
      console.error(`Failed to get data for article slug ${slug}:`, error);
    }
    return null;
  });

  const articles = (await Promise.all(articlesPromises)).filter(Boolean) as Article[];

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