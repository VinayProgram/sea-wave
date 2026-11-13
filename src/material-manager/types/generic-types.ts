// effects/types.ts
// TSL's node types are very loose, so we alias them.
export type TSLNode = any;

export interface GridContext {
  size: number;
  segments: number;
  segmentSize: number; // size / segments, the "gauge"
}

export interface ColorContext {
  height: TSLNode; // final height, passed to the fragment stage as a varying
  color: TSLNode;  // color so far, which this effect modifies
}

export interface Effect<U = Record<string, TSLNode>> {
  name: string;
  uniforms: U;                                  // live-tweakable values
  height?: (p: TSLNode) => TSLNode;             // vertex: p is vec2(x, y)
  color?: (ctx: ColorContext) => TSLNode;       // fragment: returns new color
}