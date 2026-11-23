/* Base mensal da Escala & Folgas — % da meta do mês fechado (23/11/2026)
   Rodar na aba do Só Tintas App (qualquer tela com STDados e o crachá da coordenação, ex.: escala.html).
   ANTES de colar: window.__ESC_MES = <conteúdo do JSON gerado por ferramentas/escala_mes.py>
   Para só simular (não grava): window.__ESC_SIMULAR = true
   Depois: JSON.stringify(window.__ESCJOB) até fase = 'pronto' (ou 'erro').
   O que faz: lê a base atual (escalaListar), troca o % do gerente (% da loja) e de cada vendedor pelo
   do mês fechado, acrescenta vendedor novo com meta (sem data de admissão) e marca sem % quem não teve
   meta no mês. Movimento das lojas, regiões, assistentes e datas de admissão ficam como estão. */
(function () {
  var J = window.__ESCJOB = { fase: 'inicio' };
  var M = window.__ESC_MES, SIM = !!window.__ESC_SIMULAR;
  function chave(n) { return String(n || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function mesmo(a, b) { a = chave(a); b = chave(b); if (!a || !b) return false; if (a === b) return true;
    var x = a.split(' '), y = b.split(' '); return x.length > 1 && y.length > 1 && x[0] === y[0] && x[x.length - 1] === y[y.length - 1]; }
  function mesclar(r) {
    var eq = JSON.parse(JSON.stringify(r.equipes || {})), st = { lojas: 0, ger: 0, casados: 0, novos: [], semMeta: [] };
    Object.keys(eq).forEach(function (cod) {
      var lista = eq[cod] || [], vs = ((M.vend || {})[cod] || []).map(function (v) { return { nome: v[0], pct: v[1], usado: false }; });
      if (M.lojas && M.lojas[cod] != null) st.lojas++;
      lista.forEach(function (p) {
        if (p.cargo === 'Gerente') { if (M.lojas && M.lojas[cod] != null) { p.pct = M.lojas[cod]; p.obs = '% da loja'; st.ger++; } return; }
        if (p.cargo !== 'Vendedor') return;
        var v = vs.filter(function (x) { return !x.usado && mesmo(x.nome, p.nome); })[0];
        if (v) { v.usado = true; p.pct = v.pct; delete p.obs; st.casados++; }
        else { p.pct = null; p.obs = 'sem meta em ' + M.mes; st.semMeta.push(cod + ' ' + p.nome); }
      });
      var n = lista.filter(function (p) { return /^v\d+$/.test(p.id); }).length;
      vs.filter(function (x) { return !x.usado; }).forEach(function (x) { n++; while (lista.some(function (p) { return p.id === 'v' + n; })) n++;
        lista.push({ id: 'v' + n, nome: x.nome, cargo: 'Vendedor', pct: x.pct, sem: 0 }); st.novos.push(cod + ' ' + x.nome); });
      eq[cod] = lista;
    });
    return { eq: eq, st: st };
  }
  (async function () {
    try {
      if (!M || !M.mes || !M.lojas || !M.vend) throw new Error('window.__ESC_MES não definido ou fora do formato');
      J.fase = 'lendo base';
      var r = await STDados.chamar('escalaListar', {}, true);
      if (!r || !r.ok || r.semBase) throw new Error((r && r.erro) || 'base da Escala não veio do servidor');
      var m = mesclar(r);
      J.resumo = { mes: M.mes, lojasNaBase: (r.lojas || []).length, lojasComPct: m.st.lojas, gerentes: m.st.ger, vendedoresCasados: m.st.casados, novos: m.st.novos, semMetaNoMes: m.st.semMeta };
      var txt = String(r.base || '').replace(/% da meta de [^·]+/, '').replace(/\s*·\s*·/g, ' ·').trim();
      var base = { lojas: r.lojas, equipes: m.eq, reg: r.reg, base: '% da meta de ' + M.mes + ' (atualizado pela rotina do dia 1º) · ' + txt.replace(/^·\s*/, '') };
      if (SIM) { J.simulado = base; J.fase = 'pronto'; return; }
      if (m.st.lojas < 25 || m.st.casados < 40) throw new Error('poucos casamentos (lojas ' + m.st.lojas + ', vendedores ' + m.st.casados + '): não gravei');
      J.fase = 'gravando';
      var g = await STDados.chamar('escalaBase', { base: base }, true);
      if (!g || !g.ok) throw new Error((g && g.erro) || 'o servidor não confirmou');
      var v = await STDados.chamar('escalaListar', {}, true);
      J.conferido = v && v.ok && String(v.base || '').indexOf(M.mes) >= 0;
      J.baseEm = v && v.baseEm;
      J.fase = 'pronto';
    } catch (e) { J.fase = 'erro'; J.erro = (e && e.message) || String(e); }
  })();
  return 'disparado';
})();
