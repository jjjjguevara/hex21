import { Metadata } from 'next';
import ContentPane from '@/components/ContentPane';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Hex 21 CMS - A modern platform for managing and publishing scientific content.',
};

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <ContentPane width="wide">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Sobre Hex 21</h1>
          
          <div className="prose dark:prose-invert max-w-none">
            <p className="lead text-xl text-gray-600 dark:text-gray-300 mb-8">
              Hex 21 es adalid de las tecnologías distribuídas y el acceso a la información.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Our Mission</h2>
                <p>
                  To provide researchers, technical writers, and content creators with a powerful platform
                  that makes managing complex scientific content simple and efficient.
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Our Vision</h2>
                <p>
                  To become the leading platform for scientific content management, setting new standards
                  for technical documentation and research publication.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold mb-6">Key Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">DITA XML Support</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Native support for DITA XML, ensuring structured and reusable content.
                </p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">LaTeX Integration</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Seamless rendering of mathematical equations and scientific notation.
                </p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Version Control</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Built-in version control for tracking changes and managing content lifecycle.
                </p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Advanced Search</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Powerful search capabilities with support for technical terms and equations.
                </p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Multi-format Export</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Export content to various formats including PDF, HTML, and ePub.
                </p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Collaboration Tools</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Built-in tools for team collaboration and content review workflows.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold mb-6">Technology Stack</h2>
            <div className="mb-12">
              <p className="mb-4">
                Hex 21 CMS is built using modern technologies to ensure performance, reliability, and extensibility:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                <li>Next.js for server-side rendering and static site generation</li>
                <li>DITA Open Toolkit for XML processing and transformation</li>
                <li>React and Tailwind CSS for the user interface</li>
                <li>MathJax for LaTeX rendering</li>
                <li>SQLite for efficient data storage</li>
                <li>Git for version control</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold mb-6">Get Started</h2>
            <div className="flex gap-4">
              <a
                href="/docs/getting-started/introduction"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Read Documentation
              </a>
              <a
                href="/articles"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Browse Articles
              </a>
            </div>
          </div>
        </div>
      </ContentPane>
    </div>
  );
} 