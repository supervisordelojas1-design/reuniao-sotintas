/* ═══════════════════════════════════════════════════════════════
   SERVIDOR DE DADOS ST — PDI, Níveis, Ranking e Mentor
   (substitui o "Servidor PDI"; fica na mesma planilha PDI_SOTINTAS)

   Ninguém recebe dado sem CRACHÁ. O crachá nasce no login:
   o app manda nome + PIN para cá, este servidor confere com o
   servidor principal do Assistente ST e devolve um crachá assinado
   (vale 7 dias) com o perfil e as lojas da pessoa. Cada pedido de
   dados vem com o crachá, e o recorte é feito AQUI, não na tela:
     Coordenação → a rede
     Supervisor  → as lojas da carteira dele
     Gerente     → a(s) loja(s) dele
     Vendedor    → a própria linha (e a da loja, no Ranking/Níveis)

   COMO ATUALIZAR (uma vez só):
   1. Abra a planilha PDI_SOTINTAS → Extensões → Apps Script.
   2. Apague todo o código antigo e cole ESTE arquivo inteiro. Salve.
   3. Implantar → Gerenciar implantações → ✏️ (lápis) →
      Versão: "Nova versão" → Implantar. A URL NÃO muda.
      (Se pedir autorização nova, autorize: agora ele também conversa
       com o servidor principal do app e com os servidores antigos.)
   4. Depois que o app novo estiver no ar e o Níveis e o Ranking
      abrirem com dados (eles copiam a base sozinhos na 1ª vez),
      ARQUIVE as implantações antigas do Níveis e do Ranking:
      em cada um, Implantar → Gerenciar implantações → Arquivar.

   Abas usadas (criadas sozinhas): BASE e ACOMP (PDI, já existentes),
   NIVEIS, RANKING e MENTOR. A chave secreta do crachá fica nas
   Propriedades do script (gerada sozinha; não aparece na planilha).
   ═══════════════════════════════════════════════════════════════ */

var ENVIO_URL     = 'https://script.google.com/macros/s/AKfycbxC916U8rNw_-HFTW7vtFZz4AC_B1bHcTLE3bvMDWji6E5lAqkXgC0EIgQFtjHYTp8I/exec';
var ANTIGO_NIVEIS = 'https://script.google.com/macros/s/AKfycbwZn2xz79cj_UrE2D-valt06bQmogydR--Nvc7Oyt7r4fssYjjfz91s6Pgp2JoZZgt3/exec';
var ANTIGO_RANK   = 'https://script.google.com/macros/s/AKfycbwfWmam-Y_532W__wfx7v0NanXWp6_bKrMv45_9Sw91EB8j8N7_CofdxGp_r-gwslM-bQ/exec';
var VALIDADE_DIAS = 7;
var PEDACO = 45000;              // célula do Sheets aceita até 50 mil caracteres
var MAX_MENTOR = 400000;         // tamanho máximo do registro de uma pessoa no Mentor

/* ───────────────────────── utilidades ───────────────────────── */
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function erroCracha_(m) { var e = new Error(m); e.cracha = true; return e; }
function semAc_(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function pad3_(c) { var m = String(c == null ? '' : c).match(/\d+/); return m ? ('00' + Number(m[0])).slice(-3) : ''; }
function cods_(arr) { var o = []; (arr || []).forEach(function (l) { var c = pad3_(l); if (c && o.indexOf(c) < 0) o.push(c); }); return o; }
function aba_(nome, cab) {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(nome);
  if (!sh) { sh = ss.insertSheet(nome); sh.appendRow(cab); sh.setFrozenRows(1); }
  return sh;
}
/* nomes: "GABRIEL WILLIAN N2" e "Gabriel Willian" são a mesma pessoa */
function chaveNome_(n) { return semAc_(n).toUpperCase().replace(/\s*-?\s*N\s*\d+\s*$/, '').replace(/\s+\d+\s*$/, '').replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function mesmo_(a, b) {
  a = chaveNome_(a); b = chaveNome_(b); if (!a || !b) return false; if (a === b) return true;
  var x = a.split(' '), y = b.split(' ');
  if (x.length > 1 && y.length > 1 && x[0] === y[0] && x[x.length - 1] === y[y.length - 1]) return true;
  var curto = x.length <= y.length ? x : y, longo = x.length <= y.length ? y : x;   // "Kesia Regina" × "Kesia Regina da Silva"
  return curto.length > 1 && curto.every(function (p, i) { return longo[i] === p; });
}
function loginDe_(nome) { return 'st.' + semAc_(nome).toLowerCase().replace(/\s+/g, ' ').trim().replace(/[^a-z0-9 ]+/g, '').replace(/ /g, '.'); }

/* ───────────────────────── crachá ───────────────────────── */
function segredo_() {
  var p = PropertiesService.getScriptProperties(), s = p.getProperty('SEGREDO_CRACHA');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('SEGREDO_CRACHA', s); }
  return s;
}
function assinatura_(txt) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(txt, segredo_())).replace(/=+$/, ''); }
function assinar_(obj) {
  var corpo = Utilities.base64EncodeWebSafe(JSON.stringify(obj), Utilities.Charset.UTF_8).replace(/=+$/, '');
  return corpo + '.' + assinatura_(corpo);
}
function cracha_(tk) {
  if (!tk) throw erroCracha_('Confirme seu PIN para ver os dados.');
  var p = String(tk).split('.');
  if (p.length !== 2 || assinatura_(p[0]) !== p[1]) throw erroCracha_('Crachá inválido. Confirme seu PIN.');
  var corpo = p[0]; while (corpo.length % 4) corpo += '=';
  var o = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(corpo)).getDataAsString('UTF-8'));
  if (!o || !o.ex || o.ex < Date.now()) throw erroCracha_('Seu crachá venceu. Confirme seu PIN.');
  return o;   // { n: nome, pf: 'coord'|'sup'|'ger'|'vend'|'outro', lj: ['034', ...], ex }
}
function podeLoja_(c, cod) { return c.pf === 'coord' || c.lj.indexOf(pad3_(cod)) >= 0; }
function lider_(c) { return c.pf === 'coord' || c.pf === 'sup' || c.pf === 'ger'; }
function soCoord_(c) { if (c.pf !== 'coord' || c.vc) throw new Error('Só a coordenação pode publicar.'); }

/* ───────── "Ver como": a coordenação enxerga o app como outro perfil (só leitura, 2 horas) ───────── */
function verComo_(c, d) {
  if (c.pf !== 'coord' || c.vc) throw new Error('Só a coordenação usa o "Ver como".');
  var pf = String(d.pf || ''); if (['sup', 'ger', 'vend'].indexOf(pf) < 0) throw new Error('Perfil inválido.');
  var n = String(d.n || '').trim(), lj = cods_(d.lj || []);
  if (pf === 'sup' && !lj.length) lj = carteiraEquipe_(n);
  if (!lj.length) throw new Error('Escolha a loja (ou a carteira) da visão.');
  if (pf === 'vend' && !n) throw new Error('Escolha o vendedor.');
  var ex = Date.now() + 2 * 3600e3;
  return { ok: true, tk: assinar_({ n: n || ('Gerente ' + lj[0]), pf: pf, lj: lj, ex: ex, vc: true, por: c.n }), nome: n || ('Gerente ' + lj[0]), perfil: pf, lojas: lj, ex: ex };
}

/* ───────────────────────── login ───────────────────────── */
function chamarApp_(corpo) {
  var r = UrlFetchApp.fetch(ENVIO_URL, { method: 'post', contentType: 'text/plain;charset=utf-8', payload: JSON.stringify(corpo), muteHttpExceptions: true, followRedirects: true });
  try { return JSON.parse(r.getContentText()); } catch (e) { throw new Error('O servidor do app não respondeu. Tente de novo.'); }
}
function carteiraEquipe_(nome) {
  try {
    var r = UrlFetchApp.fetch(ENVIO_URL + '?acao=equipe', { muteHttpExceptions: true, followRedirects: true });
    var j = JSON.parse(r.getContentText()), eq = (j && j.equipe) || {}, out = [];
    Object.keys(eq).forEach(function (k) { if (mesmo_(k, nome) || chaveNome_(k).split(' ')[0] === chaveNome_(nome).split(' ')[0]) out = cods_(eq[k].lojas); });
    return out;
  } catch (e) { return []; }
}
function perfil_(res, nome) {
  var papel = semAc_(res.papel).toLowerCase(), esc = String(res.escopo || '');
  if (esc === 'todos' || papel.indexOf('coorden') >= 0) return { pf: 'coord', lj: [] };
  if (esc === 'lojas' || papel.indexOf('gerente') >= 0) return { pf: 'ger', lj: cods_(res.gerencia && res.gerencia.length ? res.gerencia : [res.lotacao]) };
  if (res.vendedor || papel.indexOf('vendedor') >= 0) return { pf: 'vend', lj: cods_([res.lotacao]) };
  if (papel.indexOf('supervis') >= 0) { var c = cods_(res.carteira || []); if (!c.length) c = carteiraEquipe_(nome); return { pf: 'sup', lj: c }; }
  return { pf: 'outro', lj: [] };
}
function entrar_(d) {
  var nome = String(d.nome || '').trim(), pin = String(d.pin || '').trim();
  if (!nome || !pin) throw new Error('Informe nome e PIN.');
  var res = chamarApp_({ tipo: 'login', nome: nome, pin: pin });
  if (!res || !res.ok) throw new Error((res && res.erro) || 'Nome ou PIN não conferem.');
  var quem = String(res.nome || nome), p = perfil_(res, quem), ex = Date.now() + VALIDADE_DIAS * 864e5;
  return { ok: true, tk: assinar_({ n: quem, pf: p.pf, lj: p.lj, ex: ex }), nome: quem, perfil: p.pf, lojas: p.lj, ex: ex };
}

