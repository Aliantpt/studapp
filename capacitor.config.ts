import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.github.aliantpt.studapp',
  appName: 'StudApp',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      iconColor: '#17855a',
    },
  },
}

export default config
