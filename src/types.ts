import type { ComponentType, LazyExoticComponent } from 'react'

export type PluginComponentProps = {
  onNavigate?: (pluginId: string) => void
  onActivity?: () => void
  newSessionToken?: number
}

export type PluginManifest = {
  id: string
  name: string
  description: string
  icon: string
  version: string
  apiVersion: string
  entryPoint: string
  capabilities: string[]
}

export type Plugin = PluginManifest & {
  component: ComponentType<PluginComponentProps> | LazyExoticComponent<ComponentType<PluginComponentProps>>
  accent: 'violet' | 'blue' | 'amber' | 'green'
}
