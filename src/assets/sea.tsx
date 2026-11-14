// assets/sea.tsx
import { useMemo } from "react";
import { MeshStandardNodeMaterial } from "three/webgpu";
import * as THREE from "three";
import { makeGrid } from "../material-manager/utils/grid-maker";
import { applyEffects } from "../material-manager/effects/main";
import { noiseEffect } from "../material-manager/effects/noise-effect";
import { heightColorEffect } from "../material-manager/effects/height-color-effect";
import { useSeaControls } from "../context/sea-control";
import { bubbleEffect } from "../material-manager/effects/bubble-effect";
import { rippleEffect } from "../material-manager/effects/ripple-effect";
import { useFrame } from "@react-three/fiber";
import { seaNow } from "../controls/sea-impacts";

const GRID = makeGrid(50, 100);

const SeaMesh = ({ pos }: { pos: [number, number, number] }) => {
  const { uniforms } = useSeaControls();
useFrame((s) => { seaNow.value = s.clock.elapsedTime; });
  const material = useMemo(() => {
    const m = new MeshStandardNodeMaterial({
      roughness: 0.25,
      metalness: 0.3,
      side: THREE.DoubleSide,
    });

    applyEffects(
      m,
      GRID,
      [
        noiseEffect(GRID, uniforms.noise),
        // rippleEffect(GRID, uniforms.ripple),
        heightColorEffect(GRID, uniforms.heightColor),
         bubbleEffect(GRID, uniforms.bubbles),
      ],
      [pos[0], pos[2]]
    );
    return m;
  }, [uniforms]); // built once; the sliders only change uniform values

  return (
    <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={pos}>
      <boxGeometry args={[GRID.size, GRID.size, 5, GRID.segments, GRID.segments]} />
    </mesh>
  );
};

export default SeaMesh;