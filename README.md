# 星辰界 · Xingchen Verse

杨鑫成的个人小世界：通过可探索的 3D 太阳系进入日常、技术与播客。

## 本地运行

```sh
npm install
npm run dev
npm run build
npm run preview
```

构建输出位于 `dist/`。栏目定义在 `src/data/sections.ts`，首页和栏目详情都由 React Three Fiber 场景呈现；栏目页中的每条内容对应一个可聚焦、可交互的内容星。

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

场景使用 Solar System Scope 的天体贴图和 ESO/S. Brunier 的银河全景。来源、署名和修改说明见站内的「影像来源」页面。

站点使用自托管的 Noto Sans SC（SIL OFL 1.1），字体文件包含现有页面文案所用字符。新增字符由系统中文字体补齐。

## 参考项目

- [three.js](https://github.com/mrdoob/three.js) — 渲染基础
- [Three.js Bump Mapping](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_materials_bumpmap.html) — 行星表面细节与受光的参考
- [Drei Stars](https://github.com/pmndrs/drei/blob/master/src/core/Stars.tsx) — 批量绘制三维星点的参考
- [Solar System Three.js](https://github.com/sanderblue/solar-system-threejs) — 恒星、行星和轨道的空间关系参考
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) — React 场景生命周期
- [postprocessing](https://github.com/pmndrs/postprocessing) — 后处理组件
- [folio-2019](https://github.com/brunosimon/folio-2019) — 相机与空间交互编排参考，仅参考方法

代码与资产授权以锁定版本及各仓库 LICENSE 为准；未复制无许可证或 NOASSERTION 项目的代码与资产。
