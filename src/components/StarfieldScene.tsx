import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  LinearFilter,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Group, Sprite, Texture } from "three";
import { planetSurfaces, type PlanetSurface } from "../data/planetSurfaces";
import type { Section } from "../data/sections";
import { PlanetBody, useSolarTextures } from "./PlanetBody";
import { SolarSky } from "./SolarSky";
import { OptionalEffectsBoundary } from "./SceneErrorBoundary";
import { TravelEffects } from "./TravelEffects";
import { ShootingStars, TwinklingStars, WarpStreaks } from "./CosmicParticles";
import { revealArrival } from "../travelHandoff";
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
  { surface: "ceres", desktop: [-6.4, -24.2], mobile: [-2.6, -24.5], radius: 0.19 },
  { surface: "jupiter", desktop: [7.25, -26.5], mobile: [3.5, -25.8], radius: 0.93 },
  { surface: "uranus", desktop: [11.3, -28], mobile: [-3.8, -32.9], radius: 0.47 },
  { surface: "neptune", desktop: [-15.9, -35.5], mobile: [3.2, -33.5], radius: 0.45 },
  { surface: "pluto", desktop: [14.8, -36.5], mobile: [0.8, -36], radius: 0.22 },
];

const HOME_TEXTURE_FILES = [
  "milky-way",
  "sun",
  "saturn-ring",
  "mercury",
  "venus_surface",
  "ceres",
  "earth_daymap",
  "moon",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
];

function orbitPosition(x: number, z: number): Section["position"] {
  return [x, mainLight[1] - (z - mainLight[2]) * orbitTilt, z];
}

type Props = {
  sections: Section[];
  selectedSlug: string | null;
  hoveredSlug: string | null;
  phase: Phase;
  arrivingFromWarp: boolean;
  reducedMotion: boolean;
  mobile: boolean;
  onHover: (slug: string | null) => void;
  onActivate: (slug: string) => void;
  onArrive: () => void;
  onReturn: () => void;
  onContextLost: () => void;
  onReady: () => void;
  onFirstTexturedFrame: () => void;
};

function makePointTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.18, "rgba(255,248,225,.92)");
  gradient.addColorStop(0.5, "rgba(255,196,120,.34)");
  gradient.addColorStop(1, "rgba(255,160,90,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  return texture;
}

function RevealAfterHomeFrame({ onRevealed }: { onRevealed: () => void }) {
  const count = useRef(0);
  const fired = useRef(false);
  useFrame(() => {
    if (fired.current) return;
    count.current += 1;
    // Wait 2 rendered WebGL frames with all textures uploaded to GPU before lifting the veil
    if (count.current >= 2) {
      fired.current = true;
      requestAnimationFrame(() => {
        revealArrival();
        onRevealed();
      });
    }
  });
  return null;
}

