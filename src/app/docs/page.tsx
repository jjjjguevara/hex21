import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDocData } from '@/lib/content.server'; // Use shared function
import { Doc } from '@/types/content'; // Removed TocEntry import as it's not directly used here
import ArticleRenderer from '@/components/ArticleRenderer'; 
// Removed TableOfContents import as layout is handled by template

// Removed local getRootDocContent function

export async function generateMetadata(): Promise<Metadata> {
  // Fetch data using the standardized function for the index page
  const data = await getDocData('index'); 
  
  if (!data?.metadata) {
    return {
      title: 'Docs Not Found - Hex 21',
      description: 'The main documentation index page could not be loaded.'
    };
  }

  // Title should come directly from the index file's metadata
  const title = data.metadata.title || 'Docs Home'; 
  
  return {
    title: `${title} - Docs | Hex 21`,
    description: data.metadata.description || 'Documentation index page for Hex 21 CMS.'
  };
}

export default async function DocsRootPage() {
  const data = await getDocData('index');
  if (!data) {
    notFound();
  }
  // Destructure only content, metadata and toc passed implicitly via children
  const { metadata, content: htmlContent, toc } = data;

  // This page component now ONLY renders the main content part.
  // Layout (Sidebar, TOC placement) is handled by DocsClient via template.tsx
  return (
      // Apply prose class here, and ensure ArticleRenderer doesn't duplicate it
      <div className="prose dark:prose-invert *:first:mt-0"> 
         <ArticleRenderer htmlContent={htmlContent} />
      </div>
  );
} 