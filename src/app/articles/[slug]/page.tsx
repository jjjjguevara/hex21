import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import matter from 'gray-matter';
import { getArticleData } from '@/lib/content.server';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import 'katex/dist/katex.min.css';
import { Metadata } from 'next';
import ArticlesContainer from '@/components/ArticlesContainer';
import ContentPane from '@/components/ContentPane';

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

export async function generateStaticParams() {
  const slugs = await getArticleSlugs();
  console.log('Generated slugs:', slugs);
  return slugs.map((slug) => ({ slug }));
}

async function processMarkdown(content: string) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(content);
  
  return result.toString();
}

type Props = {
  params: { slug: string }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getArticleData(params.slug);
  
  if (!data) {
    return {
      title: 'Article Not Found'
    };
  }

  const title = data.metadata.title || params.slug;
  const description = data.metadata.shortdesc;

  return {
    title: `${title}`,
    description,
    keywords: data.metadata.tags,
    authors: data.metadata.author ? [{ name: typeof data.metadata.author === 'string' ? data.metadata.author : data.metadata.author.name }] : undefined,
    openGraph: {
      title,
      description,
      type: 'article'
    }
  };
}

export default async function ArticlePage({ params }: Props) {
  try {
    console.log('Rendering article page for slug:', params.slug);
    const data = await getArticleData(params.slug);

    if (!data) {
      console.log('No data found for slug:', params.slug);
      notFound();
    }

    const { metadata, content } = data;

    return (
      <>
        <ContentPane>
          <article className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                {metadata.title}
              </h1>
              
              {/* Author */}
              {metadata.author && (
                <div className="text-gray-600 dark:text-gray-400 mb-2">
                  By {typeof metadata.author === 'string' ? metadata.author : metadata.author.name}
                </div>
              )}

              {/* Editor & Reviewer */}
              {(metadata.editor || metadata.reviewer) && (
                <div className="text-gray-600 dark:text-gray-400 mb-2">
                  {metadata.editor && <span>Editor: {metadata.editor}</span>}
                  {metadata.editor && metadata.reviewer && <span className="mx-2">•</span>}
                  {metadata.reviewer && <span>Reviewer: {metadata.reviewer}</span>}
                </div>
              )}

              {/* Publication Date & Last Edited */}
              {(metadata.date || metadata.lastEdited) && (
                <div className="text-gray-600 dark:text-gray-400 mb-2">
                  {metadata.date && (
                    <span>Published: {new Date(metadata.date).toLocaleDateString()}</span>
                  )}
                  {metadata.date && metadata.lastEdited && <span className="mx-2">•</span>}
                  {metadata.lastEdited && (
                    <span>Last updated: {new Date(metadata.lastEdited).toLocaleDateString()}</span>
                  )}
                </div>
              )}

              {/* Category */}
              {metadata.category && (
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    {metadata.category}
                  </span>
                </div>
              )}

              {/* Tags */}
              {metadata.tags && metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Audience */}
              {metadata.audience && (
                <div className="text-gray-600 dark:text-gray-400 mb-2">
                  Audience: {Array.isArray(metadata.audience) ? metadata.audience.join(', ') : metadata.audience}
                </div>
              )}

              {/* Version */}
              {metadata.version && (
                <div className="text-gray-600 dark:text-gray-400 mb-2">
                  Version: {metadata.version}
                </div>
              )}

              {/* Language */}
              {metadata.language && (
                <div className="text-gray-600 dark:text-gray-400 mb-2">
                  Language: {metadata.language}
                </div>
              )}
            </header>

            <div 
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </article>
        </ContentPane>
      </>
    );
  } catch (error) {
    console.error('Error rendering article page:', error);
    notFound();
  }
} 