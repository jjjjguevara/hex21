import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface NavItem {
  title: string;
  href: string;
  items?: NavItem[];
}

export async function getDocsNavigation(): Promise<NavItem[]> {
  const docsDir = path.join(process.cwd(), 'content/docs');
  const navigation: NavItem[] = [];

  try {
    // Read the root docs directory
    const entries = await fs.readdir(docsDir, { withFileTypes: true });

    // Process directories first to maintain order
    const directories = entries.filter(entry => entry.isDirectory() && !entry.name.startsWith('.'));
    for (const dir of directories) {
      const dirPath = path.join(docsDir, dir.name);
      const dirEntries = await fs.readdir(dirPath, { withFileTypes: true });
      
      // Get the section title by converting directory name
      const sectionTitle = dir.name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const items: NavItem[] = [];

      // Process all .mdita and .md files in the directory
      for (const entry of dirEntries) {
        if (entry.isFile() && (entry.name.endsWith('.mdita') || entry.name.endsWith('.md'))) {
          const filePath = path.join(dirPath, entry.name);
          const content = await fs.readFile(filePath, 'utf8');
          const { data: metadata } = matter(content);
          const slug = entry.name.replace(/\.(mdita|md)$/, '');
          
          items.push({
            title: metadata.title || slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
            href: `/docs/${dir.name}/${slug}`,
          });
        }
      }

      if (items.length > 0) {
        navigation.push({
          title: sectionTitle,
          href: `/docs/${dir.name}`, // This is just for grouping, not a real page
          items,
        });
      }
    }

    // Process root .mdita and .md files
    const rootFiles = entries.filter(entry => 
      entry.isFile() && 
      (entry.name.endsWith('.mdita') || entry.name.endsWith('.md')) &&
      !entry.name.startsWith('.')
    );

    // Group root files into a "General" section if there are any
    if (rootFiles.length > 0) {
      const rootItems: NavItem[] = [];
      
      for (const file of rootFiles) {
        const filePath = path.join(docsDir, file.name);
        const content = await fs.readFile(filePath, 'utf8');
        const { data: metadata } = matter(content);
        const slug = file.name.replace(/\.(mdita|md)$/, '');

        rootItems.push({
          title: metadata.title || slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
          href: `/docs/${slug}`,
        });
      }

      if (rootItems.length > 0) {
        navigation.push({
          title: 'General',
          href: '/docs',
          items: rootItems,
        });
      }
    }

    return navigation;
  } catch (error) {
    console.error('Error building navigation:', error);
    return [];
  }
} 