import React, { Suspense, useEffect, useState, useRef, useMemo } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  Center,
  Stage,
} from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { FiX, FiLoader, FiMaximize, FiRotateCw, FiMove } from "react-icons/fi";
import { FaCube } from "react-icons/fa";
import * as THREE from 'three';

// Global model cache
const modelCache = new Map();

function GLTFModel({ url, onLoad }) {
    const gltf = useLoader(GLTFLoader, url);
  const modelRef = useRef();

  useEffect(() => {
    if (gltf) {
      modelRef.current = gltf;
      modelCache.set(url, gltf);
      onLoad?.();
    }
    return () => {
      // Don't dispose if it's in cache and being used elsewhere
      if (modelRef.current && !modelCache.has(url)) {
        modelRef.current.scene.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, [gltf, onLoad, url]);

  return <primitive object={gltf.scene.clone()} />;
}

function FBXModel({ url, onLoad }) {
  const fbx = useLoader(FBXLoader, url);
  const modelRef = useRef();

  useEffect(() => {
    if (fbx) {
      modelRef.current = fbx;
      modelCache.set(url, fbx);
      onLoad?.();
    }
    return () => {
      if (modelRef.current && !modelCache.has(url)) {
        modelRef.current.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, [fbx, onLoad, url]);

  return <primitive object={fbx.clone()} />;
}

function OBJModel({ url, onLoad }) {
  const obj = useLoader(OBJLoader, url);
  const modelRef = useRef();

  useEffect(() => {
    if (obj) {
      modelRef.current = obj;
      modelCache.set(url, obj);
      onLoad?.();
    }
    return () => {
      if (modelRef.current && !modelCache.has(url)) {
        modelRef.current.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, [obj, onLoad, url]);

  return <primitive object={obj.clone()} />;
}

function Model({ url, type, onLoad }) {
  const [error, setError] = useState(null);

  if (!url) {
    console.error("No URL provided for model loading.");
    return null;
  }

  // Check if model is in cache
  const cachedModel = modelCache.get(url);
  if (cachedModel) {
    onLoad?.();
  }

  try {
    return (
      <Center scale={2}>
        <Suspense fallback={
          <Html center>
            <div className="flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#646cff] border-t-transparent rounded-full animate-spin" />
            </div>
          </Html>
        }>
          {error ? (
            <Html center>
              <p className="text-red-500">{error}</p>
            </Html>
          ) : type === "glb" || type === "gltf" ? (
            <GLTFModel url={url} onLoad={onLoad} />
          ) : type === "fbx" ? (
            <FBXModel url={url} onLoad={onLoad} />
          ) : type === "obj" ? (
            <OBJModel url={url} onLoad={onLoad} />
          ) : (
            <Html center>
              <p className="text-red-500">Unsupported model type: {type}</p>
            </Html>
          )}
        </Suspense>
      </Center>
    );
  } catch (error) {
    console.error('Error loading model:', error);
    setError('Error loading model');
    onLoad?.();
    return (
      <Html center>
        <p className="text-red-500">Error loading model</p>
      </Html>
    );
  }
}

// Add a camera setup component
function CameraSetup({ isThumbnail }) {
  const { camera } = useThree();
  
  useEffect(() => {
    if (isThumbnail) {
      camera.position.set(400, 400, 400);
      camera.fov = 20;
    } else {
      camera.position.set(400, 400, 400);
      camera.fov = 45;
    }
    camera.updateProjectionMatrix();
  }, [camera, isThumbnail]);
  
  return null;
}

function ThreeDViewer({ 
  asset, 
  onClose, 
  isThumbnail = false, 
  className = "",
  showControls = true 
}) {
  const [loading, setLoading] = useState(!modelCache.has(asset?.file_url));
  const { file_url: url, type, name } = asset;
  const canvasRef = useRef();

  // Memoize the Canvas component to prevent unnecessary remounts
  const canvasElement = useMemo(() => (
    <Canvas
      ref={canvasRef}
      camera={{ 
        position: [400, 400, 400],
        fov: isThumbnail ? 25 : 45,
        near: 0.1,
        far: 10000
      }}
      shadows
      gl={{
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      }}
    >
      <CameraSetup isThumbnail={isThumbnail} />
      <color attach="background" args={["#242424"]} />
      <ambientLight intensity={0.7} />
      <directionalLight intensity={1} position={[5, 5, 5]} castShadow />
      <Stage 
        adjustCamera={false} 
        intensity={0.5}
        environment="city"
        preset="rembrandt"
      >
        <Model url={url} type={type} onLoad={() => setLoading(false)} />
      </Stage>
      <OrbitControls
        enableZoom={!isThumbnail}
        enablePan={!isThumbnail}
        autoRotate={isThumbnail}
        autoRotateSpeed={isThumbnail ? 2 : 1}
        maxPolarAngle={Math.PI / (isThumbnail ? 2 : 1.5)}
        minPolarAngle={0}
        target={[0, 0, 0]}
        maxDistance={800}
        minDistance={100}
        makeDefault={!isThumbnail}
      />
    </Canvas>
  ), [url, type, isThumbnail]);

  useEffect(() => {
    if (!isThumbnail) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "auto";
      };
    }
  }, [isThumbnail]);

  // Cleanup WebGL context when component unmounts
  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        const gl = canvasRef.current.getContext('webgl2') || canvasRef.current.getContext('webgl');
        if (gl) {
          const ext = gl.getExtension('WEBGL_lose_context');
          if (ext && !modelCache.has(url)) {
            ext.loseContext();
          }
        }
      }
    };
  }, [url]);

  // Thumbnail view
  if (isThumbnail) {
    return (
      <div className={`w-full h-32 bg-[#242424] rounded-t-lg overflow-hidden relative ${className}`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#242424] z-10">
            <div className="w-6 h-6 border-2 border-[#646cff] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {canvasElement}
      </div>
    );
  }

  // Full view modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-0 m-0 w-screen h-screen">
      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden w-full max-w-4xl mx-4 flex flex-col border border-[#333333]">
        <div className="flex items-center justify-between p-4 border-b border-[#333333]">
          <div className="flex items-center">
            <FaCube className="w-5 h-5 text-[#646cff] mr-2" />
            <h3 className="text-white font-medium truncate">
              {name || "Model Viewer"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-[#333333] hover:bg-[#444444] rounded-full w-8 h-8 flex items-center justify-center focus:outline-none transition-colors p-2"
          >
            <FiX size={20} className="w-5 h-5" />
          </button>
        </div>

        <div className="relative w-full h-[75vh]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] z-10">
              <div className="flex flex-col items-center">
                <FiLoader className="w-12 h-12 text-[#646cff] animate-spin" />
                <p className="mt-4 text-gray-300">Loading model...</p>
              </div>
            </div>
          )}
          {canvasElement}

          {showControls && (
            <div className="absolute bottom-4 left-4 text-xs text-gray-400 bg-[#1a1a1a] bg-opacity-70 px-3 py-2 rounded-lg flex items-center gap-4">
              <span className="flex items-center">
                <FiRotateCw className="mr-1.5 w-4 h-4" />
                Drag to rotate
              </span>
              <span className="flex items-center">
                <FiMaximize className="mr-1.5 w-4 h-4" />
                Scroll to zoom
              </span>
              <span className="flex items-center">
                <FiMove className="mr-1.5 w-4 h-4" />
                Shift+Drag to pan
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ThreeDViewer;

