import type { ReactNode } from 'react'

export type D20SkinId = 'midnight' | 'nebula'

export type D20Skin = {
  id: D20SkinId
  label: string
  description: string
  swatch: string
  body: number
  edge: number
  edgeOpacity: number
  labelFill: string
  labelStroke: string
  labelShadow: string
  ambient: number
  keyLight: number
  rimLight: number
  emissive: number
  emissiveIntensity: number
  shadow: number
  spark: number
  star: number
  starOpacity: number
}

export const D20_SKIN_KEY = 'plugin-deck:d20-skin'

export const D20_SKINS: Record<D20SkinId, D20Skin> = {
  midnight: {
    id: 'midnight',
    label: '深夜金属',
    description: '深灰紫金属边框',
    swatch: 'linear-gradient(135deg,#424965,#111523)',
    body: 0x25283b,
    edge: 0xc8d0df,
    edgeOpacity: 0.78,
    labelFill: '#edf2fb',
    labelStroke: '#070912',
    labelShadow: 'rgba(0, 0, 0, .95)',
    ambient: 1.8,
    keyLight: 4.2,
    rimLight: 2.6,
    emissive: 0x050611,
    emissiveIntensity: 0.08,
    shadow: 0x3b1d2b,
    spark: 0xc4a566,
    star: 0xffffff,
    starOpacity: 0,
  },
  nebula: {
    id: 'nebula',
    label: '星云霓虹',
    description: '紫蓝渐变与彩色高光',
    swatch: 'linear-gradient(135deg,#55e4f2 0%,#7560ec 45%,#ed6db8 100%)',
    body: 0x7187da,
    edge: 0xbbefff,
    edgeOpacity: 0.9,
    labelFill: '#fff3da',
    labelStroke: '#35145e',
    labelShadow: 'rgba(33, 12, 68, .95)',
    ambient: 2.2,
    keyLight: 4.8,
    rimLight: 3.8,
    emissive: 0x38206f,
    emissiveIntensity: 0.32,
    shadow: 0x38215d,
    spark: 0xf0b9ed,
    star: 0xf7fbff,
    starOpacity: 0.76,
  },
}

export function getD20Skin(id?: string): D20Skin {
  return D20_SKINS[(id as D20SkinId) in D20_SKINS ? id as D20SkinId : 'midnight']
}

export function isD20SkinId(value: string): value is D20SkinId {
  return value in D20_SKINS
}

export function D20SkinPicker({ value, onChange }: { value: D20SkinId; onChange: (value: D20SkinId) => void }): ReactNode {
  return <div className="d20-skin-picker" role="group" aria-label="骰子皮肤">
    {Object.values(D20_SKINS).map((skin) => <button className={`d20-skin-option ${value === skin.id ? 'selected' : ''}`} key={skin.id} onClick={() => onChange(skin.id)} title={skin.description} aria-label={`使用${skin.label}皮肤`} aria-pressed={value === skin.id}>
      <span className={`d20-skin-swatch skin-${skin.id}`} style={{ background: skin.swatch }} />
      <span>{skin.label}</span>
    </button>)}
  </div>
}
