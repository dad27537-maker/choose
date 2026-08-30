import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Clipboard, Dice5, History, RotateCw, Sparkles, Trash2 } from 'lucide-react'
import type { PluginComponentProps } from '../../types'
import { readStorage, writeStorage } from '../../storage'
import { rollD20 } from './random'
import { D20Scene } from '../d20/D20Scene'
import { D20_SKIN_KEY, D20SkinPicker, isD20SkinId, type D20SkinId } from '../d20/skins'

type Verdict = {
  label: string
  detail: string
  tone: 'critical' | 'no' | 'soft-no' | 'soft-yes' | 'yes'
}

export type D20Roll = {
  id: string
  subject: string
  value: number
  verdict: Verdict
  at: string
}

type ChatItem =
  | { id: string; role: 'user'; text: string; rollId?: string }
  | { id: string; role: 'plugin'; text: string; roll?: D20Roll }

const HISTORY_KEY = 'plugin-deck:d20-history'
const MESSAGES_KEY = 'plugin-deck:d20-messages'
const HISTORY_CHANGE_EVENT = 'plugin-deck:history-change'

type HistoryChange = { type: 'delete'; id: string } | { type: 'clear' }

function id() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function verdictFor(value: number): Verdict {
  if (value === 1) return { label: '大失败', detail: '先停一下，换个更小、更稳的第一步。', tone: 'critical' }
  if (value === 20) return { label: '大成功', detail: '这是一个值得全力推进的信号。', tone: 'critical' }
  if (value <= 5) return { label: '不建议', detail: '现在的阻力偏大，可以先保留这个想法。', tone: 'no' }
  if (value <= 10) return { label: '偏向不做', detail: '如果没有额外理由，暂时不行动也没关系。', tone: 'soft-no' }
  if (value <= 15) return { label: '偏向去做', detail: '从最轻量的版本开始，给它一次机会。', tone: 'soft-yes' }
  return { label: '建议', detail: '条件已经不错，可以把它放进今天的计划。', tone: 'yes' }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function DiceMark({ value, rolling, skin }: { value?: number; rolling?: boolean; skin: D20SkinId }) {
  const criticalClass = value === 20 ? 'critical-success' : value === 1 ? 'critical-failure' : ''
  return (
    <div className={`d20-stage skin-${skin} ${criticalClass} ${rolling ? 'is-rolling' : ''}`} aria-label={value ? `D20 点数 ${value}` : 'D20 骰子'}>
      <div className="d20-halo" />
      <D20Scene key={skin} value={value} rolling={rolling} skin={skin} />
    </div>
  )
}

function ResultCard({ roll, skin }: { roll: D20Roll; skin: D20SkinId }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    const text = `「${roll.subject}」\nD20：${roll.value} · ${roll.verdict.label}\n${roll.verdict.detail}`
    try {
      await navigator.clipboard?.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }
  return (
    <article className={`roll-result tone-${roll.verdict.tone}`}>
      <div className="result-topline"><span><Sparkles size={14} />骰子已落地</span><time>{formatTime(roll.at)}</time></div>
      <div className="result-body">
        <DiceMark value={roll.value} skin={skin} />
        <div className="result-copy"><span className="result-number">{roll.value}<small>/20</small></span><strong>{roll.verdict.label}</strong><p>{roll.verdict.detail}</p></div>
      </div>
      <div className="result-footer"><span>关于：{roll.subject}</span><button className="icon-button" onClick={copy} aria-label="复制结果">{copied ? <Check size={14} /> : <Clipboard size={14} />}<span>{copied ? '已复制' : '复制'}</span></button></div>
    </article>
  )
}

export function D20View({ onActivity, newSessionToken }: PluginComponentProps) {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatItem[]>(() => readStorage(MESSAGES_KEY, []))
  const [history, setHistory] = useState<D20Roll[]>(() => readStorage(HISTORY_KEY, []))
  const [rolling, setRolling] = useState(false)
  const [rollingValue, setRollingValue] = useState<number>()
  const [notice, setNotice] = useState('')
  const [skin, setSkin] = useState<D20SkinId>(() => {
    const stored = readStorage<string>(D20_SKIN_KEY, 'midnight')
    return isD20SkinId(stored) ? stored : 'midnight'
  })
  const messageListRef = useRef<HTMLDivElement>(null)
  const rollingRowRef = useRef<HTMLDivElement>(null)
  const latest = useMemo(() => history[0], [history])
  const historyRef = useRef(history)
  historyRef.current = history

  const changeSkin = (next: D20SkinId) => {
    setSkin(next)
    writeStorage(D20_SKIN_KEY, next)
  }

  useEffect(() => writeStorage(MESSAGES_KEY, messages), [messages])
  useEffect(() => writeStorage(HISTORY_KEY, history), [history])
  useEffect(() => {
    if (newSessionToken && newSessionToken > 0) setMessages([])
  }, [newSessionToken])
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (rolling && rollingRowRef.current) {
        rollingRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (messageListRef.current) {
        messageListRef.current.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' })
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [messages.length, rolling])
  useEffect(() => {
    const handleHistoryChange = (event: Event) => {
      const detail = (event as CustomEvent<HistoryChange>).detail
      if (!detail) return
      if (detail.type === 'clear') {
        setHistory([])
        return
      }
      const deletedRoll = historyRef.current.find((item) => item.id === detail.id)
      setHistory((items) => items.filter((item) => item.id !== detail.id))
      setMessages((items) => items.filter((item, index) => {
        if (item.role === 'plugin') return item.roll?.id !== detail.id
        if (item.rollId === detail.id) return false
        const next = items[index + 1]
        return !(deletedRoll && item.text === deletedRoll.subject && next?.role === 'plugin' && next.roll?.id === detail.id)
      }))
    }
    window.addEventListener(HISTORY_CHANGE_EVENT, handleHistoryChange)
    return () => window.removeEventListener(HISTORY_CHANGE_EVENT, handleHistoryChange)
  }, [])

  const submit = () => {
    const subject = draft.trim()
    if (!subject || rolling) {
      if (!subject) setNotice('先写下一件事，骰子才能替你给出一个落点。')
      return
    }
    setNotice('')
    setDraft('')
    const rollId = id()
    const value = rollD20()
    setRollingValue(value)
    setMessages((items) => [...items, { id: id(), role: 'user', text: subject, rollId }])
    setRolling(true)
    window.setTimeout(() => {
      const roll: D20Roll = { id: rollId, subject, value, verdict: verdictFor(value), at: new Date().toISOString() }
      setHistory((items) => [roll, ...items].slice(0, 30))
      setMessages((items) => [...items, { id: id(), role: 'plugin', text: '我把这件事交给了命运骰。', roll }])
      setRollingValue(undefined)
      setRolling(false)
      onActivity?.()
    }, 1250)
  }

  const clearHistory = () => {
    if (window.confirm('确定清空最近的投掷记录吗？')) {
      setHistory([])
      onActivity?.()
    }
  }

  const newConversation = () => {
    setMessages([])
    setNotice('')
  }

  return (
    <section className="conversation-page">
      <header className="conversation-header">
        <div className="conversation-title"><span className="app-avatar plugin-avatar"><Dice5 size={18} /></span><div><strong>命运 D20</strong><span>决策骰插件 · 本地运行</span></div></div>
        <div className="header-actions"><D20SkinPicker value={skin} onChange={changeSkin} /><span className="secure-pill"><span />安全随机</span><button className="quiet-button" onClick={newConversation}><RotateCw size={15} />新会话</button></div>
      </header>

      <div className="conversation-layout">
        <main className="message-column" aria-live="polite">
          {messages.length === 0 ? (
            <div className="welcome-state">
              <div className="welcome-orbit"><DiceMark skin={skin} /><span>✦</span></div>
              <p className="eyebrow">D20 · DECISION COMPANION</p>
              <h1>把犹豫，交给<br /><em>一点点命运。</em></h1>
              <p className="welcome-copy">写下一件让你犹豫的事。骰子不替你生活，<br />但会给你一个可以开始的落点。</p>
              <div className="prompt-chips">{['今晚要不要去散步？', '现在适合开始新计划吗？', '要不要给那个人发消息？'].map((prompt) => <button key={prompt} onClick={() => setDraft(prompt)}>{prompt}</button>)}</div>
            </div>
          ) : (
            <div className="message-list" ref={messageListRef}>
              {messages.map((message) => message.role === 'user' ? <div className="message-row user-row" key={message.id}><div className="user-bubble">{message.text}</div></div> : <div className="message-row plugin-row" key={message.id}><span className="app-avatar mini-avatar"><Dice5 size={14} /></span><div className="plugin-message"><p>{message.text}</p>{message.roll && <ResultCard roll={message.roll} skin={skin} />}</div></div>)}
              {rolling && <div className="message-row plugin-row rolling-row" ref={rollingRowRef}><span className="app-avatar mini-avatar"><Dice5 size={14} /></span><div className="rolling-bubble"><DiceMark value={rollingValue} rolling skin={skin} /><span>骰子正在翻滚，寻找答案…</span></div></div>}
            </div>
          )}
          <div className="composer-wrap">
            {notice && <p className="form-message" role="alert">{notice}</p>}
            <div className="composer"><textarea value={draft} onChange={(event) => { setDraft(event.target.value); setNotice('') }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit() } }} placeholder="写下你想交给骰子的事情…" rows={1} aria-label="输入你想决定的事情" /><button className="send-button" onClick={submit} disabled={rolling || !draft.trim()} aria-label="掷出 D20"><Dice5 size={18} /></button></div>
            <div className="composer-hint"><span>Enter 掷骰 · Shift + Enter 换行</span><span>结果仅保存在本机</span></div>
          </div>
        </main>

        <aside className="activity-panel">
          <div className="panel-heading"><div><p className="eyebrow">ROLL LOG</p><h2>最近投掷</h2></div>{history.length > 0 && <button className="icon-button danger" onClick={clearHistory} aria-label="清空记录"><Trash2 size={14} /></button>}</div>
          {history.length === 0 ? <div className="panel-empty"><History size={21} /><p>还没有投掷记录</p><span>你的每一次落点，<br />都会安静地留在这里。</span></div> : <div className="roll-log">{history.map((roll) => <div className="log-item" key={roll.id}><div className={`log-number tone-${roll.verdict.tone}`}>{roll.value}</div><div><strong>{roll.verdict.label}</strong><span>{roll.subject}</span><time>{formatTime(roll.at)}</time></div></div>)}</div>}
          {latest && <div className="panel-tip"><Sparkles size={15} /><p>每个结果都是一个起点，不是最终答案。</p></div>}
        </aside>
      </div>
    </section>
  )
}
