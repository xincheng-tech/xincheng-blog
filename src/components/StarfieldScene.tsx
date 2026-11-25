import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferGeometry, CanvasTexture, LinearFilter, SRGBColorSpace, Vector3 } from "three";
import type { PlanetSurface } from "../data/planetSurfaces";
import type { Section } from "../data/sections";
import { PlanetBody, useSolarTexture } from "./PlanetBody";
import { SolarSky } from "./SolarSky";
import { RETURN_DURATION_MS, TRAVEL_DURATION_MS } from "./travelTiming";

type Phase = "idle" | "travel" | "arrived" | "return";
const mainLight: Section["position"] = [-2.8, 0.4, -23];
const orbitTilt = 0.4;

const overviewBodies: {
  surface: PlanetSurface;
  desktop: [number, number];
  mobile: [number, number];
  radius: number;
}[] = [
  { surface: "mercury", desktop: [-4.3, -21.5], mobile: [-1.3, -22], radius: 0.23 },
  { surface: "venus", desktop: [0.15, -20.9], mobile: [0.05, -21], radius: 0.43 },
  { surface: "jupiter", desktop: [7.25, -26.5], mobile: [3.5, -25.8], radius: 0.93 },
  { surface: "uranus", desktop: [11.3, -28], mobile: [-3.8, -32.9], radius: 0.47 },
  { surface: "neptune", desktop: [-15.9, -35.5], mobile: [3.2, -33.5], radius: 0.45 },
];

function orbitPosition(x: number, z: number): Section["position"] {
  return [x, mainLight[1] - (z - mainLight[2]) * orbitTilt, z];
}

type Props = {
  sections: Section[];
  selectedSlug: string | null;
  phase: Phase;
  reducedMotion: boolean;
  mobile: boolean;
  onActivate: (slug: string) => void;
  onArrive: () => void;
  onReturn: () => void;
  onContextLost: () => void;
  onReady: () => void;
};

function makePointTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.18, "rgba(255,255,255,.88)");
  gradient.addColorStop(0.55, "rgba(255,255,255,.3)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  return texture;
}

function SunMap() {
  const map = useSolarTexture("sun");
  return <meshBasicMaterial map={map} toneMapped={false} />;
}

function Sun() {
  const texture = useMemo(makePointTexture, []);
  useEffect(() => () => texture?.dispose(), [texture]);
  return (
    <group position={mainLight}>
      <mesh>
        <sphereGeometry args={[1.02, 40, 24]} />
        <Suspense fallback={<meshBasicMaterial color="#ffbd6c" toneMapped={false} />}>
          <SunMap />
        </Suspense>
      </mesh>
      {texture && (
        <sprite scale={[6.5, 6.5, 1]}>
          <spriteMaterial map={texture} color="#f6b675" transparent opacity={0.38}
            depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
        </sprite>
      )}
    </group>
  );
}

function Orbit({ position }: { position: Section["position"] }) {
  const geometry = useMemo(() => {
    const radius = Math.hypot(position[0] - mainLight[0], position[2] - mainLight[2]);
    const vertices = Array.from({ length: 128 }, (_, index) => {
      const angle = index / 128 * Math.PI * 2;
      const z = Math.sin(angle) * radius;
      return new Vector3(...orbitPosition(mainLight[0] + Math.cos(angle) * radius, mainLight[2] + z));
    });
    return new BufferGeometry().setFromPoints(vertices);
  }, [position]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineLoop geometry={geometry}>
      <lineBasicMaterial color="#a8a0b9" opacity={0.16} transparent depthWrite={false} />
    </lineLoop>
  );
}

