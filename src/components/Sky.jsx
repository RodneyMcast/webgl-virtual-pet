import { useTexture } from "@react-three/drei";
import { DoubleSide, RepeatWrapping } from "three";

function Sky() {
  const wallpaper = useTexture("/textures/sky.avif");

  wallpaper.wrapS = RepeatWrapping;
  wallpaper.wrapT = RepeatWrapping;
  wallpaper.repeat.set(1.2, 1.2);

  return (
    <group>
      <mesh position={[0, 3.4, -14]} receiveShadow>
        <planeGeometry args={[28, 10]} />
        <meshStandardMaterial map={wallpaper} side={DoubleSide} />
      </mesh>

      <mesh position={[0, 3.4, 14]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[28, 10]} />
        <meshStandardMaterial map={wallpaper} side={DoubleSide} />
      </mesh>

      <mesh position={[-14, 3.4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[28, 10]} />
        <meshStandardMaterial map={wallpaper} side={DoubleSide} />
      </mesh>

      <mesh position={[14, 3.4, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[28, 10]} />
        <meshStandardMaterial map={wallpaper} side={DoubleSide} />
      </mesh>

      <mesh position={[0, 8.4, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[28, 28]} />
        <meshStandardMaterial map={wallpaper} side={DoubleSide} />
      </mesh>
    </group>
  );
}

export default Sky;
