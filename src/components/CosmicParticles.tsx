import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Line,
  LineBasicMaterial,
  ShaderMaterial,
  Vector3,
} from "three";
import type { Group } from "three";

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    float twinkle = 0.62 + 0.38 * sin(uTime * (1.2 + fract(aPhase) * 2.1) + aPhase * 6.2831);
    vAlpha = twinkle;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * uPixelRatio * (24.0 / max(1.0, -mvPosition.z)), 1.0, 6.5);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const STAR_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float core = exp(-d * d * 26.0);
    float halo = smoothstep(0.5, 0.0, d) * 0.4;
    float alpha = (core + halo) * vAlpha;
    gl_FragColor = vec4(vColor * (0.85 + core * 0.5), alpha);
  }
`;

export function TwinklingStars({
  count = 900,
  animate = true,
}: {
  count?: number;
  animate?: boolean;
}) {
  const materialRef = useRef<ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const palette = [
      new Color("#ffffff"),
      new Color("#cfe6ff"),
      new Color("#ffd996"),
      new Color("#9beeff"),
      new Color("#b8c8ff"),
    ];

    for (let i = 0; i < count; i++) {
      const s1 = Math.sin(i * 12.9898 + 1.23) * 43758.5453;
      const s2 = Math.sin(i * 78.233 + 4.56) * 24634.6345;
      const s3 = Math.sin(i * 39.425 + 7.89) * 19543.1234;
      const u = s1 - Math.floor(s1);
      const v = s2 - Math.floor(s2);
      const w = s3 - Math.floor(s3);

      const radius = 28 + w * 50;
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.72;
      positions[i * 3 + 2] = -Math.abs(radius * Math.cos(phi)) - 8;

      sizes[i] = 1.0 + Math.pow(w, 2.3) * 2.8;
      phases[i] = u * 10 + v;
      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute("position", new BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new BufferAttribute(sizes, 1));
    geo.setAttribute("aPhase", new BufferAttribute(phases, 1));
    geo.setAttribute("aColor", new BufferAttribute(colors, 3));
    return geo;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1 },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    if (animate && materialRef.current) {
      materialRef.current.uniforms.uTime.value += Math.min(delta, 0.05);
    }
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={STAR_VERT}
        fragmentShader={STAR_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

type Meteor = {
  line: Line;
  geo: BufferGeometry;
  mat: LineBasicMaterial;
  origin: Vector3;
  dir: Vector3;
  age: number;
  delay: number;
  duration: number;
  length: number;
};

export function ShootingStars({ enabled = true }: { enabled?: boolean }) {
  const groupRef = useRef<Group>(null);

  const meteors = useMemo<Meteor[]>(() => {
    const colors = ["#fff4d6", "#7ef4ff", "#93c5fd"];
    return colors.map((hex, idx) => {
      const geo = new BufferGeometry();
      geo.setAttribute("position", new BufferAttribute(new Float32Array(6), 3));
      const mat = new LineBasicMaterial({
        color: hex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: AdditiveBlending,
      });
      const line = new Line(geo, mat);
      line.frustumCulled = false;
      return {
        line,
        geo,
        mat,
        origin: new Vector3(-18 + idx * 14, 12 + idx * 2, -32 - idx * 6),
        dir: new Vector3(16, -9.5, 4).normalize(),
        age: 0,
        delay: 1.8 + idx * 3.6,
        duration: 1.05,
        length: 5.8,
      };
    });
  }, []);

  useEffect(() => {
    return () => {
      meteors.forEach((m) => {
        m.geo.dispose();
        m.mat.dispose();
      });
    };
  }, [meteors]);

  useFrame((_, delta) => {
    if (!enabled) return;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < meteors.length; i++) {
      const m = meteors[i];
      m.age += dt;
      if (m.age < m.delay) {
        m.mat.opacity = 0;
        continue;
      }
      const t = (m.age - m.delay) / m.duration;
      if (t >= 1) {
        m.age = 0;
        m.delay = 3.2 + Math.random() * 5;
        m.origin.set((Math.random() - 0.5) * 42, 8 + Math.random() * 12, -26 - Math.random() * 20);
        const sign = Math.random() > 0.5 ? 1 : -1;
        m.dir.set(sign * (12 + Math.random() * 8), -(7 + Math.random() * 5), 2).normalize();
        m.mat.opacity = 0;
        continue;
      }
      const dist = t * 28;
      const hx = m.origin.x + m.dir.x * dist;
      const hy = m.origin.y + m.dir.y * dist;
      const hz = m.origin.z + m.dir.z * dist;
      const tail = m.length * Math.sin(Math.PI * t);
      const pos = m.geo.getAttribute("position") as BufferAttribute;
      pos.setXYZ(0, hx, hy, hz);
      pos.setXYZ(1, hx - m.dir.x * tail, hy - m.dir.y * tail, hz - m.dir.z * tail);
      pos.needsUpdate = true;
      m.mat.opacity = Math.sin(Math.PI * t) * 0.78;
    }
  });

  if (!enabled) return null;

  return (
    <group ref={groupRef}>
      {meteors.map((m, idx) => (
        <primitive key={idx} object={m.line} />
      ))}
    </group>
  );
}

export function WarpStreaks({ active }: { active: boolean }) {
  const count = 90;
  const matRef = useRef<LineBasicMaterial>(null);
  const strength = useRef(0);

  const { geometry, seeds } = useMemo(() => {
    const geo = new BufferGeometry();
    const pos = new Float32Array(count * 6);
    const data: { x: number; y: number; z: number; speed: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (i % 7) * 0.31;
      const rad = 2.2 + ((i * 19) % 13) * 0.95;
      const x = Math.cos(angle) * rad;
      const y = Math.sin(angle) * rad * 0.7;
      const z = -4 - ((i * 29) % 34);
      data.push({ x, y, z, speed: 24 + (i % 5) * 7 });
      pos[i * 6] = x;
      pos[i * 6 + 1] = y;
      pos[i * 6 + 2] = z;
      pos[i * 6 + 3] = x;
      pos[i * 6 + 4] = y;
      pos[i * 6 + 5] = z - 1.5;
    }
    geo.setAttribute("position", new BufferAttribute(pos, 3));
    return { geometry: geo, seeds: data };
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const target = active ? 1 : 0;
    strength.current += (target - strength.current) * (1 - Math.exp(-dt * 6));
    if (matRef.current) {
      matRef.current.opacity = strength.current * 0.55;
    }
    if (strength.current < 0.01) return;

    const attr = geometry.getAttribute("position") as BufferAttribute;
    const stretch = 0.8 + strength.current * 4.2;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      s.z += s.speed * dt * (0.4 + strength.current * 1.4);
      if (s.z > 2) s.z = -38;
      attr.setXYZ(i * 2, s.x, s.y, s.z);
      attr.setXYZ(i * 2 + 1, s.x, s.y, s.z - stretch);
    }
    attr.needsUpdate = true;
  });

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial
        ref={matRef}
        color="#bfeaff"
        transparent
        opacity={0}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </lineSegments>
  );
}
