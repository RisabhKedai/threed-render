import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const DualModelViewer = ({
  roomModelPath, // Path to LivingRoom.ply
  chairModelPath, // Path to PatchWork chair.ply
  roomOrientation = "z", // Orientation for the room
  chairOrientation = "z", // Orientation for the chair
  roomScale = 1, // Scale factor for the room (can be number or {x, y, z} object)
  chairScale = 1, // Scale factor for the chair (can be number or {x, y, z} object)
  backgroundColor = 0xf0f0f0, // Background color (default light gray)
  width = window.innerWidth,
  height = window.innerHeight,
}) => {
  const containerRef = useRef(null);
  const chairGroupRef = useRef(null); // Reference to chair group for orbital control

  // Function to apply scale to mesh
  const applyScale = (mesh, scale) => {
    if (typeof scale === "number") {
      // Uniform scaling
      mesh.scale.set(scale, scale, scale);
      console.log(`Applied uniform scale: ${scale}`);
    } else if (typeof scale === "object" && scale !== null) {
      // Non-uniform scaling with x, y, z properties
      const scaleX = scale.x || 1;
      const scaleY = scale.y || 1;
      const scaleZ = scale.z || 1;
      mesh.scale.set(scaleX, scaleY, scaleZ);
      console.log(
        `Applied non-uniform scale: x=${scaleX}, y=${scaleY}, z=${scaleZ}`
      );
    } else {
      console.warn("Invalid scale value, using default scale of 1");
      mesh.scale.set(1, 1, 1);
    }
  };

  // Function to apply multiple rotations based on orientation string
  const applyOrientation = (mesh, orientation) => {
    // Reset any existing rotations
    mesh.rotation.set(0, 0, 0);

    // Split the orientation string by commas and trim whitespace
    const rotations = orientation.split(",").map((rot) => rot.trim());

    console.log("Applying rotations:", rotations);

    // Apply each rotation in sequence
    rotations.forEach((rot) => {
      switch (rot.toLowerCase()) {
        case "x":
          mesh.rotateZ(-Math.PI / 2);
          break;
        case "-x":
          mesh.rotateZ(Math.PI / 2);
          break;
        case "y":
          mesh.rotateX(-Math.PI / 2);
          break;
        case "-y":
          mesh.rotateX(Math.PI / 2);
          break;
        case "z":
          mesh.rotateY(-Math.PI / 2);
          break;
        case "-z":
          mesh.rotateY(Math.PI / 2);
          break;
        default:
          console.warn(`Unknown rotation: ${rot}. Skipping.`);
          break;
      }
    });
  };

  // Function to create material based on geometry properties
  const createMaterial = (geometry, modelPath, isRoom = false) => {
    const hasColor = geometry.hasAttribute("color");
    // Better detection for mesh vs point cloud
    const hasFaces = geometry.index !== null && geometry.index.count > 0;
    const hasNormals = geometry.hasAttribute("normal");

    console.log(`Model ${modelPath}:`, {
      hasIndex: geometry.index !== null,
      indexCount: geometry.index ? geometry.index.count : 0,
      hasNormals: hasNormals,
      hasColor: hasColor,
      vertexCount: geometry.attributes.position.count,
    });

    // Handle color normalization
    if (hasColor) {
      const colorAttribute = geometry.getAttribute("color");
      if (colorAttribute && !colorAttribute.normalized) {
        const colorArray = colorAttribute.array;
        let maxValue = 0;
        for (let i = 0; i < colorArray.length; i++) {
          maxValue = Math.max(maxValue, colorArray[i]);
        }

        if (maxValue > 1) {
          console.log("Normalizing color values from 0-255 to 0-1 range");
          for (let i = 0; i < colorArray.length; i++) {
            colorArray[i] /= 255;
          }
          colorAttribute.needsUpdate = true;
        }
      }
    }

    if (hasFaces) {
      // Mesh material
      if (hasColor) {
        return new THREE.MeshStandardMaterial({
          vertexColors: true,
          metalness: isRoom ? 0.2 : 0.0,
          roughness: isRoom ? 0.8 : 1.0,
          color: 0xffffff,
        });
      } else {
        // Try to load texture
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(
          modelPath.replace(".ply", ".jpg"),
          (tex) => {
            console.log("Texture loaded successfully");
            tex.flipY = false;
          },
          undefined,
          (error) => {
            console.warn("Could not load texture:", error);
          }
        );

        return new THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.1,
          roughness: 0.8,
        });
      }
    } else {
      // Point cloud material
      return new THREE.PointsMaterial({
        size: 2,
        vertexColors: hasColor,
        color: hasColor ? 0x808080 : 0x808080,
      });
    }
  };

  // Function to create mesh from geometry
  const createMesh = (geometry, material, forceMesh = true) => {
    // Force mesh rendering unless explicitly creating point cloud
    const hasFaces = geometry.index !== null && geometry.index.count > 0;

    if (forceMesh || hasFaces) {
      // Compute normals for proper lighting if they don't exist
      if (!geometry.hasAttribute("normal")) {
        console.log("Computing vertex normals...");
        geometry.computeVertexNormals();
      }
      return new THREE.Mesh(geometry, material);
    } else {
      return new THREE.Points(geometry, material);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    scene.add(new THREE.AxesHelper(30));

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 2000);
    camera.position.set(0, 9, 1500);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    THREE.ColorManagement.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth camera controls
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    // Set control target to center of scene, not following any object
    controls.target.set(0, 0, 0);
    controls.update();

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create a group for the chair that can be controlled independently
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, 0); // Center position
    scene.add(chairGroup);
    chairGroupRef.current = chairGroup;

    const plyLoader = new PLYLoader();
    let roomGeometry = null;
    let chairGeometry = null;

    // Load the room model (fixed)
    plyLoader.load(
      roomModelPath,
      (geometry) => {
        roomGeometry = geometry;
        console.log("Room model loaded");

        const material = createMaterial(geometry, roomModelPath, true);
        const mesh = createMesh(geometry, material, true); // Force mesh rendering

        // Apply orientation to room
        applyOrientation(mesh, roomOrientation);

        // Apply scale to room
        applyScale(mesh, roomScale);

        scene.add(mesh);
      },
      (xhr) => {
        // console.log("Room: " + (xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("Error loading room model:", error);
      }
    );

    // Load the chair model (controllable)
    plyLoader.load(
      chairModelPath,
      (geometry) => {
        chairGeometry = geometry;
        console.log("Chair model loaded");

        const material = createMaterial(geometry, chairModelPath, false);
        const mesh = createMesh(geometry, material, true); // Force mesh rendering

        // Apply orientation to chair
        applyOrientation(mesh, chairOrientation);

        // Apply scale to chair
        applyScale(mesh, chairScale);

        // Add chair to the controllable group
        chairGroup.add(mesh);
      },
      (xhr) => {
        // console.log("Chair: " + (xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("Error loading chair model:", error);
      }
    );

    // Animation loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Update controls with damping
      controls.update();

      //   Optional: Add automatic rotation to the chair only
      //   if (chairGroupRef.current) {
      //     chairGroupRef.current.rotation.y += 0.005;
      //   }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current && renderer.domElement.parentNode) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      roomGeometry?.dispose();
      chairGeometry?.dispose();
    };
  }, [
    roomModelPath,
    chairModelPath,
    roomOrientation,
    chairOrientation,
    roomScale,
    chairScale,
    backgroundColor,
    width,
    height,
  ]);

  return (
    <div ref={containerRef} style={{ width, height }}>
      {/* Optional: Add controls UI */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "10px",
          borderRadius: "5px",
          fontSize: "12px",
        }}
      >
        <div>Camera Controls: Mouse to orbit, scroll to zoom</div>
        <div>Room: Fixed with custom orientation and scale</div>
        <div>Chair: Centered, controllable with custom scale</div>
      </div>
    </div>
  );
};

// Example usage component
const RoomChairViewer = () => {
  return (
    <DualModelViewer
      roomModelPath="./models/LivingRoom.ply"
      chairModelPath="./models/PatchWorkChair.ply"
      roomOrientation="z" // Orientation for the room
      chairOrientation="z" // Orientation for the chair
      roomScale={0.8} // Scale down the room to 80%
      chairScale={1.2} // Scale up the chair to 120%
      backgroundColor={0x000000} // Black background
      width={800}
      height={600}
    />
  );
};

export default DualModelViewer;
