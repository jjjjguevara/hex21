import { promises as fs } from 'fs';
import path from 'path';
import { parseMetadata } from '@/lib/metadata';
import { Article, MapMetadata } from '@/types/content';
import { NextResponse } from 'next/server';
import { findTopicContent } from '@/lib/content/topic-finder';

type ArticleWithRequiredTopics = {
  slug: string;
  content: string;
  metadata: MapMetadata;
  topics: { id: string }[];
};

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
            const result = await parseMetadata(content, 'map');
            const { metadata, topics } = result as { 
              metadata: MapMetadata; 
              topics: string[] 
            };
            
            const slug = filename.replace(/\.ditamap$/, '');
            
            // Load first topic content for preview
            let firstTopicContent = '';
            if (topics && topics.length > 0) {
              console.log(`Loading first topic for ${slug}:`, topics[0]);
              const topicContent = await findTopicContent(topics[0], topicsDir);
              if (topicContent) {
                const { metadata: topicMetadata } = await parseMetadata(topicContent, 'topic');
                firstTopicContent = topicContent;
                console.log(`Successfully loaded first topic for ${slug}`);
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
            console.error(`Error processing map ${filename}:`, error);
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