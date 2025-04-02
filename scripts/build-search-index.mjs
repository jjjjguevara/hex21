import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildSearchIndex() {
  const contentDir = path.join(__dirname, '../content/articles');
  const outputDir = path.join(__dirname, '../public');
  const documents = [];

  try {
    const files = await fs.readdir(contentDir);
    
    for (const file of files) {
      if (!file.endsWith('.mdita') && !file.endsWith('.md')) continue;

      const filePath = path.join(contentDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      const { data: metadata, content: parsedContent } = matter(content);
      
      // Only include published articles
      if (!metadata.publish) continue;

      documents.push({
        slug: file.replace(/\.(mdita|md)$/, ''),
        title: metadata.title || 'Untitled',
        content: parsedContent,
        author: metadata.author,
        date: metadata.date,
        category: metadata.category,
        tags: metadata.tags || [],
        audience: metadata.audience,
        shortdesc: metadata.shortdesc || '',
      });
    }

    // Create the public directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });

    // Write the documents to a JSON file
    await fs.writeFile(
      path.join(outputDir, 'search-index.json'),
      JSON.stringify({ documents }, null, 2)
    );

    console.log('Search index built successfully');
  } catch (error) {
    console.error('Error building search index:', error);
    process.exit(1);
  }
}

buildSearchIndex(); 