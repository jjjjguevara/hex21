import { promises as fs } from 'fs';
import path from 'path';
import { parseMetadata } from '@/lib/metadata';
import { NextResponse } from 'next/server';

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

export async function GET() {
  try {
    const contentDir = path.join(process.cwd(), 'content/docs');
    const filePaths = await getAllFiles(contentDir);
    
    const docs = await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const { metadata } = parseMetadata(content);
          const relativePath = path.relative(contentDir, filePath);
          const slug = relativePath.replace(/\.(mdita|md)$/, '');
          
          return {
            slug,
            metadata,
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

    return NextResponse.json(filteredDocs);
  } catch (error) {
    console.error('Error in /api/docs:', error);
    return new NextResponse(null, { status: 500 });
  }
} 