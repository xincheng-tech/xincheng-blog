# 星辰界首期正式版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `xincheng-tech/xincheng---` 建立 Astro + React Three Fiber 个人站首期，提供日常、技术、播客三颗栏目星及可访问的栏目页面。

**Architecture:** Astro 输出首页、栏目详情与静态导航；首页只把交互星场作为 React 岛加载。栏目定义放在独立 TypeScript 数据文件中，场景组件通过明确的选中栏目和状态回调与 DOM 导航通信。栏目点击先运行短跃迁，再进入静态栏目路由；所有入口保留普通链接，WebGL 失败或减少动态效果时照常可访问。

**Tech Stack:** Astro、React、TypeScript、Three.js、@react-three/fiber、@react-three/drei、@react-three/postprocessing、postprocessing、CSS。

## Global Constraints

- 首期只呈现日常、技术、播客三个栏目。
- 视觉底色采用近黑蓝；栏目点缀沿用金色、青色、淡紫与播客品红。
- 页面 URL 使用稳定栏目 slug；直接打开栏目路由时必须可读。
- 栏目入口必须使用语义化 HTML 链接，支持键盘操作。
- 必须尊重 `prefers-reduced-motion`，并在 WebGL 不可用时提供静态栏目导航。
- 移动端降低像素比、粒子量和后处理；后处理只用于跃迁阶段。
- 只使用许可清楚的依赖和资产，不复制无许可或 NOASSERTION 仓库的实现。
- 不引入用户账号、内容后台、真实文章迁移、播客播放器、搜索、评论或养蛊系统。

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `package.json`, `package-lock.json`, `astro.config.mjs`, `tsconfig.json` | 项目命令、锁定依赖、Astro React 集成与类型检查 |
| `src/data/sections.ts` | 三个栏目和可渲染内容入口的唯一数据来源 |
| `src/layouts/SiteLayout.astro` | 页面框架、站点元信息、全局样式引入 |
| `src/pages/index.astro` | 首屏标题、SSR 栏目链接、星场岛与降级入口 |
| `src/pages/[slug].astro` | 从栏目数据生成静态详情页 |
| `src/components/UniverseExperience.tsx` | React 岛：选择、预览、跃迁、面板和 fallback 状态 |
| `src/components/StarfieldScene.tsx` | R3F Canvas、星海、三颗栏目星、相机和粒子 |
| `src/components/ButterflyGuide.tsx` | 从原型提取并封装 Canvas 2D 蝴蝶，按场景目标移动 |
| `src/components/SceneErrorBoundary.tsx` | 捕获渲染初始化错误并通知静态导航 fallback |
| `src/styles/global.css` | 颜色、排版、桌面/移动布局、焦点态和减少动态效果 |
| `public/site-icon.svg` | 自制的轻量站点图标 |
| `README.md` | 启动、构建、目录结构、许可与参考仓库说明 |

## Task 1: Astro 项目骨架和可读页面

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`
- Create: `src/data/sections.ts`
- Create: `src/layouts/SiteLayout.astro`
- Create: `src/pages/index.astro`, `src/pages/[slug].astro`, `src/pages/404.astro`
- Create: `src/styles/global.css`
- Create: `public/site-icon.svg`
- Create: `README.md`

**Interfaces:**
- `sections` 导出三个只读栏目对象，字段为 `slug`、`name`、`gu`、`color`、`position`、`intro`、`items`。
- 每个 `items` 元素字段为 `title`、`meta`。
- 动态路由用 `getStaticPaths()` 从 `sections` 生成 `/daily/`、`/tech/`、`/podcast/`。

- [ ] 创建 Astro + React + TypeScript 配置，依赖使用当前兼容的稳定版本并保存 package-lock.json。
- [ ] 在 sections 数据中定义原型的三个栏目内容和桌面空间坐标；位置统一为三项数字元组。
- [ ] 实现 SiteLayout 的中文页面标题、description、viewport 和站点图标。
- [ ] 首页先渲染标题、简介、三条可聚焦栏目链接；每条链接标注栏目简介，关闭 JavaScript 时仍能访问。
- [ ] 动态栏目页渲染栏目名、蛊名、简介、列表占位和“返回星海”链接；未知栏目走 404。
- [ ] 建立近黑蓝主题、清晰焦点框、移动断点和 `prefers-reduced-motion` CSS 规则。
- [ ] 运行 `npm run build`，确认三条栏目路由均出现在 dist 中。

## Task 2: 程序化星海场景

**Files:**
- Create: `src/components/StarfieldScene.tsx`
- Modify: `src/pages/index.astro`
- Modify: `package.json`, `package-lock.json`

**Interfaces:**
- `StarfieldScene` props：`sections: readonly Section[]`、`activeSlug: string | null`、`onPreview(slug: string | null): void`、`onArrive(slug: string): void`、`onReturn(): void`、`reducedMotion: boolean`。
- 页面通过 `client:load` 加载 `UniverseExperience`；本任务可先使用静态星海和非动画点击回调。

- [ ] 安装 `three`、`@react-three/fiber`、`@react-three/drei`、`@react-three/postprocessing`、`postprocessing`。
- [ ] 使用固定 seed 和 `useMemo` 生成螺旋星系位置/颜色，避免每帧重算随机数组。
- [ ] 使用单个 BufferGeometry/Points 绘制背景星点，以三个 mesh 绘制栏目星；不用逐粒子 React 组件。
- [ ] 对重复尘埃采用实例化几何或同一 Points 批处理；控制移动端粒子量和 Canvas DPR。
- [ ] 星体悬停时调用 `onPreview`，离开时清除预览，点击时调用 `onArrive`。
- [ ] 设置 `Canvas` 的相机、色调映射与合理的失焦暂停策略；星海使用可读且克制的发光。
- [ ] 运行 `npm run build` 并修复 TypeScript/Astro 集成错误。

## Task 3: 目的地预览、跃迁和定仙游

**Files:**
- Create: `src/components/UniverseExperience.tsx`
- Create: `src/components/ButterflyGuide.tsx`
- Modify: `src/components/StarfieldScene.tsx`
- Modify: `src/pages/index.astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- 状态联合类型：`"idle" | "preview" | "travel" | "arrived" | "return"`。
- `UniverseExperience` 接收 `sections` 与 SSR 导航元素；维护 `state`、`selectedSlug`、`previewSlug`。
- 激活栏目先把状态设为 `travel`；动画完成后导航到该栏目的静态路由。
- `ButterflyGuide` 接收 `target: { x: number; y: number } | null` 与 `visible: boolean`，只绘制 Canvas 2D 蝴蝶与短寿命光尘。

