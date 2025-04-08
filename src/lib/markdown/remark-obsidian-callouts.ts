/**
 * Custom remark plugin for processing Obsidian-style callouts
 * Supports syntax like: > [!note] Title
 */

import { visit } from 'unist-util-visit';
import type { Root, Blockquote, Paragraph, Text } from 'mdast';
import type { Data } from 'unist';

// Define the expected structure for callout metadata
interface CalloutData extends Data {
  callout: {
    type: string;
    title?: string; // Title is optional
    icon: string;
    className: string;
  };
  hProperties: {
    'data-callout-type': string;
    'data-callout-title': string;
    'data-callout-icon': string;
    'data-callout-className': string;
  };
}

// Map of callout types to CSS classes and icons (keep this the same)
const CALLOUT_TYPES = {
  note: { icon: 'ℹ️', className: 'callout-note' },
  abstract: { icon: '📝', className: 'callout-abstract' },
  info: { icon: 'ℹ️', className: 'callout-info' },
  todo: { icon: '✅', className: 'callout-todo' },
  tip: { icon: '💡', className: 'callout-tip' },
  success: { icon: '✅', className: 'callout-success' },
  question: { icon: '❓', className: 'callout-question' },
  warning: { icon: '⚠️', className: 'callout-warning' },
  failure: { icon: '❌', className: 'callout-failure' },
  danger: { icon: '⚠️', className: 'callout-danger' },
  bug: { icon: '🐛', className: 'callout-bug' },
  example: { icon: '📑', className: 'callout-example' },
  quote: { icon: '💬', className: 'callout-quote' },
  nota: { icon: '📌', className: 'callout-note' }, // Spanish "note"
  descargo: { icon: '⚠️', className: 'callout-warning' }, // For disclaimers
  disclaimer: { icon: '🚨', className: 'callout-disclaimer' },
  important: { icon: '❗', className: 'callout-important' },
  tldr: { icon: '📄', className: 'callout-tldr' }, // Alias for abstract
};

const DEFAULT_CALLOUT = { icon: 'ℹ️', className: 'callout-default' };

/**
 * Remark plugin to identify Obsidian-style callouts and add metadata.
 */
export function remarkObsidianCallouts() {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: Blockquote) => {
      console.log('[Remark Callouts] Visited a blockquote node. Children count:', node.children.length);
      if (!node.children || node.children.length === 0) {
        return;
      }

      const firstChild = node.children[0] as Paragraph; // Expecting a paragraph
      if (firstChild.type !== 'paragraph' || !firstChild.children || firstChild.children.length === 0) {
        return;
      }

      const firstTextNode = firstChild.children[0] as Text; // Expecting text in the first paragraph
      if (firstTextNode.type !== 'text' || typeof firstTextNode.value !== 'string') {
        return;
      }

      // --- Modified Logic ---
      const lines = firstTextNode.value.split('\n');
      const firstLine = lines[0];

      // Regex to match callout syntax on the FIRST line only.
      // Captures type and optional title.
      const calloutRegex = /^\s*\[!(\w+)\](?:\s+(.*))?\s*$/;
      console.log('[Remark Callouts] Checking first line:', JSON.stringify(firstLine));
      const match = firstLine.match(calloutRegex);

      if (!match) {
        console.log('[Remark Callouts] Regex did not match first line.');
        return; // Not a callout
      }

      const [, calloutType, title] = match; // title might be undefined
      const calloutTypeKey = calloutType.toLowerCase() as keyof typeof CALLOUT_TYPES;
      const calloutInfo = CALLOUT_TYPES[calloutTypeKey] || DEFAULT_CALLOUT;

      // Remove the matched first line and reconstruct the text node value
      const remainingContent = lines.slice(1).join('\n').trimStart();
      firstTextNode.value = remainingContent;

      // If the text node is now empty, remove it from the paragraph
      if (firstTextNode.value === '') {
        firstChild.children.shift();
      }

      // If the first paragraph is now empty (only contained the callout syntax line), remove it
      if (firstChild.children.length === 0) {
        node.children.shift();
      }
      // --- End Modified Logic ---

      // Add metadata to the blockquote node for the rehype plugin
      node.data = node.data || {}; // Initialize data if it doesn't exist
      node.data = {
        ...node.data, // Now safe to spread
        hProperties: {
          ...((node.data?.hProperties as Record<string, unknown>) || {}),
          'data-callout-type': calloutType.toLowerCase(),
          'data-callout-title': title?.trim() || '', // Use empty string if title is undefined
          'data-callout-icon': calloutInfo.icon,
          'data-callout-className': calloutInfo.className
        }
      } as CalloutData; // Assert the type
      console.log('[Remark Callouts] Added hProperties:', node.data.hProperties);
    });
  };
}
