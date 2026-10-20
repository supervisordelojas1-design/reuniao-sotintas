/* MENTOR ST PRO — service worker: deixa o app abrir rápido e funcionar
   sem internet para o que já foi visitado (conteúdo, páginas dos guias). */
const CACHE = 'mentor-st-pro-v10-st5';
const BASE = ['./', './index.html', './config.js', './ponte.js', './sync.js', '../st-dados.js?v=84', './ponte-fim.js', './assets/style.css', './assets/tema-st.css', './tema-st.js',
  './assets/conteudo-base.js', './assets/conteudo-aulas.js', './assets/conteudo-questoes.js', './assets/conteudo-tecnico.js', './assets/conteudo-produtos.js', './assets/conteudo-checklists.js',
  './assets/disc-data.js', './assets/gamificacao.js', './assets/assessor.js', './assets/db.js', './assets/app.js', './assets/app-assessor.js', './assets/app-checklists.js', './assets/app-disc.js', './assets/app-equipe.js', './assets/app-evolucao.js', './assets/niveis.js', './assets/conteudo-niveis.js',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => null)); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Chamadas ao Supabase/IA: sempre rede
  if (/supabase\.co|supabase\.in|anthropic|youtube|googleapis|gstatic|google\.com/.test(url.host) && !/fonts\./.test(url.host)) return;
  // Imagens dos guias, fotos e embalagens: cache first (são pesadas e quase não mudam)
  if (/\/assets\/(material|fotos|ambientes|produtos|pdf|historia)\//.test(url.pathname)) {
    e.respondWith(caches.open(CACHE).then(async c => { const hit = await c.match(e.request); if (hit) return hit; const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; }));
    return;
  }
  // Demais arquivos: rede primeiro, cache como reserva
  e.respondWith(fetch(e.request).then(r => { if (r.ok && url.origin === location.origin) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; }).catch(() => caches.match(e.request)));
});
