// effects/types.ts
// TSL's node types are very loose, so we alias them.
export type TSLNode = any;

export interface GridContext {
  size: number;
  segments: number;
  segmentSize: number; // size / segments, the "gauge"
}

// effects/types.ts (additions)
export interface ColorContext {
  height: TSLNode;
  activity: TSLNode; // 0 = calm, 1+ = very disturbed
  color: TSLNode;
}

export interface Effect<U = Record<string, TSLNode>> {
  name: string;
  uniforms: U;
  height?: (p: TSLNode) => TSLNode;
  activity?: (p: TSLNode) => TSLNode; // NEW, optional
  color?: (ctx: ColorContext) => TSLNode;
}