// Camera view file. This handles the smooth move between front, close, and room views.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, Vector3 } from "three";

const viewSettings = {
  front: {
    fov: 40,
    position: [0, 1.7, 7.6],
    target: [0, 0.2, 0],
  },
  close: {
    fov: 30,
    position: [0, 1.3, 4.8],
    target: [0, 0.2, 0.6],
  },
  room: {
    fov: 52,
    position: [8.2, 4.1, 10.2],
    target: [0, 0.15, 0],
  },
};

// Smooth camera transitions for the required viewpoint changes.
function SceneCamera({ controlsRef, view }) {
  const { camera } = useThree();
  const targetRef = useRef(new Vector3(0, 0.2, 0));
  const movingRef = useRef(true);

  useEffect(() => {
    // Lock controls while the camera moves to the chosen preset.
    movingRef.current = true;

    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
  }, [view]);

  useFrame((_, delta) => {
    if (!movingRef.current) {
      return;
    }

    const nextView = viewSettings[view] || viewSettings.front;

    camera.position.x = MathUtils.damp(camera.position.x, nextView.position[0], 4, delta);
    camera.position.y = MathUtils.damp(camera.position.y, nextView.position[1], 4, delta);
    camera.position.z = MathUtils.damp(camera.position.z, nextView.position[2], 4, delta);
    camera.fov = MathUtils.damp(camera.fov, nextView.fov, 4, delta);
    camera.updateProjectionMatrix();

    targetRef.current.x = MathUtils.damp(targetRef.current.x, nextView.target[0], 4, delta);
    targetRef.current.y = MathUtils.damp(targetRef.current.y, nextView.target[1], 4, delta);
    targetRef.current.z = MathUtils.damp(targetRef.current.z, nextView.target[2], 4, delta);

    if (controlsRef.current) {
      controlsRef.current.target.copy(targetRef.current);
      controlsRef.current.update();
    }

    const closeEnough =
      Math.abs(camera.position.x - nextView.position[0]) < 0.03 &&
      Math.abs(camera.position.y - nextView.position[1]) < 0.03 &&
      Math.abs(camera.position.z - nextView.position[2]) < 0.03 &&
      Math.abs(camera.fov - nextView.fov) < 0.2;

    if (closeEnough) {
      // Once the camera reaches the preset, give control back to the user.
      camera.position.set(...nextView.position);
      camera.fov = nextView.fov;
      camera.updateProjectionMatrix();
      targetRef.current.set(...nextView.target);

      if (controlsRef.current) {
        controlsRef.current.target.copy(targetRef.current);
        controlsRef.current.enabled = true;
        controlsRef.current.update();
      }

      movingRef.current = false;
    }
  });

  return null;
}

export default SceneCamera;
