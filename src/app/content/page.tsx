import { ContentLoader } from '@/lib/content/loader';
import { ProcessedContent } from '@/lib/markdown/types';
import Link from 'next/link';

export const revalidate = 3600; // Revalidate content list every hour

interface ContentItem {
  slug: string;
  content: ProcessedContent;
}

export default async function ContentListPage() {
  const contentLoader = new ContentLoader();
  const publishedSlugs = await contentLoader.getPublishedContent();
  
  // Load all published content
  const contentPromises = publishedSlugs.map(async (slug) => {
    try {
      const content = await contentLoader.loadContent(slug);
      return { slug, content } as ContentItem;
    } catch (error) {
      console.error(`Error loading content for ${slug}:`, error);
      return null;
    }
  });
  
  const contentList = (await Promise.all(contentPromises))
    .filter((item): item is ContentItem => item !== null)
    .sort((a, b) => {
      const dateA = new Date(a.content.metadata.date || 0);
      const dateB = new Date(b.content.metadata.date || 0);
      return dateB.getTime() - dateA.getTime();
    });

  return (
    <div className="content-list">
      <h1>Content</h1>
      <div className="grid gap-4">
        {contentList.map(({ slug, content }) => (
          <article key={slug} className="content-card">
            <Link href={`/content/${slug}`}>
              <h2>{content.metadata.title || 'Untitled'}</h2>
              {content.metadata.shortdesc && (
                <p className="description">{content.metadata.shortdesc}</p>
              )}
              <div className="metadata">
                {content.metadata.date && (
                  <time dateTime={content.metadata.date}>
                    {new Date(content.metadata.date).toLocaleDateString()}
                  </time>
                )}
                {content.metadata.author && (
                  <span className="author">By {content.metadata.author}</span>
                )}
                {content.metadata.tags && content.metadata.tags.length > 0 && (
                  <div className="tags">
                    {content.metadata.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
} 