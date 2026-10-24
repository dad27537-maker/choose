import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.dicejian.app',
  appName: '骰间',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
