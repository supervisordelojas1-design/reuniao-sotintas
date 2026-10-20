/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO × Só Tintas Apps — ajustes de tela (Fase 1)
   Roda DEPOIS de app.js (ou gestor.js).
   1. Sem sessão do Assistente ST: em vez do login próprio do Mentor,
      um aviso para entrar pelo app.
   2. "Sair da conta" vira "Voltar ao Assistente ST" (quem sai é o app).
   3. Some o botão "Zerar demonstração" (apagaria o progresso de todos
      que usam este aparelho) e o rótulo "modo demonstração".
   4. Páginas das apostilas (assets/material/) ficam protegidas e entram
      na Fase 2: no lugar da imagem, um aviso.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  var P = global.ST_PONTE || {};
  var APP_URL = '../';
  var embutido = (function () { try { return global.self !== global.top; } catch (e) { return true; } })();

  function voltarAoApp() {
    if (embutido) { try { global.parent.postMessage({ mentor: 'fechar' }, '*'); return; } catch (e) {} }
    global.location.href = APP_URL;
  }
  global.ST_voltarAoApp = voltarAoApp;

  var avisoSemSessao =
    '<div class="login-tela"><div class="login-topo"><div class="logo-st" style="justify-content:center"><span class="marca" style="font-size:1.1rem">SÓ TINTAS</span></div>' +
    '<div class="titulo-app">MENTOR <span>ST</span> PRO</div></div>' +
    '<div class="login-corpo"><div class="card"><h3>Entre pelo Assistente ST</h3>' +
    '<p class="pequeno">O Mentor agora faz parte do Assistente ST. Entre lá com o seu <b>nome e PIN</b> e toque no card <b>Mentor ST PRO</b>.</p>' +
    '<p class="pequeno texto-3">Ainda não tem acesso? Peça ao seu gerente ou supervisor para liberar você no app.</p>' +
    '<button class="btn bloco" onclick="ST_voltarAoApp()">Abrir o Assistente ST</button></div></div></div>';

  var App = global.App;
  if (App && App.views) {
    if (!P.ok) App.views.login = function () { return avisoSemSessao; };
    App.sair = function () { voltarAoApp(); };
    var perfilOriginal = App.views.perfil;
    if (perfilOriginal) {
      App.views.perfil = function () {
        var h = perfilOriginal.apply(this, arguments);
        h = h.replace('>Sair da conta</button>', '>Voltar ao Assistente ST</button>');
        h = h.replace(/<button class="btn bloco link mt-1 pequeno"[\s\S]*?Zerar demonstração<\/button>/, '');
        h = h.replace('modo demonstração', 'progresso salvo no servidor do app');
        return h;
      };
    }
  }

  /* gestor.html sem sessão: manda para o Mentor, que mostra o aviso de entrar pelo app */
  if (!App && !P.ok) { global.location.replace('index.html'); }

  /* gestor.html: sem "equipe fictícia" (encheria o aparelho de gente inventada) e sem o
     rótulo de demonstração — aqui é o app de verdade, com o progresso guardado no aparelho */
  if (!App) {
    document.addEventListener('DOMContentLoaded', function () {
      var alvo = document.getElementById('painel'); if (!alvo || !global.MutationObserver) return;
      var limpar = function () {
        Array.prototype.forEach.call(alvo.querySelectorAll('button,a'), function (b) {
          if (/Popular com equipe fict/i.test(b.textContent)) b.remove();
          if (/^\s*Sair\s*$/.test(b.textContent)) { b.textContent = 'Voltar ao Assistente ST'; b.onclick = function (e) { e.preventDefault(); voltarAoApp(); }; }
        });
        Array.prototype.forEach.call(alvo.querySelectorAll('.rodape'), function (r) {
          if (/modo demonstração/.test(r.innerHTML)) r.innerHTML = r.innerHTML.replace('🧪 modo demonstração', 'progresso salvo no servidor do app');
        });
      };
      new MutationObserver(limpar).observe(alvo, { childList: true, subtree: true }); limpar();
    });
  }

  /* apostilas protegidas: a imagem não existe no site público */
  global.addEventListener('error', function (ev) {
    var t = ev.target;
    if (!t || t.tagName !== 'IMG' || !/\/assets\/material\//.test(t.src || '')) return;
    var box = document.createElement('div');
    box.className = 'card info pequeno st-material-protegido';
    box.style.cssText = 'text-align:center;padding:18px 14px;margin:6px 0';
    box.innerHTML = '📘 <b>Página da apostila</b><br>As apostilas ficam protegidas e entram no app na próxima etapa, só para quem fez login.';
    if (t.parentNode) t.parentNode.replaceChild(box, t);
  }, true);
})(window);
