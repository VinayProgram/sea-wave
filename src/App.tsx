import { extend } from "@react-three/fiber";
import * as THREE from "three";

import { SeaControlsProvider } from "./context/sea-control";
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







