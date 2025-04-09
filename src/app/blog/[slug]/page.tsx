import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import matter from 'gray-matter';
import { parseMetadata } from '@/lib/metadata';
import { Metadata } from 'next';
import ContentPane from '@/components/ContentPane';
import CodeBlock from '@/components/CodeBlock';
import CodeCopy from '@/components/CodeCopy';
import { MapMetadata, TopicMetadata } from '@/types/content';

type Props = {
  params: { slug: string }
};

type BlogPostData = {
  metadata: MapMetadata | TopicMetadata;
  content: string;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getBlogPost(params.slug);
  
  if (!data) {
    return {
      title: 'Blog Post Not Found - Hex 21'
    };
  }

  const { metadata } = data;

  return {
    title: `${metadata.title} - Hex 21 Blog`,
    description: metadata.shortdesc,
    authors: metadata.author ? [{
      name: typeof metadata.author === 'string'
        ? metadata.author
        : Array.isArray(metadata.author)
        ? metadata.author.join(', ')
        : typeof metadata.author === 'object' && metadata.author !== null && 'name' in metadata.author
        ? metadata.author.name
        : undefined
    }] : undefined,
    openGraph: {
      title: metadata.title,
      description: metadata.shortdesc,
      type: 'article'
    }
  };
}

async function getBlogPost(slug: string): Promise<BlogPostData | null> {
  const contentDir = path.join(process.cwd(), 'content/blog');
  const filePath = path.join(contentDir, `${slug}.mdita`);

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const { data: frontmatter, content } = matter(fileContents);
    const { metadata, content: htmlContent } = await parseMetadata(content, 'topic');
    
    // Remove the title from the HTML content since we'll display it separately
    const processedContent = htmlContent.replace(/<h1[^>]*>.*?<\/h1>/, '');

    // Process code blocks
    const finalContent = processedContent.replace(
      /<pre><code(?:\s+class="language-([^"]+)")?>([\s\S]*?)<\/code><\/pre>/g,
      (_, language, content) => {
        const decodedContent = content
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
        return `<div class="relative group">
          <pre class="${language ? `language-${language}` : ''}"><code class="${language ? `language-${language}` : ''}">${decodedContent}</code></pre>
          <div class="opacity-0 group-hover:opacity-100 transition-opacity">
            <button data-copy-code
              class="absolute right-2 top-2 p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
              aria-label="Copy to clipboard">
              <svg class="w-5 h-5 text-gray-400 hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
        </div>`;
      }
    );

    return {
      metadata: { ...frontmatter, ...metadata },
      content: finalContent
    };
  } catch (error) {
    console.error(`Error fetching blog post ${slug}:`, error);
    return null;
  }
}

export default async function BlogPost({ params }: Props) {
  const data = await getBlogPost(params.slug);

  if (!data) {
    notFound();
  }

  const { metadata, content } = data;

  return (
    <ContentPane>
      <article className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {metadata.title}
          </h1>
          {metadata.author && (
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              By {typeof metadata.author === 'string'
                ? metadata.author
                : Array.isArray(metadata.author)
                ? metadata.author.join(', ')
                : typeof metadata.author === 'object' && metadata.author !== null && 'name' in metadata.author
                ? metadata.author.name
                : 'Unknown Author'}
            </p>
          )}
          {metadata.date && (
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {new Date(metadata.date).toLocaleDateString()}
            </p>
          )}
          {metadata.tags && metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {metadata.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {metadata.shortdesc && (
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {metadata.shortdesc}
            </p>
          )}
        </header>

        <div 
          className="prose dark:prose-invert max-w-none
            prose-headings:text-gray-900 dark:prose-headings:text-gray-100
            prose-p:text-gray-600 dark:prose-p:text-gray-300
            prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-500
            prose-strong:text-gray-900 dark:prose-strong:text-gray-100
            prose-blockquote:border-l-blue-500 dark:prose-blockquote:border-l-blue-400
            prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-300
            prose-ul:text-gray-600 dark:prose-ul:text-gray-300
            prose-ol:text-gray-600 dark:prose-ol:text-gray-300
            prose-li:text-gray-600 dark:prose-li:text-gray-300
            prose-code:text-gray-800 dark:prose-code:text-gray-200
            prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800
            prose-pre:text-gray-800 dark:prose-pre:text-gray-200
            prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700
            prose-img:rounded-lg prose-img:shadow-md"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </article>
      <CodeCopy />
    </ContentPane>
  );
} 