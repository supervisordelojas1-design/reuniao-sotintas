/* ═══════════════════════════════════════════════════════════════
   Exportação Solcast pelo Power BI direto (nov/2026)
   Rodar na aba https://bi.solcast.com.br/painel/comercial/623 (relatório já carregado),
   com a ferramenta de JavaScript do Claude in Chrome. Não usa prints nem cliques:
   aplica os filtros pelos slicers do relatório e baixa os dados das tabelas.
     1. cole este arquivo inteiro → ele dispara em segundo plano e devolve 'disparado'
     2. confira de tempos em tempos:  JSON.stringify(window.__STJOB.estado())
     3. quando fase = 'pronto', ele baixa sozinho "solcast_pacote_AAAAMMDD.json" na pasta Downloads
   O pacote leva META (por empresa) e a EVOLUÇÃO MENSAL POR CLIENTE de cada filial.
   O INDICADORES oficial continua saindo pela tela ("Dados com layout atual"), porque
   o total de cada loja (clientes ativos, positivados etc.) só existe nesse export.
   Parâmetro opcional antes de colar:  window.__ST_MES = 'Outubro'  (fechamento do dia 1º)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var J = { fase: 'inicio', feitas: [], erros: [], out: {} };
  J.estado = function () { return { fase: J.fase, feitas: J.feitas.length, filiais: (J.filiais || []).length, erros: J.erros }; };
  window.__STJOB = J;
  (async function () {
    try {
      var M = window['powerbi-client'].models, R = powerbi.embeds[0];
      var espera = function (ms) { return new Promise(function (x) { setTimeout(x, ms); }); };
      var bf = function (t, c, v) { return { $schema: 'http://powerbi.com/product/schema#basic', target: { table: t, column: c }, filterType: M.FilterType.Basic, operator: 'In', values: v }; };
      var REG = ['SUPERVISOR BRUNO SÓ TINTAS', 'SUPERVISOR DANILO SÓ TINTAS', 'SUPERVISOR RAMON SÓ TINTAS', 'SUPERVISOR CARLOS EDUARDO SÓ TINTAS'];
      var LOJA = { $schema: 'http://powerbi.com/product/schema#hierarchy', target: [{ table: 'd_filtro_operador', column: 'nome_tipo_vendedor' }, { table: 'd_operador', column: 'nome_departamento' }], filterType: M.FilterType.Hierarchy, hierarchyData: [{ operator: 'Selected', value: 'LOJA' }] };
      var MES = window.__ST_MES || 'ATUAL';
      var pags = await R.getPages();
      var achar = async function (pg, tabela, coluna) {
        var vs = await pg.getVisuals();
        for (var i = 0; i < vs.length; i++) { if (vs[i].type !== 'slicer') continue; var s = await vs[i].getSlicerState(); if (s.targets.some(function (t) { return t.table === tabela && t.column === coluna; })) return vs[i]; }
        throw new Error('filtro ' + tabela + '.' + coluna + ' não encontrado');
      };
      var tabela = async function (pg, titulo) { var vs = await pg.getVisuals(); var v = vs.filter(function (x) { return x.title === titulo; })[0]; if (!v) throw new Error('tabela ' + titulo + ' não encontrada'); return v; };
      var csv = async function (v) { return (await v.exportData(M.ExportDataType.Summarized)).data; };
      /* A) Por filial: META por empresa (o INDICADORES sai pela tela) */
      J.fase = 'por filial';
      var pf = pags.filter(function (p) { return /Por filial/.test(p.displayName); })[0]; await pf.setActive(); await espera(6000);
      await (await achar(pf, 'd_tempo', 'ano_2')).setSlicerState({ filters: [bf('d_tempo', 'ano_2', ['ATUAL'])] });
      await (await achar(pf, 'd_tempo', 'nome_mes_filtro')).setSlicerState({ filters: [bf('d_tempo', 'nome_mes_filtro', [MES])] });
      await (await achar(pf, 'd_regional', 'nome')).setSlicerState({ filters: [bf('d_regional', 'nome', REG)] });
      await (await achar(pf, 'd_empresa', 'codigo_e_nome')).setSlicerState({ filters: [] });
      await (await achar(pf, 'd_filtro_operador', 'nome_tipo_vendedor')).setSlicerState({ filters: [LOJA] });
      await (await achar(pf, 'd_operador', 'nome')).setSlicerState({ filters: [] });
      await (await achar(pf, 'd_cliente', 'nome_indica_cpf_cnpj')).setSlicerState({ filters: [] });
      await (await achar(pf, 'd_tipo_atendimento', 'nome')).setSlicerState({ filters: [] });
      var tipo = await achar(pf, 'PARAM_tipo_meta', 'nome_tipo_meta');
      await tipo.setSlicerState({ filters: [bf('PARAM_tipo_meta', 'nome_tipo_meta', ['POR EMPRESA'])] }); await espera(8000);
      J.out.META = await csv(await tabela(pf, 'META'));
      await tipo.setSlicerState({ filters: [bf('PARAM_tipo_meta', 'nome_tipo_meta', ['POR VENDEDOR'])] }); await espera(8000);
      /* reserva: INDICADORES por vendedor (sem os totais por loja que não somam) — só usado se o export da tela falhar */
      J.out.INDICADORES = await csv(await tabela(pf, 'INDICADORES'));
      try { J.out.ULT = await csv(await tabela(pf, 'Ultima atualização')); } catch (e) {}
      /* B) Painel indicadores: carteira CNPJ de cada filial */
      J.fase = 'painel indicadores';
      var pi = pags.filter(function (p) { return /Painel indicadores/i.test(p.displayName); })[0]; await pi.setActive(); await espera(6000);
      await (await achar(pi, 'd_tempo', 'nome_mes_filtro')).setSlicerState({ filters: [] });
      var cpf = await achar(pi, 'd_cliente', 'nome_indica_cpf_cnpj'); await cpf.setSlicerState({ filters: [bf('d_cliente', 'nome_indica_cpf_cnpj', ['CNPJ'])] });
      var fil = await achar(pi, 'd_empresa', 'codigo_e_nome'); await fil.setSlicerState({ filters: [] }); await espera(6000);
      var FIL = (await csv(fil)).split('\n').map(function (s) { return s.replace(/\r$/, '').replace(/^"|"$/g, ''); }).filter(Boolean).slice(1);
      J.filiais = FIL; J.out.CART = {};
      var evo = await tabela(pi, 'EVOLUÇÃO MENSAL POR CLIENTE');
      for (var i = 0; i < FIL.length; i++) {
        var f = FIL[i]; J.fase = 'carteira ' + f;
        for (var t = 0; t < 3; t++) {
          try { await fil.setSlicerState({ filters: [bf('d_empresa', 'codigo_e_nome', [f])] }); await espera(5000 + t * 5000); J.out.CART[f] = await csv(evo); J.feitas.push(f); break; }
          catch (e) { if (t === 2) J.erros.push(f + ': ' + (e && (e.message || JSON.stringify(e)))); }
        }
      }
      await fil.setSlicerState({ filters: [] }); await cpf.setSlicerState({ filters: [] });
      await (await achar(pi, 'd_tempo', 'nome_mes_filtro')).setSlicerState({ filters: [bf('d_tempo', 'nome_mes_filtro', ['ATUAL'])] });
      /* pacote para a pasta Downloads */
      var hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(/-/g, '');
      var P = { gerado: new Date().toISOString(), mes_atual: new Date().getMonth() + 1, mes_filtro: MES, ULT: J.out.ULT, META: J.out.META, INDICADORES: J.out.INDICADORES, CART: J.out.CART };
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(P)], { type: 'application/json' }));
      a.download = 'solcast_pacote_' + hoje + '.json'; document.body.appendChild(a); a.click();
      J.arquivo = a.download; J.fase = 'pronto';
    } catch (e) { J.fase = 'erro'; J.erros.push((e && (e.message || JSON.stringify(e))) || String(e)); }
  })();
  return 'disparado';
})();
