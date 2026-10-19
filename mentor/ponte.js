/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO × Só Tintas Apps — PONTE DE LOGIN (Fase 1)
   Roda DEPOIS de db.js e ANTES de app.js.

   O Mentor nasceu com login próprio (login + senha). Dentro do Só Tintas
   Apps a pessoa já entrou com nome + PIN no Assistente ST, e a sessão dela
   mora no localStorage 'sotintas_sessao_v1' (mesmo endereço do site).
   Esta ponte lê essa sessão e cria/atualiza o usuário do Mentor com o
   perfil certo, para ninguém fazer dois logins:

     Coordenação (escopo "todos")  → coordenador (vê a rede)
     Supervisor                    → supervisor  (vê as lojas da carteira dele, aba EQUIPE)
     Gerente (escopo "lojas")      → gerente     (vê a loja dele)
     Vendedor e demais             → colaborador (vê só o próprio painel)

   Fase 1: o progresso fica guardado NESTE aparelho (modo local do db.js),
   um registro por pessoa. Na Fase 2 ele passa para a planilha.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  var CHAVE_APP = 'sotintas_sessao_v1';
  var CHAVE_DEMO = 'mentorst_demo_v1';
  var C = global.CONTEUDO || {};

  function ler(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function semAcento(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function norm(s) { return semAcento(s).toLowerCase().replace(/\s+/g, ' ').trim(); }
  function codigo(l) { var m = /^\s*(\d{1,3})/.exec(String(l || '')); return m ? Number(m[1]) : null; }
  function loginDe(nome) { return 'st.' + norm(nome).replace(/[^a-z0-9 ]+/g, '').replace(/ /g, '.'); }
  function uuid() { return (global.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36); }

  var s = ler(CHAVE_APP);
  global.ST_PONTE = { sessao: s, ok: false };
  if (!s || !s.nome) return;                       /* sem sessão: ponte-fim.js mostra o aviso */

  var papel = norm(s.papel), escopo = String(s.escopo || '').trim();
  var perfil = 'colaborador', loja_id = null, regiao_id = null;

  if (escopo === 'todos' || papel.indexOf('coorden') >= 0) {
    perfil = 'coordenador';
  } else if (papel.indexOf('supervis') >= 0) {
    perfil = 'supervisor';
    var carteira = (s.carteira || []).map(codigo).filter(function (x) { return x != null; });
    if (carteira.length) {
      /* a carteira vem da aba EQUIPE no login: ela manda, não o mapa fixo do Mentor */
      regiao_id = 900;
      (C.regioes = C.regioes || []).push({ id: 900, nome: 'Região · ' + s.nome, ativa: true });
      (C.lojas || []).forEach(function (l) { if (carteira.indexOf(Number(l.id)) >= 0) l.regiao_id = 900; });
    } else {
      /* sessão antiga, sem carteira: acha a região pelo primeiro nome ("Região 2 · Danilo") */
      var pn = norm(s.nome).split(' ')[0];
      (C.regioes || []).forEach(function (r) { if (norm(r.nome).indexOf(pn) >= 0) regiao_id = r.id; });
    }
  } else if (escopo === 'lojas' || papel.indexOf('gerente') >= 0) {
    perfil = 'gerente';
    loja_id = codigo((s.gerencia || [])[0]) || codigo(s.lotacao);
  } else {
    perfil = 'colaborador';
    loja_id = codigo(s.lotacao);
  }
  if (loja_id == null && perfil !== 'coordenador') loja_id = codigo(s.lotacao);

  var d = ler(CHAVE_DEMO) || {};
  ['usuarios', 'progresso', 'xp', 'conquistas', 'tentativas', 'atividade', 'disc'].forEach(function (k) { if (!d[k] || typeof d[k] !== 'object') d[k] = {}; });
  if (!Array.isArray(d.chat)) d.chat = [];
  if (d.conteudo_override === undefined) d.conteudo_override = null;
  d.versao = d.versao || 1;

  var login = loginDe(s.nome);
  var u = d.usuarios[login] || { id: uuid(), login: login, criado_em: new Date().toISOString() };
  u.nome = String(s.nome);
  u.cargo = String(s.papel || 'Colaborador');
  u.perfil = perfil;
  u.loja_id = loja_id;
  u.regiao_id = regiao_id;
  u.senha = null;                                   /* quem autentica é o Assistente ST */
  u.origem = 'assistente-st';
  u.ultimo_acesso = new Date().toISOString();
  d.usuarios[login] = u;
  d.sessao = login;
  try { localStorage.setItem(CHAVE_DEMO, JSON.stringify(d)); } catch (e) {}
  global.ST_PONTE = { sessao: s, ok: true, login: login, perfil: perfil, loja_id: loja_id, regiao_id: regiao_id };
})(window);
