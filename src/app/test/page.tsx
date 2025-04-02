import { ContentLoader } from '@/lib/content/loader';
import { promises as fs } from 'fs';
import { join } from 'path';
import 'katex/dist/katex.min.css';
import { ProcessedContent } from '@/lib/markdown/types';

async function getTestContent() {
  const loader = new ContentLoader();
  let content;
  let error;
  let files;
  let loadError;
  let testContent;

  try {
    const contentDir = join(process.cwd(), 'content');
    const topicsDir = join(contentDir, 'topics');
    const articlesDir = join(contentDir, 'articles');
    files = {
      content: await fs.readdir(contentDir).catch(() => []),
      topics: await fs.readdir(topicsDir).catch(() => []),
      articles: await fs.readdir(articlesDir).catch(() => []),
    };
  } catch (e) {
    files = { error: e instanceof Error ? e.message : 'Unknown error' };
  }

  try {
    // Try loading a specific file first
    try {
      testContent = await loader.loadContent('topics/math-example');
      console.log('Test content:', testContent);
    } catch (e) {
      loadError = {
        message: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined,
      };
      console.error('Error loading test content:', e);
    }

    // Then try loading all content
    content = await loader.getAllContent();
  } catch (e) {
    error = {
      message: e instanceof Error ? e.message : 'Unknown error',
      stack: e instanceof Error ? e.stack : undefined,
    };
    console.error('Error loading all content:', e);
  }

  return {
    files,
    content: content || null,
    error,
    loadError,
    testContent,
  };
}

export default async function TestPage() {
  const { files, content, error, loadError, testContent } = await getTestContent();

  return (
    <>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Content Loader Test</h1>
        
        <h2 className="text-xl font-bold mt-8 mb-4">Directory Contents</h2>
        <pre className="bg-gray-100 p-4 rounded mb-8">
          {JSON.stringify(files, null, 2)}
        </pre>

        {loadError && (
          <div className="bg-yellow-100 text-yellow-700 p-4 rounded mb-8">
            <h3 className="font-bold mb-2">Test Load Error</h3>
            <p className="mb-2">{loadError.message}</p>
            <pre className="text-sm overflow-auto">{loadError.stack}</pre>
          </div>
        )}

        {testContent && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Test Content</h2>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-bold mb-2">{testContent.frontmatter.title}</h3>
              {testContent.frontmatter.author && (
                <p className="text-gray-600 mb-2">
                  By {testContent.frontmatter.author} • {new Date(testContent.frontmatter.date).toLocaleDateString()}
                </p>
              )}
              {testContent.frontmatter.tags.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {testContent.frontmatter.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div
                className="prose prose-lg"
                dangerouslySetInnerHTML={{ __html: testContent.html }}
              />
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold mt-8 mb-4">Content Loader Results</h2>
        {error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-8">
            <h3 className="font-bold mb-2">Error</h3>
            <p className="mb-2">{error.message}</p>
            <pre className="text-sm overflow-auto">{error.stack}</pre>
          </div>
        ) : (
          <pre className="bg-gray-100 p-4 rounded mb-8">
            {JSON.stringify(content, null, 2)}
          </pre>
        )}
      </div>
    </>
  );
} 