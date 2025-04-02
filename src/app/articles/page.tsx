import { getArticles } from '@/lib/articles';
import ArticlesContainer from '@/components/ArticlesContainer';
import { Metadata } from 'next';
import ContentPane from '@/components/ContentPane';
import MathJaxConfig from '@/components/MathJaxConfig';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Browse our collection of scientific articles and research papers.',
  keywords: ['articles', 'research', 'science', 'publications'],
};

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <>
      <MathJaxConfig />
      <ContentPane width="wide">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-8">Articles</h1>
        </div>
        <ArticlesContainer articles={articles} />
      </ContentPane>
    </>
  );
} 