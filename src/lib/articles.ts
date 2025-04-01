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
        content: article.content.replace(/<[^>]*>/g, ' ') // Strip HTML for search
      };
    })
  );

  return articles.filter((article): article is NonNullable<typeof article> => article !== null);
} 