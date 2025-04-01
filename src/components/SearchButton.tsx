'use client';

import { useState } from 'react';

interface SearchButtonProps {
  setIsOpen: (isOpen: boolean) => void;
}

export default function SearchButton({ setIsOpen }: SearchButtonProps) {
  return (
    <button
      onClick={() => setIsOpen(true)}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
    >
      <svg
        className="h-4 w-4"
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
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:text-gray-400">
        ⌘K
      </kbd>
    </button>
  );
} 