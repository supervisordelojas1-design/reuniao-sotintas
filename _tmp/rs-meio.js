/* ═══════════ RESUMO SEMANAL v2 — PDF: página da loja + PDI semanal de cada vendedor ═══════════
   Por vendedor, 3 compromissos da semana:
     1) 1 indicador CPF (o mais longe da meta), com ação e o que o gerente observa;
     2) positivação CNPJ: lista de 20 clientes da carteira sem compra no mês, meta 10 na semana (2 por dia útil);
     3) 5 orçamentos em aberto para retornar (os de maior valor).
   Vai para o gerente (e-mail na aba USUARIOS; sem cadastro, o e-mail da loja) com cópia para o supervisor. */
var RS_IND = [
  { k: 'ident', i: 7, nome: '% Identificação CPF', meta: 0.8, maior: true, fmt: 'pct',
    acao: 'Pedir o CPF logo no início do atendimento, antes de passar o preço ("para eu consultar seu cadastro e as promoções").',
    obs: 'Em quantos atendimentos ele pediu o CPF antes de cotar.' },
  { k: 'itens', i: 8, nome: 'Itens por venda CPF', meta: 2.5, maior: true, fmt: 'dec',
    acao: 'Em toda venda de tinta, oferecer o kit de aplicação: rolo, fita crepe, lixa e solvente.',
    obs: 'Em quantas vendas ele ofereceu pelo menos 1 complemento.' },
  { k: 'ticket', i: 9, nome: 'Ticket médio CPF', meta: 200, maior: true, fmt: 'brl',
    acao: 'Apresentar primeiro a linha superior e a embalagem maior, explicando rendimento e durabilidade.',
    obs: 'Se ele mostrou a opção de maior valor antes da mais barata.' },
  { k: 'desc', i: 10, nome: '% Desconto CPF', meta: 0.07, maior: false, fmt: 'pct',
    acao: 'Defender o preço com benefício (rendimento, garantia, cor certa) antes de oferecer desconto.',
    obs: 'Quantas vendas fechou sem desconto ou abaixo de 7%.' }
];
var RS_META_POSIT = 10, RS_LISTA_POSIT = 20, RS_ORC = 5;

function rsFmt_(f, v) {
  if (v == null || !isFinite(v)) return '—';
  if (f === 'pct') return (v * 100).toFixed(1).replace('.', ',') + '%';
  if (f === 'dec') return Number(v).toFixed(2).replace('.', ',');
  if (f === 'brl') return rsBrl_(v);
  return String(Math.round(v));
}
function rsOk_(ind, v) { return v == null ? null : ind.maior ? v >= ind.meta : v <= ind.meta; }
function rsGap_(ind, v) { if (v == null || !isFinite(v)) return -1; return ind.maior ? (ind.meta - v) / ind.meta : (v - ind.meta) / ind.meta; }
function rsSeta_(atual, antes, maior) {
  if (antes == null || atual == null || !isFinite(antes) || !isFinite(atual) || Math.abs(atual - antes) < 1e-9) return '';
  var sobe = atual > antes, bom = maior ? sobe : !sobe;
  return ' <span style="color:' + (bom ? '#128a52' : '#c42a22') + ';font-weight:800">' + (sobe ? '▲' : '▼') + '</span>';
}
function rsCor_(p) { return p == null ? '#5a677f' : p >= 1 ? '#128a52' : p >= 0.95 ? '#b7791f' : '#c42a22'; }
function rsSemaforo_(ok) { return ok == null ? '<span style="color:#8a94a6">—</span>' : ok ? '<span style="color:#128a52;font-weight:800">● ok</span>' : '<span style="color:#c42a22;font-weight:800">● abaixo</span>'; }
function rsDiaBr_(d) { return Utilities.formatDate(d, 'America/Sao_Paulo', 'dd/MM'); }

