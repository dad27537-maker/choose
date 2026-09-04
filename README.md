# 骰间 · Plugin Deck

一个本地运行的轻量工具工作台。每个功能都是独立插件，适合在需要一个明确落点、快速查阅或仪式感互动时使用。

## 功能

- **灵签问卦**：输入所问之事，互动摇动 3D 签筒，抽取六十四卦，并获得逐卦的结构、行动、时机、避忌与现实核验建议。
- **命运 D20**：为犹豫中的事情生成一个清晰落点。
- **互动 D20**：拖拽、缩放并亲手掷出 3D 二十面骰子。
- **投掷筊杯**：通过互动投掷获得民俗参考。
- **万年历 · 老黄历**：查看公历、农历、节气与宜忌信息。
- **本地记录**：抽签和掷骰记录保存在当前设备，可搜索、删除或清空。
- **主题切换**：支持跟随系统、浅色和深色主题。

## 快速开始

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

打开终端输出的本地地址即可使用。生产构建：

```bash
npm run build
```

类型检查：

```bash
npm run typecheck
```

## 项目结构

```text
src/
├─ App.tsx                 # 工作台外壳、导航与记录页
├─ registry.ts             # 插件注册表
├─ storage.ts              # 本地存储工具
└─ plugins/
   ├─ d20/                 # 命运 D20
   ├─ interactive-d20/     # 互动 D20
   ├─ almanac/             # 万年历
   ├─ jiaobei/             # 筊杯
   └─ lingqian/            # 灵签问卦与六十四卦数据
```

## 技术栈

React、TypeScript、Vite、Three.js、Lucide React。

项目默认不依赖后端服务；记录和偏好仅保存在浏览器本地。占卜内容属于传统文化与自我思考参考，不替代医疗、法律、财务或其他专业意见。

## 在线仓库

[github.com/dad27537-maker/choose](https://github.com/dad27537-maker/choose)
