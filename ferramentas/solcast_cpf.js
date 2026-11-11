/* ═══════════════════════════════════════════════════════════════
   Compras de clientes CPF por dia e por loja (base do pós-venda) — nov/2026
   Rodar na aba https://bi.solcast.com.br/painel/comercial/623 (relatório carregado),
   colando este arquivo inteiro na ferramenta de JavaScript. Não usa cliques.
   Para cada dia e cada filial, filtra CPF + a data e baixa a tabela
   "EVOLUÇÃO MENSAL POR CLIENTE" (cliente, grupo de produto, valor).
     1. responde 'disparado'
     2. confira:  JSON.stringify(window.__STCPF.estado())
     3. fase = 'pronto' → baixa "solcast_cpf_AAAAMMDD.json" na pasta Downloads
   Dias: por padrão, ontem (Brasília). Para outros dias, antes de colar:
     window.__ST_DIAS = ['2026-11-09','2026-11-10']
   O filtro de valor (compras de R$ 500 ou mais) é aplicado depois, no converter_cpf.py.
   No fim devolve os filtros da página ao normal (Filial e CPF/CNPJ = Todos, sem período).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var J = { fase: 'inicio', feitas: 0, total: 0, erros: [], out: {} };
  J.estado = function () { return { fase: J.fase, feitas: J.feitas, total: J.total, erros: J.erros }; };
  window.__STCPF = J;
  (async function () {
    var cpf, fil, per, mes;
    try {
      var M = window['powerbi-client'].models, R = powerbi.embeds[0];
      var espera = function (ms) { return new Promise(function (x) { setTimeout(x, ms); }); };
      var bf = function (t, c, v) { return { $schema: 'http://powerbi.com/product/schema#basic', target: { table: t, column: c }, filterType: M.FilterType.Basic, operator: 'In', values: v }; };
      var entre = function (d) { var a = new Date(d + 'T00:00:00.000Z'), b = new Date(a.getTime() + 86400000);
        return { $schema: 'http://powerbi.com/product/schema#advanced', target: { table: 'd_tempo', column: 'sk_data' }, filterType: M.FilterType.Advanced, logicalOperator: 'And',
          conditions: [{ operator: 'GreaterThanOrEqual', value: a.toISOString() }, { operator: 'LessThan', value: b.toISOString() }] }; };
      var hojeBR = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
      var ontem = new Date(new Date(hojeBR + 'T12:00:00Z').getTime() - 86400000).toISOString().slice(0, 10);
      var DIAS = (window.__ST_DIAS && window.__ST_DIAS.length) ? window.__ST_DIAS.slice() : [ontem];
      var pi = (await R.getPages()).filter(function (p) { return /Painel indicadores/i.test(p.displayName); })[0];
      await pi.setActive(); await espera(6000);
      var vs = await pi.getVisuals(), S = {};
      for (var i = 0; i < vs.length; i++) { if (vs[i].type !== 'slicer') continue; var st = await vs[i].getSlicerState(); st.targets.forEach(function (t) { S[t.table + '.' + t.column] = vs[i]; }); }
      cpf = S['d_cliente.nome_indica_cpf_cnpj']; fil = S['d_empresa.codigo_e_nome']; per = S['d_tempo.sk_data']; mes = S['d_tempo.nome_mes_filtro'];
      if (!cpf || !fil || !per) throw new Error('filtro CPF/CNPJ, Filial ou Período não encontrado');
      var evo = vs.filter(function (x) { return x.title === 'EVOLUÇÃO MENSAL POR CLIENTE'; })[0]; if (!evo) throw new Error('tabela EVOLUÇÃO MENSAL POR CLIENTE não encontrada');
      var csv = async function (v) { return (await v.exportData(M.ExportDataType.Summarized)).data; };
      if (mes) await mes.setSlicerState({ filters: [] });   /* o período manda; sem filtro de mês */
      /* só as lojas dos 4 supervisores (mesmo recorte da exportação diária) */
      var REG = ['SUPERVISOR BRUNO SÓ TINTAS', 'SUPERVISOR DANILO SÓ TINTAS', 'SUPERVISOR RAMON SÓ TINTAS', 'SUPERVISOR CARLOS EDUARDO SÓ TINTAS'];
      if (S['d_regional.nome']) await S['d_regional.nome'].setSlicerState({ filters: [bf('d_regional', 'nome', REG)] });
      await cpf.setSlicerState({ filters: [] }); await fil.setSlicerState({ filters: [] }); await espera(6000);
      var FIL = (await csv(fil)).split('\n').map(function (s) { return s.replace(/\r$/, '').replace(/^"|"$/g, ''); }).filter(Boolean).slice(1);
      await cpf.setSlicerState({ filters: [bf('d_cliente', 'nome_indica_cpf_cnpj', ['CPF'])] });
      J.total = DIAS.length * FIL.length;
      for (var d = 0; d < DIAS.length; d++) {
        var dia = DIAS[d]; J.out[dia] = {};
        await per.setSlicerState({ filters: [entre(dia)] });
        for (var k = 0; k < FIL.length; k++) {
          var f = FIL[k]; J.fase = dia + ' · ' + f;
          for (var t = 0; t < 3; t++) {
            try { await fil.setSlicerState({ filters: [bf('d_empresa', 'codigo_e_nome', [f])] }); await espera(4500 + t * 4000); J.out[dia][f] = await csv(evo); J.feitas++; break; }
            catch (e) { var msg = (e && (e.message || JSON.stringify(e))) || ''; if (t === 2) { J.erros.push(dia + ' ' + f + ': ' + msg); } }
          }
        }
      }
      var P = { gerado: new Date().toISOString(), dias: DIAS, filiais: FIL, CPF: J.out, erros: J.erros };
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(P)], { type: 'application/json' }));
      a.download = 'solcast_cpf_' + hojeBR.replace(/-/g, '') + '.json'; document.body.appendChild(a); a.click();
      J.arquivo = a.download; J.fase = 'pronto';
    } catch (e) { J.fase = 'erro'; J.erros.push((e && (e.message || JSON.stringify(e))) || String(e)); }
    /* devolve a página ao normal, dê certo ou não */
    try { if (fil) await fil.setSlicerState({ filters: [] }); if (cpf) await cpf.setSlicerState({ filters: [] }); if (per) await per.setSlicerState({ filters: [] });
      if (mes) await mes.setSlicerState({ filters: [bf('d_tempo', 'nome_mes_filtro', ['ATUAL'])] }); } catch (e) {}
  })();
  return 'disparado';
})();
