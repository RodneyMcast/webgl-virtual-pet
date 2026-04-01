import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

function Toy({ visible }) {
  const toyRef = useRef();

  useFrame(() => {
    if (!toyRef.current) {
      return;
    }

    if (visible) {
      toyRef.current.rotation.x += 0.03;
      toyRef.current.rotation.y += 0.03;
      toyRef.current.position.y = 0.05 + Math.sin(Date.now() * 0.004) * 0.08;
    } else {
      toyRef.current.position.y = -2;
    }
  });

  return (
    <group position={[1.4, 0.1, 0.2]} ref={toyRef}>
      <mesh castShadow>
        <torusGeometry args={[0.28, 0.09, 12, 24]} />
        <meshStandardMaterial color="#61d0ff" />
      </mesh>
      <mesh castShadow position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ffef7a" />
      </mesh>
    </group>
  );
}

export default Toy;
