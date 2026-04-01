function Lighting() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight
        castShadow
        intensity={1.5}
        position={[3, 5, 4]}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />
    </>
  );
}

export default Lighting;
