import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import type { Section } from "../data/sections";
import { GalaxyBackdrop } from "./StarfieldScene";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { PlanetBody, surfaceFor } from "./PlanetBody";

type Props = { section: Section };

const desktopPositions: [number, number, number][] = [
  [-5.1, 1.2, -14],
  [5.1, 0.3, -16],
  [0.3, -2.8, -14],
];

const mobilePositions: [number, number, number][] = [
  [-1.85, 0.7, -13],
  [2.4, -0.45, -15],
  [-0.15, -2.0, -13],
];

const sectionLight: [number, number, number] = [-11, 6, -9];
const moonSurfaces = ["rock", "ocean", "gas"] as const;

function ContentPlanet({
  position,
  index,
  mobile,
  selected,
  reducedMotion,
  onSelect,
}: {
  position: [number, number, number];
  index: number;
  mobile: boolean;
  selected: boolean;
  reducedMotion: boolean;
  onSelect: () => void;
}) {
  return (
    <group position={position}>
      <PlanetBody
        surface={moonSurfaces[index % moonSurfaces.length]}
        seed={index + 4}
        light={sectionLight}
        radius={(mobile ? 0.49 : 0.67) * (selected ? 1.08 : 1)}
        mobile={mobile}
        animate={!reducedMotion}
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
      targetPosition.current.set(selected[0] * 0.52, selected[1] * 0.52, selected[2] + 4.4);
      targetLook.current.set(...selected);
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

export function SectionUniverseExperience({ section }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 700px)").matches);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [sceneAvailable, setSceneAvailable] = useState(true);
  const positions = useMemo(() => mobile ? mobilePositions : desktopPositions, [mobile]);

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
    };
  }, []);

  const choose = useCallback((index: number | null) => {
    setSelectedIndex(index);
    document.querySelectorAll<HTMLAnchorElement>("[data-content-index]").forEach((link) => {
      link.classList.toggle("is-selected", Number(link.dataset.contentIndex) === index);
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
        <SceneErrorBoundary onError={() => setSceneAvailable(false)}>
          <Canvas
            className="section-canvas"
            camera={{ position: [0, 0, 0], fov: 54, near: 0.1, far: 120 }}
            dpr={mobile ? [1, 1.2] : [1, 1.5]}
            gl={{ alpha: true, antialias: !mobile, powerPreference: "low-power" }}
          >
            <GalaxyBackdrop mobile={mobile} animate={!reducedMotion} />
            <group position={[0, 0, -19]}>
              <PlanetBody surface={surfaceFor(section.slug)} light={sectionLight}
                radius={mobile ? 1.6 : 1.9} mobile={mobile} animate={!reducedMotion}
                ring={section.slug === "podcast"} />
            </group>
            {section.items.map((item, index) => (
              <ContentPlanet
                key={item.title}
                position={positions[index % positions.length]}
                index={index}
                mobile={mobile}
                selected={selectedIndex === index}
                reducedMotion={reducedMotion}
                onSelect={() => choose(index)}
              />
            ))}
            <SectionCamera positions={positions} selectedIndex={selectedIndex} reducedMotion={reducedMotion} />
          </Canvas>
        </SceneErrorBoundary>
      )}
      {selected && (
        <aside className="content-orbit-preview" aria-live="polite">
          <span>{selected.meta}</span>
          <strong>{selected.title}</strong>
          <p>正文正在整理，先在这里留下一个入口。</p>
          <button type="button" onClick={() => choose(null)} aria-label="关闭内容预览">×</button>
        </aside>
      )}
      {!sceneAvailable && <span className="scene-fallback-status">星系视图暂不可用，内容入口仍可访问。</span>}
    </div>
  );
}