function Sun({ map, animate }: { map: Texture; animate: boolean }) {
  const corona = useMemo(makePointTexture, []);
  const outerCorona = useRef<Sprite>(null);
  const flareRing = useRef<Group>(null);
  useEffect(() => () => corona?.dispose(), [corona]);

  useFrame(({ clock }, delta) => {
    if (!animate) return;
    const t = clock.getElapsedTime();
    if (outerCorona.current) {
      const pulse = 7.1 + Math.sin(t * 1.45) * 0.45;
      outerCorona.current.scale.set(pulse, pulse, 1);
    }
    if (flareRing.current) {
      flareRing.current.rotation.z += Math.min(delta, 0.05) * 0.14;
    }
  });

  return (
    <group position={mainLight}>
      <mesh>
        <sphereGeometry args={[1.04, 40, 24]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      <group ref={flareRing} rotation={[0.45, 0.2, 0]}>
        <mesh>
          <ringGeometry args={[1.22, 1.34, 64]} />
          <meshBasicMaterial
            color="#ffd48a"
            transparent
            opacity={0.28}
            side={DoubleSide}
            depthWrite={false}
            blending={AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>
      {corona && (
        <>
          <sprite ref={outerCorona} scale={[7.1, 7.1, 1]}>
            <spriteMaterial
              map={corona}
              color="#f6b675"
              transparent
              opacity={0.44}
              depthWrite={false}
              blending={AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
          <sprite scale={[12.5, 2.2, 1]}>
            <spriteMaterial
              map={corona}
              color="#ffe6bd"
              transparent
              opacity={0.18}
              depthWrite={false}
              blending={AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        </>
      )}
    </group>
  );
}

function OrbitingMoonlet({ map, animate, mobile }: { map: Texture; animate: boolean; mobile: boolean }) {
  const pivotRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (animate && pivotRef.current) {
      pivotRef.current.rotation.y += Math.min(delta, 0.05) * 0.42;
    }
  });
  return (
    <group ref={pivotRef} rotation={[0.22, 0.8, -0.15]}>
      <group position={[mobile ? 1.35 : 2.1, 0.12, 0]}>
        <PlanetBody surface="moon" map={map} mobile={mobile} radius={mobile ? 0.14 : 0.22} animate={animate} />
      </group>
    </group>
  );
}

function Orbit({ position, active, color }: { position: Section["position"]; active?: boolean; color?: string }) {
  const geometry = useMemo(() => {
    const radius = Math.hypot(position[0] - mainLight[0], position[2] - mainLight[2]);
    const vertices = Array.from({ length: 128 }, (_, index) => {
      const angle = (index / 128) * Math.PI * 2;
      const z = Math.sin(angle) * radius;
      return new Vector3(...orbitPosition(mainLight[0] + Math.cos(angle) * radius, mainLight[2] + z));
    });
    return new BufferGeometry().setFromPoints(vertices);
  }, [position]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineLoop geometry={geometry}>
      <lineBasicMaterial
        color={active && color ? color : "#a8a0b9"}
        opacity={active ? 0.46 : 0.16}
        transparent
        depthWrite={false}
      />
    </lineLoop>
  );
}

function CameraRig({
  sections,
  selectedSlug,
  phase,
  arrivingFromWarp,
  reducedMotion,
  mobile,
  onArrive,
  onReturn,
}: Pick<
  Props,
  "sections" | "selectedSlug" | "phase" | "arrivingFromWarp" | "reducedMotion" | "mobile" | "onArrive" | "onReturn"
>) {
  const { camera } = useThree();
  const goal = useRef(new Vector3(0, 0, 0));
  const look = useRef(new Vector3(0, 0, -18));
  const home = useRef(new Vector3(0, 0, 0));
  const homeLook = useRef(new Vector3(0, 0, -18));
  const pointer = useRef({ x: 0, y: 0 });
  const previousPhase = useRef(phase);
  const elapsed = useRef(0);
  const introPositioned = useRef(false);
  const fromPosition = useRef(new Vector3());
  const fromLook = useRef(new Vector3(0, 0, -18));
  const controlOne = useRef(new Vector3());
  const controlTwo = useRef(new Vector3());
  const pathEnd = useRef(new Vector3());
  const pathLookEnd = useRef(new Vector3(0, 0, -18));

  // Gentle arrival glide-in when returning from a subpage via warp
  useEffect(() => {
    if (arrivingFromWarp && !reducedMotion && !introPositioned.current) {
      introPositioned.current = true;
      camera.position.set(0, 0.85, 4.6);
      look.current.set(0, 0.2, -19);
    }
  }, [arrivingFromWarp, camera, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || mobile) return;
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      pointer.current.y = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion, mobile]);

  useFrame(({ clock }, delta) => {
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
      camera.position
        .copy(fromPosition.current)
        .multiplyScalar(inverse ** 3)
        .addScaledVector(controlOne.current, 3 * inverse * inverse * eased)
        .addScaledVector(controlTwo.current, 3 * inverse * eased * eased)
        .addScaledVector(pathEnd.current, eased ** 3);
      look.current.lerpVectors(fromLook.current, pathLookEnd.current, eased);
      if (raw === 1 && previous < duration) {
        if (phase === "travel") onArrive();
        else onReturn();
      }
    } else {
      const t = reducedMotion ? 0 : clock.getElapsedTime();
      const swayX = reducedMotion ? 0 : pointer.current.x * 0.55 + Math.sin(t * 0.22) * 0.18;
      const swayY = reducedMotion ? 0 : -pointer.current.y * 0.35 + Math.cos(t * 0.18) * 0.12;
      goal.current.set(swayX, swayY, 0);
      const targetLook = homeLook.current.clone();
      targetLook.x += swayX * 0.45;
      targetLook.y += swayY * 0.45;
      const settleRate = 1 - Math.exp(-delta * 3.1);
      look.current.lerp(targetLook, settleRate);
      camera.position.lerp(goal.current, settleRate);
    }
    camera.lookAt(look.current);
  });

  return null;
}

