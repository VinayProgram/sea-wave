// effects/rippleEffect.ts
import { time, vec2, float, uniform, fract, floor, sin, exp, clamp, smoothstep, length } from "three/tsl";
import type { Effect, GridContext, TSLNode } from "../types/generic-types";

const hash = (n: TSLNode) => fract(sin(n.mul(12.9898)).mul(43758.5453));

export function rippleEffect(grid: GridContext) {
  const uniforms = {
    impactedRows: uniform(6),
    speed: uniform(6),
    period: uniform(4),
    maxHeight: uniform(2.5),
    distDecay: uniform(0.04),
  };
  const { impactedRows, speed, period, maxHeight, distDecay } = uniforms;

  const width = impactedRows.mul(grid.segmentSize);
  const duration = period.mul(2);

  const pulse = (p: TSLNode, offset: number) => {
    const cycleT = time.div(period);
    const cycle = floor(cycleT).sub(offset);
    const t = cycleT.sub(cycle).mul(period);
    const life = clamp(t.div(duration), 0, 1);

    const src = vec2(
      hash(cycle).sub(0.5).mul(grid.size * 0.6),
      hash(cycle.add(7.3)).sub(0.5).mul(grid.size * 0.6)
    );
    const strength = hash(cycle.add(3.1)).mul(0.6).add(0.4).mul(maxHeight);

    const d = length(p.sub(src));
    const u = d.sub(t.mul(speed)).abs().div(width);
    const bump = float(1).sub(smoothstep(0, 1, u));

    return bump
      .mul(strength)
      .mul(smoothstep(0, 0.05, life))
      .mul(float(1).sub(life))
      .mul(exp(d.mul(distDecay).negate()));
  };

  const effect: Effect<typeof uniforms> = {
    name: "ripple",
    uniforms,
    height: (p) => pulse(p, 0).add(pulse(p, 1)),
  };
  return effect;
}