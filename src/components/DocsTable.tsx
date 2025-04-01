'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';

type Doc = {
  slug: string;
  metadata: {
    title?: string;
    category: string;
    tags?: string[];
    description?: string;
    lastUpdated?: string;
    shortdesc?: string;
    [key: string]: any;
  };
  path: string;
};

type SortConfig = {
  key: keyof Doc['metadata'] | 'slug';
  direction: 'asc' | 'desc';
};

type Column = {
  label: string;
  key: keyof Doc['metadata'] | 'slug';
  sortable: boolean;
};

const columns: Column[] = [
  { label: 'Title', key: 'title', sortable: true },
  { label: 'Description', key: 'shortdesc', sortable: false },
  { label: 'Category', key: 'category', sortable: true },
  { label: 'Tags', key: 'tags', sortable: false },
  { label: 'Last Updated', key: 'lastUpdated', sortable: true },
];

const formatCategory = (category: string): string => {
  // Special cases that should be all caps
  const uppercaseCategories = ['api', 'dita'];
  
  // Replace hyphens with spaces and handle special cases
  const formatted = category.replace(/-/g, ' ');
  
  if (uppercaseCategories.includes(formatted.toLowerCase())) {
    return formatted.toUpperCase();
  }
  
  // Default to capitalize first letter of each word
  return formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function DocsTable({ docs }: { docs: Doc[] }) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'title', direction: 'asc' });

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedDocs = [...docs].sort((a, b) => {
    const aValue = a.metadata[sortConfig.key] || a[sortConfig.key as 'slug'] || '';
    const bValue = b.metadata[sortConfig.key] || b[sortConfig.key as 'slug'] || '';

    if (Array.isArray(aValue) || Array.isArray(bValue)) {
      // For arrays (like tags), compare lengths
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

  return (
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
          {sortedDocs.map((doc) => (
            <tr key={doc.slug} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link 
                  href={`/docs/${doc.slug}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {doc.metadata.title || doc.slug}
                </Link>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {doc.metadata.shortdesc || 'No description available'}
                </p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span>
                  {formatCategory(doc.metadata.category)}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-2">
                  {doc.metadata.tags?.map((tag: string) => (
                    <span 
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                {doc.metadata.lastUpdated ? 
                  new Date(doc.metadata.lastUpdated).toLocaleDateString() : 
                  'Not specified'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 