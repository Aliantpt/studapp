// тап по уведомлению открывает приложение
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const open = clients.find((c) => 'focus' in c)
      return open ? open.focus() : self.clients.openWindow(self.registration.scope)
    }),
  )
})