/* foto da semana anterior (para as setas ▲▼) */
function rsChaveV_(n) { return (typeof chaveVendPainel_ === 'function' ? chaveVendPainel_(n) : rsNome_(n).toUpperCase()); }
function rsSnapLer_(cod) { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('RS_SNAP_' + cod) || 'null'); } catch (e) { return null; } }
function rsSnapGravar_(cod, l, P) {
  var o = { em: String(P[2] || ''), mes: String(P[2] || '').slice(0, 7), pct: l[3] ? l[5] / l[3] : null, v: {} };
  (l[9] || []).forEach(function (v) { var C = v.slice(4); o.v[rsChaveV_(v[0])] = { pct: v[1] ? v[2] / v[1] : null, c: [C[7], C[8], C[9], C[10], C[5]] }; });
  try { PropertiesService.getScriptProperties().setProperty('RS_SNAP_' + cod, JSON.stringify(o)); } catch (e) {}
}

/* carteira e orçamentos do vendedor */
function rsCarteira_(K, cod) {
  var k = K && (K[cod] || K[String(Number(cod))]); if (!k || !k.c) return [];
  return k.c.map(function (c) {
    var pv = String(c[0]).split(/ - VEND\.?:\s*/i);
    return { cli: pv[0].trim(), vend: pv.length > 1 ? pv[1] : '', media: Number(c[1]) || 0, meses: Number(c[2]) || 0, proj: Number(c[3]) || 0, fat: c[4] == null || c[4] === '' ? null : Number(c[4]) };
  });
}
function rsSemCompra_(c) { return c.media > 0 && (c.fat != null ? c.fat <= 0 : c.proj <= 0); }
function rsOrcs_(O, cod) {
  var o = O && (O[cod] || O[String(Number(cod))]); if (!o) return [];
  var hoje = new Date();
  return o.map(function (r) {
    var d = r[2] instanceof Date ? r[2] : new Date(String(r[2]).replace(/^(\d{1,2})\/(\d{1,2})\/(\d{4}).*/, '$3-$2-$1'));
    return { vend: r[0], data: d, dias: isNaN(d) ? null : Math.max(0, Math.round((hoje - d) / 864e5)), cli: r[3], tel: r[4], valor: Number(r[5]) || 0 };
  });
}

/* ---------- HTML do PDF ---------- */
var RS_CSS = '<style>' +
  '@page{size:A4;margin:12mm}body{font-family:Arial,Helvetica,sans-serif;color:#16233d;font-size:10.5px;margin:0}' +
  '.pg{page-break-after:always}.pg:last-child{page-break-after:auto}' +
  '.topo{background:#1C3F8F;color:#fff;padding:10px 14px;border-bottom:4px solid #FFD200}.topo .s{font-size:10px;opacity:.85}.topo .t{font-size:17px;font-weight:bold}' +
  'h3{font-size:12px;margin:12px 0 5px;color:#1C3F8F;text-transform:uppercase;letter-spacing:.3px}' +
  'table{width:100%;border-collapse:collapse}th{background:#eef2fb;text-align:left;padding:4px 5px;font-size:9.5px}td{padding:3px 5px;border-bottom:1px solid #e4e9f3;vertical-align:top;font-size:10px}.lista td{padding:2px 5px;font-size:9.5px}' +
  '.r{text-align:right;white-space:nowrap}.kp td{border:1px solid #e4e9f3;text-align:center;padding:6px}.kp .l{font-size:9px;color:#5a677f}.kp .v{font-size:14px;font-weight:bold}' +
  '.box{border:1.5px solid #1C3F8F;border-radius:6px;padding:7px 9px;margin-top:6px}.n{display:inline-block;background:#E30613;color:#fff;font-weight:bold;width:16px;height:16px;text-align:center;border-radius:8px;margin-right:5px}' +
  '.ck{width:12px;height:12px;border:1.3px solid #16233d;display:inline-block}.ass td{border:0;padding-top:22px;text-align:center}.ass span{display:block;border-top:1px solid #16233d;padding-top:3px}' +
  '.mut{color:#5a677f}</style>';

