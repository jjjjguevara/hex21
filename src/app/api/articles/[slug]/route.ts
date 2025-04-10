import { getDocData } from '@/lib/content.server';
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { parseMetadata } from '@/lib/metadata';
import { findTopicContent } from '@/lib/content/topic-finder';
import matter from 'gray-matter';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    console.log(`[API] Handling article request for slug: ${params.slug}`);
    
    // Handle ditamap-based articles where we need to extract topics
    // This applies to articles in any subfolder, not just collaborative
    if (params.slug.includes('/')) {
      console.log(`[API] Processing multi-part article path: ${params.slug}`);
      
      // Load the ditamap file to get metadata and topic references
      const ditamapPath = path.join(process.cwd(), 'content', 'articles', params.slug + '.ditamap');
      console.log(`[API] Looking for ditamap at: ${ditamapPath}`);
      
      try {
        // Read the ditamap file
        const ditamapContent = await fs.readFile(ditamapPath, 'utf8');
        console.log(`[API] Successfully read ditamap from: ${ditamapPath}`);
        const { data: metadata, content: mapBody } = matter(ditamapContent);
        
        // Extract wiki links from the content
        const wikiLinkRegex = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
        const wikiLinks = Array.from(mapBody.matchAll(wikiLinkRegex)).map(match => ({
          path: match[1]?.trim() || '',
          title: match[2]?.trim() || match[1]?.trim() || ''
        }));
        
        console.log(`[API] Found ${wikiLinks.length} wiki links in ditamap:`, 
          wikiLinks.map(link => link.path)
        );
        
        if (wikiLinks.length === 0) {
          console.warn(`[API] No wiki links found in ${ditamapPath}`);
          return new NextResponse(null, { status: 404 });
        }
        
        // Get the first topic reference to serve as the main content
        const firstTopicRef = wikiLinks[0].path;
        // Get directory where ditamap is located
        const topicDir = path.dirname(ditamapPath);
        
        console.log(`[API] First topic reference: ${firstTopicRef}`);
        console.log(`[API] Topic directory: ${topicDir}`);
        
        // Load the topic content
        const topicContent = await findTopicContent(firstTopicRef, topicDir);
        
        if (!topicContent) {
          console.error(`[API] Could not find topic content for ${firstTopicRef}`);
          return new NextResponse(null, { status: 404 });
        }
        
        console.log(`[API] Successfully loaded topic content, length: ${topicContent.length}`);
        
        // Parse the topic content for metadata
        const { data: topicMetadata } = matter(topicContent);
        
        // Process content using the content server
        console.log(`[API] Calling getDocData with slug: ${params.slug}`);
        const processedDoc = await getDocData(params.slug);
        
        if (!processedDoc) {
          console.error(`[API] Failed to process doc for ${params.slug}`);
          return new NextResponse(null, { status: 404 });
        }
        
        console.log(`[API] Successfully processed doc, returning response`);
        
        // Return the processed content with combined metadata
        return NextResponse.json({
          slug: params.slug,
          content: processedDoc.content,
          metadata: {
            ...metadata,
            title: metadata.title || topicMetadata.title || 'Untitled',
            description: metadata.description || topicMetadata.description || '',
          },
          toc: processedDoc.toc || [],
          topics: wikiLinks.map(link => ({ id: link.path, title: link.title }))
        });
      } catch (error) {
        console.error(`[API] Error loading article ${params.slug}:`, error);
        return new NextResponse(null, { status: 500 });
      }
    }
    
    // Regular article handling
    const article = await getDocData(params.slug);
    
    if (!article) {
      return new NextResponse(null, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error in article API route:', error);
    return new NextResponse(null, { status: 500 });
  }
} 