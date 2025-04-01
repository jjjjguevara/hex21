export interface Metadata {
  title: string;
  author?: string;
  date?: string;
  publish: boolean;
  audience?: 'beginner' | 'intermediate' | 'expert';
  tags?: string[];
  region?: string;
}

export interface Article {
  slug: string;
  content: string;
  metadata: Metadata;
  html?: string; // Transformed HTML content
}

export interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  score: number;
}

export interface SearchIndex {
  store: Record<string, {
    title: string;
    content: string;
    tags: string[];
  }>;
  index: any; // Lunr index type
} 