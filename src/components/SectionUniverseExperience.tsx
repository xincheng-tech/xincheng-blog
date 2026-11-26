import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { BufferGeometry, Vector3 } from "three";
import type { Group, Texture } from "three";
import type { SatelliteSpec, Section } from "../data/sections";
import { planetSurfaces } from "../data/planetSurfaces";
import { sectionTextureFiles } from "../data/solarTextures";
import { sitePath } from "../sitePath";
import { SolarSky } from "./SolarSky";
import { OptionalEffectsBoundary, SceneErrorBoundary } from "./SceneErrorBoundary";
import { PlanetBody, useSolarTextures } from "./PlanetBody";
import { TravelEffects } from "./TravelEffects";
import { revealArrival } from "../travelHandoff";
import ShinyText from "./react-bits/ShinyText";
import Magnet from "./react-bits/Magnet";
import { CosmicSynthPlayer } from "./CosmicSynthPlayer";

type Props = { section: Section };

function RevealAfterSceneFrame() {
  const frame = useRef<number | null>(null);
  useFrame(() => {
    if (frame.current === null) frame.current = requestAnimationFrame(revealArrival);
  });
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );
  return null;
}

// Zero-WebGL GPU-composited 3D Holographic Foil Artwork Card (0ms shader/context overhead)
function HoloArtCard({ src, alt, accent }: { src: string; alt: string; accent: string }) {
  const rotorRef = useRef<HTMLDivElement>(null);

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = rotorRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
    const ny = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
    el.style.setProperty("--rx", `${(-ny * 18).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(nx * 18).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${((nx + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${((ny + 0.5) * 100).toFixed(1)}%`);
  };

  const onLeave = () => {
    const el = rotorRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--gx", "35%");
    el.style.setProperty("--gy", "25%");
  };

  return (
    <div
      className="holo-foil-card"
      style={{ "--foil-accent": accent } as CSSProperties}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div ref={rotorRef} className="holo-foil-card__rotor">
        <img src={src} alt={alt} width={106} height={148} decoding="async" draggable={false} />
        <span className="holo-foil-card__sheen" aria-hidden="true" />
        <span className="holo-foil-card__frame" aria-hidden="true" />
      </div>
    </div>
  );
}

type OrbitResetSignal = { version: number };

