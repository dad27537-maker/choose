import { useMemo, useState, type ReactNode } from 'react'
import { Blocks, ChevronRight, Command, Home, Menu, Moon, Plus, Search, Settings, ShieldCheck, SlidersHorizontal, Sparkles, Sun, Trash2, X } from 'lucide-react'
import { pluginRegistry } from './registry'
import { readStorage, writeStorage } from './storage'
import { LINGQIAN_HISTORY_KEY, type LingqianHistoryItem } from './plugins/lingqian/LingqianPlugin'
import './styles.css'

type View = 'chat' | 'plugins' | 'settings'
type Theme = 'system' | 'light' | 'dark'
type SavedRoll = { id: string; subject: string; value: number; at: string; verdict?: { label: string } }
type RecentItem = { id: string; subject: string; meta: string; at: string; pluginId: string; source: 'd20' | 'lingqian' }

const ENABLED_KEY = 'plugin-deck:enabled'
const THEME_KEY = 'plugin-deck:theme'
const HISTORY_KEY = 'plugin-deck:d20-history'
const HISTORY_CHANGE_EVENT = 'plugin-deck:history-change'

type HistoryChange = { type: 'delete'; id: string } | { type: 'clear' }

function initialPluginId() {
  const requested = new URLSearchParams(window.location.search).get('plugin')
  return pluginRegistry.some((plugin) => plugin.id === requested) ? requested! : pluginRegistry[0]?.id ?? ''
}

