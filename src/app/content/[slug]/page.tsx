import { notFound } from 'next/navigation';
import { ContentLoader } from '@/lib/content/loader';
import { MarkdownContent } from '@/components/MarkdownContent';

interface ContentPageProps {
  params: {
    slug: string;
  };
}

// Initialize content loader
const contentLoader = new ContentLoader('content');

// Enable ISR with a 1-hour revalidation period
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const contentLoader = new ContentLoader();
    const publishedContent = await contentLoader.getPublishedContent();
    
    // Limit the number of pages to generate statically
    const limitedSlugs = publishedContent.slice(0, 50);
    
    return limitedSlugs.map((slug) => ({
      slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function ContentPage({ params }: ContentPageProps) {
  const contentLoader = new ContentLoader();
  
  try {
    const content = await contentLoader.loadContent(params.slug);
    
    if (!content.metadata?.publish) {
      notFound();
    }
    
    return (
      <article className="content-article">
        <div dangerouslySetInnerHTML={{ __html: content.html }} />
      </article>
    );
  } catch (error) {
    if ((error as Error).message.includes('Content not found')) {
      notFound();
    }
    throw error;
  }
} 