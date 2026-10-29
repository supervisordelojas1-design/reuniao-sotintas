/* ═══════════════════════════════════════════════════════════════
   Só Tintas App — CATÁLOGO DE INDICADORES E METAS

   Uma lista só, lida pelo Painel de Metas e pelos três PDIs (semanal,
   mensal do vendedor e mensal dos gestores). Antes disso, mudar a meta
   de um indicador era mexer em quatro arquivos e esquecer um.

   Dia útil = segunda a sábado (domingo não conta), a mesma régua do
   Painel. Eucatex sai em litros e em baldes de 18 L, que é como o
   vendedor conta no balcão.

   Uso:
     STInd.LISTA                      → os 12 indicadores, na ordem
     STInd.do('pctEuc')               → a ficha de um indicador
     STInd.fmt('brl', 1234)           → "R$ 1.234"
     STInd.ok('pctIdent', 0.74)       → false (meta 0,80)
     STInd.euc(meta, vendido, dUteis) → litros, baldes, ritmo do dia e da semana
     STInd.diasUteis()                → {total, decorridos, restantes, naSemana}
   ═══════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';

  var NUM = function (v) { return Number(v || 0).toLocaleString('pt-BR'); };
  var DEC = function (v, c) { return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }); };

  var FMT = {
    pct: function (v) { return v == null ? '—' : Math.round(v * 100) + '%'; },
    pct1: function (v) { return v == null ? '—' : DEC(v * 100, 1) + '%'; },
    brl: function (v) { return v == null ? '—' : 'R$ ' + NUM(Math.round(v)); },
    dec: function (v) { return v == null ? '—' : DEC(v, 1); },
    num: function (v) { return v == null ? '—' : NUM(Math.round(v)); },
    lt:  function (v) { return v == null ? '—' : NUM(Math.round(v)) + ' L'; }
  };

  /* k: chave · g: grupo · n: nome · t: formato · meta: alvo (null = sem meta fixa)
     b: 1 quando maior é melhor, 0 quando menor é melhor · r: como ler o número */
  var LISTA = [
    { k: 'pctLoja',   g: 'META', n: '% Meta Loja',            t: 'pct',  meta: 1,    b: 1, r: 'faturamento sobre a meta do mês' },
    { k: 'pctTime',   g: 'META', n: '% Meta Time',            t: 'pct',  meta: 1,    b: 1, r: 'faturamento sobre a meta do time' },
    { k: 'alcCNPJ',   g: 'CNPJ', n: '% Alcance da Meta CNPJ', t: 'pct',  meta: 1,    b: 1, r: 'faturamento CNPJ sobre a meta CNPJ' },
    { k: 'repCNPJ',   g: 'CNPJ', n: '% Represent. CNPJ',      t: 'pct',  meta: null, b: 1, r: 'quanto do faturamento veio de CNPJ' },
    { k: 'ativCNPJ',  g: 'CNPJ', n: '% Ativos CNPJ',          t: 'pct',  meta: null, b: 1, r: 'clientes ativos sobre os cadastrados' },
    { k: 'posCNPJ',   g: 'CNPJ', n: '% Positivados CNPJ',     t: 'pct',  meta: 0.5,  b: 1, r: 'clientes que compraram no mês sobre os ativos' },
    { k: 'novos',     g: 'CNPJ', n: 'Clientes Novos CNPJ',    t: 'num',  meta: 4,    b: 1, r: 'primeira compra no mês' },
    { k: 'pctIdent',  g: 'CPF',  n: '% Identificados',        t: 'pct',  meta: 0.80, b: 1, r: 'atendimentos com CPF' },
    { k: 'itens',     g: 'CPF',  n: 'Itens por venda CPF',    t: 'dec',  meta: 2.5,  b: 1, r: 'itens por atendimento identificado' },
    { k: 'ticket',    g: 'CPF',  n: 'Ticket médio CPF',       t: 'brl',  meta: 200,  b: 1, r: 'valor médio por atendimento' },
    { k: 'descCPF',   g: 'CPF',  n: '% Desconto CPF',         t: 'pct1', meta: 0.07, b: 0, r: 'desconto sobre o faturamento CPF' },
    { k: 'pctEuc',    g: 'EUC',  n: '% Meta Eucatex',         t: 'pct',  meta: 1,    b: 1, r: 'litragem Eucatex sobre a meta — tudo ou nada em 100%' }
  ];

  var POR_K = {}; LISTA.forEach(function (i) { POR_K[i.k] = i; });
  var GRUPOS = { META: 'Meta', CNPJ: 'CNPJ', CPF: 'CPF', EUC: 'Eucatex' };

  function fmt(t, v) { return (FMT[t] || FMT.num)(v); }

  function alvo(k) {
    var i = POR_K[k]; if (!i || i.meta == null) return '';
    return (i.b ? '≥ ' : 'abaixo de ') + fmt(i.t, i.meta);
  }

  /* true, false ou null quando não há meta fixa ou não há número */
  function ok(k, v) {
    var i = POR_K[k]; if (!i || i.meta == null || v == null) return null;
    return i.b ? v >= i.meta : v < i.meta;
  }

  /* ── dias úteis: segunda a sábado, igual ao Painel ── */
  function diasUteis(hoje) {
    var d = hoje ? new Date(hoje) : new Date();
    var Y = d.getFullYear(), M = d.getMonth(), dia = d.getDate();
    var fim = new Date(Y, M + 1, 0).getDate(), total = 0, decorridos = 0, naSemana = 0;
    /* dias úteis que ainda faltam nesta semana, sem contar hoje (que já está correndo);
       no domingo, conta a semana que começa amanhã */
    var ateSabado = d.getDay() === 0 ? 6 : 6 - d.getDay();
    for (var x = 1; x <= fim; x++) {
      var dow = new Date(Y, M, x).getDay();
      if (dow === 0) continue;
      total++;
      if (x <= dia) decorridos++;
      if (x > dia && x - dia <= ateSabado) naSemana++;
    }
    return { total: total, decorridos: decorridos, restantes: Math.max(total - decorridos, 0), naSemana: naSemana };
  }

  /* ── Eucatex: litros, baldes de 18 L e o ritmo do dia e da semana ── */
  function euc(meta, vendido, du) {
    meta = Number(meta || 0); vendido = Number(vendido || 0);
    if (!meta) return null;
    du = du || diasUteis();
    var falta = Math.max(meta - vendido, 0), pct = vendido / meta;
    var baldes = Math.ceil(falta / 18);
    var porDia = du.restantes ? falta / du.restantes / 18 : 0;
    var naSemana = Math.min(baldes, Math.ceil(porDia * (du.naSemana || 0)));
    return {
      meta: meta, vendido: vendido, pct: pct, batida: pct >= 1,
      falta: falta, baldes: baldes,
      baldesDia: porDia, baldesSemana: naSemana,
      litrosDia: du.restantes ? falta / du.restantes : 0,
      texto: pct >= 1
        ? FMT.lt(vendido) + ' de ' + FMT.lt(meta) + ' · ✔ meta batida'
        : FMT.lt(vendido) + ' de ' + FMT.lt(meta) + ' · falta ' + FMT.lt(falta) + ' · 🪣 ' + NUM(baldes) + ' baldes de 18 L',
      semanaTexto: pct >= 1 ? 'meta batida' : '🪣 ' + NUM(naSemana) + ' balde' + (naSemana === 1 ? '' : 's') + ' nesta semana · ' + DEC(porDia, 1) + '/dia'
    };
  }

  /* linha pronta para as tabelas do PDI: só devolve algo quando há número */
  function linha(k, valor, extra) {
    var i = POR_K[k]; if (!i || valor == null) return null;
    return { k: k, grupo: GRUPOS[i.g], nome: i.n, valor: fmt(i.t, valor), bruto: valor,
      meta: alvo(k), ok: ok(k, valor), leitura: i.r, extra: extra || '' };
  }

  g.STInd = { LISTA: LISTA, GRUPOS: GRUPOS, do: function (k) { return POR_K[k] || null; },
    fmt: fmt, alvo: alvo, ok: ok, diasUteis: diasUteis, euc: euc, linha: linha };
})(window);