export default function App() {
  const [view, setView] = useState<View>('chat')
  const [activePluginId, setActivePluginId] = useState(initialPluginId)
  const [enabled, setEnabled] = useState<string[]>(() => readStorage(ENABLED_KEY, pluginRegistry.map((plugin) => plugin.id)))
  const [theme, setTheme] = useState<Theme>(() => readStorage(THEME_KEY, 'system' as Theme))
  const [mobileMenu, setMobileMenu] = useState(false)
  const [newSessionToken, setNewSessionToken] = useState(0)
  const [activityTick, setActivityTick] = useState(0)

  const activePlugins = useMemo(() => pluginRegistry.filter((plugin) => enabled.includes(plugin.id)), [enabled])
  const current = activePlugins.find((plugin) => plugin.id === activePluginId) ?? activePlugins[0]
  const recent = useMemo<RecentItem[]>(() => {
    const dice = readStorage<SavedRoll[]>(HISTORY_KEY, []).map((roll) => ({ id: roll.id, subject: roll.subject, meta: `D20 · ${roll.value}`, at: roll.at, pluginId: 'dice.d20', source: 'd20' as const }))
    const lingqian = readStorage<LingqianHistoryItem[]>(LINGQIAN_HISTORY_KEY, []).map((item) => ({ id: item.id, subject: item.question, meta: `第${item.number}签 · ${String.fromCodePoint(0x4dc0 + item.number - 1)}`, at: item.at, pluginId: 'divination.lingqian', source: 'lingqian' as const }))
    return [...dice, ...lingqian].sort((left, right) => Date.parse(right.at) - Date.parse(left.at))
  }, [activityTick])

  const openPlugin = (id: string) => { setActivePluginId(id); setView('chat'); setMobileMenu(false) }
  const togglePlugin = (id: string) => {
    setEnabled((items) => {
      const next = items.includes(id) ? items.filter((item) => item !== id) : [...items, id]
      writeStorage(ENABLED_KEY, next)
      if (!next.includes(activePluginId)) setView('plugins')
      return next
    })
  }
  const newChat = () => { setView('chat'); setNewSessionToken((token) => token + 1); setMobileMenu(false) }
  const setAppTheme = (next: Theme) => { setTheme(next); writeStorage(THEME_KEY, next) }
  const notifyHistoryChange = (detail: HistoryChange) => window.dispatchEvent(new CustomEvent<HistoryChange>(HISTORY_CHANGE_EVENT, { detail }))
  const deleteRecent = (rollId: string) => {
    if (!window.confirm('确定删除这条会话吗？')) return
    const target = recent.find((item) => item.id === rollId)
    if (target?.source === 'lingqian') {
      writeStorage(LINGQIAN_HISTORY_KEY, readStorage<LingqianHistoryItem[]>(LINGQIAN_HISTORY_KEY, []).filter((item) => item.id !== rollId))
    } else {
      writeStorage(HISTORY_KEY, readStorage<SavedRoll[]>(HISTORY_KEY, []).filter((item) => item.id !== rollId))
    }
    setActivityTick((tick) => tick + 1)
    notifyHistoryChange({ type: 'delete', id: rollId })
  }
  const clearRecent = () => {
    if (!window.confirm('确定清空最近会话吗？')) return
    writeStorage(HISTORY_KEY, [])
    writeStorage(LINGQIAN_HISTORY_KEY, [])
    setActivityTick((tick) => tick + 1)
    notifyHistoryChange({ type: 'clear' })
  }

  return <div className={`app theme-${theme}`}>
    <aside className={`sidebar ${mobileMenu ? 'is-open' : ''}`}>
      <div className="sidebar-top">
        <div className="brand"><span className="brand-icon">✦</span><div><strong>骰间</strong><small>PLUGIN DECK</small></div><button className="mobile-close" onClick={() => setMobileMenu(false)} aria-label="关闭导航"><X size={17} /></button></div>
        <button className="new-chat-button" onClick={newChat}><Plus size={17} /><span>新会话</span><kbd>⌘ K</kbd></button>
        <label className="search-box"><Search size={15} /><input placeholder="搜索会话" aria-label="搜索会话" /><kbd>⌘ F</kbd></label>
      </div>
      <nav className="primary-nav"><NavItem icon={<Home />} label="会话" active={view === 'chat'} onClick={() => { setView('chat'); setMobileMenu(false) }} /><NavItem icon={<Blocks />} label="插件中心" active={view === 'plugins'} onClick={() => { setView('plugins'); setMobileMenu(false) }} /></nav>
      <div className="sidebar-section"><div className="sidebar-label"><span>已启用插件</span><span>{activePlugins.length}</span></div>{activePlugins.map((plugin) => <button className={`plugin-nav ${view === 'chat' && plugin.id === activePluginId ? 'active' : ''}`} key={plugin.id} onClick={() => openPlugin(plugin.id)}><span className={`plugin-nav-icon accent-${plugin.accent}`}>{plugin.icon}</span><span>{plugin.name}</span><span className="status-dot" /></button>)}{activePlugins.length === 0 && <p className="sidebar-empty">在插件中心启用一个工具</p>}</div>
      <div className="sidebar-section recent-section"><div className="sidebar-label"><span>最近会话</span>{recent.length > 0 && <button className="sidebar-clear-button" onClick={clearRecent} aria-label="清空最近会话" title="清空最近会话"><Trash2 size={13} /></button>}</div>{recent.slice(0, 4).map((item) => <div className="recent-item" key={item.id}><button className="recent-open" onClick={() => openPlugin(item.pluginId)}><span>{item.subject}</span><small>{item.meta}</small></button><button className="recent-delete" onClick={() => deleteRecent(item.id)} aria-label={`删除会话：${item.subject}`} title="删除会话"><Trash2 size={13} /></button></div>)}{recent.length === 0 && <p className="sidebar-empty">你的决定轨迹会出现在这里</p>}</div>
      <div className="sidebar-footer"><button className="user-card"><span className="user-avatar">你</span><span><strong>本地工作区</strong><small>离线 · 数据在本机</small></span><ChevronRight size={15} /></button><NavItem icon={<Settings />} label="设置" active={view === 'settings'} onClick={() => { setView('settings'); setMobileMenu(false) }} /></div>
    </aside>

    <main className="app-main">
      <header className="topbar"><button className="mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="打开导航"><Menu size={19} /></button><div className="topbar-title"><span className="topbar-kicker">{view === 'chat' ? '正在使用' : view === 'plugins' ? '工作区' : '偏好设置'}</span><strong>{view === 'chat' ? current?.name ?? '选择一个插件' : view === 'plugins' ? '插件中心' : '设置'}</strong></div><div className="topbar-actions"><button className="topbar-icon" aria-label="命令菜单"><Command size={17} /></button><span className="online-indicator"><span />本地运行</span></div></header>
      <div className="page-content">{view === 'chat' && current ? <current.component key={current.id} onActivity={() => setActivityTick((tick) => tick + 1)} newSessionToken={newSessionToken} /> : view === 'plugins' ? <PluginCenter enabled={enabled} onToggle={togglePlugin} onOpen={openPlugin} /> : <SettingsPage theme={theme} setTheme={setAppTheme} enabled={enabled} onToggle={togglePlugin} />}</div>
    </main>
  </div>
}

