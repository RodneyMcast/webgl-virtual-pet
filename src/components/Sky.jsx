// Room file. This builds the 4 walls and ceiling with the sky texture.
import { useTexture } from "@react-three/drei";
import { DoubleSide } from "three";

// Textured walls and ceiling for the surrounding room.
function Sky() {
  const wallpaper = useTexture("/textures/sky.avif");
  const roomSize = 600;
  const wallHeight = 130;
  const wallY = -1.2 + wallHeight / 2;
  const roomEdge = roomSize / 2;
  const ceilingY = -1.2 + wallHeight;

  return (
    <group>
      <mesh position={[0, wallY, -roomEdge]} receiveShadow>
        <planeGeometry args={[roomSize, wallHeight]} />
        <meshStandardMaterial map={wallpaper} side={DoubleSide} />
      </mesh>

      <mesh position={[0, wallY, roomEdge]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[roomSize, wallHeight]} />
        <meshStandardMaterial map={wallpaper} side={DoubleSide} />
      </mesh>

      <mesh position={[-roomEdge, wallY, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[roomSize, wallHeight]} />
        <meshStandardMaterial map={wallpaper} side={DoubleSide} />
      </mesh>

      <mesh position={[roomEdge, wallY, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[roomSize, wallHeight]} />
        <meshStandardMaterial map={wallpaper} side={DoubleSide} />
      </mesh>

      <mesh position={[0, ceilingY, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roomSize, roomSize]} />
        <meshStandardMaterial map={wallpaper} side={DoubleSide} />
      </mesh>
    </group>
  );
}

export default Sky;
