'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SearchResult } from '@/types/content';
import { search } from '@/lib/search';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchIndex, setSearchIndex] = useState<any>(null);

  useEffect(() => {
    // Load the search index on component mount
    fetch('/search-index.json')
      .then((res) => res.json())
      .then((index) => setSearchIndex(index))
      .catch((error) => console.error('Error loading search index:', error));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchIndex || !query.trim()) {
      setResults([]);
      return;
    }

    const searchResults = search(query, searchIndex);
    setResults(searchResults);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Search Articles</h1>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles..."
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
        </div>
      </form>

      {results.length > 0 ? (
        <div className="space-y-8">
          {results.map((result) => (
            <article key={result.slug} className="border-b pb-8">
              <h2 className="text-2xl font-semibold mb-2">
                <Link
                  href={`/articles/${result.slug}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {result.title}
                </Link>
              </h2>
              <p className="text-gray-600">{result.excerpt}</p>
              <p className="text-sm text-gray-500 mt-2">
                Relevance: {Math.round(result.score * 100)}%
              </p>
            </article>
          ))}
        </div>
      ) : query ? (
        <p className="text-gray-600">No results found for "{query}"</p>
      ) : null}
    </div>
  );
} 