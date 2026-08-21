/* Assistente ST — service worker
 *
 * Guarda a casca do app no aparelho. Depósito Alto, estrada de Macaé: sem
 * isto, abrir o app sem sinal dá tela branca. Com isto, ele abre, você lança
 * a despesa com a foto, e o lançamento fica na fila até a rede voltar.
 *
 * Troque o número da versão sempre que subir um index.html novo — é o que
 * faz o aparelho baixar a versão nova em vez de servir a antiga.
 */
var VERSAO = 'ast-v42';
var CASCA  = ['./', './index.html', './agenda.html', './manifest.json'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSAO).then(function (c) {
    return c.addAll(CASCA).catch(function () { /* offline na instalação: segue */ });
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) { return k === VERSAO ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                       // POST nunca é cacheado
  var url = new URL(req.url);
  if (url.hostname.indexOf('script.google.com') >= 0) return;  // dados sempre da rede

  /* Rede primeiro, cache como rede de segurança: assim uma versão nova do
     app chega no primeiro acesso com sinal, e o app abre mesmo sem sinal. */
  e.respondWith(
    fetch(req).then(function (resp) {
      if (resp && resp.status === 200 && resp.type === 'basic') {
        var copia = resp.clone();
        caches.open(VERSAO).then(function (c) { c.put(req, copia); });
      }
      return resp;
    }).catch(function () {
      return caches.match(req).then(function (r) {
        if (r) return r;
        /* offline numa navegação: devolve a casca certa. Sem isto, abrir o
           link de agendamento sem sinal servia o app inteiro no lugar dele. */
        var ehAgenda = url.pathname.indexOf('agenda') >= 0;
        return caches.match(ehAgenda ? './agenda.html' : './index.html');
      });
    })
  );
});
