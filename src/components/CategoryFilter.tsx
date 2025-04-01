'use client';

import { useState } from 'react';
import { Article } from '@/types/content';

interface CategoryFilterProps {
  categories: string[];
  articles: Article[];
  onFilter: (articles: Article[]) => void;
}

export default function CategoryFilter({ categories, articles, onFilter }: CategoryFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const filtered = category === 'all' 
      ? articles 
      : articles.filter(article => article.metadata.category === category);
    onFilter(filtered);
  };

  return (
    <div className="mb-8">
      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
        Filter by Category
      </label>
      <select
        id="category"
        value={selectedCategory}
        onChange={(e) => handleCategoryChange(e.target.value)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="all">All Categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
} 