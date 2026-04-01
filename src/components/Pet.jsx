import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Color, MathUtils } from "three";

function Pet({ color, expression, recentAction, onPetClick }) {
  const rootRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const mouthRef = useRef();

  const bodyColor = color;
  const muzzleColor = "#fff1dd";
  const pawColor = new Color(color).offsetHSL(0, 0, -0.18).getStyle();
  const noseColor = "#d99abb";

  useFrame((state, delta) => {
    if (!rootRef.current || !leftEyeRef.current || !rightEyeRef.current || !mouthRef.current) {
      return;
    }

    const time = state.clock.getElapsedTime();
    const isHappy =
      expression === "happy" ||
      recentAction === "toy" ||
      recentAction === "feed" ||
      recentAction === "pet";

    rootRef.current.position.y = MathUtils.damp(
      rootRef.current.position.y,
      0.12 + Math.sin(time * 2) * 0.04 + (isHappy ? Math.abs(Math.sin(time * 7)) * 0.08 : 0),
      5,
      delta,
    );

    rootRef.current.rotation.z = MathUtils.damp(
      rootRef.current.rotation.z,
      Math.sin(time * 1.8) * 0.02,
      4,
      delta,
    );

    const eyeScale = expression === "sad" ? 0.68 : 1;

    leftEyeRef.current.scale.y = MathUtils.damp(leftEyeRef.current.scale.y, eyeScale, 10, delta);
    rightEyeRef.current.scale.y = MathUtils.damp(rightEyeRef.current.scale.y, eyeScale, 10, delta);

    if (expression === "happy") {
      mouthRef.current.scale.x = MathUtils.damp(mouthRef.current.scale.x, 1.02, 6, delta);
      mouthRef.current.scale.y = MathUtils.damp(mouthRef.current.scale.y, 1.02, 6, delta);
      mouthRef.current.position.y = MathUtils.damp(mouthRef.current.position.y, -0.21, 6, delta);
    } else if (expression === "sad") {
      mouthRef.current.scale.x = MathUtils.damp(mouthRef.current.scale.x, 0.9, 6, delta);
      mouthRef.current.scale.y = MathUtils.damp(mouthRef.current.scale.y, 0.85, 6, delta);
      mouthRef.current.position.y = MathUtils.damp(mouthRef.current.position.y, -0.18, 6, delta);
    } else {
      mouthRef.current.scale.x = MathUtils.damp(mouthRef.current.scale.x, 0.96, 6, delta);
      mouthRef.current.scale.y = MathUtils.damp(mouthRef.current.scale.y, 0.96, 6, delta);
      mouthRef.current.position.y = MathUtils.damp(mouthRef.current.position.y, -0.2, 6, delta);
    }
  });

  return (
    <group onClick={onPetClick} position={[0, 0.12, 0.25]} ref={rootRef} scale={1.04}>
      <mesh castShadow>
        <sphereGeometry args={[1.18, 48, 48]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      <mesh castShadow position={[0, -0.12, 0.92]} scale={[0.72, 0.58, 0.32]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={muzzleColor} />
      </mesh>

      <mesh castShadow position={[-0.62, 1.03, -0.1]} rotation={[0, 0, 0.38]}>
        <coneGeometry args={[0.32, 0.8, 20]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh castShadow position={[0.62, 1.03, -0.1]} rotation={[0, 0, -0.38]}>
        <coneGeometry args={[0.32, 0.8, 20]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      <mesh castShadow position={[-0.3, -0.97, 0.42]} scale={[1, 0.92, 1.05]}>
        <sphereGeometry args={[0.26, 18, 18]} />
        <meshStandardMaterial color={pawColor} />
      </mesh>
      <mesh castShadow position={[0.3, -0.97, 0.42]} scale={[1, 0.92, 1.05]}>
        <sphereGeometry args={[0.26, 18, 18]} />
        <meshStandardMaterial color={pawColor} />
      </mesh>
      <mesh castShadow position={[-0.5, -0.94, -0.08]} scale={[0.92, 0.88, 1]}>
        <sphereGeometry args={[0.26, 18, 18]} />
        <meshStandardMaterial color={pawColor} />
      </mesh>
      <mesh castShadow position={[0.5, -0.94, -0.08]} scale={[0.92, 0.88, 1]}>
        <sphereGeometry args={[0.26, 18, 18]} />
        <meshStandardMaterial color={pawColor} />
      </mesh>

      <group position={[0, 0.15, 1.08]}>
        <mesh position={[-0.35, 0.18, 0]} ref={leftEyeRef}>
          <sphereGeometry args={[0.17, 20, 20]} />
          <meshStandardMaterial color="#18202f" />
        </mesh>

        <mesh position={[0.35, 0.18, 0]} ref={rightEyeRef}>
          <sphereGeometry args={[0.17, 20, 20]} />
          <meshStandardMaterial color="#18202f" />
        </mesh>

        <mesh position={[0, -0.02, 0.06]}>
          <sphereGeometry args={[0.13, 18, 18]} />
          <meshStandardMaterial color={noseColor} />
        </mesh>

        <group position={[0, -0.2, 0.155]} rotation={[-0.2, 0, 0]} ref={mouthRef} scale={[1, 1, 0.35]}>
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.085, 12]} />
            <meshStandardMaterial color="#2f1b16" />
          </mesh>

          <mesh position={[-0.055, -0.018, 0]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.055, 0.021, 12, 24, Math.PI]} />
            <meshStandardMaterial color="#2f1b16" />
          </mesh>

          <mesh position={[0.055, -0.018, 0]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.055, 0.021, 12, 24, Math.PI]} />
            <meshStandardMaterial color="#2f1b16" />
          </mesh>
        </group>
      </group>

      {recentAction === "feed" ? (
        <group position={[0, -0.12, 1.3]}>
          <mesh position={[-0.14, -0.06, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color="#ffda5c" />
          </mesh>
          <mesh position={[0, -0.12, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color="#ffae42" />
          </mesh>
          <mesh position={[0.14, -0.06, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color="#ffda5c" />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}

export default Pet;
