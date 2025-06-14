import React from "react";
import ThreeDModelViewer from "./3DModelViewer";
import DualModelViewer from "./DoubleModelViewer";

function App() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>3D Model Viewer</h2>
      <ThreeDModelViewer
        // modelPath="/models/Patchwork%20Chair.ply"
        // orientation="x,y,-z"
        // modelPath="./models/RisabhKedia.ply"
        modelPath="./models/DownSized.ply"
        orientation=""
        // scenePath="/models/Scene.ply"
        width={800}
        height={600}
        scale={100000}
      />

      {/* <DualModelViewer
        roomModelPath="./models/Li3vingRoom.ply"
        chairModelPath="./models/DownSized.ply"
        roomOrientation="x,y,z" // Orientation for the room
        chairOrientation="x,y,-z" // Only affects the chair
        width={800}
        height={600}
        roomScale={5.8} // Scale down the room to 80%
        chairScale={0.5} // Scale up the chair to 120%
        backgroundColor={0x000000} // Black background
      /> */}
    </div>
  );
}

export default App;
