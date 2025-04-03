import DocsClient from '@/components/DocsClient';
import { getDocsNavigation } from '@/lib/docs';

export default async function DocsTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = await getDocsNavigation();
  
  return <DocsClient navigation={navigation}>{children}</DocsClient>;
} 