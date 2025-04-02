'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { Article } from '@/types/content';

type SortConfig = {
  key: keyof Article['metadata'] | 'slug';
  direction: 'asc' | 'desc';
};

type Column = {
  label: string;
  key: keyof Article['metadata'] | 'slug';
  sortable: boolean;
  render?: (article: Article) => React.ReactNode;
};

const columns: Column[] = [
  { 
    label: 'Title', 
    key: 'title', 
    sortable: true,
    render: (article) => (
      <Link 
        href={`/articles/${article.slug}`}
        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
      >
        {article.metadata.title || article.slug}
      </Link>
    )
  },
  { 
    label: 'Description', 
    key: 'shortdesc', 
    sortable: false,
    render: (article) => (
      <div className="max-w-md">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 whitespace-normal">
          {article.metadata.shortdesc || 'No description available'}
        </p>
      </div>
    )
  },
  { 
    label: 'Author', 
    key: 'author', 
    sortable: true,
    render: (article) => {
      const author = article.metadata.author;
      if (!author) return 'Unknown';
      if (typeof author === 'string') return author;
      return author.name || 'Unknown';
    }
  },
  { 
    label: 'Category', 
    key: 'category', 
    sortable: true,
    render: (article) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-800">
        {article.metadata.category || 'Uncategorized'}
      </span>
    )
  },
  { 
    label: 'Tags', 
    key: 'tags', 
    sortable: false,
    render: (article) => (
      <div className="flex flex-wrap gap-2">
        {article.metadata.tags?.map((tag: string) => (
          <span 
            key={tag}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
          >
            {tag}
          </span>
        ))}
      </div>
    )
  },
  { 
    label: 'Published', 
    key: 'date', 
    sortable: true,
    render: (article) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {article.metadata.date ? 
          new Date(article.metadata.date).toLocaleDateString() : 
          'Not specified'}
      </span>
    )
  },
];

interface ArticlesTableProps {
  articles: Article[];
  selectedTags: string[];
  selectedCategories: string[];
  onTagSelect: (tag: string) => void;
  onCategorySelect: (category: string) => void;
}

export default function ArticlesTable({ 
  articles,
  selectedTags,
  selectedCategories,
  onTagSelect,
  onCategorySelect
}: ArticlesTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Filter articles based on search term, selected tags, and categories
  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchTerm === '' || 
      article.metadata.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.metadata.shortdesc?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => article.metadata.tags?.includes(tag));

    const matchesCategories = selectedCategories.length === 0 || 
      (article.metadata.category && selectedCategories.includes(article.metadata.category));

    return matchesSearch && matchesTags && matchesCategories;
  });

  // Sort filtered articles
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (sortConfig.key === 'slug') {
      return sortConfig.direction === 'asc' 
        ? a.slug.localeCompare(b.slug) 
        : b.slug.localeCompare(a.slug);
    }

    const aValue = a.metadata[sortConfig.key as keyof typeof a.metadata] || '';
    const bValue = b.metadata[sortConfig.key as keyof typeof b.metadata] || '';

    if (Array.isArray(aValue) || Array.isArray(bValue)) {
      const aLength = Array.isArray(aValue) ? aValue.length : 0;
      const bLength = Array.isArray(bValue) ? bValue.length : 0;
      return sortConfig.direction === 'asc' ? aLength - bLength : bLength - aLength;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    }

    return 0;
  });

  const SortIcon = ({ column }: { column: Column }) => {
    if (!column.sortable) return null;

    const isActive = sortConfig.key === column.key;
    const Icon = isActive && sortConfig.direction === 'desc' ? ChevronDownIcon : ChevronUpIcon;

    return (
      <Icon
        className={`ml-1 h-4 w-4 inline-block transition-colors ${
          isActive ? 'text-blue-500' : 'text-gray-400'
        }`}
      />
    );
  };

  // Get all unique tags and categories for the filter UI
  const allTags = Array.from(new Set(articles.flatMap(article => article.metadata.tags || [])));
  const allCategories = Array.from(new Set(articles
    .map(article => article.metadata.category)
    .filter((category): category is string => !!category)
  ));

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
        <div className="flex flex-col space-y-4">
          {/* Search Input */}
          <div>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Categories Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => onCategorySelect(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategories.includes(category)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagSelect(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <span className="flex items-center">
                    {column.label}
                    <SortIcon column={column} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedArticles.map((article) => (
              <tr key={article.slug} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {columns.map((column) => (
                  <td 
                    key={column.key} 
                    className={`px-6 py-4 ${
                      column.key === 'shortdesc' 
                        ? 'max-w-md' 
                        : 'whitespace-nowrap'
                    }`}
                  >
                    {column.render ? column.render(article) : (
                      column.key === 'slug' ? article.slug : (
                        typeof article.metadata[column.key as keyof typeof article.metadata] === 'object' 
                          ? JSON.stringify(article.metadata[column.key as keyof typeof article.metadata]) 
                          : String(article.metadata[column.key as keyof typeof article.metadata] || '')
                      )
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {sortedArticles.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No articles found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
} 