export type PlanetSurfaceConfig = {
  name: string;
  file: string;
  color: string;
  halo: string;
  tilt: number;
  atmosphere?: boolean;
  triaxial?: [number, number, number];
};

export const planetSurfaces = {
  mercury: { name: "水星", file: "mercury", color: "#b9afaa", halo: "#cbd5e1", tilt: 0.01, atmosphere: false },
  venus: { name: "金星", file: "venus_surface", color: "#e3b77e", halo: "#ffd089", tilt: 0.05, atmosphere: true },
  earth: { name: "地球", file: "earth_daymap", color: "#91c9fa", halo: "#59beff", tilt: 0.41, atmosphere: true },
  mars: { name: "火星", file: "mars", color: "#e5a28b", halo: "#ff8563", tilt: 0.44, atmosphere: true },
  jupiter: { name: "木星", file: "jupiter", color: "#ead0b1", halo: "#f5cba0", tilt: 0.05, atmosphere: true },
  saturn: { name: "土星", file: "saturn", color: "#efce98", halo: "#8ea8ff", tilt: 0.47, atmosphere: true },
  uranus: { name: "天王星", file: "uranus", color: "#a9dbe0", halo: "#7ce8ff", tilt: 1.71, atmosphere: true },
  neptune: { name: "海王星", file: "neptune", color: "#819eeb", halo: "#6c93ff", tilt: 0.49, atmosphere: true },
  pluto: { name: "冥王星", file: "pluto", color: "#d5baa6", halo: "#cbd5e1", tilt: 1.01, atmosphere: false },
  ceres: { name: "谷神星", file: "ceres", color: "#a9aeb8", halo: "#cbd5e1", tilt: 0.07, atmosphere: false },
  // Earth's natural satellite (1)
  moon: { name: "月球", file: "moon", color: "#c5c3cb", halo: "#dce2f2", tilt: 0.12, atmosphere: false },
  // Mars's natural satellites (2)
  phobos: { name: "火卫一", file: "phobos", color: "#9e938a", halo: "#cbd5e1", tilt: 0.02, atmosphere: false, triaxial: [1.28, 0.98, 0.88] },
  deimos: { name: "火卫二", file: "deimos", color: "#afa498", halo: "#cbd5e1", tilt: 0.03, atmosphere: false, triaxial: [1.22, 0.96, 0.86] },
  // Saturn's 7 major classical moons
  mimas: { name: "土卫一", file: "mimas", color: "#cfd4dc", halo: "#cbd5e1", tilt: 0.03, atmosphere: false },
  enceladus: { name: "土卫二", file: "enceladus", color: "#e4f0ff", halo: "#93c5fd", tilt: 0.02, atmosphere: true },
  tethys: { name: "土卫三", file: "tethys", color: "#d7dce4", halo: "#cbd5e1", tilt: 0.02, atmosphere: false },
  dione: { name: "土卫四", file: "dione", color: "#cfd6df", halo: "#cbd5e1", tilt: 0.01, atmosphere: false },
  rhea: { name: "土卫五", file: "rhea", color: "#c9d0da", halo: "#cbd5e1", tilt: 0.01, atmosphere: false },
  titan: { name: "土卫六", file: "titan", color: "#e9b96e", halo: "#f59e0b", tilt: 0.05, atmosphere: true },
  iapetus: { name: "土卫八", file: "iapetus", color: "#b6b2ac", halo: "#cbd5e1", tilt: 0.27, atmosphere: false },
  // Galilean reference moons
  europa: { name: "木卫二", file: "europa", color: "#bfd8eb", halo: "#7dd3fc", tilt: 0.08, atmosphere: false },
  io: { name: "木卫一", file: "io", color: "#f3d579", halo: "#fbbf24", tilt: 0.04, atmosphere: false },
} as const satisfies Record<string, PlanetSurfaceConfig>;

export type PlanetSurface = keyof typeof planetSurfaces;
