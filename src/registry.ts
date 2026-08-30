import type { Plugin } from './types'
import { D20Plugin } from './plugins/d20/D20Plugin'
import { InteractiveD20Plugin } from './plugins/interactive-d20/InteractiveD20Plugin'
import { AlmanacPlugin } from './plugins/almanac/AlmanacPlugin'
import { JiaobeiPlugin } from './plugins/jiaobei/JiaobeiPlugin'
import { LingqianPlugin } from './plugins/lingqian/LingqianPlugin'

// Keep discovery data independent from the shell. A future package loader can
// replace this array without changing navigation or the conversation surface.
export const pluginRegistry: Plugin[] = [D20Plugin, InteractiveD20Plugin, AlmanacPlugin, JiaobeiPlugin, LingqianPlugin]
export const getPlugin = (id: string) => pluginRegistry.find((plugin) => plugin.id === id)
