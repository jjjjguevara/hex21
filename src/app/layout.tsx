import type { Metadata } from 'next';
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import 'highlight.js/styles/github.css';
import 'highlight.js/styles/github-dark.css';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import ClientLayout from '@/components/ClientLayout';
import Footer from '@/components/Footer';
import '@/lib/client-utils';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: '%s | Hex 21',
    default: 'Hex 21 - Scientific Content Management System'
  },
  description: 'A modern platform for managing and publishing scientific content with DITA XML, LaTeX support, and powerful search capabilities.',
  keywords: ['CMS', 'DITA', 'Scientific Content', 'LaTeX', 'Technical Documentation'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Standard MathJax 3 Configuration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$']],
                  displayMath: [['$$', '$$']],
                },
                svg: {
                  fontCache: 'global'
                },
                options: {
                  enableMenu: true
                },
                startup: {
                  typesetOnLoad: false
                }
              };
            `
          }}
        />
        {/* Load MathJax 3 from CDN */}
        <script
          id="MathJax-script"
          defer
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
        ></script>
      </head>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <ClientLayout>
          {children}
          <Footer />
        </ClientLayout>
      </body>
    </html>
  );
}
