import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import matter from 'gray-matter';
import MathJaxConfig from '@/components/MathJaxConfig';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import 'katex/dist/katex.min.css';

async function processMarkdown(content: string) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(content);

  return result.toString();
}

async function getTopicData(slug: string) {
  try {
    const topicsDir = path.join(process.cwd(), 'content/topics');
    const filePath = path.join(topicsDir, `${slug}.mdita`);
    
    const content = await fs.readFile(filePath, 'utf8');
    const { data: metadata, content: mdContent } = matter(content);
    
    // Process the markdown content
    const processedContent = await processMarkdown(mdContent);
    
    return {
      metadata,
      content: processedContent
    };
  } catch (error) {
    console.error(`Error loading topic ${slug}:`, error);
    return null;
  }
}

export async function generateStaticParams() {
  const topicsDir = path.join(process.cwd(), 'content/topics');
  const files = await fs.readdir(topicsDir);
  
  return files
    .filter(file => file.endsWith('.mdita'))
    .map(file => ({
      slug: file.replace(/\.mdita$/, '')
    }));
}

export default async function TopicPage({ params }: { params: { slug: string } }) {
  const data = await getTopicData(params.slug);

  if (!data) {
    notFound();
  }

  const { metadata, content } = data;

  return (
    <>
      <MathJaxConfig />
      <article className="max-w-4xl mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            {metadata.title}
          </h1>
          {metadata.author && (
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              By {metadata.author}
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
                  className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {metadata.description && (
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {metadata.description}
            </p>
          )}
        </header>
        <div 
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </article>
    </>
  );
} 