import { Canvas } from "@react-three/fiber";
import { Suspense, lazy, useRef } from "react";
import Lighting from "./Lighting";
import Floor from "./Floor";
import Pet from "./Pet";
import SceneCamera from "./SceneCamera";
import SceneControls from "./SceneControls";
import Sky from "./Sky";

const ExternalAsset = lazy(() => import("./ExternalAsset"));

function PetScene({ onPetClick, onSceneWheel, pet, recentAction, view }) {
  const controlsRef = useRef();

  return (
    <section
      className="h-[420px] overflow-hidden rounded-[22px] border-[3px] border-zinc-900 bg-rose-400 shadow-[0_6px_0_#44202a] md:h-[520px]"
      onWheelCapture={onSceneWheel}
    >
      <Canvas
        camera={{ position: [0, 1.5, 5], fov: 40 }}
        className="!block !h-full !w-full"
        shadows="percentage"
      >
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
        {pet.toyVisible ? (
          <Suspense fallback={null}>
            <ExternalAsset visible={pet.toyVisible} />
          </Suspense>
        ) : null}
        <SceneControls controlsRef={controlsRef} />
      </Canvas>
    </section>
  );
}

export default PetScene;
