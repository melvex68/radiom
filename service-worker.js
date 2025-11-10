// Nombre de la caché
const CACHE_NAME = 'radio-app-cache-v1';

// Archivos esenciales que queremos cachear
const urlsToCache = [
    'radio_app.html',
    'manifest.json',
    // Las URLs de iconos se omiten en la caché si no existen, pero el navegador 
    // debe ver las referencias en el manifest.
];

// Evento de instalación: Abre una caché y añade los archivos estáticos.
self.addEventListener('install', event => {
    // Forzar al Service Worker a activarse inmediatamente
    self.skipWaiting();
    console.log('Service Worker: Instalando y abriendo caché...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Cacheando archivos de la shell de la aplicación.');
                // Capturar el error para que la instalación no falle si faltan iconos
                return cache.addAll(urlsToCache).catch(err => {
                    console.warn('Algunos archivos no se pudieron cachear. Esto es normal si faltan iconos de placeholder.', err);
                });
            })
    );
});

// Evento de activación: Elimina cachés antiguas.
self.addEventListener('activate', event => {
    console.log('Service Worker: Activando y limpiando cachés antiguas...');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // Eliminar cachés que no están en la lista blanca
                        console.log('Service Worker: Eliminando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Evento de fetch: Sirve los archivos desde la caché o la red.
self.addEventListener('fetch', event => {
    // Evitamos intentar cachear el stream de radio en vivo
    if (event.request.url.includes('.mp3') || event.request.url.includes('.m3u8') || event.request.url.includes('.aac')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si encontramos una respuesta en la caché, la devolvemos
                if (response) {
                    return response;
                }
                
                // Si no está en caché, buscamos en la red
                return fetch(event.request);
            })
    );
});