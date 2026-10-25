import { mount } from 'svelte';
import App from './App.svelte';

const app = mount(App, { target: document.getElementById('app')! });

// PWA: installable app shell with offline start. The service worker never
// caches API traffic (see public/sw.js), so sessions stay live.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline start is a bonus; a failed registration must not break the app.
    });
  });
}

export default app;

