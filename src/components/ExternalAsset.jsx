// External model file. This loads the lion toy so the project includes a real GLTF asset.
import { Center, useGLTF } from "@react-three/drei";
import { useEffect } from "react";

const modelPath = "/models/stuffed_lion_toy_low_poly/scene.gltf";

// Load the toy model and let it cast/receive shadows.
function LoadedModel() {
  const { scene } = useGLTF(modelPath);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <Center position={[2.1, 0.1, 0.2]} scale={1.6}>
      <primitive object={scene} />
    </Center>
  );
}

// Only show the toy when the pet action needs it.
function ExternalAsset({ visible }) {
  if (!visible) {
    return null;
  }

  return <LoadedModel />;
}

useGLTF.preload(modelPath);

export default ExternalAsset;
