/* ═══════════ PDI SEMANAL DO SUPERVISOR (segunda, 12h15 — depois do prazo dos vendedores) ═══════════
   Um PDF por supervisor: carteira, os 3 compromissos dele e uma ficha por gerente (com a adesão ao PDI semanal).
   O supervisor registra o plano no app (loja foco, data da visita, ação) até as 18h de segunda (aba SUPSEMANA). */
var RS_SUP_CAB = ['chave', 'semana', 'supervisor', 'dados', 'plano', 'fechamento', 'atualizado_em'];
var RS_SUP_PRAZO = '18:00';
var RS_SUP_IND = {
  ident: 'Em cada visita, ficar 30 minutos no balcão e contar em quantos atendimentos o CPF foi pedido antes do preço; devolver o número ao gerente na hora.',
  itens: 'Em cada visita, assistir 3 atendimentos e dar retorno ao gerente sobre a oferta do kit de aplicação (rolo, fita, lixa).',
  ticket: 'Em cada visita, conferir se a linha superior está sendo apresentada primeiro e montar com o gerente um roteiro de 2 frases de rendimento.',
  desc: 'Revisar com cada gerente as 10 maiores vendas com desconto da semana e combinar o teto de desconto por vendedor.'
};
function rsPrimeiro_(n) { return primeiroNomePainel_(n); }
function rsMesmoSup_(a, b) { return !!a && !!b && rsPrimeiro_(a) === rsPrimeiro_(b); }

/* indicadores somados da carteira (mesma conta do painel: soma das contagens, média ponderada por atendimento) */
function rsRoll_(Cs) {
  var s = function (i) { return Cs.reduce(function (a, C) { return a + (Number(C[i]) || 0); }, 0); }, A = s(6);
  var w = function (i) { return A ? Cs.reduce(function (a, C) { return a + (Number(C[i]) || 0) * (Number(C[6]) || 0); }, 0) / A : null; };
  return [s(0), s(1), s(2), s(3), s(4), s(5), A, w(7), w(8), w(9), w(10)];
}
function rsSemanaLinhas_() {
  var sh = rsAbaSemana_(), n = sh.getLastRow(); if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, RS_SEMANA_CAB.length).getValues().map(function (r) {
    var o = {}; RS_SEMANA_CAB.forEach(function (k, i) { o[k] = r[i]; });
    ['dados', 'aval', 'fechamento'].forEach(function (k) { try { o[k] = o[k] ? JSON.parse(o[k]) : null; } catch (e) { o[k] = null; } });
    o.loja = cod3Painel_(o.loja); o.semana = String(o.semana instanceof Date ? Utilities.formatDate(o.semana, 'America/Sao_Paulo', 'yyyy-MM-dd') : o.semana); return o;
  }).filter(function (o) { return o.chave && o.status !== 'fora'; });
}
function rsSituacao_(o) {
  if (o.status === 'respondido') return 'respondido';
  var pz = (o.dados && o.dados.prazo) || '', ag = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd HH:mm');
  if (pz && ag > pz) return o.status === 'liberado' ? 'nao_respondeu' : 'nao_feito';
  return o.status || 'aguardando';
}
/* visitas da aba VISITAS do app: concluídas na semana passada e planejadas nesta */
function rsVisitas_(supNome, iniAnt, iniAtual, fimAtual) {
  var out = { feitas: {}, planejadas: {} };
  try {
    var sh = SpreadsheetApp.openById(ATAS_ID).getSheetByName('VISITAS'); if (!sh || sh.getLastRow() < 2) return out;
    var v = sh.getDataRange().getValues(), h = v[0].map(function (c) { return String(c).toLowerCase(); });
    var iD = h.indexOf('data'), iR = h.indexOf('responsável'), iL = h.indexOf('loja / referência'), iS = h.indexOf('status'), iT = h.indexOf('tipo');
    v.slice(1).forEach(function (r) {
      var d = r[iD] instanceof Date ? Utilities.formatDate(r[iD], 'America/Sao_Paulo', 'yyyy-MM-dd') : String(r[iD] || '').slice(0, 10);
      if (!d || String(r[iR] || '').toLowerCase().indexOf(rsPrimeiro_(supNome)) < 0) return;
      if (iT >= 0 && /tarefa/i.test(String(r[iT]))) return;
      var cod = cod3Painel_(r[iL]); if (!cod) return;
      if (d >= iniAnt && d < iniAtual && /conclu/i.test(String(r[iS]))) out.feitas[cod] = (out.feitas[cod] || 0) + 1;
      if (d >= iniAtual && d <= fimAtual && !/cancel/i.test(String(r[iS]))) out.planejadas[cod] = (out.planejadas[cod] || []).concat([d]);
    });
  } catch (e) { out.erro = e.message; }
  return out;
}
function rsDiaIso_(base, dias) { var p = base.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + dias)); return d.toISOString().slice(0, 10); }

