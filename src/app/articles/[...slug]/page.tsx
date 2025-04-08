import { notFound } from 'next/navigation';
import { getDocData } from '@/lib/content.server';
import { Article, TocEntry } from '@/types/content'; 
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import MetadataList from '@/components/MetadataList';
import TableOfContents from '@/components/TableOfContents';

// Dynamically import ArticleRenderer with SSR disabled
const ArticleRenderer = dynamic(
  () => import('@/components/ArticleRenderer'),
  { 
    ssr: false,
  }
);

// Props type for catch-all slug route
type Props = {
  params: { 
    slug: string[] 
  }
};

// Generate metadata for the article
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Join the slug segments with slashes for nested paths
  const slug = params.slug.join('/');
  const data = await getDocData(slug);
  
  if (!data) {
    return {
      title: 'Article Not Found'
    };
  }

  const title = data.metadata?.title || slug;
  const description = data.metadata?.shortdesc || data.metadata?.description;
  const keywords = Array.isArray(data.metadata?.tags) ? data.metadata.tags : undefined;
  const author = data.metadata?.author;
  const authorName = typeof author === 'string' ? author : 
                     Array.isArray(author) ? author[0] : 
                     typeof author === 'object' && author?.name ? author.name : 
                     undefined;

  return {
    title: `${title}`,
    description,
    keywords,
    authors: authorName ? [{ name: authorName }] : undefined,
    openGraph: {
      title,
      description,
      type: 'article'
    }
  };
}

// Article page with proper catch-all route handling
export default async function ArticlePage({ params }: Props) {
  try {
    // Join the slug segments for nested paths (e.g., ["papers", "brownian-motion"] -> "papers/brownian-motion")
    const slug = params.slug.join('/');
    console.log(`Attempting to render article with slug: ${slug}`);
    
    // Fetch article data
    const rawData = await getDocData(slug);

    // Handle not found
    if (!rawData) {
      console.error(`Article not found for slug: ${slug}`);
      notFound();
    }

    // Type assertion after validation
    const data = rawData as Article;

    // Validate data structure
    if (!data || typeof data !== 'object' || !data.metadata || !data.content) {
      console.error(`Invalid data structure received for slug: ${slug}`);
      notFound(); 
    }

    // Destructure article data
    const { metadata, content: htmlContent, toc } = data;

    // Render the article
    return (
      <div className="flex flex-col md:flex-row max-w-screen-xl mx-auto py-8 md:px-8">
        <main className="flex-1 w-full md:mr-8 px-4 md:px-0">
          <MetadataList metadata={metadata} />

          <article className="prose dark:prose-invert max-w-none">
            <ArticleRenderer htmlContent={htmlContent} />
          </article>
        </main>

        <aside className="w-64 flex-shrink-0 md:sticky md:top-20 md:max-h-[calc(100vh-5rem)] px-4 md:px-0">
          {toc && toc.length > 0 && <TableOfContents toc={toc} />} 
        </aside>
      </div>
    );

  } catch (error) {
    console.error('Error rendering article page:', error);
    notFound();
  }
}
