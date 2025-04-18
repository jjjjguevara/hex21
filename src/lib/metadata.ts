import path from 'path';
import { promises as fs } from 'fs';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import rehypeSlug from 'rehype-slug';
import { BaseMetadata, TopicMetadata, MapMetadata } from '@/types/content';

// Custom plugin to mark LaTeX code blocks for client-side highlighting
function rehypeMarkLaTeX() {
  return function (tree: any) {
    // Visit all pre > code elements
    const visit = (node: any) => {
      if (node.tagName === 'pre' && node.children && node.children.length > 0) {
        const codeNode = node.children.find((child: any) => child.tagName === 'code');
        if (codeNode && codeNode.properties && codeNode.properties.className) {
          // Check if this is a LaTeX code block
          const isLatex = codeNode.properties.className.some(
            (cls: string) => cls === 'language-latex' || cls === 'language-tex'
          );
          
          if (isLatex) {
            // Mark for client-side processing by adding a data attribute
            codeNode.properties.className = ['no-highlight', 'latex-block'];
            codeNode.properties.dataLatex = true;
          }
        }
      }
      
      // Recursively visit children
      if (node.children) {
        node.children.forEach(visit);
      }
    };
    
    visit(tree);
  };
}

function extractXMLValue(content: string, tag: string): string | undefined {
  // First try to find it in topicmeta
  const topicmetaRegex = new RegExp(`<topicmeta>[^]*?<${tag}[^>]*>(.*?)</${tag}>[^]*?</topicmeta>`, 's');
  const topicmetaMatch = content.match(topicmetaRegex);
  if (topicmetaMatch) {
    return topicmetaMatch[1].trim();
  }

  // Fallback to direct tag search
  const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 's');
  const match = content.match(regex);
  return match ? match[1].trim() : undefined;
}

function extractDataValues(content: string): { [key: string]: any } {
  const dataRegex = /<data\s+name="([^"]+)"\s+value="([^"]+)"/g;
  const values: { [key: string]: any } = {};
  let match;
  while ((match = dataRegex.exec(content)) !== null) {
    const [_, name, value] = match;
    // Handle features specially
    if (name === 'featured') {
      values.features = values.features || {};
      values.features.featured = value === 'true';
    } else {
      values[name] = value;
    }
  }
  return values;
}

function extractTopicRefs(content: string): string[] {
  const regex = /<topicref\s+href="([^"]+)"/g;
  const matches = [...content.matchAll(regex)];
  return matches.map(match => match[1]);
}

function parseMapMetadata(content: string): { metadata: MapMetadata; topics: string[] } {
  try {
    // First try to parse YAML frontmatter
    const { data: yamlData } = matter(content);
    
    if (yamlData && Object.keys(yamlData).length > 0) {
      // Extract topics from XML part after frontmatter
      const topics = extractTopicRefs(content);

      const metadata: MapMetadata = {
        title: yamlData.title || 'Untitled',
        author: yamlData.author || yamlData.authors?.[0],
        category: yamlData.category || yamlData.categories?.[0] || 'Uncategorized',
        audience: yamlData.audience,
        publish: yamlData.publish !== false, // Default to true if not specified
        access_level: yamlData.access_level || 'public',
        tags: yamlData.tags || yamlData.keywords || [],
        shortdesc: yamlData.shortdesc || yamlData.description,
        features: {
          featured: yamlData.features?.featured === true,
          ...yamlData.features
        }
      };

      console.log('Parsed YAML metadata:', yamlData);
      return { metadata, topics };
    }

    // Fallback to XML parsing if no YAML frontmatter
    const title = extractXMLValue(content, 'title') || 'Untitled';
    const author = extractXMLValue(content, 'author');
    const category = extractXMLValue(content, 'category') || 'Uncategorized';
    const audience = extractXMLValue(content, 'audience');
    const shortdesc = extractXMLValue(content, 'shortdesc') || extractXMLValue(content, 'description');
    
    // Extract all data values at once
    const dataValues = extractDataValues(content);
    const publish = dataValues.publish !== 'false'; // Default to true if not specified
    const accessLevel = dataValues.access_level || 'public';
    const tags = dataValues.tags ? dataValues.tags.split(',').map((tag: string) => tag.trim()) : [];

    const topics = extractTopicRefs(content);

    const metadata: MapMetadata = {
      title,
      author,
      category,
      audience,
      publish,
      access_level: accessLevel,
      tags,
      shortdesc,
      features: {
        featured: dataValues.features?.featured === true,
        ...dataValues.features
      }
    };

    console.log('Parsed XML metadata:', metadata);
    return { metadata, topics };
  } catch (error) {
    console.error('Error parsing metadata:', error);
    // Return default values if parsing fails
    return {
      metadata: {
        title: 'Untitled',
        category: 'Uncategorized',
        publish: true, // Default to true
        access_level: 'public',
        tags: [],
        features: {
          featured: false
        }
      },
      topics: []
    };
  }
}

