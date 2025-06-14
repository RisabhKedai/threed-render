import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const ThreeDModelViewer = ({
  modelPath,
  secondaryModelPath,
  orientation = "z", // Default orientation - accepts single or comma-separated rotations
  secondaryOrientation = "z",
  width = window.innerWidth,
  height = window.innerHeight,
}) => {
  const containerRef = useRef(null);

  // Function to apply multiple rotations based on orientation string
  const applyOrientation = (mesh, orientation) => {
    // Reset any existing rotations
    mesh.rotation.set(0, 0, 0);
    
    // Split the orientation string by commas and trim whitespace
    const rotations = orientation.split(',').map(rot => rot.trim());
    
    console.log("Applying rotations:", rotations);
    
    // Apply each rotation in sequence
    rotations.forEach(rot => {
      switch (rot.toLowerCase()) {
        case "x":
          // Rotate 90 degrees around Z axis (positive X becomes up)
          mesh.rotateZ(-Math.PI / 2);
          break;
        case "-x":
          // Rotate -90 degrees around Z axis (negative X becomes up)
          mesh.rotateZ(Math.PI / 2);
          break;
        case "y":
          // Y axis rotation - rotate around X axis
          mesh.rotateX(-Math.PI / 2);
          break;
        case "-y":
          // Negative Y axis rotation
          mesh.rotateX(Math.PI / 2);
          break;
        case "z":
          // Z axis rotation - rotate around Y axis
          mesh.rotateY(-Math.PI / 2);
          break;
        case "-z":
          // Negative Z axis rotation
          mesh.rotateY(Math.PI / 2);
          break;
        default:
          console.warn(`Unknown rotation: ${rot}. Skipping.`);
          break;
      }
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0); // Light gray background
    scene.add(new THREE.AxesHelper(30));

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 2000);
    camera.position.set(0, 9, 1500);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    THREE.ColorManagement.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    // Add some lighting for better surface visualization
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    let loadedGeometries = [];
    const plyLoader = new PLYLoader();

    // Function to create mesh from geometry
    const createMeshFromGeometry = (geometry, isSecondary = false) => {
        loadedGeometries.push(geometry);


        // Check if geometry has faces (index buffer) for mesh rendering
        const hasFaces = true;
        // geometry.index !== null && geometry.index.count > 0;
        const hasColor = geometry.hasAttribute("color");

        console.log("Has faces (mesh data):", hasFaces);
        console.log("Has vertex colors:", hasColor);
        console.log("Geometry attributes:", Object.keys(geometry.attributes));
        console.log("Index count:", geometry.index ? geometry.index.count : 0);
        console.log("Applied orientation:", orientation);
        
        // Debug color attribute
        if (geometry.hasAttribute("color")) {
          const colorAttr = geometry.getAttribute("color");
          console.log("Color attribute details:", {
            itemSize: colorAttr.itemSize,
            count: colorAttr.count,
            normalized: colorAttr.normalized,
            array: colorAttr.array.slice(0, 12) // First 4 vertices RGB values
          });
        }

        let material;
        let mesh;
        if (hasFaces) {
          // This is a mesh model - render as solid surface
          console.log("Rendering as MESH (solid surface)");

          // Compute normals for proper lighting if they don't exist
          if (!geometry.hasAttribute("normal")) {
            geometry.computeVertexNormals();
          }

          if (hasColor) {
            // Normalize color values if they're in 0-255 range
            const colorAttribute = geometry.getAttribute("color");
            if (colorAttribute && !colorAttribute.normalized) {
              // Check if colors are in 0-255 range (typical for PLY files)
              const colorArray = colorAttribute.array;
              let maxValue = 0;
              for (let i = 0; i < colorArray.length; i++) {
                maxValue = Math.max(maxValue, colorArray[i]);
              }
              
              // If max value is > 1, assume it's in 0-255 range and normalize
              if (maxValue > 1) {
                console.log("Normalizing color values from 0-255 to 0-1 range");
                for (let i = 0; i < colorArray.length; i++) {
                  colorArray[i] /= 255;
                }
                colorAttribute.needsUpdate = true;
              }
            }

            material = new THREE.MeshStandardMaterial({
              vertexColors: true,
              metalness: 0.0, // Reduce metalness to show colors better
              roughness: 1.0, // Increase roughness to show colors better
              // Remove any base color that might interfere
              color: 0xffffff
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

            material = new THREE.MeshStandardMaterial({
              map: texture,
              metalness: 0.1,
              roughness: 0.8,
            });
          }

          mesh = new THREE.Mesh(geometry, material);
        } else {
          // This is a point cloud - render as points
          console.log("Rendering as POINT CLOUD");

          // Handle color normalization for point clouds too
          if (hasColor) {
            const colorAttribute = geometry.getAttribute("color");
            if (colorAttribute && !colorAttribute.normalized) {
              const colorArray = colorAttribute.array;
              let maxValue = 0;
              for (let i = 0; i < colorArray.length; i++) {
                maxValue = Math.max(maxValue, colorArray[i]);
              }
              
              if (maxValue > 1) {
                console.log("Normalizing point cloud color values from 0-255 to 0-1 range");
                for (let i = 0; i < colorArray.length; i++) {
                  colorArray[i] /= 255;
                }
                colorAttribute.needsUpdate = true;
              }
            }
          }

          material = new THREE.PointsMaterial({
            size: 2, // Slightly larger points for better visibility
            vertexColors: hasColor,
            color: hasColor ? 0xffffff : 0x808080, // White base color when using vertex colors
          });

          mesh = new THREE.Points(geometry, material);
        }

        // Apply the specified orientation instead of hardcoded rotations
        applyOrientation(mesh, orientation);

        scene.add(mesh);
        
        // Create separate controls for secondary model
        if (isSecondary) {
          const meshControls = new OrbitControls(camera, renderer.domElement);
          meshControls.target.copy(mesh.position);
          return meshControls;
        }
        return null;
    };

    // Load primary (fixed) model
    plyLoader.load(
      modelPath,
      (geometry) => {
        createMeshFromGeometry(geometry, false);
      },
      (xhr) => console.log("Primary model: " + (xhr.loaded / xhr.total) * 100 + "% loaded"),
      (error) => console.error("Error loading primary model:", error)
    );

    // Load secondary (orbitable) model
    let secondaryControls;
    if (secondaryModelPath) {
      plyLoader.load(
        secondaryModelPath,
        (geometry) => {
          secondaryControls = createMeshFromGeometry(geometry, true);
        },
        (xhr) => console.log("Secondary model: " + (xhr.loaded / xhr.total) * 100 + "% loaded"),
        (error) => console.error("Error loading secondary model:", error)
      );
    }

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
      if (secondaryControls) secondaryControls.update();
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      loadedGeometries.forEach(geometry => geometry?.dispose());
    };
  }, [modelPath, orientation, width, height]);

  return <div ref={containerRef} style={{ width, height }} />;
};

export default ThreeDModelViewer;