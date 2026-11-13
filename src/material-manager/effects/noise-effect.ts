// effects/noiseEffect.ts
import { time, vec3, mx_noise_float } from "three/tsl";
import type { Effect, GridContext, TSLNode } from "../types/generic-types";
import { toUniform } from "../utils/to-uniform";

const defaults = {
  swellAmp: 0.55,
  swellScale: 0.0,
  chopAmp: 0.025,
  chopScale: 5,
  seaSpeed: 0.6,
};

// every key is optional, and each value is a number or an existing uniform node
export type NoiseOptions = {
  [K in keyof typeof defaults]?: number | TSLNode;
};

export function noiseEffect(_grid: GridContext, options: NoiseOptions = {}) {
  const merged = { ...defaults, ...options };

  const uniforms = {
    swellAmp: toUniform(merged.swellAmp),
    swellScale: toUniform(merged.swellScale),
    chopAmp: toUniform(merged.chopAmp),
    chopScale: toUniform(merged.chopScale),
    seaSpeed: toUniform(merged.seaSpeed),
  };
  const { swellAmp, swellScale, chopAmp, chopScale, seaSpeed } = uniforms;

  const effect: Effect<typeof uniforms> = {
    name: "noise",
    uniforms,
    height: (p) => {
      const swell = mx_noise_float(
        vec3(p.x.mul(swellScale), p.y.mul(swellScale), time.mul(seaSpeed).mul(0.5))
      ).mul(swellAmp);
      const chop = mx_noise_float(
        vec3(p.x.mul(chopScale), p.y.mul(chopScale), time.mul(seaSpeed).mul(2))
      ).mul(chopAmp);
      return swell.add(chop);
    },
  };
  return effect;
}