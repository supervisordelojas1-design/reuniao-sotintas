/* Tema do Só Tintas Apps dentro do Mentor (v62).
   Ordem: ?tema=light|dark → localStorage 'st_tema' → claro.
   O app avisa a troca por postMessage({st_tema}). Roda no <head>, antes de pintar. */
(function () {
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function norm(t) { t = String(t || '').toLowerCase(); return (t === 'dark' || t === 'escuro') ? 'dark' : (t === 'light' || t === 'claro') ? 'light' : ''; }
  var q = ''; try { q = norm(new URLSearchParams(location.search).get('tema')); } catch (e) {}
  function aplicar(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { document.documentElement.style.colorScheme = t; } catch (e) {}
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#0f1522' : '#f5f6f8');
  }
  aplicar(q || norm(ls('st_tema')) || 'light');
  window.addEventListener('message', function (ev) { var d = ev && ev.data; if (d && (d.st_tema === 'light' || d.st_tema === 'dark')) aplicar(d.st_tema); });
  window.addEventListener('storage', function (ev) { if (ev.key === 'st_tema') { var t = norm(ev.newValue); if (t) aplicar(t); } });
})();
