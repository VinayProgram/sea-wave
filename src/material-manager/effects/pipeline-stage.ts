// pipeline/stages.ts
import {
  positionLocal, vec2, vec3, float, varying, color as tslColor,
  normalize, transformNormalToView,
} from "three/tsl";
import type { Effect, PipelineContext, TSLNode } from "../types/generic-types";

export interface Stage {
  name: string;
  enabled: (fx: Effect<any>[]) => boolean;
  run: (material: any, fx: Effect<any>[], ctx: PipelineContext) => void;
}

// true world position of this vertex as vec2(x, z). The plane is rotated -90° on X,
// so local y maps to -z.
const worldP = (ctx: PipelineContext) =>
  vec2(positionLocal.x.add(ctx.origin[0]), float(ctx.origin[1]).sub(positionLocal.y));

export const heightStage: Stage = {
  name: "height",
  enabled: (fx) => fx.some((e) => e.height || e.modifyHeight),
  run(material, fx, ctx) {
    const adds = fx.filter((e) => e.height);
    const mods = fx.filter((e) => e.modifyHeight);
      //@ts-ignore
    const waves = (p: TSLNode) => adds.reduce((a, e) => a.add(e.height!(p)), float(0));
    ctx.total = (p) => mods.reduce((h, e) => e.modifyHeight!(h, p), waves(p));

    const p = worldP(ctx);
      //@ts-ignore
    ctx.wavesV = varying(waves(p));
    ctx.heightV = varying(ctx.total(p));
    material.positionNode = vec3(positionLocal.x, positionLocal.y, ctx.heightV);
  },
};

export const normalStage: Stage = {
  name: "normal",
  enabled: (fx) => fx.some((e) => e.height || e.modifyHeight),
  run(material, _fx, ctx) {
    const p = worldP(ctx);
    const e = float(ctx.grid.segmentSize);
    const dx = ctx.total(p.add(vec2(e, 0))).sub(ctx.total(p.sub(vec2(e, 0)))).div(e.mul(2));
    const dz = ctx.total(p.add(vec2(0, e))).sub(ctx.total(p.sub(vec2(0, e)))).div(e.mul(2));
    material.normalNode = transformNormalToView(normalize(vec3(dx.negate(), dz, 1)));
  },
};

export const activityStage: Stage = {
  name: "activity",
  enabled: (fx) => fx.some((e) => e.activity),
  run(_m, fx, ctx) {
    const p = worldP(ctx);
      //@ts-ignore
    ctx.activityV = varying(fx.filter((e) => e.activity).reduce((a, e) => a.add(e.activity!(p)), float(0)));
  },
};

export const bindStage: Stage = {
  name: "bind",
  enabled: (fx) => fx.some((e) => e.bind),
  run(_m, fx, ctx) { fx.forEach((e) => e.bind?.(ctx)); },
};

export const colorStage: Stage = {
  name: "color",
  enabled: (fx) => fx.some((e) => e.color),
  run(material, fx, ctx) {
    let c: TSLNode = tslColor(material.color ?? 0xffffff);
    for (const e of fx) {
      if (e.color) c = e.color({ height: ctx.heightV, activity: ctx.activityV, color: c, ctx });
    }
    material.colorNode = c;
  },
};

export const opacityStage: Stage = {
  name: "opacity",
  enabled: (fx) => fx.some((e) => e.opacity),
  run(material, fx, ctx) {
    let o: TSLNode = float(1);
    for (const e of fx) if (e.opacity) o = e.opacity({ opacity: o, ctx });
    material.opacityNode = o;
    material.transparent = true;
    material.depthWrite = false; // objects under the water stay visible
  },
};