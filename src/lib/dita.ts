import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { XMLParser } from 'fast-xml-parser';

interface Author {
  name: string;
  conref?: string;
}

interface Metadata {
  title: string;
  slug: string;
  publish: boolean;
  featured: boolean;
  // Optional fields that we support
  date?: string;
  lastEdited?: string;
  categories?: string[];
  authors?: Author[];
  editor?: string;
  reviewer?: string;
  keywords?: string[];
  audience?: string[];
  language?: string;
  version?: string;
  // Raw metadata for future use
  _raw?: Record<string, unknown>;
}

export async function parseMap(content: string): Promise<{ metadata: Metadata; topics: string[] }> {
  try {
    // Parse YAML front matter
    const { data: rawMetadata, content: mapContent } = matter(content);
    console.log('Raw parsed content:', { rawMetadata, mapContentLength: mapContent.length });

    const topics: string[] = [];

    // First try to parse as XML (for traditional DITA maps)
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '_',
      });
      const result = parser.parse(mapContent);
      console.log('Parsed XML result:', result);

      // Extract topics from XML map
      if (result.map?.topicref) {
        const extractTopics = (topicref: any): void => {
          if (typeof topicref === 'object') {
            if (Array.isArray(topicref)) {
              topicref.forEach(t => extractTopics(t));
            } else {
              if (topicref._href) {
                topics.push(topicref._href);
              }
              if (topicref.topicref) {
                extractTopics(topicref.topicref);
              }
            }
          }
        };
        extractTopics(result.map.topicref);
      }
    } catch (xmlError) {
      console.log('Not a valid XML map, trying Markdown format:', xmlError);
      
      // If XML parsing fails, try Markdown wiki-links format (used in docs)
      const wikiLinkRegex = /\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g;
      const matches = Array.from(mapContent.matchAll(wikiLinkRegex));
      
      console.log('Found wiki links:', matches.length);
      
      for (const match of matches) {
        if (match[1]) {
          // Extract the file path part (before the pipe if there is one)
          const filePath = match[1].trim();
          console.log(`Adding topic from wiki link: ${filePath}`);
          topics.push(filePath);
        }
      }
      
      // Also try bullet list format with standard markdown links
      const bulletLinkRegex = /^\s*-\s*\[([^\]]+)\]\(([^)]+)\)/gm;
      const bulletMatches = Array.from(mapContent.matchAll(bulletLinkRegex));
      
      console.log('Found bullet links:', bulletMatches.length);
      
      for (const match of bulletMatches) {
        if (match[2]) {
          const filePath = match[2].trim();
          console.log(`Adding topic from bullet link: ${filePath}`);
          topics.push(filePath);
        }
      }
    }

    // Log extracted topics
    console.log('Extracted topics:', topics);

    // Normalize metadata for our front-end
    const metadata: Metadata = {
      title: rawMetadata.title || '',
      slug: rawMetadata.slug || '',
      publish: rawMetadata.publish ?? true,  // Default to true if not specified
      featured: rawMetadata.featured ?? rawMetadata.features?.featured ?? false,
      // Optional fields
      date: rawMetadata.date || rawMetadata['publication-date'],
      lastEdited: rawMetadata['last-edited'],
      categories: rawMetadata.categories || [],
      authors: typeof rawMetadata.author === 'string' 
        ? [{ name: rawMetadata.author, conref: '' }]
        : (rawMetadata.authors || []).map((author: any) => ({
            name: typeof author === 'string' ? author : (author.name || ''),
            conref: typeof author === 'string' ? '' : (author.conref || '')
          })),
      editor: rawMetadata.editor,
      reviewer: rawMetadata.reviewer,
      keywords: rawMetadata.keywords || rawMetadata.tags || [],
      audience: Array.isArray(rawMetadata.audience) 
        ? rawMetadata.audience 
        : typeof rawMetadata.audience === 'string' 
          ? [rawMetadata.audience] 
          : [],
      language: rawMetadata.language,
      version: rawMetadata.version,
      // Store raw metadata for future use
      _raw: rawMetadata
    };

    return { metadata, topics };
  } catch (error) {
    console.error('Error parsing DITA map:', error);
    // Return minimal valid metadata to prevent crashes
    return {
      metadata: {
        title: '',
        slug: '',
        publish: false,
        featured: false
      },
      topics: []
    };
  }
}

