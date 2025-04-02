import { visit } from 'unist-util-visit';

interface Properties {
  className?: string[];
  isProcessed?: boolean;
  [key: string]: any;
}

interface Element {
  type: 'element';
  tagName: string;
  properties: Properties;
  children: any[];
}

export function rehypeCodeBlock() {
  return (tree: any) => {
    visit(tree, 'element', (node: Element, index: number | undefined, parent: { children: Element[] } | undefined) => {
      // Only process pre elements that haven't been processed yet
      if (node.tagName === 'pre' && 
          node.children[0]?.tagName === 'code' && 
          !node.properties?.isProcessed) {
        const code = node.children[0];
        const className = code.properties.className || [];
        const language = className[0]?.replace('language-', '') || '';
        
        // Create a wrapper div with our custom component structure
        const wrapper: Element = {
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['relative', 'group'],
            isProcessed: true
          },
          children: [{
            type: 'element',
            tagName: 'pre',
            properties: {
              className: [
                'p-4',
                'overflow-x-auto',
                language ? `language-${language}` : ''
              ].filter(Boolean),
              isProcessed: true
            },
            children: [{
              type: 'element',
              tagName: 'code',
              properties: {
                className: language ? [`language-${language}`] : []
              },
              children: code.children
            }]
          }]
        };

        // Add copy button
        wrapper.children.push({
          type: 'element',
          tagName: 'button',
          properties: {
            className: [
              'absolute',
              'right-2',
              'top-2',
              'text-gray-400',
              'hover:text-gray-100',
              'transition-colors',
              'opacity-0',
              'group-hover:opacity-100',
              'bg-transparent',
              'rounded'
            ],
            'data-copy-code': true,
            'aria-label': 'Copy to clipboard'
          },
          children: [{
            type: 'element',
            tagName: 'svg',
            properties: {
              className: ['w-4', 'h-4'],
              fill: 'none',
              stroke: 'currentColor',
              viewBox: '0 0 24 24'
            },
            children: [{
              type: 'element',
              tagName: 'path',
              properties: {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: '2',
                d: 'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3'
              }
            }]
          }]
        });

        // Replace the original node with our wrapper
        if (parent && typeof index === 'number') {
          parent.children[index] = wrapper;
        }
      }
    });
  };
} 