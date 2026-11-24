import { useEffect, useRef } from "react";

type Props = {
  visible: boolean;
  flightKey: number;
  target: { x: number; y: number };
};

type Particle = { x: number; y: number; life: number; radius: number };

const FORE = new Path2D();
FORE.moveTo(0, -7);
FORE.quadraticCurveTo(30, -48, 70, -53);
FORE.quadraticCurveTo(89, -42, 78, -7);
FORE.quadraticCurveTo(56, 9, 2, 9);
FORE.closePath();

const HIND = new Path2D();
HIND.moveTo(2, 10);
HIND.quadraticCurveTo(44, 9, 71, 25);
HIND.quadraticCurveTo(83, 47, 59, 61);
HIND.quadraticCurveTo(33, 67, 15, 49);
HIND.quadraticCurveTo(2, 33, 2, 10);
HIND.closePath();

const VEINS_F = [
  [3, -4, 40, -43, 76, -51], [4, -1, 32, -36, 72, -42], [4, 1, 28, -26, 72, -27],
  [4, 3, 26, -16, 68, -13], [4, 4, 22, -5, 60, 1], [4, 5, 18, 5, 44, 9], [4, 6, 12, 9, 26, 9],
];
const VEINS_H = [
  [3, 11, 34, 13, 68, 24], [3, 13, 30, 22, 64, 33], [3, 15, 26, 30, 56, 43],
  [3, 17, 20, 38, 46, 54], [3, 18, 13, 44, 32, 60], [3, 19, 8, 46, 20, 60],
];
const CELL_F = [[14, -8], [26, -26], [35, -14], [28, 3], [16, 2]];
const CELL_H = [[14, 20], [24, 28], [22, 40], [12, 34]];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function veinPath(ctx: CanvasRenderingContext2D, vein: number[], width: number, color: string) {
  ctx.beginPath();
  ctx.moveTo(vein[0], vein[1]);
  ctx.quadraticCurveTo(vein[2], vein[3], vein[4], vein[5]);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function polyPath(ctx: CanvasRenderingContext2D, points: number[][]) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
}

function membrane(ctx: CanvasRenderingContext2D, path: Path2D, x: number, y: number, inner: number, outer: number) {
  const gradient = ctx.createRadialGradient(x, y, inner, x, y, outer);
  gradient.addColorStop(0, "rgba(232,255,247,.8)");
  gradient.addColorStop(.26, "rgba(168,244,224,.66)");
  gradient.addColorStop(.55, "rgba(126,214,226,.46)");
  gradient.addColorStop(.8, "rgba(172,150,255,.36)");
  gradient.addColorStop(1, "rgba(255,170,226,.26)");
  ctx.fillStyle = gradient;
  ctx.fill(path);
}

function drawWingHalf(ctx: CanvasRenderingContext2D, time: number) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.shadowColor = "rgba(110,240,220,.35)";
  ctx.shadowBlur = 9;
  membrane(ctx, HIND, 6, 16, 4, 76);
  ctx.shadowBlur = 0;
  ctx.save();
  ctx.clip(HIND);
  const hindShade = ctx.createRadialGradient(6, 18, 18, 6, 18, 80);
  hindShade.addColorStop(0, "rgba(0,0,0,0)");
  hindShade.addColorStop(.72, "rgba(6,50,46,.07)");
  hindShade.addColorStop(1, "rgba(6,50,46,.32)");
  ctx.fillStyle = hindShade;
  ctx.fill(HIND);
  ctx.restore();

  for (const vein of VEINS_H) veinPath(ctx, vein, 2.6, "rgba(150,240,220,.13)");
  for (const vein of VEINS_H) veinPath(ctx, vein, 1.25, "rgba(12,62,56,.66)");
  polyPath(ctx, CELL_H);
  ctx.lineWidth = .9;
  ctx.strokeStyle = "rgba(18,74,68,.45)";
  ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = "rgba(220,255,246,.72)";
  ctx.stroke(HIND);

  ctx.save();
  ctx.shadowColor = "rgba(0,38,34,.55)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = "rgba(0,0,0,.001)";
  ctx.fill(FORE);
  ctx.restore();

  ctx.shadowColor = "rgba(130,250,232,.42)";
  ctx.shadowBlur = 10;
  membrane(ctx, FORE, 6, -6, 4, 92);
  ctx.shadowBlur = 0;
  ctx.save();
  ctx.clip(FORE);
  const foreShade = ctx.createRadialGradient(6, -8, 20, 6, -8, 96);
  foreShade.addColorStop(0, "rgba(0,0,0,0)");
  foreShade.addColorStop(.7, "rgba(6,50,46,.07)");
  foreShade.addColorStop(1, "rgba(6,50,46,.34)");
  ctx.fillStyle = foreShade;
  ctx.fill(FORE);
  ctx.restore();

  for (const vein of VEINS_F) veinPath(ctx, vein, 2.8, "rgba(150,240,220,.14)");
  for (const vein of VEINS_F) veinPath(ctx, vein, 1.35, "rgba(10,58,52,.7)");
  polyPath(ctx, CELL_F);
  ctx.lineWidth = .95;
  ctx.strokeStyle = "rgba(16,70,64,.5)";
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(228,255,249,.78)";
  ctx.stroke(FORE);

  const edge = ctx.createLinearGradient(12, -30, 76, -50);
  edge.addColorStop(0, "rgba(255,255,255,0)");
  edge.addColorStop(.5, "rgba(255,255,255,.5)");
  edge.addColorStop(1, "rgba(255,255,255,0)");
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(14, -30);
  ctx.quadraticCurveTo(46, -52, 74, -48);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,.13)";
  ctx.beginPath();
  ctx.ellipse(70, -44, 6.2, 4, -.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,175,235,.14)";
  ctx.beginPath();
  ctx.ellipse(64, -29, 4.2, 2.8, -.4, 0, Math.PI * 2);
  ctx.fill();

  const phase = (time * .22) % 1;
  const sheen = ctx.createLinearGradient(-20, -60, 96, 70);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(clamp(phase - .3, .001, .994), "rgba(255,255,255,0)");
  sheen.addColorStop(clamp(phase, .006, .995), "rgba(196,255,242,.26)");
  sheen.addColorStop(clamp(phase + .14, .007, .996), "rgba(255,214,246,.18)");
  sheen.addColorStop(clamp(phase + .3, .008, .997), "rgba(255,255,255,0)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.save();
  ctx.clip(FORE);
  ctx.fillStyle = sheen;
  ctx.fill(FORE);
  ctx.restore();
  ctx.save();
  ctx.clip(HIND);
  ctx.fillStyle = sheen;
  ctx.fill(HIND);
  ctx.restore();
}