export async function getTopicContent(filePath: string): Promise<string> {
  try {
    console.log('Reading topic file:', filePath);
    
    let content: string;
    try {
      content = await fs.readFile(filePath, 'utf8');
      console.log('Raw content length:', content.length);
    } catch (error) {
      console.error(`Error reading topic file ${filePath}:`, error);
      throw new Error(`Failed to read topic file: ${filePath}`);
    }

    // Clean up the content
    content = content.trim();
    if (!content) {
      console.warn(`Empty content in file: ${filePath}`);
      return '';
    }

    let parsedContent;
    try {
      parsedContent = matter(content);
      console.log('Parsed frontmatter:', parsedContent.data);
    } catch (error) {
      console.error(`Error parsing frontmatter in ${filePath}:`, error);
      // If frontmatter parsing fails, treat the entire content as markdown
      parsedContent = { content: content, data: {} };
    }

    const { data: metadata, content: mdContent } = parsedContent;
    
    // Process any metadata from the topic file if needed
    // For now, we're just using the content
    
    // Replace inline math delimiters with LaTeX syntax
    let processedContent = mdContent;

    try {
      // Single $ for inline math - only replace if there's content between the delimiters
      processedContent = processedContent.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
        try {
          const trimmedFormula = formula.trim();
          if (!trimmedFormula) {
            console.warn(`Empty inline math formula in ${filePath}`);
            return match;
          }
          return `\\(${trimmedFormula}\\)`;
        } catch {
          console.warn(`Failed to process inline math: ${match}`);
          return match;
        }
      });
      
      // Double $$ for display math - handle multiline content
      processedContent = processedContent.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
        try {
          const trimmedFormula = formula.trim();
          if (!trimmedFormula) {
            console.warn(`Empty display math formula in ${filePath}`);
            return match;
          }
          return `\\[${trimmedFormula}\\]`;
        } catch {
          console.warn(`Failed to process display math: ${match}`);
          return match;
        }
      });
      
      // Handle special cases where LaTeX might be already properly formatted
      processedContent = processedContent
        .replace(/\\begin{equation}/g, '\\[')
        .replace(/\\end{equation}/g, '\\]')
        .replace(/\\begin{align}/g, '\\[\\begin{aligned}')
        .replace(/\\end{align}/g, '\\end{aligned}\\]')
        .replace(/\\begin{align\*}/g, '\\[\\begin{aligned}')
        .replace(/\\end{align\*}/g, '\\end{aligned}\\]')
        .replace(/\\begin{eqnarray}/g, '\\[\\begin{aligned}')
        .replace(/\\end{eqnarray}/g, '\\end{aligned}\\]')
        .replace(/\\begin{eqnarray\*}/g, '\\[\\begin{aligned}')
        .replace(/\\end{eqnarray\*}/g, '\\end{aligned}\\]');

      // Clean up any remaining LaTeX-specific commands
      processedContent = processedContent
        .replace(/\\nonumber/g, '')
        .replace(/\\label{[^}]+}/g, '')
        .replace(/\\tag{[^}]+}/g, '');
    } catch (error) {
      console.error(`Error processing math in ${filePath}:`, error);
      // Return the original content if math processing fails
      processedContent = mdContent;
    }
    
    console.log('Processed content length:', processedContent.length);
    
    if (processedContent.trim().length === 0) {
      console.warn(`Empty content after processing in ${filePath}`);
    }
    
    return processedContent;
  } catch (error) {
    console.error(`Error processing topic file ${filePath}:`, error);
    throw error;
  }
} 