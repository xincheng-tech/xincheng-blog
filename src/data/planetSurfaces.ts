export const planetSurfaces = {
  mercury: { name: "水星", file: "mercury", color: "#b9afaa", tilt: 0.01 },
  venus: { name: "金星", file: "venus_surface", color: "#e3b77e", tilt: 0.05 },
  earth: { name: "地球", file: "earth_daymap", color: "#91c9fa", tilt: 0.41 },
  mars: { name: "火星", file: "mars", color: "#e5a28b", tilt: 0.44 },
  jupiter: { name: "木星", file: "jupiter", color: "#ead0b1", tilt: 0.05 },
  saturn: { name: "土星", file: "saturn", color: "#efce98", tilt: 0.47 },
  uranus: { name: "天王星", file: "uranus", color: "#a9dbe0", tilt: 1.71 },
  neptune: { name: "海王星", file: "neptune", color: "#819eeb", tilt: 0.49 },
  moon: { name: "月球", file: "moon", color: "#c5c3cb", tilt: 0.12 },
} as const;

export type PlanetSurface = keyof typeof planetSurfaces;
