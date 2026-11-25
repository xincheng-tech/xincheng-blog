import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeElements } from "@react-three/fiber";
import { AdditiveBlending, Color, DoubleSide, Vector3 } from "three";
import type { Group, Mesh } from "three";
import { planetSurfaces } from "../data/planetSurfaces";
import type { PlanetSurface } from "../data/planetSurfaces";

type Vec3 = [number, number, number];

export const mainLight: Vec3 = [-2.8, 0.4, -23];

export function surfaceFor(slug: string): PlanetSurface {
  if (slug === "tech") return "ocean";
  if (slug === "podcast") return "gas";
  return "rock";
}

const vertexShader = `
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 view = modelViewMatrix * vec4(position, 1.0);
  vLocal = position;
  vNormal = normalize(normalMatrix * normal);
  vView = view.xyz;
  gl_Position = projectionMatrix * view;
}
`;

const surfaceShader = `
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vView;
uniform vec3 uLight;
uniform vec3 uDark;
uniform vec3 uMid;
uniform vec3 uHigh;
uniform float uSeed;
uniform int uSurface;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.11, 0.23, 0.41)) * 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  vec2 a = mix(vec2(hash(i), hash(i + vec3(0, 0, 1))),
    vec2(hash(i + vec3(1, 0, 0)), hash(i + vec3(1, 0, 1))), f.x);
  vec2 b = mix(vec2(hash(i + vec3(0, 1, 0)), hash(i + vec3(0, 1, 1))),
    vec2(hash(i + vec3(1, 1, 0)), hash(i + vec3(1, 1, 1))), f.x);
  vec2 slices = mix(a, b, f.y);
  return mix(slices.x, slices.y, f.z);
}

float terrain(vec3 p) {
  return 0.54 * noise(p) + 0.28 * noise(p * 2.13 + 7.0)
    + 0.13 * noise(p * 4.21 + 11.0) + 0.05 * noise(p * 9.1);
}

void main() {
  vec3 sphere = normalize(vLocal);
  vec3 p = sphere * 4.6 + vec3(uSeed, 0.0, 5.0);
  float detail = terrain(p);
  float glow = 0.0;
  vec3 painted;
  if (uSurface == 2) {
    float latitude = sphere.y + (detail - 0.5) * 0.15;
    float bands = 0.52 + 0.26 * sin(38.0 * latitude) + 0.17 * sin(81.0 * latitude);
    painted = mix(uDark, uMid, bands);
    painted = mix(painted, uHigh, 0.7 * smoothstep(0.52, 0.83, bands + (detail - 0.5) * 0.6));
  } else if (uSurface == 1) {
    float land = smoothstep(0.46, 0.56, detail);
    float clouds = smoothstep(0.55, 0.7, terrain(p * vec3(1.1, 2.1, 1.1) + 14.0));
    painted = mix(uDark, uMid, land);
    painted = mix(painted, uHigh, max(clouds * 0.68, smoothstep(0.83, 1.0, abs(sphere.y)) * 0.82));
  } else if (uSurface == 3) {
    float dunes = 0.5 + 0.5 * sin(34.0 * (sphere.y + 0.62 * sphere.x) + 12.0 * detail);
    painted = mix(uDark, uMid, smoothstep(0.18, 0.71, detail + dunes * 0.22));
    painted = mix(painted, uHigh, 0.52 * pow(dunes, 3.0));
  } else if (uSurface == 4) {
    float cracks = 1.0 - smoothstep(0.006, 0.039, abs(detail - 0.51));
    float frost = smoothstep(0.25, 0.68, detail + 0.17 * abs(sphere.y));
    painted = mix(mix(uMid, uHigh, frost), uDark, cracks * 0.79);
  } else if (uSurface == 5) {
    float shore = smoothstep(0.41, 0.46, detail);
    float uplands = smoothstep(0.55, 0.72, detail);
    painted = mix(uDark, mix(uMid, uHigh, uplands), shore);
    painted *= 0.86 + 0.24 * noise(p * 11.0);
  } else if (uSurface == 6) {
    float fault = 1.0 - smoothstep(0.012, 0.048, abs(detail - 0.5));
    glow = fault * smoothstep(0.22, 0.69, noise(p * 2.7 + 33.0));
    painted = mix(uDark, uMid, smoothstep(0.46, 0.68, detail));
  } else if (uSurface == 7) {
    float veins = 0.5 + 0.5 * sin(17.0 * (sphere.x - sphere.y * 0.54) + 15.0 * detail);
    float shelves = floor(detail * 8.0) / 8.0;
    painted = mix(uDark, uMid, smoothstep(0.22, 0.68, shelves));
    painted = mix(painted, uHigh, pow(veins, 6.0) * 0.62);
  } else if (uSurface == 8) {
    float swirl = sin(6.0 * sphere.x + 4.0 * sphere.z + 9.0 * detail);
    float clouds = terrain(vec3(p.x * 1.25, p.y * 2.35 + swirl, p.z) + 17.0);
    painted = mix(uDark, uMid, smoothstep(0.2, 0.65, detail));
    painted = mix(painted, uHigh, smoothstep(0.4, 0.66, clouds) * 0.88);
  } else if (uSurface == 9) {
    float latitude = sphere.y + 0.1 * detail;
    float mist = 0.48 + 0.33 * sin(14.0 * latitude) + 0.13 * sin(43.0 * latitude);
    painted = mix(mix(uDark, uMid, mist), uHigh, 0.68 * smoothstep(0.34, 0.85, mist));
  } else if (uSurface == 10) {
    float oxide = smoothstep(0.32, 0.65, detail);
    float pits = smoothstep(0.4, 0.72, noise(p * 8.0));
    painted = mix(uDark, uMid, oxide * (1.0 - 0.42 * pits));
    painted = mix(painted, uHigh, 0.66 * smoothstep(0.58, 0.78, detail));
  } else if (uSurface == 11) {
    float currents = 0.5 + 0.5 * sin(18.0 * sphere.y + 4.0 * sphere.x + 15.0 * detail);
    painted = mix(uDark, uMid, smoothstep(0.25, 0.68, detail + currents * 0.13));
    painted = mix(painted, uHigh, smoothstep(0.3, 0.96, currents) * 0.61);
  } else {
    float ridges = 1.0 - abs(2.0 * detail - 1.0);
    float strata = smoothstep(0.38, 0.72, detail) * 0.78;
    painted = mix(uDark, uMid, strata);
    painted = mix(painted, uHigh, 0.42 * pow(ridges, 4.0));
    painted *= mix(0.72, 1.17, noise(p * 22.0));
  }

  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize((viewMatrix * vec4(uLight, 1.0)).xyz - vView);
  float day = dot(normal, lightDir);
  float light = 0.22 + 1.22 * pow(smoothstep(-0.33, 0.92, day), 0.82);
  gl_FragColor = vec4(painted * light * vec3(1.07, 1.0, 0.91) + uHigh * glow * 1.25, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const atmosphereShader = `
