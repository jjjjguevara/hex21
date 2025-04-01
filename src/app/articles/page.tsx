import { getAllArticles, getCategories } from '@/lib/content';
import ArticlesContainer from '@/components/ArticlesContainer';

export default async function ArticlesPage() {
  const articles = await getAllArticles();
  const categories = await getCategories();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Articles</h1>
      
      {articles.length === 0 ? (
        <p className="text-gray-600">No articles found. Please check the content directory.</p>
      ) : (
        <ArticlesContainer 
          initialArticles={articles} 
          categories={categories} 
        />
      )}
    </div>
  );
} 