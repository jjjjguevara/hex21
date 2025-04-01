import { getContentSlugs, getArticleData } from '@/lib/content.server';
import { Card } from '@radix-ui/themes';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Featured',
  description: 'Browse our featured scientific articles and research papers.',
  keywords: ['featured', 'articles', 'research', 'science'],
};

async function getFeaturedArticles() {
  const slugs = await getContentSlugs();
  const articles = await Promise.all(
    slugs.map(async (slug) => {
      const article = await getArticleData(slug);
      if (!article || !article.metadata.publish || !article.metadata.features?.featured) {
        return null;
      }
      return {
        slug,
        ...article.metadata
      };
    })
  );

  return articles.filter((a): a is NonNullable<typeof a> => a !== null);
}

export default async function FeaturedPage() {
  const articles = await getFeaturedArticles();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Featured Articles</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Link key={article.slug} href={`/articles/${article.slug}`}>
            <Card className="h-full hover:shadow-lg transition-shadow duration-200">
              {article.coverImage && (
                <div className="relative h-48 mb-4">
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                </div>
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {article.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {article.shortdesc || 'No description available'}
                </p>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {articles.length === 0 && (
        <p className="text-center text-gray-600 dark:text-gray-400">
          No featured articles found.
        </p>
      )}
    </div>
  );
} 