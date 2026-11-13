import { color, uniform } from "three/tsl";
import type { TSLNode } from "../types/generic-types";
import * as THREE from "three";
// number -> new uniform, existing uniform node -> used as-is (shared)
export const toUniform = (v: number | TSLNode) =>
  typeof v === "number" ? uniform(v) : v;

// hex number / css string / THREE.Color -> new color uniform, existing node -> used as-is
export type ColorInput = number | string | THREE.Color | TSLNode;

export const toColorUniform = (v: ColorInput) =>
  typeof v === "number" || typeof v === "string" || v instanceof THREE.Color
    ? uniform(color(v as any))
    : v;