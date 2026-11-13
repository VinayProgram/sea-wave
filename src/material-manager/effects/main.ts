// effects/applyEffects.ts

//@ts-nocheck
import { positionLocal, vec2, vec3, float, varying, color, normalize, transformNormalToView } from "three/tsl";
import type { Effect, GridContext, TSLNode } from "../types/generic-types";

export function applyEffects(
  material: any,
  grid: GridContext,
  effects: Effect<any>[],
  origin: [number, number] = [0, 0] // tile's world x, z
) {
  // ---- vertex stage: sum all height contributions ----
  const heightFns = effects.map((e) => e.height).filter(Boolean) as ((p: TSLNode) => TSLNode)[];
  let heightVarying: TSLNode = float(0);

  if (heightFns.length) {
    const height = (p: TSLNode) => heightFns.reduce((acc, fn) => acc.add(fn(p)), float(0));

    // The mesh is rotated -90° on X, so local y maps to -world z.
    // Using (y - originZ) keeps the mapping consistent across tiles.
    const p = vec2(
      positionLocal.x.add(origin[0]),
      positionLocal.y.sub(origin[1])
    );
    const h = height(p);

    material.positionNode = vec3(positionLocal.x, positionLocal.y, positionLocal.z.add(h));

    const e = float(grid.segmentSize);
    const dhdx = height(p.add(vec2(e, 0))).sub(height(p.sub(vec2(e, 0)))).div(e.mul(2));
    const dhdy = height(p.add(vec2(0, e))).sub(height(p.sub(vec2(0, e)))).div(e.mul(2));
    material.normalNode = transformNormalToView(normalize(vec3(dhdx.negate(), dhdy.negate(), 1)));

    heightVarying = varying(h);
  }

  // ---- fragment stage: chain color effects ----
  const colorFns = effects.map((e) => e.color).filter(Boolean) as ((c: TSLNode) => TSLNode)[];

  if (colorFns.length) {
    let c: TSLNode = color(material.color ?? 0xffffff);
    for (const fn of colorFns) c = fn({ height: heightVarying, color: c });
    material.colorNode = c;
  }

  // expose uniforms by effect name for runtime tweaking
  return Object.fromEntries(effects.map((e) => [e.name, e.uniforms]));
}