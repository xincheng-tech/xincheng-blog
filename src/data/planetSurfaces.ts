export const planetSurfaces = {
  rock: { pattern: 0, palette: ["#513c31", "#cf9b6d", "#f4cf9c", "#f3ba83"] },
  ocean: { pattern: 1, palette: ["#143953", "#3b8394", "#dae9dc", "#85cddd"] },
  gas: { pattern: 2, palette: ["#513d59", "#a58da0", "#eadac0", "#cca8c6"] },
  dunes: { pattern: 3, palette: ["#5d331d", "#c98545", "#ffdb9a", "#e3ac6b"] },
  ice: { pattern: 4, palette: ["#23537b", "#79b8d9", "#eef7ff", "#b4e8ff"] },
  moss: { pattern: 5, palette: ["#17392d", "#72a172", "#d7db9d", "#a9ce96"] },
  lava: { pattern: 6, palette: ["#252233", "#67525b", "#ff8346", "#ec744b"] },
  mineral: { pattern: 7, palette: ["#29264a", "#797ac1", "#e4d7f6", "#a4a9ed"] },
  storm: { pattern: 8, palette: ["#174459", "#60a8ba", "#e7f0de", "#a2e7e9"] },
  amber: { pattern: 9, palette: ["#5d4a35", "#bd925b", "#f2dfae", "#f2c989"] },
  iron: { pattern: 10, palette: ["#563335", "#bc6351", "#f0b69d", "#d8a196"] },
  pearl: { pattern: 11, palette: ["#554b73", "#b197ad", "#fff0e5", "#dfbddb"] },
} as const;

export type PlanetSurface = keyof typeof planetSurfaces;
