// effects/shoreWaveEffect.ts
import {
  time, float, vec2, sin, cos, pow, dot, radians, smoothstep, mix, clamp,
} from "three/tsl";
import type { Effect, GridContext, TSLNode } from "../types/generic-types";
import { toUniform } from "../utils/to-uniform";

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const TRAINS = 4; // number of different wave trains

// fixed per-train randoms (computed in JS, 0..1)
const rnd = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const defaults = {
  coastAngle: 0,     // degrees; pass uniforms.shore.coastAngle so waves face the beach
  wavelength: 22,    // distance between crests (world units)
  speed: 4,          // crest travel speed (world units / second)
  maxHeight: 1.6,
  sharpness: 2,      // 1 = soft hill, higher = narrow crest
  skew: 0.5,         // long gentle back, steeper front
  spread: 20,        // degrees each train may deviate from the beach direction
  variety: 0.5,      // 0 = all trains alike, ~0.9 = very different
  groupLength: 60,   // length of a wave group along the crest
  groupAmount: 0.6,  // 0 = uniform crest, 1 = fully separate humps
  drift: 0.3,        // how fast groups slide sideways
  setAmount: 0.7,    // 0 = constant, 1 = trains fade fully in and out
  setSpeed: 0.15,    // how fast sets come and go
};
export type ShoreWaveOptions = { [K in keyof typeof defaults]?: number | TSLNode };

export function shoreWaveEffect(_grid: GridContext, options: ShoreWaveOptions = {}) {
  const merged = { ...defaults, ...options };
  const uniforms = {
    coastAngle: toUniform(merged.coastAngle),
    wavelength: toUniform(merged.wavelength),
    speed: toUniform(merged.speed),
    maxHeight: toUniform(merged.maxHeight),
    sharpness: toUniform(merged.sharpness),
    skew: toUniform(merged.skew),
    spread: toUniform(merged.spread),
    variety: toUniform(merged.variety),
    groupLength: toUniform(merged.groupLength),
    groupAmount: toUniform(merged.groupAmount),
    drift: toUniform(merged.drift),
    setAmount: toUniform(merged.setAmount),
    setSpeed: toUniform(merged.setSpeed),
  };
  const u = uniforms;
  const baseAng = radians(u.coastAngle);

  const train = (p: TSLNode, i: number) => {
    const r1 = rnd(i, 1), r2 = rnd(i, 2), r3 = rnd(i, 3), r4 = rnd(i, 4);

    // each train has its own wavelength, speed and heading
    const wl = u.wavelength.mul(float(1).add(u.variety.mul((r1 - 0.5) * 1.6)));
    const spd = u.speed.mul(float(1).add(u.variety.mul((r2 - 0.5) * 1.2)));
    const ang = baseAng.add(u.spread.mul(DEG * (r3 * 2 - 1)));

    // same direction the shore uses: sand rises along (sin a, cos a)
    const dir = vec2(sin(ang), cos(ang));
    const side = vec2(dir.y, dir.x.negate());
    const along = dot(p, dir);
    const across = dot(p, side);

    // traveling wave toward the beach, with a skewed (leaning) front
    const phase = along.sub(time.mul(spd)).mul(TAU).div(wl).add(r4 * TAU);
    const skewed = phase.sub(u.skew.mul(sin(phase)));
    const crest = pow(sin(skewed).mul(0.5).add(0.5), u.sharpness);

    // extruded humps along the crest, sliding slowly
    const g = sin(across.mul(TAU).div(u.groupLength).add(time.mul(u.drift)).add(i * 2.0)).mul(0.5).add(0.5);
    const group = mix(float(1).sub(u.groupAmount), float(1), smoothstep(0.2, 0.8, g));

    // sets: this train swells and fades over time
    const e = sin(time.mul(u.setSpeed).add(i * 2.4)).mul(0.5).add(0.5);
    const env = mix(float(1).sub(u.setAmount), float(1), smoothstep(0.2, 0.8, e));

    const weight = 0.5 + r2 * 0.5;
    return crest.mul(group).mul(env).mul(weight);
  };

  const sum = (p: TSLNode) => {
    let h: TSLNode = train(p, 0);
    for (let i = 1; i < TRAINS; i++) h = h.add(train(p, i));
    return h.mul(u.maxHeight).div(TRAINS * 0.5);
  };

  const effect: Effect<typeof uniforms> = {
    name: "shoreWave",
    uniforms,
    height: (p) => sum(p),
    activity: (p) => clamp(sum(p).div(u.maxHeight), 0, 1),
  };
  return effect;
}