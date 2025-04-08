import { notFound } from 'next/navigation';
import { ContentLoader } from '@/lib/content/loader';
import { MarkdownContent } from '@/components/MarkdownContent';

interface ContentPageProps {
  params: {
    slug: string[];
  };
}

export default async function ContentPage({ params }: ContentPageProps) {
  const slug = params.slug.join('/');
  const loader = new ContentLoader();

  try {
    // Try loading with .md extension
    let content;
    try {
      content = await loader.loadContent(slug);
    } catch {
      // If that fails, try loading with .mdita extension
      try {
        content = await loader.loadContent(slug.replace(/\.md$/, '') + '.mdita');
      } catch {
        // If both fail, try without any extension
        content = await loader.loadContent(slug.replace(/\.[^/.]+$/, ''));
      }
    }

    return (
      <article className="prose prose-lg mx-auto py-8">
        <MarkdownContent htmlContent={content.html} basePath="/content" assetBasePath="/content/assets" />
      </article>
    );
  } catch (error) {
    console.error('Error loading content:', error);
    notFound();
  }
} 