function FreeOrbitRig({
  defaultDistance,
  deckOpen,
  mobile,
  reducedMotion,
  resetSignal,
  onDraggingChange,
}: {
  defaultDistance: number;
  deckOpen: boolean;
  mobile: boolean;
  reducedMotion: boolean;
  resetSignal: OrbitResetSignal;
  onDraggingChange: (dragging: boolean) => void;
}) {
  const { camera, gl } = useThree();

  const state = useRef({
    azimuth: 0.32,
    polar: 0.24,
    distance: defaultDistance,
    targetAzimuth: 0.32,
    targetPolar: 0.24,
    targetDistance: defaultDistance,
    velAzimuth: 0,
    velPolar: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    pinchDist: 0,
  });

  const lookTarget = useRef(new Vector3(0, 0, 0));
  const desiredLook = useRef(new Vector3(0, 0, 0));

  useEffect(() => {
    const s = state.current;
    s.targetAzimuth = 0.32;
    s.targetPolar = 0.24;
    s.targetDistance = defaultDistance;
    s.velAzimuth = 0;
    s.velPolar = 0;
  }, [defaultDistance, resetSignal.version]);

  useEffect(() => {
    const onDepart = () => {
      const s = state.current;
      s.targetDistance = Math.min(24, s.distance + 6.5);
      s.velAzimuth = 0.04;
    };
    window.addEventListener("xingchen:depart", onDepart);
    return () => window.removeEventListener("xingchen:depart", onDepart);
  }, []);

  useEffect(() => {
    const dom = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dom.setPointerCapture?.(e.pointerId);
      const s = state.current;
      if (pointers.size === 1) {
        s.dragging = true;
        s.lastX = e.clientX;
        s.lastY = e.clientY;
        s.velAzimuth = 0;
        s.velPolar = 0;
        onDraggingChange(true);
      } else if (pointers.size === 2) {
        const pts = [...pointers.values()];
        s.pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const s = state.current;

      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (s.pinchDist > 0) {
          const scale = s.pinchDist / Math.max(10, dist);
          s.targetDistance = Math.max(4.8, Math.min(22, s.targetDistance * scale));
        }
        s.pinchDist = dist;
        return;
      }

      if (!s.dragging) return;
      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      s.lastX = e.clientX;
      s.lastY = e.clientY;

      const sensitivity = 0.0068;
      s.targetAzimuth -= dx * sensitivity;
      s.targetPolar = Math.max(-1.24, Math.min(1.24, s.targetPolar + dy * sensitivity));
      s.velAzimuth = -dx * sensitivity * 0.45;
      s.velPolar = dy * sensitivity * 0.35;
    };

    const onPointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      dom.releasePointerCapture?.(e.pointerId);
      if (pointers.size === 0) {
        state.current.dragging = false;
        state.current.pinchDist = 0;
        onDraggingChange(false);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = state.current;
      s.targetDistance = Math.max(4.8, Math.min(22, s.targetDistance + e.deltaY * 0.0065));
    };

    const onDblClick = () => {
      const s = state.current;
      s.targetAzimuth = 0.32;
      s.targetPolar = 0.24;
      s.targetDistance = defaultDistance;
      s.velAzimuth = 0;
      s.velPolar = 0;
    };

    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("pointercancel", onPointerUp);
    dom.addEventListener("wheel", onWheel, { passive: false });
    dom.addEventListener("dblclick", onDblClick);

    return () => {
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("pointercancel", onPointerUp);
      dom.removeEventListener("wheel", onWheel);
      dom.removeEventListener("dblclick", onDblClick);
    };
  }, [defaultDistance, gl, onDraggingChange]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = state.current;

    if (!s.dragging && !reducedMotion) {
      s.targetAzimuth += s.velAzimuth + dt * 0.035;
      s.targetPolar = Math.max(-1.24, Math.min(1.24, s.targetPolar + s.velPolar));
      const friction = Math.exp(-dt * 4.5);
      s.velAzimuth *= friction;
      s.velPolar *= friction;
    }

    const smooth = reducedMotion ? 1 : 1 - Math.exp(-dt * 9);
    s.azimuth += (s.targetAzimuth - s.azimuth) * smooth;
    s.polar += (s.targetPolar - s.polar) * smooth;
    s.distance += (s.targetDistance - s.distance) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 7));

    const shiftOffset = deckOpen && !mobile ? 2.15 : 0;
    const cosP = Math.cos(s.polar);
    const sinP = Math.sin(s.polar);
    const sinA = Math.sin(s.azimuth);
    const cosA = Math.cos(s.azimuth);

    desiredLook.current.set(cosA * shiftOffset, 0, -sinA * shiftOffset);
    lookTarget.current.lerp(desiredLook.current, reducedMotion ? 1 : 1 - Math.exp(-dt * 5.5));

    camera.position.set(
      lookTarget.current.x + s.distance * cosP * sinA,
      lookTarget.current.y + s.distance * sinP,
      lookTarget.current.z + s.distance * cosP * cosA,
    );
    camera.lookAt(lookTarget.current);
  });

  return null;
}

function SatelliteOrbitRing({
  spec,
  scaleFactor,
  highlighted,
  accentColor,
}: {
  spec: SatelliteSpec;
  scaleFactor: number;
  highlighted: boolean;
  accentColor: string;
}) {
  const r = spec.orbitRadius * scaleFactor;
  const geometry = useMemo(() => {
    const pts = Array.from({ length: 128 }, (_, idx) => {
      const a = (idx / 128) * Math.PI * 2;
      return new Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
    });
    return new BufferGeometry().setFromPoints(pts);
  }, [r]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineLoop geometry={geometry} rotation={[spec.inclination, 0, spec.inclination * 0.6]}>
      <lineBasicMaterial
        color={highlighted ? accentColor : "#8fa0c9"}
        transparent
        opacity={highlighted ? 0.55 : 0.18}
        depthWrite={false}
      />
    </lineLoop>
  );
}

