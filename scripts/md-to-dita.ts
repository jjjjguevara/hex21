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

    const topicRefs = mapBody.split('\n').filter(line => line.trim().startsWith('- [')).map(line => {
        const match = line.match(/\(([^)]+)\)/);
        return match ? match[1] : null;
    }).filter(ref => ref !== null);

    console.log('Map Metadata:', metadata);
    console.log('Topic Refs:', topicRefs);

    return { metadata, topicRefs };
}

async function generateIntermediateDitaMap(mapMetadata: any, topicRefs: string[], targetMapPath: string) {
    console.log(`Generating intermediate DITA map: ${targetMapPath}`);
    const ditaMapContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map title="${mapMetadata.title || 'Untitled Map'}">
  <!-- TODO: Add metadata elements based on mapMetadata -->
  ${topicRefs.map(ref => `<topicref href="${ref?.replace(/\.md(ita)?$/, '.dita')}" format="dita"/>`).join('\n  ')}
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
    const command = `${DITA_OT_COMMAND} -i "${intermediateMapPath}" -f ${format} -o "${FINAL_OUTPUT_DIR}"`;
    console.log(`Executing: ${command}`);
    try {
        execSync(command, { stdio: 'inherit' }); 
        console.log('DITA-OT processing complete.');
    } catch (error) {
        console.error('DITA-OT processing failed:', error);
        throw error; 
    }
}

async function main() {
    console.log('Starting Markdown to DITA conversion process...');

    await ensureDirectoryExists(INTERMEDIATE_DITA_DIR);
    await ensureDirectoryExists(FINAL_OUTPUT_DIR);

    const mapFileName = 'yaml-metadata-template.ditamap'; 
    const sourceMapPath = path.join(MAPS_DIR, mapFileName);
    const intermediateMapPath = path.join(INTERMEDIATE_DITA_DIR, mapFileName.replace(/\.ditamap$/, '.ditamap')); 

    const { metadata: mapMetadata, topicRefs } = await parseMarkdownMap(sourceMapPath);

    if (!topicRefs || topicRefs.length === 0) {
        console.warn(`No topic references found in ${sourceMapPath}. Skipping map generation.`);
        return;
    }

    await generateIntermediateDitaMap(mapMetadata, topicRefs as string[], intermediateMapPath);

    for (const topicRef of topicRefs) {
        if (!topicRef) continue;
        const sourceTopicPath = path.join(TOPICS_DIR, topicRef); 
        const targetDitaPath = path.join(INTERMEDIATE_DITA_DIR, topicRef.replace(/\.md(ita)?$/, '.dita'));

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

    console.log('Markdown to DITA conversion finished.');
}

main().catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
});
