// src/types/mdast.d.ts
import 'mdast';

// Define the structure for callout metadata attached to Blockquote nodes
interface CalloutDetails {
  type: string;
  title?: string; // Title can be optional
  icon: string;
  className: string;
}

// Use module augmentation to add our custom 'callout' property to Data
declare module 'mdast' {
  interface Data {
    callout?: CalloutDetails;
  }
}
