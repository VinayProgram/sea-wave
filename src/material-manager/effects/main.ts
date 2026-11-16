// pipeline/main.ts
import type { Effect, GridContext, PipelineContext } from "../types/generic-types";
import { float } from "three/tsl";
import {
  heightStage, normalStage, activityStage, bindStage, colorStage, opacityStage, type Stage,
} from "./pipeline-stage";

// the switch: order matters, and each stage can be turned off by name
export const stageRegistry: Stage[] = [
  heightStage, normalStage, activityStage, bindStage, colorStage, opacityStage,
];
export const stageEnabled: Record<string, boolean> = Object.fromEntries(
  stageRegistry.map((s) => [s.name, true])
);

export function applyEffects(
  material: any,
  grid: GridContext,
  effects: Effect<any>[],
  origin: [number, number] = [0, 0]
) {
  const ctx = {
    grid, origin, shared: {},
    wavesV: float(0), heightV: float(0), activityV: float(0),
  } as unknown as PipelineContext;

  for (const stage of stageRegistry) {
    if (stageEnabled[stage.name] && stage.enabled(effects)) stage.run(material, effects, ctx);
  }
  return Object.fromEntries(effects.map((e) => [e.name, e.uniforms]));
}