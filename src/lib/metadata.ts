import matter from 'gray-matter';
import { Metadata } from '@/types/content';

export function parseMetadata(content: string): { metadata: Metadata; content: string } {
  const { data, content: parsedContent } = matter(content);
  
  // Ensure required fields and types
  const metadata: Metadata = {
    title: data.title || 'Untitled',
    publish: data.publish ?? false,
    author: data.author,
    date: data.date,
    audience: data.audience,
    tags: Array.isArray(data.tags) ? data.tags : [],
    region: data.region,
  };

  return {
    metadata,
    content: parsedContent,
  };
}

export function validateMetadata(metadata: Metadata): string[] {
  const errors: string[] = [];

  if (!metadata.title) {
    errors.push('Title is required');
  }

  if (metadata.audience && !['beginner', 'intermediate', 'expert'].includes(metadata.audience)) {
    errors.push('Invalid audience value');
  }

  if (metadata.tags && !Array.isArray(metadata.tags)) {
    errors.push('Tags must be an array');
  }

  return errors;
} 