import { Canvas } from "@react-three/fiber";
import { WebGPURenderer } from "three/webgpu";
import { Environment, OrbitControls, useContextBridge } from "@react-three/drei";
import { SeaControlsContext } from "../context/sea-control";
import ShoreMesh from "./shore";
import SeaMesh from "./sea";

const Scene = () => {
  const Bridge = useContextBridge(SeaControlsContext); // called OUTSIDE the Canvas

  return (
    <Canvas
      gl={async (props) => {
        const renderer = new WebGPURenderer({ antialias: true, ...props as any });
        await renderer.init();
        return renderer;
      }}
    >
      <Bridge>
        {/* Central Shoreline */}
        <ShoreMesh pos={[0, 0, 0]} />

        {/* Distributed Sea Meshes (Tiled around instead of duplicating identically) */}
        <SeaMesh pos={[0, 0, -50]} />
        <SeaMesh pos={[-50, 0, -50]} />
        <SeaMesh pos={[50, 0, -50]} />

        <OrbitControls />
        <ambientLight intensity={0.4} color="white" />
        <Environment background files={'./sunset.hdr'} />
      </Bridge>
    </Canvas>
  );
};

export default Scene;