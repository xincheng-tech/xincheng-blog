import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import type { ThreeElements } from "@react-three/fiber";
import { DoubleSide, RingGeometry, SRGBColorSpace, TextureLoader } from "three";
import type { Group, Mesh, Texture } from "three";
import { planetSurfaces } from "../data/planetSurfaces";
import type { PlanetSurface } from "../data/planetSurfaces";
import { solarTexturePath } from "../data/solarTextures";

function configureTexture(texture: Texture) {
  if (texture.colorSpace !== SRGBColorSpace) {
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }
  return texture;
}

export function useSolarTexture(filename: string) {
  return configureTexture(useLoader(TextureLoader, solarTexturePath(filename)));
}

export function useSolarTextures(files: string[]) {
  return useLoader(TextureLoader, files.map(solarTexturePath)).map(configureTexture);
}

function PlanetMap({ file }: { file: string }) {
  const texture = useSolarTexture(file);
  return <meshStandardMaterial map={texture} roughness={1} />;
}

function SaturnRings({ texture }: { texture: Texture }) {
  const geometry = useMemo(() => {
    const inner = 1.3;
    const outer = 2.25;
    const ring = new RingGeometry(inner, outer, 96, 1);
    const positions = ring.getAttribute("position");
    const uv = ring.getAttribute("uv");
    for (let i = 0; i < positions.count; i++) {
      const radius = Math.hypot(positions.getX(i), positions.getY(i));
      uv.setXY(i, (radius - inner) / (outer - inner), 0.5);
    }
    return ring;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} rotation-x={Math.PI / 2}>
      <meshStandardMaterial map={texture} transparent depthWrite={false} side={DoubleSide} roughness={1} />
    </mesh>
  );
}

function LoadSaturnRings() {
  return <SaturnRings texture={useSolarTexture("saturn-ring")} />;
}

export function PlanetBody({ surface, map, ringMap, radius, emphasis = 1, animate = true, mobile, ...events }: {
  surface: PlanetSurface;
  map?: Texture;
  ringMap?: Texture;
  radius: number;
  emphasis?: number;
  animate?: boolean;
  mobile: boolean;
} & Pick<ThreeElements["mesh"], "onPointerOver" | "onPointerOut" | "onClick">) {
  const body = useRef<Mesh>(null);
  const planet = useRef<Group>(null);
  const { file, color, tilt } = planetSurfaces[surface];

  useFrame((_, delta) => {
    if (animate && body.current) body.current.rotation.y += Math.min(delta, 0.05) * 0.065;
    if (planet.current) {
      const scale = planet.current.scale.x;
      planet.current.scale.setScalar(scale + (emphasis - scale) * (animate ? 1 - Math.exp(-delta * 8) : 1));
    }
  });

  return (
    <group scale={radius} rotation={[0.16, 0, -tilt]}>
      <group ref={planet}>
        <mesh ref={body} {...events}>
          <sphereGeometry args={[1, mobile ? 32 : 48, mobile ? 24 : 32]} />
          {map ? <meshStandardMaterial map={map} roughness={1} /> : (
            <Suspense fallback={<meshStandardMaterial color={color} roughness={1} />}>
              <PlanetMap file={file} />
            </Suspense>
          )}
        </mesh>
        {surface === "saturn" && (ringMap ? <SaturnRings texture={ringMap} /> : (
          <Suspense fallback={null}><LoadSaturnRings /></Suspense>
        ))}
      </group>
    </group>
  );
}
