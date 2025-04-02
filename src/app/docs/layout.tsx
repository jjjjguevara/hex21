import { Metadata } from 'next';
import { getDocsNavigation } from '@/lib/docs';

export const metadata: Metadata = {
  title: 'Documentation - Hex 21',
  description: 'Learn how to use Hex 21 CMS for managing and publishing scientific content with DITA XML, LaTeX support, and powerful search capabilities.',
  keywords: 'CMS,DITA,Scientific Content,LaTeX,Technical Documentation',
};

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = await getDocsNavigation();

  return (
    <div className="flex-1">
      {children}
    </div>
  );
} 