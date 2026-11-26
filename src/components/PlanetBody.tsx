import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import type { ThreeElements } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  Color,
  DoubleSide,
  RingGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
} from "three";
import type { Group, Mesh, Texture } from "three";
import { planetSurfaces } from "../data/planetSurfaces";
import type { PlanetSurface, PlanetSurfaceConfig } from "../data/planetSurfaces";
import { solarTexturePath } from "../data/solarTextures";

function configureTexture(texture: Texture) {
  if (texture.colorSpace !== SRGBColorSpace) {
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }
  return texture;
}

export function useSolarTexture(filename: string) {
  return configureTexture(useLoader(TextureLoader, solarTexturePath(filename)));
}

export function useSolarTextures(files: string[]) {
  return useLoader(TextureLoader, files.map(solarTexturePath)).map(configureTexture);
}

function PlanetMap({ file }: { file: string }) {
  const texture = useSolarTexture(file);
  return <meshStandardMaterial map={texture} roughness={0.88} metalness={0.04} />;
}

const ATMO_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const ATMO_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float d = clamp(dot(-vNormal, vViewDir), 0.0, 1.0);
    float glow = pow(d, 1.8) * smoothstep(0.0, 0.38, d) * (1.0 - smoothstep(0.45, 0.95, d)) * uStrength * 2.1;
    gl_FragColor = vec4(uColor, glow);
  }
`;

function AtmosphereHalo({ color, active }: { color: string; active: boolean }) {
  const matRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(color) },
      uStrength: { value: 0.44 },
    }),
    [color],
  );

  useFrame((_, delta) => {
    if (!matRef.current) return;
    const target = active ? 0.82 : 0.42;
    const cur = matRef.current.uniforms.uStrength.value as number;
    matRef.current.uniforms.uStrength.value = cur + (target - cur) * (1 - Math.exp(-delta * 6));
  });

  return (
    <mesh scale={1.1}>
      <sphereGeometry args={[1, 32, 24]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={ATMO_VERT}
        fragmentShader={ATMO_FRAG}
        uniforms={uniforms}
        side={BackSide}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}

let cachedCloudTexture: CanvasTexture | null = null;
function getEarthCloudTexture(): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (cachedCloudTexture) return cachedCloudTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, 256, 128);
  for (let i = 0; i < 85; i++) {
    const s1 = Math.sin(i * 19.31) * 43758.54;
    const s2 = Math.sin(i * 47.73) * 19432.17;
    const x = (s1 - Math.floor(s1)) * 256;
    const y = 14 + (s2 - Math.floor(s2)) * 100;
    const w = 18 + (i % 7) * 9;
    const h = 4 + (i % 4) * 3;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, w);
    grad.addColorStop(0, "rgba(255,255,255,0.42)");
    grad.addColorStop(0.55, "rgba(235,246,255,0.16)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, h / w);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, w, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  cachedCloudTexture = tex;
  return tex;
}

function EarthClouds({ animate }: { animate: boolean }) {
  const cloudsRef = useRef<Mesh>(null);
  const texture = useMemo(getEarthCloudTexture, []);
  useFrame((_, delta) => {
    if (animate && cloudsRef.current) {
      cloudsRef.current.rotation.y += Math.min(delta, 0.05) * 0.095;
    }
  });
  if (!texture) return null;
  return (
    <mesh ref={cloudsRef} scale={1.022}>
      <sphereGeometry args={[1, 32, 24]} />
      <meshStandardMaterial map={texture} transparent opacity={0.62} depthWrite={false} roughness={1} />
    </mesh>
  );
}

function LockOnReticle({ color, active, animate }: { color: string; active: boolean; animate: boolean }) {
  const ringRef = useRef<Group>(null);
  const alphaRef = useRef(0);

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    const dt = Math.min(delta, 0.05);
    const target = active ? 1 : 0;
    alphaRef.current += (target - alphaRef.current) * (animate ? 1 - Math.exp(-dt * 8) : 1);
    const s = 1.32 + (1 - alphaRef.current) * 0.25;
    ringRef.current.scale.setScalar(s);
    ringRef.current.visible = alphaRef.current > 0.015;
    if (animate && ringRef.current.visible) {
      ringRef.current.rotation.z += dt * 0.45;
    }
  });

  return (
    <group ref={ringRef} rotation={[Math.PI / 2.35, 0.18, 0]} visible={false}>
      <mesh>
        <ringGeometry args={[1.18, 1.22, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.72}
          side={DoubleSide}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation-z={Math.PI / 4}>
        <ringGeometry args={[1.31, 1.335, 4]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.34}
          side={DoubleSide}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function SaturnRings({ texture }: { texture: Texture }) {
  const geometry = useMemo(() => {
    const inner = 1.3;
    const outer = 2.25;
    const ring = new RingGeometry(inner, outer, 96, 1);
    const positions = ring.getAttribute("position");
    const uv = ring.getAttribute("uv");
    for (let i = 0; i < positions.count; i++) {
      const radius = Math.hypot(positions.getX(i), positions.getY(i));
      uv.setXY(i, (radius - inner) / (outer - inner), 0.5);
    }
    return ring;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} rotation-x={Math.PI / 2}>
      <meshStandardMaterial map={texture} transparent depthWrite={false} side={DoubleSide} roughness={1} />
    </mesh>
  );
}

function LoadSaturnRings() {
  return <SaturnRings texture={useSolarTexture("saturn-ring")} />;
}

export function PlanetBody({
  surface,
  map,
  ringMap,
  radius,
  emphasis = 1,
  highlighted = false,
  accentColor,
  animate = true,
  mobile,
  ...events
}: {
  surface: PlanetSurface;
  map?: Texture;
  ringMap?: Texture;
  radius: number;
  emphasis?: number;
  highlighted?: boolean;
  accentColor?: string;
  animate?: boolean;
  mobile: boolean;
} & Pick<ThreeElements["mesh"], "onPointerOver" | "onPointerOut" | "onClick">) {
  const body = useRef<Mesh>(null);
  const planet = useRef<Group>(null);
  const cfg: PlanetSurfaceConfig = planetSurfaces[surface];
  const { file, color, halo, tilt, atmosphere, triaxial } = cfg;

  useFrame((_, delta) => {
    if (animate && body.current) body.current.rotation.y += Math.min(delta, 0.05) * (highlighted ? 0.13 : 0.068);
    if (planet.current) {
      const scale = planet.current.scale.x;
      planet.current.scale.setScalar(scale + (emphasis - scale) * (animate ? 1 - Math.exp(-delta * 8) : 1));
    }
  });

  return (
    <group scale={radius} rotation={[0.16, 0, -tilt]}>
      <group ref={planet}>
        <mesh ref={body} scale={triaxial ?? [1, 1, 1]} {...events}>
          <sphereGeometry args={[1, mobile ? 32 : 48, mobile ? 24 : 32]} />
          {map ? (
            <meshStandardMaterial map={map} roughness={0.9} metalness={0.03} />
          ) : (
            <Suspense fallback={<meshStandardMaterial color={color} roughness={0.92} />}>
              <PlanetMap file={file} />
            </Suspense>
          )}
        </mesh>
        {surface === "earth" && <EarthClouds animate={animate} />}
        {atmosphere && <AtmosphereHalo color={accentColor ?? halo} active={highlighted} />}
        <LockOnReticle color={accentColor ?? halo} active={highlighted} animate={animate} />
        {surface === "saturn" &&
          (ringMap ? (
            <SaturnRings texture={ringMap} />
          ) : (
            <Suspense fallback={null}>
              <LoadSaturnRings />
            </Suspense>
          ))}
      </group>
    </group>
  );
}
