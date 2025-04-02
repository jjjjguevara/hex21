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
import { ProcessedContent, Metadata } from './types';
import matter from 'gray-matter';
import yaml from 'js-yaml';

// Custom remark plugin for Obsidian-style footnotes
function remarkObsidianFootnotes() {
  return (tree: any) => {
    const footnotes: Array<{ identifier: string; content: string }> = [];
    let footnoteCounter = 0;

    // First pass: collect footnotes
    visit(tree, (node: any) => {
      if (node.type === 'paragraph') {
        const text = node.children?.[0]?.value || '';
        const footnoteMatch = text.match(/\[\^(\d+)\]:\s*([\s\S]*?)(?=\n\[|\n\n|$)/);
        if (footnoteMatch) {
          const [_, identifier, content] = footnoteMatch;
          footnotes.push({ identifier, content });
        }
      }
    });

    // Second pass: replace footnote references
    visit(tree, (node: any) => {
      if (node.type === 'text') {
        const text = node.value;
        const footnoteRefRegex = /\[\^(\d+)\]/g;
        let match;
        let lastIndex = 0;
        const newChildren = [];

        while ((match = footnoteRefRegex.exec(text)) !== null) {
          const [fullMatch, identifier] = match;
          const footnote = footnotes.find(f => f.identifier === identifier);
          
          if (footnote) {
            // Add text before the footnote reference
            if (match.index > lastIndex) {
              newChildren.push({
                type: 'text',
                value: text.slice(lastIndex, match.index)
              });
            }
            
            // Add the footnote reference
            newChildren.push({
              type: 'footnoteRef',
              identifier,
              children: [{ type: 'text', value: identifier }]
            });
            
            lastIndex = match.index + fullMatch.length;
          }
        }

        // Add remaining text
        if (lastIndex < text.length) {
          newChildren.push({
            type: 'text',
            value: text.slice(lastIndex)
          });
        }

        if (newChildren.length > 0) {
          node.children = newChildren;
        }
      }
    });

    // Add footnotes section at the end
    if (footnotes.length > 0) {
      tree.children.push({
        type: 'heading',
        depth: 2,
        children: [{ type: 'text', value: 'Footnotes' }]
      });

      tree.children.push({
        type: 'list',
        ordered: true,
        children: footnotes.map(footnote => ({
          type: 'listItem',
          children: [
            {
              type: 'paragraph',
              children: [
                { type: 'text', value: footnote.content },
                {
                  type: 'link',
                  url: `#fnref-${footnote.identifier}`,
                  children: [{ type: 'text', value: ' ↩' }]
                }
              ]
            }
          ]
        }))
      });
    }
  };
}

// Helper function to visit nodes
function visit(tree: any, visitor: (node: any) => void) {
  visitor(tree);
  if (tree.children) {
    tree.children.forEach((child: any) => visit(child, visitor));
  }
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
    .use(remarkObsidianFootnotes) // Add our custom footnote plugin
    .use(remarkRehype, { 
      allowDangerousHtml: true,
      footnoteLabel: 'Footnotes',
      footnoteBackLabel: 'Back to content',
    })
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

  // Extract footnotes
  const footnotes: Array<{ identifier: string; content: string }> = [];
  const footnoteRegex = /\[\^(\d+)\]:\s*([\s\S]*?)(?=\n\[|\n\n|$)/g;
  let match;
  while ((match = footnoteRegex.exec(content)) !== null) {
    const [_, identifier, content] = match;
    footnotes.push({ identifier, content });
  }

  return {
    html,
    metadata,
    embeds,
    footnotes,
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

// Helper function to extract embed references
function extractEmbeds(html: string): Array<string | { source: string; section?: string }> {
  const embedRegex = /!\[\[([^\]]+)\]\]/g;
  const embeds: Array<string | { source: string; section?: string }> = [];
  let match;

  while ((match = embedRegex.exec(html)) !== null) {
    const [_, reference] = match;
    const [source, section] = reference.split('#');
    embeds.push(section ? { source, section } : source);
  }

  return embeds;
} 