function RealSatelliteBody({
  spec,
  scaleFactor,
  map,
  mobile,
  reducedMotion,
  accentColor,
  hovered,
  onHover,
}: {
  spec: SatelliteSpec;
  scaleFactor: number;
  map: Texture;
  mobile: boolean;
  reducedMotion: boolean;
  accentColor: string;
  hovered: boolean;
  onHover: (inside: boolean) => void;
}) {
  const orbitGroupRef = useRef<Group>(null);
  const angleRef = useRef(spec.phase);
  const r = spec.orbitRadius * scaleFactor;

  useFrame((_, delta) => {
    if (!reducedMotion) {
      angleRef.current += Math.min(delta, 0.05) * spec.speed;
    }
    if (orbitGroupRef.current) {
      orbitGroupRef.current.position.set(
        Math.cos(angleRef.current) * r,
        0,
        Math.sin(angleRef.current) * r,
      );
    }
  });

  return (
    <group rotation={[spec.inclination, 0, spec.inclination * 0.6]}>
      <SatelliteOrbitRing spec={spec} scaleFactor={scaleFactor} highlighted={hovered} accentColor={accentColor} />
      <group ref={orbitGroupRef} position={[Math.cos(spec.phase) * r, 0, Math.sin(spec.phase) * r]}>
        <PlanetBody
          surface={spec.surface}
          map={map}
          radius={spec.radius * (mobile ? 0.85 : 1)}
          emphasis={hovered ? 1.25 : 1}
          highlighted={hovered}
          accentColor={accentColor}
          mobile={mobile}
          animate={!reducedMotion}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(true);
          }}
          onPointerOut={() => onHover(false)}
        />
      </group>
    </group>
  );
}

function SectionSystem({
  section,
  mobile,
  deckOpen,
  reducedMotion,
  resetSignal,
  onDraggingChange,
  onHoveredMoonChange,
}: {
  section: Section;
  mobile: boolean;
  deckOpen: boolean;
  reducedMotion: boolean;
  resetSignal: OrbitResetSignal;
  onDraggingChange: (dragging: boolean) => void;
  onHoveredMoonChange: (moonName: string | null) => void;
}) {
  const [hoveredSatIdx, setHoveredSatIdx] = useState<number | null>(null);
  const files = useMemo(() => sectionTextureFiles(section), [section]);
  const textures = useSolarTextures(files);
  const textureFor = (file: string) => textures[files.indexOf(file)];
  const ringMap = textureFor("saturn-ring");

  const planetRadius = section.surface === "saturn" ? (mobile ? 1.18 : 1.46) : mobile ? 1.26 : 1.56;
  const orbitScale = mobile ? 0.72 : 0.86;
  const defaultDistance =
    section.surface === "saturn" ? (mobile ? 13.4 : 12.4) : mobile ? 10.4 : 9.6;

  return (
    <>
      <SolarSky map={textureFor("milky-way")} />

      <ambientLight intensity={0.42} color="#b9ccff" />
      <directionalLight position={[-12, 6, 10]} intensity={2.6} color="#fff3dc" />
      <directionalLight position={[10, -4, -12]} intensity={0.45} color="#5b84d6" />

      <PlanetBody
        surface={section.surface}
        map={textureFor(planetSurfaces[section.surface].file)}
        ringMap={ringMap}
        radius={planetRadius}
        accentColor={section.color}
        mobile={mobile}
        animate={!reducedMotion}
      />

      {section.satellites.map((sat, idx) => (
        <RealSatelliteBody
          key={sat.surface}
          spec={sat}
          scaleFactor={orbitScale}
          map={textureFor(planetSurfaces[sat.surface].file)}
          mobile={mobile}
          reducedMotion={reducedMotion}
          accentColor={section.color}
          hovered={hoveredSatIdx === idx}
          onHover={(inside) => {
            setHoveredSatIdx(inside ? idx : null);
            onHoveredMoonChange(inside ? planetSurfaces[sat.surface].name : null);
          }}
        />
      ))}

      <FreeOrbitRig
        defaultDistance={defaultDistance}
        deckOpen={deckOpen}
        mobile={mobile}
        reducedMotion={reducedMotion}
        resetSignal={resetSignal}
        onDraggingChange={onDraggingChange}
      />

      {!mobile && !reducedMotion && (
        <OptionalEffectsBoundary>
          <TravelEffects traveling={false} />
        </OptionalEffectsBoundary>
      )}
      <RevealAfterSceneFrame />
    </>
  );
}