function rsPaginaLoja_(l, P, pdi, ger, ctx) {
  var UT = Number(P[3]) || 0, UD = Number(P[4]) || 0, UR = Math.max(UT - UD, 0);
  var meta = Number(l[3]) || 0, fat = Number(l[5]) || 0, proj = Number(l[6]) || (UD ? fat / UD * UT : fat);
  var pct = meta ? fat / meta : null, pj = meta ? proj / meta : null, falta = Math.max(meta - fat, 0);
  var ant = ctx.snap && ctx.snap.mes === String(P[2] || '').slice(0, 7) ? ctx.snap : null;
  var C = l[8] || [], atv = Number(C[3]) || 0;
  var h = '<div class="pg"><div class="topo"><div class="s">Só Tintas · Resumo semanal · semana de ' + ctx.semana + '</div><div class="t">Loja ' + rsEsc_(cod3Painel_(l[0])) + ' · ' + rsEsc_(l[1]) + '</div>' +
    '<div class="s">Gerente: ' + rsEsc_(ger.gerente || '—') + ' · Supervisor: ' + rsEsc_(rsNome_(l[2]) || '—') + ' · dados até ' + rsDataBr_(P[2]) + ' · ' + UD + ' de ' + UT + ' dias úteis</div></div>';
  h += '<h3>Meta da loja</h3><table class="kp"><tr>' +
    '<td><div class="l">Meta</div><div class="v">' + rsBrl_(meta) + '</div></td>' +
    '<td><div class="l">Realizado</div><div class="v">' + rsBrl_(fat) + '</div></td>' +
    '<td><div class="l">Atingido</div><div class="v" style="color:' + rsCor_(pct) + '">' + rsPct_(pct) + '</div>' + (ant && ant.pct != null ? '<div class="l">semana passada ' + rsPct_(ant.pct) + '</div>' : '') + '</td>' +
    '<td><div class="l">Projeção</div><div class="v" style="color:' + rsCor_(pj) + '">' + rsPct_(pj) + '</div></td>' +
    '<td><div class="l">Falta</div><div class="v">' + rsBrl_(falta) + '</div></td>' +
    '<td><div class="l">Precisa por dia útil</div><div class="v">' + rsBrl_(UR ? falta / UR : 0) + '</div><div class="l">' + UR + ' dias úteis</div></td></tr></table>';
  /* indicadores */
  var linhas = RS_IND.map(function (ind) { var v = ind.i === 7 || ind.i === 10 ? C[ind.i] : C[ind.i]; return '<tr><td>' + ind.nome + '</td><td class="r">' + rsFmt_(ind.fmt, v) + '</td><td class="r">' + (ind.maior ? '≥ ' : '≤ ') + rsFmt_(ind.fmt, ind.meta) + '</td><td>' + rsSemaforo_(rsOk_(ind, v)) + '</td></tr>'; });
  var alc = C[0] ? C[1] / C[0] : null;
  linhas.push('<tr><td>Faturamento CNPJ</td><td class="r">' + rsBrl_(C[1]) + '</td><td class="r">meta ' + rsBrl_(C[0]) + '</td><td>' + rsSemaforo_(alc == null ? null : alc >= UD / Math.max(UT, 1)) + ' <span class="mut">' + rsPct_(alc) + ' da meta</span></td></tr>');
  linhas.push('<tr><td>Positivados CNPJ</td><td class="r">' + (Number(C[5]) || 0) + '</td><td class="r">de ' + atv + ' ativos</td><td class="mut">' + rsPct_(atv ? C[5] / atv : null) + ' da carteira ativa</td></tr>');
  linhas.push('<tr><td>Clientes novos CNPJ</td><td class="r">' + (Number(C[4]) || 0) + '</td><td class="r">no mês</td><td></td></tr>');
  h += '<h3>Indicadores da loja</h3><table><tr><th>Indicador</th><th class="r">Loja</th><th class="r">Meta</th><th>Situação</th></tr>' + linhas.join('') + '</table>';
  /* time */
  h += '<h3>O time na semana</h3><table><tr><th>Vendedor</th><th class="r">Meta</th><th class="r">Realizado</th><th class="r">Atingido</th><th class="r">Projeção</th><th class="r">Por dia</th><th>Foco da semana</th></tr>' +
    ctx.vends.map(function (v) {
      return '<tr><td>' + rsEsc_(v.nome) + '</td><td class="r">' + rsBrl_(v.meta) + '</td><td class="r">' + rsBrl_(v.fat) + '</td><td class="r">' + rsPct_(v.pct) + rsSeta_(v.pct, v.ant && v.ant.pct, true) + '</td><td class="r" style="color:' + rsCor_(v.pp) + ';font-weight:bold">' + rsPct_(v.pp) + '</td><td class="r">' + rsBrl_(v.dia) + '</td><td>' + rsEsc_(v.foco ? v.foco.nome : 'Manter os indicadores') + '</td></tr>';
    }).join('') + '</table>';
  /* dinheiro na mesa */
  var semCompra = ctx.cart.filter(rsSemCompra_), orc = ctx.orc;
  h += '<h3>Dinheiro na mesa</h3><table><tr><td><b>' + orc.length + '</b> orçamentos em aberto, somando <b>' + rsBrl_(orc.reduce(function (a, o) { return a + o.valor; }, 0)) + '</b></td>' +
    '<td><b>' + semCompra.length + '</b> clientes CNPJ da carteira ainda sem compra no mês (média de <b>' + rsBrl_(semCompra.reduce(function (a, c) { return a + c.media; }, 0)) + '</b>/mês)</td></tr></table>';
  /* PDI */
  var pd = pdi || { venc: [], prox: [] };
  h += '<h3>PDI</h3><p style="margin:0">' + (pd.venc.length ? '<b style="color:#c42a22">Revisões vencidas (' + pd.venc.length + '):</b> ' + pd.venc.map(function (x) { return rsEsc_(x.nome) + ' (' + rsDataBr_(x.d) + ')'; }).join(' · ') + '<br>' : '') +
    (pd.prox.length ? '<b>Revisões nesta semana:</b> ' + pd.prox.map(function (x) { return rsEsc_(x.nome) + ' (' + rsDataBr_(x.d) + ')'; }).join(' · ') : (pd.venc.length ? '' : '<span class="mut">Nenhuma revisão vencida ou marcada para esta semana.</span>')) + '</p>';
  h += '<p class="mut" style="margin-top:10px">Nas próximas páginas: o PDI semanal de cada vendedor. Sugestão de ritual: na segunda, 10 minutos com cada um, combinar os 3 compromissos e assinar; na segunda seguinte, conferir antes de combinar os novos.</p></div>';
  return h;
}

