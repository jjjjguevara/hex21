import { promises as fs } from 'fs';
import { join, relative, extname } from 'path';
import { processMarkdown } from '../markdown/processor';
import { ProcessedContent, Frontmatter, Embed } from '../markdown/types';

export interface ContentMap {
  [key: string]: ProcessedContent;
}

export class ContentLoader {
  private contentDir: string;
  private contentCache: ContentMap = {};
  private filePathCache: { [key: string]: string | null } = {};
  private processingCache: { [key: string]: Promise<ProcessedContent> | undefined } = {};
  private concurrentOperations = 0;
  private readonly MAX_CONCURRENT = 5;
  private operationQueue: (() => Promise<void>)[] = [];

  constructor(contentDir: string = 'content') {
    this.contentDir = join(process.cwd(), contentDir);
  }

  private async waitForAvailableSlot(): Promise<void> {
    if (this.concurrentOperations < this.MAX_CONCURRENT) {
      this.concurrentOperations++;
      return;
    }
    
    return new Promise((resolve) => {
      this.operationQueue.push(async () => {
        this.concurrentOperations++;
        resolve();
      });
    });
  }

  private releaseSlot(): void {
    this.concurrentOperations--;
    const next = this.operationQueue.shift();
    if (next) {
      next();
    }
  }

