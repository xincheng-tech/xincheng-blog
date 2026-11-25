import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { Section } from "../data/sections";
import { sitePath } from "../sitePath";
import { SceneErrorBoundary } from "./SceneErrorBoundary";

const StarfieldScene = lazy(() =>
  import("./StarfieldScene").then((module) => ({ default: module.StarfieldScene })),
);

type Phase = "idle" | "travel" | "arrived" | "return";

type Props = { sections: Section[] };

export function UniverseExperience({ sections }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneAvailable, setSceneAvailable] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 700px)").matches);
  const destination = useRef<string | null>(null);
  const prefetched = useRef(new Set<string>());

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
    const restore = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      destination.current = null;
      setSelectedSlug(null);
      setPhase("idle");
    };
    window.addEventListener("pageshow", restore);
    return () => {
      motion.removeEventListener("change", update);
      small.removeEventListener("change", update);
      window.removeEventListener("pageshow", restore);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) setSceneReady(false);
  }, [reducedMotion]);

  const arrive = useCallback(() => {
    if (!destination.current) return;
    const slug = destination.current;
    destination.current = null;
    setPhase("arrived");
    window.location.assign(sitePath(slug + "/"));
  }, []);

  useEffect(() => {
    if (phase === "travel" && (reducedMotion || !sceneAvailable)) arrive();
  }, [arrive, phase, reducedMotion, sceneAvailable]);

  const prefetch = useCallback((slug: string) => {
    if (prefetched.current.has(slug)) return;
    prefetched.current.add(slug);
    const hint = document.createElement("link");
    hint.rel = "prefetch";
    hint.href = sitePath(slug + "/");
    document.head.append(hint);
  }, []);

  const activate = useCallback((section: Section) => {
    if (destination.current || phase === "arrived") return;
    if (reducedMotion || !sceneAvailable || !sceneReady) {
      window.location.assign(sitePath(section.slug + "/"));
      return;
    }
    destination.current = section.slug;
    setSelectedSlug(section.slug);
    setPhase("travel");
    prefetch(section.slug);
  }, [phase, prefetch, reducedMotion, sceneAvailable, sceneReady]);

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
      const enter = () => prefetch(section.slug);
      const keydown = (event: KeyboardEvent) => {
        if ((event.key === " " || event.key === "Spacebar") && !event.repeat) {
          event.preventDefault();
          activate(section);
        }
      };

      link.addEventListener("click", click);
      link.addEventListener("pointerenter", enter);
      link.addEventListener("focus", enter);
      link.addEventListener("keydown", keydown);
      cleanup.push(() => {
        link.removeEventListener("click", click);
        link.removeEventListener("pointerenter", enter);
        link.removeEventListener("focus", enter);
        link.removeEventListener("keydown", keydown);
      });
    }
    return () => cleanup.forEach((remove) => remove());
  }, [sections, activate, prefetch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || phase !== "travel") return;
      destination.current = null;
      setPhase("return");
      setSelectedSlug(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase]);

  const onSceneError = useCallback(() => setSceneAvailable(false), []);
  const onReturn = useCallback(() => setPhase("idle"), []);
  return (
    <div className={"universe " + (phase === "travel" || phase === "arrived" ? "is-traveling" : "") + (sceneAvailable ? "" : " scene-fallback")}>
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
                onArrive={arrive}
                onReturn={onReturn}
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

      {!sceneAvailable && (
        <p className="fallback-note" role="status">星海渲染暂不可用，栏目入口仍可直接访问。</p>
      )}
    </div>
  );
}
