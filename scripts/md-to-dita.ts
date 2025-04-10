import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified, Plugin } from 'unified'; 
import { VFile } from 'vfile'; 
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkWikiLink from 'remark-wiki-link';
import remarkObsidianCallout from 'remark-obsidian-callout'; 
import remarkFootnotes from 'remark-footnotes'; // Import remark-footnotes
import { execSync } from 'child_process';

import { visit, SKIP } from 'unist-util-visit'; // Import SKIP
import type { Root, Content, Table, TableRow, TableCell, Link, Paragraph, FootnoteReference, FootnoteDefinition } from 'mdast'; 
import type { Element as HastElement } from 'hast'; 
import { toString } from 'mdast-util-to-string';

// Add the standard fs module for sync operations
import * as fsSync from 'fs';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const MAPS_DIR = path.join(CONTENT_DIR, 'maps');
const TOPICS_DIR = path.join(CONTENT_DIR, 'topics'); 
const INTERMEDIATE_DITA_DIR = path.join(process.cwd(), '.dita-temp'); 
const FINAL_OUTPUT_DIR = path.join(process.cwd(), 'public', 'dita-output'); 
const DITA_OT_COMMAND = 'dita'; 

async function ensureDirectoryExists(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Define types for metadata and nodes (adjust as needed)
interface Metadata {
    id?: string;
    title?: string;
    author?: string;
    date?: string; 
    tags?: string[];
    description?: string;
    category?: string;
    audience?: string;
    conditional?: { 
        access_level?: string;
        [key: string]: any; 
    };
    [key: string]: any; 
}

// Helper function to escape XML special characters
function escapeXml(unsafe: string | null | undefined): string {
    if (unsafe === null || unsafe === undefined) {
        return '';
    }
    const str = String(unsafe); 
    return str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
        return c;
    });
}

