// controls/sea-impacts.ts
import * as THREE from "three";
import { uniform, uniformArray } from "three/tsl";

export const MAX_IMPACTS = 8;

// each slot: x = world x, y = world z, z = start time, w = strength (0 = empty)
export const impactData = uniformArray(
  Array.from({ length: MAX_IMPACTS }, () => new THREE.Vector4(0, 0, -1000, 0)),
  "vec4"
);
export const seaNow = uniform(0); // seconds, updated every frame

let next = 0;
export function addImpact(worldX: number, worldZ: number, strength = 1) {
  (impactData.array as THREE.Vector4[])[next].set(worldX, worldZ, seaNow.value, strength);
  next = (next + 1) % MAX_IMPACTS; // oldest slot gets reused
}