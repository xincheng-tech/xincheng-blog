import type { PlanetSurface } from "./planetSurfaces";

export type Section = {
  slug: string;
  name: string;
  color: string;
  surface: PlanetSurface;
  position: [number, number, number];
  intro: string;
  items: { title: string; meta: string; surface: PlanetSurface }[];
};

export const sections: Section[] = [
  {
    slug: "daily",
    name: "日常",
    color: "#ffd479",
    surface: "earth",
    position: [-9.5, -2.4, -18],
    intro: "一些正在发生的日子，一张图，一句当时的想法。",
    items: [
      { title: "把普通日子存进星海", meta: "随笔 · 片刻", surface: "moon" },
      { title: "最近在读的几本书", meta: "阅读 · 记录", surface: "venus" },
      { title: "十一月的天气与散步", meta: "生活 · 归档", surface: "mercury" },
    ],
  },
  {
    slug: "tech",
    name: "技术",
    color: "#64f0ff",
    surface: "mars",
    position: [7, -2.3, -20],
    intro: "计算机、代码和那些从问题里长出来的小工具。",
    items: [
      { title: "从零写一个 WebGL 星野", meta: "渲染 · GLSL", surface: "jupiter" },
      { title: "定点数、浮点数与一次精度事故", meta: "组成原理", surface: "neptune" },
      { title: "我把个人站做成了小宇宙", meta: "前端 · 3D", surface: "earth" },
    ],
  },
  {
    slug: "podcast",
    name: "播客",
    color: "#ff72cf",
    surface: "saturn",
    position: [0.35, -3.63, -12.7],
    intro: "不定期更新，聊技术、书和最近在想的事。",
    items: [
      { title: "EP.03 关于把网站做成世界", meta: "42:10", surface: "saturn" },
      { title: "EP.02 最近读到的故事", meta: "35:24", surface: "mars" },
      { title: "EP.01 星辰界，从一个名字开始", meta: "28:16", surface: "uranus" },
    ],
  },
];
