import { lazy, Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, LinearFilter, SRGBColorSpace, Vector3 } from "three";
import type { Section } from "../data/sections";
import { OptionalEffectsBoundary } from "./SceneErrorBoundary";

const TravelEffects = lazy(() =>
  import("./TravelEffects").then((module) => ({ default: module.TravelEffects })),
);

type Phase = "idle" | "preview" | "travel" | "arrived" | "return";

type Props = {
  sections: Section[];
  selectedSlug: string | null;
  phase: Phase;
  reducedMotion: boolean;
  mobile: boolean;
  onPreview: (slug: string | null) => void;
  onActivate: (slug: string) => void;
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
  const palette = ["#9cc8ff", "#d9b7ff", "#ffe0a4", "#90eff4"].map((color) => new Color(color));

  for (let i = 0; i < count; i += 1) {
    const arm = i % 4;
    const r = Math.pow(rand(), 0.63) * radius;
    const angle = (arm * Math.PI) / 2 + r * 0.22 + (rand() - 0.5) * 0.42;
    const index = i * 3;
    positions[index] = Math.cos(angle) * r;
    positions[index + 1] = Math.sin(angle) * r * 0.58;
    positions[index + 2] = depth + (rand() - 0.5) * depthSpread;
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
  const geometry = useMemo(() => makeGalaxy(mobile ? 2600 : 6800, 76132, 14, -20, 4), [mobile]);
  const texture = useMemo(makePointTexture, []);
  return (
    <points geometry={geometry} rotation={[0.03, 0, -0.12]}>
      <pointsMaterial
        size={mobile ? 0.055 : 0.045}
        sizeAttenuation
        transparent
        opacity={0.84}
        vertexColors
        map={texture ?? undefined}
        alphaTest={0.015}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function Dust({ mobile }: { mobile: boolean }) {
  const points = useRef<import("three").Points>(null);
  const geometry = useMemo(() => makeGalaxy(mobile ? 300 : 850, 9917, 18, -14, 8), [mobile]);
  const texture = useMemo(makePointTexture, []);
  useFrame((_, delta) => {
    if (points.current) points.current.rotation.z += delta * 0.003;
  });
  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        size={mobile ? 0.09 : 0.075}
        color="#b7ccff"
        map={texture ?? undefined}
        alphaTest={0.015}
        transparent
        opacity={0.32}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function Planet({
  section,
  mobile,
  onPreview,
  onActivate,
}: {
  section: Section;
  mobile: boolean;
  onPreview: (slug: string | null) => void;
  onActivate: (slug: string) => void;
}) {
  const color = new Color(section.color);
  return (
    <group position={section.position} scale={mobile ? 0.58 : 1}>
      <mesh
        onPointerEnter={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
          onPreview(section.slug);
        }}
        onPointerLeave={() => {
          document.body.style.cursor = "";
          onPreview(null);
        }}
        onClick={(event) => {
          event.stopPropagation();
          onActivate(section.slug);
        }}
      >
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.12} roughness={0.64} metalness={0.08} />
      </mesh>
      <mesh scale={1.42}>
        <sphereGeometry args={[1.15, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.055} depthWrite={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2.4, 0.15, 0.25]}>
        <torusGeometry args={[1.7, 0.018, 4, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.48} />
      </mesh>
      <pointLight position={[2.6, 1.8, 3.6]} color={color} intensity={mobileLight(section.slug)} distance={11} />
    </group>
  );
}

function mobileLight(slug: string) {
  return slug === "podcast" ? 3.2 : 2.6;
}

function CameraRig({ sections, selectedSlug, phase }: Pick<Props, "sections" | "selectedSlug" | "phase">) {
  const { camera } = useThree();
  const goal = useRef(new Vector3(0, 0, 0));
  const look = useRef(new Vector3(0, 0, -18));
  const home = useRef(new Vector3(0, 0, 0));

  useFrame((_, delta) => {
    const section = sections.find((item) => item.slug === selectedSlug);
    if (phase === "travel" && section) {
      goal.current.set(section.position[0] * 0.74, section.position[1] * 0.74, section.position[2] + 6.5);
      look.current.set(...section.position);
    } else {
      goal.current.copy(home.current);
      look.current.set(0, 0, -18);
    }
    const factor = 1 - Math.exp(-delta * (phase === "travel" ? 2.8 : 1.6));
    camera.position.lerp(goal.current, factor);
    camera.lookAt(look.current);
  });

  return null;
}

export function StarfieldScene(props: Props) {
  const { sections, selectedSlug, phase, reducedMotion, mobile, onPreview, onActivate, onContextLost, onReady } = props;
  const sceneSections = useMemo(() => mobile
    ? sections.map((section, index) => ({
      ...section,
      position: [-2.8, -0.35 - index * 2.15, -15] as [number, number, number],
    }))
    : sections, [mobile, sections]);
  return (
    <Canvas
      className="star-canvas"
      camera={{ position: [0, 0, 0], fov: 54, near: 0.1, far: 120 }}
      dpr={mobile ? [1, 1.25] : [1, 1.65]}
      gl={{ alpha: true, antialias: !mobile, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        onReady();
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          onContextLost();
        });
      }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 7, 8]} intensity={1.7} color="#fff4dc" />
      <Galaxy mobile={mobile} />
      <Dust mobile={mobile} />
      {sceneSections.map((section) => (
        <Planet key={section.slug} section={section} mobile={mobile} onPreview={onPreview} onActivate={onActivate} />
      ))}
      <CameraRig sections={sceneSections} selectedSlug={selectedSlug} phase={phase} />
      {!mobile && !reducedMotion && phase === "travel" && (
        <OptionalEffectsBoundary>
          <Suspense fallback={null}><TravelEffects /></Suspense>
        </OptionalEffectsBoundary>
      )}
    </Canvas>
  );
}
