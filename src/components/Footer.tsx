import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              About Hex 21
            </h3>
            <p className="mt-4 text-base text-gray-600 dark:text-gray-300">
              A modern platform for managing and publishing scientific content with DITA XML, LaTeX support, and powerful search capabilities.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Resources
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/docs" className="text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/articles" className="text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                  Articles
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Legal
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/privacy" className="text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8">
          <p className="text-base text-gray-500 dark:text-gray-400 text-center">
            © {new Date().getFullYear()} Hex 21. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 