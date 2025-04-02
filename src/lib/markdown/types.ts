export interface Frontmatter {
  title: string;
  description: string;
  date: string;
  tags: string[];
  publish: boolean;
  audience: string;
  author: string;
}

export interface Metadata {
  title?: string;
  author?: string;
  category?: string;
  audience?: string;
  publish?: boolean;
  access_level?: string;
  tags?: string[];
  shortdesc?: string;
  date?: string;
  features?: {
    featured?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ProcessedContent {
  frontmatter: Frontmatter;
  html: string;
  metadata: Metadata;
  embeds?: Array<string | { source: string; section?: string }>;
  resolvedEmbeds?: ProcessedContent[];
  footnotes?: Array<{ identifier: string; content: string }>;
}

export interface FootnoteDefinition {
  identifier: string;
  label: string;
  content: string;
}

export interface WikiLink {
  target: string;
  alias?: string;
  exists: boolean;
}

export interface Embed {
  source: string;
  section?: string;
  content?: string;
}

export interface Footnote {
  identifier: string;
  content: string;
} 