function rsPaginaVend_(v, l, P, ctx) {
  var UT = Number(P[3]) || 0, UD = Number(P[4]) || 0, UR = Math.max(UT - UD, 0);
  var C = v.C, ant = v.ant;
  var h = '<div class="pg"><div class="topo"><div class="s">PDI semanal · semana de ' + ctx.semana + ' · Loja ' + rsEsc_(cod3Painel_(l[0])) + ' ' + rsEsc_(l[1]) + '</div><div class="t">' + rsEsc_(v.nome) + '</div></div>';
  h += '<h3>Números do mês</h3><table class="kp"><tr>' +
    '<td><div class="l">Meta</div><div class="v">' + rsBrl_(v.meta) + '</div></td><td><div class="l">Realizado</div><div class="v">' + rsBrl_(v.fat) + '</div></td>' +
    '<td><div class="l">Atingido</div><div class="v" style="color:' + rsCor_(v.pct) + '">' + rsPct_(v.pct) + '</div>' + (ant && ant.pct != null ? '<div class="l">semana passada ' + rsPct_(ant.pct) + '</div>' : '') + '</td>' +
    '<td><div class="l">Projeção</div><div class="v" style="color:' + rsCor_(v.pp) + '">' + rsPct_(v.pp) + '</div></td>' +
    '<td><div class="l">Precisa por dia útil</div><div class="v">' + rsBrl_(v.dia) + '</div><div class="l">' + UR + ' dias úteis</div></td></tr></table>';
  h += '<h3>Indicadores</h3><table><tr><th>Indicador</th><th class="r">Ele</th><th class="r">Meta</th><th>Situação</th></tr>' +
    RS_IND.map(function (ind, j) { var x = C[ind.i]; return '<tr' + (v.foco && v.foco.k === ind.k ? ' style="background:#fff8d6"' : '') + '><td>' + ind.nome + (v.foco && v.foco.k === ind.k ? ' <b>← foco</b>' : '') + '</td><td class="r">' + rsFmt_(ind.fmt, x) + rsSeta_(x, ant && ant.c && ant.c[j], ind.maior) + '</td><td class="r">' + (ind.maior ? '≥ ' : '≤ ') + rsFmt_(ind.fmt, ind.meta) + '</td><td>' + rsSemaforo_(rsOk_(ind, x)) + '</td></tr>'; }).join('') +
    '<tr><td>Positivados CNPJ no mês</td><td class="r">' + (Number(C[5]) || 0) + rsSeta_(Number(C[5]) || 0, ant && ant.c && ant.c[4], true) + '</td><td class="r">≥ 10</td><td>' + rsSemaforo_((Number(C[5]) || 0) >= 10) + '</td></tr></table>';
  h += '<h3>Os 3 compromissos da semana</h3>';
  var f = v.foco;
  h += '<div class="box"><span class="n">1</span><b>Indicador: ' + (f ? f.nome + ' — de ' + rsFmt_(f.fmt, C[f.i]) + ' para ' + (f.maior ? '≥ ' : '≤ ') + rsFmt_(f.fmt, f.meta) : 'manter todos os indicadores na meta') + '</b>' +
    (f ? '<br><b>Ação:</b> ' + rsEsc_(f.acao) + '<br><b>O que o gerente observa:</b> ' + rsEsc_(f.obs) : '<br>Todos os indicadores CPF estão na meta: o foco é volume, com os compromissos 2 e 3.') + '</div>';
  h += '<div class="box"><span class="n">2</span><b>Positivação CNPJ: meta de ' + RS_META_POSIT + ' clientes na semana (2 por dia útil)</b> <span class="mut">— lista de ' + v.lista.length + ' clientes da carteira sem compra no mês</span>' +
    '<table class="lista" style="margin-top:4px"><tr><th style="width:16px"></th><th>Cliente</th><th class="r">Média/mês</th><th class="r">Meses com compra</th><th>Retorno</th></tr>' +
    (v.lista.length ? v.lista.map(function (c) { return '<tr><td><span class="ck"></span></td><td>' + rsEsc_(String(c.cli).slice(0, 48)) + (c.daLoja ? ' <span class="mut">(sem vendedor)</span>' : '') + '</td><td class="r">' + rsBrl_(c.media) + '</td><td class="r">' + (c.meses || '—') + '</td><td style="width:28%"></td></tr>'; }).join('') : '<tr><td></td><td colspan="4" class="mut">Sem clientes da carteira sem compra neste mês.</td></tr>') + '</table></div>';
  h += '<div class="box"><span class="n">3</span><b>Orçamentos em aberto: retornar os ' + RS_ORC + ' de maior valor</b>' +
    '<table style="margin-top:4px"><tr><th style="width:16px"></th><th>Cliente</th><th>Telefone</th><th class="r">Valor</th><th class="r">Dias</th><th>Resultado</th></tr>' +
    (v.orcs.length ? v.orcs.map(function (o) { return '<tr><td><span class="ck"></span></td><td>' + rsEsc_(String(o.cli || '').slice(0, 40)) + '</td><td>' + rsEsc_(o.tel || '') + '</td><td class="r">' + rsBrl_(o.valor) + '</td><td class="r">' + (o.dias == null ? '—' : o.dias) + '</td><td style="width:26%"></td></tr>'; }).join('') : '<tr><td></td><td colspan="5" class="mut">Nenhum orçamento em aberto no nome dele.</td></tr>') + '</table></div>';
  h += '<h3>Combinado da semana</h3><div style="border:1px solid #c9d2e3;height:44px;border-radius:6px"></div>' +
    '<table class="ass"><tr><td><span>' + rsEsc_(v.nome) + '</span></td><td><span>Gerente</span></td><td><span>Data</span></td></tr></table></div>';
  return h;
}

