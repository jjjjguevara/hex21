import { promises as fs } from 'fs';
import path from 'path';
import { parseMetadata } from '@/lib/metadata';
import { Metadata } from 'next';
import ContentPane from '@/components/ContentPane';
import MathJaxConfig from '@/components/MathJaxConfig';

export const metadata: Metadata = {
  title: 'Blog - Hex 21',
  description: 'Latest updates, insights, and announcements from the Hex 21 team.',
  keywords: ['blog', 'updates', 'announcements', 'insights', 'Hex 21'],
};

async function getAllFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return getAllFiles(fullPath);
      } else if (entry.name.endsWith('.mdita') || entry.name.endsWith('.md')) {
        return [fullPath];
      }
      return [];
    })
  );
  return files.flat();
}

async function getBlogPosts() {
  try {
    const blogDir = path.join(process.cwd(), 'content/blog');
    const files = await getAllFiles(blogDir);
    console.log('Found blog files:', files);

    const posts = await Promise.all(
      files.map(async (file) => {
        try {
          const content = await fs.readFile(file, 'utf8');
          console.log('Processing file:', file);
          const { metadata, content: htmlContent } = parseMetadata(content, 'topic');
          
          // Remove the title from the HTML content
          const contentWithoutTitle = htmlContent.replace(/<h1[^>]*>.*?<\/h1>/, '');
          
          console.log('Parsed metadata:', metadata);
          return { 
            ...metadata, 
            content: contentWithoutTitle, 
            slug: path.basename(file, path.extname(file)) 
          };
        } catch (error) {
          console.error('Error processing file:', file, error);
          return null;
        }
      })
    );

    // Filter out any null results and unpublished posts
    const publishedPosts = posts
      .filter((post): post is NonNullable<typeof post> => post !== null)
      .filter((post) => post.publish)
      .sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

    console.log(`Found ${publishedPosts.length} published posts:`, publishedPosts);
    return publishedPosts;
  } catch (error) {
    console.error('Error getting blog posts:', error);
    return [];
  }
}

export default async function BlogPage() {
  console.log('Rendering BlogPage');
  const posts = await getBlogPosts();
  console.log('Retrieved posts for rendering:', posts);

  return (
    <>
      <MathJaxConfig />
      <ContentPane spacing="normal">
        <header className="mb-8">
          <div className="text-4xl font-bold mb-4">Blog</div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Latest updates, insights, and announcements from the Hex 21 team.
          </p>
        </header>
      </ContentPane>

      <div className="space-y-4">
        {posts.map((post) => (
          <ContentPane key={post.slug} spacing="small">
            <article>
              <a 
                href={`/blog/${post.slug}`} 
                className="block group"
              >
                <h1 className="text-2xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {post.title}
                </h1>
              </a>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                {post.author && (
                  <span>
                    By {post.author}
                  </span>
                )}
                {post.date && (
                  <time dateTime={new Date(post.date).toISOString()}>
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                )}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex gap-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {post.shortdesc && (
                <p className="text-gray-600 dark:text-gray-300 mb-4">{post.shortdesc}</p>
              )}

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
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              <div className="mt-4">
                <a 
                  href={`/blog/${post.slug}`} 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Read more →
                </a>
              </div>
            </article>
          </ContentPane>
        ))}
      </div>
    </>
  );
}