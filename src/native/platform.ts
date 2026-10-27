import { Capacitor } from '@capacitor/core'

/** true, когда крутимся внутри приложения из App Store / Xcode, а не в браузере */
export const isNative = Capacitor.isNativePlatform()
