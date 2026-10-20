/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO × Só Tintas App — PROGRESSO NA PLANILHA (Fase 2)
   Roda DEPOIS de db.js e ponte.js e ANTES de app.js / gestor.js.

   • Antes de o Mentor abrir, busca no Servidor de Dados ST:
       – o progresso desta pessoa (trilha, XP, conquistas, provas, DISC),
       – o da equipe do escopo dela (gerente: a loja; supervisor: a carteira;
         coordenação: a rede) — é o que aparece no painel da equipe,
       – a base de Níveis (recortada pelo servidor) para "Minha evolução".
   • Junta com o que está no aparelho (nada se perde se a pessoa estudou
     sem internet) e, a cada mudança, manda de volta o progresso DELA.
   Só o próprio registro sobe; o servidor grava pelo crachá, não pelo nome.
   ═══════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var P = g.ST_PONTE || {};
  if (!P.ok || !g.STDados || !g.DB) return;

  var CH = 'mentorst_demo_v1', LS_SYNC = 'mentorst_sync_v1';
  var SL = ['progresso', 'xp', 'conquistas', 'tentativas', 'atividade', 'disc'];
  var login = P.login;
  var pronto = false, enviando = false, ultimoEnviado = null;

  function ler() { try { return JSON.parse(localStorage.getItem(CH)) || null; } catch (e) { return null; } }
  function gravar(d) { try { localStorage.setItem(CH, JSON.stringify(d)); } catch (e) {} }
  function lerSync() { try { var s = JSON.parse(localStorage.getItem(LS_SYNC) || 'null'); return s && s.login === login ? s : null; } catch (e) { return null; } }
  function gravarSync(assin) { try { localStorage.setItem(LS_SYNC, JSON.stringify({ login: login, assin: assin, em: new Date().toISOString() })); } catch (e) {} }
  function vazio(k) { return k === 'disc' ? null : k === 'atividade' ? {} : []; }

  /* o registro DESTA pessoa, no formato que vai para a planilha */
  function meu(d) {
    var u = d && d.usuarios && d.usuarios[login]; if (!u) return null;
    var r = { usuario: { login: login, nome: u.nome, cargo: u.cargo, perfil: u.perfil, loja_id: u.loja_id } };
    SL.forEach(function (k) { r[k] = (d[k] && d[k][u.id] !== undefined) ? d[k][u.id] : vazio(k); });
    r.chat = (d.chat || []).filter(function (c) { return c.colaborador_id === u.id; }).slice(-100);
    return r;
  }
  function assin(r) { if (!r) return ''; var o = {}; SL.forEach(function (k) { o[k] = r[k] === undefined ? vazio(k) : r[k]; }); o.chat = r.chat || []; return JSON.stringify(o); }

  /* junta aparelho + servidor sem perder nada */
  function quando(x) { return String((x && (x.concluido_em || x.realizado_em || x.obtida_em || x.criado_em)) || ''); }
  function chaveItem(k, x) {
    if (!x || typeof x !== 'object') return JSON.stringify(x);
    if (x.id) return 'id:' + x.id;
    if (k === 'conquistas') return 'c:' + x.conquista_id;
    if (k === 'progresso') return 'p:' + x.item_tipo + ':' + x.item_id;
    return JSON.stringify(x);
  }
  function unir(k, a, b) {                       // a = aparelho, b = servidor
    if (k === 'disc') { if (!a) return b || null; if (!b) return a; return quando(b) > quando(a) ? b : a; }
    if (k === 'atividade') { var o = {}; [b || {}, a || {}].forEach(function (s) { for (var x in s) o[x] = s[x]; }); return o; }
    var m = {}, ordem = [];
    (b || []).concat(a || []).forEach(function (x) {
      var c = chaveItem(k, x);
      if (!(c in m)) { ordem.push(c); m[c] = x; return; }
      var y = m[c]; if ((Number(x.nota) || 0) > (Number(y.nota) || 0) || quando(x) > quando(y)) m[c] = x;
    });
    return ordem.map(function (c) { return m[c]; });
  }

  function aplicarMeu(d, srv) {
    var u = d.usuarios[login]; if (!u || !srv) return;
    var loc = meu(d), s = lerSync(), mexeuAqui = !s || s.assin !== assin(loc);
    SL.forEach(function (k) { d[k][u.id] = mexeuAqui ? unir(k, loc[k], srv[k]) : (srv[k] !== undefined ? srv[k] : vazio(k)); });
    var chat = mexeuAqui ? unir('chat', loc.chat, srv.chat || []) : (srv.chat || []);
    d.chat = (d.chat || []).filter(function (c) { return c.colaborador_id !== u.id; }).concat(chat);
  }
  function aplicarEquipe(d, lista) {
    (lista || []).forEach(function (r) {
      var u = r.usuario || {}; if (!u.login || u.login === login) return;
      var ex = d.usuarios[u.login] || {};
      d.usuarios[u.login] = {
        id: u.login, login: u.login, nome: u.nome || ex.nome || u.login, cargo: u.cargo || ex.cargo || 'Colaborador',
        perfil: u.perfil || ex.perfil || 'colaborador', loja_id: u.loja_id != null ? Number(u.loja_id) : (ex.loja_id != null ? ex.loja_id : null),
        regiao_id: ex.regiao_id != null ? ex.regiao_id : null, senha: null, origem: 'servidor',
        criado_em: ex.criado_em || r.atualizado_em || new Date().toISOString(), ultimo_acesso: r.atualizado_em || ex.ultimo_acesso || null,
      };
      SL.forEach(function (k) { d[k][u.login] = r[k] !== undefined ? r[k] : vazio(k); });
      d.chat = (d.chat || []).filter(function (c) { return c.colaborador_id !== u.login; }).concat(r.chat || []);
    });
    if (d.chat && d.chat.length > 600) d.chat = d.chat.slice(-600);
  }

  /* base de Níveis do servidor → "Minha evolução" e painel de níveis do Mentor */
  function isoDe(br) { var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(br || '')); return m ? m[3] + '-' + m[2] + '-' + m[1] : (br || null); }
  function aplicarNiveis(d, j) {
    if (!j || !j.ok || !j.data) return;
    var o = d.conteudo_override = d.conteudo_override || {}, antigos = o.niveis_vendedores || [];
    var nn = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim(); };
    o.niveis_lojas = (j.data.LOJAS || []).map(function (l) { return { loja_id: Number(l.id), med90: Number(l.med) || 0 }; });
    o.niveis_vendedores = (j.data.VENDS || []).map(function (v, i) {
      var a = antigos.filter(function (x) { return x.colaborador_id && Number(x.loja_id) === Number(v.id) && nn(x.nome) === nn(v.nome); })[0];
      return { id: 'v' + (i + 1), loja_id: Number(v.id), nome: String(v.nome || '').trim(), med90: Number(v.med) || 0, admissao: isoDe(v.adm), colaborador_id: a ? a.colaborador_id : null };
    });
    o.niveis_base = { mes: '', rotulo: 'base do servidor', atualizado_em: String(j.atualizado || '').slice(0, 10) };
  }

  function puxar() {
    return Promise.all([
      g.STDados.chamar('mentorLer'),
      g.STDados.chamar('niveis').catch(function () { return null; }),
    ]).then(function (rs) {
      var j = rs[0]; if (!j || !j.ok) throw new Error((j && j.erro) || 'sem resposta');
      var d = ler(); if (!d) return false;
      var antes = JSON.stringify(d);
      if (j.eu) aplicarMeu(d, j.eu);
      aplicarEquipe(d, j.equipe);
      aplicarNiveis(d, rs[1]);
      gravar(d);
      ultimoEnviado = j.eu ? assin(j.eu) : '';
      gravarSync(assin(meu(d)) === ultimoEnviado ? ultimoEnviado : (lerSync() || {}).assin || '');
      pronto = true;
      return JSON.stringify(d) !== antes;
    });
  }

  function enviar() {
    if (!pronto || enviando) return;
    var d = ler(), r = meu(d); if (!r) return;
    var a = assin(r); if (a === ultimoEnviado) return;
    enviando = true;
    g.STDados.chamar('mentorSalvar', { registro: r }).then(function (j) {
      if (j && j.ok) { ultimoEnviado = a; gravarSync(a); }
    }).catch(function () {}).then(function () { enviando = false; });
  }

  /* abre o Mentor só depois de puxar (até 8 s); sem crachá, abre e pede o PIN */
  var temCracha = !!g.STDados.crachaGuardado();
  var primeira = puxar();
  var initOrig = g.DB.init;
  g.DB.init = function () {
    var args = arguments, self = this;
    var espera = temCracha ? Promise.race([primeira.catch(function () {}), new Promise(function (ok) { setTimeout(ok, 8000); })]) : Promise.resolve();
    return espera.then(function () { return initOrig.apply(self, args); });
  };
  primeira.then(function (mudou) {
    /* chegou depois que o Mentor já abriu (PIN confirmado agora): recarrega uma vez para mostrar */
    if (mudou && !temCracha) { try { if (!sessionStorage.getItem('mentor_recarregou')) { sessionStorage.setItem('mentor_recarregou', '1'); location.reload(); } } catch (e) {} }
  }).catch(function () {
    var tenta = setInterval(function () { puxar().then(function () { clearInterval(tenta); }).catch(function () {}); }, 60000);
  });

  setInterval(enviar, 4000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') enviar(); });
  g.ST_SYNC = { puxar: puxar, enviar: enviar, estado: function () { return { pronto: pronto, ultimoEnviado: ultimoEnviado }; } };
})(window);
