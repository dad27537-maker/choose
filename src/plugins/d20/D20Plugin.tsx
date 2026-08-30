import type { Plugin } from '../../types'
import { D20View } from '../d28/D28Plugin'

// Public plugin entry point. The implementation lives in the legacy folder
// for now so existing local sessions keep their import path stable.
export { D20View, verdictFor } from '../d28/D28Plugin'
export type { D20Roll } from '../d28/D28Plugin'

export const D20Plugin: Plugin = {
  id: 'dice.d20',
  name: '命运 D20',
  description: '在犹豫时，给一件事一个清晰落点。',
  icon: '✦',
  version: '1.0.0',
  apiVersion: '1',
  entryPoint: 'src/plugins/d20/D20Plugin.tsx',
  capabilities: ['本地会话', '安全随机', '结果复制'],
  accent: 'violet',
  component: D20View,
}
