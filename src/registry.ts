import { lazy } from 'react'
import type { Plugin } from './types'

const D20View = lazy(() => import('./plugins/d20/D20Plugin').then((module) => ({ default: module.D20View })))
const InteractiveD20View = lazy(() => import('./plugins/interactive-d20/InteractiveD20Plugin').then((module) => ({ default: module.InteractiveD20View })))
const AlmanacView = lazy(() => import('./plugins/almanac/AlmanacPlugin').then((module) => ({ default: module.AlmanacView })))
const JiaobeiView = lazy(() => import('./plugins/jiaobei/JiaobeiPlugin').then((module) => ({ default: module.JiaobeiView })))
const LingqianView = lazy(() => import('./plugins/lingqian/LingqianPlugin').then((module) => ({ default: module.LingqianView })))

// Manifests stay synchronous so the shell renders instantly. Implementations
// and heavier 3D code are loaded only when the user opens that tool.
export const pluginRegistry: Plugin[] = [
  {
    id: 'dice.d20', name: '命运 D20', description: '在犹豫时，给一件事一个清晰落点。', icon: '✦', version: '1.0.0', apiVersion: '1',
    entryPoint: 'src/plugins/d20/D20Plugin.tsx', capabilities: ['本地会话', '安全随机', '结果复制'], accent: 'violet', component: D20View,
  },
  {
    id: 'dice.d20-interactive', name: '互动 D20', description: '拖拽、缩放并亲手掷出一枚可互动的 3D 二十面骰子。', icon: '◈', version: '1.0.0', apiVersion: '1',
    entryPoint: 'src/plugins/interactive-d20/InteractiveD20Plugin.tsx', capabilities: ['3D 可交互', '拖拽旋转', '滚轮缩放'], accent: 'blue', component: InteractiveD20View,
  },
  {
    id: 'calendar.almanac', name: '万年历 · 老黄历', description: '查看每日公历、农历、节气与宜忌参考。', icon: '历', version: '1.0.0', apiVersion: '1',
    entryPoint: 'src/plugins/almanac/AlmanacPlugin.tsx', capabilities: ['公历农历换算', '节气参考', '宜忌建议'], accent: 'amber', component: AlmanacView,
  },
  {
    id: 'divination.jiaobei', name: '投掷筊杯', description: '输入想询问的事情，投掷筊杯获取民俗参考。', icon: '卜', version: '1.0.0', apiVersion: '1',
    entryPoint: 'src/plugins/jiaobei/JiaobeiPlugin.tsx', capabilities: ['问题输入', '动画投掷', '圣杯笑杯阴杯'], accent: 'amber', component: JiaobeiView,
  },
  {
    id: 'divination.lingqian', name: '灵签问卦', description: '输入所问之事，互动摇筒抽取六十四卦签并获得详细解读。', icon: '易', version: '1.1.0', apiVersion: '1',
    entryPoint: 'src/plugins/lingqian/LingqianPlugin.tsx', capabilities: ['3D 真实签筒', '六十四卦', '逐卦详解', '本地历史'], accent: 'amber', component: LingqianView,
  },
]
export const getPlugin = (id: string) => pluginRegistry.find((plugin) => plugin.id === id)
