import { notFound } from 'next/navigation';
import { getDocData } from '@/lib/content.server';
import { Article, TocEntry } from '@/types/content'; 
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import MetadataList from '@/components/MetadataList';
import TableOfContents from '@/components/TableOfContents';
import Link from 'next/link';

// Dynamically import ArticleRenderer with SSR disabled
const ArticleRenderer = dynamic(
  () => import('@/components/ArticleRenderer'),
  { 
    ssr: false,
  }
);

// Props type for catch-all slug route
type Props = {
  params: { 
    slug: string[] 
  }
};

// Generate metadata for the article
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Join the slug segments with slashes for nested paths
  const slug = params.slug.join('/');
  const data = await getDocData(slug);
  
  if (!data) {
    return {
      title: 'Article Not Found'
    };
  }

  const title = data.metadata?.title || slug;
  const description = data.metadata?.shortdesc || data.metadata?.description;
  const keywords = Array.isArray(data.metadata?.tags) ? data.metadata.tags : undefined;
  const author = data.metadata?.author;
  const authorName = typeof author === 'string' ? author : 
                     Array.isArray(author) ? author[0] : 
                     typeof author === 'object' && author?.name ? author.name : 
                     undefined;

  return {
    title: `${title}`,
    description,
    keywords,
    authors: authorName ? [{ name: authorName }] : undefined,
    openGraph: {
      title,
      description,
      type: 'article'
    }
  };
}

// Helper function to get a properly formatted href from a link target
function getTopicHref(linkTarget: string, currentSlug: string): string {
  let href = '';
  
  // If target is a markdown file
  if (linkTarget.endsWith('.md')) {
    // Get parentDir/filename without extension
    const parentDir = currentSlug.substring(0, currentSlug.lastIndexOf('/'));
    const targetBase = linkTarget.replace(/\.md$/, '');
    href = `/articles/${parentDir}/${targetBase}`;
  }
  // If target is already a full path
  else if (linkTarget.startsWith('/')) {
    href = linkTarget;
  }
  // Just a name
  else {
    const parentDir = currentSlug.substring(0, currentSlug.lastIndexOf('/'));
    href = `/articles/${parentDir}/${linkTarget}`;
  }
  
  return href;
}

