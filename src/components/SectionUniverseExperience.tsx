import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Color, Vector3 } from "three";
import type { Mesh } from "three";
import type { Section } from "../data/sections";
import { GalaxyBackdrop } from "./StarfieldScene";
import { SceneErrorBoundary } from "./SceneErrorBoundary";

type Props = { section: Section };

const desktopPositions: [number, number, number][] = [
  [-5.1, 1.2, -14],
  [5.1, 0.3, -16],
  [0.3, -4.2, -14],
];

const mobilePositions: [number, number, number][] = [
  [-3.4, 0.2, -11],
  [3.4, -0.5, -13],
  [0, -3.4, -11],
];

function CentralPlanet({ color }: { color: string }) {
  const tint = useMemo(() => new Color(color), [color]);
  return (
    <group position={[0, 0, -19]}>
      <mesh>
        <sphereGeometry args={[1.7, 48, 48]} />
        <meshPhysicalMaterial color={tint} emissive={tint} emissiveIntensity={0.1} roughness={0.62} metalness={0.16} clearcoat={0.7} clearcoatRoughness={0.28} />
      </mesh>
      <mesh scale={1.28}>
        <sphereGeometry args={[1.7, 32, 32]} />
        <meshBasicMaterial color={tint} transparent opacity={0.05} depthWrite={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2.15, 0.15, 0.2]}>
        <torusGeometry args={[2.45, 0.022, 6, 120]} />
        <meshBasicMaterial color={tint} transparent opacity={0.44} />
      </mesh>
      <pointLight position={[2.5, 2, 4]} color={tint} intensity={2.4} distance={18} />
    </group>
  );
}

function ContentPlanet({
  position,
  color,
  selected,
  reducedMotion,
  onSelect,
}: {
  position: [number, number, number];
  color: string;
  selected: boolean;
  reducedMotion: boolean;
  onSelect: () => void;
}) {
  const mesh = useRef<Mesh>(null);
  const tint = useMemo(() => new Color(color), [color]);
  useFrame((_, delta) => {
    if (!mesh.current) return;
    const size = selected ? 1.2 : 1;
    if (reducedMotion) {
      mesh.current.scale.setScalar(size);
      return;
    }
    const ease = 1 - Math.exp(-delta * 5);
    mesh.current.scale.setScalar(mesh.current.scale.x + (size - mesh.current.scale.x) * ease);
    mesh.current.rotation.y += delta * 0.12;
  });

  return (
    <group position={position}>
      <mesh
        ref={mesh}
        onPointerEnter={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[0.72, 32, 32]} />
        <meshPhysicalMaterial color={tint} emissive={tint} emissiveIntensity={selected ? 0.35 : 0.14} roughness={0.52} metalness={0.12} clearcoat={0.8} />
      </mesh>
      <mesh rotation={[0.35, 0.2, 0.4]}>
        <torusGeometry args={[1.06, 0.014, 5, 80]} />
        <meshBasicMaterial color={tint} transparent opacity={selected ? 0.88 : 0.44} />
      </mesh>
      <pointLight color={tint} intensity={selected ? 1.35 : 0.55} distance={6} />
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
  const [mobile, setMobile] = useState(false);
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
      const leave = () => {
        if (!link.matches(":focus")) choose(null);
      };
      link.addEventListener("click", activate);
      link.addEventListener("pointerenter", activate);
      link.addEventListener("pointerleave", leave);
      link.addEventListener("focus", activate);
      link.addEventListener("blur", leave);
      cleanup.push(() => {
        link.removeEventListener("click", activate);
        link.removeEventListener("pointerenter", activate);
        link.removeEventListener("pointerleave", leave);
        link.removeEventListener("focus", activate);
        link.removeEventListener("blur", leave);
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
            dpr={mobile ? [1, 1.25] : [1, 1.65]}
            gl={{ alpha: true, antialias: !mobile, powerPreference: "low-power" }}
          >
            <ambientLight intensity={0.48} />
            <directionalLight position={[3, 6, 8]} intensity={1.25} color="#fff4dc" />
            <GalaxyBackdrop mobile={mobile} animate={!reducedMotion} />
            <CentralPlanet color={section.color} />
            {section.items.map((item, index) => (
              <ContentPlanet
                key={item.title}
                position={positions[index % positions.length]}
                color={section.color}
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
