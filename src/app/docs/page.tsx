import { Metadata } from 'next';
import { AnchorHeading } from '@/components/AnchorHeading';

export const metadata: Metadata = {
  title: 'Documentation - Hex 21',
  description: 'Learn how to use Hex 21 CMS for managing and publishing scientific content with DITA XML, LaTeX support, and powerful search capabilities.',
  keywords: 'CMS,DITA,Scientific Content,LaTeX,Technical Documentation',
};

export default function DocsPage() {
  return (
    <article className="prose dark:prose-invert max-w-none">
      <AnchorHeading as="h1" id="welcome-to-hex-21-cms">Welcome to Hex 21 CMS</AnchorHeading>
      <p className="lead">
        Hex 21 is a modern, lightweight Content Management System designed specifically for scientific and technical content. Built with a docs-as-code workflow, it combines the power of DITA XML with the simplicity of Markdown, making it perfect for researchers, technical writers, and content teams.
      </p>

      <AnchorHeading as="h2" id="key-features">Key Features</AnchorHeading>

      <AnchorHeading as="h3" id="content-authoring">📝 Content Authoring</AnchorHeading>
      <ul>
        <li>Support for Lightweight DITA LwDITA in both Markdown MDITA and XML formats</li>
        <li>Built-in LaTeX support for mathematical equations and formulas</li>
        <li>Rich metadata management with YAML frontmatter</li>
        <li>Version control integration with Git</li>
      </ul>

      <AnchorHeading as="h3" id="content-transformation">🔄 Content Transformation</AnchorHeading>
      <ul>
        <li>Automated conversion of DITA content to multiple formats HTML, PDF, ePub</li>
        <li>Custom styling and branding options</li>
        <li>Support for complex document structures and cross-references</li>
      </ul>

      <AnchorHeading as="h3" id="modern-web-interface">🎨 Modern Web Interface</AnchorHeading>
      <ul>
        <li>Responsive design that works on all devices</li>
        <li>Dark mode support for comfortable reading</li>
        <li>Fast, client-side search functionality</li>
        <li>Interactive components and visualizations</li>
      </ul>

      <AnchorHeading as="h3" id="advanced-features">🔍 Advanced Features</AnchorHeading>
      <ul>
        <li>Conditional content rendering based on metadata</li>
        <li>Automated builds and deployments via GitHub Actions</li>
        <li>API access for content and metadata</li>
        <li>Data-driven dashboards and analytics</li>
      </ul>

      <AnchorHeading as="h2" id="getting-started">Getting Started</AnchorHeading>
      <p>
        New to Hex 21? Start with our{' '}
        <a href="/docs/getting-started/installation">installation guide</a> to set
        up your environment. Then, learn about{' '}
        <a href="/docs/content/article-creation">creating your first article</a>.
      </p>

      <AnchorHeading as="h2" id="core-concepts">Core Concepts</AnchorHeading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg">
          <AnchorHeading as="h3" id="content-structure" className="text-lg font-semibold mb-2">
            Content Structure
          </AnchorHeading>
          <p className="text-gray-600 dark:text-gray-300">
            Learn how Hex 21 organizes content using DITA maps and topics for maximum reusability and consistency.
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg">
          <AnchorHeading as="h3" id="metadata-management" className="text-lg font-semibold mb-2">
            Metadata Management
          </AnchorHeading>
          <p className="text-gray-600 dark:text-gray-300">
            Discover how to use metadata to organize, filter, and conditionally render your content.
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg">
          <AnchorHeading as="h3" id="publishing-workflow" className="text-lg font-semibold mb-2">
            Publishing Workflow
          </AnchorHeading>
          <p className="text-gray-600 dark:text-gray-300">
            Understand the automated process of transforming your content from DITA to web-ready formats.
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg">
          <AnchorHeading as="h3" id="customization" className="text-lg font-semibold mb-2">
            Customization
          </AnchorHeading>
          <p className="text-gray-600 dark:text-gray-300">
            Learn how to extend and customize Hex 21 to meet your specific needs.
          </p>
        </div>
      </div>

      <AnchorHeading as="h2" id="need-help">Need Help?</AnchorHeading>
      <p>
        If you need assistance or want to report an issue, please visit our{' '}
        <a href="https://github.com/yourusername/hex21-cms/issues">
          GitHub repository
        </a>{' '}
        or join our community on Discord.
      </p>
    </article>
  );
} 