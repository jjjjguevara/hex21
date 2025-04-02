export interface BaseMetadata {
  title: string;
  author?: string | { name: string; affiliation?: string; email?: string };
  date?: string;
  audience?: string | string[];
  tags?: string[];
  category?: string;
  region?: string;
  shortdesc?: string;
  coverImage?: string;
}

export interface TopicMetadata extends BaseMetadata {
  id?: string;
  publish?: boolean;
  conditional?: {
    [key: string]: any;  // Flexible conditional flags
  };
}

export interface MapMetadata extends BaseMetadata {
  id?: string;
  publish?: boolean;  // Optional for backward compatibility
  topics?: string[];  // Optional for backward compatibility
  category?: string;  // Optional for backward compatibility
  access_level?: 'public' | 'restricted' | 'classified';
  publish_date?: string;
  lastEdited?: string;
  editor?: string;
  reviewer?: string;
  version?: string;
  language?: string;
  features?: {
    featured?: boolean;
    [key: string]: any;  // Other feature flags
  };
}

export interface Article {
  slug: string;
  content: string;
  metadata: MapMetadata;
  topics?: Array<{
    id: string;
    metadata: TopicMetadata;
    content: string;
  }>;
  html?: string;
}

export interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  score: number;
  category: string;
}

export interface SearchIndex {
  store: Record<string, {
    title: string;
    content: string;
    tags: string[];
    category: string;
  }>;
  index: any;
}

export type Category = {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
} 