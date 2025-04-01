import { promises as fs } from 'fs';
import path from 'path';
import { parseMetadata } from '@/lib/metadata';
import { Article, MapMetadata } from '@/types/content';
import { NextResponse } from 'next/server';

export async function GET() {
  const contentDir = path.join(process.cwd(), 'content/maps');
  const topicsDir = path.join(process.cwd(), 'content/topics');
  
  try {
    const filenames = await fs.readdir(contentDir);
    console.log('Found map files:', filenames);
    
    const articles = await Promise.all(
      filenames
        .filter((name) => name.endsWith('.ditamap'))
        .map(async (filename) => {
          const filePath = path.join(contentDir, filename);
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const { metadata, topics } = parseMetadata(content, 'map') as { 
              metadata: MapMetadata; 
              topics: string[] 
            };
            
            const slug = filename.replace(/\.ditamap$/, '');
            
            // Load first topic content for preview
            let firstTopicContent = '';
            if (topics && topics.length > 0) {
              const topicPath = path.join(topicsDir, `${topics[0]}.mdita`);
              try {
                const topicContent = await fs.readFile(topicPath, 'utf8');
                const { metadata: topicMetadata } = parseMetadata(topicContent, 'topic');
                firstTopicContent = topicContent;
              } catch (error) {
                console.error(`Error loading topic ${topics[0]}:`, error);
              }
            }
            
            return {
              slug,
              content: firstTopicContent,
              metadata,
              topics: topics.map(id => ({ id }))
            };
          } catch (error) {
            console.error(`Error processing map ${filename}:`, error);
            return null;
          }
        })
    );

    // Filter out failed articles and unpublished ones
    const filteredArticles = articles
      .filter((article): article is Article => article !== null)
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