// Recursive function to convert MDAST node to DITA string
function mdastToDitaString(node: Content | Root | HastElement): string { 
    let xmlString = '';

    if (!node || typeof node !== 'object') { // Added typeof check
        return '';
    }

    // Handle HAST nodes (like divs from callouts) first if present
    if ('tagName' in node && node.tagName === 'div') {
        const divNode = node as HastElement;
        // Check if className exists and is an array before using includes
        const classNames = divNode.properties?.className;
        if (Array.isArray(classNames) && classNames.includes('callout')) {
            // Extract callout type (e.g., 'note', 'warning')
            // Ensure find is called on an array
            const typeMatch = classNames.find((cls: string | number) => typeof cls === 'string' && cls.startsWith('callout-'));
            // Ensure typeMatch is a string before calling replace
            const calloutType = typeof typeMatch === 'string' ? typeMatch.replace('callout-', '') : 'note';

            // Map Obsidian types to DITA note types
            let ditaNoteType = 'note'; 
            switch (calloutType.toLowerCase()) {
                case 'note':
                case 'info':
                case 'todo': 
                    ditaNoteType = 'note';
                    break;
                case 'tip':
                case 'hint':
                case 'important':
                    ditaNoteType = 'important';
                    break;
                case 'success':
                case 'check':
                case 'done':
                    ditaNoteType = 'tip'; 
                    break;
                case 'question':
                case 'help':
                case 'faq':
                    ditaNoteType = 'other'; 
                    break;
                case 'warning':
                case 'caution':
                case 'attention':
                    ditaNoteType = 'caution';
                    break;
                case 'failure':
                case 'fail':
                case 'missing':
                    ditaNoteType = 'warning'; 
                    break;
                case 'danger':
                case 'error':
                case 'bug':
                    ditaNoteType = 'danger';
                    break;
                case 'example':
                    ditaNoteType = 'other';
                    break;
                case 'quote':
                case 'cite':
                    ditaNoteType = 'other'; 
                    break;
                default:
                    ditaNoteType = 'other';
            }

            // Process the content of the callout
            const calloutContent = divNode.children.map(child => `<p>${escapeXml(toString(child))}</p>`).join('\n');

            // Handle potential title: The plugin might put the title in a specific div
            let titleElement = '';
            let contentWithoutTitle = calloutContent;

            if (divNode.children.length > 0 && 'tagName' in divNode.children[0] && divNode.children[0].tagName === 'div') {
                const firstChild = divNode.children[0] as HastElement;
                if ((firstChild.properties?.className as string[])?.includes('callout-title')) {
                    const titleText = toString(firstChild); 
                    titleElement = `<title>${escapeXml(titleText)}</title>`;
                    contentWithoutTitle = divNode.children.slice(1).map(child => `<p>${escapeXml(toString(child))}</p>`).join('\n');
                }
            }

            xmlString = `<note type="${ditaNoteType}">
  ${titleElement}
  ${contentWithoutTitle}
</note>`;
            return xmlString; 
        }
        // If it's a div but not a callout, fall through to default handling
    }

    // Handle non-standard wikiLink type first (needs casting)
    if ((node as any).type === 'wikiLink') {
        const wikiLinkNode = node as any;
        const target = wikiLinkNode.data.hName; 
        const alias = wikiLinkNode.data.alias; 
        const value = wikiLinkNode.value; 
        const isEmbed = wikiLinkNode.data.isEmbed; 
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
        const isImageTarget = imageExtensions.some(ext => target.toLowerCase().endsWith(ext));

        if (isEmbed && isImageTarget) {
            let embedAlt = value; 
            let embedAttrs: { [key: string]: string } = {};

            if (alias && alias !== value) { 
                const aliasParts = alias.split('|');
                embedAlt = aliasParts[0].trim(); 

                aliasParts.slice(1).forEach((part: string) => {
                    const kv = part.trim().split('=');
                    if (kv.length === 2) {
                        const key = kv[0].trim();
                        const val = kv[1].trim();
                        const validDitaAttrs = ['height', 'width', 'scale', 'scalefit', 'placement'];
                        if (validDitaAttrs.includes(key)) {
                            embedAttrs[key] = val; 
                        } else {
                            console.warn(`Skipping non-standard image attribute '${key}' from WikiLink embed alias.`);
                        }
                    }
                });
            }

            const attrsString = Object.entries(embedAttrs)
                .map(([key, value]) => `${escapeXml(key)}="${escapeXml(value)}"`) 
                .join(' ');

            const href = wikiLinkNode.data.hProperties.href;
            xmlString = `<image href="${escapeXml(href)}" alt="${escapeXml(embedAlt)}"${attrsString ? ' ' + attrsString : ''}/>`;
        } else if (!isEmbed) {
            const linkText = alias || value; 
            const href = wikiLinkNode.data.hProperties.href; 
            xmlString = `<xref href="${escapeXml(href)}" format="dita">${escapeXml(linkText)}</xref>`;
        } else {
            console.warn(`Unhandled WikiLink node (possibly non-image embed): ${value}`);
            xmlString = `<!-- Unhandled WikiLink Embed: ${escapeXml(value)} -->`;
        }
        return xmlString; // Return early as wikiLink is handled
    }

    // Handle standard MDAST types
    switch (node.type) {
        // === Block Elements ===
        case 'root':
            xmlString = (node.children || []).map(mdastToDitaString).join('\n'); 
            break;
        case 'paragraph': 
            // Avoid wrapping paragraphs that contain only an image
            if (node.children.length === 1 && node.children[0] && ('type' in node.children[0]) && node.children[0].type === 'image') {
                xmlString = mdastToDitaString(node.children[0]);
            } else {
                xmlString = `<p>${(node.children || []).map(mdastToDitaString).join('')}</p>`;
            }
            break;
        case 'heading':
            xmlString = `<p><ph importance="high" outputclass="heading-${node.depth}">${(node.children || []).map(mdastToDitaString).join('')}</ph></p>`; 
            break;
        case 'blockquote':
            xmlString = ` <note type="other" othertype="blockquote">${(node.children || []).map(mdastToDitaString).join('')}</note>`; 
            break;
        case 'list':
            const listTag = node.ordered ? 'ol' : 'ul';
            const items = (node.children || []).map(mdastToDitaString).join('\n');
            xmlString = `<${listTag}>\n${items}\n</${listTag}>`;
            break;
        case 'listItem':
            if (node.checked !== null && node.checked !== undefined) {
                const status = node.checked ? 'checked' : 'unchecked';
                xmlString = `<li outputclass="task-list-item task-list-item-${status}">${(node.children || []).map(mdastToDitaString).join('')}</li>`;
            } else {
                xmlString = `<li>${(node.children || []).map(mdastToDitaString).join('')}</li>`;
            }
            break;
        case 'code': // Fenced code blocks (MDAST)
            // DITA uses <codeblock>
            const lang = node.lang ? ` outputclass="language-${node.lang}"` : '';
            xmlString = `<codeblock${lang}>${escapeXml(node.value)}</codeblock>`;
            break;
        case 'thematicBreak':
            xmlString = '<lines>---</lines>'; 
            break;
        case 'table':
            const colCount = node.children[0]?.children?.length || 0;
            const tgroup = `<tgroup cols="${colCount}">\n`;
            let thead = '';
            let tbody = '';

            if (node.children.length > 0) {
                thead = `<thead>\n${mdastToDitaString(node.children[0])}</thead>\n`;
            }
            if (node.children.length > 1) {
                tbody = `<tbody>\n${node.children.slice(1).map(mdastToDitaString).join('\n')}</tbody>\n`;
            }

            xmlString = `<table>\n${tgroup}${thead}${tbody}</tgroup>\n</table>`;
            break;
        case 'tableRow':
            xmlString = `<row>\n${(node.children || []).map(mdastToDitaString).join('\n')}</row>`;
            break;
        case 'tableCell':
            xmlString = `<entry>${(node.children || []).map(mdastToDitaString).join('')}</entry>`;
            break;
        case 'text':
            xmlString = escapeXml(node.value);
            break;
        case 'link':
            const linkTitle = node.title ? ` title="${escapeXml(node.title)}"` : '';
            const scope = node.url.startsWith('http') || node.url.startsWith('//') ? 'external' : 'local';
            const format = scope === 'external' ? 'html' : 'dita'; 
            xmlString = `<xref href="${escapeXml(node.url)}" format="${format}" scope="${scope}"${linkTitle}>${(node.children || []).map(mdastToDitaString).join('')}</xref>`;
            break;
        case 'image':
            const altText = node.alt ? `<alt>${escapeXml(node.alt)}</alt>` : '';
            xmlString = `<image href="${escapeXml(node.url)}"${altText}>${node.title ? `<title>${escapeXml(node.title)}</title>` : ''}</image>`;
            break;
        case 'footnoteReference':
            // Use type assertion for dynamically added `definition` property by remark-footnotes
            const definitionNode = (node as any).definition as (Root | Content | undefined);
            if (definitionNode) {
                // Check if definitionNode is a type with children before mapping
                let footnoteContent = '';
                if ('children' in definitionNode && Array.isArray(definitionNode.children)) {
                    footnoteContent = (definitionNode.children as Content[]).map(mdastToDitaString).join('');
                } else {
                    console.warn(`Footnote definition for ${node.identifier} did not contain expected children.`);
                    // Attempt to stringify if no children array found
                    footnoteContent = escapeXml(toString(definitionNode));
                }
                xmlString = `<fn id="fn-${node.identifier}">${footnoteContent}</fn>`; // Place <fn> inline
            } else {
                // Fallback or error if definition is missing? Usually shouldn't happen with remark-footnotes.
                xmlString = `<!-- Missing footnote definition for ${node.identifier} -->`;
            }
            break;
        case 'footnoteDefinition':
            return ''; 
        case 'element': 
            // Ensure className exists and is an array before using includes
            const elementClassNames = node.properties?.['className'];
            if (node.tagName === 'div' && Array.isArray(elementClassNames) && elementClassNames.includes('callout')) {
                let calloutType = 'note'; 
                // Ensure find is called on an array
                const calloutClass = Array.isArray(elementClassNames) ? 
                    elementClassNames.find((cls: string | number) => typeof cls === 'string' && cls.startsWith('callout-')) : 
                    null;
                // Ensure calloutClass is a string before calling replace
                if (calloutClass && typeof calloutClass === 'string') {
                    const type = calloutClass.replace('callout-', '').toLowerCase();
                    switch(type) {
                        case 'note':
                        case 'info':
                        case 'todo': 
                            calloutType = 'note';
                            break;
                        case 'tip':
                        case 'hint':
                        case 'important':
                            calloutType = 'important';
                            break;
                        case 'success':
                        case 'check':
                        case 'done':
                            calloutType = 'tip'; 
                            break;
                        case 'question':
                        case 'help':
                        case 'faq':
                            calloutType = 'other'; 
                            break;
                        case 'warning':
                        case 'caution':
                        case 'attention':
                            calloutType = 'caution';
                            break;
                        case 'failure':
                        case 'fail':
                        case 'missing':
                            calloutType = 'warning'; 
                            break;
                        case 'danger':
                        case 'error':
                        case 'bug':
                            calloutType = 'danger';
                            break;
                        case 'example':
                            calloutType = 'other';
                            break;
                        case 'quote':
                        case 'cite':
                            calloutType = 'other'; 
                            break;
                        default:
                            calloutType = 'other';
                    }

                    const calloutContent = node.children.map(child => `<p>${escapeXml(toString(child))}</p>`).join('\n');

                    let titleElement = '';
                    let contentWithoutTitle = calloutContent;

                    if (node.children.length > 0 && 'tagName' in node.children[0] && node.children[0].tagName === 'div') {
                        const firstChild = node.children[0] as HastElement;
                        if ((firstChild.properties?.className as string[])?.includes('callout-title')) {
                            const titleText = toString(firstChild); 
                            titleElement = `<title>${escapeXml(titleText)}</title>`;
                            contentWithoutTitle = node.children.slice(1).map(child => `<p>${escapeXml(toString(child))}</p>`).join('\n');
                        }
                    }

                    xmlString = `<note type="${calloutType}">
  ${titleElement}
  ${contentWithoutTitle}
</note>`;
                    return xmlString; 
                }
                // If it's a div but not a callout, fall through to default handling
            }
            // Handle generic divs (that aren't callouts)
            console.warn("Encountered a non-callout <div> element. Processing children.");
            xmlString = `<!-- Generic Div Start -->\n${(node as HastElement).children.map((child: any) => mdastToDitaString(child)).join('\n')}\n<!-- Generic Div End -->`; 
            break;
        default:
            const nodeType = (node as any).type;
            if (nodeType) {
                console.warn(`Unhandled MDAST node type: ${node.type}`);
                if ('children' in node && Array.isArray(node.children)) {
                    xmlString = (node.children as any[]).map(mdastToDitaString).join('');
                } else if ('value' in node && typeof node.value === 'string') {
                    xmlString = escapeXml(node.value);
                } else {
                    xmlString = `<!-- Unhandled MDAST node: ${node.type} -->`;
                }
            } else {
                console.warn(`Unhandled node structure: ${JSON.stringify(node).substring(0, 100)}...`);
                xmlString = `<!-- Unhandled node structure -->`;
            }
            break;
    }

    return xmlString;
}

