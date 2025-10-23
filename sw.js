const CACHE_NAME = 'expense-pwa-v1';
const urlsToCache = [
'/',
'/index.html',
'/style.css',
'/script.js',
'/manifest.json',
'/icons/icon-192.png',
'/icons/icon-512.png',
'https://cdn.jsdelivr.net/npm/chart.js'
];


self.addEventListener('install', event => {
self.skipWaiting();
event.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
);
});


self.addEventListener('activate', event => {
event.waitUntil(clients.claim());
});


self.addEventListener('fetch', event => {
event.respondWith(
caches.match(event.request).then(resp => resp || fetch(event.request).then(r => {
// cache fetched responses for offline
return caches.open(CACHE_NAME).then(cache=>{
try{ cache.put(event.request, r.clone()); }catch(e){}
return r;
})
}).catch(()=>{
// fallback: for navigation requests, serve index.html
if (event.request.mode === 'navigate') return caches.match('/index.html');
}))
);
});