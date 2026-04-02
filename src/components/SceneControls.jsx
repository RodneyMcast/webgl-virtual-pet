// Control file. OrbitControls handles the mouse, and this file adds simple keyboard movement.
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";

// This covers the assignment part for user-controlled camera movement.
function SceneControls({ controlsRef }) {
  const { camera } = useThree();
  const pressedKeysRef = useRef({});
  const forwardRef = useMemo(() => new Vector3(), []);
  const rightRef = useMemo(() => new Vector3(), []);
  const moveRef = useMemo(() => new Vector3(), []);
  const zoomRef = useMemo(() => new Vector3(), []);

  useEffect(() => {
    // Track which keys are being held down.
    function handleKeyDown(event) {
      if (document.activeElement?.tagName === "INPUT") {
        return;
      }

      pressedKeysRef.current[event.key.toLowerCase()] = true;
    }

    function handleKeyUp(event) {
      pressedKeysRef.current[event.key.toLowerCase()] = false;
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    // Move and zoom the camera with WASD and +/-.
    if (!controlsRef.current || !controlsRef.current.enabled) {
      return;
    }

    const keys = pressedKeysRef.current;
    const moveSpeed = 4 * delta;
    const zoomSpeed = 6 * delta;

    forwardRef.subVectors(controlsRef.current.target, camera.position);
    const distance = forwardRef.length();

    if (distance === 0) {
      return;
    }

    forwardRef.y = 0;

    if (forwardRef.lengthSq() === 0) {
      forwardRef.set(0, 0, -1);
    } else {
      forwardRef.normalize();
    }

    rightRef.crossVectors(forwardRef, camera.up).normalize();
    moveRef.set(0, 0, 0);

    if (keys.w) {
      moveRef.add(forwardRef);
    }

    if (keys.s) {
      moveRef.sub(forwardRef);
    }

    if (keys.a) {
      moveRef.sub(rightRef);
    }

    if (keys.d) {
      moveRef.add(rightRef);
    }

    if (moveRef.lengthSq() > 0) {
      moveRef.normalize().multiplyScalar(moveSpeed);
      camera.position.add(moveRef);
      controlsRef.current.target.add(moveRef);
    }

    if (keys["+"] || keys["="]) {
      const nextDistance = Math.max(controlsRef.current.minDistance, distance - zoomSpeed);

      zoomRef
        .subVectors(camera.position, controlsRef.current.target)
        .normalize()
        .multiplyScalar(nextDistance);
      camera.position.copy(controlsRef.current.target).add(zoomRef);
    }

    if (keys["-"] || keys["_"]) {
      const nextDistance = Math.min(controlsRef.current.maxDistance, distance + zoomSpeed);

      zoomRef
        .subVectors(camera.position, controlsRef.current.target)
        .normalize()
        .multiplyScalar(nextDistance);
      camera.position.copy(controlsRef.current.target).add(zoomRef);
    }

    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      enablePan
      keyPanSpeed={0}
      maxDistance={400}
      minDistance={1.8}
    />
  );
}

export default SceneControls;
