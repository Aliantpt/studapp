import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/unbounded'
import '@fontsource-variable/onest'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { isNative } from './native/platform'

// новая версия сайта подхватывается сразу, а не со второго открытия.
// в приложении файлы и так лежат внутри, service worker там не нужен
if (!isNative) {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, reg) {
      if (!reg) return
      // приложение на телефоне может висеть в фоне днями — проверяем обнову, когда его снова открыли
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void reg.update()
      })
      setInterval(() => void reg.update(), 60 * 60_000)
    },
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
