import { useTexture } from "@react-three/drei";
import { RepeatWrapping } from "three";

function Floor() {
  const rugTexture = useTexture("/textures/rug.svg");

  rugTexture.wrapS = RepeatWrapping;
  rugTexture.wrapT = RepeatWrapping;
  rugTexture.repeat.set(3, 3);

  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
      <planeGeometry args={[28, 28]} />
      <meshStandardMaterial color="#fff6ec" map={rugTexture} />
    </mesh>
  );
}

export default Floor;
