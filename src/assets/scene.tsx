import { Canvas } from "@react-three/fiber";
import { WebGPURenderer } from "three/webgpu";
import SeaMesh from "./sea";
import { Environment, OrbitControls, useContextBridge } from "@react-three/drei";
import { SeaControlsContext } from "../context/sea-control";
import ShoreMesh from "./shore";
import { GRID } from "../material-manager/utils/grid-maker";

const Scene = () => {
      const Bridge = useContextBridge(SeaControlsContext); // called OUTSIDE the Canvas

return (
       <Canvas gl={async (props) => {
          const renderer = new WebGPURenderer({ antialias: true, ...props as any });
          await renderer.init();

          return renderer;
        }}>

          <Bridge>
           
           <ShoreMesh pos={[GRID.size - 1, 0, 0]} />
            <SeaMesh pos={[GRID.size - 1, 0, -GRID.size]} />
    
            <OrbitControls />
            <ambientLight intensity={0.4} color="white" />
            <Environment background files={'./sunset.hdr'} />
        
          </Bridge>
        </Canvas>
)
}

export default Scene;