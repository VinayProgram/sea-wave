// types/generic-types.ts
export type TSLNode = any;

export interface GridContext { size: number; segments: number; segmentSize: number }

// shared state that stages fill in and effects read
export interface PipelineContext {
  grid: GridContext;
  origin: [number, number];            // tile world x, z
  total: (p: TSLNode) => TSLNode;      // final surface height at world p = vec2(x, z)
  wavesV: TSLNode;                     // varying: summed wave height at the vertex
  heightV: TSLNode;                    // varying: final surface height
  activityV: TSLNode;                  // varying: summed agitation
  shared: Record<string, TSLNode>;     // effects publish values here (depth, foam...)
}

export interface ColorContext { height: TSLNode; activity: TSLNode; color: TSLNode; ctx: PipelineContext }
export interface OpacityContext { opacity: TSLNode; ctx: PipelineContext }

export interface Effect<U = Record<string, TSLNode>> {
  name: string;
  uniforms: U;
  height?: (p: TSLNode) => TSLNode;                       // adds to the height
  modifyHeight?: (h: TSLNode, p: TSLNode) => TSLNode;     // NEW: reshapes the summed height
  activity?: (p: TSLNode) => TSLNode;
  bind?: (ctx: PipelineContext) => void;                  // NEW: runs once, may publish to ctx.shared
  color?: (c: ColorContext) => TSLNode;
  opacity?: (c: OpacityContext) => TSLNode;               // NEW
}
