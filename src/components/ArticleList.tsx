'use client';

import Link from 'next/link';
import { Card } from '@radix-ui/themes';
import { Article, MapMetadata, TopicMetadata } from '@/types/content';

interface ArticleListProps {
  articles: Article[];
}

// Type guard to check for MapMetadata specifically (using access_level as discriminator)
function isMapMetadata(metadata: MapMetadata | TopicMetadata): metadata is MapMetadata {
  return metadata && typeof metadata === 'object' && 'access_level' in metadata;
}

export default function ArticleList({ articles }: ArticleListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => {
        const isMapMeta = isMapMetadata(article.metadata);
        
        return (
          <Link key={article.slug} href={`/articles/${article.slug}`} passHref>
            <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {article.metadata.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {article.metadata.shortdesc || 'No description available'}
                </p>
                {/* Conditionally render access_level block */}
                {isMapMeta && (
                  // Use explicit type assertion as a last resort
                  (article.metadata as MapMetadata).access_level !== 'public' && (
                    <p className="text-amber-600 mb-2">
                      Access Level: {(article.metadata as MapMetadata).access_level}
                    </p>
                  )
                )}
                {/* Render tags if they exist */} 
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
        );
      })}
    </div>
  );
} 