function CameraRig({ sections, selectedSlug, phase, onArrive, onReturn }: Pick<Props, "sections" | "selectedSlug" | "phase" | "onArrive" | "onReturn">) {
  const { camera } = useThree();
  const goal = useRef(new Vector3(0, 0, 0));
  const look = useRef(new Vector3(0, 0, -18));
  const home = useRef(new Vector3(0, 0, 0));
  const homeLook = useRef(new Vector3(0, 0, -18));
  const previousPhase = useRef(phase);
  const elapsed = useRef(0);
  const fromPosition = useRef(new Vector3());
  const fromLook = useRef(new Vector3(0, 0, -18));
  const controlOne = useRef(new Vector3());
  const controlTwo = useRef(new Vector3());
  const pathEnd = useRef(new Vector3());
  const pathLookEnd = useRef(new Vector3(0, 0, -18));

  useFrame((_, delta) => {
    if (phase === "arrived") return;
    const section = sections.find((item) => item.slug === selectedSlug);
    const changed = phase !== previousPhase.current;
    if (changed) {
      previousPhase.current = phase;
      elapsed.current = 0;
      fromPosition.current.copy(camera.position);
      fromLook.current.copy(look.current);

      if (phase === "travel" && section) {
        pathEnd.current.set(section.position[0] * 0.74, section.position[1] * 0.74, section.position[2] + 6.5);
        pathLookEnd.current.set(...section.position);
      } else {
        pathEnd.current.copy(home.current);
        pathLookEnd.current.copy(homeLook.current);
      }

      const distance = pathEnd.current.clone().sub(fromPosition.current);
      controlOne.current.copy(fromPosition.current).addScaledVector(distance, 0.28);
      controlOne.current.y += Math.sign(distance.y || 1) * Math.min(2.4, Math.abs(distance.x) * 0.11 + 0.7);
      controlTwo.current.copy(pathEnd.current).addScaledVector(distance, -0.18);
      controlTwo.current.z += phase === "travel" ? 2.2 : 1.2;
    }

    if (phase === "travel" || phase === "return") {
      const duration = phase === "travel" ? TRAVEL_DURATION_MS : RETURN_DURATION_MS;
      const previous = elapsed.current;
      if (!changed) elapsed.current += delta * 1000;
      const raw = Math.min(elapsed.current / duration, 1);
      const eased = raw * raw * (3 - 2 * raw);
      const inverse = 1 - eased;
      camera.position.copy(fromPosition.current).multiplyScalar(inverse ** 3)
        .addScaledVector(controlOne.current, 3 * inverse * inverse * eased)
        .addScaledVector(controlTwo.current, 3 * inverse * eased * eased)
        .addScaledVector(pathEnd.current, eased ** 3);
      look.current.lerpVectors(fromLook.current, pathLookEnd.current, eased);
      if (raw === 1 && previous < duration) {
        if (phase === "travel") onArrive();
        else onReturn();
      }
    } else {
      goal.current.copy(home.current);
      look.current.lerp(homeLook.current, 1 - Math.exp(-delta * 2.2));
      camera.position.lerp(goal.current, 1 - Math.exp(-delta * 2.2));
    }
    camera.lookAt(look.current);
  });

  return null;
}

export function StarfieldScene(props: Props) {
  const { sections, selectedSlug, phase, reducedMotion, mobile, onActivate, onArrive, onReturn, onContextLost, onReady } = props;
  const sceneSections = useMemo(() => sections.map((section, index) => {
    const [x, , z] = section.position;
    const depth = mobile ? [-18, -18.6, -13.8][index] ?? z : z;
    const position = orbitPosition(mobile ? [-2.15, 2.2, 0.2][index] ?? x : x, depth);
    return { ...section, position };
  }), [mobile, sections]);
  useEffect(() => () => { document.body.style.cursor = ""; }, []);
  return (
    <Canvas
      className="star-canvas"
      camera={{ position: [0, 0, 0], fov: 54, near: 0.1, far: 120 }}
      dpr={mobile ? [1, 1.2] : [1, 1.5]}
      gl={{ alpha: true, antialias: !mobile, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        onReady();
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          onContextLost();
        });
      }}
    >
      <SolarSky />
      <ambientLight intensity={0.82} />
      <pointLight position={mainLight} intensity={2.75} color="#fff1da" decay={0} />
      <Sun />
      {overviewBodies.map(({ surface, radius, desktop, mobile: compact }) => {
        const position = orbitPosition(...(mobile ? compact : desktop));
        return (
          <group key={surface}>
            <Orbit position={position} />
            <group position={position}>
              <PlanetBody surface={surface} mobile={mobile} radius={radius * (mobile ? 0.64 : 1)}
                animate={!reducedMotion} />
            </group>
          </group>
        );
      })}
      {sceneSections.map((section, index) => (
        <group key={section.slug}>
          <Orbit position={section.position} />
          <group position={section.position}>
            <PlanetBody surface={section.surface} mobile={mobile}
              radius={(mobile ? 0.62 : 1) * ([1.16, 0.94, 1.02][index] ?? 1)}
              animate={!reducedMotion}
              onPointerOver={(event) => {
                event.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => { document.body.style.cursor = ""; }}
              onClick={(event) => {
                event.stopPropagation();
                onActivate(section.slug);
              }} />
          </group>
        </group>
      ))}
      <CameraRig sections={sceneSections} selectedSlug={selectedSlug} phase={phase}
        onArrive={onArrive} onReturn={onReturn} />
    </Canvas>
  );
}
