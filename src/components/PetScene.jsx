import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import Lighting from "./Lighting";
import Floor from "./Floor";
import Pet from "./Pet";
import ExternalAsset from "./ExternalAsset";
import SceneCamera from "./SceneCamera";
import SceneControls from "./SceneControls";
import Sky from "./Sky";

function PetScene({ onPetClick, onSceneWheel, pet, recentAction, view }) {
  const controlsRef = useRef();

  return (
    <section className="scene-card" onWheelCapture={onSceneWheel}>
      <Canvas camera={{ position: [0, 1.5, 5], fov: 40 }} shadows>
        <color args={["#ffe9d0"]} attach="background" />
        <SceneCamera controlsRef={controlsRef} view={view} />
        <Lighting />
        <Sky />
        <Floor />
        <Pet
          color={pet.petColor}
          expression={pet.expression}
          onPetClick={onPetClick}
          recentAction={recentAction}
        />
        <ExternalAsset visible={pet.toyVisible} />
        <SceneControls controlsRef={controlsRef} />
      </Canvas>
    </section>
  );
}

export default PetScene;
