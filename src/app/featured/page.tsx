import { getDocData } from '@/lib/content.server';
import { Article, MapMetadata, TopicMetadata } from '@/types/content';
import { Card } from '@radix-ui/themes';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import ContentPane from '@/components/ContentPane';

export const metadata: Metadata = {
  title: 'Featured',
  description: 'Browse our featured scientific articles and research papers.',
  keywords: ['featured', 'articles', 'research', 'science'],
};

// Helper type guard function
function isMapMetadataWithFeatures(metadata: MapMetadata | TopicMetadata): metadata is MapMetadata {
  return metadata && typeof metadata === 'object' && 'features' in metadata;
}

export default async function FeaturedPage() {
  // Import getArticles function to get all articles
  const { getArticles } = await import('@/lib/articles');
  
  // Get all articles
  const allArticles = await getArticles();

  // Filter for featured and published articles
  const featuredArticles = allArticles.filter(article => {
    // Basic check
    if (!article?.metadata) return false;

    // Check if published
    const isPublished = article.metadata.publish === true;
    if (!isPublished) return false;

    // Check for featured flag - using direct property rather than nested features
    const isFeatured = article.metadata.featured === true;
    
    return isFeatured;
  });

  return (
    <ContentPane width="wide">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Featured Articles</h1>
      </div>
      
      {featuredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredArticles.map((article) => (
            <Link key={article.slug} href={`/articles/${article.slug}`} passHref>
              <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                {article.metadata.coverImage && (
                  <div className="relative h-48 mb-4">
                    <Image
                      src={article.metadata.coverImage}
                      alt={article.metadata.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    {article.metadata.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {article.metadata.shortdesc || 'No description available'}
                  </p>
                  {article.metadata.tags && article.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {article.metadata.tags.map((tag) => (
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
      ) : (
        <p className="text-center text-gray-600 dark:text-gray-400">
          No featured articles found.
        </p>
      )}
    </ContentPane>
  );
} 