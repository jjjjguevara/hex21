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
    const { data: rawMetadata, content: xmlContent } = matter(content);
    console.log('Raw parsed XML:', { rawMetadata, xmlContent });

    // Parse XML content
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '_',
    });
    const result = parser.parse(xmlContent);
    console.log('Raw parsed XML:', result);

    // Extract topics from the map
    const topics: string[] = [];
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

    // Normalize metadata for our front-end
    const metadata: Metadata = {
      title: rawMetadata.title || result.map?.title || '',
      slug: rawMetadata.slug || '',
      publish: rawMetadata.publish ?? true,  // Default to true if not specified
      featured: rawMetadata.features?.featured ?? false,
      // Optional fields
      date: rawMetadata['publication-date'],
      lastEdited: rawMetadata['last-edited'],
      categories: rawMetadata.categories || [],
      authors: (rawMetadata.authors || []).map((author: any) => ({
        name: author.name || '',
        conref: author.conref || ''
      })),
      editor: rawMetadata.editor,
      reviewer: rawMetadata.reviewer,
      keywords: rawMetadata.keywords || [],
      audience: Array.isArray(rawMetadata.audience) ? rawMetadata.audience : [],
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