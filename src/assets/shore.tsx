// assets/shore.tsx
import { useMemo } from "react";
import { MeshPhysicalNodeMaterial } from "three/webgpu";
import { noiseEffect } from "../material-manager/effects/noise-effect";
import { heightColorEffect } from "../material-manager/effects/height-color-effect";
import { shoreEffect } from "../material-manager/effects/shore-effect";
import { bubbleEffect } from "../material-manager/effects/bubble-effect";
import { useSeaControls } from "../context/sea-control";
import { applyEffects } from "../material-manager/effects/main";
import { useFrame } from "@react-three/fiber";
import { GRID } from "../material-manager/utils/grid-maker";
import * as THREE from "three";
import { shoreWaveEffect } from "../material-manager/effects/shore-wave-effect";
// 200 segments over 50 units = 0.25 per segment, so dunes and the waves resolve well

type Props = { pos: [number, number, number] };

export default function ShoreMesh({ pos }: Props) {
  const { uniforms, setValue } = useSeaControls();

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
    m.clearcoat = 0.0;
    applyEffects(
      m,
      GRID,
      [
        noiseEffect(GRID, uniforms.noise),
        heightColorEffect(GRID, uniforms.heightColor), // water color
        shoreEffect(GRID, uniforms.shore),             // after water color, before bubbles
        bubbleEffect(GRID, uniforms.bubbles),
        shoreWaveEffect(GRID, uniforms.shore), // custom effect for shore wave animation
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
    >
      <planeGeometry args={[GRID.size, GRID.size, GRID.segments, GRID.segments]} />
    </mesh>
  );
}