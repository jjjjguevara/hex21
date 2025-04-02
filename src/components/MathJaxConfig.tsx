'use client';

import Script from 'next/script';

export default function MathJaxConfig() {
  return (
    <>
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
                processEnvironments: true,
                packages: ['base', 'ams', 'noerrors', 'noundefined']
              },
              svg: {
                fontCache: 'global'
              },
              options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
                processHtmlClass: 'math-tex'
              },
              startup: {
                typeset: true
              }
            };
          `
        }}
      />
      <Script
        id="mathjax-script"
        strategy="afterInteractive"
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
      />
    </>
  );
} 