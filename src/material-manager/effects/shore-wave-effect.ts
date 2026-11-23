// effects/shoreWaveEffect.ts
import {
  time, float, vec2, sin, dot, smoothstep, mix, pow, clamp,
} from "three/tsl";
import type { Effect, GridContext, TSLNode } from "../types/generic-types";
import { toUniform } from "../utils/to-uniform";

const TAU = Math.PI * 2;
const TRAINS = 4;

const rnd = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const defaults = {
  wavelength: 22,    // distance between crests, measured toward the beach
  speed: 4,
  maxHeight: 1.6,
  sharpness: 2,
  skew: 0.5,         // flip the sign if the steep side faces away from the beach
  variety: 0.5,
  shoal: 1.8,        // height multiplier in shallow water
  shoalDepth: 4,     // water depth over which shoaling happens
  groupLength: 60,
  groupAmount: 0.6,
  drift: 0.3,
  setAmount: 0.7,
  setSpeed: 0.15,
};
export type ShoreWaveOptions = { [K in keyof typeof defaults]?: number | TSLNode };

// shore = the object returned by shoreEffect(...): has .sand and .uniforms
export function shoreWaveEffect(
  _grid: GridContext,
  options: ShoreWaveOptions,
  shore: { sand: (x: TSLNode, z: TSLNode) => TSLNode; uniforms: Record<string, any> }
) {
  const merged = { ...defaults, ...options };
  const uniforms = {
    wavelength: toUniform(merged.wavelength),
    speed: toUniform(merged.speed),
    maxHeight: toUniform(merged.maxHeight),
    sharpness: toUniform(merged.sharpness),
    skew: toUniform(merged.skew),
    variety: toUniform(merged.variety),
    shoal: toUniform(merged.shoal),
    shoalDepth: toUniform(merged.shoalDepth),
    groupLength: toUniform(merged.groupLength),
    groupAmount: toUniform(merged.groupAmount),
    drift: toUniform(merged.drift),
    setAmount: toUniform(merged.setAmount),
    setSpeed: toUniform(merged.setSpeed),
  };
  const u = uniforms;
  const { seaLevel, slope } = shore.uniforms;

  const train = (p: TSLNode, i: number) => {
    const r1 = rnd(i, 1), r2 = rnd(i, 2), r4 = rnd(i, 4);

    const wl = u.wavelength.mul(float(1).add(u.variety.mul((r1 - 0.5) * 1.6)));
    const spd = u.speed.mul(float(1).add(u.variety.mul((r2 - 0.5) * 1.2)));

    // distance toward the beach, taken from the real terrain:
    // it rises toward land and bends with the coastline noise
    const h = shore.sand(p.x, p.y);
    const along = h.div(slope);

    const phase = along.sub(time.mul(spd)).mul(TAU).div(wl).add(r4 * TAU);
    const skewed = phase.sub(u.skew.mul(sin(phase)));
    const crest = pow(sin(skewed).mul(0.5).add(0.5), u.sharpness);

    // humps along the crest (any direction, so use world position)
    const g = sin(dot(p, vec2(0.7, 0.7)).mul(TAU).div(u.groupLength).add(time.mul(u.drift)).add(i * 2.0))
      .mul(0.5).add(0.5);
    const group = mix(float(1).sub(u.groupAmount), float(1), smoothstep(0.2, 0.8, g));

    // sets: each train swells and fades
    const e = sin(time.mul(u.setSpeed).add(i * 2.4)).mul(0.5).add(0.5);
    const env = mix(float(1).sub(u.setAmount), float(1), smoothstep(0.2, 0.8, e));

    // shoaling: waves grow as the water gets shallow
    const depth = seaLevel.sub(h);
    const shallow = float(1).sub(smoothstep(0, u.shoalDepth, depth));
    const shoal = mix(float(1), u.shoal, shallow);

    return crest.mul(group).mul(env).mul(shoal).mul(0.5 + r2 * 0.5);
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