import { promises as fs } from 'fs';
import path from 'path';
import { parseMetadata } from '@/lib/metadata';
import { NextResponse } from 'next/server';

export async function GET() {
  const contentDir = path.join(process.cwd(), 'content/maps');
  
  try {
    const filenames = await fs.readdir(contentDir);
    const categories = new Set<string>();

    await Promise.all(
      filenames
        .filter((name) => name.endsWith('.ditamap'))
        .map(async (filename) => {
          const filePath = path.join(contentDir, filename);
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const { metadata } = parseMetadata(content, 'map');
            if (metadata.category) {
              categories.add(metadata.category);
            }
          } catch (error) {
            console.error(`Error processing map ${filename}:`, error);
          }
        })
    );

    const sortedCategories = Array.from(categories).sort();
    return NextResponse.json(sortedCategories);
  } catch (error) {
    console.error('Error in categories API route:', error);
    return new NextResponse(null, { status: 500 });
  }
} 