/* monta tudo de uma loja: e-mail curto + PDF */
function rsMontarLoja_(l, P, K, O, pdi, ger) {
  var cod = cod3Painel_(l[0]), UT = Number(P[3]) || 0, UD = Number(P[4]) || 0, UR = Math.max(UT - UD, 0);
  var hoje = new Date(), seg = new Date(hoje); seg.setDate(hoje.getDate() - ((hoje.getDay() + 6) % 7)); var sab = new Date(seg); sab.setDate(seg.getDate() + 5);
  var snap = rsSnapLer_(cod), mesmoMes = snap && snap.mes === String(P[2] || '').slice(0, 7);
  var cart = rsCarteira_(K, cod), orcAll = rsOrcs_(O, cod);
  var semDono = cart.filter(function (c) { return rsSemCompra_(c) && !(l[9] || []).some(function (v) { return c.vend && mesmoVendPainel_(c.vend, v[0]); }); }).sort(function (a, b) { return b.media - a.media; });
  var usadosSemDono = 0;
  var vends = (l[9] || []).filter(function (v) { return Number(v[1]) > 3 && !(ger && ger.gerente && rsEhGerente_(v[0], ger.gerente, cod3Painel_(l[0]))); }).map(function (v) {
    var C = v.slice(4), m = Number(v[1]) || 0, f = Number(v[2]) || 0, pj = UD ? f / UD * UT : f;
    var foco = null, gapMax = 0; RS_IND.forEach(function (ind) { var g = rsGap_(ind, C[ind.i]); if (Number(C[6]) > 0 && g > gapMax) { gapMax = g; foco = ind; } });
    var lista = cart.filter(function (c) { return c.vend && mesmoVendPainel_(c.vend, v[0]) && rsSemCompra_(c); }).sort(function (a, b) { return b.media - a.media; }).slice(0, RS_LISTA_POSIT);
    while (lista.length < RS_LISTA_POSIT && usadosSemDono < semDono.length) { var x = semDono[usadosSemDono++]; lista.push({ cli: x.cli, media: x.media, meses: x.meses, daLoja: true }); }
    var orcs = orcAll.filter(function (o) { return mesmoVendPainel_(o.vend, v[0]); }).sort(function (a, b) { return b.valor - a.valor; }).slice(0, RS_ORC);
    return { nome: rsNome_(v[0]), meta: m, fat: f, pct: m ? f / m : null, pp: m ? pj / m : null, dia: UR ? Math.max(m - f, 0) / UR : 0, C: C, foco: foco, lista: lista, orcs: orcs,
      ant: mesmoMes && snap.v ? snap.v[rsChaveV_(v[0])] || null : null };
  }).sort(function (a, b) { return (a.pp || 0) - (b.pp || 0); });
  var ctx = { semana: rsDiaBr_(seg) + ' a ' + rsDiaBr_(sab), vends: vends, cart: cart, orc: orcAll, snap: snap };
  var html = '<!DOCTYPE html><html><head><meta charset="utf-8">' + RS_CSS + '</head><body>' + rsPaginaLoja_(l, P, pdi, ger, ctx) + vends.map(function (v) { return rsPaginaVend_(v, l, P, ctx); }).join('') + '</body></html>';
  var nomeArq = ('Resumo semanal - Loja ' + cod + ' ' + l[1] + ' - ' + Utilities.formatDate(hoje, 'America/Sao_Paulo', 'dd-MM-yyyy') + '.pdf').replace(/[\\/:*?"<>|]+/g, ' ');
  var pdf = Utilities.newBlob(html, 'text/html', 'resumo.html').getAs('application/pdf').setName(nomeArq);
  /* corpo curto do e-mail */
  var meta = Number(l[3]) || 0, fat = Number(l[5]) || 0, proj = Number(l[6]) || 0, pj = meta ? proj / meta : null;
  var abaixo = vends.filter(function (v) { return v.pp != null && v.pp < 0.95; });
  var corpo = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;color:#16233d">' +
    '<div style="background:#1C3F8F;color:#fff;padding:14px 16px;border-radius:10px 10px 0 0;border-bottom:4px solid #FFD200"><div style="font-size:12px;opacity:.85">Só Tintas · resumo semanal · ' + ctx.semana + '</div><div style="font-size:19px;font-weight:bold">Loja ' + cod + ' · ' + rsEsc_(l[1]) + '</div></div>' +
    '<p>Bom dia, ' + rsEsc_(String(ger.gerente || '').split(' ')[0]) + '! A loja está com <b>' + rsPct_(meta ? fat / meta : null) + '</b> da meta e projeção de <b style="color:' + rsCor_(pj) + '">' + rsPct_(pj) + '</b>. Faltam <b>' + rsBrl_(Math.max(meta - fat, 0)) + '</b> (' + rsBrl_(UR ? Math.max(meta - fat, 0) / UR : 0) + ' por dia útil).</p>' +
    (abaixo.length ? '<p style="color:#c42a22"><b>Abaixo do ritmo:</b> ' + abaixo.map(function (v) { return rsEsc_(v.nome) + ' (' + rsPct_(v.pp) + ')'; }).join(' · ') + '</p>' : '<p style="color:#128a52"><b>Todo o time no ritmo da meta.</b></p>') +
    (typeof rsAcessosHtml_ === 'function' ? rsAcessosHtml_(cod, vends, ger) : '') +
    '<p>No <b>PDF anexo</b> estão a página da loja e o <b>PDI semanal de cada vendedor</b>, com os 3 compromissos da semana: 1 indicador, ' + RS_META_POSIT + ' positivações CNPJ (lista de ' + RS_LISTA_POSIT + ' clientes) e ' + RS_ORC + ' orçamentos para retornar. Imprima, converse 10 minutos com cada um e colha as assinaturas.</p>' +
    '<p><a href="' + RS_APP + '" style="background:#1C3F8F;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:bold;display:inline-block">Abrir o Só Tintas App</a></p></div>';
  return { pdf: pdf, corpo: corpo, assunto: 'Só Tintas · Resumo semanal · Loja ' + cod + ' ' + l[1] + ' · ' + rsPct_(pj) + ' projetado', vendedores: vends.length, vends: vends };
}

/* e-mail dos supervisores (aba USUARIOS: papel Supervisor, primeiro nome igual ao da coluna de supervisor do painel) */
function rsSupervisores_() {
  var vu = SpreadsheetApp.openById(ATAS_ID).getSheetByName('USUARIOS').getDataRange().getValues();
  var hu = vu[0].map(function (c) { return String(c).toLowerCase().trim(); }), iE = hu.indexOf('e-mail'), iP = hu.indexOf('papel'), iA = hu.indexOf('ativo');
  return vu.slice(1).filter(function (r) { return r[0] && /supervis/i.test(String(r[iP])) && (iA < 0 || !/^n/i.test(String(r[iA]))) && /@/.test(String(r[iE] || '')); })
    .map(function (r) { return { nome: String(r[0]), email: String(r[iE]).trim() }; });
}
function rsEmailSup_(sups, nomeSup) { var a = sups.filter(function (s) { return mesmaPessoaPainel_(s.nome, nomeSup); }); return a.length === 1 ? a[0].email : ''; }

/* envio: gerente (ou e-mail da loja) com cópia para o supervisor; em modo teste vai tudo só para o dono */
function rsEnviar_(soCod, limite) {
  var teste = PropertiesService.getScriptProperties().getProperty('RESUMO_MODO') !== 'real';
  var dono = Session.getEffectiveUser().getEmail();
  var d = montarDados(), K = null, O = null;
  try { K = lerCarteira(); } catch (e) {} try { O = lerOrcamentos(); } catch (e) {}
  var G = rsGerentes_(), PD = rsPdi_(), SUP = []; try { SUP = rsSupervisores_(); } catch (e) {} try { if (!soCod) atualizarCadastroAcessos(d, G); } catch (eC) {}
  var rel = [], enviados = 0;
  (d.L || []).forEach(function (l) {
    var cod = cod3Painel_(l[0]);
    if (soCod && cod !== soCod) return;
    if (limite && enviados >= limite) return;
    var g0 = G[cod] || null, lj = RS_LOJAS[cod];
    var para0 = (g0 && g0.email) || (lj ? lj[1] : ''), cc0 = rsEmailSup_(SUP, l[2]);
    if (!para0) { rel.push(cod + ' ' + l[1] + ': sem e-mail do gerente nem da loja'); return; }
    var g = { gerente: (g0 && g0.gerente) || (lj && lj[0]) || '', email: para0 };
    var r;
    try { r = rsMontarLoja_(l, d.p, K, O, PD[cod], g); } catch (e) { rel.push(cod + ' ' + l[1] + ': erro ao montar (' + e.message + ')'); return; }
    var msg = { to: teste ? dono : para0, subject: (teste ? '[TESTE → ' + para0 + (cc0 ? ' + cópia ' + cc0 : '') + '] ' : '') + r.assunto, htmlBody: r.corpo, attachments: [r.pdf], name: 'Só Tintas App' };
    if (!teste && cc0 && cc0 !== para0) msg.cc = cc0;
    MailApp.sendEmail(msg);
    if (!teste) rsSnapGravar_(cod, l, d.p);
    if (!teste) { try { rsGravarSemana_(cod, l, d.p, r.vends); } catch (eS) { rel.push(cod + ' ' + l[1] + ': PDI semanal não gravado (' + eS.message + ')'); } }
    enviados++; rel.push(cod + ' ' + l[1] + ': ' + r.vendedores + ' vendedores → ' + (teste ? dono + ' (no real: ' + para0 + (cc0 ? ', cópia ' + cc0 : ', sem supervisor com e-mail') + ')' : para0 + (cc0 ? ' + cópia ' + cc0 : '')));
  });
  if (PD._erro) rel.push('PDI: não consegui ler a planilha (' + PD._erro + ')');
  return { teste: teste, enviados: enviados, relatorio: rel, cotaRestante: MailApp.getRemainingDailyQuota() };
}

/* acionador de segunda-feira */
function resumoSemanalGerentes() {
  var r = rsEnviar_();
  /* logo depois das lojas, o PDF do plano de cada supervisor (mesma manhã) */
  if (!r.teste) { try { rsAgendarSup_(); r.relatorio.push('PDF dos supervisores: agendado para daqui a 1 minuto'); } catch (eA) { r.relatorio.push('PDF dos supervisores: não agendei (' + eA.message + ') — sai às 12h15'); } }
  var dono = Session.getEffectiveUser().getEmail();
  MailApp.sendEmail(dono, 'Só Tintas App · resumo semanal ' + (r.teste ? '(MODO TESTE) ' : '') + '— ' + r.enviados + ' lojas', r.relatorio.join('\n') + '\n\nCota de e-mails restante hoje: ' + r.cotaRestante);
  return r;
}
/* rode no editor: manda o resumo de UMA loja (034 Cabo Frio, se existir) só para você, com o PDF */
function testarResumoSemanal() {
  var p = PropertiesService.getScriptProperties(), antes = p.getProperty('RESUMO_MODO');
  p.setProperty('RESUMO_MODO', 'teste');
  try { var r = rsEnviar_('034', 1); if (!r.enviados) r = rsEnviar_(null, 1); Logger.log(JSON.stringify(r, null, 1)); return r; }
  finally { if (antes) p.setProperty('RESUMO_MODO', antes); }
}
/* gera o PDF da loja 034 numa pasta do Drive ("Resumo semanal - testes") para conferir o layout, sem mandar e-mail */
function gerarPdfDeTeste() {
  var d = montarDados(), K = null, O = null; try { K = lerCarteira(); } catch (e) {} try { O = lerOrcamentos(); } catch (e) {}
  var l = (d.L || []).filter(function (x) { return cod3Painel_(x[0]) === '034'; })[0] || d.L[0];
  var r = rsMontarLoja_(l, d.p, K, O, rsPdi_()[cod3Painel_(l[0])], { gerente: 'Gerente' });
  var it = DriveApp.getFoldersByName('Resumo semanal - testes'), pasta = it.hasNext() ? it.next() : DriveApp.createFolder('Resumo semanal - testes');
  var f = pasta.createFile(r.pdf); Logger.log('PDF de teste: ' + f.getName()); return f.getName();
}
