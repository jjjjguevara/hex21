import { getArticles } from '@/lib/articles';
import ArticlesContainer from '@/components/ArticlesContainer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Browse our collection of scientific articles and research papers.',
  keywords: ['articles', 'research', 'science', 'publications'],
};

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Articles</h1>
      <ArticlesContainer articles={articles} />
    </div>
  );
} 