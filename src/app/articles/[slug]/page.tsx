import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { parseMetadata } from '@/lib/metadata';
import { Article, TopicMetadata } from '@/types/content';
import Script from 'next/script';
import matter from 'gray-matter';
import { marked } from 'marked';

async function getContentSlugs() {
  const mapsDir = path.join(process.cwd(), 'content/maps');
  const filenames = await fs.readdir(mapsDir);
  return filenames
    .filter((name) => name.endsWith('.ditamap'))
    .map((name) => name.replace(/\.ditamap$/, ''));
}

export async function generateStaticParams() {
  const slugs = await getContentSlugs();
  return slugs.map((slug) => ({ slug }));
}

async function getArticleData(slug: string): Promise<Article | null> {
  const mapsDir = path.join(process.cwd(), 'content/maps');
  const topicsDir = path.join(process.cwd(), 'content/topics');
  const mapPath = path.join(mapsDir, `${slug}.ditamap`);

  try {
    const mapContents = await fs.readFile(mapPath, 'utf8');
    const { metadata, topics } = parseMetadata(mapContents, 'map');

    // Only proceed if the article is published
    if (!metadata.publish) {
      return null;
    }

    // Load all topics referenced in the map
    const topicContents = await Promise.all(
      topics.map(async (topicId) => {
        try {
          const topicPath = path.join(topicsDir, `${topicId}.mdita`);
          const content = await fs.readFile(topicPath, 'utf8');
          const { data: topicMetadata, content: markdown } = matter(content);
          const html = marked(markdown);
          return {
            id: topicId,
            metadata: topicMetadata as TopicMetadata,
            content: html
          };
        } catch (error) {
          console.error(`Error loading topic ${topicId}:`, error);
          return null;
        }
      })
    );

    // Filter out any failed topic loads
    const validTopics = topicContents.filter((topic): topic is NonNullable<typeof topic> => topic !== null);

    // Combine all topic contents
    const combinedContent = validTopics.map(topic => topic.content).join('\n');

    return {
      slug,
      content: combinedContent,
      metadata,
      topics: validTopics
    };
  } catch (error) {
    console.error(`Error fetching article ${slug}:`, error);
    return null;
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticleData(params.slug);

  if (!article) {
    notFound();
  }

  const { metadata, content } = article;

  return (
    <>
      <Script
        id="mathjax-config"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                processEscapes: true,
              },
              options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
              }
            };
          `,
        }}
      />
      <Script
        id="mathjax-script"
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        strategy="beforeInteractive"
      />
      <article className="prose lg:prose-xl mx-auto py-8 px-4">
        <h1>{metadata.title}</h1>
        {metadata.author && (
          <p className="text-gray-600">By {metadata.author}</p>
        )}
        {metadata.date && (
          <p className="text-gray-600">{new Date(metadata.date).toLocaleDateString()}</p>
        )}
        {metadata.tags && metadata.tags.length > 0 && (
          <div className="flex gap-2 my-4">
            {metadata.tags.map((tag) => (
              <span key={tag} className="bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div 
          className="mt-8" 
          dangerouslySetInnerHTML={{ __html: content }} 
        />
      </article>
    </>
  );
} 