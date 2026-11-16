// assets/shore.tsx
import { useMemo } from "react";
import { DoubleSide, MeshStandardNodeMaterial } from "three/webgpu";
import { makeGrid } from "../material-manager/utils/grid-maker";
import { noiseEffect } from "../material-manager/effects/noise-effect";
import { heightColorEffect } from "../material-manager/effects/height-color-effect";
import { shoreEffect } from "../material-manager/effects/shore-effect";
import { bubbleEffect } from "../material-manager/effects/bubble-effect";
import { useSeaControls } from "../context/sea-control";
import { applyEffects } from "../material-manager/effects/main";
import { useFrame } from "@react-three/fiber";

// 200 segments over 50 units = 0.25 per segment, so dunes and the waves resolve well
const GRID = makeGrid(50, 200);

type Props = { pos: [number, number, number] };

export default function ShoreMesh({ pos }: Props) {
  const { uniforms ,setValue} = useSeaControls();

  const material = useMemo(() => {
    const m = new MeshStandardNodeMaterial({ roughness: 0.4, metalness: 0.05,side:DoubleSide });

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

  
useFrame(({ clock }) => {
  const t = clock.getElapsedTime();
  
  // 1. Smoothly oscillate sea level
  const waveHeight = Math.sin(t * 0.8) * 0.4;
  
  // 2. Smoothly oscillate coast amplitude between 1.0 and 2.0 (centered around 1.5)
  const coastAmp = 1.5 + Math.sin(t * 0.3) * 0.5; 
  
  setValue("shore", "seaLevel", waveHeight);
  setValue("shore", "coastAmp", coastAmp);
});
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