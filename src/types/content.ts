export interface BaseMetadata {
  title: string;
  author?: string;
  date?: string;
  audience?: string | string[];
  tags?: string[];
  category?: string;
  region?: string;
  shortdesc?: string;
}

export interface TopicMetadata extends BaseMetadata {
  id: string;
  publish?: boolean;
  conditional?: {
    [key: string]: any;  // Flexible conditional flags
  };
}

export interface MapMetadata extends BaseMetadata {
  id: string;
  publish: boolean;  // Required for maps
  topics: string[];  // References to topic IDs
  category: string;  // Required for maps
  access_level: 'public' | 'restricted' | 'classified';
  publish_date?: string;
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