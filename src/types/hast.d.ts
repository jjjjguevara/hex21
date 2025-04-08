// src/types/hast.d.ts
import 'hast';

// Reuse the CalloutData interface definition if it's consistent,
// or redefine if needed for HAST context. Assuming it's the same here.
interface CalloutData {
  type: string;
  title: string;
  icon: string;
  className: string;
}

// Use module augmentation to add our custom 'callout' property to ElementData
declare module 'hast' {
  interface Data {
    callout?: CalloutData;
  }
  // Also augment ElementData if necessary, though augmenting Data usually covers it.
  // interface ElementData {
  //   callout?: CalloutData;
  // }
}
