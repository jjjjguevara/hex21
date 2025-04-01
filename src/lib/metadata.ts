import matter from 'gray-matter';
import { BaseMetadata, TopicMetadata, MapMetadata } from '@/types/content';

function extractXMLValue(content: string, tag: string): string | undefined {
  const match = content.match(new RegExp(`<${tag}>(.*?)</${tag}>`, 's'));
  return match ? match[1].trim() : undefined;
}

function extractDataValue(content: string, name: string): string | undefined {
  const match = content.match(new RegExp(`<data name="${name}"[^>]*value="([^"]*)"`, 's'));
  return match ? match[1] : undefined;
}

function parseXMLMetadata(content: string): { metadata: MapMetadata; topics: string[] } {
  // Extract basic metadata from topicmeta
  const topicmetaMatch = content.match(/<topicmeta>(.*?)<\/topicmeta>/s);
  const topicmeta = topicmetaMatch ? topicmetaMatch[1] : '';

  const title = extractXMLValue(content, 'title') || '';
  const author = extractXMLValue(topicmeta, 'author');
  const category = extractXMLValue(topicmeta, 'category') || 'Uncategorized';
  const audience = extractXMLValue(topicmeta, 'audience');
  
  // Extract data values
  const publish = extractDataValue(topicmeta, 'publish') === 'true';
  const access_level = extractDataValue(topicmeta, 'access_level') || 'public';
  
  // Extract tags
  const tagsData = extractDataValue(topicmeta, 'tags') || '';
  const tags = tagsData.split(',').map(t => t.trim()).filter(Boolean);

  // Extract topic references
  const topicRefs = content.match(/<topicref href="[^"]+"/g) || [];
  const topics = topicRefs.map(ref => {
    const match = ref.match(/href="\.\.\/topics\/(.*?)\.mdita"/);
    return match ? match[1] : '';
  }).filter(Boolean);

  console.log('Parsed DITA map metadata:', {
    title,
    author,
    category,
    audience,
    publish,
    access_level,
    tags,
    topics
  });

  const metadata: MapMetadata = {
    id: title.toLowerCase().replace(/\s+/g, '-'),
    title,
    author,
    category,
    audience: audience as any,
    publish,
    access_level: access_level as 'public' | 'restricted' | 'classified',
    topics,
    tags
  };

  return { metadata, topics };
}

export function parseMetadata(content: string, type: 'map' | 'topic' = 'topic'): { 
  metadata: MapMetadata | TopicMetadata; 
  topics?: string[];
} {
  if (type === 'map') {
    return parseXMLMetadata(content);
  }

  // Parse YAML frontmatter for topics
  const { data } = matter(content);
  
  const metadata: TopicMetadata = {
    id: data.id || '',
    title: data.title || '',
    author: data.author,
    date: data.date,
    audience: data.audience,
    tags: data.tags || [],
    category: data.category,
    publish: data.publish !== false,
    conditional: data.conditional || {}
  };

  return { metadata };
}

export function validateMetadata(metadata: BaseMetadata): boolean {
  if (!metadata.title) {
    console.error('Missing required field: title');
    return false;
  }

  if ('audience' in metadata && metadata.audience && 
      !['beginner', 'intermediate', 'expert', 'Undergraduate Students'].includes(metadata.audience)) {
    console.error('Invalid audience level:', metadata.audience);
    return false;
  }

  return true;
}

export function isTopicCompatibleWithMap(
  topicMetadata: TopicMetadata, 
  mapMetadata: MapMetadata
): { compatible: boolean; reason?: string } {
  // Check audience compatibility
  if (topicMetadata.audience && mapMetadata.audience) {
    const audienceLevels = ['beginner', 'intermediate', 'expert', 'Undergraduate Students'];
    const topicLevel = audienceLevels.indexOf(topicMetadata.audience);
    const mapLevel = audienceLevels.indexOf(mapMetadata.audience);
    
    if (topicLevel > mapLevel) {
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
  const mapAccess = mapMetadata.access_level;
  
  if (accessLevels.indexOf(topicAccess) > accessLevels.indexOf(mapAccess)) {
    return { 
      compatible: false, 
      reason: 'Topic access level exceeds map access level' 
    };
  }

  return { compatible: true };
} 