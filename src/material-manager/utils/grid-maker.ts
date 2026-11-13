import type { GridContext } from "../types/generic-types";


export const makeGrid = (size: number, segments: number): GridContext => ({
  size,
  segments,
  segmentSize: size / segments,
});