function SolarSystemContent({
  sceneSections,
  selectedSlug,
  hoveredSlug,
  phase,
  arrivingFromWarp,
  reducedMotion,
  mobile,
  onHover,
  onActivate,
  onArrive,
  onReturn,
  onFirstTexturedFrame,
}: {
  sceneSections: Section[];
  selectedSlug: string | null;
  hoveredSlug: string | null;
  phase: Phase;
  arrivingFromWarp: boolean;
  reducedMotion: boolean;
  mobile: boolean;
  onHover: (slug: string | null) => void;
  onActivate: (slug: string) => void;
  onArrive: () => void;
  onReturn: () => void;
  onFirstTexturedFrame: () => void;
}) {
  // Preload all solar system textures together so every planet appears fully rendered on frame 1
  const textures = useSolarTextures(HOME_TEXTURE_FILES);
  const textureFor = (file: string) => textures[HOME_TEXTURE_FILES.indexOf(file)];
  const ringMap = textureFor("saturn-ring");

  return (
    <>
      <SolarSky map={textureFor("milky-way")} />
      <TwinklingStars count={mobile ? 380 : 900} animate={!reducedMotion} />
      <ShootingStars enabled={!reducedMotion && !mobile} />
      <WarpStreaks active={phase === "travel" && !reducedMotion} />

      <ambientLight intensity={0.84} />
      <pointLight position={mainLight} intensity={2.85} color="#fff1da" decay={0} />
      <Sun map={textureFor("sun")} animate={!reducedMotion} />

      {overviewBodies.map(({ surface, radius, desktop, mobile: compact }) => {
        const position = orbitPosition(...(mobile ? compact : desktop));
        return (
          <group key={surface}>
            <Orbit position={position} />
            <group position={position}>
              <PlanetBody
                surface={surface}
                map={textureFor(planetSurfaces[surface].file)}
                ringMap={ringMap}
                mobile={mobile}
                radius={radius * (mobile ? 0.64 : 1)}
                animate={!reducedMotion}
              />
            </group>
          </group>
        );
      })}

      {sceneSections.map((section, index) => {
        const active = hoveredSlug === section.slug || selectedSlug === section.slug;
        return (
          <group key={section.slug}>
            <Orbit position={section.position} active={active} color={section.color} />
            <group position={section.position}>
              <PlanetBody
                surface={section.surface}
                map={textureFor(planetSurfaces[section.surface].file)}
                ringMap={ringMap}
                mobile={mobile}
                radius={(mobile ? 0.62 : 1) * ([1.16, 0.94, 1.02][index] ?? 1)}
                emphasis={active ? 1.18 : 1}
                highlighted={active}
                accentColor={section.color}
                animate={!reducedMotion}
                onPointerOver={(event) => {
                  event.stopPropagation();
                  document.body.style.cursor = "pointer";
                  onHover(section.slug);
                }}
                onPointerOut={() => {
                  document.body.style.cursor = "";
                  onHover(null);
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onActivate(section.slug);
                }}
              />
              {section.surface === "earth" && (
                <OrbitingMoonlet map={textureFor("moon")} animate={!reducedMotion} mobile={mobile} />
              )}
            </group>
          </group>
        );
      })}

      <CameraRig
        sections={sceneSections}
        selectedSlug={selectedSlug}
        phase={phase}
        arrivingFromWarp={arrivingFromWarp}
        reducedMotion={reducedMotion}
        mobile={mobile}
        onArrive={onArrive}
        onReturn={onReturn}
      />

      {!mobile && !reducedMotion && (
        <OptionalEffectsBoundary>
          <TravelEffects traveling={phase === "travel"} />
        </OptionalEffectsBoundary>
      )}

      <RevealAfterHomeFrame onRevealed={onFirstTexturedFrame} />
    </>
  );
}

export function StarfieldScene(props: Props) {
  const {
    sections,
    selectedSlug,
    hoveredSlug,
    phase,
    arrivingFromWarp,
    reducedMotion,
    mobile,
    onHover,
    onActivate,
    onArrive,
    onReturn,
    onContextLost,
    onReady,
    onFirstTexturedFrame,
  } = props;

  const sceneSections = useMemo(
    () =>
      sections.map((section, index) => {
        const [x, , z] = section.position;
        const depth = mobile ? [-18, -18.6, -13.8][index] ?? z : z;
        const position = orbitPosition(mobile ? [-2.15, 2.2, 0.2][index] ?? x : x, depth);
        return { ...section, position };
      }),
    [mobile, sections],
  );

  useEffect(
    () => () => {
      document.body.style.cursor = "";
    },
    [],
  );

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
      <Suspense fallback={null}>
        <SolarSystemContent
          sceneSections={sceneSections}
          selectedSlug={selectedSlug}
          hoveredSlug={hoveredSlug}
          phase={phase}
          arrivingFromWarp={arrivingFromWarp}
          reducedMotion={reducedMotion}
          mobile={mobile}
          onHover={onHover}
          onActivate={onActivate}
          onArrive={onArrive}
          onReturn={onReturn}
          onFirstTexturedFrame={onFirstTexturedFrame}
        />
      </Suspense>
    </Canvas>
  );
}
