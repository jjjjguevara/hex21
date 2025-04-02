import { Metadata } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import { rehypeAnchorLinks } from '@/lib/rehype-anchor-links';
import { rehypeCodeBlock } from '@/lib/rehype-code-block';
import 'highlight.js/styles/github-dark.css';
import { getDocsNavigation } from '@/lib/docs';

// Helper to get content paths/slugs
async function getContentSlugs() {
  const contentDir = path.join(process.cwd(), 'content/docs');
  const files = await fs.readdir(contentDir, { recursive: true });
  return files
    .filter(file => file.endsWith('.mdita') || file.endsWith('.md'))
    .map(file => file.replace(/\.(mdita|md)$/, ''))
    .map(file => file.split(path.sep));
}

// Generate routes at build time
export async function generateStaticParams() {
  const slugs = await getContentSlugs();
  const navigation = await getDocsNavigation();
  
  // Add section paths to the slugs
  const sectionSlugs = navigation
    .filter(section => Array.isArray(section.items) && section.items.length > 0)
    .map(section => section.href.split('/').slice(2));
  
  return [...slugs, ...sectionSlugs].map(slug => ({ slug: Array.isArray(slug) ? slug : [slug] }));
}

// Fetch data for a specific page
async function getDocContent(slug: string[]) {
  const contentDir = path.join(process.cwd(), 'content/docs');
  
  // Try all possible file paths
  const possiblePaths = [
    path.join(contentDir, ...slug) + '.mdita',
    path.join(contentDir, ...slug) + '.md',
    // Try with the last segment only
    path.join(contentDir, slug[slug.length - 1]) + '.mdita',
    path.join(contentDir, slug[slug.length - 1]) + '.md',
    // Try with the last two segments
    ...(slug.length > 1 ? [
      path.join(contentDir, slug[slug.length - 2], slug[slug.length - 1]) + '.mdita',
      path.join(contentDir, slug[slug.length - 2], slug[slug.length - 1]) + '.md'
    ] : [])
  ];

  for (const filePath of possiblePaths) {
    try {
      const exists = await fs.stat(filePath).catch(() => false);
      if (exists) {
        console.log('Found file at:', filePath);
        const fileContents = await fs.readFile(filePath, 'utf8');
        const { data: metadata, content } = matter(fileContents);

        // Process the markdown content with syntax highlighting and anchor links
        const processedContent = await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkRehype)
          .use(rehypeSlug) // Add IDs to headings
          .use(rehypeAnchorLinks) // Add anchor links
          .use(rehypeHighlight, { // Add syntax highlighting
            ignoreMissing: true,
            detect: true
          })
          .use(rehypeCodeBlock) // Add copy button to code blocks
          .use(rehypeStringify)
          .process(content);

        return {
          metadata,
          content: processedContent.toString()
        };
      }
    } catch (error) {
      console.error(`Error trying path ${filePath}:`, error);
      continue;
    }
  }

  // Check if this is a section path
  const navigation = await getDocsNavigation();
  const sectionPath = '/docs/' + slug.join('/');
  const section = navigation.find(item => item.href === sectionPath);
  
  if (section && Array.isArray(section.items) && section.items.length > 0) {
    return {
      metadata: {
        title: section.title,
        description: `Documentation section for ${section.title}`
      },
      content: await unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeSlug)
        .use(rehypeAnchorLinks)
        .use(rehypeCodeBlock)
        .use(rehypeStringify)
        .process(`
          # ${section.title}
          <div class="grid gap-4">
            ${section.items.map(item => `
              <div class="p-4 border rounded-lg">
                <h2><a href="${item.href}" class="text-blue-600 dark:text-blue-400 hover:underline">${item.title}</a></h2>
              </div>
            `).join('')}
          </div>
        `).then(result => result.toString())
    };
  }

  return null;
}

export async function generateMetadata({ params }: { params: { slug: string[] } }): Promise<Metadata> {
  const data = await getDocContent(params.slug);
  
  if (!data) {
    return {
      title: 'Not Found',
      description: 'The requested page could not be found.'
    };
  }

  return {
    title: `${data.metadata.title} - Hex 21`,
    description: data.metadata.description || 'Documentation page'
  };
}

export default async function DocPage({ params }: { params: { slug: string[] } }) {
  const data = await getDocContent(params.slug);

  if (!data) {
    notFound();
  }

  return (
    <article className="prose dark:prose-invert max-w-none">
      <div dangerouslySetInnerHTML={{ __html: data.content }} />
    </article>
  );
} 