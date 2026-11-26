import { useCallback, useEffect, useRef, useState } from "react";
import { sitePath } from "../sitePath";
import { navigateWithWarp } from "../travelHandoff";
import Aurora from "./react-bits/Aurora";
import ClickSpark from "./react-bits/ClickSpark";
import TargetCursor from "./react-bits/TargetCursor";
import Dock, { type DockItemData } from "./react-bits/Dock";
import { CosmicEmblem } from "./CosmicEmblem";

type Props = {
  activeSlug?: "home" | "daily" | "tech" | "podcast" | "credits" | "404";
  auroraStops?: [string, string, string];
  accentColor?: string;
};

export function CosmicEffectsShell({
  activeSlug = "home",
  auroraStops = ["#112252", "#38bdf8", "#6366f1"],
  accentColor = "#64f0ff",
}: Props) {
  const [radioOn, setRadioOn] = useState(false);
  const radioRef = useRef<{ ctx: AudioContext; gain: GainNode; oscs: OscillatorNode[] } | null>(null);

  const toggleAmbientRadio = useCallback(() => {
    if (radioRef.current) {
      const current = radioRef.current;
      radioRef.current = null;
      try {
        current.gain.gain.setTargetAtTime(0.0001, current.ctx.currentTime, 0.12);
        window.setTimeout(() => {
          current.oscs.forEach((o) => {
            try { o.stop(); } catch {}
          });
          current.ctx.close().catch(() => {});
        }, 250);
      } catch {}
      setRadioOn(false);
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.8);
    gain.connect(ctx.destination);

    const freqs = [136.1, 204.15, 272.2];
    const oscs = freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      const subGain = ctx.createGain();
      osc.type = i === 1 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      osc.detune.setValueAtTime((i - 1) * 5, ctx.currentTime);
      subGain.gain.setValueAtTime(i === 0 ? 0.55 : 0.22, ctx.currentTime);
      osc.connect(subGain);
      subGain.connect(gain);
      osc.start();
      return osc;
    });

    radioRef.current = { ctx, gain, oscs };
    setRadioOn(true);
  }, []);

  useEffect(() => {
    return () => {
      if (radioRef.current) {
        radioRef.current.oscs.forEach((o) => {
          try { o.stop(); } catch {}
        });
        radioRef.current.ctx.close().catch(() => {});
      }
    };
  }, []);

  const navigateOrActivate = useCallback(
    (slug: "home" | "daily" | "tech" | "podcast" | "credits") => {
      if (slug === "home") {
        if (activeSlug === "home") return;
        navigateWithWarp(sitePath(), "home");
        return;
      }
      if (slug === "credits") {
        if (activeSlug === "credits") return;
        window.location.assign(sitePath("credits/"));
        return;
      }
      if (activeSlug === "home") {
        const portal = document.querySelector<HTMLAnchorElement>(`[data-slug="${slug}"]`);
        if (portal) {
          portal.click();
          return;
        }
      }
      if (activeSlug === slug) return;
      navigateWithWarp(sitePath(slug + "/"), "planet");
    },
    [activeSlug],
  );

  const dockItems: DockItemData[] = [
    {
      label: "太阳系 · 首页",
      active: activeSlug === "home",
      icon: <CosmicEmblem name="xingchen-sun" variant="ring" size={26} colors={["#0f1c3f", "#f59e0b", "#ffd479", "#fef3c7", "#38bdf8"]} />,
      onClick: () => navigateOrActivate("home"),
    },
    {
      label: "地球 · 日常",
      active: activeSlug === "daily",
      icon: <CosmicEmblem name="xingchen-daily-earth" variant="marble" size={26} colors={["#0d1b3e", "#2b59c3", "#ffd479", "#58b9ff", "#e0fbfc"]} />,
      onClick: () => navigateOrActivate("daily"),
    },
    {
      label: "火星 · 技术",
      active: activeSlug === "tech",
      icon: <CosmicEmblem name="xingchen-tech-mars" variant="marble" size={26} colors={["#07192f", "#64f0ff", "#2563eb", "#ff8563", "#e0fbfc"]} />,
      onClick: () => navigateOrActivate("tech"),
    },
    {
      label: "土星 · 播客",
      active: activeSlug === "podcast",
      badge: "FM",
      icon: <CosmicEmblem name="xingchen-podcast-saturn" variant="ring" size={26} colors={["#09132e", "#2563eb", "#64f0ff", "#8ea8ff", "#e2e8f0"]} />,
      onClick: () => navigateOrActivate("podcast"),
    },
    { separator: true },
    {
      label: radioOn ? "关闭星际环境电台" : "开启星际环境电台",
      active: radioOn,
      icon: radioOn ? (
        <img src={sitePath("art/loaders/audio.svg")} alt="" width={18} height={18} />
      ) : (
        <span style={{ fontSize: 14, color: "#64f0ff" }}>◈</span>
      ),
      onClick: toggleAmbientRadio,
    },
    {
      label: "影像与开源美术致谢",
      active: activeSlug === "credits",
      icon: <img src={sitePath("art/loaders/rings.svg")} alt="" width={20} height={20} />,
      onClick: () => navigateOrActivate("credits"),
    },
  ];

  return (
    <>
      <div className="aurora-backdrop" aria-hidden="true">
        <Aurora
          colorStops={auroraStops}
          amplitude={1.0}
          blend={0.65}
          speed={0.6}
          height={0.4}
          glow={0.68}
          layers={2}
          opacity={0.25}
          mouseInteraction={true}
        />
      </div>

      <div className="click-spark-overlay">
        <ClickSpark
          global={true}
          sparkColor={["#64f0ff", "#38bdf8", "#93c5fd", "#e0f2fe"]}
          sparkSize={15}
          sparkRadius={32}
          sparkCount={8}
          sparkWidth={1.6}
          duration={460}
          easing="ease-out"
          shape="streak"
          glow={0.9}
          ring={true}
        />
      </div>

      <TargetCursor
        targetSelector="[data-cursor-label]"
        cursorColor="rgba(148, 196, 255, 0.58)"
        cursorColorOnTarget={accentColor}
        hideDefaultCursor={false}
        blendMode="normal"
        size={28}
        cornerSize={9}
        thickness={1.75}
        padding={5}
        dotSize={0}
        spinDuration={6}
      />

      <div className="cosmic-dock-wrap">
        <Dock
          items={dockItems}
          position="bottom"
          theme="dark"
          baseItemSize={38}
          magnification={54}
          distance={150}
          panelHeight={50}
          gap={8}
          roundness={0.55}
          badgeColor="#2563eb"
          accentColor={accentColor}
          className="cosmic-dock"
        />
      </div>
    </>
  );
}
