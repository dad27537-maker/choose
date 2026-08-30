import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Compass, Info, Sparkles } from 'lucide-react'
import type { Plugin, PluginComponentProps } from '../../types'
import './almanac.css'

type AlmanacProfile = {
  lunar: string
  ganzhi: string
  zodiac: string
  solarTerm: string
  solarTermDate: string
  clash: string
  direction: string
  luckyTime: string
  yi: string[]
  ji: string[]
}

const zodiac = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const yiPool = ['整理房间', '阅读学习', '制定计划', '散步放松', '沟通交流', '整理账目', '轻量运动', '短途出行', '复盘记录', '烹饪下厨', '断舍离', '修剪植物']
const jiPool = ['冲动消费', '熬夜晚睡', '仓促决定', '长途奔波', '争执沟通', '过量饮酒', '盲目跟风', '一次做太多事', '临时改约', '拖延重要事项', '大额投资', '过度劳累']
const directions = ['正东', '东南', '正南', '西南', '正西', '西北', '正北', '东北']
const luckyTimes = ['卯时 · 05:00–07:00', '辰时 · 07:00–09:00', '午时 · 11:00–13:00', '申时 · 15:00–17:00', '戌时 · 19:00–21:00']
const solarTerms = [
  ['小寒', 1, 5], ['大寒', 1, 20], ['立春', 2, 4], ['雨水', 2, 19], ['惊蛰', 3, 5], ['春分', 3, 20],
  ['清明', 4, 4], ['谷雨', 4, 20], ['立夏', 5, 5], ['小满', 5, 21], ['芒种', 6, 5], ['夏至', 6, 21],
  ['小暑', 7, 7], ['大暑', 7, 22], ['立秋', 8, 7], ['处暑', 8, 23], ['白露', 9, 7], ['秋分', 9, 23],
  ['寒露', 10, 8], ['霜降', 10, 23], ['立冬', 11, 7], ['小雪', 11, 22], ['大雪', 12, 7], ['冬至', 12, 21],
] as const

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function chineseDay(value: string) {
  const day = Number(value)
  if (!day || day > 30) return value
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  if (day <= 10) return `初${digits[day]}`
  if (day < 20) return `十${day === 10 ? '' : digits[day - 10]}`
  if (day === 20) return '二十'
  if (day < 30) return `廿${digits[day - 20]}`
  return '三十'
}

function lunarParts(date: Date) {
  const parts = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { year: 'numeric', month: 'long', day: 'numeric' }).formatToParts(date)
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return { year: part('relatedYear'), ganzhi: part('yearName'), month: part('month'), day: chineseDay(part('day')) }
}

function solarTermFor(date: Date) {
  const year = date.getFullYear()
  const candidates = solarTerms.map(([name, month, day]) => ({ name, date: new Date(year, month - 1, day) }))
  return candidates.reduce((nearest, current) => Math.abs(current.date.getTime() - date.getTime()) < Math.abs(nearest.date.getTime() - date.getTime()) ? current : nearest)
}

function profileFor(date: Date): AlmanacProfile {
  const lunar = lunarParts(date)
  const solarTerm = solarTermFor(date)
  const dayNumber = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86400000)
  const seed = Math.abs(dayNumber + Number(lunar.day.replace(/\D/g, '')))
  const pick = (pool: string[], count: number, offset: number) => Array.from({ length: count }, (_, index) => pool[(seed + offset + index * 5) % pool.length])
  const zodiacIndex = ((Number(lunar.year || date.getFullYear()) - 4) % zodiac.length + zodiac.length) % zodiac.length
  const clash = zodiac[(zodiacIndex + 6) % zodiac.length]
  return {
    lunar: `${lunar.month}${lunar.day}`,
    ganzhi: lunar.ganzhi,
    zodiac: zodiac[zodiacIndex],
    solarTerm: solarTerm.name,
    solarTermDate: `${solarTerm.date.getMonth() + 1}月${solarTerm.date.getDate()}日`,
    clash: `冲${clash} · 煞${directions[(seed + 3) % directions.length]}`,
    direction: directions[seed % directions.length],
    luckyTime: luckyTimes[seed % luckyTimes.length],
    yi: pick(yiPool, 5, 2),
    ji: pick(jiPool, 5, 5),
  }
}

