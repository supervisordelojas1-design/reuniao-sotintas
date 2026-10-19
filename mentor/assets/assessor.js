/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO — Assessor ST
   Ferramentas técnicas que funcionam sem IA:
     • Calculadora de tinta
     • Especificador (superfície × condição × sistema)
     • Diagnóstico de problemas
     • Resposta local (busca na base de conhecimento) — usada na
       demonstração e como reserva quando a IA não responde
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* ───────────────────────── Calculadora de tinta ───────────────────────── */
  // Rendimento médio POR DEMÃO (m² por litro ou por kg), valores de referência de mercado.
  // O gestor pode ajustar na tabela "produtos_calculo" (conteudo.js).
  const PRODUTOS_PADRAO = [
    { id: 'acrilica_premium', nome: 'Tinta acrílica premium (parede)', unidade: 'L', rendimento: 16, demaos: 2, embalagens: [18, 3.6, 0.9], dica: 'Diluição de 10% a 20% com água na 1ª demão; siga a lata.' },
    { id: 'acrilica_standard', nome: 'Tinta acrílica standard / látex PVA', unidade: 'L', rendimento: 12, demaos: 2, embalagens: [18, 3.6, 0.9], dica: 'Látex PVA só em interiores secos. Diluição até 20%.' },
    { id: 'acrilica_rende_muito', nome: 'Tinta acrílica rendimento extra', unidade: 'L', rendimento: 19, demaos: 2, embalagens: [18, 3.6, 0.9], dica: 'Rende mais em superfície selada e lisa.' },
    { id: 'esmalte', nome: 'Esmalte sintético / esmalte à base d’água', unidade: 'L', rendimento: 12, demaos: 2, embalagens: [3.6, 0.9, 0.225], dica: 'Lixar levemente entre demãos. Respeite o tempo de secagem.' },
    { id: 'textura', nome: 'Textura acrílica (rolo)', unidade: 'kg', rendimento: 0.8, demaos: 1, embalagens: [25, 5.8], dica: '1 kg cobre menos de 1 m²: calcule com folga.' },
    { id: 'massa_corrida', nome: 'Massa corrida PVA (interior)', unidade: 'kg', rendimento: 1.1, demaos: 2, embalagens: [25, 5.8, 1.5], dica: 'Camadas finas; lixar entre demãos. Nunca em área externa ou úmida.' },
    { id: 'massa_acrilica', nome: 'Massa acrílica (externo / áreas úmidas)', unidade: 'kg', rendimento: 1.0, demaos: 2, embalagens: [25, 5.8, 1.5], dica: 'Use em fachadas, banheiros e cozinhas.' },
    { id: 'selador', nome: 'Selador acrílico', unidade: 'L', rendimento: 10, demaos: 1, embalagens: [18, 3.6, 0.9], dica: 'Obrigatório em reboco novo e superfícies porosas.' },
    { id: 'fundo_preparador', nome: 'Fundo preparador de paredes', unidade: 'L', rendimento: 8, demaos: 1, embalagens: [18, 3.6, 0.9], dica: 'Para superfícies pulverulentas (soltando pó) ou com tinta antiga fraca.' },
    { id: 'zarcao', nome: 'Fundo anticorrosivo (metal)', unidade: 'L', rendimento: 10, demaos: 1, embalagens: [3.6, 0.9], dica: 'Remova toda a ferrugem antes.' },
    { id: 'verniz', nome: 'Verniz para madeira', unidade: 'L', rendimento: 11, demaos: 3, embalagens: [3.6, 0.9], dica: 'Lixar entre demãos para melhor acabamento.' },
    { id: 'piso', nome: 'Tinta para piso', unidade: 'L', rendimento: 8, demaos: 2, embalagens: [18, 3.6], dica: 'Piso deve estar limpo, seco e sem brilho.' },
  ];

  function produtos(cont) { return (cont && cont.produtos_calculo && cont.produtos_calculo.length) ? cont.produtos_calculo : PRODUTOS_PADRAO; }

  function calcularEmbalagens(quantidade, embalagens) {
    // Procura a combinação de embalagens que cobre a quantidade com o menor custo estimado.
    // Embalagens maiores custam menos por litro: peso 1,0 para a maior, +0,25 a cada tamanho menor.
    const tam = [...embalagens].sort((a, b) => b - a);
    if (quantidade <= 0) return [];
    const peso = tam.map((_, k) => 1 + k * 0.25);
    const limites = tam.map(e => Math.ceil(quantidade / e) + 1);
    let melhor = null;
    const rec = (k, acc, total, custo, latas) => {
      if (k === tam.length) {
        if (total + 1e-9 >= quantidade) {
          if (!melhor || custo < melhor.custo - 1e-9 || (Math.abs(custo - melhor.custo) < 1e-9 && latas < melhor.latas)) melhor = { acc: acc.slice(), custo, latas };
        }
        return;
      }
      for (let n = 0; n <= limites[k]; n++) {
        acc[k] = n;
        rec(k + 1, acc, total + n * tam[k], custo + n * tam[k] * peso[k], latas + n);
        if (total + n * tam[k] >= quantidade) break; // já cobriu com este tamanho; mais latas só aumentam o custo
      }
      acc[k] = 0;
    };
    rec(0, [], 0, 0, 0);
    return (melhor ? melhor.acc : []).map((n, k) => ({ embalagem: tam[k], qtd: n })).filter(x => x.qtd > 0);
  }

  function calcularTinta({ area, descontos, demaos, produtoId, rendimento, perda }, cont) {
    const lista = produtos(cont);
    const p = lista.find(x => x.id === produtoId) || lista[0];
    const areaLiquida = Math.max(0, (Number(area) || 0) - (Number(descontos) || 0));
    const nDemaos = Number(demaos) || p.demaos;
    const rend = Number(rendimento) || p.rendimento;
    const fatorPerda = 1 + (Number(perda) || 0) / 100;
    const quantidade = (areaLiquida * nDemaos / rend) * fatorPerda;
    const embalagens = calcularEmbalagens(quantidade, p.embalagens);
    const totalComprado = embalagens.reduce((s, e) => s + e.embalagem * e.qtd, 0);
    return { produto: p, area_liquida: areaLiquida, demaos: nDemaos, rendimento: rend, quantidade: Math.round(quantidade * 100) / 100, embalagens, total_comprado: totalComprado, sobra: Math.round((totalComprado - quantidade) * 100) / 100 };
  }

  function sugerirComplementos(areaLiquida, tipo) {
    const itens = [
      { item: 'Rolo de lã (23 cm) + garfo', qtd: areaLiquida > 120 ? 2 : 1, obs: 'Lã baixa para acabamento liso; lã alta para textura/reboco' },
      { item: 'Pincel / trincha 2" para recortes', qtd: 1, obs: 'Cantos, rodapés e batentes' },
      { item: 'Bandeja + grade', qtd: 1, obs: '' },
      { item: 'Fita crepe (rolo 50 m)', qtd: Math.max(1, Math.ceil(areaLiquida / 40)), obs: 'Proteger esquadrias, tomadas e rodapés' },
      { item: 'Lixa de parede (grão 120/150)', qtd: Math.max(2, Math.ceil(areaLiquida / 15)), obs: 'Lixar entre demãos de massa e antes da tinta' },
      { item: 'Lona plástica / papelão', qtd: Math.max(1, Math.ceil(areaLiquida / 60)), obs: 'Proteção do piso e móveis' },
      { item: 'Espátula + desempenadeira de aço', qtd: 1, obs: 'Para aplicar massa e remover partes soltas' },
      { item: 'Extensor para rolo', qtd: 1, obs: 'Tetos e paredes altas' },
    ];
    if (tipo === 'esmalte' || tipo === 'verniz') itens.splice(0, 1, { item: 'Rolo de espuma 9 cm + pincel', qtd: 1, obs: 'Acabamento liso em esquadrias e madeira' });
    return itens;
  }

  /* ───────────────────────── Especificador ───────────────────────── */
  const ACABAMENTOS = {
    fosco: 'Fosco — disfarça imperfeições; indicado para tetos e paredes com pequenas irregularidades.',
    acetinado: 'Acetinado — leve brilho, mais lavável; ótimo para salas, quartos e corredores.',
    semibrilho: 'Semibrilho — alta lavabilidade; cozinhas, banheiros, áreas de serviço.',
    brilhante: 'Brilhante — máxima resistência; esquadrias, portas e metais (esmalte).',
  };

  function especificar({ superficieId, ambiente, condicoes, acabamento, marca }, cont) {
    const sup = (cont.especificador.superficies || []).find(s => s.id === superficieId);
    if (!sup) return null;
    condicoes = condicoes || [];
    const produtos = recomendarProdutos({ superficieId, ambiente, condicoes, acabamento, marca: marca || 'Ambas' }, cont);
    const passos = [];
    const alertas = [];
    const perguntas = [];
    const verificar = [...(sup.verificar || [])];
    const preparacao = [...(sup.preparacao || [])];
    // Condições extras (vindas dos guias)
    for (const c of condicoes) {
      const regra = (cont.especificador.condicoes || []).find(x => x.id === c);
      if (!regra) continue;
      if (regra.preparacao) preparacao.push(...regra.preparacao);
      if (regra.alerta) alertas.push(regra.alerta);
      if (regra.pergunta) perguntas.push(regra.pergunta);
    }
    // Ambiente
    const amb = (cont.especificador.ambientes || []).find(a => a.id === ambiente) || {};
    const sistema = [];
    if (sup.fundo) sistema.push(sup.fundo);
    if (amb.fundo_extra) sistema.push(amb.fundo_extra);
    if (sup.massa) sistema.push(amb.id === 'externo' || amb.id === 'umido' ? sup.massa.replace('massa corrida', 'massa acrílica') : sup.massa);
    const acab = sup.acabamento_externo && (amb.id === 'externo' || amb.id === 'umido') ? sup.acabamento_externo : (sup.acabamento || 'Tinta acrílica premium, 2 a 3 demãos');
    sistema.push(acab + (acabamento ? ' — acabamento ' + acabamento : ''));
    if (amb.alerta) alertas.push(amb.alerta);
    if (sup.nao_faca) alertas.push('NÃO FAÇA: ' + sup.nao_faca);
    passos.push({ titulo: 'Antes de pintar, verifique', itens: verificar });
    passos.push({ titulo: 'Preparação', itens: preparacao });
    passos.push({ titulo: 'Sistema de pintura recomendado', itens: sistema });
    passos.push({ titulo: 'Ferramentas', itens: sup.ferramentas || ['Rolo de lã baixa', 'Pincel para recortes', 'Lixa 120/150', 'Espátula', 'Fita crepe', 'Lona de proteção'] });
    perguntas.push(...(cont.especificador.perguntas_padrao || []));
    return { superficie: sup, ambiente: amb, passos, alertas, perguntas, acabamento_descricao: ACABAMENTOS[acabamento] || '', produtos, marca: marca || 'Ambas' };
  }

  function textoEspecificacao(spec, extra) {
    extra = extra || {};
    const l = [];
    l.push('*ESPECIFICAÇÃO TÉCNICA — Só Tintas*');
    if (extra.cliente) l.push('Cliente: ' + extra.cliente);
    l.push('Superfície: ' + spec.superficie.nome + (spec.ambiente.nome ? ' | Ambiente: ' + spec.ambiente.nome : ''));
    if (spec.acabamento_descricao) l.push('Acabamento: ' + spec.acabamento_descricao.split(' — ')[0]);
    for (const p of spec.passos) {
      l.push('');
      l.push('*' + p.titulo.toUpperCase() + '*');
      p.itens.forEach(i => l.push('• ' + i));
    }
    if (spec.produtos && spec.produtos.length && extra.semProdutos !== true) {
      l.push(''); l.push('*PRODUTOS SUGERIDOS' + (spec.marca && spec.marca !== 'Ambas' ? ' (' + spec.marca + ')' : ' (Coral / Eucatex)') + '*');
      for (const g of spec.produtos) {
        l.push('• ' + g.etapa + ':');
        g.produtos.forEach(p => l.push('   – ' + p.marca + ' ' + p.nome + (resumoRendimento(p) ? ' · ' + resumoRendimento(p) : '')));
      }
    }
    if (spec.alertas.length) { l.push(''); l.push('*ATENÇÃO*'); spec.alertas.forEach(a => l.push('⚠️ ' + a)); }
    if (extra.calculo) {
      l.push(''); l.push('*QUANTIDADE ESTIMADA*');
      l.push('• ' + extra.calculo.produto.nome + ': ' + extra.calculo.quantidade + ' ' + extra.calculo.produto.unidade + ' (' + extra.calculo.demaos + ' demãos em ' + extra.calculo.area_liquida + ' m²)');
      extra.calculo.embalagens.forEach(e => l.push('   – ' + e.qtd + ' × ' + e.embalagem + ' ' + extra.calculo.produto.unidade));
    }
    l.push(''); l.push('_Gerado no MENTOR ST PRO. Confira sempre as instruções da embalagem do produto._');
    return l.join('\n');
  }

  /* ───────────────────────── Catálogo de produtos (Coral + Eucatex) ─────────────────────────
     Os produtos vêm de CONTEUDO.produtos (assets/conteudo-produtos.js, editável no Painel do Gestor).
     Cada produto tem uma "classe" (ex.: selador, acrilica_premium) e CONTEUDO.sistemas diz quais
     classes entram em cada etapa (fundo → massa → acabamento) para cada superfície do Especificador. */
  const AMB_PRODUTO = { interno_seco: 'interior', umido: 'interior', externo: 'exterior' };
  const SINONIMOS_ACAB = { fosco: ['fosco'], acetinado: ['acetinado'], semibrilho: ['semibrilho', 'semi-brilho'], brilhante: ['brilhante', 'alto brilho', 'brilho'] };
  const semAcento = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const fmtM2 = (v) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  // "Coral Mactra" conta como Coral (sub-marca)
  const mesmaMarca = (marcaProduto, marca) => !marca || marca === 'Ambas' || semAcento(marcaProduto).startsWith(semAcento(marca));
  function listaProdutos(cont) { return ((cont && cont.produtos) || []).filter(p => p && p.ativo !== false); }
  function classeNome(classe, cont) { return ((cont && cont.classes_produto) || {})[classe] || String(classe || '').replace(/_/g, ' '); }
  function produtoPorId(id, cont) { return listaProdutos(cont).find(p => p.id === id) || null; }
  function embalagensProduto(p) { return Object.keys((p && p.rend) || {}); }
  // Rendimento POR DEMÃO de uma embalagem (é o número que a Calculadora usa)
  function rendimentoPorDemao(p, emb) {
    const v = p && p.rend ? Number(p.rend[emb]) : 0;
    if (!v) return null;
    if (p.rend_tipo === 'acabado') {
      return { valor: Math.round(v * 2), catalogo: v, nota: `Catálogo: ${fmtM2(v)} m² de parede pronta com ${emb} (${p.demaos || '2 a 3'} demãos) → considerado ${fmtM2(Math.round(v * 2))} m² por demão (2 demãos).` };
    }
    return { valor: v, catalogo: v, nota: `Catálogo: ${fmtM2(v)} m² por demão com ${emb}.` };
  }
  function resumoRendimento(p) {
    const embs = embalagensProduto(p); if (!embs.length) return '';
    const e = embs[0]; const v = p.rend[e];
    return `${e} ≈ ${fmtM2(v)} m²${p.rend_tipo === 'acabado' ? ` prontos (${p.demaos || '2 a 3'} demãos)` : ' por demão'}`;
  }
  function produtosPorClasse(classes, cont, opts) {
    opts = opts || {}; classes = [].concat(classes || []);
    const amb = opts.ambiente ? (AMB_PRODUTO[opts.ambiente] || opts.ambiente) : null;
    let lista = listaProdutos(cont).filter(p => classes.includes(p.classe));
    if (opts.marca && opts.marca !== 'Ambas') lista = lista.filter(p => mesmaMarca(p.marca, opts.marca));
    if (amb) { const f = lista.filter(p => !p.ambiente || p.ambiente === 'ambos' || p.ambiente === amb); if (f.length) lista = f; }
    if (opts.acabamento && SINONIMOS_ACAB[opts.acabamento]) {
      const sin = SINONIMOS_ACAB[opts.acabamento];
      const f = lista.filter(p => (p.acabamento || []).some(a => sin.some(s => semAcento(a).includes(semAcento(s)))));
      if (f.length) lista = f;
    }
    const limite = opts.limite || 3; const porMarca = {};
    return lista
      .sort((a, b) => classes.indexOf(a.classe) - classes.indexOf(b.classe))
      .filter(p => { porMarca[p.marca] = (porMarca[p.marca] || 0) + 1; return porMarca[p.marca] <= limite; });
  }
  // Monta a lista de produtos sugeridos para uma especificação (por etapa)
  function recomendarProdutos({ superficieId, ambiente, condicoes, acabamento, marca }, cont) {
    const sis = ((cont && cont.sistemas) || {})[superficieId]; if (!sis) return [];
    const chaveAmb = ambiente === 'externo' ? 'externo' : ambiente === 'umido' ? 'umido' : null;
    const etapa = (k) => (chaveAmb && sis[chaveAmb] && sis[chaveAmb][k]) || sis[k] || [];
    const grupos = [];
    for (const c of condicoes || []) {
      const classes = ((cont.condicoes_produtos || {})[c]) || []; if (!classes.length) continue;
      const regra = (cont.especificador.condicoes || []).find(x => x.id === c);
      const prods = produtosPorClasse(classes, cont, { marca, ambiente, limite: 2 });
      if (prods.length) grupos.push({ etapa: 'Tratamento — ' + (regra ? regra.nome : c), tipo: 'tratamento', classes, produtos: prods });
    }
    for (const [k, titulo] of [['fundo', 'Fundo / preparação'], ['massa', 'Massa (nivelamento)'], ['acabamento', 'Acabamento']]) {
      const classes = etapa(k); if (!classes.length) continue;
      const prods = produtosPorClasse(classes, cont, { marca, ambiente, acabamento: k === 'acabamento' ? acabamento : null });
      if (prods.length) grupos.push({ etapa: titulo, tipo: k, classes, produtos: prods });
    }
    return grupos;
  }
  function linhaProduto(p, cont) {
    const r = embalagensProduto(p).map(e => `${e} ≈ ${fmtM2(p.rend[e])} m²`).join(', ');
    return `- [${p.marca}] ${p.nome}${p.linha ? ' (' + p.linha + ')' : ''} — ${classeNome(p.classe, cont)} · ${p.ambiente === 'ambos' ? 'interior e exterior' : p.ambiente || ''}${(p.acabamento || []).length ? ' · ' + p.acabamento.join('/') : ''}${r ? ' · rendimento ' + r + (p.rend_tipo === 'acabado' ? ' prontos (' + (p.demaos || '2 a 3') + ' demãos)' : ' por demão') : ''}${p.destaque ? ' · ' + p.destaque : ''}`;
  }
  function fichaProduto(p, cont) {
    const l = [`Marca: ${p.marca}${p.linha ? ' · Linha: ' + p.linha : ''}`, `Tipo: ${classeNome(p.classe, cont)}`];
    if (p.ambiente) l.push('Ambiente: ' + (p.ambiente === 'ambos' ? 'interior e exterior' : p.ambiente));
    if ((p.superficies || []).length) l.push('Superfícies: ' + p.superficies.join(', '));
    if ((p.acabamento || []).length && p.acabamento[0] !== 'não aplicável') l.push('Acabamento: ' + p.acabamento.join(', '));
    if (p.diluicao) l.push('Diluição: ' + p.diluicao);
    if (p.demaos) l.push('Demãos: ' + p.demaos);
    if (p.secagem) l.push('Secagem: ' + p.secagem);
    const r = embalagensProduto(p).map(e => `${e} ≈ ${fmtM2(p.rend[e])} m²`).join(' · ');
    if (r) l.push('Rendimento: ' + r + (p.rend_tipo === 'acabado' ? ' (parede pronta, ' + (p.demaos || '2 a 3') + ' demãos)' : ' (por demão)'));
    if (p.obs) l.push('Obs.: ' + p.obs);
    if (p.destaque) l.push('Destaque: ' + p.destaque);
    return l.join('\n');
  }
  // Entradas de base de conhecimento geradas a partir do catálogo (para o chat sem IA)
  function kbProdutos(cont) {
    if (!cont) return [];
    const lista = listaProdutos(cont);
    if (cont._kbProdutos && cont._kbProdutos.n === lista.length) return cont._kbProdutos.itens;
    const porClasse = {};
    for (const p of lista) (porClasse[p.classe] = porClasse[p.classe] || []).push(p);
    const itens = [];
    for (const classe of Object.keys(porClasse)) {
      const prods = porClasse[classe];
      itens.push({ id: 'prod_classe_' + classe, produto: true, titulo: 'Produtos: ' + classeNome(classe, cont), tags: [classeNome(classe, cont), ...prods.map(p => p.nome), ...new Set(prods.flatMap(p => p.superficies || []))], conteudo: prods.map(p => linhaProduto(p, cont)).join('\n') });
    }
    for (const p of lista) itens.push({ id: 'prod_' + p.id, produto: true, titulo: p.marca + ' ' + p.nome, tags: [p.marca, p.linha || '', classeNome(p.classe, cont), ...(p.superficies || [])].filter(Boolean), conteudo: fichaProduto(p, cont) });
    cont._kbProdutos = { n: lista.length, itens };
    return itens;
  }
  function textoCatalogo(cont, opts) {
    opts = opts || {};
    const lista = listaProdutos(cont).filter(p => mesmaMarca(p.marca, opts.marca));
    return lista.map(p => linhaProduto(p, cont)).join('\n');
  }

  /* ───────────────────────── Diagnóstico ───────────────────────── */
  function diagnosticar(problemaId, cont) {
    return (cont.diagnostico || []).find(p => p.id === problemaId) || null;
  }

  /* ───────────────────────── Resposta local (sem IA) ───────────────────────── */
  const STOP = new Set('a o os as um uma uns umas de do da dos das em no na nos nas por para com sem que e ou se ao à às é são ser foi mas como mais menos muito pouco qual quais quando onde isso essa esse este esta aqui ali já não sim pode posso tem tenho fazer faz devo deve ele ela eles elas eu voce você meu minha seu sua tinta tintas parede paredes'.split(' '));
  function tokens(t) {
    return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
  }
  function pontuar(itens, q) {
    return itens.map(item => {
      const texto = tokens(item.titulo + ' ' + (item.tags || []).join(' ') + ' ' + item.conteudo);
      const set = new Set(texto);
      let pontos = 0;
      for (const w of q) { if (set.has(w)) pontos += 1; if (tokens(item.titulo).includes(w)) pontos += 2; if ((item.tags || []).some(t => tokens(t).includes(w))) pontos += 3; }
      return { item, pontos };
    }).filter(x => x.pontos > 0).sort((a, b) => b.pontos - a.pontos);
  }
  function responderLocal(pergunta, cont) {
    const kb = cont.base_conhecimento || [];
    const q = tokens(pergunta);
    if (!q.length) return 'Me conte um pouco mais: qual é a superfície, o ambiente e o que o cliente quer fazer?';
    const guias = pontuar(kb, q);
    const produtosKb = pontuar(kbProdutos(cont), q).filter(x => x.pontos >= 3); // só entra se bater em título/tag
    if (!guias.length && !produtosKb.length) {
      return 'Não encontrei esse assunto na base dos guias nem no catálogo. Tente perguntar com outras palavras (ex.: "reboco novo", "mofo", "quantas demãos", "esmalte em madeira", "selador Coral") ou use o Especificador, o Diagnóstico e a aba Produtos aqui no Assessor.';
    }
    const partes = guias.slice(0, produtosKb.length ? 1 : 2).map(x => '📘 *' + x.item.titulo + '*\n' + x.item.conteudo.trim());
    if (produtosKb.length) partes.push('🛒 *' + produtosKb[0].item.titulo + '*\n' + produtosKb[0].item.conteudo.trim());
    return partes.join('\n\n') + '\n\n_Resposta montada a partir dos guias técnicos e do catálogo Coral/Eucatex da Só Tintas. Para uma orientação personalizada, use o Especificador._';
  }

  function montarSystemPrompt(cont) {
    const kb = (cont.base_conhecimento || []).map(k => '## ' + k.titulo + '\n' + k.conteudo.trim()).join('\n\n');
    return [
      'Você é o Assessor ST, o assistente técnico da Só Tintas (rede de lojas de tintas do Rio de Janeiro, que trabalha com as marcas Coral e Eucatex).',
      'Seu público são vendedores e novos colaboradores das lojas. Responda em português do Brasil, de forma prática, curta e segura, como um colega experiente de balcão.',
      'Use a BASE DE CONHECIMENTO abaixo como fonte principal. Quando a pergunta sair dela, use seu conhecimento geral de pintura e construção civil, deixando claro que é uma orientação geral.',
      'Sempre que fizer sentido: 1) pergunte superfície, condição e ambiente antes de indicar produto; 2) lembre de conferir a embalagem/ficha técnica do produto; 3) nunca prometa resultado se a causa do problema (umidade, infiltração, vazamento) não for resolvida.',
      'Ao indicar produto, use os nomes exatos do CATÁLOGO abaixo (Coral e Eucatex) e, quando couber, ofereça uma opção de cada marca. Não invente nomes de produtos, códigos de cor ou preços. Se não souber, diga que vai confirmar com o gestor ou na ficha técnica.',
      'Formato: parágrafos curtos ou listas com até 6 itens. Sem markdown pesado (sem tabelas, sem títulos grandes).',
      '', '# BASE DE CONHECIMENTO', kb,
      '', '# CATÁLOGO DE PRODUTOS (rendimento por embalagem)', textoCatalogo(cont),
    ].join('\n');
  }

  global.Assessor = {
    PRODUTOS_PADRAO, produtos, calcularTinta, calcularEmbalagens, sugerirComplementos, especificar, textoEspecificacao, diagnosticar, responderLocal, montarSystemPrompt, ACABAMENTOS,
    // catálogo
    listaProdutos, mesmaMarca, classeNome, produtoPorId, embalagensProduto, rendimentoPorDemao, resumoRendimento, produtosPorClasse, recomendarProdutos, linhaProduto, fichaProduto, kbProdutos, textoCatalogo, AMB_PRODUTO,
  };
})(window);
