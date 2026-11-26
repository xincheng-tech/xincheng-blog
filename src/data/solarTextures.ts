import { sitePath } from "../sitePath";
import { planetSurfaces } from "./planetSurfaces";
import type { Section } from "./sections";

export function solarTexturePath(file: string) {
  return sitePath(`textures/solar-system/${file}.webp`);
}

export function sectionTextureFiles(section: Section) {
  const surfaces = [section.surface, ...section.satellites.map((sat) => sat.surface)];
  const files = new Set(["milky-way", ...surfaces.map((surface) => planetSurfaces[surface].file)]);
  if (surfaces.includes("saturn")) files.add("saturn-ring");
  return [...files];
}
