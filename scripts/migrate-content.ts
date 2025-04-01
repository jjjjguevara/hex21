import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';

async function ensureDirectoryExists(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function migrateContent() {
  const sourceDir = path.join(process.cwd(), 'content/topics');
  const targetTopicsDir = path.join(process.cwd(), 'content/topics');
  const targetMapsDir = path.join(process.cwd(), 'content/maps');

  // Ensure directories exist
  await ensureDirectoryExists(targetTopicsDir);
  await ensureDirectoryExists(targetMapsDir);

  try {
    const files = await fs.readdir(sourceDir);
    const topics = files.filter(f => f.endsWith('.mdita'));

    // First, migrate topics
    for (const topic of topics) {
      const content = await fs.readFile(path.join(sourceDir, topic), 'utf8');
      const { data, content: topicContent } = matter(content);

      // Create new topic metadata
      const newTopicMetadata = {
        id: topic.replace('.mdita', ''),
        title: data.title || 'Untitled',
        author: data.author,
        audience: data.audience,
        category: data.category || 'Physics', // Default category
        conditional: {
          access_level: 'public' // Default access level
        },
        tags: data.tags || []
      };

      // Write new topic file
      const newTopicContent = matter.stringify(topicContent, newTopicMetadata);
      await fs.writeFile(
        path.join(targetTopicsDir, topic),
        newTopicContent
      );
      console.log(`Migrated topic: ${topic}`);
    }

    // Create a map file that includes all topics
    const mapMetadata = {
      id: 'sound-physics-collection',
      title: 'Sound Physics Collection',
      author: 'Dr. Mary Jones',
      category: 'Physics',
      audience: 'Undergraduate Students',
      publish: true,
      access_level: 'public',
      topics: topics.map(t => t.replace('.mdita', '')),
      tags: ['physics', 'sound', 'waves']
    };

    const mapContent = matter.stringify(
      'This collection contains all sound physics topics.',
      mapMetadata
    );

    await fs.writeFile(
      path.join(targetMapsDir, 'sound-physics.ditamap'),
      mapContent
    );
    console.log('Created map: sound-physics.ditamap');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateContent().catch(console.error); 