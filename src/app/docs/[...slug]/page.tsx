import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import matter from 'gray-matter';
import MathJaxConfig from '@/components/MathJaxConfig';
import { getDocData } from '@/lib/content.server';
import { Metadata } from 'next';

type Props = {
  params: { slug: string[] }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getDocData(params.slug.join('/'));
  
  if (!data) {
    return {
      title: 'Documentation Not Found - Hex 21'
    };
  }

  const title = data.metadata.title || params.slug[params.slug.length - 1];
  const description = data.metadata.description || data.metadata.shortdesc;

  return {
    title: `${title}`,
    description,
    keywords: data.metadata.tags,
    authors: data.metadata.author ? [{ name: data.metadata.author }] : undefined,
    openGraph: {
      title,
      description,
      type: 'article'
    }
  };
}

export async function generateStaticParams() {
  const docsDir = path.join(process.cwd(), 'content/docs');
  const files = await fs.readdir(docsDir, { recursive: true });
  console.log('Found doc files:', files);
  return files
    .filter(file => file.endsWith('.mdita') || file.endsWith('.md'))
    .map(file => file.replace(/\.(mdita|md)$/, ''))
    .map(slug => ({ slug: slug.split(path.sep) }));
}

export default async function DocPage({ params }: Props) {
  const data = await getDocData(params.slug.join('/'));

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
          className="prose prose-lg dark:prose-invert max-w-none
            prose-headings:text-gray-900 dark:prose-headings:text-white
            prose-p:text-gray-600 dark:prose-p:text-gray-300
            prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-500
            prose-strong:text-gray-900 dark:prose-strong:text-white
            prose-blockquote:border-l-blue-500 dark:prose-blockquote:border-l-blue-400
            prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-300
            prose-ul:text-gray-600 dark:prose-ul:text-gray-300
            prose-ol:text-gray-600 dark:prose-ol:text-gray-300
            prose-li:text-gray-600 dark:prose-li:text-gray-300
            prose-table:text-gray-600 dark:prose-table:text-gray-300
            prose-th:text-gray-900 dark:prose-th:text-white
            prose-td:text-gray-600 dark:prose-td:text-gray-300
            prose-img:rounded-lg
            prose-hr:border-gray-200 dark:prose-hr:border-gray-700
            prose-h1:text-4xl prose-h1:font-bold prose-h1:mb-8
            prose-h2:text-3xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-2xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3
            prose-p:my-4
            prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
            prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
            prose-li:my-2
            prose-blockquote:my-4 prose-blockquote:pl-4 prose-blockquote:border-l-4
            prose-hr:my-8
            [&_pre]:p-0 [&_pre]:m-0 [&_pre]:bg-transparent
            [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-current"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </article>
    </>
  );
} 