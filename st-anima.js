/* ═══════════════════════════════════════════════════════════════
   Só Tintas App — ANIMAÇÕES COMPARTILHADAS (etapa 2 do visual moderno)
   Animação que comunica: dados que contam a história, atenção no que
   precisa de ação, retorno de ação, comemoração e navegação.
   • Só transform/opacity/width (leve no celular).
   • Quem ativou "reduzir movimento" no aparelho vê tudo parado.
   Uso: STAnima.observar(raiz, { numeros:'sel', barras:'sel', pulso:'sel', sanfona:'sel', abas:'sel' })
        STAnima.confete(), STAnima.check(el), STAnima.flip(...), STAnima.puxar(...)
   ═══════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  if (g.STAnima) return;
  var reduz = false; try { reduz = g.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var EASE = 'cubic-bezier(.2,.8,.2,1)';

  /* ───────── estilos ───────── */
  var css = [
    '@keyframes stPulso{0%,100%{box-shadow:0 0 0 0 rgba(211,32,39,0)}50%{box-shadow:0 0 0 6px rgba(211,32,39,.18)}}',
    '.st-pulso{animation:stPulso 2.2s ease-in-out infinite;border-radius:6px}',
    '@keyframes stPulsoTxt{0%,100%{opacity:1}50%{opacity:.55}}',
    '.st-pulso-txt{animation:stPulsoTxt 2s ease-in-out infinite}',
    '@keyframes stPop{0%{transform:scale(.4);opacity:0}55%{transform:scale(1.25);opacity:1}75%{transform:scale(.92)}100%{transform:scale(1)}}',
    '.st-pop{display:inline-block;animation:stPop .7s ' + EASE + ' both}',
    '@keyframes stBrilho{0%,100%{box-shadow:0 0 0 0 rgba(255,209,0,0)}50%{box-shadow:0 0 0 8px rgba(255,209,0,.35),0 0 24px rgba(255,209,0,.55)}}',
    '.st-brilho{animation:stBrilho 1.6s ease-in-out 3}',
    '@keyframes stDesliza{from{translate:0 14px;opacity:0}to{translate:0 0;opacity:1}}',   /* translate não briga com o transform de centralizar o aviso */
    '.st-check{display:inline-block;width:1.05em;height:1.05em;vertical-align:-.16em;margin-right:6px}',
    '.st-check circle{stroke:currentColor;stroke-width:2.2;fill:none;stroke-dasharray:66;stroke-dashoffset:66;animation:stTraco .45s ' + EASE + ' forwards}',
    '.st-check path{stroke:currentColor;stroke-width:2.6;fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:22;stroke-dashoffset:22;animation:stTraco .35s ' + EASE + ' .3s forwards}',
    '@keyframes stTraco{to{stroke-dashoffset:0}}',
    '.st-aba-ind{position:absolute;bottom:2px;height:3px;border-radius:3px;background:#FFD100;transition:left .3s ' + EASE + ',width .3s ' + EASE + ';pointer-events:none;z-index:2}',
    '.st-seta{display:inline-block;font-size:10.5px;font-weight:800;margin-left:6px;padding:1px 5px;border-radius:6px;animation:stPop .6s ' + EASE + ' both}',
    '.st-seta.sobe{color:#128a52;background:rgba(18,138,82,.12)}.st-seta.desce{color:#c42a22;background:rgba(196,42,34,.10)}',
    '.st-puxa{position:fixed;left:50%;top:0;z-index:2147482990;width:46px;height:46px;margin-left:-23px;border-radius:50%;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.25);display:grid;place-items:center;transform:translateY(-60px);opacity:0;pointer-events:none}',
    '.st-puxa svg{width:28px;height:28px}',
    '.st-puxa.gira svg{animation:stGira .8s linear infinite}',
    '@keyframes stGira{to{transform:rotate(360deg)}}',
    '.st-badge{display:inline-flex;align-items:center;gap:6px;margin-top:6px;padding:3px 9px 3px 7px;border-radius:999px;background:rgba(255,255,255,.16);color:#fff;font-size:11.5px;font-weight:800;width:max-content;max-width:100%}',
    '.st-badge i{width:8px;height:8px;border-radius:50%;background:#ff5a5f;box-shadow:0 0 0 0 rgba(255,90,95,.7);animation:stPonto 1.6s ease-out infinite}',
    '@keyframes stPonto{0%{box-shadow:0 0 0 0 rgba(255,90,95,.7)}80%,100%{box-shadow:0 0 0 9px rgba(255,90,95,0)}}',
    '@media (prefers-reduced-motion: reduce){.st-pulso,.st-pulso-txt,.st-pop,.st-brilho,.st-seta,.st-badge i,.st-puxa.gira svg{animation:none!important}.st-check circle,.st-check path{animation:none!important;stroke-dashoffset:0!important}.st-aba-ind{transition:none!important}}',
    /* etapa 3 · telas vazias com a latinha, blocos de carregamento, abertura do app */
    '.empty::before,.st-vazio::before{content:"";display:block;width:58px;height:58px;margin:0 auto 10px;background:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Cellipse cx=%2732%27 cy=%2758%27 rx=%2718%27 ry=%273%27 fill=%27%2316233d%27 opacity=%27.12%27/%3E%3Cpath d=%27M14 18h36l-3 34a4 4 0 0 1-4 3.6H21a4 4 0 0 1-4-3.6z%27 fill=%27%231C3F8F%27/%3E%3Crect x=%2712%27 y=%2712%27 width=%2740%27 height=%278%27 rx=%273%27 fill=%27%23E30613%27/%3E%3Cpath d=%27M18 30h28%27 stroke=%27%23FFD200%27 stroke-width=%276%27/%3E%3Cpath d=%27M24 12c0-4 3.6-6.4 8-6.4S40 8 40 12%27 stroke=%27%235a677f%27 stroke-width=%273%27 fill=%27none%27/%3E%3Cpath d=%27M44 20c3 0 4 3 4 6s-2 5-2 8%27 stroke=%27%23FFD200%27 stroke-width=%273%27 fill=%27none%27 stroke-linecap=%27round%27/%3E%3C/svg%3E") center/contain no-repeat;opacity:.9}',
    '@media (prefers-reduced-motion: no-preference){.empty::before,.st-vazio::before{animation:stBalanca 2.6s ease-in-out infinite;transform-origin:50% 90%}}',
    '@keyframes stBalanca{0%,100%{transform:rotate(0)}25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}',
    '.st-carregando{color:transparent!important;position:relative;min-height:74px;display:block}',
    '.st-carregando *{visibility:hidden}',
    '.st-carregando::before,.st-carregando::after{content:"";position:absolute;left:12px;right:12px;height:14px;border-radius:8px;background:linear-gradient(90deg,rgba(120,135,165,.14) 25%,rgba(120,135,165,.30) 50%,rgba(120,135,165,.14) 75%);background-size:300% 100%;animation:stBrilhoEsq 1.3s linear infinite}',
    '.st-carregando::before{top:16px;right:30%}.st-carregando::after{top:42px}',
    '@keyframes stBrilhoEsq{from{background-position:100% 0}to{background-position:0 0}}',
    '@media (prefers-reduced-motion: reduce){.empty::before,.st-vazio::before,.st-carregando::before,.st-carregando::after{animation:none!important}}',
  ].join('\n');
  function estilos() { if (document.getElementById('st-anima-css')) return; var s = document.createElement('style'); s.id = 'st-anima-css'; s.textContent = css; (document.head || document.documentElement).appendChild(s); }
  estilos();

  /* ───────── 1. números que contam até o valor ───────── */
  var JA = {};   /* valores já animados nesta página: trocar de aba não reconta */
  var RE_NUM = /^(\D*?)(-?\d{1,3}(?:\.\d{3})+(?:,\d+)?|-?\d+(?:,\d+)?)(\D*)$/;
  function ler(txt) {
    var m = RE_NUM.exec(String(txt).trim()); if (!m) return null;
    var raw = m[2], dec = (raw.split(',')[1] || '').length, val = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
    if (!isFinite(val) || val === 0) return null;
    return { pre: m[1], suf: m[3], val: val, dec: dec, mil: /\./.test(raw) };
  }
  function escrever(p, v) { return p.pre + v.toLocaleString('pt-BR', { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec, useGrouping: p.mil }) + p.suf; }
  function contar(el, dur) {
    if (el.__stConta) return; el.__stConta = 1;
    var no = null; for (var i = 0; i < el.childNodes.length; i++) { var c = el.childNodes[i]; if (c.nodeType === 3 && c.nodeValue.trim()) { no = c; break; } }
    if (!no) return;
    var orig = no.nodeValue, p = ler(orig); if (!p || reduz) return;
    var chave = (el.className || el.tagName) + '|' + orig.trim(); if (JA[chave]) return; JA[chave] = 1;
    var lead = orig.match(/^\s*/)[0], trail = orig.match(/\s*$/)[0], t0 = 0; dur = dur || 900;
    no.nodeValue = lead + escrever(p, 0) + trail;
    function passo(t) {
      if (!t0) t0 = t; var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      if (k >= 1) { no.nodeValue = orig; return; }
      var v = p.val * e; no.nodeValue = lead + escrever(p, p.dec ? +v.toFixed(p.dec) : Math.round(v)) + trail;
      g.requestAnimationFrame(passo);
    }
    g.requestAnimationFrame(passo);
  }

  /* ───────── 2. barras que enchem ───────── */
  function encher(el) {
    if (el.__stCheio) return; el.__stCheio = 1; if (reduz) return;
    var w = el.style.width, h = el.style.height;
    if (w && /%|px/.test(w)) { el.style.transition = 'none'; el.style.width = '0'; void el.offsetWidth; el.style.transition = 'width .9s ' + EASE; el.style.width = w; }
    else if (h && /%|px/.test(h)) { el.style.transition = 'none'; el.style.height = '0'; void el.offsetWidth; el.style.transition = 'height .9s ' + EASE; el.style.height = h; }
  }
  /* ponteiro do velocímetro: <line class="st-agulha" style="--g:120deg;transform-origin:70px 66px"> */
  function agulha(el) {
    if (el.__stAg || reduz) return; el.__stAg = 1;
    var gr = parseFloat(getComputedStyle(el).getPropertyValue('--g')) || 0;
    el.style.transition = 'none'; el.style.transform = 'rotate(' + (-gr) + 'deg)'; void el.getBoundingClientRect();
    g.requestAnimationFrame(function () { el.style.transition = 'transform 1.1s ' + EASE; el.style.transform = 'rotate(0deg)'; });
  }

  /* ───────── 3. sanfona: abre a altura suavemente ───────── */
  function sanfona(el) {
    if (reduz || el.hidden || el.__stAbrindo) return; el.__stAbrindo = 1;
    var alvo = el.scrollHeight; el.style.overflow = 'hidden'; el.style.maxHeight = '0px'; el.style.opacity = '0'; void el.offsetWidth;
    el.style.transition = 'max-height .45s ' + EASE + ',opacity .35s ease'; el.style.maxHeight = alvo + 'px'; el.style.opacity = '1';
    setTimeout(function () { el.style.maxHeight = ''; el.style.overflow = ''; el.style.transition = ''; el.__stAbrindo = 0; }, 480);
  }

  /* ───────── 4. abas com indicador deslizante ───────── */
  function abas(cont, ativo) {
    if (!cont || cont.__stAbas) return; cont.__stAbas = 1;
    if (getComputedStyle(cont).position === 'static') cont.style.position = 'relative';
    var ind = document.createElement('span'); ind.className = 'st-aba-ind'; cont.appendChild(ind);
    function pos() {
      var a = cont.querySelector(ativo || '[aria-selected="true"]'); if (!a || !a.offsetWidth) { ind.style.opacity = '0'; return; }
      ind.style.opacity = '1'; ind.style.left = (a.offsetLeft + 10) + 'px'; ind.style.width = Math.max(10, a.offsetWidth - 20) + 'px';
      ind.style.top = (a.offsetTop + a.offsetHeight - 5) + 'px'; ind.style.bottom = 'auto';
    }
    new MutationObserver(function () { if (!cont.contains(ind)) cont.appendChild(ind); pos(); }).observe(cont, { subtree: true, attributes: true, attributeFilter: ['aria-selected', 'class'], childList: true });
    g.addEventListener('resize', pos); setTimeout(pos, 50); pos();
  }

  /* ───────── observador: aplica tudo ao que for desenhado na tela ───────── */
  var io = ('IntersectionObserver' in g) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); var f = e.target.__stAoVer; if (f) f(e.target); });
  }, { threshold: .15 }) : null;
  function quandoVer(el, f) { if (!io) return f(el); el.__stAoVer = f; io.observe(el); }
  function observar(raiz, cfg) {
    raiz = raiz || document.body; cfg = cfg || {};
    var pend = null;
    function aplicar() {
      pend = null;
      if (cfg.numeros) raiz.querySelectorAll(cfg.numeros).forEach(function (el) { if (!el.__stConta && !el.__stAoVer) quandoVer(el, function (x) { contar(x); }); });
      if (cfg.barras) raiz.querySelectorAll(cfg.barras).forEach(function (el) { if (!el.__stCheio && !el.__stAoVer) quandoVer(el, encher); });
      if (cfg.agulhas) raiz.querySelectorAll(cfg.agulhas).forEach(function (el) { if (!el.__stAg && !el.__stAoVer) quandoVer(el, agulha); });
      if (cfg.pulso) raiz.querySelectorAll(cfg.pulso).forEach(function (el) { el.classList.add(cfg.pulsoTexto ? 'st-pulso-txt' : 'st-pulso'); });
      if (cfg.abas) raiz.querySelectorAll(cfg.abas).forEach(function (el) { abas(el, cfg.abaAtiva); });
    }
    new MutationObserver(function (ms) {
      if (cfg.sanfona) ms.forEach(function (m) {
        if (m.type === 'attributes' && m.target.matches && m.target.matches(cfg.sanfona) && !m.target.hidden) sanfona(m.target);
      });
      if (!pend) pend = setTimeout(aplicar, 30);
    }).observe(raiz, { childList: true, subtree: true, attributes: !!cfg.sanfona, attributeFilter: cfg.sanfona ? ['hidden'] : undefined });
    aplicar();
  }

  /* ───────── 5. confete (cores da Só Tintas) ───────── */
  function confete(op) {
    if (reduz) return; op = op || {};
    var cv = document.createElement('canvas'), dpr = Math.min(2, g.devicePixelRatio || 1), W = g.innerWidth, H = g.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483600';
    document.body.appendChild(cv); var c = cv.getContext('2d'); c.scale(dpr, dpr);
    var cores = op.cores || ['#E30613', '#FFD200', '#1C3F8F', '#2EA3F2', '#22B573', '#FF8A00'], n = op.qtd || 140, P = [];
    for (var i = 0; i < n; i++) P.push({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .35, vx: (Math.random() - .5) * 12, vy: -Math.random() * 13 - 4, r: Math.random() * 6 + 4, cor: cores[i % cores.length], a: Math.random() * 6, va: (Math.random() - .5) * .35, f: Math.random() > .5 });
    var t0 = 0, dur = op.dur || 2600;
    function quadro(t) {
      if (!t0) t0 = t; var k = (t - t0) / dur; c.clearRect(0, 0, W, H);
      P.forEach(function (p) { p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
        c.save(); c.globalAlpha = Math.max(0, 1 - Math.max(0, k - .7) / .3); c.translate(p.x, p.y); c.rotate(p.a); c.fillStyle = p.cor;
        if (p.f) c.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); else { c.beginPath(); c.arc(0, 0, p.r / 2.6, 0, 7); c.fill(); } c.restore(); });
      if (k < 1) g.requestAnimationFrame(quadro); else cv.remove();
    }
    g.requestAnimationFrame(quadro);
  }
  /* comemora uma vez por sessão por chave (não vira enfeite repetido) */
  function comemorarUmaVez(chave, f) {
    try { if (sessionStorage.getItem('st_comemorou_' + chave)) return false; sessionStorage.setItem('st_comemorou_' + chave, '1'); } catch (e) {}
    f(); return true;
  }
  /* faixa de comemoração no topo */
  function faixa(texto, cor) {
    var f = document.createElement('div'); f.setAttribute('role', 'status');
    f.style.cssText = 'position:fixed;left:0;right:0;margin:0 auto;width:max-content;top:14px;z-index:2147483601;max-width:calc(100% - 24px);text-align:center;padding:10px 18px;border-radius:999px;background:' + (cor || '#1C3F8F') + ';color:#fff;font:800 14px "Public Sans",system-ui,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.3);animation:stPop .6s ' + EASE + ' both';
    f.textContent = texto; document.body.appendChild(f);
    setTimeout(function () { f.style.animation = 'none'; f.style.transition = 'opacity .5s,transform .5s'; f.style.opacity = '0'; f.style.transform = 'translateY(-20px)'; setTimeout(function () { f.remove(); }, 600); }, 3200);
  }

  /* ───────── 6. check animado (retorno de ação) ───────── */
  var SVG_CHECK = '<svg class="st-check" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7 12.5l3.2 3.2L17 9"/></svg>';
  function check(el) { if (!el || el.querySelector('.st-check')) return; el.insertAdjacentHTML('afterbegin', SVG_CHECK); }
  /* avisos (toasts) que deslizam e ganham ✓ quando dizem "salvo/enviado/publicado" */
  function avisos(sel) {
    new MutationObserver(function () {
      document.querySelectorAll(sel).forEach(function (t) {
        var txt = t.textContent || '';
        if (t.__stTxt === txt) return; t.__stTxt = txt;
        if (!reduz) { t.style.animation = 'none'; void t.offsetWidth; t.style.animation = 'stDesliza .35s ' + EASE; }
        if (/salv|enviad|publicad|registrad|conclu|copiad|pronto|atualizad/i.test(txt) && !/n[aã]o|erro|falh/i.test(txt)) { check(t); t.__stTxt = t.textContent; }
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  /* ───────── 7. lista que se reorganiza (ranking) ───────── */
  function flip(cont, linhaSel, chaveDe, redesenhar) {
    var antes = {};
    if (cont && !reduz) cont.querySelectorAll(linhaSel).forEach(function (r) { antes[chaveDe(r)] = r.getBoundingClientRect().top; });
    redesenhar();
    if (!cont || reduz) return;
    cont.querySelectorAll(linhaSel).forEach(function (r) {
      var k = chaveDe(r), a = antes[k]; if (a == null) { r.animate && r.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'ease-out' }); return; }
      var d = a - r.getBoundingClientRect().top; if (Math.abs(d) < 2 || !r.animate) return;
      r.animate([{ transform: 'translateY(' + d + 'px)' }, { transform: 'none' }], { duration: 500, easing: EASE });
    });
  }

  /* ───────── 8. puxar para atualizar (latinha de tinta girando) ───────── */
  var LATA = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 9h18l-1.6 17.2A2 2 0 0 1 21.4 28H10.6a2 2 0 0 1-2-1.8z" fill="#1C3F8F"/><rect x="6" y="6" width="20" height="4" rx="1.5" fill="#E30613"/><path d="M9 15h14" stroke="#FFD200" stroke-width="3"/><path d="M12 6c0-2 1.8-3.2 4-3.2S20 4 20 6" stroke="#5a677f" stroke-width="1.6" fill="none"/></svg>';
  function puxar(scroller, aoAtualizar) {
    if (!scroller || scroller.__stPuxa || !('ontouchstart' in g)) return; scroller.__stPuxa = 1;
    var bola = document.createElement('div'); bola.className = 'st-puxa'; bola.innerHTML = LATA; document.body.appendChild(bola);
    var y0 = null, dy = 0, ocupado = false;
    function topo() { return (scroller === document.scrollingElement ? g.scrollY : scroller.scrollTop) <= 0; }
    scroller.addEventListener('touchstart', function (e) { if (ocupado || !topo()) { y0 = null; return; } y0 = e.touches[0].clientY; dy = 0; }, { passive: true });
    scroller.addEventListener('touchmove', function (e) {
      if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); if (!dy) return;
      var d = Math.min(110, dy * .55); bola.style.transition = 'none'; bola.style.opacity = String(Math.min(1, d / 60));
      bola.style.transform = 'translateY(' + (d - 50) + 'px) rotate(' + (d * 3) + 'deg)';
    }, { passive: true });
    scroller.addEventListener('touchend', function () {
      if (y0 == null) return; y0 = null; var ok = dy * .55 > 70;
      bola.style.transition = 'transform .3s ' + EASE + ',opacity .3s';
      if (!ok) { bola.style.opacity = '0'; bola.style.transform = 'translateY(-60px)'; return; }
      ocupado = true; bola.style.transform = 'translateY(40px)'; bola.classList.add('gira');
      try { if (g.STDados && g.STDados.semCache) g.STDados.semCache(20000); } catch (e) {}   /* puxou: busca dados novos, não a cópia */
      Promise.resolve().then(aoAtualizar || function () { g.location.reload(); }).catch(function () {}).then(function () {
        setTimeout(function () { bola.classList.remove('gira'); bola.style.opacity = '0'; bola.style.transform = 'translateY(-60px)'; ocupado = false; }, 600);
      });
    });
  }

  /* ───────── 9. "Carregando…" vira blocos que brilham (esqueleto) ───────── */
  var RE_CARR = /^\s*(carregando|buscando)\b[^]*?(…|\.\.\.)?\s*$/i;
  function esqueletos(raiz) {
    raiz = raiz || document.body; if (!raiz) return;
    function marca(el) { if (el.nodeType === 1 && el.children.length === 0 && RE_CARR.test(el.textContent || '') && (el.textContent || '').length < 60) { el.classList.add('st-carregando'); el.setAttribute('aria-busy', 'true'); } }
    function varre(n) { if (n.nodeType !== 1) return; marca(n); var q = n.querySelectorAll('p,td,div,span'); for (var i = 0; i < q.length; i++) marca(q[i]); }
    varre(raiz);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) { [].forEach.call(m.addedNodes, varre); if (m.type === 'characterData' && m.target.parentNode) marca(m.target.parentNode); });
      [].forEach.call(raiz.querySelectorAll('.st-carregando'), function (el) { if (el.children.length || !RE_CARR.test(el.textContent || '')) { el.classList.remove('st-carregando'); el.removeAttribute('aria-busy'); } });
    })
      .observe(raiz, { childList: true, subtree: true, characterData: true });
  }

  /* ───────── 10. deslizar o dedo para trocar de aba ───────── */
  function deslizar(area, abasSel, ehAtiva) {
    if (!area || area.__stDesl || !('ontouchstart' in g)) return; area.__stDesl = 1;
    var x0 = null, y0 = 0, t0 = 0;
    area.addEventListener('touchstart', function (e) {
      var t = e.target; if (t.closest && t.closest('input,textarea,select,.tbl,table,[data-sem-deslize],.mm,canvas')) { x0 = null; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
    }, { passive: true });
    area.addEventListener('touchend', function (e) {
      if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) < 70 || Math.abs(dy) > 45 || Date.now() - t0 > 700) return;
      var box = document.querySelector(abasSel); if (!box) return;
      var bts = [].filter.call(box.querySelectorAll('button,[role=tab],a'), function (b) { return b.offsetParent !== null; }); if (bts.length < 2) return;
      var i = -1; bts.forEach(function (b, k) { if (ehAtiva ? ehAtiva(b) : (b.getAttribute('aria-selected') === 'true' || b.classList.contains('on') || b.classList.contains('active') || b.classList.contains('sel'))) i = k; });
      if (i < 0) return; var j = dx < 0 ? i + 1 : i - 1; if (j < 0 || j >= bts.length) return;
      bts[j].click();
      if (!reduz) { var alvo = area; alvo.style.transition = 'none'; alvo.style.translate = (dx < 0 ? 26 : -26) + 'px 0'; alvo.style.opacity = '.4'; void alvo.offsetWidth; alvo.style.transition = 'translate .32s ' + EASE + ',opacity .32s'; alvo.style.translate = '0 0'; alvo.style.opacity = '1'; }
    }, { passive: true });
  }

  /* ───────── 11. abertura do app: a latinha pinga e a marca aparece (1 vez por sessão) ───────── */
  function abertura() {
    try { if (sessionStorage.getItem('st_abertura')) return; sessionStorage.setItem('st_abertura', '1'); } catch (e) { return; }
    if (reduz) return;
    var d = document.createElement('div'); d.className = 'st-abertura'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<style>' +
      '.st-abertura{position:fixed;inset:0;z-index:2147483500;background:#1C3F8F;display:grid;place-items:center;transition:opacity .45s ease,visibility .45s}' +
      '.st-abertura.sai{opacity:0;visibility:hidden}' +
      '.st-ab-c{display:flex;flex-direction:column;align-items:center;gap:14px;color:#fff;font:800 28px "Bricolage Grotesque","Public Sans",system-ui,sans-serif;letter-spacing:-.01em}' +
      '.st-ab-c svg{width:96px;height:96px;overflow:visible;animation:stAbLata .7s ' + EASE + ' both}' +
      '.st-ab-gota{animation:stAbGota .9s .45s cubic-bezier(.5,0,.8,.4) both}' +
      '.st-ab-poca{transform-origin:32px 66px;animation:stAbPoca .5s 1.15s ' + EASE + ' both}' +
      '.st-ab-c span{animation:stAbTxt .5s .55s ' + EASE + ' both}.st-ab-c small{font:600 13px "Public Sans",system-ui;opacity:.8;animation:stAbTxt .5s .75s ' + EASE + ' both}' +
      '@keyframes stAbLata{from{transform:translateY(-30px) rotate(-12deg);opacity:0}to{transform:none;opacity:1}}' +
      '@keyframes stAbGota{0%{transform:translateY(0) scale(.2);opacity:0}20%{opacity:1;transform:translateY(0) scale(1)}100%{transform:translateY(34px);opacity:1}}' +
      '@keyframes stAbPoca{from{transform:scaleX(0);opacity:0}to{transform:scaleX(1);opacity:1}}' +
      '@keyframes stAbTxt{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}' +
      '</style><div class="st-ab-c"><svg viewBox="0 0 64 72"><ellipse class="st-ab-poca" cx="32" cy="66" rx="16" ry="3" fill="#FFD200"/>' +
      '<path d="M14 14h36l-3 34a4 4 0 0 1-4 3.6H21a4 4 0 0 1-4-3.6z" fill="#fff"/><rect x="12" y="8" width="40" height="8" rx="3" fill="#E30613"/>' +
      '<path d="M18 26h28" stroke="#FFD200" stroke-width="6"/><circle class="st-ab-gota" cx="32" cy="56" r="3.4" fill="#FFD200"/></svg>' +
      '<span>Só Tintas</span><small>Colorindo Vidas e Realizando Sonhos</small></div>';
    (document.body || document.documentElement).appendChild(d);
    setTimeout(function () { d.classList.add('sai'); setTimeout(function () { d.remove(); }, 600); }, 1500);
    d.addEventListener('click', function () { d.classList.add('sai'); });
  }

  g.STAnima = { observar: observar, contar: contar, encher: encher, sanfona: sanfona, abas: abas, confete: confete, comemorarUmaVez: comemorarUmaVez,
    faixa: faixa, check: check, avisos: avisos, flip: flip, puxar: puxar, pop: function (el) { if (el && !reduz) { el.classList.remove('st-pop'); void el.offsetWidth; el.classList.add('st-pop'); } },
    brilho: function (el) { if (el && !reduz) el.classList.add('st-brilho'); }, reduz: reduz,
    esqueletos: esqueletos, deslizar: deslizar, abertura: abertura };
})(window);
