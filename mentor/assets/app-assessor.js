/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO — Assessor ST (telas)
   Abas: Calculadora de Materiais · Especificador · Diagnóstico · Cores · Chat IA
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  const { $, $$, esc, fmtNum } = global.AppUtil;
  const App = global.App;
  const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const num = (v) => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isNaN(n) ? 0 : n; };
  const uid = () => DB.util.uuid();

  /* ───────────────────────── estado da calculadora (persistido) ───────────────────────── */
  const CALC_KEY = () => 'mentorst_calc_' + (App.user ? App.user.login : 'anon');
  function calcLer() { try { return JSON.parse(localStorage.getItem(CALC_KEY())) || {}; } catch (e) { return {}; } }
  function calcSalvar() { try { localStorage.setItem(CALC_KEY(), JSON.stringify({ projetos: C.projetos, rascunho: C.rascunho })); } catch (e) {} }
  const C = { tela: 'inicio', projetos: [], rascunho: null, ambientes: [], rapido: { area: '', demaos: 2, rend: '', preco: '' }, comp: { area: '', demaos: 2, a: { rend: '', preco: '' }, b: { rend: '', preco: '' } }, carregado: false };
  function calcInit() { if (C.carregado) return; const d = calcLer(); C.projetos = d.projetos || []; C.rascunho = d.rascunho || null; C.carregado = true; }
  const PRODUTOS = ['Tinta', 'Massa corrida', 'Massa acrílica', 'Selador', 'Fundo preparador', 'Primer', 'Textura', 'Verniz', 'Esmalte', 'Outro'];
  const EMB_TINTA = ['900 ml', '3,2 L', '3,6 L', '16 L', '18 L'], EMB_OUTROS = ['1 Kg', '3,6 Kg', '15 Kg', '18 Kg', '25 Kg'];
  const liquido = (t) => ['Tinta', 'Selador', 'Fundo preparador', 'Primer', 'Verniz', 'Esmalte'].includes(t);
  // Quais classes do catálogo (conteudo-produtos.js) aparecem em cada tipo da Calculadora
  const CLASSES_POR_TIPO = {
    'Tinta': ['acrilica_super_premium', 'acrilica_premium', 'acrilica_standard', 'acrilica_economica', 'lavavel', 'impermeabilizante_parede', 'gesso_drywall', 'tinta_piso', 'epoxi', 'efeito_decorativo', 'manta_liquida', 'resina'],
    'Massa corrida': ['massa_corrida'], 'Massa acrílica': ['massa_acrilica', 'reparo'], 'Selador': ['selador', 'seladora_madeira'], 'Fundo preparador': ['fundo_preparador', 'antimofo', 'umidade_rodape'],
    'Primer': ['fundo_anticorrosivo', 'fundo_galvanizado', 'fundo_madeira', 'promotor_aderencia', 'neutralizador_ferrugem'], 'Textura': ['textura'], 'Verniz': ['verniz', 'stain'], 'Esmalte': ['esmalte_sintetico', 'esmalte_agua', 'esmalte_antiferrugem'],
  };
  const tipoPorClasse = (classe) => Object.keys(CLASSES_POR_TIPO).find(t => CLASSES_POR_TIPO[t].includes(classe)) || 'Outro';
  const marcaCor = (m) => /^coral/i.test(m || '') ? 'marca-coral' : /^eucatex/i.test(m || '') ? 'marca-eucatex' : 'cinza';
  const nomeMaterial = (m) => m.produto_nome || m.tipo;
  const thumb = (p, cls) => p && p.imagem ? `<img class="thumb-prod ${cls || ''}" src="${esc(p.imagem)}" alt="" loading="lazy">` : `<span class="thumb-prod vazio ${cls || ''}">🪣</span>`;

  /* ───────────────────────── tela principal do Assessor ───────────────────────── */
  App.views.assessor = ([aba, ...resto]) => {
    aba = aba || App.cache.abaAssessor || 'calc'; App.cache.abaAssessor = aba;
    calcInit();
    const abas = [['calc', '🧮 Calculadora'], ['espec', '📐 Especificador'], ['diag', '🩺 Diagnóstico'], ['produtos', '🛒 Produtos'], ['cores', '🎨 Cores'], ['chat', '💬 Chat IA']];
    if (App.views.assessorExtras) for (const [k, l] of App.views.assessorExtras()) abas.push([k, l]);
    const corpo = { calc: telaCalc, espec: telaEspec, diag: telaDiag, cores: telaCores, produtos: telaProdutos, chat: telaChat, ...(App.telasAssessorExtras || {}) }[aba] || telaCalc;
    return App.cabecalho('Assessor ST', 'Seu consultor técnico de bolso', { cor: 'escuro' }) + `<div class="tela">
      <div class="abas">${abas.map(([k, l]) => `<button class="${aba === k ? 'ativa' : ''}" onclick="location.hash='#/assessor/${k}'">${l}</button>`).join('')}</div>
      ${corpo(resto)}</div>`;
  };
  const ir = (tela) => { C.tela = tela; App.render(); };
  App.calc = { ir, C };

  /* ═══════════════════════ CALCULADORA DE MATERIAIS ═══════════════════════ */
  function telaCalc() {
    const t = C.tela;
    if (t === 'area') return calcArea();
    if (t === 'calc-area') return calcAreaAmbientes();
    if (t === 'material') return calcMaterial();
    if (t === 'dados') return calcDados();
    if (t === 'resultado') return calcResultado();
    if (t === 'projeto') return calcProjeto();
    if (t === 'projetos') return calcProjetos();
    if (t === 'rapido') return calcRapido();
    if (t === 'comparador') return calcComparador();
    return calcInicio();
  }
  function progresso(n) { return `<div class="linha mb-2" style="gap:6px">${[1, 2, 3, 4].map(i => `<div style="flex:1;height:7px;border-radius:99px;background:${i <= n ? 'var(--vermelho)' : '#E4E7EE'}"></div>`).join('')}</div>`; }
  function calcInicio() {
    const proj = C.projetos.slice(-3).reverse();
    return `<div class="card"><h2>Calcule quanto material comprar para cada serviço</h2><p class="pequeno texto-2">Sem planilhas. Informe a metragem e descubra a quantidade exata — tinta, massa, selador, textura, esmalte…</p>
      <button class="btn bloco" onclick="App.calc.novo()">＋ NOVO CÁLCULO</button>
      <button class="btn bloco contorno mt-1" onclick="App.calc.ir('calc-area')">📏 CALCULADORA DE ÁREA</button>
      <div class="grade-2 mt-2"><button class="btn cinza" onclick="App.calc.ir('rapido')">⚡ Cálculo rápido</button><button class="btn cinza" onclick="App.calc.ir('comparador')">⚖️ Comparador</button></div></div>
      ${C.rascunho && C.rascunho.materiais && C.rascunho.materiais.length ? `<div class="card destaque clicavel" onclick="App.calc.ir('projeto')"><div class="etiqueta amarela">Obra em andamento</div><div class="negrito mt-1">${esc(C.rascunho.nome || 'Nova obra')} · ${C.rascunho.materiais.length} material(is)</div><div class="pequeno texto-2">Total estimado ${fmtBRL(totalProjeto(C.rascunho))}</div></div>` : ''}
      <div class="linha entre mt-2"><h3 style="margin:0">Meus cálculos</h3>${C.projetos.length ? `<button class="btn link pequeno" onclick="App.calc.ir('projetos')">Ver todos ›</button>` : ''}</div>
      ${proj.length ? proj.map(p => `<div class="item-lista" onclick="App.calc.abrirProjeto('${p.id}')"><span class="num">📁</span><div class="cresce"><div class="titulo">${esc(p.nome)}</div><div class="desc">Área ${fmtNum(p.totalArea, 0)} m² · ${p.materiais.length} material(is) · ${fmtBRL(totalProjeto(p))}</div></div><span class="seta">›</span></div>`).join('') : '<p class="pequeno texto-3">Nenhum cálculo salvo ainda.</p>'}`;
  }
  App.calc.novo = () => { C.rascunho = { id: uid(), nome: 'Nova obra', totalArea: 0, materiais: [], atual: null, criado_em: new Date().toISOString() }; calcSalvar(); ir('area'); };
  function calcArea() {
    const r = C.rascunho || (App.calc.novo(), C.rascunho);
    return progresso(1) + `<div class="card"><h2>Qual área será pintada?</h2><p class="pequeno texto-2">Informe a metragem total ou deixe a gente calcular para você.</p>
      <div class="card info" style="margin-bottom:10px"><div class="etiqueta azul">Já sei a metragem</div><div class="campo mt-1"><input id="c-area" type="number" inputmode="decimal" placeholder="0" value="${r.totalArea || ''}" style="font-size:1.3rem;font-weight:800"><div class="ajuda">Ex.: 150 m² (paredes + teto, já descontando portas e janelas)</div></div><button class="btn bloco" onclick="App.calc.setArea()">CONTINUAR</button></div>
      <div class="centro pequeno texto-3">ou</div>
      <div class="card" style="margin:10px 0 0;background:var(--fundo)"><div class="etiqueta">Não sei a metragem</div><p class="pequeno texto-2 mt-1">Calcule a área de paredes e tetos e desconte portas e janelas.</p><button class="btn bloco contorno" onclick="App.calc.ir('calc-area')">📏 CALCULAR A METRAGEM</button></div></div>
      <button class="btn link bloco" onclick="App.calc.ir('inicio')">Cancelar</button>`;
  }
  // Depois de informar a área: se já há um produto do catálogo escolhido (veio do Especificador/Produtos), pula direto para os dados
  function depoisDaArea() { const m = C.rascunho.atual; if (m && m.produto_id) { m.area = C.rascunho.totalArea; calcSalvar(); ir('dados'); } else ir('material'); }
  App.calc.setArea = () => { const v = num($('#c-area').value); if (v <= 0) return App.toast('Informe a área em m²'); C.rascunho.totalArea = v; calcSalvar(); depoisDaArea(); };

  /* calculadora de área (ambientes) */
  function novoAmbiente() { return { id: uid(), nome: 'Ambiente ' + (C.ambientes.length + 1), comp: '', larg: '', alt: '2.7', paredes: true, teto: false, descontar: true, portas: [{ id: uid(), qtd: 1, larg: 0.8, alt: 2.1 }], janelas: [], aberto: true }; }
  function areaAmbiente(a) {
    const comp = num(a.comp), larg = num(a.larg), alt = num(a.alt);
    const paredes = a.paredes ? 2 * (comp + larg) * alt : 0; const teto = a.teto ? comp * larg : 0;
    const aberturas = a.descontar ? [...a.portas, ...a.janelas].reduce((s, o) => s + (Number(o.qtd) || 0) * num(o.larg) * num(o.alt), 0) : 0;
    return { paredes, teto, aberturas, total: Math.max(0, paredes + teto - aberturas) };
  }
  function calcAreaAmbientes() {
    if (!C.ambientes.length) C.ambientes.push(novoAmbiente());
    const total = C.ambientes.reduce((s, a) => s + areaAmbiente(a).total, 0);
    const abert = (a, tipo) => `<div class="mt-1"><div class="linha entre"><b class="pequeno">${tipo === 'portas' ? 'Portas' : 'Janelas'}</b><button class="btn mini cinza" onclick="App.calc.addAbertura('${a.id}','${tipo}')">＋ Adicionar</button></div>${a[tipo].map(o => `<div class="linha" style="gap:6px;margin-top:6px"><input type="number" class="campo-mini" value="${o.qtd}" placeholder="Qtd" style="width:60px" oninput="App.calc.setAbertura('${a.id}','${tipo}','${o.id}','qtd',this.value)"><input type="number" step="0.01" value="${o.larg}" placeholder="Larg. (m)" style="width:80px" oninput="App.calc.setAbertura('${a.id}','${tipo}','${o.id}','larg',this.value)"><input type="number" step="0.01" value="${o.alt}" placeholder="Alt. (m)" style="width:80px" oninput="App.calc.setAbertura('${a.id}','${tipo}','${o.id}','alt',this.value)"><button class="btn mini cinza" onclick="App.calc.delAbertura('${a.id}','${tipo}','${o.id}')">✕</button></div>`).join('')}</div>`;
    return `<div class="linha entre mb-1"><h2 style="margin:0">Calculadora de área</h2><button class="btn link pequeno" onclick="App.calc.ir(App.calc.C.rascunho?'area':'inicio')">‹ Voltar</button></div>
      <style>.campo-mini,.amb input[type=number]{border:1.5px solid var(--borda);border-radius:10px;padding:8px 10px;width:100%}</style>
      ${C.ambientes.map(a => { const r = areaAmbiente(a); return `<div class="card amb">
        <div class="linha entre"><input value="${esc(a.nome)}" style="font-weight:700;border:0;border-bottom:1.5px solid var(--borda);border-radius:0;padding:4px 0;flex:1" oninput="App.calc.setAmbQuieto('${a.id}','nome',this.value)"><b id="amb-total-${a.id}">${fmtNum(r.total)} m²</b></div>
        <div class="grade-3 mt-1"><div><label class="mini texto-3">Comprimento (m)</label><input type="number" step="0.01" inputmode="decimal" value="${a.comp}" oninput="App.calc.setAmbQuieto('${a.id}','comp',this.value)"></div><div><label class="mini texto-3">Largura (m)</label><input type="number" step="0.01" inputmode="decimal" value="${a.larg}" oninput="App.calc.setAmbQuieto('${a.id}','larg',this.value)"></div><div><label class="mini texto-3">Altura (m)</label><input type="number" step="0.01" inputmode="decimal" value="${a.alt}" oninput="App.calc.setAmbQuieto('${a.id}','alt',this.value)"></div></div>
        <div class="chips mt-1"><button class="chip ${a.paredes ? 'ativo' : ''}" onclick="App.calc.setAmb('${a.id}','paredes',${!a.paredes})">Paredes (4 lados)</button><button class="chip ${a.teto ? 'ativo' : ''}" onclick="App.calc.setAmb('${a.id}','teto',${!a.teto})">Calcular teto</button><button class="chip ${a.descontar ? 'ativo' : ''}" onclick="App.calc.setAmb('${a.id}','descontar',${!a.descontar})">Descontar portas e janelas</button></div>
        ${a.descontar ? abert(a, 'portas') + abert(a, 'janelas') : ''}
        <div class="pequeno texto-2 mt-1" id="amb-det-${a.id}">${detalheAmb(a, r)}</div>
        <div class="linha mt-1" style="justify-content:flex-end"><button class="btn mini contorno vermelho" onclick="App.calc.delAmb('${a.id}')">EXCLUIR</button></div></div>`; }).join('')}
      <button class="btn bloco contorno" onclick="App.calc.addAmb()">＋ ADICIONAR AMBIENTE</button>
      <div class="resultado-calc mt-2"><div class="linha entre"><span>Área total calculada</span><span class="grande" id="area-total">${fmtNum(total)} m²</span></div></div>
      ${C.rascunho ? `<button id="btn-usar-area" class="btn bloco verde mt-2" ${total <= 0 ? 'disabled' : ''} onclick="App.calc.usarArea()">USAR ESSA ÁREA</button>` : `<button id="btn-usar-area" class="btn bloco mt-2" ${total <= 0 ? 'disabled' : ''} onclick="App.calc.novo();App.calc.usarArea()">USAR EM UM NOVO CÁLCULO</button>`}`;
  }
  function detalheAmb(a, r) { return 'Área considerada: ' + [a.paredes ? `paredes ${fmtNum(r.paredes)} m²` : '', a.teto ? `teto ${fmtNum(r.teto)} m²` : '', a.descontar ? `aberturas −${fmtNum(r.aberturas)} m²` : ''].filter(Boolean).join(' · '); }
  function totalAmbientes() { return C.ambientes.reduce((s, a) => s + areaAmbiente(a).total, 0); }
  App.calc.atualizarTotais = () => {
    for (const a of C.ambientes) { const r = areaAmbiente(a); const t = $('#amb-total-' + a.id); if (t) t.textContent = fmtNum(r.total) + ' m²'; const d = $('#amb-det-' + a.id); if (d) d.textContent = detalheAmb(a, r); }
    const total = totalAmbientes(); const el = $('#area-total'); if (el) el.textContent = fmtNum(total) + ' m²'; const b = $('#btn-usar-area'); if (b) b.disabled = total <= 0;
  };
  App.calc.setAmbQuieto = (id, k, v) => { const a = C.ambientes.find(x => x.id === id); if (a) a[k] = v; App.calc.atualizarTotais(); };
  function __fimCalcArea() {}
  App.calc.addAmb = () => { C.ambientes.push(novoAmbiente()); App.render(); };
  App.calc.delAmb = (id) => { C.ambientes = C.ambientes.filter(a => a.id !== id); App.render(); };
  App.calc.setAmb = (id, k, v) => { const a = C.ambientes.find(x => x.id === id); if (a) a[k] = v; App.render(); };
  App.calc.addAbertura = (id, tipo) => { const a = C.ambientes.find(x => x.id === id); a[tipo].push({ id: uid(), qtd: 1, larg: tipo === 'portas' ? 0.8 : 1.2, alt: tipo === 'portas' ? 2.1 : 1.2 }); App.render(); };
  App.calc.delAbertura = (id, tipo, oid) => { const a = C.ambientes.find(x => x.id === id); a[tipo] = a[tipo].filter(o => o.id !== oid); App.render(); };
  App.calc.setAbertura = (id, tipo, oid, k, v) => { const a = C.ambientes.find(x => x.id === id); const o = a[tipo].find(x => x.id === oid); o[k] = v; App.calc.atualizarTotais(); };
  App.calc.usarArea = () => { const total = totalAmbientes(); if (total <= 0) return App.toast('Informe as medidas'); C.rascunho.totalArea = Math.round(total * 100) / 100; calcSalvar(); depoisDaArea(); };

  function calcMaterial() {
    return progresso(2) + `<div class="card"><h2>O que você quer calcular?</h2><p class="pequeno texto-2">Selecione o produto. Depois você poderá calcular outros materiais para esta mesma obra (área: ${fmtNum(C.rascunho.totalArea)} m²).</p>
      ${PRODUTOS.map(p => `<button class="btn bloco contorno mb-1" style="justify-content:flex-start" onclick="App.calc.escolher('${p}')">${p}</button>`).join('')}</div>
      <button class="btn link bloco" onclick="App.calc.ir('area')">‹ Voltar</button>`;
  }
  App.calc.escolher = (tipo) => { const t = tipo.toLowerCase(); C.rascunho.atual = { id: uid(), tipo, area: C.rascunho.totalArea, demaos: (t.includes('massa') || t.includes('tinta')) ? 2 : 1, rend: '', emb: liquido(tipo) ? '18 L' : '25 Kg', preco: '', margem: 0 }; calcSalvar(); ir('dados'); };
  function calcDados() {
    const m = C.rascunho.atual; if (!m) return calcMaterial();
    const prod = m.produto_id ? Assessor.produtoPorId(m.produto_id, App.cont) : null;
    const embs = prod ? Assessor.embalagensProduto(prod) : [...(liquido(m.tipo) ? EMB_TINTA : EMB_OUTROS), 'Outro'];
    const dica = prod ? (Assessor.rendimentoPorDemao(prod, m.emb) || {}).nota : (CONTEUDO.rendimentos_tipicos[m.tipo] || {})[m.emb];
    const classes = CLASSES_POR_TIPO[m.tipo] || null;
    const catalogo = Assessor.listaProdutos(App.cont).filter(p => !classes || classes.includes(p.classe));
    const grupo = (marca) => { const l = catalogo.filter(p => Assessor.mesmaMarca(p.marca, marca)); return l.length ? `<optgroup label="${marca}">${l.map(p => `<option value="${p.id}" ${m.produto_id === p.id ? 'selected' : ''}>${esc(p.nome)}${p.linha ? ' · ' + esc(p.linha) : ''}</option>`).join('')}</optgroup>` : ''; };
    return progresso(3) + `<div class="card"><h2>Dados de ${esc(m.tipo)}</h2>
      ${catalogo.length ? `<div class="campo"><label>Produto do catálogo (opcional — preenche o rendimento)</label><select onchange="App.calc.escolherProduto(this.value)"><option value="">— Informar rendimento manualmente —</option>${grupo('Coral')}${grupo('Eucatex')}</select>${prod ? `<div class="linha mt-1" style="align-items:flex-start">${thumb(prod, 'media')}<div class="ajuda" style="margin:0 0 0 8px">✔ <b>${esc(prod.marca)} ${esc(prod.nome)}</b>${prod.destaque ? ' — ' + esc(prod.destaque) : ''} <button class="btn link mini" onclick="App.prod.abrir('${prod.id}')">ver ficha ›</button></div></div>` : ''}</div>` : ''}
      <div class="campo"><label>Área de aplicação (m²)</label><input type="number" inputmode="decimal" value="${m.area}" oninput="App.calc.setDadoQuieto('area',this.value)"></div>
      <div class="campo"><label>Número de demãos</label><div class="grade-2" style="grid-template-columns:repeat(4,1fr)">${[1, 2, 3, 4].map(d => `<button class="btn ${m.demaos === d ? '' : 'contorno'}" onclick="App.calc.setDado('demaos',${d})">${d}</button>`).join('')}</div>${prod && prod.demaos ? `<div class="ajuda">Catálogo: ${esc(prod.demaos)} demão(s).</div>` : ''}</div>
      <div class="card info"><div class="campo"><label>Embalagem</label><div class="chips">${embs.map(e => `<button class="chip ${m.emb === e ? 'ativo' : ''}" onclick="App.calc.setDado('emb','${e}')">${e}</button>`).join('')}</div>${m.emb === 'Outro' ? `<input class="mt-1" placeholder="Ex.: 20 L" value="${esc(m.embOutro || '')}" oninput="App.calc.setDadoQuieto('embOutro',this.value)">` : ''}</div>
      <div class="campo" style="margin:0"><label>Rendimento da embalagem (m² por demão)</label><input type="number" inputmode="decimal" placeholder="Ex: 300" value="${m.rend}" oninput="App.calc.setDadoQuieto('rend',this.value)"><div class="ajuda">${dica ? '💡 ' + (prod ? '' : 'Típico: ') + esc(dica) + ' ' : ''}Confira na lata — cada produto tem o seu.</div></div></div>
      <div class="campo mt-2"><label>Preço por embalagem (R$)</label><input type="number" inputmode="decimal" step="0.01" placeholder="Ex: 189,90" value="${m.preco}" oninput="App.calc.setDadoQuieto('preco',this.value)"></div>
      <div class="campo"><label>Margem extra de segurança (%)</label><div class="chips">${[0, 5, 10, 15, 20].map(p => `<button class="chip ${Number(m.margem) === p ? 'ativo' : ''}" onclick="App.calc.setDado('margem',${p})">${p}%</button>`).join('')}</div><div class="ajuda">10% para superfície lisa, 20% para textura/reboco.</div></div>
      <button class="btn bloco" onclick="App.calc.calcular()">CALCULAR</button></div>
      <button class="btn link bloco" onclick="App.calc.ir('material')">‹ Trocar produto</button>`;
  }
  App.calc.setDado = (k, v) => {
    const m = C.rascunho.atual; m[k] = v;
    if (k === 'emb' && m.produto_id) { const p = Assessor.produtoPorId(m.produto_id, App.cont); const r = p && Assessor.rendimentoPorDemao(p, v); if (r) m.rend = r.valor; }
    calcSalvar(); App.render();
  };
  App.calc.setDadoQuieto = (k, v) => { C.rascunho.atual[k] = v; calcSalvar(); };
  // Escolher um produto do catálogo: define embalagem e rendimento por demão
  App.calc.escolherProduto = (id) => {
    const m = C.rascunho.atual; if (!m) return;
    const p = id ? Assessor.produtoPorId(id, App.cont) : null;
    if (!p) { delete m.produto_id; delete m.produto_nome; delete m.produto_marca; if (!(liquido(m.tipo) ? EMB_TINTA : EMB_OUTROS).includes(m.emb)) { m.emb = liquido(m.tipo) ? '18 L' : '25 Kg'; m.rend = ''; } calcSalvar(); App.render(); return; }
    m.produto_id = p.id; m.produto_nome = p.marca + ' ' + p.nome; m.produto_marca = p.marca;
    const embs = Assessor.embalagensProduto(p); if (embs.length && !embs.includes(m.emb)) m.emb = embs[0];
    const r = Assessor.rendimentoPorDemao(p, m.emb); if (r) { m.rend = r.valor; if (p.rend_tipo === 'acabado') m.demaos = 2; }
    calcSalvar(); App.render();
  };
  // Vindo do Especificador / aba Produtos: abre a calculadora já com o produto
  App.calc.novoComProduto = (id) => {
    const p = Assessor.produtoPorId(id, App.cont); if (!p) return;
    if (!C.rascunho) C.rascunho = { id: uid(), nome: 'Nova obra', totalArea: 0, materiais: [], atual: null, criado_em: new Date().toISOString() };
    const tipo = tipoPorClasse(p.classe);
    C.rascunho.atual = { id: uid(), tipo, area: C.rascunho.totalArea || '', demaos: (tipo === 'Tinta' || tipo.includes('Massa')) ? 2 : 1, rend: '', emb: '', preco: '', margem: 0 };
    const m = C.rascunho.atual; m.produto_id = p.id; m.produto_nome = p.marca + ' ' + p.nome; m.produto_marca = p.marca;
    const embs = Assessor.embalagensProduto(p); m.emb = embs[0] || (liquido(tipo) ? '18 L' : '25 Kg');
    const r = Assessor.rendimentoPorDemao(p, m.emb); if (r) { m.rend = r.valor; if (p.rend_tipo === 'acabado') m.demaos = 2; }
    C.tela = C.rascunho.totalArea > 0 ? 'dados' : 'area'; calcSalvar();
    App.cache.abaAssessor = 'calc';
    if (App.rota.view === 'assessor' && App.rota.params[0] === 'calc') App.render(); else location.hash = '#/assessor/calc';
  };
  function calcularMaterial(m) {
    const area = num(m.area), rend = num(m.rend), preco = num(m.preco), demaos = Number(m.demaos) || 1, margem = Number(m.margem) || 0;
    if (area <= 0 || rend <= 0) return null;
    const areaAj = area * (1 + margem / 100);
    const qtd = areaAj * demaos / rend; const comprar = Math.ceil(qtd - 1e-9); const custo = comprar * preco;
    const sobra = (comprar * rend - areaAj * demaos) / demaos; // m² que ainda daria para pintar com as demãos definidas
    return { areaAj, qtd, comprar, custo, sobra, custoM2: area ? custo / area : 0 };
  }
  App.calc.calcular = () => { const r = calcularMaterial(C.rascunho.atual); if (!r) return App.toast('Informe área e rendimento maiores que zero'); Object.assign(C.rascunho.atual, { res: r }); calcSalvar(); ir('resultado'); };
  function calcResultado() {
    const m = C.rascunho.atual; const r = m && m.res; if (!r) return calcDados();
    const emb = m.emb === 'Outro' ? (m.embOutro || 'emb.') : m.emb;
    return progresso(4) + `<div class="resultado-calc"><div class="pequeno" style="opacity:.85">Você vai precisar de</div><div class="grande">${r.comprar} ${r.comprar === 1 ? 'embalagem' : 'embalagens'}</div><div>${esc(nomeMaterial(m))} · ${esc(emb)}</div>
      <table><tr><td>Total estimado</td><td>${fmtBRL(r.custo)}</td></tr><tr><td>Custo / m²</td><td>${fmtBRL(r.custoM2)}/m²</td></tr></table></div>
      <div class="card mt-2"><h3>Resumo do cálculo</h3><table class="pequeno" style="width:100%">
      <tr><td>Produto</td><td style="text-align:right"><b>${esc(nomeMaterial(m))} (${esc(emb)})</b></td></tr><tr><td>Área total</td><td style="text-align:right">${fmtNum(num(m.area))} m²</td></tr>
      ${Number(m.margem) > 0 ? `<tr><td>Margem (+${m.margem}%)</td><td style="text-align:right">${fmtNum(r.areaAj)} m²</td></tr>` : ''}<tr><td>Demãos</td><td style="text-align:right">${m.demaos}</td></tr><tr><td>Matemática</td><td style="text-align:right">${fmtNum(r.areaAj)} × ${m.demaos} ÷ ${fmtNum(num(m.rend), 0)} = ${fmtNum(r.qtd, 2)} emb.</td></tr><tr><td>Sobra estimada</td><td style="text-align:right">${fmtNum(r.sobra)} m²</td></tr></table>
      <p class="mini texto-3 mt-1">Os resultados são estimativas baseadas nas informações fornecidas. O consumo real pode variar conforme produto, fabricante, superfície, preparação, método de aplicação e condições da obra. Consulte sempre as especificações do fabricante.</p></div>
      <button class="btn bloco verde" onclick="App.calc.adicionar()">＋ ADICIONAR À LISTA DA OBRA</button><button class="btn link bloco" onclick="App.calc.ir('dados')">‹ Ajustar dados</button>`;
  }
  App.calc.adicionar = () => { const m = C.rascunho.atual; C.rascunho.materiais.push({ ...m, res: m.res }); C.rascunho.atual = null; calcSalvar(); ir('projeto'); };
  const totalProjeto = (p) => (p.materiais || []).reduce((s, m) => s + ((m.res && m.res.custo) || 0), 0);
  function calcProjeto() {
    const p = C.rascunho; if (!p) return calcInicio();
    const complementos = Assessor.sugerirComplementos(num(p.totalArea), (p.materiais.find(m => /esmalte|verniz/i.test(m.tipo)) ? 'esmalte' : 'tinta'));
    return `<div class="card"><div class="linha entre"><input value="${esc(p.nome)}" style="font-weight:800;font-size:1.1rem;border:0;border-bottom:1.5px solid var(--borda);border-radius:0;padding:4px 0;flex:1" onchange="App.calc.C.rascunho.nome=this.value"><span class="etiqueta azul">${fmtNum(p.totalArea, 0)} m²</span></div>
      <h3 class="mt-2">Materiais desta obra</h3>
      ${p.materiais.length ? p.materiais.map((m, i) => `<div class="linha entre" style="padding:8px 0;border-bottom:1px solid var(--borda)"><div class="cresce"><div class="negrito pequeno">${esc(nomeMaterial(m))} · ${esc(m.emb === 'Outro' ? m.embOutro : m.emb)}</div><div class="mini texto-3">${m.res.comprar} un. · ${m.demaos} demão(s) · ${fmtNum(num(m.area), 0)} m²</div></div><b class="pequeno">${fmtBRL(m.res.custo)}</b><button class="btn mini cinza" style="margin-left:6px" onclick="App.calc.removerMaterial(${i})">✕</button></div>`).join('') : '<p class="pequeno texto-3">Nenhum material ainda.</p>'}
      <div class="linha entre mt-2"><b>TOTAL ESTIMADO</b><b style="font-size:1.2rem;color:var(--vermelho)">${fmtBRL(totalProjeto(p))}</b></div></div>
      <button class="btn bloco contorno" onclick="App.calc.C.rascunho.atual=null;App.calc.ir('material')">＋ Calcular outro material</button>
      <div class="card mt-2"><h3>Não esqueça os complementos</h3>${complementos.map(c => `<div class="linha entre pequeno" style="padding:5px 0;border-bottom:1px solid var(--borda)"><span>${esc(c.item)}<div class="mini texto-3">${esc(c.obs)}</div></span><b>${c.qtd}</b></div>`).join('')}</div>
      <div class="botoes mt-2"><button class="btn verde" onclick="App.calc.salvarProjeto()">💾 Salvar obra</button><a class="btn azul" href="${zap(textoProjeto(p))}" target="_blank" rel="noopener">📲 Enviar resumo</a></div>
      <button class="btn link bloco mt-1" onclick="App.calc.ir('inicio')">Voltar ao início</button>`;
  }
  App.calc.removerMaterial = (i) => { C.rascunho.materiais.splice(i, 1); calcSalvar(); App.render(); };
  App.calc.salvarProjeto = () => { const p = C.rascunho; const idx = C.projetos.findIndex(x => x.id === p.id); if (idx >= 0) C.projetos[idx] = p; else C.projetos.push(p); C.rascunho = null; calcSalvar(); App.toast('Obra salva em "Meus cálculos" ✔'); ir('projetos'); };
  function textoProjeto(p) {
    const l = [`*LISTA DE MATERIAIS — ${p.nome}*`, `Área: ${fmtNum(p.totalArea)} m²`, ''];
    p.materiais.forEach(m => l.push(`• ${nomeMaterial(m)} ${m.emb === 'Outro' ? m.embOutro : m.emb}: ${m.res.comprar} un. (${m.demaos} demão(s)) — ${fmtBRL(m.res.custo)}`));
    l.push('', `*Total estimado: ${fmtBRL(totalProjeto(p))}*`, '', '_Estimativa gerada no MENTOR ST PRO · Só Tintas. Confira o rendimento na embalagem._');
    return l.join('\n');
  }
  const zap = (t) => 'https://wa.me/?text=' + encodeURIComponent(t);
  function calcProjetos() {
    return `<div class="linha entre mb-1"><h2 style="margin:0">Meus cálculos</h2><button class="btn pequeno" onclick="App.calc.novo()">＋ NOVO</button></div>
      ${C.projetos.length ? C.projetos.slice().reverse().map(p => `<div class="card"><div class="linha entre"><div><div class="negrito">${esc(p.nome)}</div><div class="pequeno texto-2">${fmtNum(p.totalArea, 0)} m² · ${p.materiais.length} material(is) · ${new Date(p.criado_em).toLocaleDateString('pt-BR')}</div></div><b>${fmtBRL(totalProjeto(p))}</b></div><div class="botoes mt-1"><button class="btn mini azul" onclick="App.calc.abrirProjeto('${p.id}')">Editar</button><button class="btn mini cinza" onclick="App.calc.duplicarProjeto('${p.id}')">Duplicar</button><a class="btn mini cinza" href="${zap(textoProjeto(p))}" target="_blank" rel="noopener">Enviar</a><button class="btn mini contorno vermelho" onclick="App.calc.excluirProjeto('${p.id}')">Excluir</button></div></div>`).join('') : '<p class="pequeno texto-3">Nenhum cálculo salvo ainda.</p>'}
      <button class="btn link bloco" onclick="App.calc.ir('inicio')">‹ Voltar</button>`;
  }
  App.calc.abrirProjeto = (id) => { const p = C.projetos.find(x => x.id === id); if (!p) return; C.rascunho = JSON.parse(JSON.stringify(p)); calcSalvar(); ir('projeto'); };
  App.calc.duplicarProjeto = (id) => { const p = C.projetos.find(x => x.id === id); if (!p) return; const n = JSON.parse(JSON.stringify(p)); n.id = uid(); n.nome = p.nome + ' (cópia)'; n.criado_em = new Date().toISOString(); C.projetos.push(n); calcSalvar(); App.render(); };
  App.calc.excluirProjeto = (id) => { App.confirmar('Excluir este cálculo?', () => { C.projetos = C.projetos.filter(x => x.id !== id); calcSalvar(); App.render(); }, 'Excluir'); };

  function rapidoResHtml() {
    const r = C.rapido; const area = num(r.area), rend = num(r.rend), preco = num(r.preco); let comprar = 0, custo = 0;
    if (area > 0 && rend > 0 && r.demaos > 0) { comprar = Math.ceil(area * r.demaos / rend - 1e-9); custo = comprar * preco; }
    return comprar > 0 ? `<div class="resultado-calc"><div class="pequeno" style="opacity:.85">Você precisa comprar</div><div class="grande">${comprar} ${comprar > 1 ? 'embalagens' : 'embalagem'}</div><table><tr><td>Custo</td><td>${fmtBRL(custo)}</td></tr></table></div>` : '<p class="pequeno texto-3">Preencha os campos para ver o resultado.</p>';
  }
  App.calc.rapidoAtualizar = () => { const el = $('#rapido-res'); if (el) el.innerHTML = rapidoResHtml(); };
  function calcRapido() {
    const r = C.rapido;
    return `<div class="card"><h2>⚡ Cálculo rápido</h2>
      <div class="campo"><label>Área (m²)</label><input type="number" inputmode="decimal" placeholder="0" value="${r.area}" oninput="App.calc.C.rapido.area=this.value;App.calc.rapidoAtualizar()"></div>
      <div class="campo"><label>Demãos</label><div class="grade-2" style="grid-template-columns:repeat(4,1fr)">${[1, 2, 3, 4].map(d => `<button class="btn ${r.demaos === d ? '' : 'contorno'}" onclick="App.calc.C.rapido.demaos=${d};App.render()">${d}</button>`).join('')}</div></div>
      <div class="campo"><label>Rendimento da embalagem (m² por demão)</label><input type="number" inputmode="decimal" placeholder="0" value="${r.rend}" oninput="App.calc.C.rapido.rend=this.value;App.calc.rapidoAtualizar()"></div>
      <div class="campo"><label>Preço da embalagem (R$)</label><input type="number" inputmode="decimal" step="0.01" placeholder="0,00" value="${r.preco}" oninput="App.calc.C.rapido.preco=this.value;App.calc.rapidoAtualizar()"></div>
      <div id="rapido-res">${rapidoResHtml()}</div></div>
      <button class="btn link bloco" onclick="App.calc.ir('inicio')">‹ Voltar</button>`;
  }
  function compResHtml() {
    const c = C.comp; const area = num(c.area); const calc = (p) => { const rend = num(p.rend), preco = num(p.preco); if (area <= 0 || rend <= 0) return { n: 0, custo: 0 }; const n = Math.ceil(area * c.demaos / rend - 1e-9); return { n, custo: n * preco }; };
    const A = calc(c.a), B = calc(c.b);
    const vencedor = A.custo > 0 && B.custo > 0 ? (A.custo < B.custo ? 'A' : B.custo < A.custo ? 'B' : 'empate') : null;
    return (A.n || B.n) ? `<div class="grade-2 mt-2"><div class="card centro" style="margin:0;${vencedor === 'A' ? 'border-color:var(--verde);background:var(--verde-claro)' : ''}"><div class="pequeno texto-2">Produto A</div><div class="negrito">${A.n} emb.</div><div style="font-size:1.2rem;font-weight:800;${vencedor === 'A' ? 'color:var(--verde)' : ''}">${fmtBRL(A.custo)}</div></div><div class="card centro" style="margin:0;${vencedor === 'B' ? 'border-color:var(--verde);background:var(--verde-claro)' : ''}"><div class="pequeno texto-2">Produto B</div><div class="negrito">${B.n} emb.</div><div style="font-size:1.2rem;font-weight:800;${vencedor === 'B' ? 'color:var(--verde)' : ''}">${fmtBRL(B.custo)}</div></div></div>
      ${vencedor && vencedor !== 'empate' ? `<div class="card sucesso centro mt-2"><b>Menor custo estimado: Produto ${vencedor}</b><div class="pequeno">Economia de ${fmtBRL(Math.abs(A.custo - B.custo))}</div></div>` : vencedor === 'empate' ? '<div class="card info centro mt-2">Custo equivalente</div>' : ''}` : '';
  }
  App.calc.compAtualizar = () => { const el = $('#comp-res'); if (el) el.innerHTML = compResHtml(); };
  function calcComparador() {
    const c = C.comp;
    const caixa = (nome, k) => `<div class="card" style="margin:0"><div class="etiqueta ${k === 'a' ? 'azul' : 'vermelha'}">${nome}</div><div class="campo mt-1"><label>Rendimento (m²/emb. por demão)</label><input type="number" inputmode="decimal" value="${c[k].rend}" oninput="App.calc.C.comp.${k}.rend=this.value;App.calc.compAtualizar()"></div><div class="campo" style="margin:0"><label>Preço da embalagem (R$)</label><input type="number" inputmode="decimal" step="0.01" value="${c[k].preco}" oninput="App.calc.C.comp.${k}.preco=this.value;App.calc.compAtualizar()"></div></div>`;
    return `<div class="card"><h2>⚖️ Comparador de produtos</h2><p class="pequeno texto-2">Descubra qual opção tem o menor custo total para o mesmo serviço.</p>
      <div class="campo"><label>Área (m²)</label><input type="number" inputmode="decimal" value="${c.area}" oninput="App.calc.C.comp.area=this.value;App.calc.compAtualizar()"></div>
      <div class="campo"><label>Demãos</label><div class="grade-2" style="grid-template-columns:repeat(4,1fr)">${[1, 2, 3, 4].map(d => `<button class="btn pequeno ${c.demaos === d ? '' : 'contorno'}" onclick="App.calc.C.comp.demaos=${d};App.render()">${d}</button>`).join('')}</div></div>
      <div class="grade-2">${caixa('PRODUTO A', 'a')}${caixa('PRODUTO B', 'b')}</div>
      <div id="comp-res">${compResHtml()}</div></div>
      <button class="btn link bloco" onclick="App.calc.ir('inicio')">‹ Voltar</button>`;
  }

  /* ═══════════════════════ ESPECIFICADOR ═══════════════════════ */
  const E = { superficie: '', ambiente: 'interno_seco', condicoes: [], acabamento: 'fosco', marca: 'Ambas', cliente: '', resultado: null, incluirCalculo: false, incluirProdutos: true };
  App.espec = { E };
  function telaEspec() {
    const esp = App.cont.especificador;
    if (E.resultado) return especResultado();
    return `<div class="card"><h2>📐 Especificador técnico</h2><p class="pequeno texto-2">Superfície + condição + ambiente → preparação, sistema de pintura, ferramentas e alertas. Gere a especificação e envie ao cliente.</p>
      <div class="campo"><label>1. Qual é a superfície?</label><select onchange="App.espec.E.superficie=this.value;App.render()"><option value="">Selecione…</option>${esp.superficies.map(s => `<option value="${s.id}" ${E.superficie === s.id ? 'selected' : ''}>${esc(s.nome)}</option>`).join('')}</select></div>
      <div class="campo"><label>2. Ambiente</label>${esp.ambientes.map(a => `<label class="caixa-opcao ${E.ambiente === a.id ? 'ativa' : ''}"><input type="radio" name="amb" ${E.ambiente === a.id ? 'checked' : ''} onchange="App.espec.E.ambiente='${a.id}';App.render()"><span class="pequeno">${esc(a.nome)}</span></label>`).join('')}</div>
      <div class="campo"><label>3. Condições encontradas (toque para marcar)</label><div class="chips">${esp.condicoes.map(c => `<button class="chip vermelho ${E.condicoes.includes(c.id) ? 'ativo' : ''}" onclick="App.espec.toggle('${c.id}')">${esc(c.nome)}</button>`).join('')}</div></div>
      <div class="campo"><label>4. Acabamento desejado</label><div class="chips">${Object.keys(Assessor.ACABAMENTOS).map(k => `<button class="chip ${E.acabamento === k ? 'ativo' : ''}" onclick="App.espec.E.acabamento='${k}';App.render()">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div><div class="ajuda">${esc(Assessor.ACABAMENTOS[E.acabamento] || '')}</div></div>
      <div class="campo"><label>5. Marca para sugerir produtos</label><div class="chips">${['Ambas', 'Coral', 'Eucatex'].map(mk => `<button class="chip ${E.marca === mk ? 'ativo' : ''}" onclick="App.espec.E.marca='${mk}';App.render()">${mk}</button>`).join('')}</div><div class="ajuda">Os produtos vêm dos catálogos Coral 2025/2 e Eucatex 2026 (aba Produtos).</div></div>
      <div class="campo"><label>Nome do cliente (opcional)</label><input value="${esc(E.cliente)}" placeholder="Para constar na especificação" onchange="App.espec.E.cliente=this.value"></div>
      <button class="btn bloco" ${E.superficie ? '' : 'disabled'} onclick="App.espec.gerar()">GERAR ESPECIFICAÇÃO</button></div>`;
  }
  App.espec.toggle = (id) => { const i = E.condicoes.indexOf(id); if (i >= 0) E.condicoes.splice(i, 1); else E.condicoes.push(id); App.render(); };
  App.espec.gerar = () => { E.resultado = Assessor.especificar({ superficieId: E.superficie, ambiente: E.ambiente, condicoes: E.condicoes, acabamento: E.acabamento, marca: E.marca }, App.cont); if (!E.resultado) return App.toast('Selecione a superfície'); App.render(); };
  App.espec.setMarca = (mk) => { E.marca = mk; if (E.resultado) App.espec.gerar(); else App.render(); };
  App.espec.voltar = () => { E.resultado = null; App.render(); };
  // Cartão com os produtos sugeridos (por etapa), com troca rápida de marca
  function produtosSugeridosHtml(grupos, marca, opts) {
    opts = opts || {};
    const toggle = `<div class="chips">${['Ambas', 'Coral', 'Eucatex'].map(mk => `<button class="chip ${marca === mk ? 'ativo' : ''}" onclick="${opts.onMarca || 'App.espec.setMarca'}('${mk}')">${mk}</button>`).join('')}</div>`;
    if (!grupos || !grupos.length) return `<div class="card"><h3>🛒 Produtos sugeridos</h3>${toggle}<p class="pequeno texto-3 mt-1">Nenhum produto do catálogo para esta combinação. Consulte a aba Produtos.</p></div>`;
    return `<div class="card"><h3>🛒 Produtos sugeridos</h3><p class="mini texto-3" style="margin:0 0 6px">Catálogo Coral 2025/2 · Eucatex 2026. Confirme disponibilidade e preço na loja.</p>${toggle}
      ${grupos.map(g => `<div class="mt-2"><div class="etiqueta ${g.tipo === 'tratamento' ? 'vermelha' : g.tipo === 'acabamento' ? 'amarela' : 'azul'}">${esc(g.etapa)}</div>
        ${g.produtos.map(p => `<div class="item-lista" style="padding:8px 0" onclick="App.prod.abrir('${p.id}')">${thumb(p)}<div class="cresce" style="margin-left:8px"><div class="titulo">${esc(p.nome)}</div><span class="etiqueta ${marcaCor(p.marca)} mini">${esc(p.marca)}</span><div class="desc">${esc(Assessor.classeNome(p.classe, App.cont))}${Assessor.resumoRendimento(p) ? ' · ' + esc(Assessor.resumoRendimento(p)) : ''}${p.destaque ? '<br>' + esc(p.destaque) : ''}</div></div><button class="btn mini azul" onclick="event.stopPropagation();App.calc.novoComProduto('${p.id}')">🧮</button></div>`).join('')}</div>`).join('')}</div>`;
  }
  function especResultado() {
    const r = E.resultado; const semaforo = E.condicoes.includes('umidade') ? 'vermelho' : (E.condicoes.length ? 'amarelo' : 'verde');
    const cores = { vermelho: ['#FDE8E8', '🔴 VERMELHO — resolva a causa antes de vender o acabamento'], amarelo: ['#FFF3E0', '🟡 AMARELO — exige preparação/correção (inclua na lista)'], verde: ['#E3F5EA', '🟢 VERDE — pode seguir para a preparação normal'] };
    const ultimoCalc = (C.projetos[C.projetos.length - 1] || C.rascunho);
    return `<div class="card" style="background:${cores[semaforo][0]}"><div class="negrito">${cores[semaforo][1]}</div><div class="pequeno texto-2 mt-1">${esc(r.superficie.nome)} · ${esc(r.ambiente.nome || '')} · risco principal: ${esc(r.superficie.risco)}</div></div>
      ${r.passos.map((p, i) => `<div class="card"><div class="passo"><span class="n">${i + 1}</span><div class="cresce"><div class="t">${esc(p.titulo)}</div><ul>${p.itens.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div></div>`).join('')}
      ${produtosSugeridosHtml(r.produtos, r.marca)}
      ${r.alertas.length ? `<div class="card erro"><h3>⚠️ Atenção</h3><ul class="pequeno" style="padding-left:18px;margin:0">${r.alertas.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>` : ''}
      <div class="card info"><h3>❓ Perguntas para fazer ao cliente</h3><ul class="pequeno" style="padding-left:18px;margin:0">${r.perguntas.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>
      ${r.produtos && r.produtos.length ? `<label class="caixa-opcao"><input type="checkbox" ${E.incluirProdutos ? 'checked' : ''} onchange="App.espec.E.incluirProdutos=this.checked;App.render()"><span class="pequeno">Incluir os produtos sugeridos no texto enviado</span></label>` : ''}
      ${ultimoCalc && ultimoCalc.materiais && ultimoCalc.materiais.length ? `<label class="caixa-opcao"><input type="checkbox" ${E.incluirCalculo ? 'checked' : ''} onchange="App.espec.E.incluirCalculo=this.checked;App.render()"><span class="pequeno">Incluir a lista de materiais da obra "${esc(ultimoCalc.nome)}"</span></label>` : ''}
      <div class="botoes"><a class="btn verde" href="${zap(textoEspec())}" target="_blank" rel="noopener">📲 Enviar pelo WhatsApp</a><button class="btn azul" onclick="App.espec.copiar()">📋 Copiar texto</button></div>
      <button class="btn link bloco mt-1" onclick="App.espec.voltar()">‹ Nova especificação</button>`;
  }
  function textoEspec() {
    const ultimoCalc = (C.projetos[C.projetos.length - 1] || C.rascunho);
    let t = Assessor.textoEspecificacao(E.resultado, { cliente: E.cliente, semProdutos: !E.incluirProdutos });
    if (E.incluirCalculo && ultimoCalc && ultimoCalc.materiais && ultimoCalc.materiais.length) t += '\n\n' + textoProjeto(ultimoCalc);
    return t;
  }
  App.espec.copiar = async () => { try { await navigator.clipboard.writeText(textoEspec()); App.toast('Especificação copiada ✔'); } catch (e) { App.toast('Não foi possível copiar neste navegador — use "Enviar pelo WhatsApp"'); } };

  /* ═══════════════════════ DIAGNÓSTICO ═══════════════════════ */
  const DG = { busca: '', categoria: '', aberto: null };
  App.diag = { DG };
  function telaDiag() {
    const lista = App.cont.diagnostico;
    if (DG.aberto) { const f = lista.find(x => x.id === DG.aberto); if (f) return diagFicha(f); }
    const cats = [...new Set(lista.map(f => f.categoria))];
    const q = DG.busca.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return `<div class="card"><h2>🩺 Diagnóstico de problemas</h2><p class="pequeno texto-2">50 fichas do Atlas das Patologias. Descreva o que o cliente vê ("bolha", "descascando", "pó", "mofo", "ferrugem"…).</p>
      <div class="campo" style="margin:0"><input placeholder="🔍 O que está acontecendo na parede?" value="${esc(DG.busca)}" oninput="App.diag.DG.busca=this.value;App.diag.filtrar()"></div></div>
      <div class="chips mb-2"><button class="chip ${!DG.categoria ? 'ativo' : ''}" onclick="App.diag.DG.categoria='';App.render()">Todas</button>${cats.map(c => `<button class="chip ${DG.categoria === c ? 'ativo' : ''}" onclick="App.diag.DG.categoria='${c.replace(/'/g, "\\'")}';App.render()">${esc(c)}</button>`).join('')}</div>
      <div id="diag-lista">${diagListaHtml()}</div>`;
  }
  function diagListaHtml() {
    const lista = App.cont.diagnostico; const sem = { vermelho: '🔴', amarelo: '🟡', verde: '🟢' };
    const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const q = norm(DG.busca);
    const filtradas = lista.filter(f => (!DG.categoria || f.categoria === DG.categoria) && (!q || norm(f.nome + ' ' + f.reconhecer + ' ' + (f.tags || []).join(' ') + ' ' + f.causas.join(' ')).includes(q)));
    return filtradas.map(f => `<div class="item-lista" onclick="App.diag.abrir('${f.id}')">${f.foto ? `<img class="thumb-foto" src="${esc(f.foto)}" alt="" loading="lazy">` : `<span class="num">${f.n}</span>`}<div class="cresce"><div class="titulo">${sem[f.semaforo] || ''} ${f.n}. ${esc(f.nome)}</div><div class="desc">${esc(f.reconhecer).slice(0, 90)}…</div></div><span class="seta">›</span></div>`).join('') || '<p class="pequeno texto-3">Nenhuma ficha encontrada. Tente outras palavras.</p>';
  }
  App.diag.filtrar = () => { const el = $('#diag-lista'); if (el) el.innerHTML = diagListaHtml(); };
  App.diag.abrir = (id) => { DG.aberto = id; App.render(); };
  App.diag.fechar = () => { DG.aberto = null; App.render(); };
  function diagFicha(f) {
    const sem = { vermelho: ['#FDE8E8', '🔴 Não trate a pintura como solução antes de resolver a causa'], amarelo: ['#FFF3E0', '🟡 Investigue e inclua a correção na preparação'], verde: ['#E3F5EA', '🟢 Problema de aplicação/preparação — corrigível na pintura'] };
    App.cache.paginasAtuais = [f.foto, f.pagina].filter(Boolean);
    return `<button class="btn link" onclick="App.diag.fechar()">‹ Voltar às fichas</button>
      <div class="card" style="background:${sem[f.semaforo][0]}"><div class="etiqueta">Ficha ${String(f.n).padStart(2, '0')} · ${esc(f.categoria)}</div><h2 class="mt-1">${esc(f.nome)}</h2><div class="pequeno negrito">${sem[f.semaforo][1]}</div></div>
      ${f.foto ? `<div class="card" style="padding:0;overflow:hidden"><img class="foto-ficha" src="${esc(f.foto)}" alt="Foto: ${esc(f.nome)}" onclick="App.abrirVisor(0)"><div class="mini texto-3" style="padding:6px 12px">📷 Como aparece na parede · toque para ampliar</div></div>` : ''}
      <div class="paginas-guia"><img src="${f.pagina}" alt="Ficha ${f.n}" style="width:100%;max-width:none" onclick="App.abrirVisor(${f.foto ? 1 : 0})"></div>
      <div class="card"><h3>👀 Como reconhecer</h3><p class="pequeno" style="margin:0">${esc(f.reconhecer)}</p></div>
      <div class="card"><h3>🔎 Causas possíveis</h3><ul class="pequeno" style="padding-left:18px;margin:0">${f.causas.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>
      <div class="card"><h3>✅ O que verificar</h3><ul class="pequeno" style="padding-left:18px;margin:0">${f.verificar.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>
      <div class="card erro"><h3>🚫 Não faça</h3><p class="pequeno" style="margin:0">${esc(f.nao_faca)}</p></div>
      <div class="card sucesso"><h3>🛠️ Caminho de correção</h3><ol class="pequeno" style="padding-left:18px;margin:0">${f.correcao.map(c => `<li>${esc(c)}</li>`).join('')}</ol></div>
      <div class="card info"><h3>🛡️ Prevenção</h3><p class="pequeno" style="margin:0">${esc(f.prevencao)}</p><div class="destaque-box pequeno mt-1" style="margin-bottom:0">⚠️ ${esc(f.alerta)}</div></div>
      <div class="botoes"><a class="btn verde" href="${zap(textoDiag(f))}" target="_blank" rel="noopener">📲 Enviar orientação</a><button class="btn azul" onclick="App.cache.abaAssessor='chat';App.chat.perguntar('Como oriento um cliente com ${esc(f.nome).replace(/'/g, '')}?')">💬 Perguntar ao chat</button></div>`;
  }
  function textoDiag(f) { return [`*ORIENTAÇÃO TÉCNICA — ${f.nome}*`, '', `*Como reconhecer:* ${f.reconhecer}`, '', '*Causas possíveis:*', ...f.causas.map(c => '• ' + c), '', '*Não faça:* ' + f.nao_faca, '', '*Caminho de correção:*', ...f.correcao.map((c, i) => `${i + 1}. ${c}`), '', '⚠️ ' + f.alerta, '', '_Fonte: Atlas das Patologias da Pintura · Só Tintas_'].join('\n'); }

  /* ═══════════════════════ CORES ═══════════════════════ */
  const CO = { categoria: '', busca: '' };
  App.cores = { CO };
  function telaCores() {
    const lista = App.cont.cores || []; const cats = [...new Set(lista.map(c => c.categoria))];
    const q = CO.busca.toLowerCase();
    const filtradas = lista.filter(c => (!CO.categoria || c.categoria === CO.categoria) && (!q || (c.nome + ' ' + c.principal + ' ' + c.secundaria + ' ' + c.apoio + ' ' + c.sensacao + ' ' + c.boa_para).toLowerCase().includes(q)));
    return `<div class="card"><h2>🎨 Combinações de cores</h2><p class="pequeno texto-2">Cor principal · secundária (parede de destaque) · apoio (detalhes). Toque para ver a página do catálogo. Confirme sempre o código no leque do fabricante.</p>
      <div class="campo" style="margin:0"><input placeholder="🔍 Buscar (ex.: terracota, quarto, aconchegante)" value="${esc(CO.busca)}" onchange="App.cores.CO.busca=this.value;App.render()"></div></div>
      <div class="chips mb-2"><button class="chip ${!CO.categoria ? 'ativo' : ''}" onclick="App.cores.CO.categoria='';App.render()">Todas</button>${cats.map(c => `<button class="chip ${CO.categoria === c ? 'ativo' : ''}" onclick="App.cores.CO.categoria='${c.replace(/'/g, "\\'")}';App.render()">${esc(c)}</button>`).join('')}</div>
      ${filtradas.map(c => `<div class="card clicavel cor-card" onclick="App.cores.abrir(${c.n})">${c.foto ? `<img class="foto-ambiente" src="${esc(c.foto)}" alt="" loading="lazy">` : ''}
        <div class="amostras">${[['Principal', c.principal, 0], ['Secundária', c.secundaria, 1], ['Apoio', c.apoio, 2]].map(([r, nome, i]) => { const h = (c.hex || [])[i]; return `<div class="amostra"><div class="sw" style="background:${h || '#ddd'}"></div><div class="mini texto-3">${r}</div><div class="pequeno negrito">${esc(nome)}</div>${h ? `<div class="mini texto-3">${h}</div>` : ''}</div>`; }).join('')}</div>
        <div class="linha entre mt-1"><div><div class="etiqueta amarela">${esc(c.categoria)} · #${c.n}</div><div class="negrito mt-1">${esc(c.nome)}</div>${c.sensacao ? `<div class="mini texto-3">Sensação: ${esc(c.sensacao)}${c.boa_para ? ' · Boa para: ' + esc(c.boa_para) : ''}</div>` : ''}</div><span class="seta">›</span></div></div>`).join('') || '<p class="pequeno texto-3">Nenhuma combinação encontrada.</p>'}`;
  }
  App.cores.abrir = (n) => { const c = (App.cont.cores || []).find(x => x.n === n); if (!c) return; App.cache.paginasAtuais = [c.foto, `assets/material/m07/p${String(c.pagina).padStart(3, '0')}.jpg`].filter(Boolean); App.abrirVisor(0); };

  /* ═══════════════════════ PRODUTOS (catálogo Coral + Eucatex) ═══════════════════════ */
  const P = { busca: '', marca: '', classe: '', aberto: null };
  App.prod = { P };
  const normP = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  function telaProdutos() {
    const lista = Assessor.listaProdutos(App.cont);
    if (P.aberto) { const p = lista.find(x => x.id === P.aberto); if (p) return prodFicha(p); P.aberto = null; }
    const classes = [...new Set(lista.map(p => p.classe))].sort((a, b) => Assessor.classeNome(a, App.cont).localeCompare(Assessor.classeNome(b, App.cont)));
    return `<div class="card"><h2>🛒 Produtos Coral e Eucatex</h2><p class="pequeno texto-2">${lista.length} produtos dos catálogos Coral 2025/2 e Eucatex 2026, com rendimento por embalagem. Busque pela necessidade ("mofo", "reboco novo", "ferrugem", "piso", "laje") ou pelo nome.</p>
      <div class="campo" style="margin:0"><input placeholder="🔍 Produto, superfície ou problema" value="${esc(P.busca)}" oninput="App.prod.P.busca=this.value;App.prod.filtrar()"></div>
      <div class="chips mt-1">${['', 'Coral', 'Eucatex'].map(mk => `<button class="chip ${P.marca === mk ? 'ativo' : ''}" onclick="App.prod.P.marca='${mk}';App.render()">${mk || 'Ambas as marcas'}</button>`).join('')}</div>
      <div class="campo mt-1" style="margin:0"><select onchange="App.prod.P.classe=this.value;App.render()"><option value="">Todos os tipos de produto</option>${classes.map(c => `<option value="${c}" ${P.classe === c ? 'selected' : ''}>${esc(Assessor.classeNome(c, App.cont))}</option>`).join('')}</select></div></div>
      <div id="prod-lista">${prodListaHtml()}</div>`;
  }
  function prodListaHtml() {
    const q = normP(P.busca).trim();
    const lista = Assessor.listaProdutos(App.cont).filter(p => Assessor.mesmaMarca(p.marca, P.marca) && (!P.classe || p.classe === P.classe) && (!q || normP([p.nome, p.linha, Assessor.classeNome(p.classe, App.cont), (p.superficies || []).join(' '), p.destaque, p.obs, (p.acabamento || []).join(' ')].join(' ')).includes(q)));
    if (!lista.length) return '<p class="pequeno texto-3">Nenhum produto encontrado. Tente outra palavra ou troque o filtro.</p>';
    return lista.map(p => `<div class="item-lista" onclick="App.prod.abrir('${p.id}')">${thumb(p)}<div class="cresce" style="margin-left:8px"><div class="titulo">${esc(p.nome)}</div><div class="desc"><span class="etiqueta ${marcaCor(p.marca)} mini">${esc(p.marca)}</span> ${esc(Assessor.classeNome(p.classe, App.cont))}${Assessor.resumoRendimento(p) ? ' · ' + esc(Assessor.resumoRendimento(p)) : ''}</div></div><span class="seta">›</span></div>`).join('');
  }
  App.prod.filtrar = () => { const el = $('#prod-lista'); if (el) el.innerHTML = prodListaHtml(); };
  App.prod.abrir = (id) => { P.aberto = id; App.cache.abaAssessor = 'produtos'; if (App.rota.view === 'assessor' && App.rota.params[0] === 'produtos') App.render(); else location.hash = '#/assessor/produtos'; };
  App.prod.fechar = () => { P.aberto = null; App.render(); };
  function usosDaClasse(classe) {
    const sis = App.cont.sistemas || {}; const sup = App.cont.especificador.superficies || []; const usos = [];
    for (const id of Object.keys(sis)) {
      const s = sup.find(x => x.id === id); if (!s) continue;
      const etapas = [];
      for (const [k, l] of [['fundo', 'fundo'], ['massa', 'massa'], ['acabamento', 'acabamento']]) {
        const todas = [...(sis[id][k] || []), ...((sis[id].externo || {})[k] || []), ...((sis[id].umido || {})[k] || [])];
        if (todas.includes(classe)) etapas.push(l);
      }
      if (etapas.length) usos.push(s.nome.split(' (')[0] + ' (' + etapas.join(', ') + ')');
    }
    const cond = Object.keys(App.cont.condicoes_produtos || {}).filter(c => (App.cont.condicoes_produtos[c] || []).includes(classe)).map(c => { const r = (App.cont.especificador.condicoes || []).find(x => x.id === c); return r ? r.nome : c; });
    return { usos, cond };
  }
  function prodFicha(p) {
    const u = usosDaClasse(p.classe);
    const embs = Assessor.embalagensProduto(p);
    const linha = (l, v) => v ? `<tr><td class="texto-2">${l}</td><td style="text-align:right"><b>${esc(v)}</b></td></tr>` : '';
    return `<button class="btn link" onclick="App.prod.fechar()">‹ Voltar aos produtos</button>
      <div class="card"><div class="linha" style="align-items:flex-start;gap:12px">${p.imagem ? `<img class="foto-produto" src="${esc(p.imagem)}" alt="${esc(p.nome)}" onclick="App.cache.paginasAtuais=['${esc(p.imagem)}'];App.abrirVisor(0)">` : ''}<div class="cresce"><div class="chips" style="gap:6px"><span class="etiqueta ${marcaCor(p.marca)}">${esc(p.marca)}${p.linha ? ' · ' + esc(p.linha) : ''}</span><span class="etiqueta cinza">${esc(Assessor.classeNome(p.classe, App.cont))}</span></div><h2 class="mt-1">${esc(p.nome)}</h2>${p.destaque ? `<p class="pequeno" style="margin:0">${esc(p.destaque)}</p>` : ''}</div></div></div>
      <div class="card"><h3>📋 Ficha rápida</h3><table class="pequeno" style="width:100%">${linha('Ambiente', p.ambiente === 'ambos' ? 'Interior e exterior' : p.ambiente ? p.ambiente[0].toUpperCase() + p.ambiente.slice(1) : '')}${linha('Superfícies', (p.superficies || []).join(', '))}${linha('Acabamento', (p.acabamento || []).filter(a => a !== 'não aplicável').join(', '))}${linha('Diluição', p.diluicao)}${linha('Demãos', p.demaos)}${linha('Secagem', p.secagem)}</table></div>
      ${embs.length ? `<div class="card"><h3>📏 Rendimento${p.rend_tipo === 'acabado' ? ' (parede pronta, ' + esc(p.demaos || '2 a 3') + ' demãos)' : ' por demão'}</h3><table class="pequeno" style="width:100%">${embs.map(e => `<tr><td>${esc(e)}</td><td style="text-align:right"><b>${fmtNum(p.rend[e], 0)} m²</b>${p.rend_tipo === 'acabado' ? ` <span class="mini texto-3">(≈ ${fmtNum(p.rend[e] * 2, 0)} m² por demão)</span>` : ''}</td></tr>`).join('')}</table>${p.obs ? `<div class="ajuda">${esc(p.obs)}</div>` : ''}</div>` : ''}
      ${u.usos.length || u.cond.length ? `<div class="card info"><h3>🎯 Quando indicar</h3>${u.usos.length ? `<div class="pequeno"><b>Entra no sistema de:</b> ${esc(u.usos.join(' · '))}</div>` : ''}${u.cond.length ? `<div class="pequeno mt-1"><b>Tratamento para:</b> ${esc(u.cond.join(' · '))}</div>` : ''}</div>` : ''}
      <div class="botoes"><button class="btn" onclick="App.calc.novoComProduto('${p.id}')">🧮 Calcular quantidade</button><a class="btn verde" href="${zap(textoFichaProduto(p))}" target="_blank" rel="noopener">📲 Enviar ficha</a></div>
      <button class="btn link bloco mt-1" onclick="App.chat.perguntar('Quando indicar ${esc(p.marca)} ${esc(p.nome).replace(/'/g, '')} e como aplicar?')">💬 Perguntar ao chat sobre este produto</button>
      <p class="mini texto-3 centro">Dados do catálogo do fabricante (${p.marca === 'Coral' ? 'Coral 2025/2' : 'Eucatex 2026'}). Confira sempre a embalagem e a ficha técnica atual.</p>`;
  }
  function textoFichaProduto(p) { return [`*${p.marca} ${p.nome}* — Só Tintas`, '', Assessor.fichaProduto(p, App.cont), '', '_Dados do catálogo do fabricante. Confira sempre a embalagem._'].join('\n'); }

  /* ═══════════════════════ CHAT IA ═══════════════════════ */
  const CH = { mensagens: [], pensando: false };
  App.chat = { CH };
  const SUGESTOES = ['Reboco novo: o que preciso vender?', 'Parede com mofo no banheiro', 'Quantas latas para 60 m² com 2 demãos?', 'Portão de ferro enferrujado', 'Qual tinta Coral para fachada?', 'Produto Eucatex para laje com infiltração', 'Esmalte antigo em porta de madeira', 'Mancha que piora quando chove'];
  function telaChat() {
    App.posRender = () => { const el = $('#chat-fim'); if (el) el.scrollIntoView({ block: 'end' }); };
    return `<div class="card info pequeno" style="padding:10px 14px">💬 <b>Assessor ST</b> responde com base nos 8 guias técnicos da Só Tintas e no catálogo Coral/Eucatex${DB.mode === 'demo' ? ' (modo demonstração: busca local nos guias; com o Supabase configurado, a IA responde de forma personalizada)' : ''}. Tire dúvidas, peça uma especificação ou ajuda para explicar ao cliente.</div>
      <div class="sugestoes mb-2">${SUGESTOES.map(s => `<button onclick="App.chat.perguntar('${s.replace(/'/g, '')}')">${s}</button>`).join('')}</div>
      <div class="chat">${CH.mensagens.length ? CH.mensagens.map(m => `<div class="balao ${m.role === 'user' ? 'eu' : 'bot'}">${m.role === 'user' ? esc(m.content) : formatarBot(m.content)}${m.aviso ? `<div class="mini texto-3 mt-1">${esc(m.aviso)}</div>` : ''}</div>`).join('') : '<div class="balao bot">Olá! Sou o Assessor ST 👋 Me diga a superfície, a condição e o ambiente — ou escolha uma pergunta acima.</div>'}${CH.pensando ? '<div class="balao bot pensando">Consultando os guias…</div>' : ''}<div id="chat-fim"></div></div>
      <form class="chat-entrada" onsubmit="event.preventDefault();App.chat.perguntar(this.q.value);this.q.value=''"><input name="q" placeholder="Digite sua dúvida técnica…" autocomplete="off"><button type="submit">➤</button></form>`;
  }
  function formatarBot(t) { return esc(t).replace(/\*([^*\n]+)\*/g, '<b>$1</b>').replace(/_([^_\n]+)_/g, '<i>$1</i>').replace(/\n/g, '<br>'); }
  App.chat.perguntar = async (texto) => {
    texto = String(texto || '').trim(); if (!texto || CH.pensando) return;
    if (App.rota.view !== 'assessor' || App.rota.params[0] !== 'chat') { location.hash = '#/assessor/chat'; }
    CH.mensagens.push({ role: 'user', content: texto }); CH.pensando = true; App.render();
    try {
      const historico = CH.mensagens.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const r = await DB.perguntarAssessor(historico);
      CH.mensagens.push({ role: 'assistant', content: r.resposta, aviso: r.aviso || '' });
    } catch (e) { CH.mensagens.push({ role: 'assistant', content: 'Não consegui responder agora: ' + e.message }); }
    CH.pensando = false; App.render();
  };
})(window);
