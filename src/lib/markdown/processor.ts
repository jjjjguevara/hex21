import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { visit } from 'unist-util-visit';
import { ProcessedContent, Metadata, Footnote } from './types';
import matter from 'gray-matter';
import yaml from 'js-yaml';

// Custom remark plugin for Obsidian-style footnotes
function remarkObsidianFootnotes() {
  return (tree: any) => {
    const footnotes: Array<{ identifier: string; content: string }> = [];
    let footnoteCounter = 0;

    // First pass: collect footnote definitions using unist-util-visit
    visit(tree, 'paragraph', (node: any) => {
      const text = node.children?.[0]?.value || '';
      const footnoteMatch = text.match(/\[\^(\d+)\]:\s*([\s\S]*?)(?=\n\[|\n\n|$)/);
      if (footnoteMatch) {
        const [_, identifier, content] = footnoteMatch;
        footnotes.push({ identifier, content });
      }
    });

    // Second pass: replace footnote references using unist-util-visit
    visit(tree, 'text', (node: any, index, parent) => {
      const text = node.value;
      const footnoteRefRegex = /\[\^(\d+)\]/g;
      let match;
      let lastIndex = 0;
      const newChildren = [];

      while ((match = footnoteRefRegex.exec(text)) !== null) {
        const [fullMatch, identifier] = match;
        const footnote = footnotes.find(f => f.identifier === identifier);
        
        if (footnote) {
          if (match.index > lastIndex) {
            newChildren.push({
              type: 'text',
              value: text.slice(lastIndex, match.index)
            });
          }
          
          newChildren.push({
            type: 'footnoteReference',
            identifier,
            label: identifier
          });
          
          lastIndex = match.index + fullMatch.length;
        }
      }

      if (lastIndex < text.length) {
        newChildren.push({
          type: 'text',
          value: text.slice(lastIndex)
        });
      }

      if (newChildren.length > 0 && parent && index !== undefined) {
        parent.children.splice(index, 1, ...newChildren);
        return index + newChildren.length;
      }
    });

    if (footnotes.length > 0) {
      const footnoteDefinitionNodes = footnotes.map(footnote => ({
        type: 'footnoteDefinition',
        identifier: footnote.identifier,
        label: footnote.identifier,
        children: [{ 
          type: 'paragraph', 
          children: [{ type: 'text', value: footnote.content.trim() }] 
        }] 
      }));
      
      tree.children.push(...footnoteDefinitionNodes);
    }
  };
}

export async function processMarkdown(content: string, basePath: string): Promise<ProcessedContent> {
  // Parse frontmatter
  const { data: rawMetadata, content: markdownContent } = matter(content);

  // Convert metadata to our standard format
  const metadata: Metadata = {
    title: rawMetadata.title,
    author: rawMetadata.author,
    category: rawMetadata.category,
    audience: rawMetadata.audience,
    publish: rawMetadata.publish ?? false,
    access_level: rawMetadata.access_level ?? 'public',
    tags: rawMetadata.tags ?? [],
    shortdesc: rawMetadata.shortdesc,
    features: rawMetadata.features ?? {},
  };

  // Process markdown content
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkObsidianFootnotes)
    .use(remarkWikiLinks) // Add our custom wikilinks processor
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex, {
      throwOnError: false,
      strict: false,
      trust: true,
      macros: {
        '\\ce': '\\text{#1}',
      },
    })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings)
    .use(rehypeStringify)
    .process(markdownContent);

  const html = String(file);

  // Extract embed references from the content
  const embeds = extractEmbeds(html);

  return {
    html,
    metadata,
    embeds,
    frontmatter: {
      title: metadata.title || '',
      description: metadata.shortdesc || '',
      date: metadata.date || new Date().toISOString(),
      tags: metadata.tags || [],
      publish: metadata.publish || false,
      audience: metadata.audience || '',
      author: metadata.author || ''
    }
  };
}

// Custom remark plugin for Obsidian-style wiki links
function remarkWikiLinks() {
  return (tree: any) => {
    const wikiLinks: Array<{ target: string; alias?: string }> = [];
    
    visit(tree, 'text', (node: any, index, parent) => {
      if (!parent || index === undefined) return;
      
      const text = node.value;
      const wikiLinkRegex = /\[\[([^\]\|]+)(?:\|([^\]]+))?\]\]/g;
      let match;
      let lastIndex = 0;
      const newChildren = [];
      
      while ((match = wikiLinkRegex.exec(text)) !== null) {
        const [fullMatch, target, alias] = match;
        
        // Add the text before the wikilink
        if (match.index > lastIndex) {
          newChildren.push({
            type: 'text',
            value: text.slice(lastIndex, match.index)
          });
        }
        
        // Add the wikilink node
        wikiLinks.push({ target, alias });
        newChildren.push({
          type: 'link',
          url: `#wiki-${target.replace(/\s+/g, '-').toLowerCase()}`,
          data: {
            hProperties: {
              className: ['wiki-link'],
              'data-target': target,
              'data-alias': alias || ''
            }
          },
          children: [{
            type: 'text',
            value: alias || target
          }]
        });
        
        lastIndex = match.index + fullMatch.length;
      }
      
      // Add any remaining text
      if (lastIndex < text.length) {
        newChildren.push({
          type: 'text',
          value: text.slice(lastIndex)
        });
      }
      
      if (newChildren.length > 0) {
        parent.children.splice(index, 1, ...newChildren);
        return index + newChildren.length;
      }
    });
  };
}

// Helper function to extract embed references
function extractEmbeds(html: string): Array<string | { source: string; section?: string }> {
  // Extract both ![[file.png]] syntax from HTML and <img> tags with data-embed attribute
  const embedRegex = /!\[\[([^\]]+)\]\]/g;
  const imgRegex = /<img[^>]*data-embed="([^"]+)"[^>]*>/g;
  
  const embeds: Array<string | { source: string; section?: string }> = [];
  let match;

  // Extract from ![[file.png]] syntax
  while ((match = embedRegex.exec(html)) !== null) {
    const [_, reference] = match;
    const [source, section] = reference.split('#');
    embeds.push(section ? { source, section } : source);
  }
  
  // Extract from <img> tags
  while ((match = imgRegex.exec(html)) !== null) {
    const [_, source] = match;
    embeds.push(source);
  }

  return embeds;
} 