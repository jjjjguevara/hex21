import { getDocBySlug } from '@/lib/content';
import { notFound } from 'next/navigation';

export default async function DocPage({ params }: { params: { slug: string } }) {
  const doc = await getDocBySlug(params.slug);

  if (!doc) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <article className="prose lg:prose-xl">
        <h1>{doc.metadata.title || doc.slug}</h1>
        <div dangerouslySetInnerHTML={{ __html: doc.content }} />
      </article>
    </div>
  );
} 