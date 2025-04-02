import { promises as fs } from 'fs';
import path from 'path';

export async function findTopicContent(topicId: string, topicsDir: string): Promise<string | null> {
  // Clean up the topic ID by removing any leading slashes or ../topics/
  const cleanTopicId = topicId
    .replace(/^\.\.\/topics\//, '')
    .replace(/^topics\//, '')
    .replace(/^\//, '')
    .replace(/\.(mdita|md|dita|xml)$/, ''); // Remove any existing extension
  
  console.log('Looking for topic file:', topicId);
  console.log('Cleaned topic ID:', cleanTopicId);
  console.log('Topics directory:', topicsDir);
  
  // Try different extensions
  const extensions = ['.md', '.mdita', '.dita', '.xml'];
  
  // Try different paths
  const pathsToTry = [
    topicsDir,
    path.join(process.cwd(), 'content/topics'),
    path.join(process.cwd(), 'content'),
  ];

  for (const basePath of pathsToTry) {
    for (const ext of extensions) {
      try {
        const topicPath = path.join(basePath, `${cleanTopicId}${ext}`);
        console.log('Trying path:', topicPath);
        const content = await fs.readFile(topicPath, 'utf8');
        console.log('Found topic file at:', topicPath);
        return content;
      } catch (error) {
        console.log('Not found at:', path.join(basePath, `${cleanTopicId}${ext}`));
        continue;
      }
    }
  }
  
  console.error(`Could not find topic ${topicId} with any supported extension`);
  return null;
} 