- [ ] 用 React 状态实现 idle/preview/travel/arrived/return 转换，防止动画期间重复点击启动第二次跃迁。
- [ ] 在指针悬停和键盘焦点时显示栏目名、蛊名和一句简介；目的地预览应在跃迁前可见。
- [ ] 按钮激活执行约 1.5 秒相机推进和星点速度变化；白闪只在正常动态模式短暂出现。
- [ ] 在桌面跃迁期间开启轻量 Bloom/色差；抵达后关闭高速效果并跳转至 `/<slug>/`。
- [ ] 用同一组栏目数据渲染 DOM 标签，三维对象本身设为装饰性且不承载唯一文本。
- [ ] 从 `demo/index.html` 提取蝴蝶的四翅、翅脉和现有尾迹绘制逻辑，封装到独立 Canvas 组件；保留距离发射粒子和瞬移清尾逻辑。
- [ ] 为返回按钮、Escape 和浏览器返回提供回到首页的路径。
- [ ] 运行 `npm run build` 并检查栏目路由及客户端类型。

## Task 4: 初始化错误处理、无障碍与设备降级

**Files:**
- Create: `src/components/SceneErrorBoundary.tsx`
- Modify: `src/components/UniverseExperience.tsx`
- Modify: `src/components/StarfieldScene.tsx`
- Modify: `src/pages/index.astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- Error boundary 接受 `children` 和 `onError(error: Error): void`。
- `UniverseExperience` 用 `sceneAvailable: boolean` 切换 WebGL 场景与静态导航，二者消费相同的 `sections`。
- 动态偏好由 `matchMedia("(prefers-reduced-motion: reduce)")` 初始化并监听变化。

- [ ] WebGL Canvas 初始化抛错或上下文丢失时，将场景切换到 fallback 并保留三条普通栏目链接。
- [ ] React islands 尚未加载时，Astro SSR 链接保持可见且可使用；JS 加载后不能先隐藏链接。
- [ ] 减少动态效果模式直接淡入栏目页面，不执行高速镜头、强模糊或闪白。
- [ ] 窄屏关闭 postprocessing，降低粒子数及 `dpr`，确保标签/入口不互相遮挡。
- [ ] 确保 Tab/Shift+Tab 顺序自然、焦点可见、Enter/Space 激活入口、Escape 返回。
- [ ] 运行 `npm run build`，浏览器手动检查 WebGL 失效时静态入口仍能打开。

## Task 5: 浏览器验收、开源核对和交付说明

**Files:**
- Modify: `README.md`
- Modify: `package.json`, `package-lock.json`
- Review: `src/pages/index.astro`, `src/pages/[slug].astro`, `src/components/UniverseExperience.tsx`

- [ ] 运行 `npm run build` 并确认命令以状态码 0 完成、dist 含首页和三条栏目页。
- [ ] 用本地预览逐项检查首页、预览、跃迁、栏目详情、返回按钮、Escape 与浏览器返回。
- [ ] 用键盘只操作入口并检查焦点；模拟减少动态效果并确认不触发高速跃迁。
- [ ] 检查窄屏排版、Canvas DPR/粒子降档和 WebGL fallback。
- [ ] 检查浏览器控制台无运行错误，场景卸载后无持续动画循环。
- [ ] 核对锁文件中 Astro、Three、R3F、Drei、postprocessing 实际版本及对应 npm 包许可证；将版本、许可证、GitHub 参考链接和仅借鉴的技术点写进 README。
- [ ] 在 README 写明 `npm install`、`npm run dev`、`npm run build` 和输出目录 `dist/`。

---

## 计划自查

- 设计覆盖：三颗栏目星、DOM 导航、栏目直达路由、跃迁、蝴蝶、错误降级、移动端、减少动态效果、开源许可及生产构建分别由 Task 1–5 覆盖。
- 占位扫描：步骤中没有 TBD/TODO 或“之后再补”的实现要求；首期栏目条目只是当前设计规定的展示占位。
- 接口一致性：`Section` 类型在 Task 1 的数据文件导出；Task 2 的场景和 Task 3 的控制器共享它；Task 4 的 fallback 复用同一 `sections`。

