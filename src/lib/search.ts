import lunr from 'lunr';
import { SearchResult, SearchIndex } from '@/types/content';

export function createSearchIndex(documents: Array<{ slug: string; title: string; content: string; tags: string[] }>): SearchIndex {
  const store: SearchIndex['store'] = {};

  const idx = lunr(function(this: lunr.Builder) {
    this.field('title', { boost: 10 });
    this.field('content');
    this.field('tags', { boost: 5 });
    this.ref('slug');

    documents.forEach(({ slug, title, content, tags }) => {
      store[slug] = { title, content, tags };
      this.add({ slug, title, content, tags: tags.join(' ') });
    });
  });

  return {
    store,
    index: idx
  };
}

export function search(query: string, searchIndex: SearchIndex): SearchResult[] {
  try {
    const results = searchIndex.index.search(query);
    return results.map((result: lunr.Index.Result) => {
      const { title, content } = searchIndex.store[result.ref];
      const excerpt = content.substring(0, 150) + '...';

      return {
        slug: result.ref,
        title,
        excerpt,
        score: result.score
      };
    });
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
} 