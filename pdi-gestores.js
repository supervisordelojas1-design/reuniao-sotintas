/* ═══════════════════════════════════════════════════════════════
   Só Tintas App — PDI Mensal dos GESTORES (gerentes e supervisores)
   Mesmo roteiro do PDI dos vendedores, adaptado ao gestor: situação da loja
   ou da carteira, metas de 90 dias, plano de ação, desenvolvimento,
   autoavaliação, compromissos, revisões e termo em PDF.
   A base do mês (BASE_GESTORES) é gerada pelo servidor do Painel no dia 1º;
   o acompanhamento fica no Servidor de Dados (ACOMP_G), recortado pelo crachá.

   PdiGestoresUI.montar(el, { tipo:'G'|'S', base, acomp, pode:{chave:bool}, salvar(chave, estado), usuario, gerarBase?, titulo })
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  const NL = { 3: 'Ouro', 2: 'Prata', 1: 'Bronze' }, FAIXA = { 2: 150000, 3: 250000 };
  const TN = { P1: 'P1 Crítico', P2: 'P2 Alta', P3: 'P3 Desenvolver', P4: 'P4 Potencializar' };
  const LIB_H2C = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', LIB_PDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', LIBS = {};
  const carregaJs = src => LIBS[src] || (LIBS[src] = new Promise((ok, erro) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => { delete LIBS[src]; erro(new Error('sem internet para carregar o gerador de PDF')); }; document.head.appendChild(s); }));
  const brl = v => v == null ? '—' : 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  const pct = v => v == null ? '—' : (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + '%';
  const pct1 = v => v == null ? '—' : (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  const n1 = v => v == null ? '—' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  const dt = s => s ? String(s).slice(0, 10).split('-').reverse().join('/') : '—';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tc = s => String(s || '').toLowerCase().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/\b(De|Da|Do|Dos|Das|E)\b/g, w => w.toLowerCase());
  const hojeIso = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  const somaDias = (iso, n) => { const d = new Date(String(iso).slice(0, 10) + 'T12:00:00'); if (isNaN(d.getTime())) return iso; d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const limpaArq = s => tc(String(s || '')).replace(/[\\/:*?"<>|]+/g, '-').trim();
  const primeiro = n => String(n || '').trim().split(' ')[0];
  const supChave = n => String(n || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').trim().split(' ')[0];
  const IND = [['ident', 'Vendas identificadas (CPF)', '≥ 80%', pct], ['itens', 'Itens por venda CPF', '≥ 2,5', n1], ['ticket', 'Ticket médio CPF', '≥ R$ 200', brl], ['desc', 'Desconto CPF', 'abaixo de 7%', pct1]];
  const DISC = {
    D: { n: 'Executor (D)', t: 'Vá direto ao número e ao desafio. Dê a meta e deixe que ele escolha o caminho. Elogie resultado, não esforço.', ex: '"Faltam R$ 40 mil na loja. Qual é o seu plano para a semana?"', an: 'Como o Romário: quer saber onde está o gol, não a teoria do esquema tático.' },
    I: { n: 'Comunicador (I)', t: 'Comece pela relação e pelo reconhecimento. Transforme a meta em desafio do time. Combine poucas coisas por vez e confira com frequência.', ex: '"Sua loja é a que mais engaja no app; vamos mostrar isso no ritual de segunda?"', an: 'Como a Anitta: rende mais no palco, com plateia. Dê palco ao progresso dele.' },
    S: { n: 'Planejador (S)', t: 'Explique o passo a passo e o porquê de cada mudança. Uma mudança por vez, com apoio por perto. Não cobre em público.', ex: '"Neste mês, só o ritual de segunda sem falhar. Eu passo na loja na quarta para ajudar."', an: 'Como o Bernardinho montando o time: treino repetido, rotina, segurança antes da pressão.' },
    C: { n: 'Analista (C)', t: 'Mostre os dados e a regra. Ele precisa entender a lógica do indicador e ver a evolução em números. Dê tempo para pensar.', ex: '"A projeção da loja caiu de 92% para 84%: veja de onde vem a diferença, vendedor a vendedor."', an: 'Como o Senna estudando a telemetria: melhora quando entende o dado de cada curva.' }
  };
  const ACAO_IND = {
    ident: ['Pedir o CPF antes do preço em todo atendimento', 'Ouvir 3 atendimentos por dia no balcão, cobrar o CPF antes do preço e dar o retorno ao vendedor na hora.', 'O % de vendas identificadas do dia conferido no fechamento, todo dia.', 'É o garçom do boteco que anota o nome do cliente fiel: sem nome, todo cliente é desconhecido.'],
    itens: ['Kit completo em toda venda de tinta', 'Conferir se o vendedor ofereceu fundo, massa, rolo, fita e lixa; fazer a oferta junto com ele nos 3 primeiros atendimentos do dia.', 'Olhar 5 cupons por dia e contar itens por venda.', 'É como servir feijoada: ninguém leva só o feijão.'],
    ticket: ['Linha superior apresentada primeiro', 'Combinar com o time que a linha superior e a embalagem maior são apresentadas primeiro; ensaiar com cada vendedor as 2 frases de rendimento.', 'Nunca ouvir "a mais barata é essa" como primeira frase.', 'É o feirante esperto: oferece a caixa fechada antes da dúzia.'],
    desc: ['Desconto CPF abaixo de 7%', 'Revisar todo dia as vendas com desconto acima de 7% e combinar com cada vendedor o teto; defender o preço com benefício antes de descontar.', 'Descontos acima de 7% auditados no fim do dia, com o motivo.', 'Desconto é como pênalti: o zagueiro que comete um por jogo não termina o campeonato como titular.']
  };

  /* ═════════════ nota de prioridade (0 a 100) ═════════════ */
  function score(x, tipo) {
    const gap = x.pp == null ? 0.3 : Math.max(0, 1 - x.pp), res = Math.min(1, gap / 0.3) * 40;
    const rit = x.ritual && x.ritual.n ? (1 - x.ritual.feitos / x.ritual.n) * 15 + (1 - x.ritual.resp / x.ritual.n) * 10 : 15;
    const cpf = IND.filter(i => x.ind && x.ind[i[0]] && x.ind[i[0]].ok === false).length * 5;
    let out = 0;
    if (tipo === 'G') { if (x.ind && x.ind.cnpj && x.ind.cnpj.pposit != null && x.ind.cnpj.pposit < 0.5) out += 5; if (x.pdiVenc > 0) out += 5; if (x.meu && x.meu.n && x.meu.resp < x.meu.n) out += 5; }
    else { if (x.visitas && x.lojas) out += (x.visitas.semVisita || []).length / x.lojas * 5; if (x.gerentes && x.gerentes.n) out += (1 - x.gerentes.feitos / x.gerentes.n) * 5; if (x.pdiVenc > 0) out += 5; }
    const final = Math.min(100, Math.round(res + rit + cpf + out));
    return { res: Math.round(res), ritual: Math.round(rit), cpf: cpf, outros: Math.round(out), final: final };
  }
  const tierDe = s => s >= 65 ? 'P1' : s >= 50 ? 'P2' : s >= 35 ? 'P3' : 'P4';
  function preparar(base, tipo) {
    const L = ((tipo === 'G' ? base.G : base.S) || []).map(x => Object.assign({}, x));
    L.forEach(x => {
      x.tipo = tipo; x.chave = tipo === 'G' ? 'G|' + x.c : 'S|' + supChave(x.sup);
      x.nome = tipo === 'G' ? tc(x.ger || 'Gerente') : tc(x.sup); x.rotulo = tipo === 'G' ? x.c + ' · ' + tc(x.l) : 'Carteira · ' + x.lojas + ' lojas';
      x.sc = score(x, tipo); x.tier = tierDe(x.sc.final);
    });
    L.sort((a, b) => b.sc.final - a.sc.final); L.forEach((x, i) => { x.pos = i + 1; });
    return L;
  }

  /* ═════════════ metas de 90 dias ═════════════ */
  function metasDe(x) {
    const M = [];
    if (x.pp != null && x.pp < 1) M.push(['meta', x.tipo === 'G' ? 'Atingimento da loja' : 'Atingimento da carteira', pct(x.pp), '100% por 3 meses seguidos']);
    const r = x.ritual || {}; if (r.n && (r.feitos < r.n || r.resp < r.n * 0.8)) M.push(['ritual', 'Ritual de segunda (PDI feito · respondido)', pct(r.feitos / r.n) + ' · ' + pct(r.resp / r.n), '100% feito · 80% respondido']);
    if (x.tipo === 'S' && x.gerentes && x.gerentes.n && x.gerentes.feitos < x.gerentes.n) M.push(['gerentes', 'PDI semanal com os gerentes', pct(x.gerentes.feitos / x.gerentes.n), 'todos, toda semana']);
    IND.filter(i => x.ind && x.ind[i[0]] && x.ind[i[0]].ok === false).slice(0, 2).forEach(i => M.push([i[0], i[1], i[3](x.ind[i[0]].v), i[2]]));
    const cj = x.ind && x.ind.cnpj; if (cj && cj.pposit != null && cj.pposit < 0.5) M.push(['posit', 'Clientes CNPJ positivados', cj.posit + ' de ' + cj.ativos + ' (' + pct(cj.pposit) + ')', '50% da carteira ativa']);
    if (x.tipo === 'S' && x.visitas && (x.visitas.semVisita || []).length) M.push(['visitas', 'Lojas visitadas no mês', x.visitas.lojasVisitadas + ' de ' + x.lojas, 'todas, pelo menos 1 vez']);
    if (x.pdiVenc > 0) M.push(['pdi', 'Revisões de PDI Mensal vencidas', String(x.pdiVenc), '0']);
    if (x.tipo === 'G' && x.niv && x.niv < 3 && FAIXA[x.niv + 1] && x.med90 >= FAIXA[x.niv + 1] * 0.85) M.push(['nivel', 'Méd. 90 dias (subir a ' + NL[x.niv + 1] + ')', brl(x.med90), brl(FAIXA[x.niv + 1])]);
    if (x.tipo === 'S' && (x.perto || []).length) M.push(['nivel', 'Lojas prontas para subir de nível', String(x.perto.length), 'subir ' + x.perto.join(', ')]);
    if (!M.length) M.push(['meta', 'Atingimento', pct(x.pp), 'manter acima de 110% e puxar a rede']);
    return M.slice(0, 5);
  }

  /* ═════════════ plano de ação ═════════════ */
  function acoesDe(x) {
    const A = [], P = primeiro(x.nome), r = x.ritual || {}, cj = x.ind && x.ind.cnpj || {}, ct = x.carteira || {};
    const unidade = x.tipo === 'G' ? 'a loja' : 'a carteira';
    if (x.pp != null && x.pp < 0.95) A.push({ k: 'res', peso: (1 - x.pp) * 6 + 0.5, t: 'Ritmo diário de meta',
      a: `Abrir o dia com o número d${unidade}: faltam ${brl(Math.max(0, x.meta - x.fat))} para a meta, ${brl(x.dia)} por dia útil. ${x.tipo === 'G' ? 'Fechar o dia comparando o feito com esse número e cobrar a reação de quem está abaixo antes das 16h.' : 'Ligar para a loja mais longe da meta antes das 16h e combinar a reação do dia, não do mês.'}`,
      c: `${P} sabe dizer de cabeça, às 12h e às 16h, quanto ${x.tipo === 'G' ? 'a loja' : 'a carteira'} vendeu e quanto falta; quando está abaixo do ritmo, age no mesmo dia.`,
      e: `Projeção de ${pct(x.pp)} da meta; ${x.tipo === 'G' ? (x.vendAbaixo || []).length + ' vendedor(es) abaixo do ritmo' : (x.lojasAbaixo || []).length + ' loja(s) abaixo de 95%'}.`,
      an: 'É o Brasileirão de pontos corridos: ninguém é campeão na última rodada. Quem perde ponto em casa toda semana chega em dezembro fazendo conta.' });
    if (r.n && r.feitos < r.n) A.push({ k: 'ritual', peso: (1 - r.feitos / r.n) * 5 + 0.5, t: 'Ritual de segunda sem falhar',
      a: x.tipo === 'G' ? 'Conversar 10 minutos com cada vendedor na segunda de manhã, marcar "Fiz o PDI semanal" no app até 12h e registrar o fechamento de cada um na segunda seguinte.' : 'Na segunda, até 12h, conferir no app quais gerentes ainda não fizeram o PDI com os vendedores e ligar para eles; na quarta, cobrar os compromissos na visita.',
      c: `${P} ${x.tipo === 'G' ? 'abre o app toda segunda antes das 12h e nenhum vendedor fica "aguardando"' : 'usa o placar do ritual como primeira tarefa de segunda e cobra pelo app, não só por telefone'}.`,
      e: `No mês: PDI feito ${r.feitos} de ${r.n} (${pct(r.feitos / r.n)}), respondido ${r.resp} de ${r.n}${r.media != null ? ', nota média ' + n1(r.media) : ''}.`,
      an: 'Ritual é como a escola de samba: o desfile dá certo porque todo mundo ensaiou na quadra, toda semana, mesmo sem avenida.' });
    if (x.tipo === 'S' && x.gerentes && x.gerentes.n && x.gerentes.feitos < x.gerentes.n) A.push({ k: 'gerentes', peso: (1 - x.gerentes.feitos / x.gerentes.n) * 4 + 0.5, t: 'PDI semanal com cada gerente',
      a: 'Toda semana, depois das 12h15 de segunda, ler a ficha de cada gerente no app, conversar com ele (visita ou ligação), marcar "Fiz o PDI" e fechar a semana na segunda seguinte.',
      c: `${P} fecha a semana com um combinado por loja registrado no app, e o gerente responde a avaliação no mesmo dia.`,
      e: `PDI feito com ${x.gerentes.feitos} de ${x.gerentes.n} gerente-semanas no mês${x.gerentes.media != null ? ', nota média dos gerentes ' + n1(x.gerentes.media) : ''}.`,
      an: 'É o técnico que conversa com cada titular antes do jogo: quem só fala com o grupo no vestiário descobre o problema no segundo tempo.' });
    IND.filter(i => x.ind && x.ind[i[0]] && x.ind[i[0]].ok === false).forEach(i => { const q = ACAO_IND[i[0]]; A.push({ k: i[0], peso: 1.2, t: q[0] + (x.tipo === 'S' ? ' (em cada visita)' : ''), a: x.tipo === 'S' ? 'Em cada visita: ' + q[1].charAt(0).toLowerCase() + q[1].slice(1) + ' Combinar com o gerente o número da semana.' : q[1], c: `${P}: ${q[2]}`, e: `${i[1]} em ${i[3](x.ind[i[0]].v)} (meta ${i[2]}).`, an: q[3] }); });
    if (cj.pposit != null && cj.pposit < 0.5 || ct.semCompra > 5) A.push({ k: 'cnpj', peso: 1.3, t: 'Carteira CNPJ ativa',
      a: `Distribuir entre os vendedores a lista dos ${ct.semCompra || 0} clientes CNPJ sem compra no mês (média de ${brl(ct.semCompraV)}/mês) e cobrar o retorno toda segunda; meta de 10 positivações por vendedor na semana.`,
      c: `Toda segunda, ${P} confere no app a lista de positivação de cada vendedor e os retornos registrados${x.tipo === 'S' ? ', loja por loja' : ''}.`,
      e: `${cj.posit || 0} de ${cj.ativos || 0} clientes ativos positivados (${pct(cj.pposit)}); ${ct.semCompra || 0} sem compra no mês.`,
      an: 'Carteira é horta: não adianta plantar mais se você não rega toda semana. O cliente que ninguém liga em 60 dias secou.' });
    if (ct.paradosN >= 3) A.push({ k: 'orc', peso: 0.9 + ct.paradosN * 0.1, t: 'Orçamentos parados há mais de 15 dias',
      a: `Distribuir os ${ct.paradosN} orçamentos parados (${brl(ct.paradosV)}) entre os vendedores com prazo de retorno até quarta; os de maior valor, ${P} liga junto.`,
      c: `${P} fecha a semana com o resultado de cada orçamento parado: fechou, perdeu ou nova data.`,
      e: `${ct.orcN} orçamentos em aberto (${brl(ct.orcV)}); ${ct.paradosN} parados há mais de 15 dias.`,
      an: 'Orçamento parado é bolo no forno sem ninguém olhar: ou tira na hora certa ou queima.' });
    if (x.tipo === 'S' && x.visitas && (x.visitas.semVisita || []).length) A.push({ k: 'visitas', peso: 1 + x.visitas.semVisita.length * 0.3, t: 'Visita presencial em todas as lojas',
      a: `Agendar no app a visita das lojas sem visita no mês (${x.visitas.semVisita.join(', ')}); em cada visita, 30 minutos no balcão e plano escrito com o gerente.`,
      c: `${P} sai de cada visita com 1 combinado registrado no app e volta na semana seguinte para conferir.`,
      e: `${x.visitas.lojasVisitadas} de ${x.lojas} lojas visitadas no mês (${x.visitas.total} visitas).`,
      an: 'Supervisor que não visita é técnico que só vê o jogo pela TV: sabe o placar, mas não sabe por que o time perdeu.' });
    if (x.tipo === 'G' && (x.vendAbaixo || []).length) A.push({ k: 'time', peso: 0.8 + x.vendAbaixo.length * 0.2, t: 'Vendedores abaixo do ritmo',
      a: `Acompanhar ${x.vendAbaixo.slice(0, 3).join(', ')} no balcão: 2 atendimentos por semana ao lado de cada um, com retorno na hora; cobrar os 3 compromissos na quarta, não só na segunda.`,
      c: `${P} sabe dizer o que cada um deles precisa mudar e mostra no app o fechamento da semana de cada um.`,
      e: `${x.vendAbaixo.length} de ${x.nVend} vendedores abaixo de 95% da meta na projeção.`,
      an: 'É o jogador que perdeu ritmo de jogo: não adianta só cobrar gol, ele precisa de treino de fundamento e minutos em campo.' });
    if (x.pdiVenc > 0) A.push({ k: 'pdi', peso: 0.7 + x.pdiVenc * 0.1, t: 'Revisões do PDI Mensal em dia',
      a: `Fazer as ${x.pdiVenc} revisões vencidas${x.tipo === 'G' && (x.pdiVencNomes || []).length ? ' (' + x.pdiVencNomes.join(', ') + ')' : ''} nesta semana e marcar a próxima data no app.`,
      c: `${P} registra no app o que mudou no comportamento e nos números de cada vendedor, na data combinada.`,
      e: `${x.pdiVenc} revisão(ões) de PDI vencida(s)${x.tipo === 'S' ? ' nas lojas da carteira' : ''}.`,
      an: 'PDI sem revisão é tatuagem feita e nunca mais olhada: fica no corpo, mas não muda o jogo.' });
    if (x.tipo === 'G' && x.niv && x.niv < 3 && FAIXA[x.niv + 1] && x.med90 >= FAIXA[x.niv + 1] * 0.85) A.push({ k: 'nivel', peso: 0.9, t: `Subir a loja para ${NL[x.niv + 1]}`,
      a: `A loja está ${NL[x.niv]} com média de 90 dias de ${brl(x.med90)}; para ${NL[x.niv + 1]} precisa de ${brl(FAIXA[x.niv + 1])}: mais ${brl(FAIXA[x.niv + 1] - x.med90)} por mês. Montar com o time o plano de volume (CNPJ + ticket) para fechar essa diferença em 90 dias.`,
      c: `${P} acompanha a média de 90 dias na tela Níveis e conta ao supervisor, toda semana, quanto falta.`,
      e: `Méd. 90 dias ${brl(x.med90)} · faixa ${NL[x.niv + 1]} a partir de ${brl(FAIXA[x.niv + 1])}.`,
      an: 'É a faixa no jiu-jitsu: só troca de faixa quem mostra a técnica repetidamente, não num único treino bom.' });
    if (x.tipo === 'S' && (x.perto || []).length) A.push({ k: 'nivel', peso: 0.8, t: 'Lojas prontas para subir de nível',
      a: `Montar com os gerentes de ${x.perto.join(', ')} o plano de volume dos próximos 90 dias para cruzar a faixa de nível: CNPJ, ticket e ritual sem falhar.`,
      c: `${P} acompanha a média de 90 dias dessas lojas toda semana e celebra a subida com o time.`,
      e: `${x.perto.length} loja(s) a menos de 15% da próxima faixa.`,
      an: 'É o time na zona de acesso: as últimas rodadas decidem a série do ano que vem.' });
    A.sort((a, b) => b.peso - a.peso);
    if (!A.length) A.push({ k: 'mult', peso: 0, t: 'Multiplicador da rede', a: `${P} está com ${unidade} no ritmo e o ritual em dia: apadrinhar um ${x.tipo === 'G' ? 'gerente' : 'supervisor'} com resultado abaixo, com 1 visita conjunta por mês.`, c: `${P} explica o próprio método no PDI do colega e o colega melhora pelo menos 1 indicador em 30 dias.`, e: `Projeção de ${pct(x.pp)} e ritual ${r.n ? pct(r.feitos / r.n) : '—'}.`, an: 'É o camisa 10 que, além de fazer gol, organiza o meio-campo e faz o time inteiro jogar melhor.' });
    return A;
  }

  /* ═════════════ montagem ═════════════ */
  function montar(el, opts) {
    const tipo = opts.tipo, base = opts.base || {}, L = preparar(base, tipo);
    const S = { tab: 'lista', q: '', abertos: new Set(), REG: Object.assign({}, opts.acomp || {}) };
    const xPor = ch => L.find(x => x.chave === ch);
    const pode = x => !!(opts.pode && opts.pode[x.chave]);
    let toastT = null;
    function toast(m) { let t = document.querySelector('body > .pdi-toast'); if (!t) { t = document.createElement('div'); t.className = 'pdi-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1800); }
    async function salvar(x, patch) {
      if (!pode(x)) { toast('Somente leitura'); return false; }
      const novo = Object.assign({}, S.REG[x.chave] || {}, patch, { atualizado: hojeIso(), por: opts.usuario || '' });
      S.REG[x.chave] = novo;
      try { await opts.salvar(x.chave, novo); toast('Salvo'); return true; } catch (e) { toast('Não foi possível salvar: ' + (e.message || e)); return false; }
    }
    const progresso = x => { const r = S.REG[x.chave]; if (!r) return null; const AA = acoesDe(x); return { feitas: AA.filter(a => r.acoes && r.acoes[a.k] && r.acoes[a.k].s === 'feito').length, total: AA.length, ult: (r.revisoes || []).slice(-1)[0], prox: r.prox }; };
    const ritTxt = x => x.ritual && x.ritual.n ? pct(x.ritual.feitos / x.ritual.n) : '—';
    const filtra = () => { const q = S.q.trim().toLowerCase(); return L.filter(x => !q || (x.nome + ' ' + x.rotulo + ' ' + (tipo === 'G' ? 'supervisor ' + (x.sup || '') : '')).toLowerCase().includes(q)); };

    function row(x) {
      const pg = progresso(x), ab = S.abertos.has(x.chave);
      return `<button type="button" class="pdi-row l-${x.tier}" aria-expanded="${ab}" data-id="${esc(x.chave)}">
        <span class="pdi-pos">${x.pos}</span><span class="pdi-badge b-${x.tier}">${x.tier}</span>
        <span class="pdi-quem"><span class="pdi-nm">${esc(x.nome)}</span><br><span class="pdi-meta">${esc(x.rotulo)}${tipo === 'G' ? ' · loja ' + NL[x.niv] || '' : ''}${tipo === 'G' ? ' · ' + esc(tc(x.sup)) : ''}</span>${pg ? `<span class="pdi-prog">PDI: ${pg.feitas}/${pg.total} ações concluídas${pg.prox ? ` · revisão ${dt(pg.prox)}${pg.prox < hojeIso() ? ' <b class="pdi-venc">(vencida)</b>' : ''}` : ''}</span>` : ''}</span>
        <span class="pdi-c-num pdi-meta">atingido <b>${pct(x.pct)}</b> · proj. <b>${pct(x.pp)}</b><br>ritual <b>${ritTxt(x)}</b></span>
        <span class="pdi-c-spark pdi-meta">${tipo === 'G' ? `visitas <b>${x.visitas}</b> · CNPJ <b>${pct(x.ind && x.ind.cnpj && x.ind.cnpj.pposit)}</b>` : `visitou <b>${x.visitas ? x.visitas.lojasVisitadas : 0}/${x.lojas}</b> · gerentes <b>${x.gerentes && x.gerentes.n ? pct(x.gerentes.feitos / x.gerentes.n) : '—'}</b>`}</span>
        <span><span class="pdi-score">${x.sc.final}<small>/100</small></span><div class="pdi-stack" title="Resultado ${x.sc.res} · Ritual ${x.sc.ritual} · CPF ${x.sc.cpf} · Outros ${x.sc.outros}"><i class="s-res" style="width:${x.sc.res}%"></i><i class="s-cpf" style="width:${x.sc.ritual}%"></i><i class="s-cnpj" style="width:${x.sc.cpf}%"></i><i class="s-cur" style="width:${x.sc.outros}%"></i></div></span>
        <span class="pdi-chev" aria-hidden="true">›</span></button>
        <div class="pdi-fwrap" ${ab ? '' : 'hidden'}>${ab ? ficha(x) : ''}</div>`;
    }
    function acompHTML(x) {
      const r = S.REG[x.chave] || {}, au = r.auto || {}, M = metasDe(x), dis = pode(x) ? '' : 'disabled';
      const q = tipo === 'G' ? ['1. Na sua visão, o que mais atrapalha o resultado da loja hoje?', '2. Em que você é bom e pode ensinar a outro gerente?', '3. Que ajuda você precisa do supervisor ou da coordenação?'] : ['1. Na sua visão, o que mais atrapalha o resultado da carteira hoje?', '2. Em que você é bom e pode ensinar a outro supervisor?', '3. Que ajuda você precisa da coordenação ou da diretoria?'];
      return `<div class="pdi-grid2">
        <div class="pdi-box"><h4>Conversa de PDI</h4>
          <label class="pdi-q">Tema do PDI (o foco dos próximos 90 dias)<input type="text" data-tema="${esc(x.chave)}" maxlength="120" value="${esc(r.tema || '')}" placeholder="Ex.: transformar o ritual de segunda em rotina da loja" ${dis}></label>
          <label class="pdi-q">Perfil DISC<select data-disc="${esc(x.chave)}" ${dis}><option value="">Não informado</option>${Object.entries(DISC).map(([k, d]) => `<option value="${k}" ${r.disc === k ? 'selected' : ''}>${d.n}</option>`).join('')}</select></label>
          ${r.disc ? `<p><span class="pdi-lbl">Como conduzir</span>${DISC[r.disc].t}</p><p><span class="pdi-lbl">Exemplo</span>${DISC[r.disc].ex}</p><p><span class="pdi-lbl">Analogia</span>${DISC[r.disc].an}</p>` : ''}
          ${q.map((t, i) => `<label class="pdi-q">${t}<textarea data-auto="q${i + 1}" data-v="${esc(x.chave)}" ${dis}>${esc(au['q' + (i + 1)])}</textarea></label>`).join('')}
          <label class="pdi-q">Meta que ${tipo === 'G' ? 'o gerente' : 'o supervisor'} escolheu como "a minha"<select data-minha="${esc(x.chave)}" ${dis}><option value="">Ainda não escolheu</option>${M.map(m => `<option value="${m[0]}" ${au.meta === m[0] ? 'selected' : ''}>${esc(m[1])}: ${esc(m[2])} → ${esc(m[3])}</option>`).join('')}</select></label>
        </div>
        <div class="pdi-box"><h4>Revisões</h4>
          <label class="pdi-q pdi-inline">Próxima revisão <input type="date" data-prox="${esc(x.chave)}" value="${esc(r.prox || '')}" ${dis}>${r.prox && r.prox < hojeIso() ? '<span class="pdi-bad pdi-venc">vencida</span>' : ''}</label>
          ${(r.revisoes || []).length || r.prox ? `<ol class="pdi-linha" aria-label="Linha do tempo do PDI">${(r.revisoes || []).map((v, i) => `<li class="feito" style="--i:${i}"><span class="pdi-no">${i + 1}</span><div><b>${dt(v.d)}</b>${v.por ? ` <span class="pdi-meta">· ${esc(v.por)}</span>` : ''}<p>${esc(v.t)}</p></div></li>`).join('')}${r.prox ? `<li class="futuro ${r.prox < hojeIso() ? 'atrasada' : ''}" style="--i:${(r.revisoes || []).length}"><span class="pdi-no">${r.prox < hojeIso() ? '!' : '→'}</span><div><b>${dt(r.prox)}</b> <span class="pdi-meta">· ${r.prox < hojeIso() ? 'revisão vencida' : 'próxima revisão'}</span></div></li>` : ''}</ol>` : '<p class="pdi-meta">Nenhuma revisão registrada ainda.</p>'}
          <label class="pdi-q">Nova revisão: o que mudou no comportamento e nos números?<textarea id="pdg-rv-${esc(x.chave)}" ${dis} placeholder="Ex.: ritual de segunda 100% nas 4 semanas; projeção subiu de 84% para 96%."></textarea></label>
          <button type="button" class="btn pequeno azul" data-rev="${esc(x.chave)}" ${dis}>Registrar revisão</button>
        </div></div>`;
    }
    function ficha(x) {
      const AA = acoesDe(x), M = metasDe(x), r = S.REG[x.chave] || {}, top = (['P1', 'P2'].includes(x.tier)) ? AA.slice(0, 4) : AA.slice(0, 3), ri = x.ritual || {}, cj = x.ind && x.ind.cnpj || {}, ct = x.carteira || {}, dis = pode(x) ? '' : 'disabled';
      const ind = IND.map(i => { const v = x.ind && x.ind[i[0]]; return `<tr><td>${i[1]}</td><td class="${v && v.ok === false ? 'pdi-bad' : 'pdi-ok'}">${v ? i[3](v.v) : '—'}</td><td>${i[2]}</td></tr>`; }).join('');
      const facts = tipo === 'G'
        ? `<div class="pdi-fact"><span>Atingido</span><b>${pct(x.pct)}</b></div><div class="pdi-fact"><span>Projeção</span><b>${pct(x.pp)}</b></div><div class="pdi-fact"><span>Nível da loja</span><b>${NL[x.niv] || '—'}</b></div><div class="pdi-fact"><span>Ritual feito · resp.</span><b>${ri.n ? pct(ri.feitos / ri.n) + ' · ' + pct(ri.resp / ri.n) : '—'}</b></div><div class="pdi-fact"><span>Visitas recebidas</span><b>${x.visitas}</b></div>`
        : `<div class="pdi-fact"><span>Atingido</span><b>${pct(x.pct)}</b></div><div class="pdi-fact"><span>Projeção</span><b>${pct(x.pp)}</b></div><div class="pdi-fact"><span>Lojas Ouro · Prata · Bronze</span><b>${x.niveis ? [3, 2, 1].map(n => x.niveis[n] || 0).join(' · ') : '—'}</b></div><div class="pdi-fact"><span>Ritual nas lojas</span><b>${ri.n ? pct(ri.feitos / ri.n) : '—'}</b></div><div class="pdi-fact"><span>Lojas visitadas</span><b>${x.visitas ? x.visitas.lojasVisitadas + '/' + x.lojas : '—'}</b></div>`;
      const hist = x.hist && Object.keys(x.hist).length ? `<p class="pdi-meta">Histórico de atingimento: ${Object.keys(x.hist).map(m => m + ' ' + pct(x.hist[m])).join(' · ')}.</p>` : '';
      const extra = tipo === 'G'
        ? `<tr><td>Faturamento CNPJ</td><td>${brl(cj.fat)}</td><td>meta ${brl(cj.meta)} (${pct(cj.alc)})</td></tr><tr><td>Positivados CNPJ</td><td>${cj.posit || 0} de ${cj.ativos || 0}</td><td>≥ 50% (${pct(cj.pposit)})</td></tr><tr><td>Clientes novos CNPJ</td><td>${cj.novos || 0}</td><td>no mês</td></tr><tr><td>PDI do gerente com o supervisor</td><td>${x.meu && x.meu.n ? x.meu.resp + ' de ' + x.meu.n + ' respondidos' + (x.meu.media != null ? ' · nota ' + n1(x.meu.media) : '') : '—'}</td><td>toda semana</td></tr><tr><td>Revisões de PDI vencidas</td><td class="${x.pdiVenc ? 'pdi-bad' : 'pdi-ok'}">${x.pdiVenc}${(x.pdiVencNomes || []).length ? ' (' + esc(x.pdiVencNomes.join(', ')) + ')' : ''}</td><td>0</td></tr>`
        : `<tr><td>Faturamento CNPJ</td><td>${brl(cj.fat)}</td><td>meta ${brl(cj.meta)} (${pct(cj.alc)})</td></tr><tr><td>Positivados CNPJ (regional)</td><td>${cj.posit || 0} de ${cj.ativos || 0}</td><td>≥ 50% (${pct(cj.pposit)})</td></tr><tr><td>PDI semanal com os gerentes</td><td>${x.gerentes && x.gerentes.n ? x.gerentes.feitos + ' de ' + x.gerentes.n + ' feitos' + (x.gerentes.media != null ? ' · nota ' + n1(x.gerentes.media) : '') : '—'}</td><td>todos, toda semana</td></tr><tr><td>Plano semanal no prazo</td><td>${x.meu ? x.meu.planos + ' de ' + x.meu.sem : '—'}</td><td>toda segunda até 18h</td></tr><tr><td>Revisões de PDI vencidas nas lojas</td><td class="${x.pdiVenc ? 'pdi-bad' : 'pdi-ok'}">${x.pdiVenc}</td><td>0</td></tr>`;
      const cartTxt = tipo === 'G'
        ? `<p>Carteira CNPJ da loja: <b>${ct.clientes || 0}</b> clientes, <b class="pdi-bad">${ct.semCompra || 0}</b> sem compra no mês (média de ${brl(ct.semCompraV)}/mês). Orçamentos em aberto: <b>${ct.orcN || 0}</b> (${brl(ct.orcV)}), parados há mais de 15 dias: <b class="pdi-bad">${ct.paradosN || 0}</b> (${brl(ct.paradosV)}).${(x.vendAbaixo || []).length ? ` Abaixo do ritmo: <b>${esc(x.vendAbaixo.join(', '))}</b>.` : ' Todo o time no ritmo.'}</p>`
        : `<p>Carteira de clientes da regional: <b>${ct.clientes || 0}</b> clientes CNPJ, <b class="pdi-bad">${ct.semCompra || 0}</b> sem compra no mês (média de ${brl(ct.semCompraV)}/mês). Orçamentos em aberto: <b>${ct.orcN || 0}</b> (${brl(ct.orcV)}), parados: <b class="pdi-bad">${ct.paradosN || 0}</b> (${brl(ct.paradosV)}). Loja foco: <b>${esc(x.lojaFoco)}</b>.${(x.lojasAbaixo || []).length ? ` Lojas abaixo de 95%: <b>${esc(x.lojasAbaixo.join(', '))}</b>.` : ''}${(x.visitas && x.visitas.semVisita || []).length ? ` Sem visita no mês: <b>${esc(x.visitas.semVisita.join(', '))}</b>.` : ''}</p>`;
      const topSem = (ct.topSem || []).slice(0, 6);
      return `<div class="pdi-ficha">
        <div class="pdi-facts">${facts}</div>
        <div class="pdi-grid2">
          <div><h4>Situação ${tipo === 'G' ? 'da loja' : 'da carteira'}</h4><div class="pdi-tw"><table class="pdi-t"><thead><tr><th>Indicador</th><th>${esc(base.rotulo || 'Mês')}</th><th>Meta</th></tr></thead><tbody>
            <tr><td>Meta × realizado</td><td>${brl(x.fat)} de ${brl(x.meta)}</td><td>${x.dia ? 'faltam ' + brl(x.dia) + ' por dia útil' : 'meta batida'}</td></tr>${ind}${extra}</tbody></table></div>${hist}${cartTxt}
            ${topSem.length ? `<div class="pdi-tw"><table class="pdi-t"><thead><tr><th>Cliente CNPJ sem compra</th><th>Média/mês</th><th>${tipo === 'G' ? 'Vendedor' : 'Loja'}</th></tr></thead><tbody>${topSem.map(c => `<tr><td>${esc(c.cli)}</td><td>${brl(c.media)}</td><td>${esc(tipo === 'G' ? (c.vend || '—') : (c.loja || ''))}</td></tr>`).join('')}</tbody></table></div>` : ''}</div>
          <div><h4>Metas do PDI · 90 dias</h4><ul class="pdi-metas">${M.map(m => `<li class="${(r.auto || {}).meta === m[0] ? 'minha' : ''}"><span>${esc(m[1])}${(r.auto || {}).meta === m[0] ? ' <span class="pdi-ok">· a meta dele</span>' : ''}</span><b>${esc(m[2])} → ${esc(m[3])}</b></li>`).join('')}</ul>
            <h4 class="mt-1">Nota de prioridade</h4><p class="pdi-meta">${x.sc.final}/100 · resultado ${x.sc.res}/40 · ritual ${x.sc.ritual}/25 · indicadores CPF ${x.sc.cpf}/20 · ${tipo === 'G' ? 'CNPJ, revisões e avaliação' : 'visitas, gerentes e revisões'} ${x.sc.outros}/15. Faixa ${TN[x.tier]}.</p>
            <h4 class="mt-1">Desenvolvimento</h4><div class="pdi-mods">${(tipo === 'G' ? ['Roteiro da reunião de segunda (app)', 'PDI Semanal · como cobrar os 3 compromissos', 'Mentor ST PRO · Módulo 6 Checklist Pré-Pintura', 'Níveis · régua Ouro/Prata/Bronze'] : ['Placar do ritual (app)', 'PDI Mensal · conduzir a conversa pelo DISC', 'Visita com plano escrito', 'Níveis · lojas por faixa']).map(m => `<span>${m}</span>`).join('')}</div></div>
        </div>
        <div><h4>Plano de ação</h4><div class="pdi-acoes">${top.map((a, i) => { const s = ((r.acoes || {})[a.k] || {}); return `<div class="pdi-acao"><div class="pdi-acao-t"><b>${i + 1}. ${a.t}</b>${s.s === 'feito' ? '<span class="pdi-badge b-P4">Concluída</span>' : s.s === 'andamento' ? '<span class="pdi-badge b-P3">Em andamento</span>' : ''}</div>
          <p><span class="pdi-lbl">Ação</span>${a.a}</p><p><span class="pdi-lbl">Comportamento a observar</span>${a.c}</p><p><span class="pdi-lbl">Exemplo do dado</span>${a.e}</p><p><span class="pdi-lbl">Analogia</span>${a.an}</p>
          <div class="pdi-track"><select data-acao="${a.k}" data-v="${esc(x.chave)}" ${dis} aria-label="Status da ação">${[['', 'Não iniciada'], ['andamento', 'Em andamento'], ['feito', 'Concluída']].map(o => `<option value="${o[0]}" ${(s.s || '') === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select><input type="text" data-acaoobs="${a.k}" data-v="${esc(x.chave)}" value="${esc(s.obs)}" placeholder="Evidência observada (opcional)" ${dis} aria-label="Evidência observada"></div></div>`; }).join('')}</div></div>
        <div><h4>Acompanhamento</h4>${acompHTML(x)}</div>
        <div class="tm-acoes"><button type="button" class="btn pequeno azul" data-termo="${esc(x.chave)}">📄 Formalizar PDI (termo em PDF)</button><button type="button" class="btn pequeno contorno" data-copy="${esc(x.chave)}">Copiar texto para o WhatsApp</button>${r.termo && r.termo.emitido ? `<span class="pdi-meta">Último termo emitido em ${dt(r.termo.emitido)}${r.termo.por ? ' por ' + esc(r.termo.por) : ''}</span>` : ''}</div>
      </div>`;
    }
    function texto(x) {
      const AA = acoesDe(x).slice(0, 3), M = metasDe(x), r = S.REG[x.chave] || {};
      return `*PDI ${x.nome}* — ${x.rotulo}\nPrioridade: ${TN[x.tier]} (${x.sc.final}/100)${r.tema ? `\nTema: ${r.tema}` : ''}\n\n*Metas 90 dias*\n${M.map(m => `• ${m[1]}: ${m[2]} → ${m[3]}${(r.auto || {}).meta === m[0] ? ' (a minha meta)' : ''}`).join('\n')}\n\n*Ações*\n${AA.map((a, i) => `${i + 1}. ${a.t}\n   O que fazer: ${a.a}\n   O que vou observar: ${a.c}`).join('\n')}${r.prox ? `\n\nPróxima revisão: ${dt(r.prox)}` : ''}`;
    }
    function painelAcomp() {
      return `<p class="pdi-meta">Situação de cada PDI: ações concluídas, meta escolhida e revisões. Revisão vencida aparece em vermelho.</p><div class="pdi-tw"><table class="pdi-t"><thead><tr><th>${tipo === 'G' ? 'Gerente' : 'Supervisor'}</th><th>Faixa</th><th>${tipo === 'G' ? 'Loja' : 'Lojas'}</th><th>Ações</th><th>Meta escolhida</th><th>Última revisão</th><th>Próxima</th></tr></thead><tbody>${filtra().map(x => { const r = S.REG[x.chave], pg = progresso(x), M = metasDe(x), mm = r && r.auto && M.find(m => m[0] === r.auto.meta);
        return `<tr><td><button type="button" class="pdi-link" data-abrir="${esc(x.chave)}">${esc(x.nome)}</button></td><td><span class="pdi-badge b-${x.tier}">${x.tier}</span></td><td>${esc(x.rotulo)}</td><td>${pg ? `${pg.feitas}/${pg.total}` : '<span class="pdi-meta">não iniciado</span>'}</td><td>${mm ? esc(mm[1]) : '—'}</td><td>${pg && pg.ult ? dt(pg.ult.d) : '—'}</td><td class="${pg && pg.prox && pg.prox < hojeIso() ? 'pdi-bad pdi-venc' : ''}">${pg && pg.prox ? dt(pg.prox) : '—'}</td></tr>`; }).join('')}</tbody></table></div>`;
    }
    function painelMetodo() {
      return `<div class="pdi-metodo"><p>Cada ${tipo === 'G' ? 'gerente' : 'supervisor'} recebe uma nota de 0 a 100. Quanto maior, mais urgente o PDI.</p>
        <div class="pdi-tw"><table class="pdi-t"><thead><tr><th>Pilar</th><th>Peso</th><th>O que mede</th></tr></thead><tbody>
        <tr><td>Resultado</td><td>40</td><td>Quanto a projeção do mês fica abaixo de 100% da meta (${tipo === 'G' ? 'da loja' : 'da carteira'}); 30 pontos percentuais abaixo valem o peso inteiro.</td></tr>
        <tr><td>Ritual</td><td>25</td><td>PDI semanal feito com os vendedores (15) e respondido por eles (10) nas semanas do mês.</td></tr>
        <tr><td>CPF</td><td>20</td><td>Identificadas ≥ 80%, itens ≥ 2,5, ticket ≥ R$ 200, desconto &lt; 7%: 5 por indicador fora.</td></tr>
        <tr><td>${tipo === 'G' ? 'CNPJ, revisões e avaliação' : 'Visitas, gerentes e revisões'}</td><td>15</td><td>${tipo === 'G' ? 'Positivados abaixo de 50% da carteira ativa (5), revisões de PDI vencidas (5) e avaliação semanal com o supervisor sem resposta (5).' : 'Lojas sem visita no mês (até 5), PDI semanal não feito com os gerentes (até 5) e revisões de PDI vencidas nas lojas (5).'}</td></tr></tbody></table></div>
        <p><b>Faixas:</b> P1 Crítico ≥ 65 · P2 Alta 50–65 · P3 Desenvolver 35–50 · P4 Potencializar &lt; 35.</p>
        <p><b>Base:</b> ${esc(base.rotulo || 'base do mês')}${base.geradoEm ? ' · gerada em ' + esc(String(base.geradoEm).slice(0, 10).split('-').reverse().join('/')) : ''}. Fontes: Painel de Metas (meta, realizado, indicadores), Níveis (Ouro/Prata/Bronze), PDI Semanal (ritual dos vendedores, gerentes e supervisores), Agenda (visitas), PDI Mensal dos vendedores (revisões) e carteira CNPJ.</p></div>`;
    }
    function render() {
      const y = global.scrollY, lst = filtra();
      const c = { P1: 0, P2: 0, P3: 0, P4: 0 }; L.forEach(x => c[x.tier]++);
      el.innerHTML = `<div class="pdi">
        <div class="pdi-kpis">${['P1', 'P2', 'P3', 'P4'].map(t => `<div class="pdi-kpi k-${t}"><b>${c[t]}</b><span>${TN[t]}</span></div>`).join('')}<div class="pdi-kpi"><b>${L.length}</b><span>${tipo === 'G' ? 'Gerentes' : 'Supervisores'}</span></div></div>
        ${Object.values(opts.pode || {}).some(Boolean) ? '' : '<p class="pdi-meta">Modo leitura: você vê o PDI, mas não registra o acompanhamento.</p>'}
        <div class="pdi-tabs" role="tablist">${[['lista', tipo === 'G' ? 'Gerentes' : 'Supervisores'], ['acomp', 'Acompanhamento'], ['metodo', 'Método']].map(([k, l]) => `<button type="button" role="tab" aria-selected="${S.tab === k}" data-tab="${k}">${l}</button>`).join('')}${opts.gerarBase ? `<button type="button" class="btn pequeno contorno" data-gerar style="margin-left:auto">⟳ Gerar base agora</button>` : ''}</div>
        <div class="pdi-filtros"><input type="search" data-busca placeholder="Buscar ${tipo === 'G' ? 'gerente, loja ou supervisor' : 'supervisor'}" value="${esc(S.q)}" aria-label="Buscar"></div>
        <div class="pdi-corpo">${S.tab === 'lista' ? `<p class="pdi-meta">${lst.length} ${tipo === 'G' ? 'gerente(s)' : 'supervisor(es)'}, da maior para a menor urgência. Barra: vermelho resultado · laranja ritual · azul CPF · cinza outros. Toque no nome para abrir a ficha.</p><div class="pdi-lista">${lst.map(row).join('') || '<p class="pdi-meta">Ninguém com esse filtro.</p>'}</div>` : S.tab === 'acomp' ? painelAcomp() : painelMetodo()}</div></div>`;
      global.scrollTo(0, y);
    }

    /* ═════════════ termo em PDF ═════════════ */
    function termoBlocos(x, t) {
      const AA = acoesDe(x), top = (['P1', 'P2'].includes(x.tier)) ? AA.slice(0, 4) : AA.slice(0, 3), M = metasDe(x), r = S.REG[x.chave] || {}, au = r.auto || {}, ri = x.ritual || {}, cj = x.ind && x.ind.cnpj || {};
      const linhas = n => '<div class="tm-linhas">' + '<i></i>'.repeat(n) + '</div>';
      const resp = (s, n) => s && String(s).trim() ? `<p class="tm-resp">${esc(String(s).trim())}</p>` : linhas(n);
      const sit = b => b === false ? '<span class="tm-no">A desenvolver</span>' : '<span class="tm-ok">Atingido</span>';
      const B = [];
      const id = tipo === 'G' ? [['Gerente', x.nome, 'w2'], ['Loja', x.rotulo, 'w2'], ['Nível da loja', NL[x.niv] || '—'], ['Supervisor', tc(x.sup)], ['Prioridade', `${TN[x.tier]} · ${x.sc.final}/100`], ['Base', base.rotulo || ''], ['Conduzido por', t.lider], ['Data da conversa', dt(t.data)], ['Vigência (90 dias)', `até ${dt(somaDias(t.data, 90))}`], ['Tema', r.tema || '']]
        : [['Supervisor', x.nome, 'w2'], ['Carteira', x.lojas + ' lojas · ' + (x.cods || []).join(', '), 'w2'], ['Lojas Ouro · Prata · Bronze', x.niveis ? [3, 2, 1].map(n => x.niveis[n] || 0).join(' · ') : '—'], ['Prioridade', `${TN[x.tier]} · ${x.sc.final}/100`], ['Base', base.rotulo || ''], ['Conduzido por', t.lider], ['Data da conversa', dt(t.data)], ['Vigência (90 dias)', `até ${dt(somaDias(t.data, 90))}`], ['Tema', r.tema || '']];
      B.push(`<section class="tm-sec"><h3>1. Identificação</h3><div class="tm-id">${id.map(([k, v, c]) => `<div class="${c || ''}"><span>${k}</span><b>${v ? esc(v) : '&nbsp;'}</b></div>`).join('')}</div></section>`);
      const ind = IND.map(i => { const v = x.ind && x.ind[i[0]]; return [i[1], v ? i[3](v.v) : '—', i[2], v ? v.ok : null]; })
        .concat([['Positivados CNPJ', `${cj.posit || 0} de ${cj.ativos || 0} (${pct(cj.pposit)})`, '≥ 50%', cj.pposit == null ? null : cj.pposit >= 0.5], ['Ritual de segunda (feito · respondido)', ri.n ? `${pct(ri.feitos / ri.n)} · ${pct(ri.resp / ri.n)}` : '—', '100% · 80%', ri.n ? ri.feitos >= ri.n : null]])
        .concat(tipo === 'S' ? [['PDI semanal com os gerentes', x.gerentes && x.gerentes.n ? pct(x.gerentes.feitos / x.gerentes.n) : '—', '100%', x.gerentes && x.gerentes.n ? x.gerentes.feitos >= x.gerentes.n : null], ['Lojas visitadas no mês', x.visitas ? `${x.visitas.lojasVisitadas} de ${x.lojas}` : '—', 'todas', x.visitas ? !(x.visitas.semVisita || []).length : null]] : [['Visitas recebidas no mês', String(x.visitas), '≥ 1', x.visitas > 0]])
        .concat([['Revisões de PDI vencidas', String(x.pdiVenc || 0), '0', !(x.pdiVenc > 0)]]);
      B.push(`<section class="tm-sec"><h3>2. Situação atual</h3><div class="tm-fatos"><div><span>Atingido no mês</span><b>${pct(x.pct)}</b></div><div><span>Projeção</span><b>${pct(x.pp)}</b></div><div><span>Faltam por dia útil</span><b>${brl(x.dia)}</b></div><div class="din"><span>${tipo === 'G' ? 'CNPJ sem compra' : 'CNPJ sem compra (regional)'}</span><b>${(x.carteira || {}).semCompra || 0}</b></div></div>
        <table class="tm-t"><thead><tr><th>Indicador</th><th>${esc(base.rotulo || 'Mês')}</th><th>Meta</th><th>Situação</th></tr></thead><tbody>${ind.map(z => `<tr><td>${z[0]}</td><td>${z[1]}</td><td>${z[2]}</td><td>${z[3] == null ? '—' : sit(z[3])}</td></tr>`).join('')}</tbody></table></section>`);
      B.push(`<section class="tm-sec"><h3>3. Metas para os próximos 90 dias</h3><table class="tm-t"><thead><tr><th>Indicador</th><th>Hoje</th><th>Meta em 90 dias</th></tr></thead><tbody>${M.map(m => `<tr><td>${esc(m[1])}${au.meta === m[0] ? ' <span class="tm-star">★ meta escolhida</span>' : ''}</td><td>${esc(m[2])}</td><td><b>${esc(m[3])}</b></td></tr>`).join('')}</tbody></table></section>`);
      top.forEach((a, i) => { const st = ((r.acoes || {})[a.k] || {}).s, prazo = somaDias(t.data, i < 2 ? 30 : 60);
        B.push(`${i === 0 ? '<section class="tm-sec"><h3>4. Plano de ação</h3>' : '<section class="tm-sec">'}<div class="tm-acao"><div class="tm-acao-t"><b>${i + 1}. ${a.t}</b><span>Prazo: ${dt(prazo)}${st === 'feito' ? ' · concluída' : st === 'andamento' ? ' · em andamento' : ''}</span></div><p><em>O que fazer</em>${a.a}</p><p><em>Comportamento esperado (o que a liderança vai observar)</em>${a.c}</p><p><em>Ponto de partida</em>${a.e}</p></div></section>`); });
      const q = tipo === 'G' ? ['O que mais atrapalha o resultado da loja hoje?', 'Em que você é bom e pode ensinar a outro gerente?', 'Que ajuda você precisa do supervisor ou da coordenação?'] : ['O que mais atrapalha o resultado da carteira hoje?', 'Em que você é bom e pode ensinar a outro supervisor?', 'Que ajuda você precisa da coordenação ou da diretoria?'];
      B.push(`<section class="tm-sec"><h3>5. Autoavaliação do gestor</h3>${r.disc && DISC[r.disc] ? `<p style="margin:0 0 4px"><b>Perfil DISC:</b> ${DISC[r.disc].n}</p>` : ''}${q.map((p, i) => `<div class="tm-q"><em>${p}</em>${resp(au['q' + (i + 1)], 2)}</div>`).join('')}</section>`);
      B.push(`<section class="tm-sec"><h3>6. Compromissos</h3><div class="tm-q"><em>Compromisso do gestor</em>${resp(t.compromisso, 3)}</div><div class="tm-q"><em>Apoio da liderança</em>${resp(t.apoio, 3)}</div></section>`);
      const rv1 = r.prox && r.prox > t.data ? r.prox : somaDias(t.data, 30);
      B.push(`<section class="tm-sec"><h3>7. Revisões do PDI</h3><table class="tm-t tm-rev"><thead><tr><th style="width:15%">Revisão</th><th style="width:16%">Data prevista</th><th style="width:16%">Realizada em</th><th>O que mudou no comportamento e nos números</th><th style="width:17%">Rubrica</th></tr></thead><tbody>${[['1ª · 30 dias', rv1], ['2ª · 60 dias', somaDias(t.data, 60)], ['3ª · 90 dias', somaDias(t.data, 90)]].map(z => `<tr><td>${z[0]}</td><td>${dt(z[1])}</td><td></td><td></td><td></td></tr>`).join('')}</tbody></table></section>`);
      B.push(`<section class="tm-sec"><h3>8. Ciência e assinaturas</h3><p class="tm-decl">Declaro que participei da conversa de Plano de Desenvolvimento Individual, que entendi a situação atual, as metas e as ações descritas neste termo, e que me comprometo a colocá-las em prática nos próximos 90 dias, com o apoio da liderança, nas datas de revisão acima.</p>
        <div class="tm-ass"><div>${esc(x.nome)}<small>${tipo === 'G' ? 'Gerente' : 'Supervisor'}</small></div><div>${t.lider ? esc(t.lider) : '&nbsp;'}<small>${tipo === 'G' ? 'Supervisor' : 'Coordenação'}</small></div><div>&nbsp;<small>${tipo === 'G' ? 'Coordenação' : 'Diretoria'}</small></div></div>
        <p class="tm-local">Local e data: ______________________________, ____/____/________</p></section>`);
      return B;
    }
    const termoNum = (x, t) => `PDI-${tipo}${tipo === 'G' ? x.c : supChave(x.sup)}-${String(t.data).replace(/-/g, '')}`;
    const termoPagina = (x, t) => `<div class="tm-pg"><header class="tm-hd"><img src="pdi-logo.jpg" alt=""><div class="tm-hd-t"><small>Plano de Desenvolvimento Individual</small><h2>PDI Mensal · ${tipo === 'G' ? 'Gerente' : 'Supervisor'} · Termo de compromisso</h2><span>${esc(x.nome)} · ${esc(x.rotulo)}</span></div><div class="tm-hd-n"><small>Termo nº</small><b>${esc(termoNum(x, t))}</b><small>${dt(t.data)}</small></div></header><div class="tm-faixa"><i></i><i></i><i></i></div><main class="tm-corpo"></main><footer class="tm-ft"><span><b>Só Tintas</b> · Colorindo Vidas e Realizando Sonhos</span><span>Documento interno · liderança e gestor</span><span data-pg></span></footer></div>`;
    async function termoPdf(x, t) {
      await Promise.all([carregaJs(LIB_H2C), carregaJs(LIB_PDF)]);
      try { await document.fonts.ready; } catch (e) {}
      const host = document.createElement('div'); host.className = 'tm-host'; host.setAttribute('aria-hidden', 'true'); document.body.appendChild(host);
      try {
        const pags = []; let corpo = null;
        const nova = () => { host.insertAdjacentHTML('beforeend', termoPagina(x, t)); const pg = host.lastElementChild; corpo = pg.querySelector('.tm-corpo'); pags.push(pg); };
        nova();
        await Promise.all([...host.querySelectorAll('img')].map(i => i.complete ? 0 : new Promise(ok => { i.onload = i.onerror = ok; })));
        for (const b of termoBlocos(x, t)) { corpo.insertAdjacentHTML('beforeend', b); if (corpo.scrollHeight > corpo.clientHeight + 1 && corpo.children.length > 1) { corpo.lastElementChild.remove(); nova(); corpo.insertAdjacentHTML('beforeend', b); } }
        pags.forEach((p, i) => { p.querySelector('[data-pg]').textContent = `Página ${i + 1} de ${pags.length}`; });
        const pdf = new global.jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true }), imgs = [];
        for (let i = 0; i < pags.length; i++) { const cv = await global.html2canvas(pags[i], { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true, scrollX: 0, scrollY: 0, windowWidth: 1200 }); const url = cv.toDataURL('image/jpeg', 0.88); imgs.push(url); if (i) pdf.addPage(); pdf.addImage(url, 'JPEG', 0, 0, 210, 297, undefined, 'FAST'); }
        pdf.setProperties({ title: `PDI ${x.nome} · ${x.rotulo}`, author: 'Só Tintas', subject: 'Plano de Desenvolvimento Individual', creator: 'Só Tintas App · PDI Mensal' });
        return { blob: pdf.output('blob'), imgs, nome: `PDI - ${limpaArq(x.nome)} (${tipo === 'G' ? 'Gerente' : 'Supervisor'}) - ${limpaArq(x.rotulo)} - ${String(t.data).split('-').reverse().join('-')}.pdf`.replace(/\s+/g, ' ') };
      } finally { host.remove(); }
    }
    function abrirTermo(x) {
      const r = S.REG[x.chave] || {}, ant = r.termo || {};
      const t = { data: hojeIso(), lider: ant.lider || opts.usuario || '', compromisso: ant.compromisso || '', apoio: ant.apoio || '' };
      let doc = null, ocupado = false; const volta = document.activeElement;
      const ov = document.createElement('div'); ov.className = 'tm-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Termo de PDI de ' + x.nome);
      ov.innerHTML = `<div class="tm-box"><div class="tm-top"><div><span class="pdi-lbl" style="display:block">Formalizar PDI · termo em PDF</span><b>${esc(x.nome)}</b><div class="pdi-meta">${esc(x.rotulo)} · ${TN[x.tier]}</div></div><button type="button" class="btn pequeno contorno" data-tm="fechar" aria-label="Fechar">✕</button></div>
        <div class="tm-form"><label class="pdi-q">Quem conduz a conversa<input type="text" data-tmf="lider" maxlength="80" value="${esc(t.lider)}" placeholder="Nome"></label><label class="pdi-q">Data da conversa<input type="date" data-tmf="data" value="${esc(t.data)}"></label>
          <label class="pdi-q tm-l2">Compromisso do gestor, nas palavras dele<textarea data-tmf="compromisso" maxlength="600" placeholder="Ex.: Toda segunda, até 12h, faço o PDI com todos os vendedores e marco no app; na quarta cobro os compromissos no balcão.">${esc(t.compromisso)}</textarea></label>
          <label class="pdi-q tm-l2">Apoio da liderança<textarea data-tmf="apoio" maxlength="600" placeholder="Ex.: O supervisor visita a loja toda semana até quarta e revisa os 5 maiores orçamentos junto.">${esc(t.apoio)}</textarea></label>
          <p class="pdi-meta tm-l2" style="margin:0">Situação, metas e plano de ação vêm da ficha. A autoavaliação, a meta escolhida, o DISC e o tema saem como foram registrados no acompanhamento.</p></div>
        <div class="tm-acoes"><button type="button" class="btn azul" data-tm="gerar">Gerar termo</button><button type="button" class="btn verde" data-tm="zap">Enviar pelo WhatsApp</button><button type="button" class="btn contorno" data-tm="baixar">Baixar PDF</button><span class="pdi-meta" data-tm-st role="status" aria-live="polite"></span></div><div class="tm-prev" data-tm-prev></div></div>`;
      document.body.appendChild(ov);
      const st = h => { ov.querySelector('[data-tm-st]').innerHTML = h; };
      const fechar = () => { document.removeEventListener('keydown', tecla); ov.remove(); if (volta && volta.focus) volta.focus(); };
      const tecla = e => { if (e.key === 'Escape') fechar(); };
      document.addEventListener('keydown', tecla);
      ov.addEventListener('input', e => { const k = e.target.dataset.tmf; if (k) { t[k] = e.target.value; doc = null; } });
      ov.addEventListener('change', e => { const k = e.target.dataset.tmf; if (k) { t[k] = e.target.value || (k === 'data' ? hojeIso() : ''); doc = null; } });
      const baixar = d => { const a = document.createElement('a'); a.href = URL.createObjectURL(d.blob); a.download = d.nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 8000); };
      async function gerar() {
        if (ocupado) return null; ocupado = true; st('Montando o termo…'); ov.querySelectorAll('[data-tm]').forEach(b => { if (b.dataset.tm !== 'fechar') b.disabled = true; });
        try { doc = await termoPdf(x, t); ov.querySelector('[data-tm-prev]').innerHTML = doc.imgs.map((u, i) => `<img src="${u}" alt="Termo de PDI, página ${i + 1} de ${doc.imgs.length}">`).join(''); st(`Termo pronto: ${doc.imgs.length} página(s). Confira abaixo e envie.`);
          if (pode(x)) { const ok = await salvar(x, { termo: { lider: t.lider.slice(0, 80), compromisso: t.compromisso.slice(0, 600), apoio: t.apoio.slice(0, 600), data: t.data, emitido: hojeIso(), por: opts.usuario || '' } }); if (ok) { const w = el.querySelector(`.pdi-row[data-id="${x.chave}"]`); if (w && S.abertos.has(x.chave)) w.nextElementSibling.innerHTML = ficha(x); } }
          return doc; }
        catch (e) { doc = null; st('<span class="pdi-bad">Não consegui gerar o PDF: ' + esc(e.message || e) + '</span>'); return null; }
        finally { ocupado = false; ov.querySelectorAll('[data-tm]').forEach(b => { b.disabled = false; }); }
      }
      ov.addEventListener('click', async e => {
        if (e.target === ov) { fechar(); return; }
        const b = e.target.closest('[data-tm]'); if (!b) return; const acao = b.dataset.tm;
        if (acao === 'fechar') { fechar(); return; }
        if (acao === 'gerar') { await gerar(); return; }
        if (!doc) { if (await gerar()) st(`Termo pronto. Toque de novo em <b>${acao === 'zap' ? 'Enviar pelo WhatsApp' : 'Baixar PDF'}</b>.`); return; }
        if (acao === 'baixar') { baixar(doc); st('PDF baixado: ' + esc(doc.nome)); return; }
        const msg = `PDI de ${x.nome} · ${x.rotulo} · Só Tintas`, f = new File([doc.blob], doc.nome, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: msg, text: msg }); st('Enviado.'); return; } catch (err) { if (err && err.name === 'AbortError') { st('Envio cancelado.'); return; } } }
        baixar(doc); st(`Este aparelho não envia arquivos direto para o WhatsApp, então o PDF foi baixado. <a href="https://wa.me/?text=${encodeURIComponent(msg + '\nSegue o termo do PDI em PDF.')}" target="_blank" rel="noopener">Abrir o WhatsApp</a> e anexe o arquivo (clipe 📎).`);
      });
    }

    /* ═════════════ eventos ═════════════ */
    el.onclick = async (e) => {
      const t = e.target.closest('[data-tab],[data-gerar],.pdi-row,[data-copy],[data-termo],[data-rev],[data-abrir]'); if (!t || !el.contains(t)) return;
      if (t.dataset.termo) { abrirTermo(xPor(t.dataset.termo)); return; }
      if (t.dataset.tab) { S.tab = t.dataset.tab; render(); return; }
      if (t.hasAttribute('data-gerar')) { if (!opts.gerarBase) return; t.disabled = true; t.textContent = 'Gerando…'; try { await opts.gerarBase(); toast('Base gerada'); } catch (err) { toast('Não gerou: ' + (err.message || err)); t.disabled = false; t.textContent = '⟳ Gerar base agora'; } return; }
      if (t.dataset.abrir) { S.abertos.add(t.dataset.abrir); S.tab = 'lista'; S.q = ''; render(); const b = el.querySelector(`.pdi-row[data-id="${t.dataset.abrir}"]`); if (b) b.scrollIntoView({ block: 'start' }); return; }
      if (t.dataset.copy) { const txt = texto(xPor(t.dataset.copy)); try { await navigator.clipboard.writeText(txt); toast('PDI copiado'); } catch (err) { const ta = document.createElement('textarea'); ta.value = txt; ta.className = 'pdi-copia'; el.appendChild(ta); ta.select(); toast('Texto selecionado: copie com Ctrl+C'); setTimeout(() => ta.remove(), 15000); } return; }
      if (t.dataset.rev) { const x = xPor(t.dataset.rev), ta = document.getElementById('pdg-rv-' + x.chave), txt = ta ? ta.value.trim() : ''; if (!txt) { toast('Escreva o registro da revisão'); return; } const revs = ((S.REG[x.chave] || {}).revisoes || []).concat([{ d: hojeIso(), t: txt.slice(0, 800), por: opts.usuario || '' }]).slice(-30); if (await salvar(x, { revisoes: revs })) render(); return; }
      if (t.classList.contains('pdi-row')) { const id = t.dataset.id; if (S.abertos.has(id)) S.abertos.delete(id); else S.abertos.add(id); const w = t.nextElementSibling; t.setAttribute('aria-expanded', S.abertos.has(id)); if (S.abertos.has(id)) { w.innerHTML = ficha(xPor(id)); w.hidden = false; } else { w.hidden = true; w.innerHTML = ''; } }
    };
    el.onchange = async (e) => {
      const t = e.target, x = t.dataset.v ? xPor(t.dataset.v) : null;
      if (t.dataset.acao) { const r = S.REG[x.chave] || {}, ac = Object.assign({}, r.acoes || {}); ac[t.dataset.acao] = Object.assign({}, ac[t.dataset.acao] || {}, { s: t.value, em: hojeIso() }); if (await salvar(x, { acoes: ac })) render(); }
      else if (t.dataset.acaoobs) { const r = S.REG[x.chave] || {}, ac = Object.assign({}, r.acoes || {}); ac[t.dataset.acaoobs] = Object.assign({}, ac[t.dataset.acaoobs] || {}, { obs: t.value.slice(0, 300) }); await salvar(x, { acoes: ac }); }
      else if (t.dataset.auto) { const r = S.REG[x.chave] || {}; await salvar(x, { auto: Object.assign({}, r.auto || {}, { [t.dataset.auto]: t.value.slice(0, 600) }) }); }
      else if (t.dataset.minha) { const w = xPor(t.dataset.minha), r = S.REG[w.chave] || {}; if (await salvar(w, { auto: Object.assign({}, r.auto || {}, { meta: t.value }) })) render(); }
      else if (t.dataset.disc) { const w = xPor(t.dataset.disc); if (await salvar(w, { disc: t.value })) render(); }
      else if (t.dataset.prox) { const w = xPor(t.dataset.prox); if (await salvar(w, { prox: t.value })) render(); }
      else if (t.dataset.tema) { const w = xPor(t.dataset.tema); await salvar(w, { tema: t.value.slice(0, 120) }); }
    };
    el.oninput = (e) => { if (e.target.matches('[data-busca]')) { S.q = e.target.value; clearTimeout(S._qt); S._qt = setTimeout(() => { const pos = e.target.selectionStart; render(); const i = el.querySelector('[data-busca]'); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (er) {} } }, 250); } };
    render();
    return { render, estado: S, lista: L };
  }
  global.PdiGestoresUI = { montar, preparar, acoesDe, metasDe, score, TN };
})(window);
