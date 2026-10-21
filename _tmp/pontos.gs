
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
