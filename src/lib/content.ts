'use client';

import { marked } from 'marked';
import hljs from 'highlight.js';

export async function getAllArticles() {
  try {
    const response = await fetch('/api/articles');
    if (!response.ok) {
      throw new Error(`Failed to fetch articles: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

export async function getCategories() {
  try {
    const response = await fetch('/api/categories');
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getArticleBySlug(slug: string) {
  try {
    const response = await fetch(`/api/articles/${slug}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch article: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

export async function getDocs() {
  try {
    const response = await fetch('/api/docs');
    if (!response.ok) {
      throw new Error(`Failed to fetch docs: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching docs:', error);
    return [];
  }
}

export async function getDocBySlug(slug: string) {
  try {
    const response = await fetch(`/api/docs/${slug}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch doc: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching doc:', error);
    return null;
  }
} 