function NavItem({ icon, label, active, onClick }: { icon: ReactNode; label: string; active: boolean; onClick: () => void }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span></button>
}

function PluginCenter({ enabled, onToggle, onOpen }: { enabled: string[]; onToggle: (id: string) => void; onOpen: (id: string) => void }) {
  return <section className="manager-page"><div className="manager-heading"><div><p className="eyebrow">PLUGIN LIBRARY</p><h1>让工具，<em>各就各位。</em></h1><p>每个插件都只做一件事，并且做好它。以后，你可以从这里组合出自己的工作区。</p></div><div className="manager-spark"><Sparkles size={20} /></div></div><div className="manager-toolbar"><div><strong>{pluginRegistry.length} 个已安装插件</strong><span> · {enabled.length} 个正在运行</span></div><button className="quiet-button"><SlidersHorizontal size={15} />筛选</button></div><div className="library-grid">{pluginRegistry.map((plugin) => { const isEnabled = enabled.includes(plugin.id); return <article className={`library-card ${isEnabled ? 'is-enabled' : ''}`} key={plugin.id}><div className="library-card-top"><span className={`library-icon accent-${plugin.accent}`}>{plugin.icon}</span><span className={`install-state ${isEnabled ? '' : 'off'}`}><span />{isEnabled ? '运行中' : '已停用'}</span></div><h2>{plugin.name}</h2><p>{plugin.description}</p><div className="capability-list">{plugin.capabilities.map((capability) => <span key={capability}>{capability}</span>)}</div><div className="library-card-footer"><span>v{plugin.version} · API {plugin.apiVersion}</span><div><button className="text-button" onClick={() => onToggle(plugin.id)}>{isEnabled ? '停用' : '启用'}</button>{isEnabled && <button className="open-plugin-button" onClick={() => onOpen(plugin.id)}>打开 <ChevronRight size={14} /></button>}</div></div></article>})}<article className="library-card coming-soon"><div className="library-card-top"><span className="library-icon muted-icon">＋</span><span className="install-state off">即将推出</span></div><h2>更多可能</h2><p>日历、灵感、清单和更多轻量工具，正在被做成插件。</p><span className="coming-label">COMMUNITY PLUGINS</span></article></div></section>
}

function SettingsPage({ theme, setTheme, enabled, onToggle }: { theme: Theme; setTheme: (theme: Theme) => void; enabled: string[]; onToggle: (id: string) => void }) {
  return <section className="settings-page"><div className="settings-heading"><p className="eyebrow">PREFERENCES</p><h1>让骰间更像你的。</h1><p>所有配置默认只保存在当前设备，不需要登录。</p></div><div className="settings-grid"><div className="settings-main"><div className="settings-card"><div className="settings-card-heading"><div><p className="eyebrow">外观</p><h2>主题模式</h2><p>选择适合你当下状态的明暗模式。</p></div><span className="settings-symbol"><Sun size={17} /></span></div><div className="theme-options">{[['system', '跟随系统', <Settings size={16} />], ['light', '浅色模式', <Sun size={16} />], ['dark', '深色模式', <Moon size={16} />]].map(([value, label, icon]) => <button key={String(value)} className={theme === value ? 'selected' : ''} onClick={() => setTheme(value as Theme)}>{icon}<span>{label}</span>{theme === value && <span className="selected-check">✓</span>}</button>)}</div></div><div className="settings-card"><div className="settings-card-heading"><div><p className="eyebrow">插件</p><h2>已安装工具</h2><p>停用插件不会删除它的历史数据。</p></div><Blocks size={19} /></div>{pluginRegistry.map((plugin) => <div className="settings-plugin" key={plugin.id}><span className={`plugin-nav-icon accent-${plugin.accent}`}>{plugin.icon}</span><div><strong>{plugin.name}</strong><span>{plugin.description}</span></div><button className={`switch ${enabled.includes(plugin.id) ? 'on' : ''}`} onClick={() => onToggle(plugin.id)} aria-label={`${plugin.name}${enabled.includes(plugin.id) ? '，停用' : '，启用'}`}><span /></button></div>)}</div></div><aside className="settings-aside"><div className="privacy-card"><ShieldCheck size={18} /><strong>本地优先</strong><p>投掷记录和会话内容保存在本机浏览器存储中，不会自动上传。</p></div><div className="about-card"><span className="brand-icon">✦</span><strong>骰间</strong><span>Plugin Deck · v0.1</span><small>用一点点随机，帮你开始。</small></div></aside></div></section>
}
