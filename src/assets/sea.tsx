// assets/sea.tsx
import { useMemo } from "react";
import { MeshPhysicalNodeMaterial } from "three/webgpu";
import * as THREE from "three";
import { applyEffects } from "../material-manager/effects/main";
import { noiseEffect } from "../material-manager/effects/noise-effect";
import { heightColorEffect } from "../material-manager/effects/height-color-effect";
import { useSeaControls } from "../context/sea-control";
import { bubbleEffect } from "../material-manager/effects/bubble-effect";
import { useFrame } from "@react-three/fiber";
import { seaNow } from "../controls/sea-impacts";
import { shoreEffect } from "../material-manager/effects/shore-effect";
import { GRID } from "../material-manager/utils/grid-maker";


const SeaMesh = ({ pos }: { pos: [number, number, number] }) => {
  const { uniforms } = useSeaControls();
  useFrame((s) => { seaNow.value = s.clock.elapsedTime; });
  const material = useMemo(() => {
    const m = new MeshPhysicalNodeMaterial({
      roughness: 0.25,
      metalness: 0.3,
      side: THREE.DoubleSide,
    });
m.metalness = 0.0;       // water is a dielectric
m.roughness = 0.05;      // 0.02–0.12; nearly smooth
m.transparent = false;   // fake depth through color instead
m.opacity = 1.0;
// MeshPhysicalNodeMaterial extras:
m.ior = 1.333;
m.specularIntensity = 1.0;
m.clearcoat = 0.0;       // clearcoat makes it look like glossy plastic
    applyEffects(
      m,
      GRID,
      [
        noiseEffect(GRID, uniforms.noise),
        heightColorEffect(GRID, uniforms.heightColor), // water color
        shoreEffect(GRID, uniforms.shore),             // after water color, before bubbles
        bubbleEffect(GRID, uniforms.bubbles),
      ],
      [pos[0], pos[2]]
    );
    return m;
  }, [uniforms]); // built once; the sliders only change uniform values

  return (
    <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={pos}>
      <planeGeometry args={[GRID.size, GRID.size, GRID.segments, GRID.segments]} />
    </mesh>
  );
};

export default SeaMesh;