import type { Metadata } from 'next';
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import 'highlight.js/styles/github.css';
import 'highlight.js/styles/github-dark.css';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import ClientLayout from '@/components/ClientLayout';

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
        <Script
          id="mathjax-config"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$'], ['\\(', '\\)']],
                  displayMath: [['$$', '$$'], ['\\[', '\\]']],
                  processEscapes: true,
                },
                svg: {
                  fontCache: 'global'
                },
                options: {
                  skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
                }
              };
            `,
          }}
        />
        <Script
          id="mathjax-script"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
