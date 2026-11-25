import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import type { Texture } from "three";
import type { Section } from "../data/sections";
import type { PlanetSurface } from "../data/planetSurfaces";
import { planetSurfaces } from "../data/planetSurfaces";
import { sectionTextureFiles } from "../data/solarTextures";
import { SolarSky } from "./SolarSky";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { PlanetBody, useSolarTextures } from "./PlanetBody";
import { revealArrival } from "../travelHandoff";

type Props = { section: Section };

function RevealAfterSceneFrame() {
  const frame = useRef<number | null>(null);
  useFrame(() => {
    if (frame.current === null) frame.current = requestAnimationFrame(revealArrival);
  });
  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);
  return null;
}

const desktopPositions: [number, number, number][] = [
  [-5.1, 1.2, -14],
  [5.1, 0.3, -16],
  [1.1, -2.4, -15],
];

const mobilePositions: [number, number, number][] = [
  [-1.95, 0.7, -13],
  [2.15, -0.45, -15],
  [0.36, -1.72, -13],
];

const sectionLight: [number, number, number] = [-11, 6, -9];

function ContentPlanet({
  position,
  surface,
  map,
  ringMap,
  mobile,
  selected,
  reducedMotion,
  onSelect,
}: {
  position: [number, number, number];
  surface: PlanetSurface;
  map: Texture;
  ringMap?: Texture;
  mobile: boolean;
  selected: boolean;
  reducedMotion: boolean;
  onSelect: () => void;
}) {
  return (
    <group position={position}>
      <PlanetBody
        surface={surface}
        map={map}
        ringMap={ringMap}
        radius={mobile ? 0.52 : 0.72}
        emphasis={selected ? 1.27 : 1}
        mobile={mobile}
        animate={!reducedMotion}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => { document.body.style.cursor = ""; }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      />
    </group>
  );
}

function SectionCamera({ positions, selectedIndex, reducedMotion }: { positions: [number, number, number][]; selectedIndex: number | null; reducedMotion: boolean }) {
  const { camera } = useThree();
  const targetPosition = useRef(new Vector3(0, 0, 0));
  const targetLook = useRef(new Vector3(0, 0, -19));
  const currentLook = useRef(new Vector3(0, 0, -19));

  useFrame((_, delta) => {
    const selected = selectedIndex === null ? null : positions[selectedIndex];
    if (selected) {
      targetPosition.current.set(selected[0] * 0.08, selected[1] * 0.08, -1.15);
      targetLook.current.set(selected[0] * 0.13, selected[1] * 0.13, -19);
    } else {
      targetPosition.current.set(0, 0, 0);
      targetLook.current.set(0, 0, -19);
    }
    const ease = 1 - Math.exp(-delta * 2.8);
    if (reducedMotion) {
      camera.position.copy(targetPosition.current);
      currentLook.current.copy(targetLook.current);
      camera.lookAt(currentLook.current);
      return;
    }
    camera.position.lerp(targetPosition.current, ease);
    currentLook.current.lerp(targetLook.current, ease);
    camera.lookAt(currentLook.current);
  });
  return null;
}

function SectionSystem({ section, mobile, selectedIndex, reducedMotion, choose }: {
  section: Section;
  mobile: boolean;
  selectedIndex: number | null;
  reducedMotion: boolean;
  choose: (index: number | null) => void;
}) {
  const { width, height } = useThree((state) => state.size);
  const files = useMemo(() => sectionTextureFiles(section), [section]);
  const textures = useSolarTextures(files);
  const textureFor = (file: string) => textures[files.indexOf(file)];
  const ringMap = textureFor("saturn-ring");
  const horizontalScale = Math.min(1, width / Math.max(height, 1) / (mobile ? 0.46 : 1.31));
  const slots = mobile ? mobilePositions : desktopPositions;
  const positions = useMemo(() => section.items.map((_, index): [number, number, number] => {
    const [x, y, z] = slots[index % slots.length];
    return [x * horizontalScale, y, z];
  }), [section.items, slots, horizontalScale]);

  return (
    <>
      <SolarSky map={textureFor("milky-way")} />
      <ambientLight intensity={0.55} />
      <pointLight position={sectionLight} intensity={2.75} decay={0} color="#fff3dc" />
      <group position={[0, 0, -19]}>
        <PlanetBody surface={section.surface} map={textureFor(planetSurfaces[section.surface].file)}
          ringMap={ringMap} radius={mobile ? 1.45 : 1.9}
          mobile={mobile} animate={!reducedMotion} />
      </group>
      {section.items.map((item, index) => (
        <ContentPlanet key={item.title} position={positions[index]} surface={item.surface}
          map={textureFor(planetSurfaces[item.surface].file)} ringMap={ringMap}
          mobile={mobile} selected={selectedIndex === index}
          reducedMotion={reducedMotion} onSelect={() => choose(index)} />
      ))}
      <SectionCamera positions={positions} selectedIndex={selectedIndex} reducedMotion={reducedMotion} />
      <RevealAfterSceneFrame />
    </>
  );
}

export function SectionUniverseExperience({ section }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 700px)").matches);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [sceneAvailable, setSceneAvailable] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setMobile(media.matches);
      setReducedMotion(motion.matches);
    };
    update();
    media.addEventListener("change", update);
    motion.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
      motion.removeEventListener("change", update);
      document.body.style.cursor = "";
    };
  }, []);

  const choose = useCallback((index: number | null) => {
    setSelectedIndex(index);
    document.querySelectorAll<HTMLAnchorElement>("[data-content-index]").forEach((link) => {
      const current = Number(link.dataset.contentIndex) === index;
      link.classList.toggle("is-selected", current);
      if (current) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }, []);

  useEffect(() => {
    const cleanup: (() => void)[] = [];
    const links = document.querySelectorAll<HTMLAnchorElement>("[data-content-index]");
    links.forEach((link) => {
      const index = Number(link.dataset.contentIndex);
      if (!Number.isInteger(index)) return;
      const activate = (event: Event) => {
        if (event instanceof MouseEvent && event.type === "click") {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
        }
        choose(index);
      };
      link.addEventListener("click", activate);
      cleanup.push(() => {
        link.removeEventListener("click", activate);
      });
    });
    return () => cleanup.forEach((remove) => remove());
  }, [section.items.length, choose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") choose(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [choose]);

  const selected = selectedIndex === null ? null : section.items[selectedIndex];

  return (
    <div className="section-universe">
      {sceneAvailable && (
        <SceneErrorBoundary onError={() => { revealArrival(); setSceneAvailable(false); }}>
          <Canvas
            className="section-canvas"
            camera={{ position: [0, 0, 0], fov: 54, near: 0.1, far: 120 }}
            dpr={mobile ? [1, 1.2] : [1, 1.5]}
            gl={{ alpha: true, antialias: !mobile, powerPreference: "low-power" }}
          >
            <Suspense fallback={null}>
              <SectionSystem section={section} mobile={mobile} selectedIndex={selectedIndex}
                reducedMotion={reducedMotion} choose={choose} />
            </Suspense>
          </Canvas>
        </SceneErrorBoundary>
      )}
      {selected && (
        <aside className="content-orbit-preview" aria-live="polite">
          <span>{selected.meta}</span>
          <strong>{selected.title}</strong>
          <button type="button" onClick={() => choose(null)} aria-label="关闭内容预览">×</button>
        </aside>
      )}
      {!sceneAvailable && <span className="scene-fallback-status">星系视图暂不可用，内容入口仍可访问。</span>}
    </div>
  );
}
