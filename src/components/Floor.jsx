// Floor file. This is the textured ground plane for the room.
import { useTexture } from "@react-three/drei";

// Textured floor to show materials and texture mapping in the scene.
function Floor() {
  const rugTexture = useTexture("/textures/rug.svg");
  const roomSize = 600;

  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
      <planeGeometry args={[roomSize, roomSize]} />
      <meshStandardMaterial color="#fff6ec" map={rugTexture} />
    </mesh>
  );
}

export default Floor;
