import type { PlanetSurface } from "./planetSurfaces";

export type HoloPresetName = "bursts" | "stars" | "shards" | "cosmos" | "rainbow" | "swirl" | "glitter" | "gold";

export type SatelliteSpec = {
  surface: PlanetSurface;
  orbitRadius: number;
  radius: number;
  speed: number;
  inclination: number;
  phase: number;
};

export type SectionItem = {
  title: string;
  meta: string;
  summary: string;
  art: string;
  holoPreset: HoloPresetName;
  tags: string[];
  frequencyHz: number;
  isPodcast?: boolean;
  chapters?: { time: string; label: string }[];
};

export type Section = {
  slug: string;
  name: string;
  color: string;
  glowHsl: string;
  surface: PlanetSurface;
  position: [number, number, number];
  intro: string;
  orbitCode: string;
  sectorId: string;
  au: string;
  specTag: string;
  moonSummary: string;
  auroraStops: [string, string, string];
  heroArt: string;
  illustration: string;
  emblemPalette: string[];
  satellites: SatelliteSpec[];
  items: SectionItem[];
};

export const sections: Section[] = [
  {
    slug: "daily",
    name: "日常",
    color: "#ffd479",
    glowHsl: "42 96 74",
    surface: "earth",
    position: [-9.5, -2.4, -18],
    intro: "一些正在发生的日子，一张图，一句当时的想法。",
    orbitCode: "SOL-03 · 1.00 AU",
    sectorId: "SYS.03 // EARTH",
    au: "1.00 AU",
    specTag: "01 MOON · 03 LOGS",
    moonSummary: "NATURAL SATELLITE: 01 (月球 MOON)",
    auroraStops: ["#1a2b5e", "#ffd479", "#28769c"],
    heroArt: "art/planets/hero-earth-painted.png",
    illustration: "art/illustrations/snapshot-dark.svg",
    emblemPalette: ["#0d1b3e", "#2b59c3", "#ffd479", "#ffe8b3", "#58b9ff"],
    satellites: [
      { surface: "moon", orbitRadius: 4.3, radius: 0.34, speed: 0.2, inclination: 0.09, phase: 0.7 },
    ],
    items: [
      {
        title: "把普通日子存进星海",
        meta: "随笔 · 片刻",
        summary: "傍晚散步时拍下路灯刚亮的瞬间，把零碎而具体的日常封存进地球轨道的个人日志舱。",
        art: "art/planets/hero-earth-painted.png",
        holoPreset: "cosmos",
        tags: ["随笔", "夜行", "星海胶囊"],
        frequencyHz: 136.1,
      },
      {
        title: "最近在读的几本书",
        meta: "阅读 · 记录",
        summary: "从科幻短篇到系统设计手记，摘录那些让人停下来对着窗外发呆半分钟的句子与批注。",
        art: "art/planets/hero-venus-realistic.png",
        holoPreset: "gold",
        tags: ["阅读", "书单", "摘录"],
        frequencyHz: 210.42,
      },
      {
        title: "十一月的天气与散步",
        meta: "生活 · 归档",
        summary: "风开始变凉的十一月，耳机里放着慢节奏的播客，走过落满银杏叶的街角与桥面。",
        art: "art/planets/sun-illustrated.png",
        holoPreset: "stars",
        tags: ["十一月", "散步", "季节"],
        frequencyHz: 140.25,
      },
    ],
  },
  {
    slug: "tech",
    name: "技术",
    color: "#64f0ff",
    glowHsl: "188 100 70",
    surface: "mars",
    position: [7, -2.3, -20],
    intro: "计算机、代码和那些从问题里长出来的小工具。",
    orbitCode: "SOL-04 · 1.52 AU",
    sectorId: "SYS.04 // MARS",
    au: "1.52 AU",
    specTag: "02 MOONS · 03 NODES",
    moonSummary: "NATURAL SATELLITES: 02 (火卫一 PHOBOS · 火卫二 DEIMOS)",
    auroraStops: ["#0f2859", "#64f0ff", "#2563eb"],
    heroArt: "art/planets/hero-io-painted.png",
    illustration: "art/illustrations/network-dark.svg",
    emblemPalette: ["#07192f", "#00b4d8", "#64f0ff", "#3b82f6", "#ff8563"],
    satellites: [
      { surface: "phobos", orbitRadius: 3.1, radius: 0.16, speed: 0.48, inclination: 0.03, phase: 1.1 },
      { surface: "deimos", orbitRadius: 4.75, radius: 0.11, speed: 0.24, inclination: -0.05, phase: 3.8 },
    ],
    items: [
      {
        title: "从零写一个 WebGL 星野",
        meta: "渲染 · GLSL",
        summary: "拆解星点闪烁、大气边缘菲涅尔发光与三次贝塞尔镜头跃迁，在低功耗预算下保持丝滑帧率。",
        art: "art/planets/hero-io-painted.png",
        holoPreset: "shards",
        tags: ["WebGL", "GLSL", "Three.js"],
        frequencyHz: 183.58,
      },
      {
        title: "定点数、浮点数与一次精度事故",
        meta: "组成原理",
        summary: "从 IEEE 754 尾数舍入聊起，复盘一次跨端数值累积误差如何一步步演化成肉眼可见的偏移。",
        art: "art/planets/portrait-galileans.png",
        holoPreset: "swirl",
        tags: ["IEEE 754", "底层原理", "Debug"],
        frequencyHz: 211.44,
      },
      {
        title: "我把个人站做成了小宇宙",
        meta: "前端 · 3D",
        summary: "用 Astro 静态岛屿承载可访问的语义化导航，再以 React Three Fiber 与 React Bits 赋予空间生命力。",
        art: "art/planets/hero-earth-painted.png",
        holoPreset: "cosmos",
        tags: ["Astro", "R3F", "React Bits"],
        frequencyHz: 144.72,
      },
    ],
  },
  {
    slug: "podcast",
    name: "播客",
    color: "#8ea8ff",
    glowHsl: "226 100 78",
    surface: "saturn",
    position: [0.35, -3.63, -12.7],
    intro: "不定期更新，聊技术、书和最近在想的事。",
    orbitCode: "SOL-06 · 9.58 AU",
    sectorId: "SYS.06 // SATURN",
    au: "9.58 AU",
    specTag: "07 MAJOR MOONS · 03 EPS",
    moonSummary: "MAJOR SATELLITES: 07 (土卫一~土卫六 · 土卫八)",
    auroraStops: ["#12214d", "#8ea8ff", "#38bdf8"],
    heroArt: "art/planets/hero-saturn-painted.png",
    illustration: "art/illustrations/history-dark.svg",
    emblemPalette: ["#09132e", "#2563eb", "#64f0ff", "#8ea8ff", "#e2e8f0"],
    satellites: [
      { surface: "mimas", orbitRadius: 4.5, radius: 0.095, speed: 0.46, inclination: 0.03, phase: 0.4 },
      { surface: "enceladus", orbitRadius: 5.1, radius: 0.115, speed: 0.38, inclination: -0.02, phase: 1.6 },
      { surface: "tethys", orbitRadius: 5.75, radius: 0.135, speed: 0.31, inclination: 0.04, phase: 2.9 },
      { surface: "dione", orbitRadius: 6.45, radius: 0.145, speed: 0.25, inclination: -0.03, phase: 4.2 },
      { surface: "rhea", orbitRadius: 7.2, radius: 0.175, speed: 0.19, inclination: 0.04, phase: 5.3 },
      { surface: "titan", orbitRadius: 8.45, radius: 0.34, speed: 0.13, inclination: 0.05, phase: 1.0 },
      { surface: "iapetus", orbitRadius: 9.8, radius: 0.16, speed: 0.08, inclination: 0.24, phase: 3.5 },
    ],
    items: [
      {
        title: "EP.03 关于把网站做成世界",
        meta: "42:10",
        summary: "为什么我们仍然怀念像个人房间一样的独立网站？聊聊空间化叙事、3D 交互克制感与做播客的初衷。",
        art: "art/planets/hero-saturn-painted.png",
        holoPreset: "cosmos",
        tags: ["独立站点", "数字花园", "交互设计"],
        frequencyHz: 147.85,
        isPodcast: true,
        chapters: [
          { time: "00:00", label: "开场：星际电台第三次试音" },
          { time: "11:24", label: "从信息流回到自己的小房间" },
          { time: "27:40", label: "3D 星海与可读性的平衡术" },
        ],
      },
      {
        title: "EP.02 最近读到的故事",
        meta: "35:24",
        summary: "在深夜台灯下翻完的三篇短篇小说：关于时间膨胀、远航信使，以及普通人如何与不确定共处。",
        art: "art/planets/moons-saturn.png",
        holoPreset: "stars",
        tags: ["夜读", "科幻故事", "漫谈"],
        frequencyHz: 207.36,
        isPodcast: true,
        chapters: [
          { time: "00:00", label: "雨夜书桌与一杯热茶" },
          { time: "13:15", label: "跨越光年的慢递信件" },
          { time: "26:50", label: "把故事留给明天的自己" },
        ],
      },
      {
        title: "EP.01 星辰界，从一个名字开始",
        meta: "28:16",
        summary: "第一期节目，记录「星辰界」这个名字的来历，以及把日常、技术与声音放进同一个星系的想象。",
        art: "art/planets/sun-illustrated.png",
        holoPreset: "gold",
        tags: ["创刊号", "星辰界", "声音日志"],
        frequencyHz: 194.18,
        isPodcast: true,
        chapters: [
          { time: "00:00", label: "你好，欢迎收听星辰界" },
          { time: "09:42", label: "为什么叫「星辰界」" },
          { time: "20:18", label: "未来的星系漫游计划" },
        ],
      },
    ],
  },
];
