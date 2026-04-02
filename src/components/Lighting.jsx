// Simple lighting file. This gives the scene a bright mode and a soft mode.
function Lighting({ mode }) {
  const isSoft = mode === "soft";

  return (
    <>
      <ambientLight intensity={isSoft ? 0.45 : 0.7} />
      <directionalLight
        castShadow
        color={isSoft ? "#ffe3b5" : "#ffffff"}
        intensity={isSoft ? 0.95 : 1.5}
        position={[3, 5, 4]}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />
    </>
  );
}

export default Lighting;
