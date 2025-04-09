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
import Link from 'next/link';
import dynamic from 'next/dynamic';
import MathJaxConfig from '@/components/MathJaxConfig';

// Dynamically import the LaTeX syntax highlighter with no SSR to avoid hydration issues
const LaTeXSyntaxHighlighter = dynamic(
  () => import('@/components/LaTeXSyntaxHighlighter'),
  { ssr: false }
);

type Props = {
  params: { slug: string }
};

type BlogPostData = {
  metadata: MapMetadata | TopicMetadata;
  content: string;
  title: string;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getBlogPost(params.slug);
  
  if (!data) {
    return {
      title: 'Blog Post Not Found - Hex 21'
    };
  }

  const { metadata, title } = data;

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
  let filePath: string;
  let fileContents: string;

  // Try .md extension first, then .mdita
  try {
    filePath = path.join(contentDir, `${slug}.md`);
    fileContents = await fs.readFile(filePath, 'utf8');
  } catch (e) {
    try {
      filePath = path.join(contentDir, `${slug}.mdita`);
      fileContents = await fs.readFile(filePath, 'utf8');
    } catch (innerError) {
      console.error(`Error fetching blog post ${slug}:`, innerError);
      return null;
    }
  }

  try {
    const { data: frontmatter, content } = matter(fileContents);
    const { metadata, content: htmlContent } = await parseMetadata(content, 'topic');
    
    // Extract the title from H1 or use metadata.title
    const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = h1Match ? h1Match[1].replace(/<[^>]*>/g, '') : metadata.title || '';
    
    // Remove the title from the HTML content since we'll display it separately
    const processedContent = htmlContent.replace(/<h1[^>]*>.*?<\/h1>/, '');

    // Process wiki links [[page]] or [[page|alias]]
    const processedWithWikiLinks = processedContent.replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (match, target, alias) => {
        // Determine the URL based on the target
        let url = '';
        const classes = 'text-blue-600 dark:text-blue-400 hover:text-blue-500';
        const attrs = ` data-wiki-link`;
        
        // Simple case - docs links
        if (target.toLowerCase() === 'docs') {
          url = '/docs';
        } else {
          // Handle other wiki links
          let targetPath = target;
          let section = '';
          
          // Handle section links with # syntax
          if (target.includes('#')) {
            const parts = target.split('#');
            targetPath = parts[0];
            section = parts[1] ? `#${parts[1]}` : '';
          }
          
          // Remove .md extension if present
          targetPath = targetPath.replace(/\.md$/i, '');
          
          // Convert to slug format
          const slug = targetPath
            .split('/')
            .map((part: string) => 
              part.trim()
                .replace(/\s+/g, '-')
                .toLowerCase()
                .replace(/[^a-z0-9-_]/g, '')
            )
            .join('/');
          
          // Create a link to the appropriate section
          url = `/${slug}${section}`;
        }
        
        // Create an anchor tag with the processed URL
        return `<a href="${url}" class="${classes}"${attrs}>${alias || target}</a>`;
      }
    );
    
    // Process LaTeX code blocks to prevent highlight.js from processing them
    const finalContent = processedWithWikiLinks.replace(
      /<pre><code class="language-(latex|tex)">(.*?)<\/code><\/pre>/g,
      function(match, lang, content) {
        // Return with a special class that will be targeted by custom CSS
        return `<pre class="latex-block"><code class="language-${lang} latex-code">${content}</code></pre>`;
      }
    );

    return {
      metadata: { ...frontmatter, ...metadata },
      content: finalContent,
      title
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

  const { metadata, content, title } = data;
  
  // Process LaTeX blocks server-side to more explicitly mark them for our custom highlighter
  const processedContent = content.replace(
    /<pre><code class="language-(latex|tex)">((\s|\S)*?)<\/code><\/pre>/g,
    (match, lang, content) => {
      // Add multiple class names for higher specificity and debugging
      return `<pre class="hex21-latex-container"><code class="hex21-latex-block latex-block hex21-syntax-highlight">${content}</code></pre>`;
    }
  );

  return (
    <>
      <MathJaxConfig />
      <ContentPane>
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="px-4 sm:px-6 lg:px-8 py-4">
          <ol className="flex items-center space-x-2 text-sm">
            <li className="flex items-center">
              <Link href="/blog" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                Blog
              </Link>
            </li>
            <li className="flex items-center">
              <svg
                className="h-4 w-4 text-gray-400 mx-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span className="text-gray-900 dark:text-gray-100">
                {title || metadata.title}
              </span>
            </li>
          </ol>
        </nav>
        
        <div className="max-w-screen-xl mx-auto py-4 px-4 md:px-8">
            <article className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {title || metadata.title}
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
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
        <script
          id="mathjax-config-script"
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize MathJax configuration
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$'], ['\\(', '\\)']],
                  displayMath: [['$$', '$$'], ['\\[', '\\]']],
                  processEscapes: true,
                  processEnvironments: true,
                  tags: 'ams'
                },
                svg: {
                  fontCache: 'global',
                  scale: 1.1, // Slightly larger equations
                },
                options: {
                  // Skip code blocks but allow other elements to be processed
                  skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'code', 'pre'],
                  processHtmlClass: 'math-render',
                  ignoreHtmlClass: 'no-math-render latex-block' 
                },
                startup: {
                  typeset: true,
                  pageReady: () => {
                    console.log('MathJax is ready');
                    // Try to typeset twice to ensure all equations are rendered
                    // This helps with equations that might be missed in the first pass
                    return MathJax.typesetPromise();
                  }
                }
              };

              // Load MathJax script
              const loadMathJax = () => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
                script.async = true;
                document.head.appendChild(script);
              };

              // Load immediately
              if (document.readyState === 'complete' || document.readyState === 'interactive') {
                loadMathJax();
              } else {
                document.addEventListener('DOMContentLoaded', loadMathJax);
              }
            `
          }}
        />

            </article>
            
            {/* Return to blog link */}
            <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link 
                href="/blog"
                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Return to blog
              </Link>
            </div>
        </div>
        <CodeCopy />
        {/* Add the LaTeX syntax highlighter component */}
        <LaTeXSyntaxHighlighter />
      </ContentPane>
    </>
  );
} 