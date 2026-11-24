# 星辰界青玉蝴蝶与墨韵背景 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 精修首页唯一的青玉蝴蝶，加入克制的墨迹书法背景，并让跃迁动画在抵达后再导航。

**Architecture:** 保持现有 Astro SSR 导航、React Three Fiber 场景和 Canvas 2D 蝴蝶分层。墨迹是首页装饰性 DOM 层；蝴蝶继续独立 Canvas 绘制；相机使用按时间计算的贝塞尔曲线和缓动函数，`UniverseExperience` 使用同一个 1600ms 航行时长安排导航。

**Tech Stack:** Astro、React、Three.js、React Three Fiber、Canvas 2D、CSS。

## Global Constraints

- 只保留青玉蝴蝶这一种实现。
- 不修改 `demo/index.html`，不添加依赖或外部图片资产。
- 墨迹和书法只在边缘低对比显示，不遮挡中央标题和栏目入口。
- 减少动态效果时跳过飞行并直接访问栏目。
- 保留 `codex/xingchen-first-release` 原分支；此次变更单独发布到 GitHub 新分支。

---

## Task 1: 添加克制的墨迹氛围层

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/styles/global.css`

**Implementation:**
- 在首页主容器中加一个 `aria-hidden="true"` 的装饰层，内含两侧竖排短句和程序化的干笔曲线。
- 用暖灰玉色、低透明度和向中心/上下渐隐，让文字仅作为空间深度；控制在标题与栏目文字后方。
- 按移动端缩窄边缘文字并降低 opacity；不放入栏目点击热区。

## Task 2: 精修青玉蝴蝶和穿梭动作

**Files:**
- Modify: `src/components/ButterflyGuide.tsx`
- Modify: `src/components/UniverseExperience.tsx`
- Modify: `src/styles/global.css`

**Implementation:**
- 保留既有蝶翼四翅 Path2D 结构，将偏粉紫的渐变替换为青玉、雾白、少量金色细节；用低透明翼膜和细发光线表达玉石透光感，删除宽阔光环并限制余辉粒子数量。
- 通过 CSS 将桌面蝴蝶显示为约 `156px × 114px`；窄屏不显示大型浮蝶，以免遮住入口。
- 给 `ButterflyGuide` 增加 `traveling` 和 `flightKey` 驱动的纯 CSS 飞行动画：以目标为终点、略微上弧、缩小并在末尾淡出；普通预览保持缓慢浮动。
- 抽出 `TRAVEL_DURATION_MS = 1600`，导航定时器用该值；Escape 和系统切换减少动态效果时清理飞行与复位 timer。

## Task 3: 将相机跃迁改成有终点的曲线路径

**Files:**
- Modify: `src/components/StarfieldScene.tsx`
- Modify: `src/components/UniverseExperience.tsx`

**Implementation:**
- 在 `CameraRig` 中检测 phase 从非 travel 切到 travel 时记录起点和开始时间。
- 令 `t = clamp((elapsed - start) / 1.6, 0, 1)`，使用 `t*t*(3-2*t)` 缓动值沿三次 Bézier 曲线更新相机，并让镜头持续朝向选中星体。
- Escape 时用同一缓动方式返回 home；非 travel 状态的微小漂移仍使用短时平滑过渡。
- 保持 `onContextLost`、移动端低粒子和 reduced-motion 直达行为不变。

## 验收方式

- 运行 `npm run check` 与 `npm run build`，要求类型检查无诊断且栏目路由都生成。
- 用本地浏览器检查桌面悬停、1.6 秒抵达、Escape 返回、移动端栏目入口无遮挡，以及墨迹对主标题/入口的对比度。
- 使用 `git diff -- src/pages/index.astro` 等确认 `demo/index.html` 不在变更范围。
- 在 GitHub 验证新分支以旧功能分支提交为祖先，保留旧分支不变，并确认新提交可单独 Revert。