function shiftDate(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function CalendarSheet({ date, profile, isToday, className = '', onPageClick }: { date: Date; profile: AlmanacProfile; isToday?: boolean; className?: string; onPageClick?: () => void }) {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(date)
  return <article className={`calendar-sheet ${className}`} onClick={onPageClick} onKeyDown={(event) => { if (onPageClick && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onPageClick() } }} role={onPageClick ? 'button' : undefined} tabIndex={onPageClick ? 0 : undefined} title={onPageClick ? '点击撕下这一页，翻到下一天' : undefined}>
    <div className="calendar-sheet-head"><span>万年历</span><strong>宜忌参考</strong></div>
    <div className="calendar-sheet-date"><span>{month}月</span><strong>{day}</strong><span>{weekday}</span></div>
    <div className="calendar-sheet-lunar"><span>农历</span><strong>{profile.lunar}</strong><span>{profile.ganzhi}年 · 属{profile.zodiac}</span>{isToday && <em>今天</em>}</div>
    <div className="calendar-sheet-facts"><div><span>节气</span><strong>{profile.solarTerm}</strong><small>约 {profile.solarTermDate}</small></div><div><span>冲煞</span><strong>{profile.clash.split(' · ')[0]}</strong><small>{profile.clash.split(' · ')[1]}</small></div><div><span>财神方位</span><strong>{profile.direction}</strong><small>参考方向</small></div><div><span>吉时</span><strong>{profile.luckyTime.split(' · ')[0]}</strong><small>{profile.luckyTime.split(' · ')[1]}</small></div></div>
    <div className="calendar-sheet-divider"><span>今日宜忌</span><small>TRADITIONAL REFERENCE</small></div>
    <div className="calendar-sheet-yi-ji"><section><h3><b>宜</b><span>适合安排</span></h3><div>{profile.yi.map((item) => <span key={item}>{item}</span>)}</div></section><section><h3><b>忌</b><span>尽量避免</span></h3><div>{profile.ji.map((item) => <span key={item}>{item}</span>)}</div></section></div>
    <div className="calendar-sheet-foot"><span>仅供传统历法参考</span><span>{profile.direction} · {profile.luckyTime}</span></div>
  </article>
}

export function AlmanacView(_: PluginComponentProps) {
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()))
  const [pendingDate, setPendingDate] = useState<string>()
  const [turning, setTurning] = useState(false)
  const date = useMemo(() => parseDate(selectedDate), [selectedDate])
  const profile = useMemo(() => profileFor(date), [date])
  const isToday = selectedDate === dateKey(new Date())

  const changeDate = (next: string) => {
    if (!next || next === selectedDate || turning) return
    setPendingDate(next)
    setTurning(true)
    window.setTimeout(() => {
      setSelectedDate(next)
      setPendingDate(undefined)
      setTurning(false)
    }, 620)
  }
  const moveDate = (amount: number) => changeDate(dateKey(shiftDate(date, amount)))
  const resetToday = () => changeDate(dateKey(new Date()))
  const pending = pendingDate ? parseDate(pendingDate) : undefined
  const pendingProfile = pending ? profileFor(pending) : undefined

  return <section className="almanac-page">
    <header className="almanac-header"><div className="conversation-title"><span className="app-avatar almanac-avatar"><CalendarDays size={18} /></span><div><strong>万年历 · 老黄历</strong><span>传统历法工具 · 本地运行</span></div></div><div className="almanac-header-actions"><button className="almanac-today-button" onClick={resetToday} disabled={isToday}>今天</button><span className="secure-pill"><span />离线可用</span></div></header>

    <div className="almanac-toolbar"><button className="almanac-date-nav" onClick={() => moveDate(-1)} disabled={turning} aria-label="前一天"><ChevronLeft size={17} /></button><label className="almanac-date-input"><CalendarDays size={15} /><input type="date" value={selectedDate} onChange={(event) => changeDate(event.target.value)} aria-label="选择日期" /></label><button className="almanac-date-nav" onClick={() => moveDate(1)} disabled={turning} aria-label="后一天"><ChevronRight size={17} /></button></div>

    <div className="calendar-book-layout"><main className="calendar-book-stage"><div className="calendar-binding" aria-hidden="true"><span /><span /><span /></div><div className="calendar-book-shadow" aria-hidden="true" /><div className="calendar-paper-stack"><div className="calendar-sheet calendar-sheet-under" aria-hidden="true" />{pending && pendingProfile && <CalendarSheet date={pending} profile={pendingProfile} className="calendar-sheet-next" /> }<CalendarSheet date={date} profile={profile} isToday={isToday} onPageClick={() => moveDate(1)} className={turning ? 'calendar-sheet-current is-tearing' : 'calendar-sheet-current'} /></div><p className="calendar-book-caption"><Sparkles size={14} />点击日历页或选择日期，撕下这一页查看新的宜忌</p></main><aside className="calendar-notes"><div className="calendar-notes-heading"><div><p className="eyebrow">PAPER CALENDAR</p><h2>今日一页</h2></div><CalendarDays size={18} /></div><p>像翻开桌上的老黄历一样，每一次日期切换都会留下轻轻撕页的动作。</p><div className="calendar-note-line"><Compass size={15} /><span>今日方向<strong>{profile.direction}</strong></span></div><div className="calendar-note-line"><Info size={15} /><span>宜忌为传统历法参考</span></div></aside></div>
  </section>
}

export const AlmanacPlugin: Plugin = {
  id: 'calendar.almanac',
  name: '万年历 · 老黄历',
  description: '查看每日公历、农历、节气与宜忌参考。',
  icon: '历',
  version: '1.0.0',
  apiVersion: '1',
  entryPoint: 'src/plugins/almanac/AlmanacPlugin.tsx',
  capabilities: ['公历农历换算', '节气参考', '宜忌建议'],
  accent: 'amber',
  component: AlmanacView,
}
