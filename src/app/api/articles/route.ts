import { promises as fs } from 'fs';
import path from 'path';
import { parseMetadata } from '@/lib/metadata';
import { Article, MapMetadata } from '@/types/content';
import { NextResponse } from 'next/server';
import { findTopicContent } from '@/lib/content/topic-finder';
import { glob } from 'glob';
import matter from 'gray-matter';

type ArticleWithRequiredTopics = {
  slug: string;
  content: string;
  metadata: MapMetadata;
  topics: { id: string }[];
};

export async function GET() {
  const mapsDir = path.join(process.cwd(), 'content/maps');
  
  // Add additional directories to scan for ditamaps
  const collaborativeDir = path.join(process.cwd(), 'content/articles/collaborative');
  const possibleMapDirs = [mapsDir, collaborativeDir];
  
  try {
    // Get all ditamap files from multiple directories
    const allMapFiles: string[] = [];
    
    for (const dir of possibleMapDirs) {
      try {
        // Only add files from directories that exist
        const stats = await fs.stat(dir);
        if (stats.isDirectory()) {
          const mapFiles = await glob(`${dir}/**/*.ditamap`);
          allMapFiles.push(...mapFiles);
          console.log(`Found ${mapFiles.length} ditamap files in ${dir}`);
        }
      } catch (error) {
        // Directory doesn't exist, skip it
        console.log(`Directory ${dir} doesn't exist, skipping.`);
      }
    }
    
    console.log(`Processing ${allMapFiles.length} total ditamap files for articles API`);

    const articles = await Promise.all(
      allMapFiles.map(async (filePath) => {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const result = await parseMetadata(content, 'map');
          const { metadata, topics } = result as { 
            metadata: MapMetadata; 
            topics: string[] 
          };
          
          // Extract slug from filename, preserving the directory structure for articles
          const relativePath = path.relative(process.cwd(), filePath);
          const slug = relativePath
            .replace(/^content\/(maps|articles)\//, '') // Remove content/maps/ or content/articles/
            .replace(/\.ditamap$/, '');
          
          console.log(`Processing map: ${slug}`);
          
          // Determine the location of topic files
          // If it's from the articles directory, topics may be in the same directory
          const isFromArticles = filePath.includes('/articles/');
          const topicDir = isFromArticles ? path.dirname(filePath) : path.join(process.cwd(), 'content/topics');
          
          // Extract wiki links from content for collaborative articles
          if (isFromArticles && filePath.includes('/collaborative/')) {
            console.log(`Processing collaborative map content for ${slug}`);
            
            // Look for wikilinks in the content
            const wikiLinkRegex = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
            const wikiLinks = Array.from(content.matchAll(wikiLinkRegex)).map(match => 
              match[1]?.trim() || ''
            );
            
            if (wikiLinks.length > 0) {
              console.log(`Found wiki links in collaborative map: ${wikiLinks.join(', ')}`);
              
              // Override the topics list with the wikilinks
              topics = wikiLinks;
            }
          }
          
          // Load first topic content for preview
          let firstTopicContent = '';
          if (topics && topics.length > 0) {
            console.log(`Loading first topic for ${slug}:`, topics[0]);
            // Try first in the same directory as the ditamap (for article topics)
            const topicContent = await findTopicContent(topics[0], topicDir);
            
            if (topicContent) {
              // Try to parse the metadata
              try {
                const { data: topicMetadata } = matter(topicContent);
                console.log(`Successfully loaded first topic for ${slug}`);
                firstTopicContent = topicContent;
              } catch (error) {
                console.error(`Error parsing metadata for topic ${topics[0]} in ${slug}:`, error);
                firstTopicContent = topicContent; // Still use the content even if metadata parsing fails
              }
            } else {
              console.error(`Could not load first topic for ${slug}`);
            }
          }
          
          // Only include if published
          if (!metadata.publish) {
            console.log(`Article ${slug} not published, skipping from API`);
            return null;
          }

          return {
            slug,
            content: firstTopicContent,
            metadata,
            topics: topics.map(id => ({ id }))
          } as ArticleWithRequiredTopics;
        } catch (error) {
          console.error(`Error processing map ${filePath}:`, error);
          return null;
        }
      })
    );

    // Filter out failed articles and unpublished ones
    const filteredArticles = articles
      .filter((article): article is ArticleWithRequiredTopics => article !== null)
      .filter((article) => {
        // Check publish flag and date
        if (!article.metadata.publish) {
          console.log(`Article ${article.slug} not published`);
          return false;
        }
        if (article.metadata.publish_date) {
          const publishDate = new Date(article.metadata.publish_date);
          if (publishDate > new Date()) {
            console.log(`Article ${article.slug} scheduled for future`);
            return false;
          }
        }
        return true;
      });
    
    console.log('Filtered articles:', filteredArticles.length);
    
    const sortedArticles = filteredArticles.sort((a, b) => {
      if (!a.metadata.date && !b.metadata.date) return 0;
      if (!a.metadata.date) return 1;
      if (!b.metadata.date) return -1;
      return new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime();
    });

    return NextResponse.json(sortedArticles);
  } catch (error) {
    console.error('Error in articles API route:', error);
    return new NextResponse(null, { status: 500 });
  }
} 