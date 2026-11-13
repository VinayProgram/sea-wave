import { Canvas } from "@react-three/fiber";
import { WebGPURenderer } from "three/webgpu";
import SeaMesh from "./sea";
import { Environment, OrbitControls, useContextBridge } from "@react-three/drei";
import { SeaControlsContext } from "../context/sea-control";

const Scene = () => {
      const Bridge = useContextBridge(SeaControlsContext); // called OUTSIDE the Canvas

return (
       <Canvas gl={async (props) => {
          const renderer = new WebGPURenderer({ antialias: true, ...props as any });
          await renderer.init();

          return renderer;
        }}>

          <Bridge>
            <SeaMesh pos={[0, 0, 0]} />
            <SeaMesh pos={[49, 0, 0]} />
            <SeaMesh pos={[0, 0, 49]} />
            <SeaMesh pos={[49, 0, 49]} />
            <OrbitControls />
            <ambientLight intensity={0.4} color="white" />
            <Environment background files={'./sunset.hdr'} />
            {/* <hemisphereLight
        intensity={0.8}
        color="#edff4d"
        groundColor="#080B24"
      />

      <directionalLight
        position={[5, 8, 5]}
        intensity={2}
        color="#FFFFFF"
        castShadow
      />

      <spotLight
        position={[0, 5, 5]}
        intensity={25}
        color="#ffc525"
        angle={0.5}
        penumbra={0.8}
        distance={20}
        decay={2}
        castShadow
      />

      <pointLight
        position={[-4, 2, -3]}
        intensity={100}
        color="#d9ff00"
        distance={10}
      />
      */}
          </Bridge>
        </Canvas>
)
}

export default Scene;