// Article page with proper catch-all route handling
export default async function ArticlePage({ params }: Props) {
  try {
    // Join the slug segments for nested paths (e.g., ["papers", "brownian-motion"] -> "papers/brownian-motion")
    const slug = params.slug.join('/');
    console.log(`[ArticlePage] Attempting to render article with slug: ${slug}`);
    
    // Check if this is a ditamap-based article
    const isDitamap = slug.includes('/');
    
    if (isDitamap) {
      console.log(`[ArticlePage] This appears to be a ditamap-based article`);
      
      // Process directly with getDocData instead of using the API
      console.log(`[ArticlePage] Processing ditamap directly with getDocData`);
      const ditamapData = await getDocData(slug);
      
      // Log the result of getDocData
      console.log(`[ArticlePage] Result from ditamap getDocData:`, ditamapData ? 
        {
          slug: ditamapData.slug,
          hasContent: !!ditamapData.content,
          contentLength: ditamapData.content?.length || 0,
          hasMetadata: !!ditamapData.metadata,
          metadataKeys: ditamapData.metadata ? Object.keys(ditamapData.metadata) : []
        } : 'null'
      );
      
      // Handle not found
      if (!ditamapData) {
        console.error(`[ArticlePage] Article not found for slug: ${slug}`);
        notFound();
      }
      
      // Get the topics (wiki links) from the ditamap content
      const wikiLinks = extractWikiLinksFromContent(ditamapData.content);
      console.log(`[ArticlePage] Extracted ${wikiLinks.length} wiki links from content`);
      
      // Now load the first topic's content
      if (wikiLinks.length > 0) {
        // Gather all topic content sequentially
        const topicContents: Array<{title: string, content: string, toc: TocEntry[]}> = [];
        
        // For each topic in the wikiLinks, load its content
        for (const link of wikiLinks) {
          // Get topic slug using the helper function but without the leading /articles/
          const fullHref = getTopicHref(link.target, slug);
          const topicSlug = fullHref.replace(/^\/articles\//, '');
          
          console.log(`[ArticlePage] Loading topic: ${topicSlug}`);
          
          try {
            // Load the topic's content
            const topicData = await getDocData(topicSlug);
            
            if (topicData) {
              console.log(`[ArticlePage] Successfully loaded topic content for ${link.title}, length: ${topicData.content?.length || 0}`);
              
              // Add to our collection
              topicContents.push({
                title: link.title,
                content: topicData.content,
                toc: topicData.toc || []
              });
            }
          } catch (error) {
            console.error(`[ArticlePage] Error loading topic content for ${link.title}: ${error}`);
            // Continue with other topics even if one fails
          }
        }
        
        // If we loaded at least one topic
        if (topicContents.length > 0) {
          console.log(`[ArticlePage] Successfully loaded ${topicContents.length} topics`);
          
          // Extract all TOC entries to create a combined TOC
          const combinedToc: TocEntry[] = [];
          topicContents.forEach(topic => {
            if (topic.toc && topic.toc.length > 0) {
              combinedToc.push(...topic.toc);
            }
          });
          
          // Render the combined view - ditamap metadata with all topic content
          return (
            <div className="flex flex-col md:flex-row max-w-screen-xl mx-auto py-8 md:px-8">
              <main className="flex-1 w-full md:mr-8 px-4 md:px-0">
                <MetadataList metadata={ditamapData.metadata} />
                
                <article className="prose dark:prose-invert max-w-none">
                  {/* Render each topic's content sequentially */}
                  {topicContents.map((topic, index) => (
                    <div key={index} className="mb-8">
                      <ArticleRenderer htmlContent={topic.content} />
                      {index < topicContents.length - 1 && <hr className="my-8" />}
                    </div>
                  ))}
                </article>
              </main>

              <aside className="w-64 flex-shrink-0 md:sticky md:top-20 md:max-h-[calc(100vh-5rem)] px-4 md:px-0">
                {combinedToc.length > 0 && <TableOfContents toc={combinedToc} />} 
              </aside>
            </div>
          );
        }
      }
      
      // If we get here, we couldn't load the first topic or there were no topics,
      // so just show the ditamap content
      
      // Type assertion after validation
      const data = ditamapData as Article;
      
      // Validate data structure
      if (!data || typeof data !== 'object' || !data.metadata || !data.content) {
        console.error(`Invalid data structure received for slug: ${slug}, got:`, 
          JSON.stringify({
            hasData: !!data,
            hasMetadata: data && !!data.metadata,
            hasContent: data && !!data.content,
            contentLength: data?.content?.length || 0
          })
        );
        notFound(); 
      }
      
      // We already have wikiLinks defined above, no need to redefine it here
      console.log(`[ArticlePage] Using already extracted ${wikiLinks.length} wiki links for fallback`);
      
      // Render the article with topics
      return (
        <div className="flex flex-col md:flex-row max-w-screen-xl mx-auto py-8 md:px-8">
          <main className="flex-1 w-full md:mr-8 px-4 md:px-0">
            <MetadataList metadata={data.metadata} />
            
            <article className="prose dark:prose-invert max-w-none">
              <ArticleRenderer htmlContent={data.content} />
            </article>
          </main>

          <aside className="w-64 flex-shrink-0 md:sticky md:top-20 md:max-h-[calc(100vh-5rem)] px-4 md:px-0">
            {data.toc && data.toc.length > 0 && <TableOfContents toc={data.toc} />} 
          </aside>
        </div>
      );
    }
    
    // Regular article handling - same as before
    console.log(`[ArticlePage] Calling getDocData with slug: ${slug}`);
    const rawData = await getDocData(slug);

    // Log the result of getDocData
    console.log(`[ArticlePage] Result from getDocData:`, rawData ? 
      {
        slug: rawData.slug,
        hasContent: !!rawData.content,
        contentLength: rawData.content?.length || 0,
        hasMetadata: !!rawData.metadata,
        metadataKeys: rawData.metadata ? Object.keys(rawData.metadata) : []
      } : 'null'
    );

    // Handle not found
    if (!rawData) {
      console.error(`[ArticlePage] Article not found for slug: ${slug}`);
      notFound();
    }

    // Type assertion after validation
    const data = rawData as Article;

    // Validate data structure
    if (!data || typeof data !== 'object' || !data.metadata || !data.content) {
      console.error(`Invalid data structure received for slug: ${slug}, got:`, 
        JSON.stringify({
          hasData: !!data,
          hasMetadata: data && !!data.metadata,
          hasContent: data && !!data.content,
          contentLength: data?.content?.length || 0
        })
      );
      notFound(); 
    }

    // Destructure article data
    const { metadata, content: htmlContent, toc } = data;

    // Render the article
    return (
      <div className="flex flex-col md:flex-row max-w-screen-xl mx-auto py-8 md:px-8">
        <main className="flex-1 w-full md:mr-8 px-4 md:px-0">
          <MetadataList metadata={metadata} />

          <article className="prose dark:prose-invert max-w-none">
            <ArticleRenderer htmlContent={htmlContent} />
          </article>
        </main>

        <aside className="w-64 flex-shrink-0 md:sticky md:top-20 md:max-h-[calc(100vh-5rem)] px-4 md:px-0">
          {toc && toc.length > 0 && <TableOfContents toc={toc} />} 
        </aside>
      </div>
    );
  } catch (error) {
    console.error('Error rendering article page:', error);
    notFound();
  }
}

// Helper function to extract wiki links from HTML content
function extractWikiLinksFromContent(content: string): Array<{target: string, title: string}> {
  // Find links with the wiki-link class
  const wikiLinkRegex = /<a\s+class="wiki-link"\s+data-target="([^"]+)"\s+href="[^"]+">([^<]+)<\/a>/g;
  const links: Array<{target: string, title: string}> = [];
  
  let match;
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    links.push({
      target: match[1],
      title: match[2]
    });
  }
  
  // If no wiki links were found using the class-based approach,
  // try extracting links from a list structure which is common in ditamaps
  if (links.length === 0) {
    // Look for list items with links
    const listItemLinkRegex = /<li><a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a><\/li>/g;
    
    while ((match = listItemLinkRegex.exec(content)) !== null) {
      links.push({
        target: match[1].replace(/^\/articles\/[^\/]+\//, ''),  // Remove the prefix path
        title: match[2]
      });
    }
  }
  
  return links;
}
