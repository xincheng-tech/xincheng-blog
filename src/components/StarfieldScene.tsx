import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, LinearFilter, SRGBColorSpace, Vector3 } from "three";
import type { Section } from "../data/sections";
import { mainLight, PlanetBody, surfaceFor } from "./PlanetBody";
import { RETURN_DURATION_MS, TRAVEL_DURATION_MS } from "./travelTiming";

type Phase = "idle" | "travel" | "arrived" | "return";

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

function random(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makeGalaxy(count: number, seed: number, radius: number, depth: number, depthSpread: number) {
  const rand = random(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = ["#abbce2", "#8e94be", "#ffdeae", "#d6d8ea"].map((color) => new Color(color));

  for (let i = 0; i < count; i += 1) {
    const arm = i % 4;
    const r = Math.pow(rand(), 1.16) * radius;
    const angle = (arm * Math.PI) / 2 + r * 0.14 + (rand() - 0.5) * (0.36 + r * 0.009);
    const index = i * 3;
    const diskY = Math.sin(angle) * r;
    positions[index] = Math.cos(angle) * r;
    positions[index + 1] = diskY * 0.46 + (rand() - 0.5) * 1.4;
    positions[index + 2] = depth + diskY * 0.63 + (rand() - 0.5) * depthSpread;
    const color = palette[Math.floor(rand() * palette.length)];
    colors[index] = color.r;
    colors[index + 1] = color.g;
    colors[index + 2] = color.b;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  return geometry;
}

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

function Galaxy({ mobile }: { mobile: boolean }) {
  const geometry = useMemo(() => makeGalaxy(mobile ? 3500 : 10500, 76132, 33, -47, 5), [mobile]);
  const texture = useMemo(makePointTexture, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return (
    <points geometry={geometry} position={[0, 0, -3]} rotation={[0, 0, -0.28]}>
      <pointsMaterial
        size={mobile ? 0.21 : 0.15}
        sizeAttenuation
        transparent
        opacity={0.86}
        vertexColors
        map={texture ?? undefined}
        alphaTest={0.015}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function Dust({ mobile, animate = true }: { mobile: boolean; animate?: boolean }) {
  const points = useRef<import("three").Points>(null);
  const geometry = useMemo(() => {
    const rand = random(9917);
    const positions = new Float32Array((mobile ? 600 : 1700) * 3);
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (rand() - 0.5) * 104;
      positions[i + 1] = (rand() - 0.5) * 65;
      positions[i + 2] = -14 - rand() * 85;
    }
    return new BufferGeometry().setAttribute("position", new BufferAttribute(positions, 3));
  }, [mobile]);
  const texture = useMemo(makePointTexture, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => texture?.dispose(), [texture]);
  useFrame((_, delta) => {
    if (animate && points.current) points.current.rotation.z += delta * 0.003;
  });
  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        size={mobile ? 0.24 : 0.19}
        color="#b7ccff"
        map={texture ?? undefined}
        alphaTest={0.015}
        transparent
        opacity={0.54}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function SystemStar() {
  const texture = useMemo(makePointTexture, []);
  useEffect(() => () => texture?.dispose(), [texture]);
  return (
    <group position={mainLight}>
      <mesh>
        <sphereGeometry args={[0.27, 24, 16]} />
        <meshBasicMaterial color="#fff3db" toneMapped={false} />
      </mesh>
      {texture && (
        <sprite scale={[5.2, 5.2, 1]}>
          <spriteMaterial map={texture} color="#f6b675" transparent opacity={0.47}
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
      return new Vector3(mainLight[0] + Math.cos(angle) * radius, mainLight[1] - z * 0.56, mainLight[2] + z);
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
      elapsed.current += Math.min(delta, 0.045) * 1000;
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
    const depth = mobile ? [-18, -18.6, -15.8][index] ?? z : z;
    const position: Section["position"] = [
      mobile ? [-2.15, 2.2, 0.2][index] ?? x : x,
      mainLight[1] - (depth - mainLight[2]) * 0.56,
      depth,
    ];
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
      <GalaxyBackdrop mobile={mobile} animate={!reducedMotion} />
      <SystemStar />
      {sceneSections.map((section, index) => (
        <group key={section.slug}>
          <Orbit position={section.position} />
          <group position={section.position}>
            <PlanetBody surface={surfaceFor(section.slug)} mobile={mobile} seed={index + 1}
              radius={(mobile ? 0.62 : 1) * ([1.43, 1.25, 0.98][index] ?? 1)}
              ring={section.slug === "podcast"} animate={!reducedMotion}
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

export function GalaxyBackdrop({ mobile, animate = true }: { mobile: boolean; animate?: boolean }) {
  return (
    <>
      <Galaxy mobile={mobile} />
      <Dust mobile={mobile} animate={animate} />
    </>
  );
}
