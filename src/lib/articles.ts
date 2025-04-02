import { getContentSlugs, getArticleData } from './content.server';
import { Article } from '@/types/content';

export async function getArticles(): Promise<Article[]> {
  const slugs = await getContentSlugs();
  const articles = await Promise.all(
    slugs.map(async (slug) => {
      const article = await getArticleData(slug);
      if (!article || !article.metadata.publish) return null;
      return {
        ...article,
        content: article.content.replace(/<[^>]*>/g, ' ').trim(), // Strip HTML and trim whitespace
        metadata: {
          ...article.metadata,
          // Ensure consistent date format
          date: article.metadata.date ? new Date(article.metadata.date).toISOString() : undefined
        }
      };
    })
  );

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