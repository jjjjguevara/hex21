import { promises as fs } from 'fs';
import path from 'path';
import { parseMetadata } from '@/lib/metadata';
import DocsTable from '@/components/DocsTable';
import { Metadata } from 'next';
import ContentPane from '@/components/ContentPane';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Browse our documentation by category, or use the table headers to sort by title, category, or last updated date.',
  keywords: ['documentation', 'guides', 'api', 'reference'],
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

async function getDocs() {
  const contentDir = path.join(process.cwd(), 'content/docs');
  
  try {
    const filePaths = await getAllFiles(contentDir);
    console.log('Found doc files:', filePaths);
    
    const docs = await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const { metadata } = parseMetadata(content);
          // Get relative path from content/docs and remove extension
          const relativePath = path.relative(contentDir, filePath);
          const slug = relativePath.replace(/\.(mdita|md)$/, '');
          const category = path.dirname(relativePath) === '.' ? 'General' : path.dirname(relativePath);
          
          return {
            slug,
            metadata: {
              ...metadata,
              category,
              lastUpdated: metadata.lastUpdated || metadata.date
            },
            path: relativePath
          };
        } catch (error) {
          console.error(`Error processing doc ${filePath}:`, error);
          return null;
        }
      })
    );

    const filteredDocs = docs
      .filter((doc): doc is NonNullable<typeof doc> => doc !== null)
      .filter((doc) => doc.metadata.publish !== false);
    
    console.log('Filtered docs:', filteredDocs.length);
    
    return filteredDocs;
  } catch (error) {
    console.error('Error fetching docs:', error);
    return [];
  }
}

export default async function DocsPage() {
  const docs = await getDocs();

  return (
    <ContentPane width="wide">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Documentation</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse our documentation by category, or use the table headers to sort by title, category, or last updated date.
        </p>
      </div>
      
      <DocsTable docs={docs} />
    </ContentPane>
  );
} 