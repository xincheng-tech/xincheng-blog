import { useCallback, useEffect, useRef, useState } from "react";
import { sitePath } from "../sitePath";
import StarBorder from "./react-bits/StarBorder";

type Chapter = { time: string; label: string };

type Props = {
  title: string;
  frequencyHz: number;
  accent: string;
  durationLabel?: string;
  isPodcast?: boolean;
  chapters?: Chapter[];
};

const BAR_COUNT = 22;

export function CosmicSynthPlayer({
  title,
  frequencyHz,
  accent,
  durationLabel = "03:20",
  isPodcast = false,
  chapters,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState(0);
  const [levels, setLevels] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, (_, i) => 0.22 + Math.sin(i * 0.7) * 0.12),
  );

  const audioRef = useRef<{
    ctx: AudioContext;
    master: GainNode;
    oscillators: OscillatorNode[];
    lfo: OscillatorNode;
    chimeTimer: number;
  } | null>(null);
  const rafRef = useRef<number>(0);

  const stopAudio = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const current = audioRef.current;
    audioRef.current = null;
    if (current) {
      window.clearInterval(current.chimeTimer);
      try {
        const now = current.ctx.currentTime;
        current.master.gain.cancelScheduledValues(now);
        current.master.gain.setTargetAtTime(0.0001, now, 0.08);
        window.setTimeout(() => {
          current.oscillators.forEach((osc) => {
            try { osc.stop(); } catch {}
          });
          try { current.lfo.stop(); } catch {}
          current.ctx.close().catch(() => {});
        }, 220);
      } catch {
        current.ctx.close().catch(() => {});
      }
    }
    setPlaying(false);
  }, []);

  const startAudio = useCallback(
    (detuneShift = 0) => {
      stopAudio();
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.65);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(920, ctx.currentTime);
      filter.Q.setValueAtTime(2.2, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.18, ctx.currentTime);
      lfoGain.gain.setValueAtTime(340, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      filter.connect(master);
      master.connect(ctx.destination);

      const base = frequencyHz * Math.pow(2, detuneShift / 12);
      const ratios = [1, 1.498, 2, 2.5];
      const types: OscillatorType[] = ["sine", "triangle", "sine", "sine"];
      const gains = [0.46, 0.24, 0.16, 0.08];

      const oscillators = ratios.map((ratio, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = types[idx];
        osc.frequency.setValueAtTime(base * ratio, ctx.currentTime);
        osc.detune.setValueAtTime((idx - 1.5) * 4.5, ctx.currentTime);
        gain.gain.setValueAtTime(gains[idx], ctx.currentTime);
        osc.connect(gain);
        gain.connect(filter);
        osc.start();
        return osc;
      });
      lfo.start();

      // Gentle cosmic bell arpeggio notes for podcast atmosphere
      const scale = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];
      let step = 0;
      const chimeTimer = window.setInterval(() => {
        if (ctx.state !== "running") return;
        const now = ctx.currentTime;
        const ping = ctx.createOscillator();
        const pingGain = ctx.createGain();
        const note = base * 2 * scale[(step * 3 + 1) % scale.length];
        step += 1;
        ping.type = "sine";
        ping.frequency.setValueAtTime(note, now);
        pingGain.gain.setValueAtTime(0.0001, now);
        pingGain.gain.exponentialRampToValueAtTime(0.045, now + 0.04);
        pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);
        ping.connect(pingGain);
        pingGain.connect(master);
        ping.start(now);
        ping.stop(now + 1.5);
      }, 1650);

      audioRef.current = { ctx, master, oscillators, lfo, chimeTimer };
      setPlaying(true);

      const startedAt = performance.now();
      const animateBars = (now: number) => {
        const t = (now - startedAt) / 1000;
        setProgress((prev) => (prev + 0.0012) % 1);
        setLevels(
          Array.from({ length: BAR_COUNT }, (_, i) => {
            const wave =
              0.38 +
              0.32 * Math.sin(t * 4.4 + i * 0.55) +
              0.2 * Math.cos(t * 7.1 - i * 0.9);
            return Math.max(0.12, Math.min(1, wave));
          }),
        );
        rafRef.current = requestAnimationFrame(animateBars);
      };
      rafRef.current = requestAnimationFrame(animateBars);
    },
    [frequencyHz, stopAudio],
  );

  useEffect(() => {
    stopAudio();
    setProgress(0);
    setActiveChapter(0);
  }, [title, stopAudio]);

  useEffect(() => () => stopAudio(), [stopAudio]);

  return (
    <div className="cosmic-player" style={{ "--player-accent": accent } as React.CSSProperties}>
      <div className="cosmic-player__top">
        <StarBorder
          as="button"
          color={accent}
          trailColor="#ffffff"
          radius={999}
          duration={3.2}
          glow={0.75}
          sparkle={true}
          backgroundColor="rgba(12, 18, 38, 0.9)"
          borderColor="rgba(255, 255, 255, 0.16)"
          className="cosmic-player__toggle"
          data-cursor-label={playing ? "暂停频段" : isPodcast ? "试听播客声景" : "聆听星球频段"}
          onClick={() => (playing ? stopAudio() : startAudio(activeChapter * 2))}
          aria-label={playing ? `暂停 ${title} 星球声景` : `播放 ${title} 星球声景`}
        >
          <span className="cosmic-player__icon" aria-hidden="true">
            {playing ? "❚❚" : "▶"}
          </span>
          <span>{playing ? "正在接收频段" : isPodcast ? "试听播客星际声景" : "聆听星球共鸣"}</span>
          {playing && (
            <img
              src={sitePath("art/loaders/bars.svg")}
              alt=""
              width={14}
              height={14}
              className="cosmic-player__loader"
            />
          )}
        </StarBorder>

        <span className="cosmic-player__freq">
          {frequencyHz.toFixed(1)} Hz · {isPodcast ? durationLabel : "AMBIENT"}
        </span>
      </div>

      <div
        className="cosmic-player__waveform"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label="声波频谱进度"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
          setProgress(ratio);
          if (!playing) startAudio(activeChapter * 2);
        }}
      >
        {levels.map((lv, idx) => {
          const lit = idx / BAR_COUNT <= progress || playing;
          return (
            <span
              key={idx}
              className={"cosmic-player__bar" + (lit ? " is-lit" : "")}
              style={{ transform: `scaleY(${playing ? lv.toFixed(3) : (0.24 + ((idx * 7) % 5) * 0.08).toFixed(2)})` }}
            />
          );
        })}
      </div>

      {chapters && chapters.length > 0 && (
        <div className="cosmic-player__chapters" aria-label="播客章节">
          {chapters.map((ch, idx) => (
            <button
              key={ch.time}
              type="button"
              className={"cosmic-player__chapter" + (activeChapter === idx ? " is-active" : "")}
              onClick={() => {
                setActiveChapter(idx);
                setProgress(idx / Math.max(1, chapters.length));
                startAudio(idx * 2);
              }}
            >
              <em>{ch.time}</em>
              <span>{ch.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
