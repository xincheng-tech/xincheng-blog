export type Section = {
  slug: string;
  name: string;
  color: string;
  position: [number, number, number];
  intro: string;
  items: { title: string; meta: string }[];
};

export const sections: Section[] = [
  {
    slug: "daily",
    name: "日常",
    color: "#ffd479",
    position: [-10.5, -2.4, -18],
    intro: "一些正在发生的日子，一张图，一句当时的想法。",
    items: [
      { title: "把普通日子存进星海", meta: "随笔 · 片刻" },
      { title: "最近在读的几本书", meta: "阅读 · 记录" },
      { title: "十一月的天气与散步", meta: "生活 · 归档" },
    ],
  },
  {
    slug: "tech",
    name: "技术",
    color: "#64f0ff",
    position: [6.7, -2.3, -18],
    intro: "计算机、代码和那些从问题里长出来的小工具。",
    items: [
      { title: "从零写一个 WebGL 星野", meta: "渲染 · GLSL" },
      { title: "定点数、浮点数与一次精度事故", meta: "组成原理" },
      { title: "我把个人站做成了小宇宙", meta: "前端 · 3D" },
    ],
  },
  {
    slug: "podcast",
    name: "播客",
    color: "#ff72cf",
    position: [-1.8, -5.7, -25],
    intro: "不定期更新，聊技术、书和最近在想的事。",
    items: [
      { title: "EP.03 关于把网站做成世界", meta: "42:10" },
      { title: "EP.02 最近读到的故事", meta: "35:24" },
      { title: "EP.01 星辰界，从一个名字开始", meta: "28:16" },
    ],
  },
];