export async function parseMetadata(content: string, type: 'map' | 'topic' = 'topic'): Promise<{ 
  metadata: MapMetadata | TopicMetadata; 
  topics?: string[];
  content: string;
}> {
  if (type === 'map') {
    const result = parseMapMetadata(content);
    return { ...result, content: '' }; // Maps don't have content to render
  }

  // Parse YAML frontmatter for topics
  const { data, content: mdContent } = matter(content);
  
  const metadata: TopicMetadata = {
    id: data.id || '',
    title: data.title || '',
    author: data.author,
    date: data.date,
    audience: data.audience,
    tags: data.tags || [],
    category: data.category,
    publish: data.publish !== false,
    conditional: data.conditional || {},
    shortdesc: data.shortdesc || data.description
  };

  // Convert markdown content to HTML using unified
  const file = await unified()
    .use(remarkParse) // Parse markdown
    .use(remarkGfm) // Add GFM support (tables, strikethrough, etc.)
    .use(remarkRehype, { allowDangerousHtml: true }) // Convert to Rehype AST
    .use(rehypeRaw) // Handle raw HTML in markdown
    .use(rehypeMarkLaTeX) // Mark LaTeX code blocks for client-side processing
    .use(rehypeSlug) // Add IDs to headings for linking
    .use(rehypeStringify) // Convert Rehype AST to HTML string
    .process(mdContent);

  const htmlContent = String(file);

  return { metadata, content: htmlContent };
}

export function validateMetadata(metadata: BaseMetadata): boolean {
  if (!metadata.title) {
    console.error('Missing required field: title');
    return false;
  }

  if ('audience' in metadata && metadata.audience) {
    const validAudiences = ['beginner', 'intermediate', 'expert', 'all', 'developer', 'Undergraduate Students'];
    const audiences = Array.isArray(metadata.audience) ? metadata.audience : [metadata.audience];
    
    if (!audiences.every(a => validAudiences.includes(a))) {
      console.error('Invalid audience level:', metadata.audience);
      return false;
    }
  }

  return true;
}

export function isTopicCompatibleWithMap(
  topicMetadata: TopicMetadata, 
  mapMetadata: MapMetadata
): { compatible: boolean; reason?: string } {
  // Check audience compatibility
  if (topicMetadata.audience && mapMetadata.audience) {
    const audienceLevels = ['beginner', 'intermediate', 'expert', 'all', 'developer'];
    const topicAudiences = Array.isArray(topicMetadata.audience) ? topicMetadata.audience : [topicMetadata.audience];
    const mapAudiences = Array.isArray(mapMetadata.audience) ? mapMetadata.audience : [mapMetadata.audience];
    
    // Check if any topic audience level exceeds any map audience level
    const hasIncompatibleAudience = topicAudiences.some(topicAudience => {
      const topicLevel = audienceLevels.indexOf(topicAudience);
      return mapAudiences.some(mapAudience => {
        const mapLevel = audienceLevels.indexOf(mapAudience);
        return topicLevel > mapLevel;
      });
    });
    
    if (hasIncompatibleAudience) {
      return { 
        compatible: false, 
        reason: 'Topic audience level exceeds map audience level' 
      };
    }
  }

  // Check publish date
  if (mapMetadata.publish_date) {
    const publishDate = new Date(mapMetadata.publish_date);
    if (publishDate > new Date()) {
      return { 
        compatible: false, 
        reason: 'Map publish date is in the future' 
      };
    }
  }

  // Check access level compatibility
  const accessLevels = ['public', 'restricted', 'classified'];
  const topicAccess = topicMetadata.conditional?.access_level || 'public';
  const mapAccess = mapMetadata.access_level || 'public';
  
  if (accessLevels.indexOf(topicAccess) > accessLevels.indexOf(mapAccess)) {
    return { 
      compatible: false, 
      reason: 'Topic access level exceeds map access level' 
    };
  }

  return { compatible: true };
}