varying vec3 vNormal;
varying vec3 vView;
uniform vec3 uLight;
uniform vec3 uColor;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize((viewMatrix * vec4(uLight, 1.0)).xyz - vView);
  float limb = pow(1.0 - max(0.0, dot(normal, normalize(-vView))), 4.0);
  float day = smoothstep(-0.35, 0.9, dot(normal, lightDir));
  gl_FragColor = vec4(uColor, limb * (0.1 + 0.48 * day));
  #include <colorspace_fragment>
}
`;

const ringShader = `
varying vec3 vLocal;
uniform vec3 uColor;
void main() {
  float r = length(vLocal.xy);
  float edge = smoothstep(1.32, 1.46, r) * (1.0 - smoothstep(2.07, 2.2, r));
  float gap = 1.0 - 0.92 * exp(-pow((r - 1.86) * 65.0, 2.0));
  float bands = 0.24 + 0.48 * pow(0.5 + 0.5 * sin(r * 68.0 + sin(r * 23.0)), 2.0);
  gl_FragColor = vec4(uColor, edge * gap * bands * 0.66);
  #include <colorspace_fragment>
}
`;

export function PlanetBody({ surface, radius, emphasis = 1, seed = 0, ring = false, animate = true, mobile, light = mainLight, ...events }: {
  surface: PlanetSurface;
  radius: number;
  emphasis?: number;
  seed?: number;
  ring?: boolean;
  animate?: boolean;
  mobile: boolean;
  light?: Vec3;
} & Pick<ThreeElements["mesh"], "onPointerOver" | "onPointerOut" | "onClick">) {
  const body = useRef<Mesh>(null);
  const planet = useRef<Group>(null);
  const [surfaceUniforms, atmosphereUniforms, ringUniforms] = useMemo(() => {
    const { palette, pattern } = planetSurfaces[surface];
    const [dark, mid, high, atmosphere] = palette.map((color) => new Color(color));
    const uLight = { value: new Vector3(...light) };
    return [
      {
        uLight, uDark: { value: dark }, uMid: { value: mid }, uHigh: { value: high },
        uSeed: { value: seed * 9.1 },
        uSurface: { value: pattern },
      },
      { uLight, uColor: { value: atmosphere } },
      { uColor: { value: mid.clone().lerp(high, 0.48) } },
    ];
  }, [light, seed, surface]);

  useFrame((_, delta) => {
    if (animate && body.current) body.current.rotation.y += Math.min(delta, 0.05) * 0.065;
    if (planet.current) {
      const scale = planet.current.scale.x;
      const ease = animate ? 1 - Math.exp(-delta * 8) : 1;
      planet.current.scale.setScalar(scale + (emphasis - scale) * ease);
    }
  });

  return (
    <group scale={radius} rotation={[0.12, 0, ring ? -0.26 : 0.14]}>
      <group ref={planet}>
        <mesh ref={body} {...events}>
          <sphereGeometry args={[1, mobile ? 28 : 48, mobile ? 20 : 32]} />
          <shaderMaterial vertexShader={vertexShader} fragmentShader={surfaceShader} uniforms={surfaceUniforms} />
        </mesh>
        <mesh scale={surface === "ocean" ? 1.045 : 1.023}>
          <sphereGeometry args={[1, 32, 24]} />
          <shaderMaterial vertexShader={vertexShader} fragmentShader={atmosphereShader} uniforms={atmosphereUniforms}
            transparent depthWrite={false} blending={AdditiveBlending} />
        </mesh>
        {ring && (
          <mesh rotation={[1.19, 0.08, 0]}>
            <ringGeometry args={[1.32, 2.2, mobile ? 48 : 96]} />
            <shaderMaterial vertexShader={vertexShader} fragmentShader={ringShader} uniforms={ringUniforms}
              transparent depthWrite={false} side={DoubleSide} />
          </mesh>
        )}
      </group>
    </group>
  );
}