/* ───────────────── armazenamento em pedaços (BASE, NIVEIS, RANKING) ───────────────── */
function lerBlob_(nome) {
  var sh = aba_(nome, ['parte', 'conteudo', 'publicado_em', 'por']), n = sh.getLastRow();
  if (n < 2) return { obj: null, em: null, por: '' };
  var v = sh.getRange(2, 1, n - 1, 4).getValues().filter(function (r) { return r[1] !== '' && r[1] != null; }).sort(function (a, b) { return a[0] - b[0]; });
  if (!v.length) return { obj: null, em: null, por: '' };
  var txt = v.map(function (r) { return String(r[1]); }).join(''), obj = null;
  /* os pedaços são gravados com apóstrofo na frente (força texto); se a planilha devolver o apóstrofo, tira */
  try { obj = txt ? JSON.parse(txt) : null; } catch (e) { obj = JSON.parse(v.map(function (r) { return String(r[1]).replace(/^'/, ''); }).join('')); }
  return { obj: obj, em: v[0][2] ? new Date(v[0][2]).toISOString() : null, por: v[0][3] || '' };
}
function gravarBlob_(nome, obj, por) {
  var sh = aba_(nome, ['parte', 'conteudo', 'publicado_em', 'por']);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 4).clearContent();
  var txt = JSON.stringify(obj), agora = new Date(), linhas = [];
  for (var i = 0, k = 1; i < txt.length; i += PEDACO, k++) linhas.push([k, "'" + txt.substr(i, PEDACO), agora, por || '']);
  sh.getRange(2, 1, linhas.length, 4).setValues(linhas);
  return { partes: linhas.length, em: agora.toISOString() };
}
/* 1ª vez: copia a base que está no servidor antigo (Níveis / Ranking) */
function blobOuMigra_(nome, urlAntiga) {
  var b = lerBlob_(nome); if (b.obj || !urlAntiga) return b;
  var props = PropertiesService.getScriptProperties(), chave = 'MIGRA_' + nome, ult = Number(props.getProperty(chave) || 0);
  if (Date.now() - ult < 30 * 60000) return b;              // tenta no máximo a cada 30 minutos
  props.setProperty(chave, String(Date.now()));
  try {
    var r = UrlFetchApp.fetch(urlAntiga, { muteHttpExceptions: true, followRedirects: true });
    var j = JSON.parse(r.getContentText());
    if (j && j.ok && j.data) { gravarBlob_(nome, j.data, 'cópia do servidor antigo'); return lerBlob_(nome); }
  } catch (e) {}
  return b;
}

/* ───────────────────────── Níveis ───────────────────────── */
function niveis_(c) {
  var b = blobOuMigra_('NIVEIS', ANTIGO_NIVEIS), D = b.obj;
  if (!D) return { ok: true, data: null, atualizado: null };
  var L = D.LOJAS || [], V = D.VENDS || [];
  if (c.pf === 'outro') { L = []; V = []; }
  else if (c.pf === 'vend') {
    var eu = V.filter(function (v) { return podeLoja_(c, v.id) && mesmo_(v.nome, c.n); });
    if (!eu.length) eu = V.filter(function (v) { return mesmo_(v.nome, c.n); }).slice(0, 1);   // mudou de loja
    var lj = eu.length ? pad3_(eu[0].id) : c.lj[0];
    V = eu; L = L.filter(function (l) { return pad3_(l.id) === lj; });
  } else if (c.pf !== 'coord') {
    L = L.filter(function (l) { return podeLoja_(c, l.id); }); V = V.filter(function (v) { return podeLoja_(c, v.id); });
  }
  return { ok: true, data: { LOJAS: L, VENDS: V }, atualizado: b.em, recorte: c.pf !== 'coord' };
}

/* ───────────────────────── Ranking ───────────────────────── */
function rankingEscopo_(c, D) {
  var L = D.lojas || [], V = D.vend || [];
  if (c.pf === 'coord') return { lojas: L, vend: V };
  if (c.pf === 'outro') return { lojas: [], vend: [] };
  if (c.pf === 'vend') {
    var eu = V.filter(function (v) { return podeLoja_(c, v.l) && mesmo_(v.n, c.n); });
    if (!eu.length) eu = V.filter(function (v) { return mesmo_(v.n, c.n); }).slice(0, 1);
    var lj = eu.length ? pad3_(eu[0].l) : c.lj[0];
    return { lojas: L.filter(function (l) { return pad3_(l.id) === lj; }), vend: eu };
  }
  return { lojas: L.filter(function (l) { return podeLoja_(c, l.id); }), vend: V.filter(function (v) { return podeLoja_(c, v.l); }) };
}
function ranking_(c) {
  var b = blobOuMigra_('RANKING', ANTIGO_RANK);
  if (!b.obj) return { ok: true, data: null, atualizado: null };
  return { ok: true, data: rankingEscopo_(c, b.obj), atualizado: b.em, recorte: c.pf !== 'coord' };
}
/* posição na REDE para os meses escolhidos (mesma regra do painel) */
function pts_(p) { return p >= 1.30 ? 3 : p >= 1.00 ? 2 : p >= 0.95 ? 1 : 0; }
function classificar_(lista, ms, full) {
  var out = lista.map(function (e) {
    var P = 0, s = 0, n = 0;
    ms.forEach(function (m) { var d = e.m && e.m[m]; if (!d || !d[0]) return; var p = d[1] / d[0]; P += pts_(p); s += p; n++; });
    return { e: e, P: P, avg: n ? s / n : 0, n: n };
  }).filter(function (r) { return r.n > 0; });
  if (full) out = out.filter(function (r) { return r.n === ms.length; });
  out.sort(function (a, b) { return b.P - a.P || b.avg - a.avg; });
  return out;
}
function posicao_(c, d) {
  var b = lerBlob_('RANKING'); if (!b.obj) return { ok: true, lojas: {}, vend: {} };
  var ms = (d.meses || []).map(Number).filter(function (m) { return m >= 1 && m <= 12; });
  var vis = rankingEscopo_(c, b.obj), out = { ok: true, lojas: {}, vend: {} };
  [['lojas', function (e) { return pad3_(e.id); }], ['vend', function (e) { return e.id + '|' + pad3_(e.l); }]].forEach(function (par) {
    var k = par[0], chave = par[1], cl = classificar_(b.obj[k] || [], ms, !!d.full), quer = {};
    vis[k].forEach(function (e) { quer[chave(e)] = 1; });
    cl.forEach(function (r, i) { var ch = chave(r.e); if (quer[ch]) out[k][ch] = [i + 1, cl.length]; });
  });
  return out;
}

/* ───────────────────────── PDI ───────────────────────── */
function lerAcomp_() {
  var sh = aba_('ACOMP', ['chave', 'loja', 'estado', 'por', 'atualizado_em']), n = sh.getLastRow(), out = {};
  if (n < 2) return out;
  sh.getRange(2, 1, n - 1, 5).getValues().forEach(function (r) { if (r[0]) { try { out[r[0]] = { loja: pad3_(r[1]), estado: JSON.parse(r[2]) }; } catch (e) {} } });
  return out;
}
function pdi_(c) {
  if (!lider_(c)) return { ok: false, erro: 'O PDI é dos líderes (gerente, supervisor e coordenação).' };
  var b = lerBlob_('BASE'), B = b.obj;
  if (!B) return { ok: true, base: null, acomp: {}, atualizado: null };
  var out = {}; Object.keys(B).forEach(function (k) { out[k] = B[k]; });
  out.V = (B.V || []).filter(function (v) { return podeLoja_(c, v.c); });
  ['L', 'ORF', 'M'].forEach(function (k) { var o = {}; Object.keys(B[k] || {}).forEach(function (cod) { if (podeLoja_(c, cod)) o[cod] = B[k][cod]; }); out[k] = o; });
  var A = lerAcomp_(), ac = {};
  Object.keys(A).forEach(function (ch) { if (podeLoja_(c, A[ch].loja)) ac[ch] = A[ch].estado; });
  return { ok: true, base: out, acomp: ac, atualizado: b.em, recorte: c.pf !== 'coord' };
}
function pdiSalvar_(c, d) {
  if (!lider_(c)) throw new Error('Sem permissão para registrar o PDI.');
  if (!d.chave || !d.loja) throw new Error('chave ou loja ausente');
  if (!podeLoja_(c, d.loja)) throw new Error('Este vendedor não está no seu escopo.');
  var est = JSON.stringify(d.estado || {}); if (est.length > 45000) throw new Error('registro grande demais');
  var sa = aba_('ACOMP', ['chave', 'loja', 'estado', 'por', 'atualizado_em']), n = sa.getLastRow(), linha = 0;
  if (n > 1) { var ch = sa.getRange(2, 1, n - 1, 2).getValues(); for (var j = 0; j < ch.length; j++) if (ch[j][0] === d.chave) { if (!podeLoja_(c, ch[j][1])) throw new Error('Este vendedor não está no seu escopo.'); linha = j + 2; break; } }
  var reg = [d.chave, "'" + pad3_(d.loja), est, c.n, new Date()];
  if (linha) sa.getRange(linha, 1, 1, 5).setValues([reg]); else sa.appendRow(reg);
  return { ok: true };
}

/* ───────────────────────── Mentor (progresso) ───────────────────────── */
var MENTOR_CAB = ['login', 'loja', 'nome', 'atualizado_em', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'];
function mentorLinhas_() {
  var sh = aba_('MENTOR', MENTOR_CAB), n = sh.getLastRow();
  return { sh: sh, v: n < 2 ? [] : sh.getRange(2, 1, n - 1, MENTOR_CAB.length).getValues() };
}
function mentorObj_(r) { try { return JSON.parse(r.slice(4).join('')); } catch (e) { return null; } }
function mentorLer_(c) {
  var eu = loginDe_(c.n), M = mentorLinhas_(), meu = null, equipe = [];
  M.v.forEach(function (r) {
    if (!r[0]) return;
    if (r[0] === eu) { meu = mentorObj_(r); return; }
    if (lider_(c) && podeLoja_(c, r[1])) { var o = mentorObj_(r); if (o) equipe.push(o); }
  });
  return { ok: true, login: eu, eu: meu, equipe: equipe };
}
function mentorSalvar_(c, d) {
  var eu = loginDe_(c.n), reg = d.registro || {};
  reg.usuario = reg.usuario || {}; reg.usuario.login = eu; reg.usuario.nome = c.n;
  var loja = (c.pf === 'vend' || c.pf === 'ger') ? (c.lj[0] || '') : pad3_(reg.usuario.loja_id);
  reg.atualizado_em = new Date().toISOString();
  var txt = JSON.stringify(reg); if (txt.length > MAX_MENTOR) throw new Error('Progresso grande demais para salvar.');
  var partes = []; for (var i = 0; i < 9; i++) partes.push(txt.substr(i * PEDACO, PEDACO));
  var M = mentorLinhas_(), linha = 0;
  for (var j = 0; j < M.v.length; j++) if (M.v[j][0] === eu) { linha = j + 2; break; }
  var row = [eu, "'" + loja, c.n, new Date()].concat(partes);
  if (linha) M.sh.getRange(linha, 1, 1, MENTOR_CAB.length).setValues([row]); else M.sh.appendRow(row);
  return { ok: true, atualizado_em: reg.atualizado_em };
}

/* ───────────────────────── entrada ───────────────────────── */
function doGet() { return json_({ ok: true, servico: 'Servidor de Dados ST', versao: 2 }); }   // sem dados por GET

function doPost(e) {
  var d;
  try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) { return json_({ ok: false, erro: 'pedido inválido' }); }
  var escreve = /^(publicar|pdiSalvar|pdiPublicar|publicarNiveis|publicarRanking|mentorSalvar|semanaFeito|semanaAval|semanaFechar|semanaPrazo|semanaSupPlano|semanaSupFechar|conteudoSalvar|pessoaSalvar|pessoaApelido|pessoaJuntar|pessoasSincronizar)$/.test(d.acao || '');
  var lock = escreve ? LockService.getScriptLock() : null;
  try {
    if (d.acao === 'entrar') return json_(entrar_(d));
    var c = cracha_(d.tk);
    if (c.vc && (escreve || d.acao === 'verComo' || d.acao === 'diag')) throw new Error('Modo "Ver como": só leitura. Saia da visão para registrar ou publicar.');
    if (lock) lock.waitLock(20000);
    switch (d.acao) {
      case 'verComo': return json_(verComo_(c, d));
      case 'quemSou': return json_({ ok: true, nome: c.n, perfil: c.pf, lojas: c.lj, ex: c.ex, visao: !!c.vc });
      case 'niveis': return json_(niveis_(c));
      case 'ranking': return json_(ranking_(c));
      case 'posicao': return json_(posicao_(c, d));
      case 'pdi': return json_(pdi_(c));
      case 'pdiSalvar': return json_(pdiSalvar_(c, d));
      case 'mentorLer': return json_(mentorLer_(c));
      case 'mentorSalvar': return json_(mentorSalvar_(c, d));
      case 'semana': return json_(semana_(c));
      case 'semanaFeito': return json_(semanaFeito_(c, d));
      case 'semanaAval': return json_(semanaAval_(c, d));
      case 'semanaFechar': return json_(semanaFechar_(c, d));
      case 'semanaPrazo': return json_(semanaPrazo_(c, d));
      case 'semanaSup': return json_(semanaSup_(c));
      case 'semanaSupPlano': return json_(semanaSupPlano_(c, d));
      case 'semanaSupFechar': return json_(semanaSupFechar_(c, d));
      case 'acesso': return json_(acessoRegistrar_(c, d));
      case 'acessos': return json_(acessos_(c));
      case 'conteudoLer': return json_(conteudoLer_(c));
      case 'conteudoSalvar': return json_(conteudoSalvar_(c, d));
      case 'pessoas': return json_(pessoas_(c));
      case 'pessoaSalvar': return json_(pessoaSalvar_(c, d));
      case 'pessoaApelido': return json_(pessoaApelido_(c, d));
      case 'pessoaJuntar': return json_(pessoaJuntar_(c, d));
      case 'pessoasSincronizar': soCoord_(c); return json_(pessoasSincronizar_());
      case 'painelResumo': return json_(painelResumo_(c));
      case 'pontos': return json_(pontos_(c));
      case 'pdiPublicar': case 'publicar':
        soCoord_(c); if (!d.base || !d.base.V || !d.base.V.length) throw new Error('base vazia');
        var g = gravarBlob_('BASE', d.base, c.n); return json_({ ok: true, partes: g.partes, vendedores: d.base.V.length, atualizado: g.em });
      case 'publicarNiveis':
        soCoord_(c); if (!d.data || !Array.isArray(d.data.LOJAS) || !Array.isArray(d.data.VENDS)) throw new Error('base de níveis inválida');
        return json_({ ok: true, atualizado: gravarBlob_('NIVEIS', d.data, c.n).em });
      case 'publicarRanking':
        soCoord_(c); if (!d.data || !Array.isArray(d.data.lojas) || !Array.isArray(d.data.vend)) throw new Error('base do ranking inválida');
        return json_({ ok: true, atualizado: gravarBlob_('RANKING', d.data, c.n).em });
      case 'diag':
        soCoord_(c);
        var bp = lerBlob_('BASE'), bn = lerBlob_('NIVEIS'), br = lerBlob_('RANKING');
        return json_({ ok: true, pdi: bp.obj ? bp.obj.V.length : 0, niveis: bn.obj ? bn.obj.VENDS.length : 0, ranking: br.obj ? br.obj.vend.length : 0, acomp: Object.keys(lerAcomp_()).length, mentor: mentorLinhas_().v.length });
    }
    return json_({ ok: false, erro: 'ação desconhecida' });
  } catch (err) {
    return json_({ ok: false, erro: String((err && err.message) || err), cracha: !!(err && err.cracha) });
  } finally { if (lock) { try { lock.releaseLock(); } catch (e2) {} } }
}

/* Rode esta função UMA vez no editor (Executar) para autorizar o servidor a conferir o PIN no servidor do app. */
function autorizar() {
  var r = UrlFetchApp.fetch(ENVIO_URL + '?acao=equipe', { muteHttpExceptions: true, followRedirects: true });
  SpreadsheetApp.getActive(); PropertiesService.getScriptProperties(); segredo_();
  Logger.log('Autorizado. Resposta do app: ' + r.getResponseCode());
}

/* ───────── Base do PDI publicada sozinha a partir do Google Drive ─────────
   A rotina mensal (computador do Bruno) grava PDI_dados_<mês><ano>.json na pasta
   "PDI - Base do mes" do Meu Drive. A cada hora este servidor olha a pasta e, se
   houver arquivo novo, publica como a base do PDI e avisa por e-mail.
   Rode instalarBaseAutomatica() UMA vez no editor.                              */
var PASTA_BASE_DRIVE = 'PDI - Base do mes';
function baseMaisNovaNoDrive_() {
  var it = DriveApp.getFoldersByName(PASTA_BASE_DRIVE); if (!it.hasNext()) return null;
  var fs = it.next().getFiles(), melhor = null;
  while (fs.hasNext()) { var f = fs.next(); if (!/^PDI_dados_.*\.json$/i.test(f.getName())) continue; if (!melhor || f.getLastUpdated() > melhor.getLastUpdated()) melhor = f; }
  return melhor;
}
function publicarBaseDoDrive() {
  try { pessoasSincronizar_(); } catch (eP) {}   /* cadastro único: de hora em hora */
  var f = baseMaisNovaNoDrive_(); if (!f) return 'nenhum arquivo na pasta';
  var props = PropertiesService.getScriptProperties(), marca = f.getId() + '|' + f.getLastUpdated().getTime();
  if (props.getProperty('BASE_DRIVE_ULT') === marca) return 'já publicado';
  var j = JSON.parse(f.getBlob().getDataAsString('UTF-8'));
  if (!j || !Array.isArray(j.V) || !j.V.length) throw new Error('Arquivo sem vendedores: ' + f.getName());
  if (!j.rotulo) j.rotulo = 'base ' + f.getName().replace(/^PDI_dados_|\.json$/gi, '');
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { gravarBlob_('BASE', j, 'rotina automática (Drive)'); } finally { lock.releaseLock(); }
  props.setProperty('BASE_DRIVE_ULT', marca);
  try { MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Só Tintas App · base do PDI publicada (' + j.V.length + ' vendedores)', 'A base "' + j.rotulo + '" (' + f.getName() + ') foi publicada sozinha no PDI Mensal do app.\nNão precisa apertar "Atualizar base do mês".'); } catch (e) {}
  return 'publicado: ' + f.getName();
}
function instalarBaseAutomatica() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'publicarBaseDoDrive') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('publicarBaseDoDrive').timeBased().everyHours(1).create();
  var f = baseMaisNovaNoDrive_();   /* o arquivo que já está na pasta é a base atual: não republica */
  if (f) PropertiesService.getScriptProperties().setProperty('BASE_DRIVE_ULT', f.getId() + '|' + f.getLastUpdated().getTime());
  Logger.log('Acionador criado (de hora em hora). Arquivo atual marcado como já publicado: ' + (f ? f.getName() : 'nenhum'));
}

/* ───────────────────────── PDI SEMANAL (aba SEMANA) ─────────────────────────
   Toda segunda o resumo semanal (servidor do Painel) grava aqui, por vendedor, os 3 compromissos
   da semana e as 10 questões da avaliação (com o gabarito, que nunca sai deste servidor).
   1) Gerente conversa com o vendedor e marca "Fiz o PDI semanal"  → libera a avaliação;
   2) Vendedor responde no app dele (crachá = PIN dele) até o prazo (12h do dia do envio);
   3) Na semana seguinte o gerente registra o fechamento (positivações e orçamentos). */
var SEMANA_CAB = ['chave', 'semana', 'loja', 'vendedor', 'dados', 'status', 'feito_em', 'feito_por', 'aval', 'fechamento', 'atualizado_em'];
function agoraSP_() { return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd HH:mm'); }
function semanaLinhas_() {
  var sh = aba_('SEMANA', SEMANA_CAB), n = sh.getLastRow();
  return { sh: sh, v: n < 2 ? [] : sh.getRange(2, 1, n - 1, SEMANA_CAB.length).getValues() };
}
function semanaObj_(r) { var o = {}; SEMANA_CAB.forEach(function (k, i) { o[k] = r[i]; }); ['dados', 'aval', 'fechamento'].forEach(function (k) { try { o[k] = o[k] ? JSON.parse(o[k]) : null; } catch (e) { o[k] = null; } }); o.loja = pad3_(o.loja); o.semana = String(o.semana instanceof Date ? Utilities.formatDate(o.semana, 'America/Sao_Paulo', 'yyyy-MM-dd') : o.semana); return o; }
function semanaSituacao_(o) {
  if (o.status === 'respondido') return 'respondido';
  var prazo = (o.dados && o.dados.prazo) || '';
  if (prazo && agoraSP_() > prazo) return o.status === 'liberado' ? 'nao_respondeu' : 'nao_feito';
  return o.status || 'aguardando';
}
/* o que pode sair do servidor: nunca o gabarito; as questões só para o próprio vendedor, liberadas e no prazo */
function semanaPublico_(o, mostrarQuestoes) {
  var d = o.dados || {}, sit = semanaSituacao_(o);
  var out = { chave: o.chave, semana: o.semana, loja: o.loja, vendedor: o.vendedor, situacao: sit, prazo: d.prazo || '', comp: d.comp || null,
    feito_em: o.feito_em ? String(o.feito_em) : '', feito_por: o.feito_por || '', fechamento: o.fechamento || null, posit_real: d.posit_real != null ? d.posit_real : null };
  if (o.aval) out.aval = { nota: o.aval.nota, total: o.aval.total, mentor: o.aval.mentor || null, em: o.aval.em, revisao: o.aval.revisao || null };
  if (mostrarQuestoes && sit === 'liberado') out.questoes = (d.q || []).map(function (q) { return { t: q.t, ops: q.ops }; });
  return out;
}
function semanaDoUsuario_(c, o) { return c.lj.indexOf(o.loja) >= 0 && mesmo_(o.vendedor, c.n); }

function semana_(c) {
  var L = semanaLinhas_().v.map(semanaObj_).filter(function (o) { return o.chave && o.status !== 'fora'; });
  var sems = []; L.forEach(function (o) { if (sems.indexOf(o.semana) < 0) sems.push(o.semana); }); sems.sort().reverse();
  var atual = sems[0] || '', anterior = sems[1] || '';
  var minhas = L.filter(function (o) {
    if (o.semana !== atual && o.semana !== anterior) return false;
    if (c.pf === 'vend') return semanaDoUsuario_(c, o);
    return lider_(c) && podeLoja_(c, o.loja);
  });
  return { ok: true, perfil: c.pf, atual: atual, anterior: anterior, agora: agoraSP_(),
    linhas: minhas.map(function (o) { return semanaPublico_(o, c.pf === 'vend' && !c.vc); }) };
}
function semanaAchar_(chave) {
  var S = semanaLinhas_();
  for (var i = 0; i < S.v.length; i++) if (S.v[i][0] === chave) return { sh: S.sh, linha: i + 2, o: semanaObj_(S.v[i]) };
  throw new Error('PDI semanal não encontrado. Atualize a tela.');
}
function semanaGravar_(A, campos) {
  Object.keys(campos).forEach(function (k) { var col = SEMANA_CAB.indexOf(k) + 1; var v = campos[k]; A.sh.getRange(A.linha, col, 1, 1).setValues([[typeof v === 'object' && v !== null && !(v instanceof Date) ? JSON.stringify(v) : v]]); });
  A.sh.getRange(A.linha, SEMANA_CAB.indexOf('atualizado_em') + 1, 1, 1).setValues([[new Date()]]);
}
function semanaFeito_(c, d) {
  if (!lider_(c)) throw new Error('Só o gerente ou a supervisão marcam o PDI semanal.');
  var A = semanaAchar_(String(d.chave || '')); if (!podeLoja_(c, A.o.loja)) throw new Error('Este vendedor não está no seu escopo.');
  var sit = semanaSituacao_(A.o);
  if (sit === 'respondido') throw new Error('Este vendedor já respondeu a avaliação.');
  if (sit === 'nao_feito' || sit === 'nao_respondeu') throw new Error('O prazo desta semana já acabou (' + A.o.dados.prazo + ').');
  semanaGravar_(A, { status: 'liberado', feito_em: agoraSP_(), feito_por: c.n });
  return { ok: true, situacao: 'liberado' };
}
function semanaAval_(c, d) {
  if (c.pf !== 'vend') throw new Error('A avaliação é respondida pelo vendedor, no app dele.');
  var A = semanaAchar_(String(d.chave || '')); if (!semanaDoUsuario_(c, A.o)) throw new Error('Este PDI semanal não é seu.');
  var sit = semanaSituacao_(A.o);
  if (sit === 'respondido') throw new Error('Você já respondeu esta avaliação.');
  if (sit === 'aguardando') throw new Error('A avaliação libera depois que o seu gerente fizer o PDI semanal com você.');
  if (sit !== 'liberado') throw new Error('O prazo para responder acabou (' + A.o.dados.prazo + ').');
  var Q = A.o.dados.q || [], R = d.respostas || [];
  if (R.length !== Q.length) throw new Error('Responda todas as ' + Q.length + ' questões.');
  var nota = 0, revisao = Q.map(function (q, i) { var ok = Number(R[i]) === q.c; if (ok) nota++; return { ok: ok, certa: q.ops[q.c] }; });
  var m = d.mentor || null; if (m) m = { modulo: String(m.modulo || '').slice(0, 60), titulo: String(m.titulo || '').slice(0, 120), acertos: Math.max(0, Math.min(Number(m.acertos) || 0, Number(m.total) || 0)), total: Math.max(0, Math.min(Number(m.total) || 0, 20)) };
  var aval = { nota: nota, total: Q.length, respostas: R.map(Number), mentor: m, em: agoraSP_(), revisao: revisao };
  semanaGravar_(A, { status: 'respondido', aval: aval });
  return { ok: true, nota: nota, total: Q.length, revisao: revisao, mentor: m };
}
function semanaFechar_(c, d) {
  if (!lider_(c)) throw new Error('Só o gerente ou a supervisão registram o fechamento.');
  var A = semanaAchar_(String(d.chave || '')); if (!podeLoja_(c, A.o.loja)) throw new Error('Este vendedor não está no seu escopo.');
  var f = { posit: Math.max(0, Math.round(Number(d.posit) || 0)), orcs: Math.max(0, Math.round(Number(d.orcs) || 0)), indicador: String(d.indicador || '').slice(0, 20),
    obs: String(d.obs || '').slice(0, 300), por: c.n, em: agoraSP_() };
  semanaGravar_(A, { fechamento: f });
  return { ok: true, fechamento: f };
}

/* coordenação: muda o prazo de resposta de uma semana inteira (ex.: estender até segunda 12h).
   Só mexe nos PDIs ainda em aberto (não respondidos e não 'fora'); grava a coluna de uma vez. */
function semanaPrazo_(c, d) {
  soCoord_(c);
  var semana = String(d.semana || '').slice(0, 10), prazo = String(d.prazo || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(semana)) throw new Error('Semana inválida (use AAAA-MM-DD da segunda-feira).');
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(prazo)) throw new Error('Prazo inválido (use AAAA-MM-DD HH:MM).');
  var S = semanaLinhas_(); if (!S.v.length) return { ok: true, alterados: 0 };
  var iD = SEMANA_CAB.indexOf('dados'), col = S.v.map(function (r) { return [r[iD]]; }), n = 0, antes = {};
  S.v.forEach(function (r, i) {
    var o = semanaObj_(r); if (!o.chave || o.semana !== semana || o.status === 'fora' || o.status === 'respondido') return;
    var dd = o.dados || {}; antes[dd.prazo || ''] = (antes[dd.prazo || ''] || 0) + 1;
    if (dd.prazo === prazo) return;
    dd.prazo = prazo; col[i] = [JSON.stringify(dd)]; n++;
  });
  if (n) S.sh.getRange(2, iD + 1, col.length, 1).setValues(col);
  return { ok: true, semana: semana, prazo: prazo, alterados: n, prazosAntes: antes };
}

/* ───────── PDI SEMANAL DO SUPERVISOR (aba SUPSEMANA, gravada pelo resumo de segunda) ─────────
   O supervisor registra o plano (loja foco: data da visita e ação; auditoria) até as 18h de segunda;
   na semana seguinte registra o fechamento (visitou? resultado). A coordenação vê todos. */
var SUP_CAB = ['chave', 'semana', 'supervisor', 'dados', 'plano', 'fechamento', 'atualizado_em'];
function supLinhas_() { var sh = aba_('SUPSEMANA', SUP_CAB), n = sh.getLastRow(); return { sh: sh, v: n < 2 ? [] : sh.getRange(2, 1, n - 1, SUP_CAB.length).getValues() }; }
function supObj_(r) { var o = {}; SUP_CAB.forEach(function (k, i) { o[k] = r[i]; }); ['dados', 'plano', 'fechamento'].forEach(function (k) { try { o[k] = o[k] ? JSON.parse(o[k]) : null; } catch (e) { o[k] = null; } }); o.semana = String(o.semana instanceof Date ? Utilities.formatDate(o.semana, 'America/Sao_Paulo', 'yyyy-MM-dd') : o.semana); return o; }
function supEhMeu_(c, o) { return chaveNome_(o.supervisor).split(' ')[0] === chaveNome_(c.n).split(' ')[0]; }
function semanaSup_(c) {
  if (c.pf !== 'sup' && c.pf !== 'coord') return { ok: true, linhas: [] };
  var L = supLinhas_().v.map(supObj_).filter(function (o) { return o.chave; });
  var sems = []; L.forEach(function (o) { if (sems.indexOf(o.semana) < 0) sems.push(o.semana); }); sems.sort().reverse();
  var ag = agoraSP_();
  return { ok: true, atual: sems[0] || '', anterior: sems[1] || '', linhas: L.filter(function (o) { return (o.semana === sems[0] || o.semana === sems[1]) && (c.pf === 'coord' || supEhMeu_(c, o)); })
    .map(function (o) { return { chave: o.chave, semana: o.semana, supervisor: o.supervisor, dados: o.dados, plano: o.plano, fechamento: o.fechamento, prazoAberto: !!(o.dados && o.dados.prazo && ag <= o.dados.prazo), meu: supEhMeu_(c, o) }; }) };
}
function supAchar_(chave) { var S = supLinhas_(); for (var i = 0; i < S.v.length; i++) if (S.v[i][0] === chave) return { sh: S.sh, linha: i + 2, o: supObj_(S.v[i]) }; throw new Error('PDI do supervisor não encontrado. Atualize a tela.'); }
function supGravar_(A, col, obj) { A.sh.getRange(A.linha, SUP_CAB.indexOf(col) + 1, 1, 1).setValues([[JSON.stringify(obj)]]); A.sh.getRange(A.linha, SUP_CAB.indexOf('atualizado_em') + 1, 1, 1).setValues([[new Date()]]); }
function semanaSupPlano_(c, d) {
  var A = supAchar_(String(d.chave || ''));
  if (!(c.pf === 'sup' && supEhMeu_(c, A.o))) throw new Error('Só o próprio supervisor registra o plano.');
  if (!(A.o.dados && A.o.dados.prazo && agoraSP_() <= A.o.dados.prazo)) throw new Error('O prazo do plano acabou (' + ((A.o.dados && A.o.dados.prazo) || '') + ').');
  var p = { visita: String(d.visita || '').slice(0, 10), acao: String(d.acaoTxt || '').slice(0, 600), auditoria: String(d.auditoria || '').slice(0, 600), indicador: String(d.indicador || '').slice(0, 600), por: c.n, em: agoraSP_() };
  if (!p.visita || !p.acao) throw new Error('Informe a data da visita e a ação combinada com o gerente da loja foco.');
  supGravar_(A, 'plano', p); return { ok: true, plano: p };
}
function semanaSupFechar_(c, d) {
  var A = supAchar_(String(d.chave || ''));
  if (!(c.pf === 'coord' || (c.pf === 'sup' && supEhMeu_(c, A.o)))) throw new Error('Só o supervisor ou a coordenação registram o fechamento.');
  var f = { visitou: d.visitou === 'sim' ? 'sim' : 'nao', resultado: String(d.resultado || '').slice(0, 600), por: c.n, em: agoraSP_() };
  supGravar_(A, 'fechamento', f); return { ok: true, fechamento: f };
}

/* ───────────────────────── ACESSOS AO APP (aba ACESSOS + aba CADASTRO) ─────────────────────────
   1) Cada tela aberta com crachá próprio grava uma linha em ACESSOS (no máximo 1 por pessoa/tela a cada 10 min).
      "Ver como" não grava: é a coordenação olhando, não a pessoa entrando.
   2) O Painel de Acessos cruza o registro com o CADASTRO (gerentes, supervisores e vendedores da base de vendas,
      escrito toda segunda pelo servidor do Painel) e com o PDI semanal da semana.
   Recorte: coordenação → rede; supervisor → carteira; gerente → loja(s). Vendedor não vê. */
var ACESSO_CAB = ['em', 'dia', 'hora', 'nome', 'perfil', 'lojas', 'tela', 'disp', 'codigo'];
var CADASTRO_CAB = ['tipo', 'nome', 'loja', 'loja_nome', 'supervisor', 'atualizado_em'];
var ACESSO_DIAS = 35;

function diaSP_(x) { return x instanceof Date ? Utilities.formatDate(x, 'America/Sao_Paulo', 'yyyy-MM-dd') : String(x || '').replace(/^'/, '').slice(0, 10); }
function primeiroNome_(n) { return chaveNome_(n).split(' ')[0] || ''; }

function acessoRegistrar_(c, d) {
  if (c.vc) return { ok: true, ignorado: true };
  var tela = String(d.tela || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 20) || 'outra';
  var disp = d.disp === 'pc' ? 'pc' : 'cel';
  var cache = CacheService.getScriptCache(), k = 'ac_' + Utilities.base64EncodeWebSafe(chaveNome_(c.n) + '|' + tela).slice(0, 200);
  if (cache.get(k)) return { ok: true, repetido: true };
  cache.put(k, '1', 600);
  var agora = new Date(), sh = aba_('ACESSOS', ACESSO_CAB), cod = '';
  try { if (String(sh.getRange(1, 9, 1, 1).getValues()[0][0]) !== 'codigo') sh.getRange(1, 9, 1, 1).setValues([['codigo']]); } catch (e) {}
  try { var p = pessoaDe_(pessoasLer_().L, c.n, c.lj, c.pf); if (p) cod = p.codigo; } catch (e) {}
  sh.appendRow([agora, "'" + Utilities.formatDate(agora, 'America/Sao_Paulo', 'yyyy-MM-dd'), Number(Utilities.formatDate(agora, 'America/Sao_Paulo', 'H')),
    String(c.n).slice(0, 80), c.pf, "'" + (c.lj || []).join(','), tela, disp, cod ? "'" + cod : '']);
  return { ok: true };
}

function acessoLog_(dias) {
  var sh = aba_('ACESSOS', ACESSO_CAB), n = sh.getLastRow(); if (n < 2) return [];
  var ini = Math.max(2, n - 30000), nc = Math.max(8, Math.min(ACESSO_CAB.length, sh.getLastColumn ? sh.getLastColumn() : ACESSO_CAB.length)), V = sh.getRange(ini, 1, n - ini + 1, nc).getValues();
  var lim = Utilities.formatDate(new Date(Date.now() - (dias || ACESSO_DIAS) * 864e5), 'America/Sao_Paulo', 'yyyy-MM-dd');
  return V.map(function (r) {
    var em = r[0] instanceof Date ? r[0].getTime() : new Date(r[0]).getTime();
    return { em: em, dia: diaSP_(r[1]), hora: Number(r[2]) || 0, nome: String(r[3] || ''), pf: String(r[4] || ''), lj: cods_(String(r[5] || '').replace(/^'/, '').split(',')), tela: String(r[6] || ''), disp: String(r[7] || ''), codigo: String(r[8] || '').replace(/^'/, '') };
  }).filter(function (x) { return x.nome && x.dia >= lim; });
}

function cadastroLer_() {
  var sh = aba_('CADASTRO', CADASTRO_CAB), n = sh.getLastRow(), out = [];
  if (n >= 2) sh.getRange(2, 1, n - 1, CADASTRO_CAB.length).getValues().forEach(function (r) {
    if (r[0] && r[1]) out.push({ tipo: String(r[0]), nome: String(r[1]), loja: pad3_(r[2]), lojaNome: String(r[3] || ''), sup: String(r[4] || '') });
  });
  if (out.some(function (p) { return p.tipo === 'vend'; })) return out;
  /* sem cadastro ainda (ele nasce no resumo de segunda): monta com o que já existe na planilha —
     supervisores e gerentes do PDI dos supervisores (carteira e auditoria) e vendedores do PDI semanal */
  var lojaSup = {}, lojaNome = {};
  try {
    var SP = supLinhas_().v.map(supObj_).filter(function (o) { return o.chave; }), us = '';
    SP.forEach(function (o) { if (String(o.semana) > us) us = String(o.semana); });
    SP.filter(function (o) { return String(o.semana) === us; }).forEach(function (o) {
      var d = o.dados || {};
      (d.auditoria || []).forEach(function (a) { var c = pad3_(a.cod); lojaNome[c] = a.nome || ''; if (a.gerente) out.push({ tipo: 'ger', nome: a.gerente, loja: c, lojaNome: a.nome || '', sup: o.supervisor }); });
      ((d.carteira && d.carteira.cods) || []).forEach(function (c) { c = pad3_(c); lojaSup[c] = o.supervisor; out.push({ tipo: 'sup', nome: o.supervisor, loja: c, lojaNome: '', sup: o.supervisor }); });
    });
    out.forEach(function (p) { if (!p.lojaNome) p.lojaNome = lojaNome[p.loja] || ''; });
  } catch (e) {}
  var L = semanaLinhas_().v.map(semanaObj_).filter(function (o) { return o.chave && o.status !== 'fora'; }), ult = '';
  L.forEach(function (o) { if (o.semana > ult) ult = o.semana; });
  L.filter(function (o) { return o.semana === ult; }).forEach(function (o) { out.push({ tipo: 'vend', nome: o.vendedor, loja: o.loja, lojaNome: lojaNome[o.loja] || '', sup: lojaSup[o.loja] || '' }); });
  return out;
}

/* vendedores com acesso liberado no app principal (guardado 10 min) */
function liberadosApp_(eu) {
  var cache = CacheService.getScriptCache(), k = 'lib_' + Utilities.base64EncodeWebSafe(chaveNome_(eu)).slice(0, 100), j = cache.get(k);
  if (j) { try { return JSON.parse(j); } catch (e) {} }
  try {
    var r = UrlFetchApp.fetch(ENVIO_URL + '?acao=acessosVendedores&eu=' + encodeURIComponent(eu), { muteHttpExceptions: true, followRedirects: true });
    var o = JSON.parse(r.getContentText()); if (!o || !o.ok) return null;
    var lista = (o.vendedores || []).filter(function (v) { return v.liberado || v.ativo; }).map(function (v) { return { nome: String(v.nome || ''), loja: pad3_(v.cod || v.loja) }; });
    try { cache.put(k, JSON.stringify(lista), 600); } catch (e) {}
    return lista;
  } catch (e) { return null; }
}

/* a linha do registro é desta pessoa do cadastro? */
function acessoDe_(p, x) {
  if (p.codigo && x.codigo) return p.codigo === x.codigo;   /* cadastro único: o código decide */
  if (p.codigo && p.apelidos && [p.nome].concat(p.apelidos).some(function (n) { return chaveNome_(n) === chaveNome_(x.nome); }) && (p.tipo === 'sup' ? (x.pf === 'sup' || x.pf === 'coord') : x.pf === p.tipo) && (p.tipo === 'sup' || !x.lj.length || x.lj.indexOf(p.loja) >= 0)) return true;
  /* o Bruno é coordenação e também supervisor de carteira: o crachá de coordenação conta como o supervisor */
  if (p.tipo === 'sup') return (x.pf === 'sup' || x.pf === 'coord') && primeiroNome_(x.nome) === primeiroNome_(p.nome);
  if (x.pf !== p.tipo) return false;   /* entrada de coordenação ou supervisão nunca conta para um vendedor de mesmo nome */
  var nomeOk = mesmo_(x.nome, p.nome) || ((chaveNome_(p.nome).split(' ').length === 1 || chaveNome_(x.nome).split(' ').length === 1) && primeiroNome_(x.nome) === primeiroNome_(p.nome));
  if (!nomeOk) return false;
  return x.lj.length === 0 || x.lj.indexOf(p.loja) >= 0;
}

function acessos_(c) {
  if (!lider_(c)) throw new Error('O painel de acessos é da gerência, supervisão e coordenação.');
  var agora = new Date(), hoje = Utilities.formatDate(agora, 'America/Sao_Paulo', 'yyyy-MM-dd');
  var d7 = Utilities.formatDate(new Date(agora.getTime() - 6 * 864e5), 'America/Sao_Paulo', 'yyyy-MM-dd');
  var d30 = Utilities.formatDate(new Date(agora.getTime() - 29 * 864e5), 'America/Sao_Paulo', 'yyyy-MM-dd');
  var noEscopo = function (cod) { return c.pf === 'coord' || c.lj.indexOf(cod) >= 0; };
  var cad = (rosterAcessos_() || cadastroLer_()).filter(function (p) {
    if (p.tipo === 'sup') return c.pf === 'coord' || (c.pf === 'sup' && primeiroNome_(p.nome) === primeiroNome_(c.n));
    return noEscopo(p.loja);
  });
  /* supervisor aparece uma vez só, com a carteira */
  var sups = {}, pessoas = [];
  cad.forEach(function (p) {
    if (p.tipo !== 'sup') { pessoas.push(p); return; }
    var k = p.codigo || primeiroNome_(p.nome); if (!sups[k]) { sups[k] = { tipo: 'sup', nome: p.nome, loja: '', lojaNome: '', sup: p.nome, lojas: [], codigo: p.codigo, apelidos: p.apelidos }; pessoas.push(sups[k]); }
    if (p.loja) sups[k].lojas.push(p.loja);
  });
  var LOG = acessoLog_(), usadas = {};
  var dentro = function (x) {
    if (c.pf === 'coord') return true;
    if (c.pf === 'ger' && (x.pf === 'sup' || x.pf === 'coord')) return false;   /* a visita do supervisor não conta como uso da loja */
    return x.lj.some(function (l) { return c.lj.indexOf(l) >= 0; });
  };

  /* PDI semanal da semana atual (situação por vendedor; feito por loja) */
  var S = semanaLinhas_().v.map(semanaObj_).filter(function (o) { return o.chave && o.status !== 'fora' && noEscopo(o.loja); }), sem = '';
  S.forEach(function (o) { if (o.semana > sem) sem = o.semana; });
  S = S.filter(function (o) { return o.semana === sem; });

  var lib = (c.pf === 'coord' || c.pf === 'sup' || c.pf === 'ger') && !c.vc ? liberadosApp_(c.n) : null;

  var out = pessoas.map(function (p) {
    var meus = [];
    LOG.forEach(function (x, i) { if (acessoDe_(p, x)) { meus.push(x); usadas[i] = 1; } });
    var dias = {}, telas = {}, ult = 0, disp = {};
    meus.forEach(function (x) { dias[x.dia] = 1; telas[x.tela] = (telas[x.tela] || 0) + 1; disp[x.disp] = 1; if (x.em > ult) ult = x.em; });
    var ds = Object.keys(dias);
    var o = { codigo: p.codigo || '', tipo: p.tipo, nome: p.nome, loja: p.loja, lojaNome: p.lojaNome, sup: p.sup, lojas: p.lojas || null,
      ultimo: ult || null, hoje: !!dias[hoje], d7: ds.filter(function (x) { return x >= d7; }).length, d30: ds.filter(function (x) { return x >= d30; }).length,
      telas: telas, acessos: meus.length, cel: !!disp.cel, pc: !!disp.pc };
    if (p.tipo === 'vend') {
      var s = S.filter(function (r) { return r.loja === p.loja && mesmo_(r.vendedor, p.nome); })[0];
      if (s) { o.pdi = semanaSituacao_(s); if (s.aval) o.nota = s.aval.nota + '/' + s.aval.total; }
      if (lib) o.liberado = lib.some(function (v) { return (!v.loja || v.loja === p.loja) && mesmo_(v.nome, p.nome); });
    }
    if (p.tipo === 'ger') {
      var sl = S.filter(function (r) { return r.loja === p.loja; });
      o.pdiTotal = sl.length; o.pdiFeito = sl.filter(function (r) { var t = semanaSituacao_(r); return t !== 'aguardando' && t !== 'nao_feito'; }).length;
    }
    return o;
  });

  /* quem entrou e não está no cadastro (coordenação, marketing, nomes diferentes) */
  var outros = {};
  LOG.forEach(function (x, i) {
    if (usadas[i] || !dentro(x)) return;
    var k = chaveNome_(x.nome); var o = outros[k] = outros[k] || { nome: x.nome, pf: x.pf, lojas: x.lj, ultimo: 0, dias: {}, acessos: 0 };
    o.acessos++; o.dias[x.dia] = 1; if (x.em > o.ultimo) o.ultimo = x.em;
  });
  var outrosL = Object.keys(outros).map(function (k) { var o = outros[k], ds = Object.keys(o.dias); return { nome: o.nome, pf: o.pf, lojas: o.lojas, ultimo: o.ultimo, d7: ds.filter(function (x) { return x >= d7; }).length, acessos: o.acessos }; });

  /* telas, horário de pico e entradas por dia (pessoas distintas), só do recorte */
  var telas = {}, heat = [], porDia = {};
  for (var w = 0; w < 7; w++) { heat.push([]); for (var h = 0; h < 24; h++) heat[w].push(0); }
  LOG.forEach(function (x) {
    if (!dentro(x) || x.dia < d30) return;
    telas[x.tela] = (telas[x.tela] || 0) + 1;
    var p = x.dia.split('-'), dw = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay();
    if (heat[dw] && x.hora >= 0 && x.hora < 24) heat[dw][x.hora]++;
    (porDia[x.dia] = porDia[x.dia] || {})[chaveNome_(x.nome)] = 1;
  });
  var serie = [];
  for (var i = 13; i >= 0; i--) { var dd = Utilities.formatDate(new Date(agora.getTime() - i * 864e5), 'America/Sao_Paulo', 'yyyy-MM-dd'); serie.push({ dia: dd, n: Object.keys(porDia[dd] || {}).length }); }

  var desde = LOG.length ? LOG.reduce(function (m, x) { return x.dia < m ? x.dia : m; }, '9999') : hoje;
  return { ok: true, perfil: c.pf, agora: agoraSP_(), hoje: hoje, desde: desde, semana: sem, liberadosConhecidos: lib !== null,
    pessoas: out, outros: outrosL, telas: telas, heat: heat, serie: serie };
}

/* ───────────────────────── CONTEÚDO DO MENTOR (aba MENTOR_CONTEUDO) ─────────────────────────
   O que a coordenação edita no Painel do Gestor do Mentor (vídeos, aulas, questões, história, valores,
   jornada, produtos, configurações…) fica aqui e vale para todo mundo. A base continua nos arquivos do app;
   esta aba guarda só as tabelas que a coordenação mexeu, e elas substituem as do arquivo.
   Ler: qualquer crachá. Publicar: só a coordenação (fora do "Ver como"). */
function conteudoLer_(c) {
  var b = lerBlob_('MENTOR_CONTEUDO');
  return { ok: true, cont: b.obj || {}, em: b.em, por: b.por };
}
function conteudoSalvar_(c, d) {
  soCoord_(c);
  var T = d.tabelas && typeof d.tabelas === 'object' && !Array.isArray(d.tabelas) ? d.tabelas : null;
  if (!T) { T = {}; T[String(d.tabela || '')] = d.lista; }
  var b = lerBlob_('MENTOR_CONTEUDO'), obj = b.obj || {}, nomes = [];
  Object.keys(T).forEach(function (t) {
    if (!/^[a-z_]{2,40}$/.test(t) || /^niveis_/.test(t)) throw new Error('Tabela inválida: ' + t);
    var v = T[t];
    if (v === null) { delete obj[t]; nomes.push(t); return; }   /* volta ao conteúdo do arquivo */
    if (t === 'config' ? (typeof v !== 'object' || Array.isArray(v)) : !Array.isArray(v)) throw new Error('Conteúdo inválido em ' + t);
    obj[t] = v; nomes.push(t);
  });
  if (JSON.stringify(obj).length > 3000000) throw new Error('Conteúdo grande demais para publicar.');
  var g = gravarBlob_('MENTOR_CONTEUDO', obj, c.n);
  return { ok: true, tabelas: nomes, em: g.em, por: c.n };
}

/* ───────────────────────── CADASTRO ÚNICO (aba PESSOAS) ─────────────────────────
   Uma linha por pessoa, com CÓDIGO FIXO. Todo o app passa a reconhecer a pessoa pelo código,
   e os vários jeitos de escrever o nome dela ficam em "apelidos" (ex.: "João", "Joao Rodrigues").
     • vendedor  → V + código do vendedor no sistema de vendas (Ranking); sem código: V + loja + nº
     • gerente   → G001, G002…   • supervisor → S001…   • coordenação → C001…
   A rotina de hora em hora (e o botão "Atualizar das bases") junta: cadastro do Painel (gerente,
   supervisor e vendedores da base de vendas), Ranking (código do vendedor) e os nomes usados no login.
   O que a coordenação corrige na tela fica TRAVADO: a rotina não desfaz. Nunca apaga ninguém. */
var PESSOAS_CAB = ['codigo', 'nome', 'cargo', 'lojas', 'supervisor', 'ativo', 'apelidos', 'origem', 'criado_em', 'atualizado_em', 'travado'];
var CARGOS = { vend: 'Vendedor', ger: 'Gerente', sup: 'Supervisor', coord: 'Coordenação', outro: 'Outro' };

function pessoasLer_() {
  var sh = aba_('PESSOAS', PESSOAS_CAB), n = sh.getLastRow();
  var V = n < 2 ? [] : sh.getRange(2, 1, n - 1, PESSOAS_CAB.length).getValues();
  return { sh: sh, L: V.map(function (r, i) {
    var o = { linha: i + 2 }; PESSOAS_CAB.forEach(function (k, j) { o[k] = r[j]; });
    o.codigo = String(o.codigo || '').replace(/^'/, ''); o.nome = String(o.nome || ''); o.cargo = String(o.cargo || 'outro');
    o.lojas = cods_(String(o.lojas || '').replace(/^'/, '').split(/[,; ]+/)); o.supervisor = String(o.supervisor || '');
    o.ativo = !/^n/i.test(String(o.ativo || 'sim')); o.travado = /^s/i.test(String(o.travado || ''));
    o.apelidos = String(o.apelidos || '').split('|').map(function (x) { return x.trim(); }).filter(Boolean);
    return o;
  }).filter(function (o) { return o.codigo; }) };
}
function pessoaLinha_(p) {
  return ["'" + p.codigo, p.nome, p.cargo, "'" + (p.lojas || []).join(','), p.supervisor || '', p.ativo === false ? 'não' : 'sim', (p.apelidos || []).join(' | '),
    p.origem || '', p.criado_em || new Date(), new Date(), p.travado ? 'sim' : ''];
}
function pessoaGravar_(sh, p) {
  if (p.linha) sh.getRange(p.linha, 1, 1, PESSOAS_CAB.length).setValues([pessoaLinha_(p)]);
  else { sh.appendRow(pessoaLinha_(p)); p.linha = sh.getLastRow(); }
}
/* todos os jeitos conhecidos de escrever o nome desta pessoa */
function pessoaChaves_(p) { var o = {}; [p.nome].concat(p.apelidos || []).forEach(function (n) { var k = chaveNome_(n); if (k) o[k] = 1; }); return Object.keys(o); }
function cargoCombina_(cargo, pf) {
  if (!pf) return true;
  if (cargo === 'sup' || cargo === 'coord') return pf === 'sup' || pf === 'coord';
  return cargo === pf;
}
/* quem é esta pessoa? nome como veio (login, planilha) + lojas + perfil do crachá */
function pessoaDe_(L, nome, lj, pf) {
  var k = chaveNome_(nome); if (!k) return null; lj = lj || [];
  var temLoja = function (p) { return !lj.length || !p.lojas.length || p.lojas.some(function (c) { return lj.indexOf(c) >= 0; }); };
  var cand = L.filter(function (p) { return cargoCombina_(p.cargo, pf) && temLoja(p) && pessoaChaves_(p).indexOf(k) >= 0; });
  if (cand.length === 1) return cand[0];
  if (cand.length > 1) { var at = cand.filter(function (p) { return p.ativo; }); return at.length === 1 ? at[0] : null; }
  cand = L.filter(function (p) { return cargoCombina_(p.cargo, pf) && temLoja(p) && [p.nome].concat(p.apelidos).some(function (n) { return mesmo_(n, nome); }); });
  if (cand.length === 1) return cand[0];
  if (cand.length) return null;
  /* cadastro só com o primeiro nome ("Fabio") × login completo ("Fábio Martins"): vale se for o único da loja com esse cargo */
  if (!lj.length || !pf) return null;
  var pri = k.split(' ')[0];
  cand = L.filter(function (p) { return p.ativo && cargoCombina_(p.cargo, pf) && p.lojas.some(function (c) { return lj.indexOf(c) >= 0; }) &&
    [p.nome].concat(p.apelidos).some(function (n) { var kk = chaveNome_(n); return kk.split(' ')[0] === pri && (kk.indexOf(' ') < 0 || k.indexOf(' ') < 0); }); });
  return cand.length === 1 ? cand[0] : null;
}
function proximoCodigo_(L, pre) {
  var max = 0; L.forEach(function (p) { var m = new RegExp('^' + pre + '(\\d+)$').exec(p.codigo); if (m) max = Math.max(max, Number(m[1])); });
  return pre + ('00' + (max + 1)).slice(-3);
}

function pessoasSincronizar_() {
  var P = pessoasLer_(), L = P.L, sh = P.sh, novos = 0, mudou = 0;
  /* fontes: cadastro do Painel (ou o que já existe na planilha) + código do Ranking */
  var fonte = cadastroLer_(), rk = null; try { rk = blobOuMigra_('RANKING', ANTIGO_RANK).obj; } catch (e) {}
  var idVend = {}; ((rk && rk.vend) || []).forEach(function (v) { idVend[pad3_(v.l) + '|' + chaveNome_(v.n)] = String(v.id || ''); });
  var acha = function (tipo, nome, loja) {
    var k = chaveNome_(nome), lj = loja ? [loja] : [];
    var c = L.filter(function (p) { return cargoCombina_(p.cargo, tipo) && (tipo !== 'vend' || !lj.length || p.lojas.indexOf(loja) >= 0) && pessoaChaves_(p).indexOf(k) >= 0; });
    if (c.length === 1) return c[0];
    if (tipo === 'sup') { c = L.filter(function (p) { return (p.cargo === 'sup' || p.cargo === 'coord') && pessoaChaves_(p).some(function (x) { return x.split(' ')[0] === k.split(' ')[0]; }); }); if (c.length === 1) return c[0]; }
    return pessoaDe_(L, nome, lj, tipo);
  };
  /* agrupa a fonte por pessoa (gerente e supervisor podem ter várias lojas) */
  var grupos = {};
  fonte.forEach(function (f) {
    if (!f.nome || !f.tipo) return;
    var k = f.tipo + '|' + (f.tipo === 'vend' ? f.loja + '|' : '') + (f.tipo === 'sup' ? chaveNome_(f.nome).split(' ')[0] : chaveNome_(f.nome));
    var g = grupos[k] = grupos[k] || { tipo: f.tipo, nome: f.nome, lojas: [], sup: f.sup || '' };
    if (f.loja && g.lojas.indexOf(f.loja) < 0) g.lojas.push(f.loja);
    if (!g.sup && f.sup) g.sup = f.sup;
  });
  Object.keys(grupos).forEach(function (k) {
    var g = grupos[k], p = acha(g.tipo, g.nome, g.tipo === 'vend' ? g.lojas[0] : '');
    if (!p) {
      var cod;
      if (g.tipo === 'vend') { var id = idVend[g.lojas[0] + '|' + chaveNome_(g.nome)]; cod = id && !L.some(function (x) { return x.codigo === 'V' + id; }) ? 'V' + id : proximoCodigo_(L, 'V' + g.lojas[0] + '-'); }
      else cod = proximoCodigo_(L, g.tipo === 'ger' ? 'G' : g.tipo === 'sup' ? 'S' : 'C');
      p = { codigo: cod, nome: g.nome, cargo: g.tipo, lojas: g.lojas.slice(), supervisor: g.sup, ativo: true, apelidos: [], origem: 'bases', criado_em: new Date(), travado: false };
      L.push(p); pessoaGravar_(sh, p); novos++; return;
    }
    var antes = JSON.stringify([p.lojas, p.supervisor, p.apelidos]);
    if (chaveNome_(g.nome) !== chaveNome_(p.nome) && pessoaChaves_(p).indexOf(chaveNome_(g.nome)) < 0) p.apelidos.push(g.nome);
    if (!p.travado) {
      if (g.tipo === 'vend') p.lojas = g.lojas.slice();
      else g.lojas.forEach(function (c) { if (p.lojas.indexOf(c) < 0) p.lojas.push(c); });
      if (g.sup) p.supervisor = g.sup;
    }
    if (JSON.stringify([p.lojas, p.supervisor, p.apelidos]) !== antes) { pessoaGravar_(sh, p); mudou++; }
  });
  /* nomes usados no login que batem com uma pessoa só (mesma loja e mesmo cargo) viram apelido */
  try {
    acessoLog_().forEach(function (x) {
      if (L.some(function (p) { return pessoaChaves_(p).indexOf(chaveNome_(x.nome)) >= 0 && cargoCombina_(p.cargo, x.pf); })) return;
      var p = pessoaDe_(L, x.nome, x.lj, x.pf);
      if (p && pessoaChaves_(p).indexOf(chaveNome_(x.nome)) < 0) { p.apelidos.push(x.nome); pessoaGravar_(sh, p); mudou++; }
    });
  } catch (e) {}
  return { ok: true, novos: novos, atualizados: mudou, total: L.length };
}

/* ── tela "Cadastro da equipe" ── */
function pessoas_(c) {
  if (!lider_(c)) throw new Error('O cadastro é da gerência, supervisão e coordenação.');
  var L = pessoasLer_().L;
  if (!L.length && c.pf === 'coord' && !c.vc) { pessoasSincronizar_(); L = pessoasLer_().L; }
  var meu = function (p) {
    if (c.pf === 'coord') return true;
    if (p.cargo === 'sup' || p.cargo === 'coord') return c.pf === 'sup' && primeiroNome_(p.nome) === primeiroNome_(c.n);
    return p.lojas.some(function (l) { return c.lj.indexOf(l) >= 0; });
  };
  var lista = L.filter(meu).map(function (p) { return { codigo: p.codigo, nome: p.nome, cargo: p.cargo, lojas: p.lojas, supervisor: p.supervisor, ativo: p.ativo, apelidos: p.apelidos, travado: p.travado, origem: p.origem }; });
  /* último acesso por código (o registro guarda o código quando reconhece a pessoa) */
  var ult = {}, semDono = {};
  try {
    acessoLog_().forEach(function (x) {
      var p = x.codigo ? L.filter(function (q) { return q.codigo === x.codigo; })[0] : pessoaDe_(L, x.nome, x.lj, x.pf);
      if (p) { if (!ult[p.codigo] || x.em > ult[p.codigo]) ult[p.codigo] = x.em; return; }
      if (c.pf !== 'coord') return;
      var k = chaveNome_(x.nome); var s = semDono[k] = semDono[k] || { nome: x.nome, pf: x.pf, lojas: x.lj, ultimo: 0, n: 0 }; s.n++; if (x.em > s.ultimo) s.ultimo = x.em;
    });
  } catch (e) {}
  lista.forEach(function (p) { p.ultimo = ult[p.codigo] || null; });
  var lib = !c.vc ? liberadosApp_(c.n) : null;
  if (lib) lista.forEach(function (p) { if (p.cargo === 'vend') p.liberado = lib.some(function (v) { return (!v.loja || p.lojas.indexOf(v.loja) >= 0) && [p.nome].concat(p.apelidos).some(function (n) { return mesmo_(v.nome, n); }); }); });
  return { ok: true, perfil: c.pf, pessoas: lista, semDono: Object.keys(semDono).map(function (k) { return semDono[k]; }), liberadosConhecidos: lib !== null, cargos: CARGOS };
}
function pessoaSalvar_(c, d) {
  soCoord_(c);
  var P = pessoasLer_(), p = P.L.filter(function (x) { return x.codigo === String(d.codigo || ''); })[0];
  var novo = !p;
  if (novo) {
    var cargo = String(d.cargo || 'vend'); if (!CARGOS[cargo]) throw new Error('Cargo inválido.');
    var lj = cods_(d.lojas || []);
    var cod = cargo === 'vend' ? proximoCodigo_(P.L, 'V' + (lj[0] || '000') + '-') : proximoCodigo_(P.L, cargo === 'ger' ? 'G' : cargo === 'sup' ? 'S' : cargo === 'coord' ? 'C' : 'O');
    p = { codigo: cod, apelidos: [], origem: 'manual por ' + c.n, criado_em: new Date() };
  }
  /* apelidos antes do nome: o nome antigo entra como apelido depois */
  if (d.apelidos != null) p.apelidos = (Array.isArray(d.apelidos) ? d.apelidos : String(d.apelidos).split('|')).map(function (x) { return String(x).trim().slice(0, 80); }).filter(Boolean).filter(function (x, i, a) { return a.indexOf(x) === i; });
  if (d.nome != null) { var nn = String(d.nome).trim().slice(0, 80); if (!nn) throw new Error('Informe o nome.'); if (!novo && chaveNome_(nn) !== chaveNome_(p.nome) && pessoaChaves_(p).indexOf(chaveNome_(p.nome)) >= 0 && p.apelidos.indexOf(p.nome) < 0) p.apelidos.push(p.nome); p.nome = nn; }
  if (d.cargo != null) { if (!CARGOS[d.cargo]) throw new Error('Cargo inválido.'); p.cargo = d.cargo; }
  if (d.lojas != null) p.lojas = cods_(d.lojas);
  if (d.supervisor != null) p.supervisor = String(d.supervisor).trim().slice(0, 60);
  if (d.ativo != null) p.ativo = !!d.ativo;
  p.travado = true;
  /* um apelido não pode ser de duas pessoas do mesmo cargo na mesma loja */
  var conflito = P.L.filter(function (q) { return q.codigo !== p.codigo && q.ativo && cargoCombina_(q.cargo, p.cargo) && (!q.lojas.length || !p.lojas.length || q.lojas.some(function (l) { return p.lojas.indexOf(l) >= 0; })) && pessoaChaves_(q).some(function (k) { return pessoaChaves_(p).indexOf(k) >= 0; }); })[0];
  if (conflito) throw new Error('O nome "' + p.nome + '" (ou um apelido) já é de ' + conflito.nome + ' (' + conflito.codigo + '). Junte os dois ou use outro nome.');
  pessoaGravar_(P.sh, p);
  return { ok: true, codigo: p.codigo };
}
/* "nome sem dono" (veio do login) passa a ser apelido de uma pessoa */
function pessoaApelido_(c, d) {
  soCoord_(c);
  var P = pessoasLer_(), p = P.L.filter(function (x) { return x.codigo === String(d.codigo || ''); })[0];
  if (!p) throw new Error('Pessoa não encontrada.');
  var n = String(d.apelido || '').trim().slice(0, 80); if (!n) throw new Error('Informe o nome.');
  if (pessoaChaves_(p).indexOf(chaveNome_(n)) < 0) p.apelidos.push(n);
  pessoaGravar_(P.sh, p);
  return { ok: true, codigo: p.codigo, apelidos: p.apelidos };
}
/* junta dois cadastros da mesma pessoa: o segundo vira apelido do primeiro e fica inativo */
function pessoaJuntar_(c, d) {
  soCoord_(c);
  var P = pessoasLer_(), a = P.L.filter(function (x) { return x.codigo === String(d.manter || ''); })[0], b = P.L.filter(function (x) { return x.codigo === String(d.juntar || ''); })[0];
  if (!a || !b || a === b) throw new Error('Escolha as duas pessoas.');
  [b.nome].concat(b.apelidos).forEach(function (n) { if (pessoaChaves_(a).indexOf(chaveNome_(n)) < 0) a.apelidos.push(n); });
  b.lojas.forEach(function (l) { if (a.lojas.indexOf(l) < 0) a.lojas.push(l); });
  a.travado = true; b.ativo = false; b.travado = true; b.apelidos = []; b.origem = 'juntado em ' + a.codigo;
  pessoaGravar_(P.sh, a); pessoaGravar_(P.sh, b);
  return { ok: true, codigo: a.codigo };
}

/* lista de pessoas no formato do Painel de Acessos (gerente: uma linha por loja; supervisor: com a carteira) */
function rosterAcessos_() {
  var L = pessoasLer_().L.filter(function (p) { return p.ativo && (p.cargo === 'vend' || p.cargo === 'ger' || p.cargo === 'sup'); });
  if (!L.length) return null;
  var nomes = {}; try { var rk = blobOuMigra_('RANKING', ANTIGO_RANK).obj; ((rk && rk.lojas) || []).forEach(function (l) { nomes[pad3_(l.id)] = l.n; }); } catch (e) {}
  var out = [];
  L.forEach(function (p) {
    if (p.cargo === 'sup') { (p.lojas.length ? p.lojas : ['']).forEach(function (l) { out.push({ tipo: 'sup', nome: p.nome, loja: l, lojaNome: nomes[l] || '', sup: p.nome, codigo: p.codigo, apelidos: p.apelidos }); }); return; }
    (p.lojas.length ? p.lojas : ['']).forEach(function (l) { out.push({ tipo: p.cargo, nome: p.nome, loja: l, lojaNome: nomes[l] || '', sup: p.supervisor, codigo: p.codigo, apelidos: p.apelidos }); });
  });
  return out;
}

/* ───────────────────────── RESUMO DO PAINEL (aba PAINEL_RESUMO, gravada pelo servidor do Painel) ─────────────────────────
   Meta, realizado e projeção de lojas e vendedores, numa fonte só para as telas do app.
   Recorte: coordenação → rede; supervisor e gerente → as lojas deles; vendedor → só a linha dele. */
function painelResumo_(c) {
  var b = lerBlob_('PAINEL_RESUMO'), r = b.obj;
  if (!r) return { ok: true, resumo: null, em: null };
  var vale = function (cod) { return c.pf === 'coord' || c.lj.indexOf(pad3_(cod)) >= 0; };
  var lojas = (r.lojas || []).filter(function (l) { return vale(l.cod); }), vend = (r.vend || []).filter(function (v) { return vale(v.loja); });
  if (c.pf === 'vend') { vend = vend.filter(function (v) { return mesmo_(v.nome, c.n); }); lojas = []; }
  if (c.pf === 'outro') { lojas = []; vend = []; }
  return { ok: true, resumo: { periodo: r.periodo || null, lojas: lojas, vend: vend }, em: b.em };
}

/* ───────────────────────── PONTOS ST (gamificação) ─────────────────────────
   Os STs NÃO são gravados: são calculados a partir do que já está registrado (acessos, Mentor,
   PDI semanal, PDI Mensal e plano do supervisor). Mudar um valor da tabela recalcula tudo.
   Cada ponto vai para o CÓDIGO da pessoa no cadastro único. Ranking da semana (zera na segunda),
   do mês e do ano. Todos veem a rede; cada um vê o próprio extrato. */
var ST = {
  acesso: 5,                                   // 1 vez por dia
  aval_prazo: 30, aval_acerto: 5, aval_max: 50, posit_meta: 30,
  ger_pdi: 10, ger_loja100: 30, ger_fech: 5, ger_media8: 20, ger_revisao: 15,
  sup_plano: 40, sup_fech: 20, sup_carteira100: 50
};
var ST_ROTULO = { acesso: 'Entrou no app', aula: 'Aula concluída', video: 'Vídeo assistido', quiz: 'Prova do módulo aprovada', quiz_nota10: 'Nota 10 na prova',
  modulo: 'Módulo completo', conquista: 'Conquista desbloqueada', streak: 'Sequência de estudos', final: 'Avaliação final do Mentor', historia: 'Nossa História', valores: 'Propósito e valores', disc: 'Perfil DISC', tarefa: 'Tarefa da jornada', checklist: 'Checklist',
  aval: 'Avaliação do PDI semanal', posit: 'Meta de positivações da semana', ger_pdi: 'PDI semanal feito', ger_loja100: 'Loja com 100% dos PDIs feitos',
  ger_fech: 'Fechamento da semana', ger_media8: 'Equipe com média 8+ na avaliação', ger_revisao: 'Revisão do PDI Mensal',
  sup_plano: 'Plano semanal no prazo', sup_fech: 'Fechamento do plano', sup_carteira100: 'Carteira com 100% dos PDIs feitos' };

function diaDe_(x) {
  if (!x) return '';
  if (x instanceof Date) return Utilities.formatDate(x, 'America/Sao_Paulo', 'yyyy-MM-dd');
  var s = String(x).replace(/^'/, '');
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) { var d = new Date(s); if (!isNaN(d)) return Utilities.formatDate(d, 'America/Sao_Paulo', 'yyyy-MM-dd'); }
  return s.slice(0, 10);
}
function segundaDe_(dia) { var p = String(dia).split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])), w = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - w); return d.toISOString().slice(0, 10); }
function pfDoMentor_(perfil) { var p = String(perfil || '').toLowerCase(); return /coord/.test(p) ? 'coord' : /super/.test(p) ? 'sup' : /geren/.test(p) ? 'ger' : 'vend'; }

/* todos os eventos de pontos, já com o código da pessoa */
function stEventos_() {
  var L = pessoasLer_().L.filter(function (p) { return p.ativo; }), ev = [];
  var porCod = {}; L.forEach(function (p) { porCod[p.codigo] = p; });
  var quem = function (nome, lj, pf) { var p = pessoaDe_(L, nome, lj || [], pf); if (!p && pf) p = pessoaDe_(L, nome, lj || [], null); return p; };
  var add = function (p, dia, pts, tipo, desc) { if (p && dia && pts) ev.push({ c: p.codigo, d: dia, p: pts, t: tipo, x: desc || '' }); };

  /* 1) acesso: 1 vez por dia */
  try {
    var vistos = {};
    acessoLog_(400).forEach(function (x) {
      var p = x.codigo ? porCod[x.codigo] : quem(x.nome, x.lj, x.pf); if (!p) return;
      var k = p.codigo + '|' + x.dia; if (vistos[k]) return; vistos[k] = 1;
      add(p, x.dia, ST.acesso, 'acesso', '');
    });
  } catch (e) {}

  /* 2) Mentor: os pontos que a trilha já dá (aula, vídeo, prova, módulo…) */
  try {
    mentorLinhas_().v.forEach(function (r) {
      var o = mentorObj_(r); if (!o || !o.xp || !o.xp.length) return;
      var u = o.usuario || {}, p = quem(r[2] || u.nome, [pad3_(r[1] || u.loja_id)].filter(Boolean), pfDoMentor_(u.perfil)); if (!p) return;
      /* login_diario do Mentor já é o 'Entrou no app' (contado 1 vez por dia acima): não soma de novo */
      (Array.isArray(o.xp) ? o.xp : []).forEach(function (x) { if (/login|acesso/i.test(String(x.tipo || ''))) return; add(p, diaDe_(x.criado_em), Number(x.xp) || 0, x.tipo || 'mentor', x.referencia || ''); });
    });
  } catch (e) {}

  /* 3) PDI semanal */
  var S = semanaLinhas_().v.map(semanaObj_).filter(function (o) { return o.chave && o.status !== 'fora'; });
  var porSemLoja = {};
  S.forEach(function (o) {
    var k = o.semana + '|' + o.loja; (porSemLoja[k] = porSemLoja[k] || []).push(o);
    var d = o.dados || {}, prazo = d.prazo || '', v = quem(o.vendedor, [o.loja], 'vend');
    if (o.aval && o.aval.em && (!prazo || String(o.aval.em) <= prazo)) {
      add(v, diaDe_(o.aval.em), ST.aval_prazo, 'aval', 'no prazo');
      add(v, diaDe_(o.aval.em), Math.min(ST.aval_max, ST.aval_acerto * (Number(o.aval.nota) || 0)), 'aval', (o.aval.nota || 0) + '/' + (o.aval.total || 10) + ' acertos');
    }
    var f = o.fechamento;
    if (f && Number(f.posit) >= Number((d.comp && d.comp.positMeta) || 10)) add(v, diaDe_(f.em), ST.posit_meta, 'posit', f.posit + ' positivações');
    if (o.feito_em && o.feito_por) add(quem(o.feito_por, [o.loja], 'ger'), diaDe_(o.feito_em), ST.ger_pdi, 'ger_pdi', o.vendedor);
    if (f && f.por) add(quem(f.por, [o.loja], 'ger'), diaDe_(f.em), ST.ger_fech, 'ger_fech', o.vendedor);
  });
  var gerentesDa = function (loja) { return L.filter(function (p) { return p.cargo === 'ger' && p.lojas.indexOf(loja) >= 0; }); };
  Object.keys(porSemLoja).forEach(function (k) {
    var A = porSemLoja[k], loja = k.split('|')[1], feitos = A.filter(function (o) { return o.feito_em; });
    if (A.length && feitos.length === A.length) {
      var ult = feitos.map(function (o) { return diaDe_(o.feito_em); }).sort().pop();
      gerentesDa(loja).forEach(function (g) { add(g, ult, ST.ger_loja100, 'ger_loja100', 'loja ' + loja); });
    }
    var R = A.filter(function (o) { return o.aval && o.aval.total; });
    if (R.length && R.length * 2 >= A.length) {
      var med = R.reduce(function (s, o) { return s + o.aval.nota / o.aval.total * 10; }, 0) / R.length;
      if (med >= 8) { var dd = R.map(function (o) { return diaDe_(o.aval.em); }).sort().pop(); gerentesDa(loja).forEach(function (g) { add(g, dd, ST.ger_media8, 'ger_media8', 'média ' + med.toFixed(1)); }); }
    }
  });

  /* 4) PDI Mensal: revisão registrada */
  try {
    var AC = lerAcomp_();
    Object.keys(AC).forEach(function (ch) {
      var a = AC[ch], revs = (a.estado && a.estado.revisoes) || [];
      revs.forEach(function (r) { if (r && r.por) add(quem(r.por, [a.loja], 'ger'), diaDe_(r.d), ST.ger_revisao, 'ger_revisao', ''); });
    });
  } catch (e) {}

  /* 5) supervisor: plano, fechamento e carteira 100% */
  try {
    supLinhas_().v.map(supObj_).filter(function (o) { return o.chave; }).forEach(function (o) {
      var d = o.dados || {}, sp = quem(o.supervisor, [], 'sup'), pl = o.plano, fe = o.fechamento;
      if (pl && pl.em && (!d.prazo || String(pl.em) <= d.prazo)) add(sp, diaDe_(pl.em), ST.sup_plano, 'sup_plano', '');
      if (fe && fe.em) add(sp, diaDe_(fe.em), ST.sup_fech, 'sup_fech', '');
      var cods = (d.carteira && d.carteira.cods) || [];
      if (cods.length) {
        var A = S.filter(function (x) { return x.semana === o.semana && cods.indexOf(x.loja) >= 0; });
        if (A.length && A.every(function (x) { return x.feito_em; })) add(sp, A.map(function (x) { return diaDe_(x.feito_em); }).sort().pop(), ST.sup_carteira100, 'sup_carteira100', '');
      }
    });
  } catch (e) {}
  return { ev: ev, L: L };
}

function pontos_(c) {
  var R = stEventos_(), L = R.L, hoje = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
  var seg = segundaDe_(hoje), mes = hoje.slice(0, 7), ano = hoje.slice(0, 4);
  var tot = {};
  R.ev.forEach(function (e) {
    var t = tot[e.c] = tot[e.c] || { s: 0, m: 0, a: 0 };
    if (e.d.slice(0, 4) === ano) t.a += e.p;
    if (e.d.slice(0, 7) === mes) t.m += e.p;
    if (e.d >= seg && e.d <= hoje) t.s += e.p;
  });
  var linha = function (p) { var t = tot[p.codigo] || { s: 0, m: 0, a: 0 }; return { codigo: p.codigo, nome: p.nome, cargo: p.cargo, loja: p.lojas[0] || '', lojas: p.lojas, sup: p.supervisor, s: t.s, m: t.m, a: t.a }; };
  var pessoas = L.filter(function (p) { return p.cargo === 'vend' || p.cargo === 'ger' || p.cargo === 'sup'; }).map(linha);
  /* lojas: média por pessoa (vendedores + gerente), para loja pequena competir com loja grande */
  var lojas = {};
  pessoas.forEach(function (p) { if (p.cargo === 'sup') return; p.lojas.forEach(function (l) { var o = lojas[l] = lojas[l] || { loja: l, n: 0, s: 0, m: 0, a: 0, sup: p.sup }; o.n++; o.s += p.s; o.m += p.m; o.a += p.a; }); });
  var nomes = {}; try { var rk = blobOuMigra_('RANKING', ANTIGO_RANK).obj; ((rk && rk.lojas) || []).forEach(function (l) { nomes[pad3_(l.id)] = l.n; }); } catch (e) {}
  var LJ = Object.keys(lojas).map(function (k) { var o = lojas[k]; return { loja: k, nome: nomes[k] || '', sup: o.sup, n: o.n, s: Math.round(o.s / o.n), m: Math.round(o.m / o.n), a: Math.round(o.a / o.n), ts: o.s, tm: o.m, ta: o.a }; });
  /* eu */
  var eu = c.vc ? null : pessoaDe_(L, c.n, c.lj, c.pf);
  var extrato = eu ? R.ev.filter(function (e) { return e.c === eu.codigo; }).sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : 0; }).slice(0, 60)
    .map(function (e) { return { d: e.d, p: e.p, r: ST_ROTULO[e.t] || e.t, x: e.x }; }) : [];
  return { ok: true, hoje: hoje, semana: seg, mes: mes, ano: ano, tabela: ST, rotulos: ST_ROTULO,
    pessoas: pessoas, lojas: LJ, eu: eu ? linha(eu) : null, extrato: extrato, perfil: c.pf };
}
