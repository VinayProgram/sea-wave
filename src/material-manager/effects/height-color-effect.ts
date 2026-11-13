// effects/heightColorEffect.ts
import { mix, smoothstep } from "three/tsl";
import type { Effect, GridContext } from "../types/generic-types";
import { toUniform, toColorUniform, type ColorInput } from "../utils/to-uniform";

const defaults = {
  deep: 0x06214f as ColorInput,
  shallow: 0x1f9fd8 as ColorInput,
  foam: 0xffffff as ColorInput,
  lowH: -0.4,
  highH: 1.4,
  foamStart: 1.2,
  foamEnd: 2.2,
};

// every key is optional; colors take hex/string/THREE.Color/node, numbers take number/node
export type HeightColorOptions = Partial<{
  deep: ColorInput;
  shallow: ColorInput;
  foam: ColorInput;
  lowH: number | any;
  highH: number | any;
  foamStart: number | any;
  foamEnd: number | any;
}>;

export function heightColorEffect(_grid: GridContext, options: HeightColorOptions = {}) {
  const merged = { ...defaults, ...options };

  const uniforms = {
    deep: toColorUniform(merged.deep),
    shallow: toColorUniform(merged.shallow),
    foam: toColorUniform(merged.foam),
    lowH: toUniform(merged.lowH),
    highH: toUniform(merged.highH),
    foamStart: toUniform(merged.foamStart),
    foamEnd: toUniform(merged.foamEnd),
  };
  const { deep, shallow, foam, lowH, highH, foamStart, foamEnd } = uniforms;

  const effect: Effect<typeof uniforms> = {
    name: "heightColor",
    uniforms,
    color: ({ height }) => {
      const body = mix(deep, shallow, smoothstep(lowH, highH, height));
      return mix(body, foam, smoothstep(foamStart, foamEnd, height));
    },
  };
  return effect;
}