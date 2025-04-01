import { getDocs } from '@/lib/content';
import Link from 'next/link';

export default async function DocsPage() {
  const docs = await getDocs();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Documentation</h1>
      
      {docs.length === 0 ? (
        <p className="text-gray-600">No documentation found. Please check the content directory.</p>
      ) : (
        <div className="space-y-6">
          {docs.map((doc) => (
            <article key={doc.slug} className="border-b pb-6 last:border-b-0">
              <h2 className="text-xl font-semibold mb-2">
                <Link 
                  href={`/docs/${doc.slug}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {doc.metadata.title || doc.slug}
                </Link>
              </h2>
              {doc.metadata.description && (
                <p className="text-gray-600 mb-2">{doc.metadata.description}</p>
              )}
              {doc.metadata.tags && doc.metadata.tags.length > 0 && (
                <div className="flex gap-2">
                  {doc.metadata.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
} 