/* monta tudo de um supervisor */
function rsMontarSup_(supNome, lojas, P, K, O, G, SEM, PD) {
  var UT = Number(P[3]) || 0, UD = Number(P[4]) || 0, UR = Math.max(UT - UD, 0), hoje = new Date();
  var semana = rsSegunda_(), semAnt = rsDiaIso_(semana, -7), fimSem = rsDiaIso_(semana, 6);
  var vis = rsVisitas_(supNome, semAnt, semana, fimSem);
  var tot = { meta: 0, fat: 0, proj: 0 };
  var L = lojas.map(function (l) {
    var cod = cod3Painel_(l[0]), meta = Number(l[3]) || 0, fat = Number(l[5]) || 0, proj = Number(l[6]) || 0;
    tot.meta += meta; tot.fat += fat; tot.proj += proj;
    var sa = SEM.filter(function (o) { return o.loja === cod && o.semana === semana; }), sp = SEM.filter(function (o) { return o.loja === cod && o.semana === semAnt; });
    var feitos = sa.filter(function (o) { var s = rsSituacao_(o); return s === 'liberado' || s === 'respondido' || s === 'nao_respondeu'; }).length;
    var resp = sa.filter(function (o) { return o.aval; }), media = resp.length ? resp.reduce(function (a, o) { return a + o.aval.nota; }, 0) / resp.length : null;
    var naoResp = sa.filter(function (o) { var s = rsSituacao_(o); return s === 'nao_respondeu' || s === 'nao_feito'; }).map(function (o) { return rsNome_(o.vendedor); });
    var fechInf = sp.filter(function (o) { return o.fechamento; }), divergentes = fechInf.filter(function (o) { return o.dados && o.dados.posit_real != null && o.fechamento.posit !== o.dados.posit_real; });
    var vends = (l[9] || []).filter(function (v) { return Number(v[1]) > 3; }), abaixo = vends.filter(function (v) { var pj = UD ? v[2] / UD * UT : v[2]; return v[1] && pj / v[1] < 0.95; }).map(function (v) { return rsNome_(v[0]); });
    var orc = rsOrcs_(O, cod), parados = orc.filter(function (o) { return o.dias != null && o.dias > 15; });
    var cart = rsCarteira_(K, cod), semCompra = cart.filter(rsSemCompra_);
    var g0 = G[cod] || null, lj = RS_LOJAS[cod];
    var o = { cod: cod, nome: l[1], gerente: (g0 && g0.gerente) || (lj && lj[0]) || '—', meta: meta, fat: fat, proj: proj, pct: meta ? fat / meta : null, pp: meta ? proj / meta : null, gap: Math.max(meta - proj, 0),
      C: l[8] || [], nV: sa.length || vends.length, feitos: feitos, resp: resp.length, media: media, naoResp: naoResp, fechInf: fechInf.length, fechTot: sp.length, divergentes: divergentes.length,
      abaixo: abaixo, orcN: orc.length, orcV: orc.reduce(function (a, x) { return a + x.valor; }, 0), paradosN: parados.length, paradosV: parados.reduce(function (a, x) { return a + x.valor; }, 0),
      semCompraN: semCompra.length, semCompraV: semCompra.reduce(function (a, c) { return a + c.media; }, 0), visitas: vis.feitas[cod] || 0, planejadas: vis.planejadas[cod] || [], pdi: PD[cod] || { venc: [], prox: [] } };
    /* ponto de orientação (o mais urgente primeiro) */
    if (sa.length && feitos < sa.length) { o.orient = 'Ritual de segunda incompleto: PDI semanal feito com ' + feitos + ' de ' + sa.length + ' vendedores.'; o.esperado = 'O gerente conversar com todos os vendedores na segunda de manhã e liberar a avaliação antes das 12h.'; }
    else if (parados.length >= 3) { o.orient = parados.length + ' orçamentos parados há mais de 15 dias (' + rsBrl_(o.paradosV) + ').'; o.esperado = 'O gerente distribuir os orçamentos parados entre os vendedores, com prazo de retorno até quarta.'; }
    else if (abaixo.length) { o.orient = 'Abaixo do ritmo: ' + abaixo.join(', ') + '.'; o.esperado = 'O gerente acompanhar esses vendedores no balcão e cobrar os 3 compromissos na quarta, não só na segunda.'; }
    else if (divergentes.length) { o.orient = 'Fechamento da semana passada não bate com a planilha em ' + divergentes.length + ' vendedor(es).'; o.esperado = 'O gerente conferir as positivações no sistema antes de informar o fechamento.'; }
    else { o.orient = 'Loja no ritmo e ritual em dia.'; o.esperado = 'Reconhecer o gerente na frente do time e manter a cadência.'; }
    return o;
  });
  var pctC = tot.meta ? tot.fat / tot.meta : null, pjC = tot.meta ? tot.proj / tot.meta : null, faltaC = Math.max(tot.meta - tot.fat, 0);
  var foco = L.slice().sort(function (a, b) { return b.gap - a.gap; })[0] || null;
  var audit = L.filter(function (o) { return o.nV && (o.feitos < o.nV || o.resp < o.nV); });
  var CR = rsRoll_(L.map(function (o) { return o.C; })), indFoco = null, gm = 0;
  RS_IND.forEach(function (ind) { var g = rsGap_(ind, CR[ind.i]); if (g > gm) { gm = g; indFoco = ind; } });
  var snap = null; try { snap = JSON.parse(PropertiesService.getScriptProperties().getProperty('RS_SNAPSUP_' + rsPrimeiro_(supNome)) || 'null'); } catch (e) {}
  var ant = snap && snap.mes === String(P[2] || '').slice(0, 7) ? snap : null;
  var semTxt = rsDiaBr_(new Date(semana + 'T12:00:00')) + ' a ' + rsDiaBr_(new Date(rsDiaIso_(semana, 5) + 'T12:00:00'));
  var sup = rsNome_(supNome);

  /* página 1: carteira */
  var h = '<div class="pg"><div class="topo"><div class="s">PDI semanal do supervisor · semana de ' + semTxt + '</div><div class="t">Carteira de ' + rsEsc_(sup) + ' · ' + L.length + ' lojas</div><div class="s">dados até ' + rsDataBr_(P[2]) + ' · ' + UD + ' de ' + UT + ' dias úteis</div></div>';
  h += '<h3>Números da carteira</h3><table class="kp"><tr><td><div class="l">Meta</div><div class="v">' + rsBrl_(tot.meta) + '</div></td><td><div class="l">Realizado</div><div class="v">' + rsBrl_(tot.fat) + '</div></td>' +
    '<td><div class="l">Atingido</div><div class="v" style="color:' + rsCor_(pctC) + '">' + rsPct_(pctC) + '</div>' + (ant && ant.pct != null ? '<div class="l">semana passada ' + rsPct_(ant.pct) + '</div>' : '') + '</td>' +
    '<td><div class="l">Projeção</div><div class="v" style="color:' + rsCor_(pjC) + '">' + rsPct_(pjC) + '</div></td><td><div class="l">Falta</div><div class="v">' + rsBrl_(faltaC) + '</div></td>' +
    '<td><div class="l">Precisa por dia útil</div><div class="v">' + rsBrl_(UR ? faltaC / UR : 0) + '</div></td></tr></table>';
  h += '<h3>Lojas da carteira</h3><table><tr><th>Loja</th><th>Gerente</th><th class="r">Atingido</th><th class="r">Projeção</th><th class="r">Falta</th><th class="r">PDI semanal</th><th class="r">Nota média</th><th class="r">Visitas sem. passada</th></tr>' +
    L.slice().sort(function (a, b) { return (a.pp || 0) - (b.pp || 0); }).map(function (o) {
      return '<tr><td>' + o.cod + ' ' + rsEsc_(o.nome) + '</td><td>' + rsEsc_(o.gerente) + '</td><td class="r">' + rsPct_(o.pct) + rsSeta_(o.pct, ant && ant.l && ant.l[o.cod], true) + '</td><td class="r" style="color:' + rsCor_(o.pp) + ';font-weight:bold">' + rsPct_(o.pp) + '</td><td class="r">' + rsBrl_(Math.max(o.meta - o.fat, 0)) + '</td>' +
        '<td class="r" style="color:' + (o.nV && o.feitos >= o.nV ? '#128a52' : '#c42a22') + ';font-weight:bold">' + o.feitos + '/' + o.nV + '</td><td class="r">' + (o.media == null ? '—' : o.media.toFixed(1).replace('.', ',')) + '</td><td class="r">' + o.visitas + '</td></tr>';
    }).join('') + '</table>';
  h += '<h3>Indicadores da carteira</h3><table><tr><th>Indicador</th><th class="r">Carteira</th><th class="r">Meta</th><th>Situação</th></tr>' +
    RS_IND.map(function (ind) { return '<tr><td>' + ind.nome + '</td><td class="r">' + rsFmt_(ind.fmt, CR[ind.i]) + '</td><td class="r">' + (ind.maior ? '≥ ' : '≤ ') + rsFmt_(ind.fmt, ind.meta) + '</td><td>' + rsSemaforo_(rsOk_(ind, CR[ind.i])) + '</td></tr>'; }).join('') +
    '<tr><td>Faturamento CNPJ</td><td class="r">' + rsBrl_(CR[1]) + '</td><td class="r">meta ' + rsBrl_(CR[0]) + '</td><td class="mut">' + rsPct_(CR[0] ? CR[1] / CR[0] : null) + ' da meta</td></tr>' +
    '<tr><td>Positivados CNPJ</td><td class="r">' + CR[5] + '</td><td class="r">de ' + CR[3] + ' ativos</td><td class="mut">' + rsPct_(CR[3] ? CR[5] / CR[3] : null) + '</td></tr></table>';
  var orcT = L.reduce(function (a, o) { return a + o.orcV; }, 0), parT = L.reduce(function (a, o) { return a + o.paradosV; }, 0), scT = L.reduce(function (a, o) { return a + o.semCompraV; }, 0);
  h += '<h3>Dinheiro na mesa</h3><p style="margin:0">Orçamentos em aberto: <b>' + rsBrl_(orcT) + '</b> (parados há mais de 15 dias: <b>' + rsBrl_(parT) + '</b>) · Clientes CNPJ sem compra no mês: média de <b>' + rsBrl_(scT) + '</b>/mês</p>';
  var semVisita = L.filter(function (o) { return !o.visitas; }).map(function (o) { return o.cod; });
  h += '<h3>Visitas</h3><p style="margin:0">Semana passada: <b>' + L.filter(function (o) { return o.visitas; }).length + ' de ' + L.length + '</b> lojas visitadas' + (semVisita.length ? ' · sem visita: ' + semVisita.join(', ') : '') + (vis.erro ? ' <span class="mut">(não consegui ler a agenda)</span>' : '') + '.</p></div>';

  /* página 2: os 3 compromissos do supervisor */
  h += '<div class="pg"><div class="topo"><div class="s">PDI semanal do supervisor · ' + semTxt + '</div><div class="t">' + rsEsc_(sup) + ' · os 3 compromissos da semana</div></div>';
  h += '<p class="mut" style="margin-top:8px">Registre o seu plano no app (PDI Semanal) até <b>segunda às 18h</b>.</p>';
  if (foco) h += '<div class="box"><span class="n">1</span><b>Loja foco: ' + foco.cod + ' ' + rsEsc_(foco.nome) + ' — projeção ' + rsPct_(foco.pp) + ', faltam ' + rsBrl_(foco.gap) + ' para a meta</b><br>' +
    '<b>Compromisso:</b> visita presencial até quarta e plano escrito com o gerente (' + rsEsc_(foco.gerente) + '), com responsável por cada ação.<br><b>O que observar:</b> o gerente sair da visita com o plano escrito e revisar os 5 maiores orçamentos com você.' +
    (foco.planejadas.length ? '<br><span class="mut">Visita já na agenda: ' + foco.planejadas.map(function (d) { return rsDataBr_(d); }).join(', ') + '</span>' : '<br><span style="color:#c42a22">Ainda sem visita na agenda desta semana.</span>') + '</div>';
  h += '<div class="box"><span class="n">2</span><b>Auditoria do ritual de segunda: ' + (audit.length ? audit.length + ' loja(s) com PDI semanal incompleto' : 'todas as lojas fizeram o PDI semanal') + '</b>' +
    (audit.length ? '<table style="margin-top:4px"><tr><th>Loja</th><th>Gerente</th><th class="r">Feito</th><th class="r">Respondido</th><th>Não fizeram / não responderam</th></tr>' + audit.map(function (o) { return '<tr><td>' + o.cod + ' ' + rsEsc_(o.nome) + '</td><td>' + rsEsc_(o.gerente) + '</td><td class="r">' + o.feitos + '/' + o.nV + '</td><td class="r">' + o.resp + '/' + o.nV + '</td><td>' + rsEsc_(o.naoResp.join(', ') || '—') + '</td></tr>'; }).join('') + '</table>' : '') +
    '<br><b>O que observar:</b> pedir ao gerente para mostrar no app quem fez e qual foi a nota; não aceitar só "fiz".</div>';
  if (indFoco) h += '<div class="box"><span class="n">3</span><b>Indicador da carteira: ' + indFoco.nome + ' em ' + rsFmt_(indFoco.fmt, CR[indFoco.i]) + ' (meta ' + (indFoco.maior ? '≥ ' : '≤ ') + rsFmt_(indFoco.fmt, indFoco.meta) + ')</b><br><b>Ação:</b> ' + rsEsc_(RS_SUP_IND[indFoco.k]) + '<br><b>O que observar:</b> o número da semana que vem de cada loja neste indicador.</div>';
  else h += '<div class="box"><span class="n">3</span><b>Indicadores CPF da carteira na meta</b><br>Foco em volume: positivação CNPJ e retorno de orçamentos em todas as lojas.</div>';
  h += '<h3>Meu plano (preencher no app)</h3><div style="border:1px solid #c9d2e3;height:60px;border-radius:6px"></div></div>';

  /* página 3+: ficha por gerente */
  h += L.map(function (o) {
    return '<div class="pg"><div class="topo"><div class="s">Ficha do gerente · ' + semTxt + '</div><div class="t">Loja ' + o.cod + ' ' + rsEsc_(o.nome) + ' · ' + rsEsc_(o.gerente) + '</div></div>' +
      '<table class="kp" style="margin-top:8px"><tr><td><div class="l">Atingido</div><div class="v" style="color:' + rsCor_(o.pct) + '">' + rsPct_(o.pct) + '</div></td><td><div class="l">Projeção</div><div class="v" style="color:' + rsCor_(o.pp) + '">' + rsPct_(o.pp) + '</div></td>' +
      '<td><div class="l">PDI semanal feito</div><div class="v">' + o.feitos + '/' + o.nV + '</div></td><td><div class="l">Respondido</div><div class="v">' + o.resp + '/' + o.nV + '</div><div class="l">média ' + (o.media == null ? '—' : o.media.toFixed(1).replace('.', ',')) + '</div></td>' +
      '<td><div class="l">Fechamento sem. passada</div><div class="v">' + o.fechInf + '/' + o.fechTot + '</div>' + (o.divergentes ? '<div class="l" style="color:#c42a22">' + o.divergentes + ' não bate(m) com a planilha</div>' : '') + '</td></tr></table>' +
      '<table style="margin-top:6px"><tr><td>Vendedores abaixo do ritmo</td><td>' + (o.abaixo.length ? rsEsc_(o.abaixo.join(', ')) : '<span class="mut">nenhum</span>') + '</td></tr>' +
      '<tr><td>Não fizeram / não responderam o PDI semanal</td><td>' + (o.naoResp.length ? rsEsc_(o.naoResp.join(', ')) : '<span class="mut">ninguém</span>') + '</td></tr>' +
      '<tr><td>Orçamentos em aberto</td><td>' + o.orcN + ' (' + rsBrl_(o.orcV) + ') · parados há +15 dias: <b>' + o.paradosN + '</b> (' + rsBrl_(o.paradosV) + ')</td></tr>' +
      '<tr><td>Clientes CNPJ sem compra no mês</td><td>' + o.semCompraN + ' (média de ' + rsBrl_(o.semCompraV) + '/mês)</td></tr>' +
      '<tr><td>Revisões de PDI vencidas</td><td>' + (o.pdi.venc.length ? rsEsc_(o.pdi.venc.map(function (x) { return x.nome; }).join(', ')) : '<span class="mut">nenhuma</span>') + '</td></tr>' +
      '<tr><td>Visitas</td><td>semana passada: ' + o.visitas + ' · nesta semana: ' + (o.planejadas.length ? o.planejadas.map(function (d) { return rsDataBr_(d); }).join(', ') : '<span style="color:#c42a22">nenhuma na agenda</span>') + '</td></tr></table>' +
      '<div class="box"><b>Ponto de orientação:</b> ' + rsEsc_(o.orient) + '<br><b>Comportamento esperado do gerente:</b> ' + rsEsc_(o.esperado) + '</div>' +
      '<h3>Anotações da visita</h3><div style="border:1px solid #c9d2e3;height:70px;border-radius:6px"></div></div>';
  }).join('');

  var html = '<!DOCTYPE html><html><head><meta charset="utf-8">' + RS_CSS + '</head><body>' + h + '</body></html>';
  var nomeArq = ('PDI semanal supervisor - ' + sup + ' - ' + Utilities.formatDate(hoje, 'America/Sao_Paulo', 'dd-MM-yyyy') + '.pdf').replace(/[\\/:*?"<>|]+/g, ' ');
  var pdf = Utilities.newBlob(html, 'text/html', 'sup.html').getAs('application/pdf').setName(nomeArq);
  var corpo = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;color:#16233d"><div style="background:#1C3F8F;color:#fff;padding:14px 16px;border-radius:10px 10px 0 0;border-bottom:4px solid #FFD200"><div style="font-size:12px;opacity:.85">Só Tintas · PDI semanal do supervisor · ' + semTxt + '</div><div style="font-size:19px;font-weight:bold">Carteira de ' + rsEsc_(sup) + '</div></div>' +
    '<p>Bom dia, ' + rsEsc_(sup.split(' ')[0]) + '! A carteira está com <b>' + rsPct_(pctC) + '</b> da meta e projeção de <b style="color:' + rsCor_(pjC) + '">' + rsPct_(pjC) + '</b>.</p>' +
    (foco ? '<p><b>Loja foco da semana:</b> ' + foco.cod + ' ' + rsEsc_(foco.nome) + ' (faltam ' + rsBrl_(foco.gap) + ').</p>' : '') +
    '<p><b>PDI semanal das lojas:</b> ' + L.reduce(function (a, o) { return a + o.feitos; }, 0) + ' de ' + L.reduce(function (a, o) { return a + o.nV; }, 0) + ' vendedores com PDI feito' + (audit.length ? ' · ' + audit.length + ' loja(s) para auditar' : '') + '.</p>' +
    '<p>No PDF anexo: a carteira, os seus 3 compromissos e a ficha de cada gerente. <b>Registre o seu plano no app (PDI Semanal) até as 18h de hoje.</b></p>' +
    '<p><a href="' + RS_APP + '" style="background:#1C3F8F;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:bold;display:inline-block">Abrir o Só Tintas App</a></p></div>';
  var dados = { semana: semana, foco: foco ? { cod: foco.cod, nome: foco.nome, gerente: foco.gerente, gap: Math.round(foco.gap), pp: foco.pp, planejadas: foco.planejadas } : null,
    auditoria: audit.map(function (o) { return { cod: o.cod, nome: o.nome, gerente: o.gerente, feitos: o.feitos, resp: o.resp, nV: o.nV, naoResp: o.naoResp }; }),
    indicador: indFoco ? { nome: indFoco.nome, atual: rsFmt_(indFoco.fmt, CR[indFoco.i]), meta: (indFoco.maior ? '≥ ' : '≤ ') + rsFmt_(indFoco.fmt, indFoco.meta), acao: RS_SUP_IND[indFoco.k] } : null,
    carteira: { pct: pctC, pp: pjC, falta: Math.round(faltaC), lojas: L.length, cods: L.map(function (o) { return o.cod; }) }, prazo: semana + ' ' + RS_SUP_PRAZO };
  var snapNovo = { mes: String(P[2] || '').slice(0, 7), pct: pctC, l: {} }; L.forEach(function (o) { snapNovo.l[o.cod] = o.pct; });
  return { pdf: pdf, corpo: corpo, assunto: 'Só Tintas · PDI semanal do supervisor · ' + sup + ' · carteira ' + rsPct_(pjC) + ' projetado', dados: dados, snap: snapNovo, sup: sup, semana: semana };
}

function rsAbaSup_() {
  var ss = SpreadsheetApp.openById(RS_PDI_ID), sh = ss.getSheetByName('SUPSEMANA');
  if (!sh) { sh = ss.insertSheet('SUPSEMANA'); sh.appendRow(RS_SUP_CAB); sh.setFrozenRows(1); }
  return sh;
}
function rsGravarSup_(r) {
  var sh = rsAbaSup_(), n = sh.getLastRow(), V = n < 2 ? [] : sh.getRange(2, 1, n - 1, RS_SUP_CAB.length).getValues();
  var chave = r.semana + '|' + rsPrimeiro_(r.sup).toUpperCase(), linha = -1;
  V.forEach(function (x, i) { if (x[0] === chave) linha = i + 2; });
  if (linha > 0) { sh.getRange(linha, 4, 1, 1).setValues([[JSON.stringify(r.dados)]]); sh.getRange(linha, 7, 1, 1).setValues([[new Date()]]); }
  else sh.getRange(sh.getLastRow() + 1, 1, 1, RS_SUP_CAB.length).setValues([[chave, r.semana, r.sup, JSON.stringify(r.dados), '', '', new Date()]]);
}

/* envio: cada supervisor recebe a carteira dele, com cópia para a coordenação (supervisordelojas1) */
function rsEnviarSup_(soSup, testePara, soPendentes) {
  var teste = !!testePara || PropertiesService.getScriptProperties().getProperty('RESUMO_MODO') !== 'real';
  var dono = Session.getEffectiveUser().getEmail(), COORD = 'supervisordelojas1@sotintasnet.com.br';
  var d = montarDados(), K = null, O = null; try { K = lerCarteira(); } catch (e) {} try { O = lerOrcamentos(); } catch (e) {}
  var G = rsGerentes_(), PD = rsPdi_(), SUP = []; try { SUP = rsSupervisores_(); } catch (e) {}
  var SEM = []; try { SEM = rsSemanaLinhas_(); } catch (e) {}
  var grupos = {}; (d.L || []).forEach(function (l) { var k = rsPrimeiro_(l[2]); if (!k) return; (grupos[k] = grupos[k] || { nome: l[2], lojas: [] }).lojas.push(l); });
  var rel = [];
  Object.keys(grupos).forEach(function (k) {
    if (soSup && k !== rsPrimeiro_(soSup)) return;
    var semAtual = rsSegunda_(), pK = 'RS_SUP_ENV_' + k, P = PropertiesService.getScriptProperties();
    if (!teste && soPendentes && P.getProperty(pK) === semAtual) { rel.push(grupos[k].nome + ': já enviado nesta semana'); return; }
    var g = grupos[k], para = rsEmailSup_(SUP, g.nome) || (k === 'bruno' ? COORD : '');
    var r; try { r = rsMontarSup_(g.nome, g.lojas, d.p, K, O, G, SEM, PD); } catch (e) { rel.push(g.nome + ': erro ao montar (' + e.message + ')'); return; }
    var msg = { to: teste ? (testePara || dono) : (para || COORD), subject: (teste ? '[TESTE → ' + (para || 'sem e-mail') + '] ' : '') + r.assunto, htmlBody: r.corpo, attachments: [r.pdf], name: 'Só Tintas App' };
    if (!teste && para && para !== COORD) msg.cc = COORD;
    for (var t = 1; ; t++) { try { MailApp.sendEmail(msg); break; } catch (eM) { if (t >= 3) { rel.push(g.nome + ': FALHOU o envio (' + eM.message + ')'); return; } Utilities.sleep(15000 * t); } }
    Utilities.sleep(1500);
    if (!teste) { try { P.setProperty(pK, semAtual); } catch (eP) {} }
    if (!teste) { try { rsGravarSup_(r); PropertiesService.getScriptProperties().setProperty('RS_SNAPSUP_' + k, JSON.stringify(r.snap)); } catch (eG) { rel.push(g.nome + ': plano não gravado (' + eG.message + ')'); } }
    rel.push(g.nome + ': ' + g.lojas.length + ' lojas → ' + msg.to + (msg.cc ? ' + cópia ' + msg.cc : ''));
  });
  return { teste: teste, relatorio: rel };
}
/* segunda de manhã: o resumo das lojas (7h) agenda este envio para 1 minuto depois de terminar.
   O acionador fixo de 12h15 continua como reserva: só manda para quem ainda não recebeu na semana. */
function rsAgendarSup_() {
  var P = PropertiesService.getScriptProperties(), ant = P.getProperty('RS_SUP_GATILHO');
  if (ant) ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getUniqueId() === ant) ScriptApp.deleteTrigger(t); });
  var t = ScriptApp.newTrigger('pdiSupervisoresSemanal').timeBased().after(60 * 1000).create();
  P.setProperty('RS_SUP_GATILHO', t.getUniqueId());
}
function pdiSupervisoresSemanal() {
  var P = PropertiesService.getScriptProperties(), gat = P.getProperty('RS_SUP_GATILHO');
  if (gat) { try { ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getUniqueId() === gat) ScriptApp.deleteTrigger(t); }); } catch (e) {} P.deleteProperty('RS_SUP_GATILHO'); }
  var r = rsEnviarSup_(null, null, true);
  if (!r.relatorio.some(function (x) { return !/já enviado nesta semana$/.test(x); })) return;
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Só Tintas App · PDI semanal dos supervisores ' + (r.teste ? '(MODO TESTE) ' : '') + '— ' + r.relatorio.length, r.relatorio.join('\n'));
}
/* teste: manda os PDFs de todos os supervisores só para a caixa da supervisão (não grava nada) */
function testarPdiSupervisores() { var r = rsEnviarSup_(null, 'supervisordelojas1@sotintasnet.com.br'); Logger.log(r.relatorio.join('\n')); }
/* grava o plano desta semana para todos os supervisores sem mandar e-mail (para começar fora da segunda) */
function gerarPdiSupervisoresAgora() {
  var d = montarDados(), K = null, O = null; try { K = lerCarteira(); } catch (e) {} try { O = lerOrcamentos(); } catch (e) {}
  var G = rsGerentes_(), PD = rsPdi_(), SEM = rsSemanaLinhas_(), grupos = {}, rel = [];
  (d.L || []).forEach(function (l) { var k = rsPrimeiro_(l[2]); if (k) (grupos[k] = grupos[k] || { nome: l[2], lojas: [] }).lojas.push(l); });
  Object.keys(grupos).forEach(function (k) { try { var r = rsMontarSup_(grupos[k].nome, grupos[k].lojas, d.p, K, O, G, SEM, PD); r.dados.prazo = rsPrazoSup_(); rsGravarSup_(r); rel.push(grupos[k].nome + ': ok'); } catch (e) { rel.push(grupos[k].nome + ': ' + e.message); } });
  Logger.log(rel.join(' | '));
}
/* prazo do plano: 18h do dia; se já passou das 16h, 18h do dia seguinte */
function rsPrazoSup_() { var d = new Date(), h = Number(Utilities.formatDate(d, 'America/Sao_Paulo', 'H')); if (h >= 16) d = new Date(d.getTime() + 864e5); return Utilities.formatDate(d, 'America/Sao_Paulo', 'yyyy-MM-dd') + ' ' + RS_SUP_PRAZO; }
function instalarPdiSupervisores() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'pdiSupervisoresSemanal') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('pdiSupervisoresSemanal').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(12).nearMinute(15).inTimezone('America/Sao_Paulo').create();
}
