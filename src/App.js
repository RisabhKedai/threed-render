import React from "react";
import ThreeDModelViewer from "./3DModelViewer";

function App() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>3D Model Viewer</h2>
      <ThreeDModelViewer
        modelPath="/models/LivingRoom.ply"
        secondaryModelPath="/models/Patchwork chair.ply"
        orientation="x,z"
        secondaryOrientation="x,y,-z"
        width={800}
        height={600}
      />
    </div>
  );
}

export default App;
