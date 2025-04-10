import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

// Helper function to check if a file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function findTopicContent(topicId: string, topicsDir: string): Promise<string | null> {
  console.log(`[TopicFinder] Looking for topic: ${topicId} (topicsDir: ${topicsDir})`);
  
  // Clean up the topic ID by removing any leading slashes or ../topics/
  const cleanTopicId = topicId
    .replace(/^\.\.\/topics\//, '')
    .replace(/^topics\//, '')
    .replace(/^\//, '')
    .replace(/\.(mdita|md|dita|xml)$/, ''); // Remove any existing extension
  
  console.log('[TopicFinder] Cleaned topic ID:', cleanTopicId);
  
  // Extract the base filename without directories (for wiki-links)
  const baseFileName = path.basename(cleanTopicId);
  
  // Try different extensions
  const extensions = ['.md', '.mdita', '.dita', '.xml'];
  
  // FIRST APPROACH: Direct paths - most specific to most general
  console.log(`[TopicFinder] APPROACH 1: Trying direct paths with different extensions`);
  
  // 1. Try exact path with all extensions
  for (const ext of extensions) {
    // First try the exact path as provided
    const exactPath = path.join(topicsDir, topicId);
    console.log(`[TopicFinder] Trying exact path as provided: ${exactPath}`);
    if (await fileExists(exactPath)) {
      console.log('[TopicFinder] Found exact match:', exactPath);
      return fs.readFile(exactPath, 'utf8');
    }
    
    // Next try with this extension
    const withExt = path.join(topicsDir, cleanTopicId + ext);
    console.log(`[TopicFinder] Trying with extension ${ext}: ${withExt}`);
    if (await fileExists(withExt)) {
      console.log('[TopicFinder] Found with added extension:', withExt);
      return fs.readFile(withExt, 'utf8');
    }
  }
  
  // SECOND APPROACH: Try different paths in priority order
  console.log(`[TopicFinder] APPROACH 2: Trying different directories`);
  
  const pathsToTry = [
    // 1. First check if it's a direct path (as provided)
    path.dirname(topicsDir),
    
    // 2. Check if it's in the same directory as the parent map
    topicsDir,
    
    // 3. Check in all article subdirectories
    ...await getAllArticleSubdirectories(),
    
    // 4. Check in standard content directories
    path.join(process.cwd(), 'content/topics'),
    path.join(process.cwd(), 'content/articles'),
    path.join(process.cwd(), 'content'),
  ];

  // Try all path combinations systematically
  for (const basePath of pathsToTry) {
    for (const ext of extensions) {
      try {
        // Try with full path (if it contains directories)
        const topicPath = path.join(basePath, `${cleanTopicId}${ext}`);
        console.log('[TopicFinder] Trying path:', topicPath);
        
        if (await fileExists(topicPath)) {
          const content = await fs.readFile(topicPath, 'utf8');
          console.log('[TopicFinder] Found topic file at:', topicPath);
          return content;
        }
        
        // If the topicId comes from a wiki-link, it might just be a filename without path
        // In that case, try with just the filename
        if (cleanTopicId.includes('/')) {
          const fileNameOnlyPath = path.join(basePath, `${baseFileName}${ext}`);
          if (await fileExists(fileNameOnlyPath)) {
            const content = await fs.readFile(fileNameOnlyPath, 'utf8');
            console.log('[TopicFinder] Found topic file by basename:', fileNameOnlyPath);
            return content;
          }
        }
      } catch (error) {
        console.log('[TopicFinder] Error or not found at:', path.join(basePath, `${cleanTopicId}${ext}`));
        continue;
      }
    }
  }

  // As a last resort, try to find the file through a filesystem search (glob)
  try {
    console.log(`[TopicFinder] APPROACH 3: Trying glob search for: ${baseFileName}`);
    const contentDir = path.join(process.cwd(), 'content');
    
    // First try an exact match
    for (const ext of extensions) {
      const globPattern = `**/${baseFileName}${ext}`;
      const matches = await glob(globPattern, { cwd: contentDir, absolute: true });
      
      if (matches.length > 0) {
        console.log(`[TopicFinder] Found ${matches.length} matches via glob for ${baseFileName}${ext}:`, matches);
        // Use the first match (could be enhanced to be smarter about which one to choose)
        const content = await fs.readFile(matches[0], 'utf8');
        return content;
      }
    }
  } catch (error) {
    console.error('[TopicFinder] Error during glob search:', error);
  }
  
  console.error(`[TopicFinder] Could not find topic ${topicId} with any supported extension`);
  return null;
}

// Helper to get all subdirectories in the articles directory
async function getAllArticleSubdirectories(): Promise<string[]> {
  const articlesDir = path.join(process.cwd(), 'content/articles');
  try {
    const entries = await fs.readdir(articlesDir, { withFileTypes: true });
    const subdirs = entries
      .filter(entry => entry.isDirectory())
      .map(dir => path.join(articlesDir, dir.name));
    
    console.log(`[TopicFinder] Found article subdirectories:`, subdirs);
    return subdirs;
  } catch (error) {
    console.error('[TopicFinder] Error finding article subdirectories:', error);
    return [];
  }
} 