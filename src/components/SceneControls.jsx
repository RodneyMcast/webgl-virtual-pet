import { OrbitControls } from "@react-three/drei";

function SceneControls({ controlsRef }) {
  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      enablePan
      maxDistance={24}
      minDistance={1.8}
    />
  );
}

export default SceneControls;
