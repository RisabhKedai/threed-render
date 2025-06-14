import React from "react";
import ThreeDModelViewer from "./3DModelViewer";
import DualModelViewer from "./DoubleModelViewer";

function App() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>3D Model Viewer</h2>
      {/* <ThreeDModelViewer
        // modelPath="/models/Patchwork%20Chair.ply"
        // orientation="x,y,-z"
        // modelPath="./models/RisabhKedia.ply"
        modelPath="./models/DownSized.ply"
        orientation=""
        // scenePath="/models/Scene.ply"
        width={800}
        height={600}
        scale={100000}
      /> */}

      <DualModelViewer
        roomModelPath="./models/Background.ply"
        chairModelPath="./models/ModelX7.ply"
        roomOrientation="x,y,z" // Orientation for the room
        // chairOrientation="x,y,-z" // Only affects the chair
        width={800}
        height={600}
        roomScale={100000} // Scale down the room to 80%
        chairScale={100000} // Scale up the chair to 120%
        backgroundColor={0x000000} // Black background
        chairPosition={{ x: 10, y: 50, z: 20 }}
      />
    </div>
  );
}

export default App;
