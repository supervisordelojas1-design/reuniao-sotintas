/* ═══════════════════════════════════════════════════════════════
   Só Tintas App — acesso ao SERVIDOR DE DADOS (PDI, Níveis, Ranking, Mentor)

   Os dados não ficam mais nas páginas: cada painel pede ao servidor,
   que confere o CRACHÁ e devolve só o recorte da pessoa.
   O crachá nasce no login do app (nome + PIN) e vale 7 dias. Quem já
   estava logado confirma o PIN uma vez, numa janelinha.

   Uso nos painéis:  STDados.chamar('niveis').then(function(r){ ... })
   ═══════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var URL_DADOS = 'https://script.google.com/macros/s/AKfycbznIM0I8T-wkPiOvRbO-uhJifdyQUXToIwYd8PtEf855I5pFxb5nz5kn1eDm8HEy2JyEA/exec';
  var LS_SESSAO = 'sotintas_sessao_v1', LS_CRACHA = 'st_cracha_v1', LS_VISAO = 'st_vercomo_v1';
  /* Servidor do APP (aba USUARIOS): e a FONTE do PIN — login, troca de PIN e liberacao gravam la.
     Este arquivo fala com o SERVIDOR DE DADOS, que emite o cracha. Quando os dois nao estao na
     mesma planilha, um PIN trocado no app podia ser recusado aqui, e isso so aparecia no 7o dia,
     quando o cracha vencia. Com a URL do app aqui, a recusa deixa de ser um mistero: conferimos
     o PIN na fonte e pedimos o reparo. */
  var URL_APP = 'https://script.google.com/macros/s/AKfycbxC916U8rNw_-HFTW7vtFZz4AC_B1bHcTLE3bvMDWji6E5lAqkXgC0EIgQFtjHYTp8I/exec';

  function ler(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function sessao() { return ler(LS_SESSAO); }
  function post(corpo) {
    return fetch(URL_DADOS, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(corpo) })
      .then(function (r) { return r.json(); });
  }
  function guardar(r) { try { localStorage.setItem(LS_CRACHA, JSON.stringify({ nome: r.nome, tk: r.tk, ex: r.ex, perfil: r.perfil, lojas: r.lojas })); } catch (e) {} }
  function esquecer() { try { localStorage.removeItem(LS_CRACHA); localStorage.removeItem(LS_VISAO); } catch (e) {} limparCache(); }
  /* ── "Ver como" (só coordenação): crachá de visão, só leitura, 2 horas ── */
  function ehCoordReal() { var s = sessao(); return !!s && (s.escopo === 'todos' || /coorden/i.test(String(s.papel || ''))); }
  function visao() {
    var v = ler(LS_VISAO), s = sessao();
    if (!v || !v.tk || !s || norm(v.dono) !== norm(s.nome) || !(v.ex > Date.now() + 30000) || !ehCoordReal()) return null;
    return v;
  }
  /* a sessão "como se fosse" a pessoa da visão — os painéis usam isto no lugar da sessão real */
  function sessaoVisao() {
    var s = sessao(), v = visao(); if (!v) return s;
    var papel = { sup: 'Supervisor', ger: 'Gerente', vend: 'Vendedor' }[v.perfil] || 'Colaborador';
    var lj = (v.lojas || []).map(function (c) { return c + ' - ' + (v.lojaNome || ''); });
    return { nome: v.nome, papel: papel, escopo: v.perfil === 'ger' ? 'lojas' : 'equipe', vendedor: v.perfil === 'vend', lotacao: lj[0] || '', carteira: v.perfil === 'sup' ? lj : [], gerencia: v.perfil === 'ger' ? lj : [], visao: true };
  }
  function entrarVisao(pf, nome, lojas, rotulo, lojaNome) {
    return chamar('verComo', { pf: pf, n: nome || '', lj: lojas || [] }, true).then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.erro) || 'Não consegui abrir a visão.');
      var s = sessao();
      try { localStorage.setItem(LS_VISAO, JSON.stringify({ tk: r.tk, ex: r.ex, perfil: r.perfil, lojas: r.lojas, nome: r.nome, rotulo: rotulo || r.nome, lojaNome: lojaNome || '', dono: s && s.nome })); } catch (e) {}
      return r;
    });
  }
  function sairVisao() { try { localStorage.removeItem(LS_VISAO); } catch (e) {} }

  /* crachá válido e da MESMA pessoa logada no app (com "Ver como" ativo, o crachá da visão) */
  function crachaGuardado(real) {
    if (!real) { var v = visao(); if (v) return v; }
    var c = ler(LS_CRACHA), s = sessao();
    if (!c || !c.tk || !s || !s.nome) return null;
    if (norm(c.nome) !== norm(s.nome) || !(c.ex > Date.now() + 60000)) return null;
    return c;
  }

  /* chamado pelo login do app, com o PIN que a pessoa acabou de digitar */
  function entrar(nome, pin) {
    return post({ acao: 'entrar', nome: nome, pin: pin }).then(function (r) {
      if (!r || !r.ok) { var e = new Error((r && r.erro) || 'Não consegui confirmar o PIN.'); e.recusado = true; throw e; }
      guardar(r); return r;
    });
  }

  /* o PIN confere na FONTE (servidor do app)? */
  function pinValeNoApp(nome, pin) {
    if (!URL_APP) return Promise.resolve(false);
    return fetch(URL_APP, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ tipo: 'login', nome: nome, pin: pin }) })
      .then(function (r) { return r.json(); }).then(function (r) { return !!(r && r.ok); }).catch(function () { return false; });
  }
  /* ENTRADA OFICIAL. O servidor de dados nao guarda PIN: ele pergunta ao servidor do app
     (a aba USUARIOS e a unica fonte). Entao, quando ele recusa um PIN que o app aceita, o
     problema nao e o PIN — e a conversa entre os dois servidores, que falhou. Nesse caso
     tentamos de novo uma vez e, se ainda assim nao vier, dizemos o que esta acontecendo
     em vez de mandar a pessoa adivinhar a senha. */
  function reparar(nome, pin) {
    return entrar(nome, pin).catch(function (err) {
      if (!err || !err.recusado) throw err;
      return pinValeNoApp(nome, pin).then(function (vale) {
        if (!vale) throw err;
        return new Promise(function (ok) { setTimeout(ok, 1200); }).then(function () {
          return entrar(nome, pin).catch(function () {
            var e2 = new Error('Seu PIN está certo — quem não respondeu agora foi o servidor dos painéis. Toque de novo em instantes; o app do dia a dia continua funcionando.');
            e2.servidor = true; throw e2;
          });
        });
      });
    });
  }

  /* renova o cracha ANTES de vencer, usando o proprio cracha: assim ninguem mais topa com a
     janelinha do PIN no 7o dia so por estar usando o app normalmente. */
  var renovando = false;
  function renovarSePerto() {
    try {
      var c = crachaGuardado(true);
      if (renovando || !c || !c.tk) return;
      if (Number(c.ex || 0) - Date.now() > 36 * 3600000) return;
      renovando = true;
      post({ acao: 'renovar', tk: c.tk }).then(function (r) {
        if (r && r.ok && r.tk) guardar({ nome: r.nome || c.nome, tk: r.tk, ex: r.ex, perfil: r.perfil || c.perfil, lojas: r.lojas || c.lojas });
      }).catch(function () {}).then(function () { renovando = false; });
    } catch (e) { renovando = false; }
  }
  /* estado do acesso, para a tela Minha conta */
  function diag() {
    var s = sessao(), c = ler(LS_CRACHA);
    return { nome: (s && s.nome) || '', temCracha: !!(c && c.tk), expira: c ? Number(c.ex || 0) : 0,
      valido: !!(c && c.tk && Number(c.ex || 0) > Date.now()), perfil: c ? c.perfil : null };
  }

  /* janelinha para confirmar o PIN (sessões antigas ou crachá vencido) */
  var pedindo = null;
  function pedirPin() {
    if (pedindo) return pedindo;
    pedindo = new Promise(function (ok, nao) {
      var s = sessao();
      var escuro = document.documentElement.getAttribute('data-theme') === 'dark';
      var cor = escuro ? { bg: '#1a2336', ink: '#eef2fb', mut: '#9aa5bb', lin: '#2c3850', campo: '#222d44' } : { bg: '#ffffff', ink: '#16233d', mut: '#5a677f', lin: '#e4e9f3', campo: '#f5f7fb' };
      var ov = document.createElement('div');
      ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'stdTit');
      ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(6,10,20,.66);display:flex;align-items:center;justify-content:center;padding:16px;font-family:"Public Sans",system-ui,sans-serif';
      ov.innerHTML = '<form style="width:100%;max-width:360px;background:' + cor.bg + ';color:' + cor.ink + ';border:1px solid ' + cor.lin + ';border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:10px">' +
        '<b id="stdTit" style="font-size:17px">Confirme seu PIN</b>' +
        '<span style="font-size:13px;color:' + cor.mut + '">Por segurança, os dados agora só abrem com o seu crachá. Digite o PIN do app uma vez; ele vale por 7 dias neste aparelho.</span>' +
        '<label style="font-size:12px;font-weight:700;color:' + cor.mut + '">' + String((s && s.nome) || '').replace(/</g, '&lt;') +
        '<input id="stdPin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="8" style="display:block;width:100%;margin-top:6px;padding:11px 12px;font-size:18px;letter-spacing:4px;border-radius:9px;border:1px solid ' + cor.lin + ';background:' + cor.campo + ';color:' + cor.ink + '"></label>' +
        '<span id="stdMsg" role="status" style="font-size:12.5px;color:#d9363e;min-height:16px"></span>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" id="stdCancel" style="padding:9px 14px;border-radius:9px;border:1px solid ' + cor.lin + ';background:transparent;color:' + cor.ink + ';font-weight:700;cursor:pointer">Cancelar</button>' +
        '<button type="submit" id="stdOk" style="padding:9px 16px;border-radius:9px;border:0;background:#1C3F8F;color:#fff;font-weight:700;cursor:pointer">Confirmar</button></div></form>';
      document.body.appendChild(ov);
      var pin = ov.querySelector('#stdPin'), msg = ov.querySelector('#stdMsg'), bt = ov.querySelector('#stdOk');
      setTimeout(function () { pin.focus(); }, 50);
      function fim() { ov.remove(); pedindo = null; }
      ov.querySelector('#stdCancel').onclick = function () { fim(); nao(new Error('PIN não confirmado.')); };
      ov.querySelector('form').onsubmit = function (e) {
        e.preventDefault();
        var p = pin.value.trim(); if (!p) { msg.textContent = 'Digite o PIN.'; return; }
        bt.disabled = true; bt.textContent = 'Conferindo…'; msg.textContent = '';
        reparar(s.nome, p).then(function (r) { fim(); ok(r.tk); })
          .catch(function (err) { bt.disabled = false; bt.textContent = 'Confirmar'; msg.textContent = err.message || 'PIN não confere.'; pin.select(); });
      };
    });
    return pedindo;
  }

  function cracha(real) {
    var c = crachaGuardado(real); if (c) { renovarSePerto(); return Promise.resolve(c.tk); }
    var s = sessao(); if (!s || !s.nome) return Promise.reject(new Error('Entre no Só Tintas App primeiro.'));
    return pedirPin();
  }

  /* pede dados ao servidor; se o crachá venceu ou não vale, pede o PIN e tenta de novo */
  /* ── cópia no aparelho: abre mais rápido (3 min) e funciona sem internet ── */
  var LEITURA = /^(niveis|ranking|pdi|posicao|mentorLer)$/, PREF_CACHE = 'st_cache_v1:', FRESCO_MS = 3 * 60000;
  function chaveCache(acao, extra, real) {
    var s = sessao(), v = real ? null : visao();
    return PREF_CACHE + norm(s && s.nome) + '|' + (v ? 'vc:' + norm(v.nome) + ':' + (v.lojas || []).join(',') : 'eu') + '|' + acao + '|' + JSON.stringify(extra || {});
  }
  function lerCache(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function gravarCache(k, r) {
    try { localStorage.setItem(k, JSON.stringify({ em: Date.now(), r: r })); }
    catch (e) { limparCache(); try { localStorage.setItem(k, JSON.stringify({ em: Date.now(), r: r })); } catch (e2) {} }
  }
  function limparCache() { try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(PREF_CACHE) === 0) localStorage.removeItem(k); }); } catch (e) {} }
  function semCache(ms) { try { sessionStorage.setItem('st_fresco_ate', String(Date.now() + (ms || 15000))); } catch (e) {} }
  function querFresco() { try { return Number(sessionStorage.getItem('st_fresco_ate') || 0) > Date.now(); } catch (e) { return false; } }
  function horaDe(ms) { var B = g.STHora ? g.STHora.data : function (x) { return x == null ? new Date() : new Date(x); }, d = B(ms), p = function (n) { return (n < 10 ? '0' : '') + n; }, hoje = B().toDateString() === d.toDateString(); return (hoje ? 'hoje, ' : p(d.getDate()) + '/' + p(d.getMonth() + 1) + ', ') + p(d.getHours()) + 'h' + p(d.getMinutes()); }
  function faixaOffline(em) {
    var f = document.getElementById('stOffFaixa');
    if (!f) {
      f = document.createElement('div'); f.id = 'stOffFaixa'; f.setAttribute('role', 'status');
      f.style.cssText = 'position:fixed;left:0;right:0;margin:auto;width:max-content;max-width:calc(100% - 24px);top:max(10px,env(safe-area-inset-top,0px));z-index:2147482998;padding:7px 14px;border-radius:999px;background:#16233d;color:#fff;font:700 12.5px "Public Sans",system-ui,sans-serif;box-shadow:0 6px 22px rgba(0,0,0,.35)';
      (document.body || document.documentElement).appendChild(f);
      g.addEventListener('online', function () { var x = document.getElementById('stOffFaixa'); if (x) x.remove(); }, { once: true });
    }
    f.textContent = '📶 Sem internet · mostrando os dados de ' + horaDe(em);
  }

  /* pede dados ao servidor; se o crachá venceu ou não vale, pede o PIN e tenta de novo */
  function chamarRede(acao, extra, real) {
    function vai(tk) { var b = { acao: acao, tk: tk }; for (var k in (extra || {})) b[k] = extra[k]; return post(b); }
    return cracha(real).then(vai).then(function (r) {
      if (r && !r.ok && r.cracha) {
        if (!real && visao()) { sairVisao(); throw new Error('A visão expirou. Abra o "Ver como" de novo.'); }
        try { localStorage.removeItem(LS_CRACHA); } catch (e) {}
        return cracha(real).then(vai);
      }
      return r;
    });
  }
  function chamar(acao, extra, real) {
    if (!LEITURA.test(acao)) {
      return chamarRede(acao, extra, real).then(function (r) { if (r && r.ok) limparCache(); return r; });
    }
    var k = chaveCache(acao, extra, real), c = lerCache(k);
    if (c && c.r && !querFresco() && Date.now() - c.em < FRESCO_MS && navigator.onLine !== false) return Promise.resolve(c.r);
    if (c && c.r && navigator.onLine === false) { faixaOffline(c.em); return Promise.resolve(c.r); }
    return chamarRede(acao, extra, real).then(function (r) {
      if (r && r.ok) gravarCache(k, r);
      return r;
    }, function (err) {
      /* sem rede (fetch falhou): usa a última cópia boa deste aparelho */
      if (c && c.r && !(err && /PIN/.test(String(err.message || '')))) { faixaOffline(c.em); return c.r; }
      if (err && /fetch|network|Load failed|NetworkError/i.test(String(err.message || err))) throw new Error('Sem internet agora. Quando o sinal voltar, puxe a tela para baixo ou toque em Tentar de novo.');
      throw err;
    });
  }

  function perfil() { var c = crachaGuardado(); return c ? c.perfil : null; }

  /* nov/2026: o perfil pode mudar sem novo login (ex.: a coordenação põe alguém como administrador de
     conteúdo). Para quem entra como "outro" ou "mkt", confere no servidor a cada 10 min e avisa a tela. */
  function atualizarPerfil() {
    var c = crachaGuardado(true); if (!c || (c.perfil !== 'outro' && c.perfil !== 'mkt')) return Promise.resolve(c ? c.perfil : null);
    var k = 'st_pf_conf:' + norm(c.nome);
    try { if (Date.now() - Number(sessionStorage.getItem(k) || 0) < 10 * 60000) return Promise.resolve(c.perfil); } catch (e) {}
    return post({ acao: 'quemSou', tk: c.tk }).then(function (r) {
      if (!r || !r.ok) return c.perfil;
      try { sessionStorage.setItem(k, String(Date.now())); } catch (e) {}
      if (r.perfil && r.perfil !== c.perfil) {
        var x = ler(LS_CRACHA); if (x) { x.perfil = r.perfil; try { localStorage.setItem(LS_CRACHA, JSON.stringify(x)); } catch (e) {} }
        try { g.dispatchEvent(new CustomEvent('st-perfil', { detail: r.perfil })); } catch (e) {}
      }
      return r.perfil;
    }).catch(function () { return c.perfil; });
  }
  function ehMkt() { return perfil() === 'mkt' && !visao(); }

  /* ── arquivos do Painel de Conteúdo (banners, logos, catálogos): {id, mime, pub, url} ──
     público no Drive → endereço direto; senão vem pelo servidor (com o crachá) e fica guardado no aparelho */
  var arqMem = {};
  function arquivoUrl(ref) {
    if (!ref) return Promise.reject(new Error('sem arquivo'));
    if (typeof ref === 'string') return Promise.resolve(ref);
    if (ref.src) return Promise.resolve(ref.src);
    if (ref.pub && ref.url && /^image\//.test(ref.mime || '')) return Promise.resolve(ref.url);
    if (!ref.id) return Promise.reject(new Error('sem arquivo'));
    if (arqMem[ref.id]) return arqMem[ref.id];
    var chave = location.origin + '/__st_arquivo/' + ref.id;
    var abre = ('caches' in g) ? caches.open('st-arquivos-v1').catch(function () { return null; }) : Promise.resolve(null);
    var p = abre.then(function (cs) {
      return (cs ? cs.match(chave) : Promise.resolve(null)).then(function (hit) {
        if (hit) return hit.blob();
        return chamar('arquivoLer', { id: ref.id }).then(function (r) {
          if (!r || !r.ok) throw new Error((r && r.erro) || 'Não consegui abrir o arquivo.');
          var bin = atob(r.b64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
          var b = new Blob([u], { type: r.mime || ref.mime || 'application/octet-stream' });
          if (cs) cs.put(chave, new Response(b, { headers: { 'Content-Type': b.type } })).catch(function () {});
          return b;
        });
      });
    }).then(function (b) { return URL.createObjectURL(b); });
    p.catch(function () { delete arqMem[ref.id]; });
    return (arqMem[ref.id] = p);
  }
  /* preenche <img data-arq='{"id":..}'> e <a data-arq=...> que estiverem dentro de "raiz" */
  function preencherArquivos(raiz) {
    Array.prototype.forEach.call((raiz || document).querySelectorAll('[data-arq]'), function (el) {
      var ref; try { ref = JSON.parse(el.getAttribute('data-arq')); } catch (e) { return; }
      el.removeAttribute('data-arq');
      if (el.tagName === 'IMG') { arquivoUrl(ref).then(function (u) { el.src = u; }).catch(function () { el.alt = 'imagem indisponível'; }); return; }
      /* link (catálogo em PDF): só baixa quando a pessoa toca */
      if (ref.pub && ref.url) { el.href = ref.url; return; }
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var w = null; try { w = g.open('', '_blank'); } catch (x) {}
        if (w) { try { w.document.write('<p style="font:16px system-ui;padding:20px">Abrindo o arquivo…</p>'); } catch (x) {} }
        arquivoUrl(ref).then(function (u) { if (w) w.location.href = u; else g.location.href = u; })
          .catch(function (err) { if (w) w.close(); alert((err && err.message) || 'Não consegui abrir o arquivo.'); });
      });
    });
  }

  /* faixa fixa avisando que a tela é a visão de outra pessoa (aparece em todas as páginas) */
  function faixaVisao() {
    var v = visao(), f = document.getElementById('stVisaoFaixa');
    if (!v) { if (f) f.remove(); return; }
    if (!f) {
      f = document.createElement('div'); f.id = 'stVisaoFaixa'; f.setAttribute('role', 'status');
      f.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:max(10px,env(safe-area-inset-bottom,0px));z-index:2147482999;max-width:calc(100% - 24px);display:flex;align-items:center;gap:10px;padding:8px 10px 8px 14px;border-radius:999px;background:#FFD200;color:#1d2433;font:700 12.5px "Public Sans",system-ui,sans-serif;box-shadow:0 6px 22px rgba(0,0,0,.35)';
      document.body.appendChild(f);
    }
    f.innerHTML = '<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">👁 Vendo como: ' + String(v.rotulo || v.nome).replace(/</g, '&lt;') + ' · só leitura</span><button type="button" style="flex:none;white-space:nowrap;border:0;border-radius:999px;padding:6px 12px;background:#1d2433;color:#fff;font:700 12px inherit;cursor:pointer">Sair da visão</button>';
    f.querySelector('button').onclick = function () {
      sairVisao();
      try { if (g.top && g.top !== g) { g.top.location.reload(); return; } } catch (e) {}
      g.location.reload();
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', faixaVisao); else faixaVisao();
  g.addEventListener('storage', function (e) { if (e.key === LS_VISAO) faixaVisao(); });

  /* ── registro de uso: no máximo 1 linha por pessoa/tela a cada 30 min; só com o crachá da própria pessoa
     (nunca no "Ver como"). Não pede PIN e não mostra nada: se não houver crachá, simplesmente não registra. ── */
  var TELAS_ARQ = { 'index.html': 'inicio', '': 'inicio', 'painel.html': 'painel', 'ranking.html': 'ranking', 'niveis.html': 'niveis', 'pdi.html': 'pdi',
    'semana.html': 'semana', 'tv.html': 'tv', 'agenda.html': 'agenda', 'proposta.html': 'proposta', 'uso.html': 'uso', 'provas.html': 'provas', 'cadastro.html': 'cadastro', 'pontos.html': 'pontos', 'conteudo.html': 'conteudo' };
  function registrar(tela) {
    try {
      if (visao()) return;
      var c = crachaGuardado(true); if (!c) return;
      tela = String(tela || '').toLowerCase().replace(/[^a-z]/g, ''); if (!tela) return;
      var k = 'st_uso_reg:' + norm(c.nome) + ':' + tela, ult = Number(localStorage.getItem(k) || 0);
      if (Date.now() - ult < 30 * 60000) return;
      localStorage.setItem(k, String(Date.now()));
      var cel = (g.matchMedia && g.matchMedia('(pointer:coarse)').matches) || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || '');
      post({ acao: 'acesso', tk: c.tk, tela: tela, disp: cel ? 'cel' : 'pc' }).catch(function () {});
    } catch (e) {}
  }
  function telaAtual() { var p = location.pathname; if (/\/mentor\//.test(p)) return 'mentor'; var f = p.split('/').pop(); return Object.prototype.hasOwnProperty.call(TELAS_ARQ, f) ? TELAS_ARQ[f] : ''; }
  setTimeout(function () { var t = telaAtual(); if (t) registrar(t); }, 2500);

  g.STDados = { URL: URL_DADOS, URL_APP: URL_APP, chamar: chamar, entrar: entrar, reparar: reparar, diag: diag, cracha: cracha, esquecer: esquecer, perfil: perfil, crachaGuardado: crachaGuardado,
    visao: visao, sessaoVisao: sessaoVisao, semCache: semCache, limparCache: limparCache, entrarVisao: entrarVisao, sairVisao: sairVisao, ehCoordReal: ehCoordReal, faixaVisao: faixaVisao, registrar: registrar,
    atualizarPerfil: atualizarPerfil, ehMkt: ehMkt, arquivoUrl: arquivoUrl, preencherArquivos: preencherArquivos };
})(window);
