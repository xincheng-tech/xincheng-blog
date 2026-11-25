import { Suspense } from "react";
import { BackSide } from "three";
import type { Texture } from "three";
import { useSolarTexture } from "./PlanetBody";

function LoadMilkyWay() {
  return <MilkyWay map={useSolarTexture("milky-way")} />;
}

function MilkyWay({ map }: { map: Texture }) {
  return (
    <mesh rotation={[0.19, 1.3, -0.29]}>
      <sphereGeometry args={[86, 40, 24]} />
      <meshBasicMaterial map={map} color="#747888" side={BackSide} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

export function SolarSky({ map }: { map?: Texture }) {
  return map ? <MilkyWay map={map} /> : <Suspense fallback={null}><LoadMilkyWay /></Suspense>;
}
