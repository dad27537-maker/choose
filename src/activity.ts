export const D20_HISTORY_KEY = 'plugin-deck:d20-history'
export const INTERACTIVE_D20_HISTORY_KEY = 'plugin-deck:interactive-d20-history'
export const JIAOBEI_HISTORY_KEY = 'plugin-deck:jiaobei-history'
export const LINGQIAN_HISTORY_KEY = 'plugin-deck:lingqian-history'

export type D20HistoryItem = { id: string; subject: string; value: number; at: string; verdict?: { label: string } }
export type InteractiveD20HistoryItem = { id: string; value: number; label: string; at: string }
export type JiaobeiOutcome = 'sheng' | 'xiao' | 'yin'
export type JiaobeiHistoryItem = { id: string; question: string; outcome: JiaobeiOutcome; label: string; at: string }
export type LingqianHistoryItem = { id: string; question: string; number: number; at: string }
