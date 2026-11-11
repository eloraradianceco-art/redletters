// Daily reminders. This worker only shows notifications; it never caches the app.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch (e) { data = { body: event.data && event.data.text() } }
  event.waitUntil(self.registration.showNotification(data.title || "The Red Letters", {
    body: data.body || "Spend a few minutes with the words of Jesus today.",
    icon: data.icon || '/icon.png',
    badge: data.icon || '/icon.png',
    tag: data.tag || 'daily-reminder',
    data: { url: data.url || '/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    for (const w of windows) { if ('focus' in w) return w.focus() }
    return self.clients.openWindow(url)
  }))
})
