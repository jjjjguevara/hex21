'use client';

import { marked } from 'marked';
import hljs from 'highlight.js';

// Configure marked with syntax highlighting
const renderer = new marked.Renderer();
const originalCodeRenderer = renderer.code;
renderer.code = function({ text, lang, escaped, type, raw }) {
  if (lang && hljs.getLanguage(lang)) {
    try {
      const highlighted = hljs.highlight(text, { language: lang }).value;
      return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
    } catch (err) {
      console.error('Error highlighting code:', err);
    }
  }
  return originalCodeRenderer.call(this, { text, lang, escaped, type: type || 'code', raw: raw || text });
};

marked.setOptions({
  renderer,
  breaks: true,
  gfm: true
});

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