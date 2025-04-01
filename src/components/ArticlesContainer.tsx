'use client';

import { useState } from 'react';
import { Article } from '@/types/content';
import CategoryFilter from './CategoryFilter';
import ArticleList from './ArticleList';

interface ArticlesContainerProps {
  initialArticles: Article[];
  categories: string[];
}

export default function ArticlesContainer({ initialArticles, categories }: ArticlesContainerProps) {
  const [filteredArticles, setFilteredArticles] = useState<Article[]>(initialArticles);

  return (
    <>
      <CategoryFilter 
        categories={categories} 
        articles={initialArticles} 
        onFilter={setFilteredArticles} 
      />
      <ArticleList articles={filteredArticles} />
    </>
  );
} 