function drawBody(ctx: CanvasRenderingContext2D, time: number) {
  ctx.shadowColor = "rgba(255,222,160,.45)";
  ctx.shadowBlur = 10;
  const body = ctx.createLinearGradient(0, 6, 0, 46);
  body.addColorStop(0, "rgba(252,255,252,.98)");
  body.addColorStop(1, "rgba(246,196,116,.96)");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-5, 6);
  ctx.quadraticCurveTo(-7, 30, -2, 44);
  ctx.quadraticCurveTo(0, 48, 2, 44);
  ctx.quadraticCurveTo(7, 30, 5, 6);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "rgba(150,92,40,.45)";
  ctx.lineWidth = .9;
  for (let i = 1; i <= 3; i += 1) {
    const y = 10 + i * 9;
    ctx.beginPath();
    ctx.moveTo(-4.4 + i * .3, y);
    ctx.quadraticCurveTo(0, y + 1.8, 4.4 - i * .3, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(246,252,246,.99)";
  ctx.strokeStyle = "rgba(28,66,58,.55)";
  ctx.lineWidth = .9;
  ctx.beginPath();
  ctx.ellipse(0, 2, 6.2, 8.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -8, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const sway = Math.sin(time * 1.6) * 1.4;
  ctx.strokeStyle = "rgba(255,232,190,.9)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-2, -10);
  ctx.quadraticCurveTo(-12, -26, -20, -30 + sway);
  ctx.moveTo(2, -10);
  ctx.quadraticCurveTo(12, -26, 20, -30 + sway);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,236,196,.95)";
  ctx.beginPath();
  ctx.arc(-20, -30 + sway, 1.9, 0, Math.PI * 2);
  ctx.arc(20, -30 + sway, 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(60,40,20,.7)";
  ctx.beginPath();
  ctx.arc(-2.5, -9, 1.3, 0, Math.PI * 2);
  ctx.arc(2.5, -9, 1.3, 0, Math.PI * 2);
  ctx.fill();
}

export function ButterflyGuide({ visible, flightKey, target }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !visible) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = 320;
    const height = 220;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let frame = 0;
    let previous = performance.now();
    let time = 0;
    let flapPhase = .8;
    let particles: Particle[] = [];
    const emitUntil = flightKey > 0 ? performance.now() + 950 : 0;

    const draw = (now: number) => {
      const delta = Math.min((now - previous) / 1000, .04);
      previous = now;
      time += delta;
      flapPhase += delta * (flightKey > 0 ? 15 : 8);
      ctx.clearRect(0, 0, width, height);

      if (now < emitUntil && Math.random() > .48) {
        particles.push({ x: width / 2 + (Math.random() - .5) * 12, y: height / 2 + 42, life: 1, radius: 2 + Math.random() * 2.3 });
      }
      particles = particles.filter((particle) => particle.life > 0);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const particle of particles) {
        particle.life -= delta * 1.25;
        particle.y += delta * 10;
        const glow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius * 5);
        glow.addColorStop(0, "rgba(230,255,220,.8)");
        glow.addColorStop(1, "rgba(100,235,220,0)");
        ctx.globalAlpha = particle.life * .48;
        ctx.fillStyle = glow;
        ctx.fillRect(particle.x - particle.radius * 5, particle.y - particle.radius * 5, particle.radius * 10, particle.radius * 10);
      }

      const halo = ctx.createRadialGradient(width / 2, height / 2, 4, width / 2, height / 2, 88);
      halo.addColorStop(0, "rgba(230,255,220,.42)");
      halo.addColorStop(.42, "rgba(100,245,220,.16)");
      halo.addColorStop(1, "rgba(70,150,255,0)");
      ctx.globalAlpha = .75;
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 88, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      ctx.translate(width / 2, height / 2);
      const flap = .14 + .86 * Math.abs(Math.cos(flapPhase));
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.scale(side * flap, 1);
        drawWingHalf(ctx, time);
        ctx.restore();
      }
      drawBody(ctx, time);
      ctx.restore();

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [flightKey, visible]);

  return (
    <canvas
      ref={canvasRef}
      className="butterfly-guide"
      style={{ left: target.x, top: target.y }}
      aria-hidden="true"
    />
  );
}
