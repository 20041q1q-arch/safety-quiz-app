const CACHE_NAME = 'quiz-app-v1'
const STATIC_ASSETS = [
  '/',
  '/quiz',
  '/exam',
  '/speed',
  '/wrong-notes',
  '/stats',
  '/data/questions.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API 요청은 네트워크 우선
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
      }))
    )
    return
  }

  // 정적 자산은 캐시 우선
  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request))
  )
})