// Custom Unified plugin function (returns a transformer)
function remarkToDitaXml(options: { metadata: Metadata, targetDitaPath: string }) {
    return (tree: Root, file: VFile) => { 
        const { metadata, targetDitaPath } = options || { metadata: {}, targetDitaPath: '' }; 
        if (!options) {
            console.error("Error: remarkToDitaXml plugin called without options.");
            return; 
        }

        try {
            const bodyContent = tree.children.map(node => mdastToDitaString(node)).join('\n'); 

            const ditaXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="${metadata.id || path.basename(targetDitaPath, '.dita')}">
  <title>${escapeXml(metadata.title || 'Untitled')}</title>
  <prolog>
    ${metadata.author ? `<author>${escapeXml(metadata.author)}</author>` : ''}
    ${metadata.date ? `<critdates><created date="${escapeXml(metadata.date)}"/></critdates>` : ''}
    <metadata>
      ${(metadata.tags || []).map((tag: string) => `<keywords><keyword>${escapeXml(tag)}</keyword></keywords>`).join('\n      ')}
      ${metadata.description ? `<shortdesc>${escapeXml(metadata.description)}</shortdesc>` : ''}
      ${metadata.category ? `<category>${escapeXml(metadata.category)}</category>` : ''}
      ${metadata.audience ? `<audience type="${escapeXml(metadata.audience)}"/>` : ''}
      ${metadata.conditional?.access_level ? `<resourceid appname="access_level" id="${escapeXml(metadata.conditional.access_level)}"/>` : ''}
    </metadata>
  </prolog>
  <body>
    ${bodyContent}
  </body>
</topic>`;

            file.value = ditaXml; 
        } catch (error) {
            console.error(`Error during DITA conversion for ${targetDitaPath}:`, error);
            file.message(`Error during DITA conversion: ${(error as Error).message}`);
        }
    };
}

async function parseMarkdownMap(mapFilePath: string) {
    console.log(`Parsing map: ${mapFilePath}`);
    const fileContent = await fs.readFile(mapFilePath, 'utf8');
    const { data: metadata, content: mapBody } = matter(fileContent);

    let topicRefs: (string | null)[] = [];
    
    // Try to extract wiki-links first
    const wikiLinks = extractWikiLinks(mapBody);
    if (wikiLinks.length > 0) {
        topicRefs = wikiLinks.map(link => link.path);
    } else {
        // If no wiki-links, try Markdown link format
        const mdLinkMatches = mapBody.match(/\[([^\]]+)\]\(([^)]+)\)/g);
        if (mdLinkMatches) {
            topicRefs = mdLinkMatches.map(match => {
                const parts = match.match(/\[([^\]]+)\]\(([^)]+)\)/);
                return parts ? parts[2] : null;
            }).filter(ref => ref !== null);
        }
        
        // If still no links, try bullet list items
        if (topicRefs.length === 0) {
            topicRefs = mapBody.split('\n').filter(line => line.trim().startsWith('- [')).map(line => {
                const match = line.match(/\(([^)]+)\)/);
                return match ? match[1] : null;
            }).filter(ref => ref !== null);
        }
        
        // Finally, try plain bullet list format
        if (topicRefs.length === 0) {
            topicRefs = mapBody.split('\n')
                .filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '))
                .map(line => {
                    const trimmedLine = line.trim().substring(2).trim();
                    // Skip lines that are just headings or empty
                    if (trimmedLine.startsWith('#') || !trimmedLine) {
                        return null;
                    }
                    return trimmedLine;
                })
                .filter(ref => ref !== null);
        }
    }

    console.log('Map Metadata:', metadata);
    console.log('Topic Refs:', topicRefs);

    return { metadata, topicRefs };
}

async function generateIntermediateDitaMap(mapMetadata: any, topicRefs: string[], targetMapPath: string) {
    console.log(`Generating intermediate DITA map: ${targetMapPath}`);
    
    // Better metadata handling
    const metadataElements = [];
    if (mapMetadata.title) metadataElements.push(`<title>${escapeXml(mapMetadata.title)}</title>`);
    
    // Add all metadata as topicmeta elements
    const topicmetaElements = [];
    if (mapMetadata.author) topicmetaElements.push(`<author>${escapeXml(mapMetadata.author)}</author>`);
    if (mapMetadata.audience) topicmetaElements.push(`<audience type="${escapeXml(mapMetadata.audience)}"/>`);
    if (mapMetadata.category) topicmetaElements.push(`<category>${escapeXml(mapMetadata.category)}</category>`);
    
    // Add tags as keywords
    if (mapMetadata.tags && Array.isArray(mapMetadata.tags)) {
        for (const tag of mapMetadata.tags) {
            topicmetaElements.push(`<keyword>${escapeXml(tag)}</keyword>`);
        }
    }
    
    // Add custom data elements
    if (mapMetadata.publish !== undefined) topicmetaElements.push(`<data name="publish" value="${mapMetadata.publish}"/>`);
    if (mapMetadata.featured !== undefined) topicmetaElements.push(`<data name="featured" value="${mapMetadata.featured}"/>`);
    if (mapMetadata.shortdesc) topicmetaElements.push(`<shortdesc>${escapeXml(mapMetadata.shortdesc)}</shortdesc>`);
    
    const topicmetaSection = topicmetaElements.length > 0 ? `  <topicmeta>\n    ${topicmetaElements.join('\n    ')}\n  </topicmeta>` : '';
    
    // Handle path conversion intelligently
    const topicRefsMarkup = topicRefs.map(ref => {
        if (!ref) return '';
        
        // Get just the filename without path for the target
        const fileName = path.basename(ref);
        const targetPath = fileName.replace(/\.md(ita)?$/, '.dita');
        
        // Try to extract a title from the filename or use the ref
        let title = fileName.replace(/\.md(ita)?$/, '').replace(/-/g, ' ');
        // Capitalize the first letter of each word
        title = title.replace(/\b\w/g, l => l.toUpperCase());
        
        return `<topicref href="${targetPath}" format="dita">
    <topicmeta>
      <navtitle>${escapeXml(title)}</navtitle>
    </topicmeta>
  </topicref>`;
    }).join('\n  ');
    
    const ditaMapContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map>
${metadataElements.length > 0 ? '  ' + metadataElements.join('\n  ') + '\n' : ''}${topicmetaSection}

  ${topicRefsMarkup}
</map>`;

    await fs.writeFile(targetMapPath, ditaMapContent);
    console.log(`Intermediate map written to ${targetMapPath}`);
}

async function convertMarkdownTopicToDita(sourceTopicPath: string, targetDitaPath: string) {
    console.log(`Converting topic: ${sourceTopicPath} -> ${targetDitaPath}`);
    const markdownContent = await fs.readFile(sourceTopicPath, 'utf8');
    const { data: metadata, content: body } = matter(markdownContent);
    metadata.id = metadata.id || path.basename(targetDitaPath, '.dita'); 

    const processor = unified()
        .use(remarkParse)
        .use(remarkFrontmatter) 
        .use(remarkGfm)         
        .use(remarkFootnotes as Plugin<[], Root, Root>) // Add footnote support with explicit type casting for compatibility
        .use(remarkWikiLink, { 
            pathFormat: 'relative',
            resolver: (name: string) => {
                if (name.endsWith('.ditamap')) {
                    return [name];
                }
                if (name.endsWith('.md')) {
                    return [name.replace(/\.md$/, '.dita')];
                }
                const slug = name.replace(/\s+/g, '-') 
                                 .replace(/[^a-zA-Z0-9\-._/]/g, ''); 

                const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.pdf'];
                const potentialAsset = assetExtensions.find(ext => name.toLowerCase().endsWith(ext));
                if (potentialAsset) {
                    return [name]; 
                }

                return [`${slug}.dita`]; 
            },
            hrefTemplate: (permalink: string) => permalink, 
            wikiLinkClassName: 'wiki-link',
            aliasDivider: '|', 
        })
        .use(remarkObsidianCallout) 
        .use(remarkToDitaXml, { metadata, targetDitaPath }); 

    const ditaTopicContent = await processor.process(body).then(file => String(file.value)); 

    await fs.writeFile(targetDitaPath, ditaTopicContent);
    console.log(`Intermediate topic written to ${targetDitaPath}`);
}

function runDitaOT(intermediateMapPath: string, format: string = 'html5') {
    console.log(`Running DITA-OT for ${intermediateMapPath}, format: ${format}`);
    
    // Create additional parameters for better HTML output
    const params = [
        '-i', `"${intermediateMapPath}"`,
        '-f', format,
        '-o', `"${FINAL_OUTPUT_DIR}"`,
        '--propertyfile=args.properties'
    ];
    
    // Create a custom args.properties file to control HTML output
    const propsContent = `
# Enable full rendering of HTML pages
args.gen.task.lbl=YES
args.breadcrumbs=yes
args.copycss=yes
args.css=custom.css
args.csspath=css
args.cssroot=${FINAL_OUTPUT_DIR}
args.ftr=common/footer.xml
args.hdf=yes
args.hdr=common/header.xml
args.outext=.html
args.tablelink.style=FULL
args.xhtml.classattr=yes
`;
    
    // Write custom properties file
    const propsPath = path.join(process.cwd(), 'args.properties');
    try {
        fsSync.writeFileSync(propsPath, propsContent);
        console.log('Created custom properties file for DITA-OT');
    } catch (error) {
        console.warn('Failed to create custom properties file:', error);
    }
    
    const command = `${DITA_OT_COMMAND} ${params.join(' ')}`;
    console.log(`Executing: ${command}`);
    
    try {
        execSync(command, { stdio: 'inherit' }); 
        console.log('DITA-OT processing complete.');
        
        // Create custom CSS file for styling the output
        const cssDir = path.join(FINAL_OUTPUT_DIR, 'css');
        const cssPath = path.join(cssDir, 'custom.css');
        try {
            if (!fsSync.existsSync(cssDir)) {
                fsSync.mkdirSync(cssDir, { recursive: true });
            }
            
            const customCss = `
/* Enhanced styling for DITA HTML output */
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    line-height: 1.6;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    color: #333;
}

.topictitle1 {
    font-size: 2.5em;
    margin-bottom: 0.5em;
    color: #2c3e50;
}

.topictitle2 {
    font-size: 1.8em;
    margin-top: 1.5em;
    color: #3498db;
}

.topictitle3 {
    font-size: 1.5em;
    margin-top: 1.2em;
    color: #2980b9;
}

pre.codeblock {
    background-color: #f5f7f9;
    border: 1px solid #e1e4e8;
    padding: 15px;
    border-radius: 6px;
    overflow-x: auto;
}

.note {
    background-color: #f8f9fa;
    padding: 15px;
    border-left: 4px solid #3498db;
    margin: 20px 0;
}

.warning {
    background-color: #fef5f5;
    padding: 15px;
    border-left: 4px solid #e74c3c;
    margin: 20px 0;
}

table {
    border-collapse: collapse;
    width: 100%;
    margin: 20px 0;
}

th, td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: left;
}

th {
    background-color: #f5f7f9;
}

img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 20px auto;
}

code {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    background-color: #f5f7f9;
    padding: 2px 4px;
    border-radius: 3px;
}

/* Navigation styling */
nav.toc {
    margin-bottom: 30px;
}

nav.toc ul {
    padding-left: 20px;
}

nav.toc li {
    margin: 8px 0;
}

nav.toc a {
    color: #3498db;
    text-decoration: none;
}

nav.toc a:hover {
    text-decoration: underline;
}

/* Math equations */
.equation {
    display: block;
    margin: 20px auto;
    text-align: center;
}
`;
            
            fsSync.writeFileSync(cssPath, customCss);
            console.log(`Created custom CSS file at ${cssPath}`);
        } catch (cssError) {
            console.warn('Failed to create custom CSS file:', cssError);
        }
    } catch (error) {
        console.error('DITA-OT processing failed:', error);
        throw error; 
    }
}

async function main() {
    console.log('Starting Markdown to DITA conversion process...');

    await ensureDirectoryExists(INTERMEDIATE_DITA_DIR);
    await ensureDirectoryExists(FINAL_OUTPUT_DIR);

    // Process maps from the maps directory
    await processMapDirectory(MAPS_DIR);
    
    // Process ditamaps in the articles directory
    await processArticleDitamaps();

    console.log('Markdown to DITA conversion finished.');
}

// Add this helper function for smart path resolution
async function resolveTopicPath(topicRef: string, mapPath: string): Promise<string> {
    // If it's an absolute path or already has proper directory reference, use it directly
    if (path.isAbsolute(topicRef) || topicRef.startsWith('../') || topicRef.startsWith('./')) {
        return path.resolve(path.dirname(mapPath), topicRef);
    }
    
    // Otherwise, try multiple possible locations
    
    // 1. First check if it exists in the same directory as the map
    const sameDirectoryPath = path.join(path.dirname(mapPath), topicRef);
    if (await fileExists(sameDirectoryPath)) {
        return sameDirectoryPath;
    }
    
    // 2. Check if it exists in the topics directory
    const topicsPath = path.join(TOPICS_DIR, topicRef);
    if (await fileExists(topicsPath)) {
        return topicsPath;
    }
    
    // 3. If the map is in articles/collaborative, look for the file there too
    if (mapPath.includes('articles/collaborative')) {
        const collaborativePath = path.join(
            process.cwd(), 
            'content/articles/collaborative',
            path.basename(topicRef)
        );
        if (await fileExists(collaborativePath)) {
            return collaborativePath;
        }
    }
    
    // 4. Return the relative path and let the caller handle missing files
    return path.resolve(path.dirname(mapPath), topicRef);
}

async function processMapDirectory(mapDir: string) {
    console.log(`Processing maps in directory: ${mapDir}`);
    
    try {
        const mapFiles = await fs.readdir(mapDir);
        const ditaMapFiles = mapFiles.filter(file => file.endsWith('.ditamap'));
        
        console.log(`Found ${ditaMapFiles.length} ditamap files in ${mapDir}`);
        
        for (const mapFileName of ditaMapFiles) {
            const sourceMapPath = path.join(mapDir, mapFileName);
            const intermediateMapPath = path.join(INTERMEDIATE_DITA_DIR, mapFileName); 

            const { metadata: mapMetadata, topicRefs } = await parseMarkdownMap(sourceMapPath);

            if (!topicRefs || topicRefs.length === 0) {
                console.warn(`No topic references found in ${sourceMapPath}. Skipping map generation.`);
                continue;
            }

            await generateIntermediateDitaMap(mapMetadata, topicRefs as string[], intermediateMapPath);

            for (const topicRef of topicRefs) {
                if (!topicRef) continue;
                
                // Resolve the topic path relative to the map's location
                const sourceTopicPath = await resolveTopicPath(topicRef, sourceMapPath);
                const targetDitaPath = path.join(INTERMEDIATE_DITA_DIR, path.basename(topicRef).replace(/\.md(ita)?$/, '.dita'));

                try {
                    await convertMarkdownTopicToDita(sourceTopicPath, targetDitaPath);
                } catch (error: any) {
                    if (error.code === 'ENOENT') {
                        console.warn(`Skipping missing topic file: ${sourceTopicPath}`);
                    } else {
                        console.error(`Failed to convert topic ${sourceTopicPath}:`, error);
                    }
                }
            }

            runDitaOT(intermediateMapPath, 'html5');
        }
    } catch (error) {
        console.error(`Error processing map directory ${mapDir}:`, error);
    }
}

// Helper function to extract wiki links from markdown content
function extractWikiLinks(content: string): { path: string; title: string }[] {
    const wikiLinkRegex = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
    const matches = Array.from(content.matchAll(wikiLinkRegex));
    
    return matches.map(match => {
        const path = match[1]?.trim() || '';
        const title = match[2]?.trim() || path.replace(/\.md$/, '');
        return { path, title };
    });
}

async function processArticleDitamaps() {
    console.log('Processing ditamaps in articles directory...');
    
    const ARTICLES_PATH = path.join(process.cwd(), 'content/articles');
    
    // Function to recursively find ditamap files
    async function findDitamaps(dirPath: string, ditamaps: string[] = []): Promise<string[]> {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
                await findDitamaps(fullPath, ditamaps);
            } else if (entry.isFile() && entry.name.endsWith('.ditamap')) {
                ditamaps.push(fullPath);
            }
        }
        
        return ditamaps;
    }
    
    try {
        const ditamapPaths = await findDitamaps(ARTICLES_PATH);
        console.log(`Found ${ditamapPaths.length} ditamaps in articles directory:`, ditamapPaths);
        
        for (const ditamapPath of ditamapPaths) {
            // Read the ditamap
            const content = await fs.readFile(ditamapPath, 'utf8');
            
            // Extract YAML front matter and content
            const { data: metadata, content: mapContent } = matter(content);
            
            console.log(`Processing ditamap: ${ditamapPath}`);
            console.log(`Metadata:`, metadata);
            
            // Extract topic references - handle both wiki-link and list formats
            const wikiLinks = extractWikiLinks(mapContent);
            console.log(`Found ${wikiLinks.length} wiki-links in ${ditamapPath}:`, wikiLinks);
            
            if (wikiLinks.length === 0) {
                // Try XML format with topicrefs as fallback
                const hrefMatches = mapContent.match(/<topicref\s+[^>]*href\s*=\s*["']([^"']+)["']/g);
                
                if (hrefMatches) {
                    for (const match of hrefMatches) {
                        const hrefMatch = match.match(/href\s*=\s*["']([^"']+)["']/);
                        if (hrefMatch && hrefMatch[1]) {
                            const path = hrefMatch[1].trim();
                            const navtitleMatch = match.match(/<navtitle>([^<]+)<\/navtitle>/);
                            const title = navtitleMatch ? navtitleMatch[1] : path;
                            wikiLinks.push({ path, title });
                        }
                    }
                } else {
                    // Try bullet list format as last resort
                    const listItems = mapContent.split('\n')
                        .filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '))
                        .map(line => line.trim().substring(2).trim());
                    
                    for (const item of listItems) {
                        const mdLinkMatch = item.match(/\[([^\]]+)\]\(([^)]+)\)/);
                        if (mdLinkMatch) {
                            const title = mdLinkMatch[1];
                            const path = mdLinkMatch[2];
                            wikiLinks.push({ path, title });
                        }
                    }
                }
            }
            
            if (wikiLinks.length === 0) {
                console.warn(`No topic references found in ${ditamapPath}. Skipping.`);
                continue;
            }
            
            // Extract the file paths only for processing
            const topicRefs = wikiLinks.map(link => link.path);
            
            // Create intermediate ditamap
            const ditamapFileName = path.basename(ditamapPath);
            const intermediateMapPath = path.join(INTERMEDIATE_DITA_DIR, ditamapFileName);
            
            // Enhanced intermediate DITA map generation with full metadata
            const metadataElements = [];
            if (metadata.title) metadataElements.push(`<title>${escapeXml(metadata.title)}</title>`);
            
            // Add all metadata as topicmeta elements
            const topicmetaElements = [];
            if (metadata.author) topicmetaElements.push(`<author>${escapeXml(metadata.author)}</author>`);
            if (metadata.audience) topicmetaElements.push(`<audience type="${escapeXml(metadata.audience)}"/>`);
            if (metadata.category) topicmetaElements.push(`<category>${escapeXml(metadata.category)}</category>`);
            
            // Add tags as keywords
            if (metadata.tags && Array.isArray(metadata.tags)) {
                for (const tag of metadata.tags) {
                    topicmetaElements.push(`<keyword>${escapeXml(tag)}</keyword>`);
                }
            }
            
            // Add custom data elements
            if (metadata.publish !== undefined) topicmetaElements.push(`<data name="publish" value="${metadata.publish}"/>`);
            if (metadata.featured !== undefined) topicmetaElements.push(`<data name="featured" value="${metadata.featured}"/>`);
            if (metadata.shortdesc) topicmetaElements.push(`<shortdesc>${escapeXml(metadata.shortdesc)}</shortdesc>`);
            
            const topicmetaSection = topicmetaElements.length > 0 ? `  <topicmeta>\n    ${topicmetaElements.join('\n    ')}\n  </topicmeta>` : '';
            
            const ditaMapContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map>
${metadataElements.length > 0 ? '  ' + metadataElements.join('\n  ') + '\n' : ''}${topicmetaSection}

  ${wikiLinks.map(link => `<topicref href="${link.path.replace(/\.md(ita)?$/, '.dita')}" format="dita">
    <topicmeta>
      <navtitle>${escapeXml(link.title)}</navtitle>
    </topicmeta>
  </topicref>`).join('\n  ')}
</map>`;

            await fs.writeFile(intermediateMapPath, ditaMapContent);
            console.log(`Enhanced intermediate map written to ${intermediateMapPath}`);
            
            // Convert each topic
            const ditamapDir = path.dirname(ditamapPath);
            
            for (const topicRef of topicRefs) {
                // Resolve the topic path relative to the map's location
                const sourceTopicPath = await resolveTopicPath(topicRef, ditamapPath);
                const topicFileName = path.basename(topicRef);
                const targetDitaPath = path.join(INTERMEDIATE_DITA_DIR, topicFileName.replace(/\.md(ita)?$/, '.dita'));
                
                console.log(`Processing topic reference: ${topicRef} => ${sourceTopicPath}`);
                
                try {
                    if (await fileExists(sourceTopicPath)) {
                        await convertMarkdownTopicToDita(sourceTopicPath, targetDitaPath);
                        console.log(`Successfully converted topic: ${sourceTopicPath} -> ${targetDitaPath}`);
                    } else {
                        console.warn(`Topic file not found: ${sourceTopicPath}`);
                    }
                } catch (error: any) {
                    console.error(`Failed to convert topic ${sourceTopicPath}:`, error);
                }
            }
            
            // Run DITA-OT transformation
            runDitaOT(intermediateMapPath, 'html5');
        }
    } catch (error) {
        console.error('Error processing article ditamaps:', error);
    }
}

// Helper function to check if a file exists
async function fileExists(path: string): Promise<boolean> {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}

main().catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
});
