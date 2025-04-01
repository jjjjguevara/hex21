import type { Metadata } from 'next';
import { Inter } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hex21 CMS",
  description: "A DITA-powered CMS for scientific content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
                options: {
                  skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
                }
              };
            `,
          }}
        />
        <Script
          id="mathjax-script"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
