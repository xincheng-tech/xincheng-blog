import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Section } from "../data/sections";
import { sitePath } from "../sitePath";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { RETURN_DURATION_MS, TRAVEL_DURATION_MS } from "./travelTiming";

const StarfieldScene = lazy(() =>
  import("./StarfieldScene").then((module) => ({ default: module.StarfieldScene })),
);

type Phase = "idle" | "preview" | "travel" | "arrived" | "return";

type Props = { sections: Section[] };

export function UniverseExperience({ sections }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneAvailable, setSceneAvailable] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [mobile, setMobile] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const small = window.matchMedia("(max-width: 700px)");
    const update = () => {
      setReducedMotion(motion.matches);
      setMobile(small.matches);
    };
    update();
    motion.addEventListener("change", update);
    small.addEventListener("change", update);
    return () => {
      motion.removeEventListener("change", update);
      small.removeEventListener("change", update);
      if (timer.current) window.clearTimeout(timer.current);
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) setSceneReady(false);
  }, [reducedMotion]);

  useEffect(() => {
    if (!reducedMotion || phase !== "travel" || !selectedSlug) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = undefined;
    setPhase("arrived");
    window.location.assign(sitePath(selectedSlug + "/"));
  }, [phase, reducedMotion, selectedSlug]);

  const onPreview = useCallback((slug: string | null) => {
    if (phase === "travel") return;
    const focusedLink = document.activeElement instanceof HTMLAnchorElement
      ? document.activeElement
      : null;
    if (focusedLink?.dataset.slug && focusedLink.dataset.slug !== slug) return;
    setPreviewSlug(slug);
    setPhase(slug ? "preview" : "idle");
  }, [phase]);

  const activate = useCallback((section: Section) => {
    if (phase === "travel") return;
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = undefined;
    if (reducedMotion || !sceneAvailable || !sceneReady) {
      window.location.assign(sitePath(section.slug + "/"));
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    setSelectedSlug(section.slug);
    setPreviewSlug(section.slug);
    setPhase("travel");
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      setPhase("arrived");
      window.location.assign(sitePath(section.slug + "/"));
    }, TRAVEL_DURATION_MS);
  }, [phase, reducedMotion, sceneAvailable, sceneReady]);

  useEffect(() => {
    const cleanup: (() => void)[] = [];
    for (const section of sections) {
      const link = document.querySelector<HTMLAnchorElement>('[data-slug="' + section.slug + '"]');
      if (!link) continue;

      const click = (event: MouseEvent) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        activate(section);
      };
      const enter = () => onPreview(section.slug);
      const leave = () => {
        if (!link.matches(":focus")) onPreview(null);
      };
      const blur = () => {
        if (!link.matches(":hover")) onPreview(null);
      };
      const keydown = (event: KeyboardEvent) => {
        if ((event.key === " " || event.key === "Spacebar") && !event.repeat) {
          event.preventDefault();
          activate(section);
        }
      };

      link.addEventListener("click", click);
      link.addEventListener("pointerenter", enter);
      link.addEventListener("pointerleave", leave);
      link.addEventListener("focus", enter);
      link.addEventListener("blur", blur);
      link.addEventListener("keydown", keydown);
      cleanup.push(() => {
        link.removeEventListener("click", click);
        link.removeEventListener("pointerenter", enter);
        link.removeEventListener("pointerleave", leave);
        link.removeEventListener("focus", enter);
        link.removeEventListener("blur", blur);
        link.removeEventListener("keydown", keydown);
      });
    }
    return () => cleanup.forEach((remove) => remove());
  }, [sections, activate, onPreview]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || phase === "idle") return;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = undefined;
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
      setPhase("return");
      setSelectedSlug(null);
      setPreviewSlug(null);
      resetTimer.current = window.setTimeout(() => {
        resetTimer.current = undefined;
        setPhase("idle");
      }, reducedMotion ? 0 : RETURN_DURATION_MS);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, reducedMotion]);

  const onSceneError = useCallback(() => setSceneAvailable(false), []);
  const activeSection = sections.find((section) => section.slug === previewSlug);
  return (
    <div className={"universe " + (phase === "travel" ? "is-traveling" : "") + (sceneAvailable ? "" : " scene-fallback")}>
      {sceneAvailable && !reducedMotion && (
        <SceneErrorBoundary onError={onSceneError}>
          <Suspense fallback={null}>
            <div className="scene-layer" aria-hidden="true">
              <StarfieldScene
                sections={sections}
                selectedSlug={selectedSlug}
                phase={phase}
                reducedMotion={reducedMotion}
                mobile={mobile}
                onPreview={onPreview}
                onActivate={(slug) => {
                  const section = sections.find((entry) => entry.slug === slug);
                  if (section) activate(section);
                }}
                onContextLost={onSceneError}
                onReady={() => setSceneReady(true)}
              />
            </div>
          </Suspense>
        </SceneErrorBoundary>
      )}

      {activeSection && phase !== "idle" && (
        <aside className="destination-preview" aria-live="polite">
          <span style={{ color: activeSection.color } as CSSProperties}>DESTINATION</span>
          <strong>{activeSection.name}</strong>
          <p>{activeSection.intro}</p>
        </aside>
      )}

      {!sceneAvailable && (
        <p className="fallback-note" role="status">星海渲染暂不可用，栏目入口仍可直接访问。</p>
      )}
    </div>
  );
}
