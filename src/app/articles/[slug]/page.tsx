// Remove 'use client' directive
// 'use client'; 

import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { getDocData } from '@/lib/content.server';
// Import Article type directly from its definition file
import { Article, TocEntry } from '@/types/content'; 
import { Metadata } from 'next';
import ContentPane from '@/components/ContentPane';
// Remove static import
// import ArticleRenderer from '@/components/ArticleRenderer';
// Import placeholder types for components we will create
import MetadataList from '@/components/MetadataList'; // Import the actual component
import TableOfContents from '@/components/TableOfContents'; // Import the actual component
import dynamic from 'next/dynamic'; // Import dynamic

// Dynamically import ArticleRenderer with SSR disabled
const ArticleRenderer = dynamic(
  () => import('@/components/ArticleRenderer'),
  { 
    ssr: false,
    // Optional: Add a loading component
    // loading: () => <p>Loading article content...</p> 
  }
);

// --- Remove client-side imports --- 
// import parse, { domToReact, HTMLReactParserOptions, Element } from 'html-react-parser';
// import dynamic from 'next/dynamic';

// --- getArticleSlugs remains the same --- 
async function getArticleSlugs() {
  // Check both maps and articles directories
  const mapsDir = path.join(process.cwd(), 'content/maps');
  const articlesDir = path.join(process.cwd(), 'content/articles');
  
  try {
    const [mapFiles, articleFiles] = await Promise.all([
      fs.readdir(mapsDir).catch(() => []),
      fs.readdir(articlesDir).catch(() => [])
    ]);

    const mapSlugs = mapFiles
      .filter(file => file.endsWith('.ditamap'))
      .map(file => file.replace(/\.ditamap$/, ''));

    const articleSlugs = articleFiles
      .filter(file => file.endsWith('.mdita') || file.endsWith('.md'))
      .map(file => file.replace(/\.(mdita|md)$/, ''));

    return [...mapSlugs, ...articleSlugs];
  } catch (error) {
    console.error('Error reading content directories:', error);
    return [];
  }
}

// 
/*
// Generate static paths for all articles
export async function generateStaticParams() {
  const slugs = await getArticleSlugs();
  console.log('Generated slugs:', slugs);
  // Ensure DITA transformation runs before this if not done elsewhere
  return slugs.map((slug) => ({ slug }));
}
*/

// --- Props type remains the same ---
type Props = {
  params: { slug: string }
};

// --- generateMetadata remains the same --- 
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getDocData(params.slug);
  
  if (!data) {
    return {
      title: 'Article Not Found'
    };
  }

  const title = data.metadata?.title || params.slug;
  const description = data.metadata?.shortdesc;
  const keywords = Array.isArray(data.metadata?.tags) ? data.metadata.tags : undefined;
  const author = data.metadata?.author;
  const authorName = typeof author === 'string' ? author : author?.name;

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

// --- Updated Article Page Component (Now a Server Component) ---
export default async function ArticlePage({ params }: Props) {
  try {
    // Since the [slug] parameter is a catch-all segment, we need to handle
    // nested paths, like "papers/brownian-motion"
    const slug = params.slug;
    console.log(`Attempting to render article with slug: ${slug}`);
    
    // Fetch data on the server
    const rawData = await getDocData(slug);

    // Check for null/undefined before assertion
    if (!rawData) {
      console.error(`Article not found for slug: ${slug}`);
      notFound();
    }

    // Explicitly assert the type of the fetched data
    const data = rawData as Article;

    // === Runtime Safety Check === 
    if (!data || typeof data !== 'object' || !data.metadata || !data.content) {
      console.error(`[ArticlePage] Invalid data structure received for slug: ${params.slug}. Data:`, data);
      // Optionally, you could show a specific error message instead of just 404
      notFound(); 
    }
    // === End Safety Check ===

    // Destructure metadata, content, and toc FROM the *validated* 'data'
    const { metadata, content: htmlContent, toc } = data;

    // Check if title exists on metadata before rendering h1
    if (!metadata.title) {
      console.warn(`[ArticlePage] Metadata title missing for slug: ${params.slug}`);
      // Decide how to handle missing title - use slug? show generic title? For now, let it render undefined/empty
    }

    // === Restore Original Render === 
    return (
      <>
        <div className="flex flex-col md:flex-row max-w-screen-xl mx-auto py-8 md:px-8">
          <main className="flex-1 w-full md:mr-8 px-4 md:px-0">
            <MetadataList metadata={metadata} />

            <article className="prose dark:prose-invert max-w-none">
              {/* Render h1 only if title exists */} 
              {/* {metadata.title && <h1 className=\"mb-4\">{metadata.title}</h1>} */}
              <ArticleRenderer htmlContent={htmlContent} />
            </article>
          </main>

          <aside className="w-64 flex-shrink-0 md:sticky md:top-20 md:max-h-[calc(100vh-5rem)] px-4 md:px-0">
            {/* TOC is optional, so the existing check is fine */} 
            {toc && toc.length > 0 && <TableOfContents toc={toc} />} 
          </aside>

        </div>
      </>
    );
    // === End Restore Original Render ===

  } catch (error) {
    console.error('Error rendering article page:', error);
    notFound();
  }
} 