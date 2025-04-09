import { Metadata } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { getDocData } from '@/lib/content.server'; // Import the shared function
import { Doc } from '@/types/content'; 
import ArticleRenderer from '@/components/ArticleRenderer'; // Import renderer
import { ObsidianContent } from '@/components/ObsidianContent'; // Import Obsidian-specific renderer
import { ProcessedContent, Frontmatter, Metadata as ContentMetadata } from '@/lib/markdown/types'; // Import the correct types

// Helper to get content paths/slugs
async function getContentSlugs() {
  const contentDir = path.join(process.cwd(), 'content/docs');
  const files = await fs.readdir(contentDir, { recursive: true });
  return files
    .filter(file => file.endsWith('.mdita') || file.endsWith('.md'))
    .map(file => file.replace(/\.(mdita|md)$/, ''))
    // Map 'index' specifically or handle root case in fetch
    .map(file => file.split(path.sep)); 
}

// Generate routes at build time
export async function generateStaticParams() {
  const slugsArrays = await getContentSlugs();
  // Ensure 'index' file maps to a valid param if needed, or handle root separately
  // Let's assume an index.md exists and corresponds to slug = ['index'] or handled by fetch
  const validSlugs = slugsArrays.filter(slug => slug.join('/') !== 'index'); // Exclude explicit 'index' slug if handled by root
  validSlugs.push([]); // Add explicit root path

  console.log('Docs slugs for generateStaticParams:', validSlugs);
  return validSlugs.map(slug => ({ slug: slug.length === 0 ? undefined : slug })); // Pass undefined for root
}

// Fetch data using the shared function
async function fetchAndProcessDocData(slugArray: string[] | undefined) {
  // If slugArray is undefined or empty, fetch 'index'
  const slugString = (slugArray && slugArray.length > 0) ? slugArray.join('/') : 'index';
  console.log(`[fetchAndProcessDocData] Fetching data for slug: ${slugString}`);
  const data = await getDocData(slugString);
  if (!data) {
    console.warn(`[fetchAndProcessDocData] No data returned for slug: ${slugString}`);
    // Optional: Try fetching a default/root page if index fails?
  }
  return data;
}

// --- Props type allowing undefined slug for root ---
type Props = {
  params: { slug?: string[] } // Slug is optional, representing the root path when undefined/empty
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await fetchAndProcessDocData(params.slug);
  
  if (!data) {
    return {
      title: 'Docs Not Found | Hex 21',
      description: 'The requested documentation page could not be found.'
    };
  }

  // Determine title: Use metadata, fallback to slug, or specific title for index
  const slugString = (params.slug && params.slug.length > 0) ? params.slug.join('/') : 'index';
  const title = data.metadata?.title || (slugString === 'index' ? 'Documentation Home' : slugString);
  
  return {
    title: `${title} - Docs | Hex 21`,
    description: data.metadata?.description || 'Documentation page for Hex 21 CMS'
  };
}

// This page component now ONLY renders the main content part.
// Layout (Sidebar, TOC placement) is handled by DocsClient via template.tsx
export default async function DocPage({ params }: Props) {
  const data = await fetchAndProcessDocData(params.slug);
  if (!data) {
    notFound();
  }
  const { metadata, content: htmlContent, toc } = data; // toc is fetched but not used directly here

  // Create properly typed objects for ProcessedContent
  const frontmatter: Frontmatter = {
    title: metadata?.title || '',
    description: metadata?.shortdesc || '',
    date: metadata?.date || new Date().toISOString(),
    tags: Array.isArray(metadata?.tags) ? metadata.tags : [],
    publish: Boolean(metadata?.publish),
    audience: Array.isArray(metadata?.audience) ? metadata.audience.join(', ') : String(metadata?.audience || ''),
    author: typeof metadata?.author === 'string'
      ? metadata.author
      : Array.isArray(metadata.author)
      ? metadata.author.join(', ')
      : typeof metadata.author === 'object' && metadata.author !== null && 'name' in metadata.author
      ? metadata.author.name
      : 'Unknown Author' // Fallback for object or other types
  };
  
  // Create compatible metadata object
  const contentMetadata: ContentMetadata = {
    title: metadata?.title,
    author: frontmatter.author,
    category: metadata?.category,
    audience: frontmatter.audience,
    publish: Boolean(metadata?.publish),
    tags: Array.isArray(metadata?.tags) ? metadata.tags : [],
    shortdesc: metadata?.shortdesc,
    date: metadata?.date
  };

  // Create a properly typed ProcessedContent object
  const processedContent: ProcessedContent = {
    html: htmlContent,
    metadata: contentMetadata,
    embeds: [],
    frontmatter: frontmatter
  };

  // Determine the basePath for resolving wiki links
  const basePath = params.slug && params.slug.length > 0 
    ? `/${params.slug.slice(0, -1).join('/')}` 
    : '/docs';

  return (
      // Apply prose class here, ensure proper styling
      <div className="prose dark:prose-invert *:first:mt-0">
         <ObsidianContent 
           content={htmlContent} 
           metadata={contentMetadata}
           basePath={basePath} 
         />
      </div>
  );
} 