  private async findFile(slug: string): Promise<string | null> {
    // Check file path cache first
    if (this.filePathCache[slug]) {
      return this.filePathCache[slug];
    }

    console.log(`Finding file for slug: ${slug}`);
    
    // Decode URL-encoded path
    const decodedSlug = decodeURIComponent(slug);
    
    // Clean up the slug by removing leading/trailing slashes and the 'topics/' prefix
    const cleanSlug = decodedSlug
      .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
      .replace(/^topics\//, '') // Remove 'topics/' prefix
      .replace(/\|.*$/, ''); // Remove everything after the pipe character
    
    console.log(`Cleaned slug: ${cleanSlug}`);
    
    // Define directories to search
    const directories = [
      this.contentDir,
      join(this.contentDir, 'maps'),
      join(this.contentDir, 'topics'),
      join(this.contentDir, 'articles'),
      join(this.contentDir, 'docs')
    ];
    
    // Define file extensions to try
    const extensions = ['.ditamap', '.mdita', '.md', '.dita', '.xml'];
    
    // Try each directory and extension combination
    for (const dir of directories) {
      for (const ext of extensions) {
        const filePath = join(dir, cleanSlug + ext);
        try {
          await fs.access(filePath);
          console.log(`Found file at: ${filePath}`);
          // Cache the file path
          this.filePathCache[slug] = filePath;
          return filePath;
        } catch (error) {
          // File not found, continue to next combination
          continue;
        }
      }
    }
    
    console.log(`No file found for slug: ${slug}`);
    return null;
  }

  private async processContent(filePath: string): Promise<ProcessedContent> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Process based on file extension
    const ext = extname(filePath).toLowerCase();
    
    if (ext === '.md' || ext === '.mdita') {
      return processMarkdown(content, this.contentDir);
    } else if (ext === '.dita' || ext === '.xml') {
      // For now, treat DITA/XML files as markdown
      // TODO: Implement proper DITA/XML processing
      return processMarkdown(content, this.contentDir);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  async loadContent(
    slug: string,
    visitedSlugs: Set<string> = new Set()
  ): Promise<ProcessedContent> {
    // Check for recursion
    if (visitedSlugs.has(slug)) {
      console.warn(`Circular embed detected: Trying to load ${slug} again. Path: ${[...visitedSlugs].join(' -> ')}`);
      throw new Error(`Circular embed detected involving slug: ${slug}`);
    }
    
    // Add current slug to visited set for this call chain
    const currentVisitedSlugs = new Set(visitedSlugs);
    currentVisitedSlugs.add(slug);
    
    // Check content cache first
    if (this.contentCache[slug]) {
      return this.contentCache[slug];
    }

    // Check if content is being processed
    const existingProcess = this.processingCache[slug];
    if (existingProcess) {
      return existingProcess;
    }

    await this.waitForAvailableSlot();

    try {
      const processPromise = (async () => {
        const filePath = await this.findFile(slug);
        if (!filePath) {
          throw new Error(`Content not found: ${slug}`);
        }

        const content = await this.processContent(filePath);
        
        // Store preliminary content in cache immediately to break cycles
        this.contentCache[slug] = content; 
        
        // Process embeds concurrently with limited concurrency
        if (content.embeds && content.embeds.length > 0) {
          const embedPromises = content.embeds.map(async (embed: string | Embed) => { // Explicitly type embed
            try {
              // Extract the source from the embed object
              const embedSlug = typeof embed === 'string' ? embed : embed.source;
              // Pass the updated visitedSlugs set down
              const embedContent = await this.loadContent(embedSlug, currentVisitedSlugs);
              
              // If a section is specified, extract it
              if (typeof embed !== 'string' && embed.section) {
                // Simplified regex example, adjust as needed
                const sectionRegex = new RegExp(`(?:<h[1-6][^>]*>\\s*${embed.section}\\s*</h[1-6]>|<a[^>]*name="${embed.section}"[^>]*>)(.*?)(?=<h[1-6]|<a[^>]*name=|$)`, 'si');
                const sectionMatch = embedContent.html.match(sectionRegex);

                if (sectionMatch && sectionMatch[1]) {
                  return {
                    ...embedContent,
                    html: sectionMatch[1].trim(),
                  };
                } else {
                    console.warn(`Section "${embed.section}" not found in embed: ${embedSlug}`);
                    // Return the full embed content if section not found
                    return embedContent; 
                }
              }
              
              return embedContent;
            } catch (error) {
              // Log circular dependency errors specifically if they occur
              if (error instanceof Error && error.message.includes('Circular embed detected')) {
                 console.error(`Failed to load embed due to cycle: ${slug} embedding ${typeof embed === 'string' ? embed : embed.source}`);
              } else {
                 console.error(`Failed to load embed: ${typeof embed === 'string' ? embed : JSON.stringify(embed)}`, error);
              }
              return null;
            }
          });

          const resolvedEmbeds = (await Promise.all(embedPromises)).filter((embed): embed is ProcessedContent => embed !== null);
          // Update the cached content with resolved embeds
          this.contentCache[slug].resolvedEmbeds = resolvedEmbeds;
        }

        return this.contentCache[slug]; // Return the potentially updated cached content
      })();

      this.processingCache[slug] = processPromise;

      const result = await processPromise;
      
      // Clear the processing cache entry
      delete this.processingCache[slug];
      
      return result;
    } finally {
      this.releaseSlot();
    }
  }

  async getAllContent(): Promise<ContentMap> {
    const contentMap: ContentMap = {};

    // Read from root content directory
    try {
      const files = await fs.readdir(this.contentDir);
      const contentPromises = files
        .filter(f => f.endsWith('.md') || f.endsWith('.mdita'))
        .map(async (file) => {
          const slug = file.replace(/\.[^/.]+$/, '');
          try {
            contentMap[slug] = await this.loadContent(slug);
          } catch (error) {
            console.warn(`Failed to load content: ${slug}`, error);
          }
        });

      await Promise.all(contentPromises);
    } catch (error) {
      console.warn('Error reading root content directory:', error);
    }

    // Read from topics directory
    try {
      const topicsDir = join(this.contentDir, 'topics');
      const files = await fs.readdir(topicsDir);
      const contentPromises = files
        .filter(f => f.endsWith('.md') || f.endsWith('.mdita'))
        .map(async (file) => {
          const slug = file.replace(/\.[^/.]+$/, '');
          try {
            contentMap[`topics/${slug}`] = await this.loadContent(`topics/${slug}`);
          } catch (error) {
            console.warn(`Failed to load content: topics/${slug}`, error);
          }
        });

      await Promise.all(contentPromises);
    } catch (error) {
      console.warn('Error reading topics directory:', error);
    }

    // Read from articles directory
    try {
      const articlesDir = join(this.contentDir, 'articles');
      const files = await fs.readdir(articlesDir);
      const contentPromises = files
        .filter(f => f.endsWith('.md') || f.endsWith('.mdita'))
        .map(async (file) => {
          const slug = file.replace(/\.[^/.]+$/, '');
          try {
            contentMap[`articles/${slug}`] = await this.loadContent(`articles/${slug}`);
          } catch (error) {
            console.warn(`Failed to load content: articles/${slug}`, error);
          }
        });

      await Promise.all(contentPromises);
    } catch (error) {
      console.warn('Error reading articles directory:', error);
    }

    return contentMap;
  }

  async getPublishedContent(): Promise<string[]> {
    const publishedSlugs: string[] = [];
    
    // Get all content files
    const contentFiles = await this.getAllContentFiles();
    
    // Process each file to check if it's published
    await Promise.all(contentFiles.map(async (filePath) => {
      try {
        const content = await this.processContent(filePath);
        if (content.metadata?.publish) {
          // Convert file path to slug
          const slug = this.filePathToSlug(filePath);
          publishedSlugs.push(slug);
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }));
    
    return publishedSlugs;
  }

  private async getAllContentFiles(): Promise<string[]> {
    const contentFiles: string[] = [];
    const directories = ['topics', 'articles', 'docs'].map(dir => join(this.contentDir, dir));
    
    await Promise.all(directories.map(async (dir) => {
      try {
        const files = await fs.readdir(dir, { withFileTypes: true });
        const filePaths = files
          .filter(file => file.isFile() && /\.(mdita|md|dita|xml)$/.test(file.name))
          .map(file => join(dir, file.name));
        contentFiles.push(...filePaths);
      } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
      }
    }));
    
    return contentFiles;
  }

  private filePathToSlug(filePath: string): string {
    // Remove content directory prefix and file extension
    const relativePath = relative(this.contentDir, filePath);
    const slug = relativePath.replace(/\.[^/.]+$/, '');
    return slug;
  }

  async getContentByTag(tag: string): Promise<ContentMap> {
    const allContent = await this.getAllContent();
    return Object.fromEntries(
      Object.entries(allContent).filter(([_, content]) => 
        content.frontmatter.tags.includes(tag)
      )
    );
  }

  async getContentByAudience(audience: string): Promise<ContentMap> {
    const allContent = await this.getAllContent();
    return Object.fromEntries(
      Object.entries(allContent).filter(([_, content]) => 
        content.frontmatter.audience === audience
      )
    );
  }

  clearCache() {
    this.contentCache = {};
    this.filePathCache = {};
    this.processingCache = {};
  }
} 