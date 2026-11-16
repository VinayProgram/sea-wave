

// effects/shore-effect.ts
import {
  positionWorld, time, vec3, float, mix, smoothstep, max, mx_fractal_noise_float, mx_noise_float,
} from "three/tsl";
import { toColorUniform, toUniform, type ColorInput } from "../utils/to-uniform";
import type { Effect, GridContext, TSLNode } from "../types/generic-types";

const defaults = {
  // terrain: sea toward -z, beach toward +z
  seaLevel: 0, slope: 0.12, shoreZ: 0,
  coastAmp: 1.5, coastScale: 0.04, bumpAmp: 0.2, bumpScale: 0.35,
  // shore look
  shoreWidth: 0.35,  // depth over which sand turns into water
  deepDepth: 3,      // depth where water reaches max opacity
  wetWidth: 0.6,     // how far above the waterline the sand stays wet
  foamWidth: 0.25,
  surfWidth: 1.2,    // zone near the waterline that agitates bubbles
  minOpacity: 0.55, maxOpacity: 0.85,
  dryColor: 0xe6cf98 as ColorInput,
  wetColor: 0x8a7048 as ColorInput,
  foamColor: 0xffffff as ColorInput,
};
const colorKeys = ["dryColor", "wetColor", "foamColor"];

export type ShoreOptions = {
  [K in keyof typeof defaults]?: K extends `${string}Color` ? ColorInput : number | TSLNode;
};

export function shoreEffect(_grid: GridContext, options: ShoreOptions = {}) {
  const m: any = { ...defaults, ...options };
  const u: Record<string, any> = {};
  for (const k of Object.keys(defaults)) {
    u[k] = colorKeys.includes(k) ? toColorUniform(m[k]) : toUniform(m[k]);
  }

  // ---- the terrain formula: world x, z in -> sand height out ----
  const sand = (wx: TSLNode, wz: TSLNode) => {
    const tilt = wz.sub(u.shoreZ).mul(u.slope);
    const coast = mx_fractal_noise_float(
      vec3(wx.mul(u.coastScale), wz.mul(u.coastScale), float(0)), 3, 2.0, 0.5
    ).mul(u.coastAmp);
    const bumps = mx_fractal_noise_float(
      vec3(wx.mul(u.bumpScale), wz.mul(u.bumpScale), float(10)), 2, 2.0, 0.5
    ).mul(u.bumpAmp);
    return tilt.add(coast).add(bumps);
  };

  // waves fade to nothing where the water is shallow
  const damp = (wx: TSLNode, wz: TSLNode) =>
    smoothstep(0, u.shoreWidth.mul(3), u.seaLevel.sub(sand(wx, wz)));

  const effect: Effect<any> = {
    name: "shore",
    uniforms: u,

    // VERTEX: land where the sand is higher, damped waves where it is not
    modifyHeight: (waves, p) =>
      max(sand(p.x, p.y), u.seaLevel.add(waves.mul(damp(p.x, p.y)))),

    // VERTEX: agitation near the waterline, so bubbles appear in the surf zone
    activity: (p) => {
      const still = u.seaLevel.sub(sand(p.x, p.y));
      return float(1).sub(smoothstep(0, u.surfWidth, still.abs()));
    },

    // FRAGMENT SETUP: per-pixel depth = water surface - sand, published for everyone
    bind: (ctx) => {
      const fx = positionWorld.x;
      const fz = positionWorld.z;
      ctx.shared.depth = u.seaLevel
        .add(ctx.wavesV.mul(damp(fx, fz)))
        .sub(sand(fx, fz));
      ctx.shared.fx = fx;
      ctx.shared.fz = fz;
    },

    // FRAGMENT: sand on land, incoming (water) color in the sea, foam line between
    color: ({ color, ctx }) => {
      const depth = ctx.shared.depth;
      const seaMask = smoothstep(0, u.shoreWidth, depth);

      const wetAmt = smoothstep(u.wetWidth.negate(), 0, depth); // 1 at the waterline
      const sandCol = mix(u.dryColor, u.wetColor, wetAmt);

      const band = float(1).sub(smoothstep(0, u.foamWidth, depth.abs()));
      const lace = mx_noise_float(
        vec3(ctx.shared.fx.mul(2.5), ctx.shared.fz.mul(2.5), time.mul(0.6))
      ).mul(0.5).add(0.5);
      const foam = band.mul(smoothstep(0.3, 0.7, lace.add(band.mul(0.3))));
      ctx.shared.foam = foam; // the opacity stage reuses it

      return mix(mix(sandCol, color, seaMask), u.foamColor, foam);
    },

    // FRAGMENT: solid land, see-through shallows, denser deep water, opaque foam
    opacity: ({ opacity, ctx }) => {
      const depth = ctx.shared.depth;
      const seaMask = smoothstep(0, u.shoreWidth, depth);
      const deepT = smoothstep(0, u.deepDepth, depth);
      const seaOp = mix(u.minOpacity, u.maxOpacity, deepT);
      return max(opacity.mul(mix(float(1), seaOp, seaMask)), ctx.shared.foam);
    },
  };
  return effect;
}