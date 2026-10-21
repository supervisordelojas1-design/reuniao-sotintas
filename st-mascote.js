/* ═══════════════════════════════════════════════════════════════
   MASCOTE — boas-vindas do dia: o mascote fardado bate continência e
   chama cada um pela patente. 1ª abertura do dia, depois do login.
   Vendedor: patente pelo nível de Evolução (V1 Soldado … V5 Tenente).
   Gerente = Capitão · Supervisor = Comandante · Coordenação = General.
   ═══════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var IMG = 'mascote-soldado.webp?v=1';
  var PAT_V = { 1: 'Soldado', 2: 'Cabo', 3: 'Sargento', 4: 'Subtenente', 5: 'Tenente' };
  var PAT_C = { ger: 'Capitão', sup: 'Comandante', coord: 'General' };
  var FRASES = ['Sua missão começa agora: colorir vidas e realizar sonhos.', 'Aqui cada acesso, cada aula e cada PDI vira ST. Bora subir no ranking!'];
  var CSS3D = '.st-mv-3d{position:absolute;z-index:2;left:0;right:0;bottom:calc(16vh - 26px);height:min(54vh,520px);opacity:0;transition:opacity .5s ease}.st-mv.tem3d .st-mv-3d{opacity:1}.st-mv.tem3d .st-mv-entra,.st-mv.tem3d .st-mv-sombra{opacity:0;transition:opacity .4s ease}';
  var CSS = ".st-mv{--navy:#0f2350;--navy2:#1C3F8F;--amarelo:#FFD200;--verde:#3d5a2a;position:fixed;inset:0;z-index:2147483350;font-family:\"Public Sans\",system-ui,sans-serif;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;\n  background:radial-gradient(120% 70% at 50% 100%,#2a4f9e 0%,var(--navy2) 35%,var(--navy) 75%);overflow:hidden}\n/* raios girando atrás do mascote */\n.st-mv-raios{position:absolute;left:50%;bottom:18vh;width:170vmax;height:170vmax;margin-left:-85vmax;margin-bottom:-85vmax;\n  background:repeating-conic-gradient(rgba(255,210,0,.10) 0 8deg,transparent 8deg 22deg);border-radius:50%;\n  animation:raio 40s linear infinite;mask:radial-gradient(circle,#000 0 20%,transparent 55%);-webkit-mask:radial-gradient(circle,#000 0 20%,transparent 55%)}\n@keyframes raio{to{transform:rotate(360deg)}}\n/* chão */\n.st-mv-chao{position:absolute;bottom:0;left:0;right:0;height:16vh;background:linear-gradient(#0b1a3d,#081330);border-top:3px solid var(--amarelo)}\n.st-mv-sombra{position:absolute;bottom:calc(16vh - 14px);left:50%;width:min(52vw,250px);height:26px;margin-left:calc(min(52vw,250px)/-2);\n  background:radial-gradient(closest-side,rgba(0,0,0,.55),transparent);animation:sombra 2.4s ease-in-out 1.6s infinite}\n/* mascote */\n.st-mv-entra{position:relative;z-index:2;margin-bottom:calc(16vh - 30px);transform-origin:50% 100%;animation:entra 1.1s cubic-bezier(.2,1.4,.4,1) .2s both}\n.st-mv-boneco{display:block;height:min(50vh,500px);transform-origin:50% 100%;animation:vida 4.8s ease-in-out 1.4s infinite;filter:drop-shadow(0 10px 18px rgba(0,0,0,.35))}\n@keyframes entra{0%{transform:translateY(120%) scale(.6)}60%{transform:translateY(-6%) scale(1.04)}80%{transform:translateY(2%) scale(.98,1.02)}100%{transform:none}}\n/* vida: respira, balança e a cada ciclo dá um \"tique\" de continência */\n@keyframes vida{0%,100%{transform:none}12%{transform:translateY(-8px) rotate(-1deg)}25%{transform:none}37%{transform:translateY(-8px) rotate(1deg)}50%{transform:none}\n  58%{transform:rotate(-4deg) translateY(-12px) scale(1.04)}66%{transform:rotate(2deg) translateY(-2px)}74%{transform:none}87%{transform:translateY(-6px)}}\n@keyframes sombra{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.82);opacity:.7}}\n/* balão */\n.st-mv-balao{position:absolute;z-index:3;top:max(5vh,env(safe-area-inset-top));left:16px;right:16px;margin:auto;max-width:420px;background:#fff;color:#16233d;\n  border-radius:20px;padding:16px 18px 18px;box-shadow:0 18px 50px rgba(0,0,0,.4);animation:pop .5s cubic-bezier(.2,1.5,.5,1) 1.2s both}\n.st-mv-balao:after{content:\"\";position:absolute;bottom:-14px;left:58%;border:14px solid transparent;border-top-color:#fff;border-bottom:0}\n@keyframes pop{from{transform:scale(.4) translateY(30px);opacity:0}to{transform:none;opacity:1}}\n.st-mv-tag{display:inline-block;background:var(--verde);color:#fff;font-weight:900;font-size:11px;font-family:inherit;line-height:1;letter-spacing:1.5px;padding:6px 9px;border-radius:6px;text-transform:uppercase}\n.st-mv-tit{font-weight:900;font-size:clamp(22px,6.4vw,30px);font-family:inherit;line-height:1.1;margin:10px 0 6px;color:var(--navy2)}\n.st-mv-tit em{font-style:normal;color:#d19a00}\n.st-mv-txt{font-weight:500;font-size:15px;font-family:inherit;line-height:1.45;min-height:3em;margin:0}\n.st-mv-txt .cur{display:inline-block;width:2px;height:1em;background:#16233d;vertical-align:-2px;animation:pisca .8s steps(1) infinite}\n@keyframes pisca{50%{opacity:0}}\n/* botão */\n.st-mv-acao{position:absolute;z-index:4;bottom:calc(env(safe-area-inset-bottom) + 3.2vh);left:16px;right:16px;margin:auto;max-width:420px;display:flex;flex-direction:column;gap:8px;\n  animation:pop .5s ease 2.2s both}\n.st-mv-ir{border:0;border-radius:14px;padding:16px;background:var(--amarelo);color:#16233d;font-weight:900;font-size:17px;font-family:inherit;cursor:pointer;box-shadow:0 6px 0 #b38f00,0 12px 24px rgba(0,0,0,.35);\n  animation:chama 1.6s ease-in-out 3s infinite}\n.st-mv-ir:active{transform:translateY(4px);box-shadow:0 2px 0 #b38f00}\n@keyframes chama{0%,100%{transform:none}50%{transform:scale(1.03)}}\n.st-mv-pula{background:transparent;border:0;color:#c9d4ee;font-weight:700;font-size:13px;font-family:inherit;cursor:pointer;padding:6px}\n/* estrelinhas */\n.st-mv i.est{position:absolute;z-index:1;width:8px;height:8px;background:var(--amarelo);clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%);opacity:0;animation:est 2.8s ease-in-out infinite}\n@keyframes est{0%,100%{opacity:0;transform:scale(.3)}50%{opacity:1;transform:scale(1.4) rotate(45deg)}}\n.st-mv *{box-sizing:border-box}\n.st-mv.sai{animation:sai .45s ease forwards}@keyframes sai{to{opacity:0;transform:scale(1.06)}}\n@media (prefers-reduced-motion:reduce){.st-mv *{animation:none!important}}\n@media (min-height:760px){.st-mv-boneco{height:min(52vh,540px)}}\n.st-mv-sombra{animation-duration:2.4s}\n";
  function sessao() { try { return JSON.parse(localStorage.getItem('sotintas_sessao_v1') || 'null'); } catch (e) { return null; } }
  function hoje() { try { if (g.STHora) return STHora.iso(); } catch (e) {} return new Date().toDateString(); }
  function chave(s) { return 'st_mascote_dia:' + String(s.nome).toLowerCase().trim(); }
  function perfilDe(s) {
    var p = null; try { p = g.STDados && STDados.perfil(); } catch (e) {}
    if (p && p !== 'outro') return p;
    var pa = String((s && s.papel) || '');
    if (s && s.vendedor) return 'vend';
    if (/coord/i.test(pa)) return 'coord'; if (/supervis/i.test(pa)) return 'sup'; if (/geren/i.test(pa)) return 'ger';
    return 'vend';
  }
  /* patente: vendedor pelo nível (servidor 'niveis'); sem nível ainda = Soldado */
  function patente(s) {
    var pf = perfilDe(s);
    if (PAT_C[pf]) return Promise.resolve(PAT_C[pf]);
    if (!g.STDados || !STDados.chamar) return Promise.resolve('Soldado');
    var tempo = new Promise(function (ok) { setTimeout(function () { ok(null); }, 4000); });
    return Promise.race([STDados.chamar('niveis').then(function (j) {
      var V = (j && j.data && j.data.VENDS) || [];
      var n = V.length === 1 ? Number(V[0].niv) : 0;
      return PAT_V[n] || 'Soldado';
    }, function () { return 'Soldado'; }), tempo]).then(function (x) { return x || 'Soldado'; });
  }
  /* carrega o módulo 3D sob demanda; desiste em 8 s (fica a imagem) */
  var p3d = null;
  function tresD() {
    if (g.STMascote3D) return Promise.resolve(g.STMascote3D);
    if (p3d) return p3d;
    p3d = new Promise(function (ok, erro) {
      var feito = false, fim = function (x) { if (feito) return; feito = true; x ? ok(x) : erro(new Error('3D indisponível')); };
      g.addEventListener('stmascote3d', function () { fim(g.STMascote3D); });
      var sc = document.createElement('script'); sc.type = 'module'; sc.src = 'st-mascote3d.js?v=1'; sc.onerror = function () { fim(null); }; document.head.appendChild(sc);
      setTimeout(function () { fim(g.STMascote3D || null); }, 8000);
    });
    p3d.catch(function () { p3d = null; });
    return p3d.then(function (M) { return Promise.race([M.carregar().then(function () { return M; }), new Promise(function (_, e) { setTimeout(function () { e(new Error('lento')); }, 8000); })]); });
  }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mostrar(depois, forcar) {
    depois = depois || function () {};
    var s = sessao();
    if (!s || !s.nome || document.querySelector('.st-mv')) { depois(); return; }
    try { if (g.STDados && STDados.visao && STDados.visao()) { depois(); return; } } catch (e) {}
    var dia = hoje();
    if (!forcar) { try { if (localStorage.getItem(chave(s)) === dia) { depois(); return; } } catch (e) { depois(); return; } }
    if (!document.getElementById('stMvCss')) { var st = document.createElement('style'); st.id = 'stMvCss'; st.textContent = CSS + CSS3D; document.head.appendChild(st); }
    var nome = String(s.nome).trim().split(' ')[0];
    var ov = document.createElement('div'); ov.className = 'st-mv'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'stMvTit');
    ov.innerHTML = '<div class="st-mv-raios"></div><div class="st-mv-chao"></div><div class="st-mv-sombra"></div>' +
      '<div class="st-mv-entra"><img class="st-mv-boneco" src="' + IMG + '" alt="Mascote da Só Tintas fardado, batendo continência"></div>' +
      '<div class="st-mv-balao"><span class="st-mv-tag">🇧🇷 Tropa Só Tintas</span>' +
      '<div class="st-mv-tit" id="stMvTit">Boas-vindas, <em><span data-pat>Soldado</span> ' + esc(nome) + '</em>!</div><p class="st-mv-txt" aria-live="polite"></p></div>' +
      '<div class="st-mv-acao"><button class="st-mv-ir" type="button">🫡 Apresentar-se para a missão</button><button class="st-mv-pula" type="button">Pular</button></div>';
    for (var k = 0; k < 14; k++) { var e = document.createElement('i'); e.className = 'est'; e.style.left = (5 + Math.random() * 90) + '%'; e.style.top = (28 + Math.random() * 48) + '%'; e.style.animationDelay = (Math.random() * 2.8) + 's'; ov.appendChild(e); }
    var caixa3d = document.createElement('div'); caixa3d.className = 'st-mv-3d'; ov.insertBefore(caixa3d, ov.querySelector('.st-mv-balao'));
    document.body.appendChild(ov);
    var m3d = null;
    tresD().then(function (M) { return M.montar(caixa3d); }).then(function (x) { if (!document.body.contains(ov)) { x.parar(); return; } m3d = x; ov.classList.add('tem3d'); }).catch(function () { caixa3d.remove(); });
    patente(s).then(function (p) { var x = ov.querySelector('[data-pat]'); if (x) x.textContent = p; });
    var el = ov.querySelector('.st-mv-txt'), f = 0, i = 0, vivo = true;
    function digita() {
      if (!vivo) return; var fr = FRASES[f];
      el.innerHTML = esc(fr.slice(0, i)) + '<span class="cur"></span>';
      if (i < fr.length) { i++; setTimeout(digita, 28); }
      else if (f < FRASES.length - 1) { setTimeout(function () { f++; i = 0; digita(); }, 2200); }
    }
    setTimeout(digita, 1500);
    var feito = false;
    function sair() {
      if (feito) return; feito = true; vivo = false;
      try { localStorage.setItem(chave(s), dia); } catch (e) {}
      ov.classList.add('sai'); document.removeEventListener('keydown', tecla);
      setTimeout(function () { if (m3d) m3d.parar(); ov.remove(); depois(); }, 450);
    }
    function tecla(e) { if (e.key === 'Escape') sair(); }
    document.addEventListener('keydown', tecla);
    ov.querySelector('.st-mv-ir').onclick = sair; ov.querySelector('.st-mv-pula').onclick = sair;
    setTimeout(function () { var b = ov.querySelector('.st-mv-ir'); if (b) b.focus({ preventScroll: true }); }, 2300);
  }
  g.STMascote = { mostrar: mostrar, patente: patente, PAT_V: PAT_V, PAT_C: PAT_C };
})(window);
