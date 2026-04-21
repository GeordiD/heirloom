/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, NetworkFirst, Serwist } from 'serwist';

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // SSR pages: always fetch fresh from server, fall back to cache when offline
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkFirst({
        cacheName: 'pages',
      }),
    },
    // API routes: network first, cache as fallback
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/'),
      handler: new NetworkFirst({
        cacheName: 'api',
        networkTimeoutSeconds: 5,
      }),
    },
    // Versioned build assets (hashed filenames) — safe to cache indefinitely
    {
      matcher: ({ url }) => url.pathname.startsWith('/_build/'),
      handler: new CacheFirst({
        cacheName: 'build-assets',
      }),
    },
    // Images and other static files
    {
      matcher: ({ request }) => request.destination === 'image',
      handler: new CacheFirst({
        cacheName: 'images',
      }),
    },
  ],
});

serwist.addEventListeners();
