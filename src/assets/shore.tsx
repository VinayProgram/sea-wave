// assets/shore.tsx
import { useMemo } from "react";
import { MeshStandardNodeMaterial } from "three/webgpu";
import { makeGrid } from "../material-manager/utils/grid-maker";
import { noiseEffect } from "../material-manager/effects/noise-effect";
import { heightColorEffect } from "../material-manager/effects/height-color-effect";
import { shoreEffect } from "../material-manager/effects/shore-effect";
import { bubbleEffect } from "../material-manager/effects/bubble-effect";
import { useSeaControls } from "../context/sea-control";
import { applyEffects } from "../material-manager/effects/main";

// 200 segments over 50 units = 0.25 per segment, so dunes and the waves resolve well
const GRID = makeGrid(50, 200);

type Props = { pos: [number, number, number] };

export default function ShoreMesh({ pos }: Props) {
  const { uniforms } = useSeaControls();

  const material = useMemo(() => {
    const m = new MeshStandardNodeMaterial({ roughness: 0.4, metalness: 0.05 });

    applyEffects(
      m,
      GRID,
      [
        noiseEffect(GRID, uniforms.noise),
        heightColorEffect(GRID, uniforms.heightColor), // water color
        shoreEffect(GRID, uniforms.shore),             // after water color, before bubbles
        bubbleEffect(GRID, uniforms.bubbles),
      ],
      [pos[0], pos[2]] // tile origin in world x, z
    );

    return m;
  }, [uniforms]); // built once, since the sliders only change uniform values

  return (
    <mesh
      material={material}
      position={pos}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={1} // draw after opaque objects, since this material is transparent
    >
      <planeGeometry args={[GRID.size, GRID.size, GRID.segments, GRID.segments]} />
    </mesh>
  );
}