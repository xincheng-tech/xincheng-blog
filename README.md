# 星辰界 · Xingchen Verse

杨鑫成的个人小世界：用星海呈现日常、技术与播客。

## 本地运行

```sh
npm install
npm run dev
npm run build
npm run preview
```

构建输出位于 `dist/`。栏目定义在 `src/data/sections.ts`，首页 3D 场景由独立 React 岛提供，栏目详情由 Astro 静态生成。

## 技术与许可证

- Astro 7.4.13 — MIT
- @astrojs/react 7.1.9 — MIT
- @astrojs/check 0.9.12 — MIT
- React / React DOM 19.3.1 — MIT
- Three.js 0.183.2 — MIT
- React Three Fiber 9.8.2 — MIT
- React Three Postprocessing 3.2.2 — MIT
- postprocessing 6.39.6 — Zlib
- TypeScript 6.0.3 — Apache-2.0

场景使用公开包 API 和程序生成的视觉，不复制模板仓库代码或第三方插画。

## 参考项目

- [three.js](https://github.com/mrdoob/three.js) — 渲染基础
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) — React 场景生命周期
- [postprocessing](https://github.com/pmndrs/postprocessing) — 后处理组件
- [folio-2019](https://github.com/brunosimon/folio-2019) — 相机与空间交互编排参考，仅参考方法

代码与资产授权以锁定版本及各仓库 LICENSE 为准；未复制无许可证或 NOASSERTION 项目的代码与资产。
