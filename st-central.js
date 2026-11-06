/* Central de Atualização (nov/2026)
   Quando uma tela de upload é aberta pela Central (?central=1&upd=1):
   - abre sozinha a área de atualizar (só aparece para quem pode publicar);
   - mostra um botão para voltar à Central. */
(function () {
  var q;
  try { q = new URLSearchParams(location.search); } catch (e) { return; }
  if (q.get('central') !== '1') return;
  var tema = q.get('tema') || '';

  /* tenta até o botão aparecer (ele só aparece depois que o crachá confirma o perfil) e clica uma vez */
  var tentativas = 0;
  function abrir() {
    if (q.get('upd') !== '1') return;
    try {
      if (typeof window.abrirUpload === 'function') { window.abrirUpload(); return; }
      var b = document.getElementById('btnUpdToggle') || document.getElementById('btnBase');
      if (b && !b.hidden && b.offsetParent !== null) { b.click(); return; }
    } catch (e) {}
    if (++tentativas < 8) setTimeout(abrir, 1000);
  }

  function voltar() {
    var a = document.createElement('a');
    a.href = 'atualizar.html?tema=' + encodeURIComponent(tema) + '&v=' + Date.now();
    a.textContent = '← Central de Atualização';
    a.setAttribute('style', 'position:fixed;left:12px;bottom:12px;z-index:9999;background:#1C3F8F;color:#fff;' +
      'font:700 13px/1 system-ui,sans-serif;padding:10px 14px;border-radius:999px;text-decoration:none;' +
      'box-shadow:0 4px 14px rgba(0,0,0,.25)');
    document.body.appendChild(a);
  }

  function pronto() { voltar(); setTimeout(abrir, 1200); }
  if (document.readyState === 'complete') pronto(); else window.addEventListener('load', pronto);
})();
