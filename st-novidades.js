/* ═══════════════════════════════════════════════════════════════
   Só Tintas App — AVISO DE ATUALIZAÇÃO

   Loja de Araruama, segunda de manhã: o gerente abre o app e o Painel
   de Metas está diferente. Sem isto, ele descobre sozinho (ou não
   descobre). Com isto, o app abre e diz o que mudou, quando mudou e
   em quais painéis — só o que o perfil dele enxerga.

   Como funciona
   1. Toda publicação acrescenta uma versão nova no topo de versao.json.
   2. Ao abrir o app, este arquivo compara a versão de lá com a última
      que a pessoa já viu neste aparelho.
   3. Se houver novidade, mostra o quadro uma vez. Depois fica o sino
      🔔 Novidades no topo, para reler o histórico quando quiser.
   4. Ao fechar com "Entendi", registra a leitura no Servidor de Dados
      (ação novidadeLida) — é o que alimenta a aba NOVIDADES_LIDAS.
      Enquanto o servidor não tiver essa ação, a leitura só fica no
      aparelho e nada quebra.

   Não mostra nada no "Ver como" (a novidade é de quem está logado) nem
   antes do login.
   ═══════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';

  var ARQ = 'versao.json', LS_VISTO = 'st_novidades_v1:', LS_SESSAO = 'sotintas_sessao_v1', MAX = 6;

  function ler(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function sessao() { return ler(LS_SESSAO); }
  function emVisao() { try { return !!(g.STDados && STDados.visao && STDados.visao()); } catch (e) { return false; } }

  /* ── quem está na tela: nome + perfil (coord, anl, sup, ger, vend) ── */
  function quem() {
    var s = sessao(); if (!s || !s.nome) return null;
    var c = null; try { c = g.STDados && STDados.crachaGuardado ? STDados.crachaGuardado(true) : null; } catch (e) {}
    var p = c && c.perfil ? c.perfil : '';
    if (!p) {
      var papel = String(s.papel || '');
      if (s.escopo === 'todos' || /coorden/i.test(papel)) p = 'coord';
      else if (/analist/i.test(papel)) p = 'anl';
      else if (/supervis/i.test(papel)) p = 'sup';
      else if (/gerent/i.test(papel)) p = 'ger';
      else p = 'vend';
    }
    return { nome: s.nome, perfil: p };
  }

  function chave(nome) { return LS_VISTO + norm(nome); }
  function visto(nome) { try { return String(localStorage.getItem(chave(nome)) || ''); } catch (e) { return ''; } }
  function marcar(nome, v) { try { localStorage.setItem(chave(nome), String(v || '')); } catch (e) {} }

  /* ── só os itens que o perfil enxerga ── */
  function paraPerfil(dados, perfil) {
    return (dados && dados.versoes ? dados.versoes : []).map(function (v) {
      var itens = (v.itens || []).filter(function (i) { return !i.para || !i.para.length || i.para.indexOf(perfil) >= 0; });
      return { v: v.v, data: v.data, hora: v.hora, itens: itens };
    }).filter(function (v) { return v.itens.length; });
  }

  /* versões publicadas depois da última que a pessoa viu (quem nunca viu recebe só a mais nova) */
  function novas(lista, ultimo) {
    if (!lista.length) return [];
    if (!ultimo) return lista.slice(0, 1);
    var out = [];
    for (var i = 0; i < lista.length; i++) { if (lista[i].v === ultimo) return out; out.push(lista[i]); }
    return out.slice(0, 3);
  }

  /* ── registro da leitura (mesma porta dos outros dados; silencioso) ── */
  function registrar(v) {
    try {
      if (emVisao()) return;
      var c = g.STDados && STDados.crachaGuardado ? STDados.crachaGuardado(true) : null;
      if (!c || !c.tk || !g.STDados || !STDados.URL) return;
      fetch(STDados.URL, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ acao: 'novidadeLida', tk: c.tk, versao: String(v || '') })
      }).catch(function () {});
    } catch (e) {}
  }

  /* ── o quadro ── */
  function cores() {
    var escuro = document.documentElement.getAttribute('data-theme') === 'dark';
    return escuro
      ? { bg: '#1a2336', ink: '#eef2fb', mut: '#9aa5bb', lin: '#2c3850', chip: '#222d44' }
      : { bg: '#ffffff', ink: '#16233d', mut: '#5a677f', lin: '#e4e9f3', chip: '#f2f5fc' };
  }

  function blocoVersao(v, c) {
    var itens = v.itens.map(function (i) {
      return '<li style="margin:0 0 10px;padding:0 0 0 2px;list-style:none">' +
        '<b style="display:block;font-size:13.5px;color:' + c.ink + '">' + esc(i.painel) + '</b>' +
        '<span style="font-size:13px;line-height:1.45;color:' + c.mut + '">' + esc(i.o_que) + '</span></li>';
    }).join('');
    return '<div style="margin:0 0 14px">' +
      '<div style="display:inline-block;margin:0 0 8px;padding:4px 10px;border-radius:999px;background:' + c.chip + ';color:' + c.mut + ';font-size:11.5px;font-weight:700">' +
      esc(v.data) + ' · ' + esc(v.hora) + '</div>' +
      '<ul style="margin:0;padding:0">' + itens + '</ul></div>';
  }

  function abrir(lista, nomeUsuario, marcarAoFechar) {
    if (!lista.length || document.getElementById('stNovOv')) return;
    var c = cores(), ov = document.createElement('div');
    ov.id = 'stNovOv';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'stNovTit');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483001;background:rgba(6,10,20,.66);display:flex;align-items:center;justify-content:center;padding:16px;font-family:"Public Sans",system-ui,sans-serif';
    ov.innerHTML =
      '<div style="width:100%;max-width:420px;max-height:84vh;overflow:auto;background:' + c.bg + ';color:' + c.ink + ';border:1px solid ' + c.lin + ';border-radius:16px;padding:18px">' +
        '<div style="display:flex;align-items:flex-start;gap:10px;margin:0 0 4px">' +
          '<span style="font-size:22px;line-height:1">🔔</span>' +
          '<div style="flex:1;min-width:0">' +
            '<b id="stNovTit" style="display:block;font-size:17px">' + (marcarAoFechar ? 'O app foi atualizado' : 'Novidades do app') + '</b>' +
            '<span style="font-size:12.5px;color:' + c.mut + '">O que mudou e em quais painéis</span>' +
          '</div>' +
        '</div>' +
        '<div style="height:1px;background:' + c.lin + ';margin:12px 0 14px"></div>' +
        lista.slice(0, MAX).map(function (v) { return blocoVersao(v, c); }).join('') +
        '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:4px">' +
          '<button type="button" id="stNovOk" style="padding:10px 18px;border-radius:10px;border:0;background:#1C3F8F;color:#fff;font-weight:700;font-size:14px;cursor:pointer">Entendi</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    function fechar() {
      ov.remove();
      if (marcarAoFechar) { marcar(nomeUsuario, lista[0].v); registrar(lista[0].v); badge(0); }
    }
    ov.querySelector('#stNovOk').onclick = fechar;
    ov.addEventListener('click', function (e) { if (e.target === ov) fechar(); });
    document.addEventListener('keydown', function esc2(e) { if (e.key === 'Escape') { fechar(); document.removeEventListener('keydown', esc2); } });
    setTimeout(function () { var b = ov.querySelector('#stNovOk'); if (b) b.focus(); }, 60);
  }

  /* ── o sino no topo (ao lado do tema); se a barra não existir, fica flutuando ── */
  function sino(aoTocar) {
    var b = document.getElementById('btnNovidades');
    if (b) return b;
    b = document.createElement('button');
    b.type = 'button'; b.id = 'btnNovidades';
    b.setAttribute('aria-label', 'Novidades do app');
    b.innerHTML = '🔔 <span>Novidades</span><span id="stNovBadge" hidden style="margin-left:6px;display:inline-block;min-width:18px;padding:0 5px;border-radius:999px;background:#D32027;color:#fff;font-size:11px;font-weight:800;line-height:18px;text-align:center"></span>';
    var barra = document.querySelector('.ini-acoes');
    if (barra) { b.className = 'ini-theme'; barra.insertBefore(b, barra.firstChild); }
    else {
      b.style.cssText = 'position:fixed;right:12px;top:max(10px,env(safe-area-inset-top,0px));z-index:2147482997;border:0;border-radius:999px;padding:7px 13px;background:#1C3F8F;color:#fff;font:700 12.5px "Public Sans",system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 22px rgba(0,0,0,.28)';
      document.body.appendChild(b);
    }
    b.onclick = aoTocar;
    return b;
  }

  function badge(n) {
    var e = document.getElementById('stNovBadge'); if (!e) return;
    if (n > 0) { e.textContent = String(n); e.hidden = false; } else { e.hidden = true; }
  }

  /* ── rotina ── */
  function iniciar() {
    var u = quem(); if (!u || emVisao()) return;
    fetch(ARQ + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var lista = paraPerfil(d, u.perfil); if (!lista.length) return;
        var pendentes = novas(lista, visto(u.nome));
        sino(function () { abrir(pendentes.length ? pendentes : lista, u.nome, pendentes.length > 0); });
        badge(pendentes.length);
        if (pendentes.length) setTimeout(function () { abrir(pendentes, u.nome, true); }, 600);
      })
      .catch(function () {});
  }

  function largar() { setTimeout(iniciar, 1200); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', largar); else largar();

  g.STNovidades = { abrir: iniciar, zerar: function () { var u = quem(); if (u) marcar(u.nome, ''); } };
})(window);
