import { Environment, OrbitControls, useContextBridge } from "@react-three/drei";
import { Canvas, extend } from "@react-three/fiber";
import { MeshStandardNodeMaterial, WebGPURenderer } from "three/webgpu";
import * as THREE from "three";

import SeaMesh from "./assets/sea";
import { SeaControlsContext, SeaControlsProvider } from "./context/sea-control";
import { SeaPanel } from "./ui/sea-control-ui";
import Scene from "./assets/scene";
extend(THREE as any);

export default function App() {

  return (

    <SeaControlsProvider>
      <SeaPanel />
      <div style={{ width: "100vw", height: "100vh", background: "black" }}>
      <Scene/>
      </div>
    </SeaControlsProvider>
  )
}







