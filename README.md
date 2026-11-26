# 星辰界 · Xingchen Verse

杨鑫成的个人小世界：通过可探索的 3D 太阳系进入日常、技术与播客。

## 本地运行

```sh
npm install
npm run dev
npm run build
npm run preview
```

构建输出位于 `dist/`。栏目定义在 `src/data/sections.ts`，首页和栏目详情由 Astro + React Three Fiber + React Bits 呈现；栏目页中的每颗卫星/行星对应一条可聚焦、可试听星球频段与播客章节的内容星。

## 动态效果与开源美术资源

### React Bits 交互与排版动效 (`src/components/react-bits/`)
- **Aurora**：响应指针的深空极光背景层
- **ClickSpark**：全局星芒点击粒子与脉冲波纹
- **TargetCursor**：星际观星仪四角锁定准星与浮动标签
- **Dock**：底部弹性缩放星际导航与环境电台控制栏
- **SpotlightCard / StarBorder / ElectricBorder / HoloCard / Magnet**：聚光灯卡片、流光星轨边框、电弧全息舱与磁吸微交互
- **DecryptedText / ShinyText / GradientText / CurvedLoop**：星际坐标解密、流光金属字、流体渐变标题与弧形轨道跑马灯

### GitHub 开源美术与天体资产
- **[DavidHDev/react-bits](https://github.com/DavidHDev/react-bits)** — MIT + Commons Clause（见 `public/licenses/react-bits.txt`）
- **[johnmorrisdotca/wakusei-planets](https://github.com/johnmorrisdotca/wakusei-planets)** — MIT（手绘星球卡面及 NASA / JPL / USGS 公共领域卫星与矮行星贴图，见 `public/licenses/wakusei-planets-MIT.txt`）
- **[gravity-ui/illustrations](https://github.com/gravity-ui/illustrations)** — MIT（深色主题矢量插画，见 `public/licenses/gravity-illustrations-MIT.txt`）
- **[SamHerbert/SVG-Loaders](https://github.com/SamHerbert/SVG-Loaders)** — MIT（动态声波频谱与星环加载 SVG，见 `public/licenses/svg-loaders-MIT.txt`）
- **[boringdesigners/boring-avatars](https://github.com/boringdesigners/boring-avatars)** — MIT（程序化星云与星环徽章，见 `public/licenses/boring-avatars-MIT.txt`）
- **Solar System Scope & ESO/S. Brunier** — CC BY 4.0（太阳系行星贴图与银河全景，详见站内「影像与美术来源」页）
- **Noto Sans SC** — SIL OFL 1.1（见 `public/licenses/noto-sans-sc-OFL.txt`）
