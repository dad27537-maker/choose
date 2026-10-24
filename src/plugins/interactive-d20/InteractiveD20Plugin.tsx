import { useEffect, useState } from 'react'
import { Dice5, MousePointer2, RotateCw, Sparkles, ZoomIn } from 'lucide-react'
import type { Plugin, PluginComponentProps } from '../../types'
import { readStorage, writeStorage } from '../../storage'
import { rollD20 } from '../d28/random'
import { D20Scene } from '../d20/D20Scene'
import { D20_SKIN_KEY, D20SkinPicker, isD20SkinId, type D20SkinId } from '../d20/skins'
import { verdictFor } from '../d28/D28Plugin'
import { INTERACTIVE_D20_HISTORY_KEY, type InteractiveD20HistoryItem } from '../../activity'

function historyId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function InteractiveD20View({ onActivity, newSessionToken }: PluginComponentProps) {
  const [value, setValue] = useState(20)
  const [rolling, setRolling] = useState(false)
  const [rollingValue, setRollingValue] = useState<number>()
  const [skin, setSkin] = useState<D20SkinId>(() => {
    const stored = readStorage<string>(D20_SKIN_KEY, 'midnight')
    return isD20SkinId(stored) ? stored : 'midnight'
  })

  useEffect(() => {
    if (!newSessionToken) return
    setValue(20)
    setRollingValue(undefined)
    setRolling(false)
  }, [newSessionToken])

  const roll = () => {
    if (rolling) return
    const nextValue = rollD20()
    setRollingValue(nextValue)
    setRolling(true)
    window.setTimeout(() => {
      setValue(nextValue)
      setRollingValue(undefined)
      setRolling(false)
      const item: InteractiveD20HistoryItem = { id: historyId(), value: nextValue, label: verdictFor(nextValue).label, at: new Date().toISOString() }
      writeStorage(INTERACTIVE_D20_HISTORY_KEY, [item, ...readStorage<InteractiveD20HistoryItem[]>(INTERACTIVE_D20_HISTORY_KEY, [])].slice(0, 30))
      onActivity?.()
    }, 1250)
  }

  const changeSkin = (next: D20SkinId) => {
    setSkin(next)
    writeStorage(D20_SKIN_KEY, next)
  }

  const verdict = verdictFor(value)

  return (
    <section className="interactive-d20-page">
      <header className="conversation-header">
        <div className="conversation-title"><span className="app-avatar plugin-avatar interactive-plugin-avatar"><Dice5 size={18} /></span><div><strong>互动 D20</strong><span>3D 骰子实验室 · 本地运行</span></div></div>
        <div className="header-actions"><D20SkinPicker value={skin} onChange={changeSkin} /><span className="secure-pill"><span />实时渲染</span><button className="quiet-button" onClick={roll} disabled={rolling}><RotateCw size={15} />{rolling ? '投掷中' : '投掷'}</button></div>
      </header>

      <div className="interactive-d20-layout">
        <div className={`interactive-die-card skin-card-${skin}`}>
          <div className="interactive-die-viewport"><D20Scene key={skin} value={rolling ? rollingValue : value} rolling={rolling} interactive skin={skin} onManualThrow={roll} /></div>
          <div className="interactive-die-hint"><span><MousePointer2 size={14} />拖拽旋转</span><span><ZoomIn size={14} />滚轮缩放</span><span>甩动后释放即可投掷</span></div>
        </div>
        <aside className="interactive-info-card">
          <p className="eyebrow">3D D20 · INTERACTIVE</p>
          <h1>亲手滚动<br /><em>一点命运。</em></h1>
          <p className="interactive-description">这是一枚可以直接操控的 3D 二十面骰子。拖拽它观察每个面，滚轮调整距离，然后让它替你投出一个结果。</p>
          <button className="interactive-roll-button" onClick={roll} disabled={rolling}><Dice5 size={18} />{rolling ? '骰子正在翻滚…' : '掷出 D20'}</button>
          <div className="interactive-result"><span className="interactive-result-label"><Sparkles size={14} />最近结果</span><strong>{value}<small>/20</small></strong><span className={`interactive-verdict tone-${verdict.tone}`}>{verdict.label}</span></div>
          <div className="interactive-note">拖拽不会改变点数；点按“掷出 D20”才会开始一次新的随机投掷。</div>
        </aside>
      </div>
    </section>
  )
}

export const InteractiveD20Plugin: Plugin = {
  id: 'dice.d20-interactive',
  name: '互动 D20',
  description: '拖拽、缩放并亲手掷出一枚可互动的 3D 二十面骰子。',
  icon: '◈',
  version: '1.0.0',
  apiVersion: '1',
  entryPoint: 'src/plugins/interactive-d20/InteractiveD20Plugin.tsx',
  capabilities: ['3D 可交互', '拖拽旋转', '滚轮缩放'],
  accent: 'blue',
  component: InteractiveD20View,
}