export function SectionUniverseExperience({ section }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [displayIndex, setDisplayIndex] = useState<number>(0);
  const [pulseSeq, setPulseSeq] = useState<number>(0);
  const [dragging, setDragging] = useState(false);
  const [hoveredMoon, setHoveredMoon] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState<OrbitResetSignal>({ version: 0 });
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 700px)").matches);
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [sceneAvailable, setSceneAvailable] = useState(true);
  const activeIndexRef = useRef<number | null>(null);

  const planetName = planetSurfaces[section.surface].name;

  // Preload & pre-decode all item cover artworks once on mount so opening any card has 0ms decode jank
  useEffect(() => {
    for (const item of section.items) {
      const img = new Image();
      img.decoding = "async";
      img.src = sitePath(item.art);
      img.decode?.().catch(() => {});
    }
  }, [section.items]);

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
    activeIndexRef.current = index;

    document.querySelectorAll<HTMLAnchorElement>("[data-content-index]").forEach((link) => {
      if (!link.dataset.defaultCursorLabel) {
        link.dataset.defaultCursorLabel = link.getAttribute("data-cursor-label") ?? "";
      }
      const current = Number(link.dataset.contentIndex) === index;
      link.classList.toggle("is-selected", current);
      link.setAttribute("aria-expanded", current ? "true" : "false");
      if (current) {
        link.setAttribute("aria-current", "true");
        link.setAttribute("data-cursor-label", "COLLAPSE // 再次点击收回");
      } else {
        link.removeAttribute("aria-current");
        link.setAttribute("data-cursor-label", link.dataset.defaultCursorLabel);
      }
    });

    if (index !== null) {
      setDisplayIndex(index);
      setPulseSeq((s) => s + 1);
    }
    setOpenIndex(index);
  }, []);

  useEffect(() => {
    const match = /^#content-item-(\d+)$/.exec(window.location.hash);
    if (match) {
      const idx = Number(match[1]);
      if (idx >= 0 && idx < section.items.length) choose(idx);
    }
  }, [choose, section.items.length]);

  useEffect(() => {
    const cleanup: (() => void)[] = [];
    const links = document.querySelectorAll<HTMLAnchorElement>("[data-content-index]");
    links.forEach((link) => {
      const index = Number(link.dataset.contentIndex);
      if (!Number.isInteger(index)) return;
      link.setAttribute("aria-expanded", activeIndexRef.current === index ? "true" : "false");
      const activate = (event: Event) => {
        if (event instanceof MouseEvent && event.type === "click") {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
        }
        choose(activeIndexRef.current === index ? null : index);
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
      const current = activeIndexRef.current;
      if (event.key === "Escape") {
        if (current !== null) choose(null);
      } else if (current !== null && event.key === "ArrowRight") {
        choose((current + 1) % section.items.length);
      } else if (current !== null && event.key === "ArrowLeft") {
        choose((current - 1 + section.items.length) % section.items.length);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [choose, section.items.length]);

  const deckOpen = openIndex !== null;
  const shownItem = section.items[displayIndex] ?? section.items[0];

  return (
    <div className={"section-universe" + (dragging ? " is-dragging-3d" : "")}>
      {sceneAvailable && (
        <SceneErrorBoundary
          onError={() => {
            revealArrival();
            setSceneAvailable(false);
          }}
        >
          <Canvas
            className="section-canvas"
            camera={{ position: [0, 2.2, 10], fov: 48, near: 0.1, far: 160 }}
            dpr={mobile ? [1, 1.25] : [1, 1.6]}
            gl={{ alpha: true, antialias: !mobile, powerPreference: "low-power" }}
          >
            <Suspense fallback={null}>
              <SectionSystem
                section={section}
                mobile={mobile}
                deckOpen={deckOpen}
                reducedMotion={reducedMotion}
                resetSignal={resetSignal}
                onDraggingChange={setDragging}
                onHoveredMoonChange={setHoveredMoon}
              />
            </Suspense>
          </Canvas>
        </SceneErrorBoundary>
      )}

      {sceneAvailable && (
        <div className="orbit-3d-hud">
          <span className="orbit-3d-hud__hint">
            <i aria-hidden="true" />
            {hoveredMoon
              ? `SATELLITE LOCK // ${hoveredMoon}`
              : "3D ORBIT // 拖拽自由旋转 · 滚轮缩放"}
          </span>
          <button
            type="button"
            className="orbit-3d-hud__reset"
            data-cursor-label="RESET // 重置视角"
            onClick={() => setResetSignal((prev) => ({ version: prev.version + 1 }))}
          >
            重置视角
          </button>
        </div>
      )}

      {shownItem && (
        <aside
          className={"content-orbit-preview content-hologram-deck" + (deckOpen ? " is-open" : "")}
          aria-hidden={!deckOpen}
          inert={!deckOpen ? true : undefined}
        >
          <div
            className="hologram-laser-shell"
            style={{ "--deck-accent": section.color } as CSSProperties}
          >
            <span className="hologram-corner hologram-corner--tl" aria-hidden="true" />
            <span className="hologram-corner hologram-corner--tr" aria-hidden="true" />
            <span className="hologram-corner hologram-corner--bl" aria-hidden="true" />
            <span className="hologram-corner hologram-corner--br" aria-hidden="true" />
            <span key={pulseSeq} className="hologram-scanbeam" aria-hidden="true" />

            <div className="hologram-deck__inner">
              <div className="hologram-deck__header hologram-stagger-1">
                <div className="hologram-deck__badge">
                  <span className="hud-status-led" style={{ background: section.color }} aria-hidden="true" />
                  <ShinyText
                    text={`NODE.0${displayIndex + 1} // ${planetName} · ${shownItem.meta}`}
                    color={section.color}
                    shineColor="#ffffff"
                    speed={2.8}
                    className="hologram-deck__meta"
                  />
                </div>
                <Magnet padding={24} magnetStrength={3} maxOffset={5}>
                  <button
                    type="button"
                    className="hologram-deck__close"
                    onClick={() => choose(null)}
                    aria-label="关闭内容全息舱"
                  >
                    ×
                  </button>
                </Magnet>
              </div>

              <div className="hologram-deck__body hologram-stagger-2">
                {!mobile && (
                  <div className="hologram-deck__art">
                    <HoloArtCard
                      src={sitePath(shownItem.art)}
                      alt={`${planetName} - ${shownItem.title}`}
                      accent={section.color}
                    />
                  </div>
                )}
                <div className="hologram-deck__copy">
                  <strong>{`${planetName} - ${shownItem.title}`}</strong>
                  <p>{shownItem.summary}</p>
                  <div className="hologram-deck__tags">
                    {shownItem.tags.map((tag) => (
                      <span key={tag} className="hologram-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hologram-stagger-3">
                <CosmicSynthPlayer
                  title={deckOpen ? shownItem.title : "__deck_closed__"}
                  frequencyHz={shownItem.frequencyHz}
                  accent={section.color}
                  durationLabel={shownItem.meta}
                  isPodcast={shownItem.isPodcast}
                  chapters={shownItem.chapters}
                />
              </div>

              <div className="hologram-deck__nav hologram-stagger-4">
                <button
                  type="button"
                  onClick={() => choose((displayIndex - 1 + section.items.length) % section.items.length)}
                >
                  ← PREV
                </button>
                <span>
                  0{displayIndex + 1} / 0{section.items.length}
                </span>
                <button
                  type="button"
                  onClick={() => choose((displayIndex + 1) % section.items.length)}
                >
                  NEXT →
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {!sceneAvailable && <span className="scene-fallback-status">星系视图暂不可用，内容入口仍可访问。</span>}
    </div>
  );
}
