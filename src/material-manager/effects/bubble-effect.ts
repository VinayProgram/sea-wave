// effects/bubble-effect.ts
import {
  time, vec2, vec3, float, mix, smoothstep, length, clamp,
  positionWorld, mx_worley_noise_float,
} from "three/tsl";
import type { Effect, GridContext, TSLNode } from "../types/generic-types";
import { toUniform, toColorUniform, type ColorInput } from "../utils/to-uniform";
import { impactData, seaNow, MAX_IMPACTS } from "../../controls/sea-impacts";

const defaults = {
  bubbleColor: 0xffffff as ColorInput,
  scale: 1.5,
  size: 0.1,
  softness: 0.06,
  drift: 0.4,
  activityMin: 0.25,   // below this the water is calm: no bubbles
  activityMax: 0.9,    // above this: full bubble density
  impactRadius: 6,     // max spread of a splash, world units
  impactSpeed: 5,      // how fast the splash spreads, units/sec
  impactDuration: 2.5, // seconds until a splash is gone
  opacity: 0.85,
};

export type BubbleOptions = {
  [K in keyof typeof defaults]?: K extends "bubbleColor" ? ColorInput : number | TSLNode;
};

export function bubbleEffect(_grid: GridContext, options: BubbleOptions = {}) {
  const m = { ...defaults, ...options };
  const uniforms = {
    bubbleColor: toColorUniform(m.bubbleColor),
    scale: toUniform(m.scale),
    size: toUniform(m.size),
    softness: toUniform(m.softness),
    drift: toUniform(m.drift),
    activityMin: toUniform(m.activityMin),
    activityMax: toUniform(m.activityMax),
    impactRadius: toUniform(m.impactRadius),
    impactSpeed: toUniform(m.impactSpeed),
    impactDuration: toUniform(m.impactDuration),
    opacity: toUniform(m.opacity),
  };
  const u = uniforms;

  const effect: Effect<typeof uniforms> = {
    name: "bubbles",
    uniforms,
    color: ({ activity, color }) => {
      const wx = positionWorld.x;
      const wz = positionWorld.z;
      const t = time.mul(u.drift);

      // --- bubble shapes (world space, so tiles match) ---
      const layer = (s: TSLNode, r: TSLNode, off: number) => {
        const w = mx_worley_noise_float(vec3(wx.mul(s).add(off), wz.mul(s).add(off), t.add(off)));
        return float(1).sub(smoothstep(r, r.add(u.softness), w));
      };
      const spots = layer(u.scale, u.size, 0).max(layer(u.scale.mul(2.7), u.size.mul(0.7), 17.3).mul(0.7));

      // --- source 1: wave / noise agitation ---
      const agitation = smoothstep(u.activityMin, u.activityMax, activity);

      // --- source 2: impacts (fish, objects) ---
      let impact: TSLNode = float(0);
      for (let i = 0; i < MAX_IMPACTS; i++) {
        const d4 = impactData.element(i);
        const age = seaNow.sub(d4.z);
        const life = clamp(float(1).sub(age.div(u.impactDuration)), 0, 1);
        const radius = clamp(age.mul(u.impactSpeed), 0, u.impactRadius);
        const dist = length(vec2(wx, wz).sub(vec2(d4.x, d4.y)));
        const disc = float(1).sub(smoothstep(radius.mul(0.6), radius, dist)); // dense core, soft edge
        impact = impact.max(disc.mul(life).mul(d4.w)); // w = 0 means an empty slot
      }

      const gate = agitation.max(clamp(impact, 0, 1));
      return mix(color, u.bubbleColor, spots.mul(gate).mul(u.opacity));
    },
  };
  return effect;
}