'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { search } from '@/lib/search';
import { Command } from 'cmdk';

interface CommandPaletteProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function CommandPalette({ isOpen, setIsOpen }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setIsOpen, isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search function
  const debouncedSearch = useCallback(
    async (value: string) => {
      if (!value.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchResults = await search(value);
        setResults(searchResults || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Use effect for debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, debouncedSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-x-0 top-[20%] mx-auto max-w-xl">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
          <Command className="relative" shouldFilter={false}>
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
              <svg
                className="h-5 w-5 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Command.Input
                ref={inputRef}
                value={query}
                onValueChange={setQuery}
                placeholder="Search articles, documentation, and topics..."
                className="w-full px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-transparent border-0 focus:outline-none focus:ring-0"
              />
              <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                esc
              </kbd>
            </div>
            <Command.List className="max-h-96 overflow-y-auto p-2">
              {loading ? (
                <Command.Loading>
                  <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Searching...
                  </div>
                </Command.Loading>
              ) : results.length > 0 ? (
                <Command.Group>
                  {results.map((result) => (
                    <Command.Item
                      key={result.slug}
                      onSelect={() => {
                        router.push(`/${result.type}s/${result.slug}`);
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-4 px-4 py-2 text-sm text-gray-900 dark:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                        {result.type === 'article' ? '📄' : result.type === 'doc' ? '📚' : '📝'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{result.title}</div>
                        {(result.excerpt || result.description) && (
                          <div className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 mt-1">
                            {result.excerpt || result.description}
                          </div>
                        )}
                        {result.tags && result.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {result.tags.slice(0, 3).map((tag: string) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : query ? (
                <Command.Empty>
                  <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No results found for &quot;{query}&quot;
                  </div>
                </Command.Empty>
              ) : null}
            </Command.List>
          </Command>
        </div>
      </div>
    </div>
  );
} 