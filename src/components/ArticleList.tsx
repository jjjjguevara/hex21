'use client';

import Link from 'next/link';
import { Article } from '@/types/content';

interface ArticleListProps {
  articles: Article[];
}

export default function ArticleList({ articles }: ArticleListProps) {
  return (
    <div className="space-y-8">
      {articles.map((article) => (
        <article key={article.slug} className="border-b pb-8 last:border-b-0">
          <h2 className="text-2xl font-semibold mb-2">
            <Link 
              href={`/articles/${article.slug}`}
              className="text-blue-600 hover:text-blue-800"
            >
              {article.metadata.title || article.slug}
            </Link>
          </h2>
          {article.metadata.author && (
            <p className="text-gray-600 mb-2">By {article.metadata.author}</p>
          )}
          <p className="text-gray-600 mb-2">
            Category: {article.metadata.category}
          </p>
          {article.metadata.audience && (
            <p className="text-gray-600 mb-2">
              Audience: {article.metadata.audience}
            </p>
          )}
          {article.metadata.access_level !== 'public' && (
            <p className="text-amber-600 mb-2">
              Access Level: {article.metadata.access_level}
            </p>
          )}
          {article.metadata.tags && article.metadata.tags.length > 0 && (
            <div className="flex gap-2 mb-2">
              {article.metadata.tags.map((tag) => (
                <span 
                  key={tag}
                  className="bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
} 