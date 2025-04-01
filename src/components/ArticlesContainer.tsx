'use client';

import { useState } from 'react';
import { Article } from '@/types/content';
import ArticlesTable from './ArticlesTable';

interface ArticlesContainerProps {
  articles: Article[];
}

export default function ArticlesContainer({ articles }: ArticlesContainerProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <ArticlesTable
      articles={articles}
      selectedTags={selectedTags}
      selectedCategories={selectedCategories}
      onTagSelect={handleTagSelect}
      onCategorySelect={handleCategorySelect}
    />
  );
} 