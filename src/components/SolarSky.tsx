import { Suspense } from "react";
import { BackSide } from "three";
import { useSolarTexture } from "./PlanetBody";

function MilkyWay() {
  const map = useSolarTexture("milky-way");
  return (
    <mesh rotation={[0.19, 1.3, -0.29]}>
      <sphereGeometry args={[86, 40, 24]} />
      <meshBasicMaterial map={map} color="#747888" side={BackSide} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

export function SolarSky() {
  return <Suspense fallback={null}><MilkyWay /></Suspense>;
}
