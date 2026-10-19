/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO — Painel do Gestor
   Acompanhamento dos colaboradores, cadastros, conteúdo e configurações
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtData = (iso) => iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';
  const fmtDataHora = (iso) => iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
  const fmtNum = (n, d = 1) => Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* Definição das tabelas editáveis (mesmas colunas no modo demo e no Supabase) */
  const TABELAS = {
    modulos: { titulo: 'Módulos', chave: 'id', ordem: 'ordem', campos: [{ k: 'id', l: 'ID (ex.: m09)', req: true }, { k: 'ordem', l: 'Ordem', t: 'number' }, { k: 'titulo', l: 'Título', req: true }, { k: 'subtitulo', l: 'Subtítulo' }, { k: 'icone', l: 'Ícone (emoji)' }, { k: 'cor', l: 'Cor', t: 'select', op: ['vermelho', 'azul', 'verde', 'amarelo', 'laranja', 'cinza'] }, { k: 'descricao', l: 'Descrição', t: 'textarea' }, { k: 'fonte', l: 'Fonte (nome do guia)' }, { k: 'paginas', l: 'Nº de páginas do guia', t: 'number' }, { k: 'pdf', l: 'Arquivo PDF do guia (ex.: assets/pdf/guia.pdf)' }, { k: 'xp_bonus', l: 'ST bônus ao concluir', t: 'number' }, { k: 'obrigatorio', l: 'Obrigatório para a avaliação final', t: 'bool' }, { k: 'ativo', l: 'Ativo', t: 'bool' }], colunas: ['ordem', 'id', 'titulo', 'paginas', 'ativo'] },
    aulas: { titulo: 'Aulas', chave: 'id', ordem: 'ordem', campos: [{ k: 'id', l: 'ID (ex.: m09a01)', req: true }, { k: 'modulo_id', l: 'Módulo', t: 'select', opFn: () => DB.conteudo.modulos.map(m => m.id), req: true }, { k: 'ordem', l: 'Ordem', t: 'number' }, { k: 'titulo', l: 'Título', req: true }, { k: 'duracao_min', l: 'Duração (min)', t: 'number' }, { k: 'pagina_inicial', l: 'Página inicial do guia', t: 'number' }, { k: 'pagina_final', l: 'Página final do guia', t: 'number' }, { k: 'xp', l: 'ST', t: 'number' }, { k: 'conteudo', l: 'Conteúdo (HTML: <h2>, <p>, <ul>, <div class="dica">…)', t: 'textarea', grande: true }], colunas: ['modulo_id', 'ordem', 'id', 'titulo', 'duracao_min'] },
    questoes: { titulo: 'Questões', chave: 'id', ordem: 'ordem', campos: [{ k: 'id', l: 'ID (ex.: m09q01)', req: true }, { k: 'modulo_id', l: 'Módulo', t: 'select', opFn: () => DB.conteudo.modulos.map(m => m.id), req: true }, { k: 'ordem', l: 'Ordem', t: 'number' }, { k: 'enunciado', l: 'Enunciado', t: 'textarea', req: true }, { k: 'opcao_0', l: 'Alternativa A', req: true }, { k: 'opcao_1', l: 'Alternativa B', req: true }, { k: 'opcao_2', l: 'Alternativa C', req: true }, { k: 'opcao_3', l: 'Alternativa D', req: true }, { k: 'correta', l: 'Correta', t: 'select', op: ['0', '1', '2', '3'], rot: ['A', 'B', 'C', 'D'] }, { k: 'explicacao', l: 'Explicação (aparece no gabarito)', t: 'textarea' }, { k: 'final', l: 'Entra na avaliação final', t: 'bool' }], colunas: ['modulo_id', 'ordem', 'id', 'enunciado', 'final'], antes: (r) => { const o = r.opcoes || []; return { ...r, opcao_0: o[0], opcao_1: o[1], opcao_2: o[2], opcao_3: o[3], correta: String(r.correta) }; }, depois: (r) => { const o = { ...r, opcoes: [r.opcao_0, r.opcao_1, r.opcao_2, r.opcao_3], correta: Number(r.correta) }; delete o.opcao_0; delete o.opcao_1; delete o.opcao_2; delete o.opcao_3; return o; } },
    videos: { titulo: 'Vídeos', chave: 'id', ordem: 'ordem', campos: [{ k: 'id', l: 'ID (ex.: v07)', req: true }, { k: 'ordem', l: 'Ordem', t: 'number' }, { k: 'categoria', l: 'Categoria', t: 'select', op: ['Institucional', 'Produtos', 'Técnica', 'Atendimento', 'Outros'] }, { k: 'titulo', l: 'Título', req: true }, { k: 'descricao', l: 'Descrição', t: 'textarea' }, { k: 'url', l: 'Link (YouTube ou Google Drive)' }, { k: 'xp', l: 'ST', t: 'number' }, { k: 'ativo', l: 'Ativo', t: 'bool' }], colunas: ['ordem', 'categoria', 'titulo', 'url', 'ativo'] },
    historia: { titulo: 'Nossa História', chave: 'id', ordem: 'ordem', campos: [{ k: 'id', l: 'ID (ex.: h06)', req: true }, { k: 'ordem', l: 'Ordem', t: 'number' }, { k: 'ano', l: 'Ano / marco', req: true }, { k: 'titulo', l: 'Título', req: true }, { k: 'descricao', l: 'Texto', t: 'textarea' }, { k: 'imagem', l: 'Link da imagem (opcional)' }], colunas: ['ordem', 'ano', 'titulo'] },
    valores: { titulo: 'Propósito, Missão, Valores e Mantras', chave: 'id', ordem: 'ordem', campos: [{ k: 'id', l: 'ID (ex.: v12)', req: true }, { k: 'ordem', l: 'Ordem', t: 'number' }, { k: 'tipo', l: 'Tipo', t: 'select', op: ['proposito', 'missao', 'visao', 'valor', 'mantra', 'nao_permitimos'] }, { k: 'titulo', l: 'Título', req: true }, { k: 'descricao', l: 'Texto', t: 'textarea' }, { k: 'icone', l: 'Ícone (emoji)' }], colunas: ['ordem', 'tipo', 'titulo'] },
    jornada: { titulo: 'Jornada dos 30 dias', chave: 'id', ordem: 'ordem', campos: [{ k: 'id', l: 'ID (ex.: j21)', req: true }, { k: 'semana', l: 'Semana (1 a 4)', t: 'number' }, { k: 'ordem', l: 'Ordem', t: 'number' }, { k: 'titulo', l: 'Tarefa', req: true }, { k: 'descricao', l: 'Como fazer', t: 'textarea' }, { k: 'xp', l: 'ST', t: 'number' }], colunas: ['semana', 'ordem', 'titulo', 'xp'], tabela: 'jornada_tarefas' },
    base_conhecimento: { titulo: 'Base de conhecimento (Assessor / chat)', chave: 'id', ordem: 'ordem', campos: [{ k: 'id', l: 'ID (ex.: kb_novo)', req: true }, { k: 'ordem', l: 'Ordem', t: 'number' }, { k: 'titulo', l: 'Título', req: true }, { k: 'conteudo', l: 'Conteúdo', t: 'textarea', grande: true }, { k: 'tags', l: 'Palavras-chave (separadas por vírgula)' }, { k: 'ativo', l: 'Ativo', t: 'bool' }], colunas: ['ordem', 'titulo', 'tags'], antes: (r) => ({ ...r, tags: Array.isArray(r.tags) ? r.tags.join(', ') : (r.tags || '') }), depois: (r) => ({ ...r, tags: String(r.tags || '').split(',').map(x => x.trim()).filter(Boolean) }) },
    produtos: { titulo: 'Produtos (Coral / Eucatex)', chave: 'id', ordem: 'ordem', campos: [{ k: 'id', l: 'ID (ex.: coral_novo_produto)', req: true }, { k: 'ordem', l: 'Ordem', t: 'number' }, { k: 'marca', l: 'Marca', t: 'select', op: ['Coral', 'Eucatex', 'Outra'] }, { k: 'nome', l: 'Nome do produto', req: true }, { k: 'linha', l: 'Linha / família' }, { k: 'classe', l: 'Tipo (liga ao Especificador)', t: 'select', opFn: () => Object.keys((DB.conteudo && DB.conteudo.classes_produto) || {}), req: true }, { k: 'ambiente', l: 'Ambiente', t: 'select', op: ['ambos', 'interior', 'exterior'] }, { k: 'superficies', l: 'Superfícies (separadas por vírgula)' }, { k: 'acabamento', l: 'Acabamentos (separados por vírgula)' }, { k: 'diluicao', l: 'Diluição' }, { k: 'demaos', l: 'Demãos (ex.: 2 a 3)' }, { k: 'secagem', l: 'Secagem' }, { k: 'rend_tipo', l: 'Tipo de rendimento', t: 'select', op: ['demao', 'acabado', 'consumo'] }, { k: 'rend', l: 'Rendimento por embalagem (JSON) — ex.: {"18 L": 300, "3,6 L": 60}', t: 'textarea' }, { k: 'obs', l: 'Observações', t: 'textarea' }, { k: 'destaque', l: 'Destaque (frase de venda)', t: 'textarea' }, { k: 'imagem', l: 'Imagem da embalagem (ex.: assets/produtos/meu_produto.jpg)' }, { k: 'ativo', l: 'Ativo', t: 'bool' }], colunas: ['ordem', 'marca', 'nome', 'classe', 'ativo'],
      antes: (r) => ({ ...r, superficies: Array.isArray(r.superficies) ? r.superficies.join(', ') : (r.superficies || ''), acabamento: Array.isArray(r.acabamento) ? r.acabamento.join(', ') : (r.acabamento || ''), rend: typeof r.rend === 'object' && r.rend ? JSON.stringify(r.rend) : (r.rend || '{}') }),
      depois: (r) => { let rend = {}; try { rend = JSON.parse(r.rend || '{}'); } catch (e) { rend = {}; } return { ...r, superficies: String(r.superficies || '').split(',').map(x => x.trim()).filter(Boolean), acabamento: String(r.acabamento || '').split(',').map(x => x.trim()).filter(Boolean), rend }; } },
    regioes: { titulo: 'Regiões', chave: 'id', ordem: 'id', campos: [{ k: 'id', l: 'Número', t: 'number', req: true }, { k: 'nome', l: 'Nome da região (ex.: Região 1 · Bruno)', req: true }, { k: 'ativa', l: 'Ativa', t: 'bool' }], colunas: ['id', 'nome', 'ativa'] },
    lojas: { titulo: 'Lojas', chave: 'id', ordem: 'id', campos: [{ k: 'id', l: 'Código da filial (ex.: 7 para 007)', t: 'number', req: true }, { k: 'nome', l: 'Nome da loja', req: true }, { k: 'regiao_id', l: 'Região (supervisor)', t: 'select', opFn: () => [''].concat(((DB.conteudo && DB.conteudo.regioes) || []).map(r => String(r.id))), rotFn: () => ['— sem região —'].concat(((DB.conteudo && DB.conteudo.regioes) || []).map(r => r.nome)) }, { k: 'ativa', l: 'Ativa', t: 'bool' }], colunas: ['id', 'nome', 'regiao_id', 'ativa'],
      antes: (r) => ({ ...r, regiao_id: r.regiao_id == null ? '' : String(r.regiao_id) }), depois: (r) => ({ ...r, regiao_id: r.regiao_id === '' || r.regiao_id == null ? null : Number(r.regiao_id) }) },
    conquistas: { titulo: 'Conquistas', chave: 'id', ordem: 'ordem', campos: [{ k: 'id', l: 'ID', req: true }, { k: 'ordem', l: 'Ordem', t: 'number' }, { k: 'nome', l: 'Nome', req: true }, { k: 'emoji', l: 'Emoji' }, { k: 'descricao', l: 'Descrição' }, { k: 'xp', l: 'ST bônus', t: 'number' }, { k: 'regra', l: 'Regra (JSON) — ex.: {"tipo":"aulas","min":5}', t: 'textarea' }], colunas: ['ordem', 'emoji', 'nome', 'xp'], antes: (r) => ({ ...r, regra: typeof r.regra === 'string' ? r.regra : JSON.stringify(r.regra || {}) }), depois: (r) => { let regra = r.regra; try { regra = JSON.parse(r.regra); } catch (e) { throw new Error('Regra inválida: use JSON, ex.: {"tipo":"aulas","min":5}'); } return { ...r, regra }; } },
    niveis: { titulo: 'Níveis', chave: 'n', ordem: 'xp_min', campos: [{ k: 'n', l: 'Nº do nível', t: 'number', req: true }, { k: 'nome', l: 'Nome', req: true }, { k: 'emoji', l: 'Emoji' }, { k: 'xp_min', l: 'ST mínimo', t: 'number' }, { k: 'descricao', l: 'Descrição' }], colunas: ['n', 'emoji', 'nome', 'xp_min'] },
  };
  const REGRAS_XP_LABELS = { aula: 'Aula concluída', video: 'Vídeo assistido', quiz_aprovado: 'Quiz aprovado', quiz_nota10: 'Bônus nota 10 no quiz', modulo_bonus: 'Bônus módulo concluído', historia: 'Nossa história', valores: 'Propósito & valores', disc: 'Teste DISC', tarefa: 'Tarefa da jornada', final_aprovado: 'Avaliação final aprovada', login_diario: 'Presença diária', checklist: 'Checklist dinâmico enviado (1ª vez de cada)' };

  const G = { secao: 'visao', dados: null, filtroRegiao: '', filtroLoja: '', busca: '', subtab: 'modulos', detalhe: null };
  const U = DB.util; // perfis e escopo (compartilhado com o app)
  const PERFIS = U.PERFIS;
  const perfilRotulo = (p) => PERFIS[U.perfilDe({ perfil: p })] || p;
  const regiaoNome = (id) => { const r = ((DB.conteudo && DB.conteudo.regioes) || []).find(x => x.id === Number(id)); return r ? r.nome : '—'; };
  const lojaNome = (id) => { const l = ((DB.conteudo && DB.conteudo.lojas) || []).find(x => x.id === Number(id)); return l ? U.lojaRotulo(l) : '—'; };
  const souCoord = () => U.ehCoordenador(DB.usuario);

  async function init() {
    const root = $('#painel');
    root.innerHTML = '<div class="g-conteudo"><p class="texto-3">Carregando…</p></div>';
    try { await DB.init(true); } catch (e) { root.innerHTML = `<div class="g-conteudo"><div class="card erro">${esc(e.message)}</div></div>`; return; }
    if (!DB.usuario) return renderLogin();
    if (!U.ehLider(DB.usuario)) { root.innerHTML = `<div class="g-conteudo"><div class="card alerta"><h3>Acesso restrito</h3><p>Seu login (${esc(DB.usuario.login)}) tem perfil de colaborador: o seu painel é o <b>Perfil</b> dentro do app. Gerentes veem a loja, supervisores a região e o coordenador tudo — peça ao coordenador para ajustar seu perfil.</p><div class="botoes"><a class="btn" href="index.html">Voltar ao app</a><button class="btn cinza" onclick="Gestor.sair()">Entrar com outra conta</button></div></div></div>`; return; }
    if (!souCoord()) G.secao = 'visao';
    await carregar(); render();
  }
  async function carregar() { G.dados = await DB.gestor.resumo(); }

  function renderLogin() {
    $('#painel').innerHTML = `<div class="login-tela"><div class="login-topo"><div class="logo-st" style="justify-content:center"><span class="marca">SÓ TINTAS</span></div><div class="titulo-app">PAINEL DO <span>GESTOR</span></div><div style="opacity:.9">MENTOR ST PRO</div></div>
      <div class="login-corpo" style="max-width:480px;margin:0 auto;width:100%;border-radius:28px">${DB.mode === 'demo' ? '<div class="aviso-demo">🧪 Modo demonstração — na demo, o primeiro colaborador cadastrado no app vira gestor.</div>' : ''}
      <form onsubmit="Gestor.entrar(event)"><div class="campo"><label>Login</label><input name="login" required></div><div class="campo"><label>Senha</label><input name="senha" type="password" required></div><div id="erro" class="msg-erro oculto"></div><button class="btn bloco azul" type="submit">Entrar no painel</button></form>
      <p class="pequeno centro mt-2"><a href="index.html">← Voltar ao app do colaborador</a></p></div></div>`;
  }
  async function entrar(ev) { ev.preventDefault(); const f = ev.target; try { await DB.entrar(f.login.value, f.senha.value); init(); } catch (e) { const el = $('#erro'); el.textContent = e.message; el.classList.remove('oculto'); } }

  function render() {
    const secoes = souCoord() ? [['visao', '📊', 'Visão geral'], ['niveis', '💰', 'Níveis de venda'], ['colaboradores', '👥', 'Colaboradores'], ['conteudo', '📚', 'Conteúdo'], ['duvidas', '💬', 'Dúvidas do Assessor'], ['config', '⚙️', 'Configurações'], ['ajuda', '❓', 'Ajuda']] : [['visao', '📊', 'Minha equipe'], ['niveis', '💰', 'Níveis de venda'], ['duvidas', '💬', 'Dúvidas do Assessor']];
    if (!secoes.some(([k]) => k === G.secao)) G.secao = 'visao';
    const corpo = { visao: secVisao, niveis: secNiveis, colaboradores: secColab, conteudo: secConteudo, duvidas: secDuvidas, config: secConfig, ajuda: secAjuda }[G.secao]();
    const esc0 = U.escopoDe(DB.usuario, DB.conteudo);
    $('#painel').innerHTML = `<div class="g-layout"><aside class="g-lateral"><div class="logo-st"><span class="marca">SÓ TINTAS</span></div><div class="pequeno negrito mb-2">MENTOR ST PRO · ${souCoord() ? 'Coordenação' : esc(perfilRotulo(DB.usuario.perfil))}</div><div class="mini mb-2" style="opacity:.8">${esc(esc0.rotulo)}</div>
      <nav>${secoes.map(([k, i, l]) => `<button class="${G.secao === k ? 'ativo' : ''}" onclick="Gestor.ir('${k}')">${i} ${l}</button>`).join('')}</nav>
      <div class="rodape">${esc(DB.usuario.nome)}<br>${DB.mode === 'demo' ? '🧪 modo demonstração' : '🟢 conectado ao Supabase'}<br><a href="index.html" style="color:#FFD200">Abrir o app</a> · <a href="#" style="color:#fff" onclick="Gestor.sair()">Sair</a></div></aside>
      <main class="g-conteudo">${corpo}</main></div>`;
  }
  const ir = (s) => { G.secao = s; G.detalhe = null; render(); };

  /* ───────────── Visão geral ───────────── */
  const SEMANA = () => Date.now() - 7 * 86400000;
  const pctTrilha = (c) => c.total_modulos ? c.modulos / c.total_modulos : 0;
  function linhasFiltradas() {
    const q = G.busca.toLowerCase();
    return (G.dados.colaboradores || []).filter(c => (!G.filtroRegiao || String(c.regiao_id == null ? 'sem' : c.regiao_id) === G.filtroRegiao) && (!G.filtroLoja || String(c.loja_id) === G.filtroLoja) && (!q || (c.nome + ' ' + c.login + ' ' + c.loja).toLowerCase().includes(q)));
  }
  // Resumo por loja (ou por região, no nível da rede): colaboradores, ativos, trilha média, aprovados, sem acesso há 7+ dias
  function resumoPor(chave, linhas) {
    const grupos = {};
    for (const c of linhas) { const k = chave === 'regiao' ? (c.regiao_id == null ? 'sem' : String(c.regiao_id)) : String(c.loja_id); (grupos[k] = grupos[k] || { k, nome: chave === 'regiao' ? (c.regiao || 'Sem região') : lojaNome(c.loja_id), regiao: c.regiao || '—', itens: [] }).itens.push(c); }
    return Object.values(grupos).map(g => { const n = g.itens.length; const ativos = g.itens.filter(c => c.ultimo_acesso && new Date(c.ultimo_acesso).getTime() > SEMANA()).length; return { ...g, n, ativos, parados: n - ativos, media: Math.round(g.itens.reduce((s, c) => s + pctTrilha(c), 0) / n * 100), aprovados: g.itens.filter(c => c.final_nota != null).length, st: Math.round(g.itens.reduce((s, c) => s + (c.xp || 0), 0) / n) }; }).sort((a, b) => a.nome.localeCompare(b.nome));
  }
  function secVisao() {
    const todos = G.dados.colaboradores || []; const escopo = U.escopoDe(DB.usuario, DB.conteudo);
    const ativos = todos.filter(c => c.ultimo_acesso && new Date(c.ultimo_acesso).getTime() > SEMANA()).length;
    const media = todos.length ? Math.round(todos.reduce((s, c) => s + pctTrilha(c), 0) / todos.length * 100) : 0;
    const aprovados = todos.filter(c => c.final_nota != null).length;
    const lista = linhasFiltradas();
    const regioes = (DB.conteudo.regioes || []).filter(r => todos.some(c => c.regiao_id === r.id));
    const lojasOp = (DB.conteudo.lojas || []).filter(l => todos.some(c => c.loja_id === l.id && (!G.filtroRegiao || String(l.regiao_id == null ? 'sem' : l.regiao_id) === G.filtroRegiao)));
    const porLoja = escopo.nivel === 'loja' ? [] : resumoPor('loja', lista);
    const porRegiao = escopo.nivel === 'rede' && !G.filtroRegiao ? resumoPor('regiao', lista) : [];
    const barra = (p) => `<div class="barra fina" style="min-width:80px"><span style="width:${p}%"></span></div>`;
    return `<div class="g-topo"><div><h1>${escopo.nivel === 'rede' ? 'Visão geral' : 'Minha equipe'}</h1><div class="pequeno texto-2">${esc(escopo.rotulo)}${escopo.nivel === 'regiao' ? ` · ${(DB.conteudo.lojas || []).filter(l => l.regiao_id === escopo.regiao_id).length} lojas` : ''}</div></div><div class="botoes"><button class="btn pequeno cinza" onclick="Gestor.recarregar()">↻ Atualizar</button><button class="btn pequeno azul" onclick="Gestor.exportarCSV()">⬇ Exportar CSV</button>${DB.mode === 'demo' && souCoord() ? `<button class="btn pequeno amarelo" onclick="Gestor.popularDemo()">🧪 Popular com equipe fictícia</button>` : ''}</div></div>
      <div class="kpis"><div class="kpi"><div class="v">${todos.length}</div><div class="l">Colaboradores</div></div><div class="kpi"><div class="v">${ativos}</div><div class="l">Ativos nos últimos 7 dias</div></div><div class="kpi"><div class="v">${todos.length - ativos}</div><div class="l">Sem acesso há 7+ dias</div></div><div class="kpi"><div class="v">${media}%</div><div class="l">Trilha concluída (média)</div></div><div class="kpi"><div class="v">${aprovados}</div><div class="l">Aprovados na avaliação final</div></div></div>
      <div class="filtros">${escopo.nivel === 'rede' ? `<div class="campo"><label>Região</label><select onchange="Gestor.G.filtroRegiao=this.value;Gestor.G.filtroLoja='';Gestor.render()"><option value="">Todas</option>${regioes.map(r => `<option value="${r.id}" ${G.filtroRegiao === String(r.id) ? 'selected' : ''}>${esc(r.nome)}</option>`).join('')}${todos.some(c => c.regiao_id == null) ? `<option value="sem" ${G.filtroRegiao === 'sem' ? 'selected' : ''}>Sem região</option>` : ''}</select></div>` : ''}${escopo.nivel !== 'loja' ? `<div class="campo"><label>Loja</label><select onchange="Gestor.G.filtroLoja=this.value;Gestor.render()"><option value="">Todas</option>${lojasOp.map(l => `<option value="${l.id}" ${G.filtroLoja === String(l.id) ? 'selected' : ''}>${esc(U.lojaRotulo(l))}</option>`).join('')}</select></div>` : ''}<div class="campo"><label>Buscar</label><input placeholder="nome ou login" value="${esc(G.busca)}" onchange="Gestor.G.busca=this.value;Gestor.render()"></div></div>
      ${porRegiao.length > 1 ? `<h3>Por região</h3><div class="tabela-wrap mb-2"><table class="tabela"><thead><tr><th>Região</th><th>Colaboradores</th><th>Ativos 7d</th><th>Sem acesso 7d+</th><th>Trilha média</th><th>ST médio</th><th>Aprovados</th></tr></thead><tbody>${porRegiao.map(g => `<tr style="cursor:pointer" onclick="Gestor.G.filtroRegiao='${g.k}';Gestor.G.filtroLoja='';Gestor.render()"><td><b>${esc(g.nome)}</b></td><td>${g.n}</td><td>${g.ativos}</td><td>${g.parados ? '<span style="color:var(--vermelho)">' + g.parados + '</span>' : 0}</td><td><div class="linha">${barra(g.media)}<span>${g.media}%</span></div></td><td>${g.st}</td><td>${g.aprovados}</td></tr>`).join('')}</tbody></table></div>` : ''}
      ${porLoja.length ? `<h3>Por loja</h3><div class="tabela-wrap mb-2"><table class="tabela"><thead><tr><th>Loja</th>${escopo.nivel === 'rede' ? '<th>Região</th>' : ''}<th>Colaboradores</th><th>Ativos 7d</th><th>Sem acesso 7d+</th><th>Trilha média</th><th>ST médio</th><th>Aprovados</th></tr></thead><tbody>${porLoja.map(g => `<tr style="cursor:pointer" onclick="Gestor.G.filtroLoja='${g.k}';Gestor.render()"><td><b>${esc(g.nome)}</b></td>${escopo.nivel === 'rede' ? `<td>${esc(g.regiao)}</td>` : ''}<td>${g.n}</td><td>${g.ativos}</td><td>${g.parados ? '<span style="color:var(--vermelho)">' + g.parados + '</span>' : 0}</td><td><div class="linha">${barra(g.media)}<span>${g.media}%</span></div></td><td>${g.st}</td><td>${g.aprovados}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <h3>Colaboradores${G.filtroLoja ? ' · ' + esc(lojaNome(G.filtroLoja)) + ` <button class="btn mini cinza" onclick="Gestor.G.filtroLoja='';Gestor.render()">limpar filtro</button>` : ''}</h3>
      <div class="tabela-wrap"><table class="tabela"><thead><tr><th>Colaborador</th><th>Loja</th><th>Cargo</th><th>Nível</th><th>ST</th><th>Aulas</th><th>Módulos</th><th>Quizzes</th><th>Final</th><th>DISC</th><th>Sequência</th><th>Último acesso</th></tr></thead>
      <tbody>${lista.map(c => `<tr style="cursor:pointer" onclick="Gestor.detalhe('${c.id}')"><td><b>${esc(c.nome)}</b><div class="mini texto-3">${esc(c.login)}${c.perfil !== 'colaborador' ? ' · ' + esc(perfilRotulo(c.perfil)) + (c.perfil === 'supervisor' && c.supervisiona_regiao_id != null ? ' (' + esc(regiaoNome(c.supervisiona_regiao_id)) + ')' : '') : ''}${c.ativo === false ? ' · <span style="color:var(--vermelho)">inativo</span>' : ''}</div></td><td>${esc(c.loja)}</td><td>${esc(c.cargo || '')}</td><td>${esc(c.nivel)}</td><td>${c.xp}</td><td>${c.aulas}/${c.total_aulas}</td><td>${c.modulos}/${c.total_modulos}</td><td>${c.quizzes}</td><td>${c.final_nota != null ? '<b style="color:var(--verde)">' + fmtNum(c.final_nota) + '</b>' : '—'}</td><td>${esc(c.disc || '—')}</td><td>${c.streak || 0}d</td><td class="${c.ultimo_acesso && new Date(c.ultimo_acesso).getTime() > SEMANA() ? '' : 'texto-3'}">${fmtDataHora(c.ultimo_acesso)}</td></tr>`).join('') || '<tr><td colspan="12" class="centro texto-3">Nenhum colaborador neste recorte.</td></tr>'}</tbody></table></div>`;
  }
  async function popularDemo() { const n = await DB.gestor.demo.gestorPopular(); await carregar(); render(); toast(n ? `${n} colaboradores fictícios criados (senha 123456)` : 'A equipe fictícia já existe'); }
  async function detalhe(id) {
    const c = (G.dados.colaboradores || []).find(x => x.id === id); if (!c) return;
    const d = await DB.gestor.detalhe(id);
    const cont = DB.conteudo;
    const feito = (t, i) => d.itens.some(x => x.item_tipo === t && x.item_id === i);
    const mods = cont.modulos.map(m => { const aulas = cont.aulas.filter(a => a.modulo_id === m.id); const feitas = aulas.filter(a => feito('aula', a.id)).length; const quiz = d.itens.find(x => x.item_tipo === 'quiz' && x.item_id === m.id); return `<tr><td>${m.icone} ${esc(m.titulo)}</td><td>${feitas}/${aulas.length}</td><td>${quiz ? '<b style="color:var(--verde)">' + fmtNum(quiz.nota) + '</b>' : '—'}</td><td>${d.tentativas.filter(t => t.modulo_id === m.id).length}</td></tr>`; }).join('');
    const tarefas = cont.jornada.filter(t => feito('tarefa', t.id)).length;
    modal(`<div class="g-modal"><div class="linha entre"><h2 style="margin:0">${esc(c.nome)}</h2><button class="btn mini cinza" onclick="Gestor.fecharModal()">✕</button></div>
      <p class="pequeno texto-2">${esc(c.login)} · ${esc(c.loja)} · ${esc(c.cargo || '')} · ${esc(c.nivel)} (${c.xp} ST) · ${c.conquistas || 0} conquistas · jornada ${tarefas}/${cont.jornada.length} · cadastro ${fmtData(c.criado_em)}</p>
      <div class="kpis"><div class="kpi"><div class="v">${feito('historia', 'HISTORIA') ? '✔' : '—'}</div><div class="l">História</div></div><div class="kpi"><div class="v">${feito('valores', 'VALORES') ? '✔' : '—'}</div><div class="l">Valores</div></div><div class="kpi"><div class="v">${d.disc ? esc(d.disc.dominante) : '—'}</div><div class="l">DISC</div></div><div class="kpi"><div class="v">${c.final_nota != null ? fmtNum(c.final_nota) : '—'}</div><div class="l">Avaliação final</div></div></div>
      <div class="tabela-wrap"><table class="tabela"><thead><tr><th>Módulo</th><th>Aulas</th><th>Quiz (melhor nota)</th><th>Tentativas</th></tr></thead><tbody>${mods}</tbody></table></div>
      ${d.chat && d.chat.length ? `<h3 class="mt-2">Últimas dúvidas no Assessor</h3>${d.chat.slice(0, 8).map(x => `<div class="pequeno" style="padding:6px 0;border-bottom:1px solid var(--borda)"><b>${esc(x.pergunta)}</b><div class="mini texto-3">${fmtDataHora(x.criado_em)} · ${esc(x.origem || '')}</div></div>`).join('')}` : ''}
      ${souCoord() ? `<div class="card mt-2" style="margin-bottom:0"><b>Nível de acesso</b><div class="filtros" style="margin:8px 0 0"><div class="campo"><label>Perfil</label><select id="det-perfil" onchange="document.getElementById('det-regiao-campo').style.display=this.value==='supervisor'?'':'none'">${Object.entries(PERFIS).map(([k, l]) => `<option value="${k}" ${U.perfilDe(c) === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div><div class="campo" id="det-regiao-campo" style="${U.perfilDe(c) === 'supervisor' ? '' : 'display:none'}"><label>Região que supervisiona</label><select id="det-regiao">${(DB.conteudo.regioes || []).map(r => `<option value="${r.id}" ${c.supervisiona_regiao_id === r.id ? 'selected' : ''}>${esc(r.nome)}</option>`).join('')}</select></div><div class="campo"><label>&nbsp;</label><button class="btn pequeno azul" onclick="Gestor.alterarPerfil('${c.id}',document.getElementById('det-perfil').value,document.getElementById('det-regiao').value)">Salvar acesso</button></div></div><div class="mini texto-3 mt-1">Colaborador vê só o próprio painel · Gerente vê a loja dele · Supervisor vê as lojas da região · Coordenador vê tudo e edita o conteúdo.</div></div>
      <div class="botoes mt-2">
        ${DB.mode === 'supabase' ? `<button class="btn pequeno cinza" onclick="Gestor.ativar('${c.id}',${c.ativo === false})">${c.ativo === false ? 'Reativar acesso' : 'Desativar acesso'}</button><button class="btn pequeno amarelo" onclick="Gestor.redefinirSenha('${c.id}','${esc(c.nome)}')">Redefinir senha</button>` : `<button class="btn pequeno contorno vermelho" onclick="Gestor.remover('${c.id}')">Remover (demo)</button>`}
      </div>` : ''}</div>`);
  }
  async function alterarPerfil(id, perfil, regiao_id) { if (id === DB.usuario.id && perfil !== 'coordenador') { toast('Você não pode rebaixar o próprio perfil.'); return; } await DB.gestor.alterarPerfil(id, perfil, regiao_id); await carregar(); fecharModal(); render(); toast('Nível de acesso atualizado'); }
  async function ativar(id, ativo) { await DB.gestor.supabase.gestorAtivar(id, ativo); await carregar(); fecharModal(); render(); }
  function confirmar(msg, cb, rotulo) { G._cb = cb; modal(`<div class="g-modal" style="max-width:420px"><h3>${esc(msg)}</h3><div class="botoes mt-2"><button class="btn" onclick="Gestor.fecharModal();Gestor.G._cb&&Gestor.G._cb()">${esc(rotulo || 'Confirmar')}</button><button class="btn cinza" onclick="Gestor.fecharModal()">Cancelar</button></div></div>`); }
  function remover(id) { confirmar('Remover este colaborador da demonstração?', async () => { await DB.gestor.demo.gestorRemover(id); await carregar(); render(); }, 'Remover'); }
  function redefinirSenha(id, nome) {
    modal(`<div class="g-modal" style="max-width:460px"><h3>Nova senha para ${esc(nome)}</h3><form onsubmit="event.preventDefault();Gestor.redefinirSenhaOk('${id}',this.senha.value)"><div class="campo"><label>Senha (mínimo 6 caracteres)</label><input name="senha" minlength="6" required autocomplete="off"></div><div class="botoes"><button class="btn verde" type="submit">Redefinir</button><button class="btn cinza" type="button" onclick="Gestor.fecharModal()">Cancelar</button></div></form></div>`);
  }
  async function redefinirSenhaOk(id, senha) { try { await DB.gestor.supabase.gestorRedefinirSenha(id, senha); fecharModal(); toast('Senha redefinida ✔'); } catch (e) { toast(e.message); } }
  function exportarCSV() {
    const cols = ['nome', 'login', 'loja', 'regiao', 'cargo', 'perfil', 'nivel', 'xp', 'aulas', 'modulos', 'quizzes', 'videos', 'final_nota', 'disc', 'conquistas', 'streak', 'criado_em', 'ultimo_acesso'];
    const linhas = [cols.join(';')].concat(linhasFiltradas().map(c => cols.map(k => '"' + String(c[k] == null ? '' : c[k]).replace(/"/g, '""') + '"').join(';')));
    const blob = new Blob(['﻿' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mentor-st-pro-progresso.csv'; a.click();
  }

  /* ───────────── Colaboradores / pré-cadastro ───────────── */
  function secColab() { setTimeout(carregarPre, 0); return `<div class="g-topo"><h1>Colaboradores</h1></div>
      <div class="card"><h3>Liberar login (pré-cadastro)</h3><p class="pequeno texto-2">Dois jeitos de um novo colaborador entrar: (1) ele usa o <b>código de cadastro</b> (em Configurações) ou (2) você libera o login dele aqui — aí ele cria a senha no primeiro acesso sem precisar de código. É aqui que você define o <b>nível de acesso</b> (gerente, supervisor, coordenador); quem entra pelo código vira colaborador e pode ser promovido depois na Visão geral.</p>
      <form class="filtros" onsubmit="Gestor.salvarPre(event)"><div class="campo"><label>Login do sistema</label><input name="login" required placeholder="ex.: maria.souza"></div><div class="campo"><label>Nome</label><input name="nome" placeholder="opcional"></div><div class="campo"><label>Loja</label><select name="loja_id">${DB.conteudo.lojas.map(l => `<option value="${l.id}">${esc(U.lojaRotulo(l))}</option>`).join('')}</select></div><div class="campo"><label>Cargo</label><select name="cargo"><option>Vendedor(a)</option><option>Auxiliar de Loja</option><option>Assistente Comercial / Op. de Caixa</option><option>Gerente</option><option>Supervisor(a)</option><option>Coordenador(a)</option></select></div><div class="campo"><label>Perfil de acesso</label><select name="perfil" onchange="this.form.regiao_id.parentElement.style.display=this.value==='supervisor'?'':'none'">${Object.entries(PERFIS).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</select></div><div class="campo" style="display:none"><label>Região (supervisor)</label><select name="regiao_id">${(DB.conteudo.regioes || []).map(r => `<option value="${r.id}">${esc(r.nome)}</option>`).join('')}</select></div><button class="btn azul" type="submit">Liberar</button></form>
      <p class="mini texto-3" style="margin:8px 0 0">Níveis: <b>Colaborador</b> vê só o próprio painel · <b>Gerente</b> vê a loja · <b>Supervisor</b> vê as lojas da região · <b>Coordenador</b> vê tudo e edita o conteúdo.</p></div>
      <div id="pre-lista" class="tabela-wrap"><p class="pequeno texto-3" style="padding:12px">Carregando…</p></div>`; }
  async function carregarPre() {
    const el = $('#pre-lista'); if (!el) return;
    const lista = DB.mode === 'supabase' ? await DB.gestor.supabase.gestorListar('pre_cadastro', 'login') : await DB.gestor.demo.gestorPreCadastro();
    el.innerHTML = `<table class="tabela"><thead><tr><th>Login</th><th>Nome</th><th>Loja</th><th>Cargo</th><th>Perfil</th><th>Usado?</th><th></th></tr></thead><tbody>${lista.map(p => `<tr><td><b>${esc(p.login)}</b></td><td>${esc(p.nome || '')}</td><td>${esc(lojaNome(p.loja_id))}</td><td>${esc(p.cargo || '')}</td><td>${esc(perfilRotulo(p.perfil || 'colaborador'))}${p.perfil === 'supervisor' && p.regiao_id != null ? ' · ' + esc(regiaoNome(p.regiao_id)) : ''}</td><td>${p.usado ? '✔' : '—'}</td><td class="acoes"><button class="btn mini contorno vermelho" onclick="Gestor.removerPre('${esc(p.login)}')">remover</button></td></tr>`).join('') || '<tr><td colspan="7" class="centro texto-3">Nenhum login liberado.</td></tr>'}</tbody></table>`;
  }
  async function salvarPre(ev) {
    ev.preventDefault(); const f = ev.target;
    const reg = { login: DB.util.normalizarLogin(f.login.value), nome: f.nome.value, loja_id: Number(f.loja_id.value), cargo: f.cargo.value, perfil: f.perfil.value, regiao_id: f.perfil.value === 'supervisor' ? Number(f.regiao_id.value) : null, usado: false };
    try {
      if (DB.mode === 'supabase') await DB.gestor.supabase.gestorUpsert('pre_cadastro', reg);
      else { const lista = await DB.gestor.demo.gestorPreCadastro(); const i = lista.findIndex(x => x.login === reg.login); if (i >= 0) lista[i] = reg; else lista.push(reg); await DB.gestor.demo.gestorSalvarPreCadastro(lista); }
      f.reset(); toast('Login liberado ✔'); carregarPre();
    } catch (e) { toast(e.message); }
  }
  async function removerPre(login) {
    if (DB.mode === 'supabase') await DB.gestor.supabase.gestorExcluir('pre_cadastro', 'login', login);
    else { const lista = (await DB.gestor.demo.gestorPreCadastro()).filter(x => x.login !== login); await DB.gestor.demo.gestorSalvarPreCadastro(lista); }
    carregarPre();
  }

  /* ───────────── Conteúdo (CRUD genérico) ───────────── */
  function secConteudo() {
    const def = TABELAS[G.subtab];
    const lista = [...(DB.conteudo[G.subtab] || [])].sort((a, b) => (Number(a[def.ordem]) || 0) - (Number(b[def.ordem]) || 0) || String(a[def.ordem] || '').localeCompare(String(b[def.ordem] || '')));
    const celula = (r, k) => { const v = r[k]; if (typeof v === 'boolean') return v ? '✔' : '—'; if (k === 'regiao_id') { const rg = ((DB.conteudo && DB.conteudo.regioes) || []).find(x => x.id === Number(v)); return esc(rg ? rg.nome : '—'); } return esc(String(v == null ? '' : v)).slice(0, 80); };
    return `<div class="g-topo"><h1>Conteúdo</h1><button class="btn pequeno" onclick="Gestor.editar('${G.subtab}',null)">＋ Novo em ${esc(def.titulo)}</button></div>
      <div class="abas" style="max-width:100%">${Object.keys(TABELAS).map(k => `<button class="${G.subtab === k ? 'ativa' : ''}" onclick="Gestor.G.subtab='${k}';Gestor.render()">${esc(TABELAS[k].titulo)}</button>`).join('')}</div>
      ${G.subtab === 'aulas' ? '<p class="pequeno texto-2">As páginas do guia são as imagens em <span class="codigo">assets/material/&lt;módulo&gt;/p001.jpg…</span>. Para um módulo novo, crie a pasta com as páginas (JPG numeradas) e informe página inicial/final em cada aula.</p>' : ''}
      ${G.subtab === 'videos' ? '<p class="pequeno texto-2">Cole o link do YouTube (pode ser "não listado") ou de um arquivo no Google Drive compartilhado com "qualquer pessoa com o link".</p>' : ''}
      ${G.subtab === 'base_conhecimento' ? '<p class="pequeno texto-2">É daqui que o chat do Assessor tira as respostas (e, com a IA ligada, o que ele recebe como contexto). Escreva como você explicaria para um vendedor novo.</p>' : ''}
      ${G.subtab === 'produtos' ? '<p class="pequeno texto-2">Catálogo que o Especificador, a Calculadora e o chat usam para indicar produtos. O campo <b>Tipo</b> liga o produto às etapas (fundo, massa, acabamento) de cada superfície. Rendimento: use <b>demao</b> quando o catálogo informa m² por demão e <b>acabado</b> quando informa m² de parede pronta.</p>' : ''}
      <div class="tabela-wrap"><table class="tabela"><thead><tr>${def.colunas.map(c => `<th>${esc((def.campos.find(x => x.k === c) || { l: c }).l.split(' (')[0])}</th>`).join('')}<th></th></tr></thead>
      <tbody>${lista.map(r => `<tr>${def.colunas.map(c => `<td>${celula(r, c)}</td>`).join('')}<td class="acoes"><button class="btn mini azul" onclick="Gestor.editar('${G.subtab}','${esc(String(r[def.chave]))}')">editar</button> <button class="btn mini contorno vermelho" onclick="Gestor.excluir('${G.subtab}','${esc(String(r[def.chave]))}')">excluir</button></td></tr>`).join('')}</tbody></table></div>`;
  }
  function editar(tab, chave) {
    const def = TABELAS[tab]; const lista = DB.conteudo[tab] || [];
    let reg = chave != null ? lista.find(r => String(r[def.chave]) === String(chave)) : {};
    reg = def.antes ? def.antes(reg || {}) : { ...(reg || {}) };
    const campo = (c) => {
      const v = reg[c.k]; const ops = c.opFn ? c.opFn() : (c.op || []);
      if (c.t === 'bool') return `<label class="caixa-opcao"><input type="checkbox" name="${c.k}" ${v !== false && v != null ? 'checked' : (v == null && chave == null ? 'checked' : '')}><span>${esc(c.l)}</span></label>`;
      if (c.t === 'select') { const rot = c.rotFn ? c.rotFn() : c.rot; return `<div class="campo"><label>${esc(c.l)}</label><select name="${c.k}">${ops.map((o, i) => `<option value="${esc(o)}" ${String(v == null ? '' : v) === String(o) ? 'selected' : ''}>${esc(rot ? rot[i] : o)}</option>`).join('')}</select></div>`; }
      if (c.t === 'textarea') return `<div class="campo"><label>${esc(c.l)}</label><textarea name="${c.k}" style="min-height:${c.grande ? 260 : 90}px;font-family:${c.grande ? 'ui-monospace,monospace' : 'inherit'};font-size:.85rem">${esc(v == null ? '' : v)}</textarea></div>`;
      return `<div class="campo"><label>${esc(c.l)}</label><input name="${c.k}" type="${c.t === 'number' ? 'number' : 'text'}" step="any" value="${esc(v == null ? '' : v)}" ${c.req ? 'required' : ''} ${chave != null && c.k === def.chave ? 'readonly' : ''}></div>`;
    };
    modal(`<div class="g-modal"><div class="linha entre"><h2 style="margin:0">${chave != null ? 'Editar' : 'Novo'} — ${esc(def.titulo)}</h2><button class="btn mini cinza" onclick="Gestor.fecharModal()">✕</button></div>
      <form class="mt-2" onsubmit="Gestor.salvar(event,'${tab}',${chave != null ? "'" + esc(String(chave)) + "'" : 'null'})">${def.campos.map(campo).join('')}<div class="botoes mt-2"><button class="btn verde" type="submit">Salvar</button><button class="btn cinza" type="button" onclick="Gestor.fecharModal()">Cancelar</button></div></form></div>`);
  }
  async function salvar(ev, tab, chave) {
    ev.preventDefault(); const def = TABELAS[tab]; const f = ev.target; let reg = {};
    for (const c of def.campos) { if (c.t === 'bool') reg[c.k] = f[c.k].checked; else if (c.t === 'number') reg[c.k] = f[c.k].value === '' ? null : Number(f[c.k].value); else reg[c.k] = f[c.k].value; }
    try {
      if (def.depois) reg = def.depois(reg);
      const lista = [...(DB.conteudo[tab] || [])]; const i = lista.findIndex(r => String(r[def.chave]) === String(chave != null ? chave : reg[def.chave]));
      if (chave == null && i >= 0) throw new Error('Já existe um registro com este ID.');
      if (DB.mode === 'supabase') { await DB.gestor.supabase.gestorUpsert(def.tabela || tab, reg); }
      else { const ant = i >= 0 ? lista[i] : {}; const novo = { ...ant, ...reg }; if (i >= 0) lista[i] = novo; else lista.push(novo); await DB.gestor.demo.gestorSalvarConteudo(tab, lista); }
      await DB.recarregarConteudo(true); fecharModal(); render(); toast('Salvo ✔');
    } catch (e) { toast(e.message); }
  }
  function excluir(tab, chave) { confirmar('Excluir este registro?', () => excluirOk(tab, chave), 'Excluir'); }
  async function excluirOk(tab, chave) {
    const def = TABELAS[tab];
    try {
      if (DB.mode === 'supabase') await DB.gestor.supabase.gestorExcluir(def.tabela || tab, def.chave, def.campos.find(c => c.k === def.chave).t === 'number' ? Number(chave) : chave);
      else { const lista = (DB.conteudo[tab] || []).filter(r => String(r[def.chave]) !== String(chave)); await DB.gestor.demo.gestorSalvarConteudo(tab, lista); }
      await DB.recarregarConteudo(true); render(); toast('Excluído');
    } catch (e) { toast(e.message); }
  }

  /* ───────────── Níveis de venda (lojas N1–N3 · vendedores V1–V5) ───────────── */
  const NV = { aba: 'vendedores', busca: '', importando: false, previa: null };
  function niveisCalc() { const c = DB.conteudo; return Niveis.calcular(c.niveis_vendas, c.niveis_lojas || [], c.niveis_vendedores || [], c.lojas || []); }
  const nvCor = (v) => ((DB.conteudo.niveis_vendas || {}).cores_vendedor || {})[v] || '#444';
  const nvBadge = (v) => `<span class="nv-badge mini" style="background:${nvCor(v)};color:${v === 3 ? '#2a2000' : '#fff'}">V${v}</span>`;
  const nvLoja = (n) => `<span class="nv-badge mini" style="background:${{ 3: '#E6B935', 2: '#C3CBD8', 1: '#D98A3D' }[n]};color:#222">N${n} ${esc(DB.conteudo.niveis_vendas.nomes_loja[n])}</span>`;
  function secNiveis() {
    const c = DB.conteudo.niveis_vendas; if (!c) return '<div class="g-topo"><h1>Níveis de venda</h1></div><p>Base de níveis não carregada.</p>';
    const r = niveisCalc(); const escopo = U.escopoDe(DB.usuario, DB.conteudo);
    const lojaOk = (lojaId) => { if (escopo.nivel === 'rede') return true; const l = (DB.conteudo.lojas || []).find(x => x.id === Number(lojaId)); if (escopo.nivel === 'regiao') return !!l && l.regiao_id === escopo.regiao_id; return Number(lojaId) === DB.usuario.loja_id; };
    const lojas = r.lojas.filter(l => lojaOk(l.loja_id)); const vends = r.vendedores.filter(v => lojaOk(v.loja_id));
    const q = NV.busca.toLowerCase(); const vf = vends.filter(v => !q || (v.nome + ' ' + v.loja + ' ' + v.cod).toLowerCase().includes(q)); const lf = lojas.filter(l => !q || (l.nome + ' ' + l.cod).toLowerCase().includes(q));
    const colabs = (G.dados && G.dados.colaboradores) || [];
    const sitCor = (v) => (Niveis.SIT[v.situacao] || {}).cor || '#666';
    const vinculo = (v) => { const cands = colabs.filter(x => x.loja_id === v.loja_id || (v.colaborador_id && x.id === v.colaborador_id)); const atual = v.colaborador_id ? colabs.find(x => x.id === v.colaborador_id) : null; const sug = !atual ? colabs.find(x => Niveis.normNome(x.nome) === v.nomeNorm) : null; return `<select class="nv-vinc" onchange="Gestor.vincular('${esc(String(v.id))}',this.value)"><option value="">${sug ? 'auto: ' + esc(sug.login) : '— sem vínculo —'}</option>${cands.map(x => `<option value="${x.id}" ${atual && atual.id === x.id ? 'selected' : ''}>${esc(x.nome)} (${esc(x.login)})</option>`).join('')}</select>`; };
    return `<div class="g-topo"><div><h1>Níveis de venda</h1><div class="pequeno texto-2">${esc(c.base.rotulo)}${c.base.atualizado_em ? ' · atualizado em ' + esc(fmtData(c.base.atualizado_em)) : ''} · régua: Ouro > ${Niveis.brlK(c.regua_loja.N3)} · Prata ${Niveis.brlK(c.regua_loja.N2)}–${Niveis.brlK(c.regua_loja.N3)} · Bronze abaixo</div></div><div class="botoes">${souCoord() ? `<button class="btn pequeno azul" onclick="Gestor.NV.importando=!Gestor.NV.importando;Gestor.NV.previa=null;Gestor.render()">${NV.importando ? '✕ Fechar importação' : '⬆ Atualizar base do mês'}</button>` : ''}<button class="btn pequeno cinza" onclick="Gestor.exportarNiveisCSV()">⬇ Exportar CSV</button></div></div>
      ${NV.importando && souCoord() ? secNiveisImportar() : ''}
      <div class="kpis">${[3, 2, 1].map(n => `<div class="kpi"><div class="v">${lojas.filter(l => l.nivel === n).length}</div><div class="l">Lojas ${esc(c.nomes_loja[n])}</div></div>`).join('')}${[5, 4, 3, 2, 1].map(n => `<div class="kpi"><div class="v">${vends.filter(v => v.nivel === n).length}</div><div class="l">V${n} ${esc(c.nomes_vendedor[n])}</div></div>`).join('')}<div class="kpi"><div class="v" style="color:var(--vermelho)">${vends.filter(v => v.situacao === 'ATRASADO').length}</div><div class="l">Atrasados na curva</div></div><div class="kpi"><div class="v">${vends.filter(v => v.muda).length + lojas.filter(l => l.muda).length}</div><div class="l">Mudam de nível (régua out/26)</div></div></div>
      <div class="filtros"><div class="abas" style="margin:0">${[['vendedores', 'Vendedores'], ['lojas', 'Lojas']].map(([k, l]) => `<button class="${NV.aba === k ? 'ativa' : ''}" onclick="Gestor.NV.aba='${k}';Gestor.render()">${l}</button>`).join('')}</div><div class="campo"><label>Buscar</label><input placeholder="nome, loja ou código" value="${esc(NV.busca)}" onchange="Gestor.NV.busca=this.value;Gestor.render()"></div></div>
      ${NV.aba === 'lojas' ? `<div class="tabela-wrap"><table class="tabela"><thead><tr><th>#</th><th>Loja</th><th>Região</th><th>Méd. 90 dias</th><th>Nível</th><th>Mudança (régua out/26)</th><th>Para o próximo nível</th><th>Vendedores</th></tr></thead><tbody>${lf.map(l => `<tr><td>${l.pos}</td><td><b>${esc(l.cod)} · ${esc(l.nome)}</b></td><td>${esc(regiaoNome(l.regiao_id))}</td><td>${Niveis.brl(l.med90)}</td><td>${nvLoja(l.nivel)}</td><td>${l.muda ? `<span style="color:${l.muda > 0 ? 'var(--verde)' : 'var(--vermelho)'}">${l.muda > 0 ? '▲ sobe' : '▼ cai'} N${l.nivelAnt} → N${l.nivel}</span>` : 'mantém'}</td><td>${l.proximoMin ? 'faltam ' + Niveis.brl(l.proximoMin - l.med90) : 'topo'}</td><td>${vends.filter(v => v.loja_id === l.loja_id).length}</td></tr>`).join('') || '<tr><td colspan="8" class="centro texto-3">Nenhuma loja.</td></tr>'}</tbody></table></div>`
        : `<div class="tabela-wrap"><table class="tabela"><thead><tr><th>#</th><th>Vendedor</th><th>Loja</th><th>Méd. 90 dias</th><th>Nível</th><th>Faixa</th><th>Próximo nível</th><th>Admissão</th><th>Situação na curva</th><th>Prazo</th><th>Ganho máx./mês</th>${souCoord() ? '<th>Vínculo no app</th>' : ''}</tr></thead><tbody>${vf.map(v => `<tr class="${v.situacao === 'ATRASADO' ? 'nv-atraso' : ''}"><td>${v.pos}</td><td><b>${esc(v.nome)}</b>${v.muda ? `<div class="mini" style="color:${v.muda > 0 ? 'var(--verde)' : 'var(--vermelho)'}">${v.muda > 0 ? '▲' : '▼'} V${v.nivelAnt} → V${v.nivel} (régua out/26)</div>` : ''}</td><td>${esc(v.cod)} · ${esc(v.loja)}<div class="mini texto-3">${nvLoja(v.nivelLoja)}</div></td><td>${Niveis.brl(v.med90)}</td><td>${nvBadge(v.nivel)} ${esc(v.rotulo)}</td><td class="mini">${esc(v.faixa)}</td><td>${v.nivel < 5 ? 'faltam ' + Niveis.brl(v.falta) + ' p/ V' + (v.nivel + 1) : 'topo'}</td><td>${v.admissao ? fmtData(v.admissao) + '<div class="mini texto-3">' + esc(v.tempoCasa) + '</div>' : '—'}</td><td><span class="etiqueta mini" style="background:${sitCor(v)}1a;color:${sitCor(v)}">${esc((Niveis.SIT[v.situacao] || {}).rotulo || v.situacao)}</span></td><td class="mini">${esc(v.prazoTexto || '—')}${v.vencido ? ' <b style="color:var(--vermelho)">⚠</b>' : ''}</td><td>${Niveis.brl(v.ganhos.max)}</td>${souCoord() ? `<td>${vinculo(v)}</td>` : ''}</tr>`).join('') || '<tr><td colspan="12" class="centro texto-3">Nenhum vendedor.</td></tr>'}</tbody></table></div>
      <p class="mini texto-3" style="margin-top:8px">${souCoord() ? 'Vínculo no app: por padrão o vendedor é reconhecido pelo nome do relatório; use o seletor quando o nome no cadastro for diferente. ' : ''}O vendedor só vê a própria linha; gerente vê a loja; supervisor a região.</p>`}`;
  }
  function secNiveisImportar() {
    const p = NV.previa;
    return `<div class="card"><h3>⬆ Atualizar a base do mês</h3><p class="pequeno texto-2">Cole aqui as linhas do export (com cabeçalho). Aceita duas tabelas, uma de cada vez ou juntas: <b>lojas</b> (colunas <span class="codigo">loja</span> = código da filial e <span class="codigo">med 90 dias</span>) e <b>vendedores</b> (<span class="codigo">loja</span>, <span class="codigo">vendedor</span>, <span class="codigo">med 90 dias</span>, <span class="codigo">admissao</span>). Separador por ponto-e-vírgula, tab ou vírgula — ou o JSON do painel de níveis. Os níveis são calculados aqui pela régua vigente; os vínculos com o app são mantidos.</p>
      <div class="filtros"><div class="campo"><label>Mês-base (ex.: 2026-10)</label><input id="nv-mes" value="${esc(NV.mes != null ? NV.mes : (DB.conteudo.niveis_vendas.base.mes || '').slice(0, 7))}" placeholder="2026-10" oninput="Gestor.NV.mes=this.value"></div><div class="campo"><label>Rótulo (aparece para a equipe)</label><input id="nv-rotulo" value="${esc(NV.rotulo != null ? NV.rotulo : (DB.conteudo.niveis_vendas.base.rotulo || ''))}" placeholder="base outubro/2026" oninput="Gestor.NV.rotulo=this.value"></div></div>
      <div class="campo"><label>Dados colados</label><textarea id="nv-texto" style="min-height:160px;font-family:ui-monospace,monospace;font-size:.8rem" placeholder="loja;vendedor;med 90 dias;admissao\n007;MARIA SILVA;73875,48;14/05/2026\n..." oninput="Gestor.NV.texto=this.value">${esc(NV.texto || '')}</textarea></div>
      <div class="botoes"><button class="btn azul" onclick="Gestor.niveisPrevia()">Conferir</button>${p && !p.erro ? `<button class="btn verde" onclick="Gestor.niveisSalvar()">Salvar base do mês</button>` : ''}</div>
      ${p ? (p.erro ? `<div class="card erro mt-2"><b>Não deu para ler:</b> ${esc(p.erro)}</div>` : `<div class="card info mt-2"><b>Prévia:</b> ${p.lojas.length} loja(s) e ${p.vendedores.length} vendedor(es) lidos${p.lojasFaltando.length ? ` · <span style="color:var(--vermelho)">códigos de loja desconhecidos: ${p.lojasFaltando.join(', ')}</span>` : ''}${p.semAdm ? ` · ${p.semAdm} vendedor(es) sem data de admissão` : ''}.${p.vendedores.length && !p.lojas.length ? ' <b>Atenção:</b> só vendedores — as lojas atuais serão mantidas.' : ''}${p.lojas.length && !p.vendedores.length ? ' <b>Atenção:</b> só lojas — os vendedores atuais serão mantidos.' : ''}<div class="mini texto-3 mt-1">${p.vendedores.slice(0, 5).map(v => esc(v.nome) + ' (' + Niveis.cod(v.loja_id) + ', ' + Niveis.brl(v.med90) + ')').join(' · ')}${p.vendedores.length > 5 ? ' …' : ''}</div></div>`) : ''}</div>`;
  }
  function niveisPrevia() {
    NV.texto = $('#nv-texto').value; NV.mes = $('#nv-mes').value; NV.rotulo = $('#nv-rotulo').value;
    try {
      const d = Niveis.importar(NV.texto); const ids = new Set((DB.conteudo.lojas || []).map(l => Number(l.id)));
      const faltando = [...new Set(d.lojas.concat(d.vendedores).map(x => x.loja_id).filter(id => !ids.has(id)))].map(Niveis.cod);
      NV.previa = { ...d, lojasFaltando: faltando, semAdm: d.vendedores.filter(v => !v.admissao).length };
    } catch (e) { NV.previa = { erro: e.message }; }
    render();
  }
  async function niveisSalvar() {
    const p = NV.previa; if (!p || p.erro) return;
    const lojas = p.lojas.length ? p.lojas : (DB.conteudo.niveis_lojas || []); const vendedores = p.vendedores.length ? p.vendedores : (DB.conteudo.niveis_vendedores || []);
    const mes = ($('#nv-mes') || {}).value || NV.mes || ''; const rotulo = ($('#nv-rotulo') || {}).value || NV.rotulo || ('base ' + mes);
    try { await DB.gestor.salvarNiveis({ lojas, vendedores, mes_base: mes, rotulo }); await DB.recarregarConteudo(true); NV.importando = false; NV.previa = null; NV.texto = ''; NV.mes = null; NV.rotulo = null; render(); toast('Base de níveis atualizada ✔'); } catch (e) { toast(e.message); }
  }
  async function vincular(vendId, colaboradorId) { try { await DB.gestor.vincularVendedor(vendId, colaboradorId || null); await DB.recarregarConteudo(true); toast(colaboradorId ? 'Vínculo salvo ✔' : 'Vínculo removido'); } catch (e) { toast(e.message); } }
  function exportarNiveisCSV() {
    const r = niveisCalc(); const cols = ['pos', 'nome', 'cod', 'loja', 'med90', 'nivel', 'rotulo', 'faixa', 'admissao', 'tempoCasa', 'situacao', 'prazoTexto'];
    const linhas = [cols.join(';')].concat(r.vendedores.map(v => cols.map(k => '"' + String(v[k] == null ? '' : v[k]).replace(/"/g, '""') + '"').join(';')));
    const blob = new Blob(['\ufeff' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mentor-st-pro-niveis.csv'; a.click();
  }

  /* ───────────── Dúvidas ───────────── */
  function secDuvidas() {
    const chat = G.dados.chat || []; const contagem = {};
    const STOP = new Set('a o os as um uma de do da dos das em no na para com sem que e ou se ao como qual quando onde isso essa esse eu meu minha tinta parede pode posso fazer devo tem'.split(' '));
    for (const c of chat) for (const w of String(c.pergunta).toLowerCase().split(/[^a-zà-ú0-9]+/)) if (w.length > 3 && !STOP.has(w)) contagem[w] = (contagem[w] || 0) + 1;
    const top = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 15);
    const nome = (id) => { const c = (G.dados.colaboradores || []).find(x => x.id === id); return c ? c.nome : '—'; };
    return `<div class="g-topo"><h1>Dúvidas do Assessor</h1></div><p class="pequeno texto-2">O que os colaboradores perguntam ao chat. Use para descobrir o que ensinar na próxima reunião e para enriquecer a base de conhecimento.</p>
      ${top.length ? `<div class="card"><b>Temas mais perguntados:</b> <div class="chips mt-1">${top.map(([w, n]) => `<span class="chip">${esc(w)} · ${n}</span>`).join('')}</div></div>` : ''}
      <div class="tabela-wrap"><table class="tabela"><thead><tr><th>Quando</th><th>Colaborador</th><th>Pergunta</th><th>Origem</th></tr></thead><tbody>${chat.slice(0, 200).map(c => `<tr><td>${fmtDataHora(c.criado_em)}</td><td>${esc(nome(c.colaborador_id))}</td><td>${esc(c.pergunta)}</td><td>${esc(c.origem || '')}</td></tr>`).join('') || '<tr><td colspan="4" class="centro texto-3">Nenhuma pergunta ainda.</td></tr>'}</tbody></table></div>`;
  }

  /* ───────────── Configurações ───────────── */
  function secConfig() {
    const c = DB.conteudo.config; const xp = DB.conteudo.regras_xp;
    return `<div class="g-topo"><h1>Configurações</h1></div>
      <form class="card" onsubmit="Gestor.salvarConfig(event)"><h3>Acesso e avaliação</h3>
      <div class="grade-2"><div class="campo"><label>Código de cadastro (libera novos colaboradores)</label><input name="codigo_cadastro" value="${esc(c.codigo_cadastro)}" required></div><div class="campo"><label>Nota mínima de aprovação (0 a 10)</label><input name="nota_aprovacao" type="number" step="0.5" min="0" max="10" value="${esc(c.nota_aprovacao)}"></div><div class="campo"><label>Questões na avaliação final</label><input name="questoes_avaliacao_final" type="number" min="5" max="60" value="${esc(c.questoes_avaliacao_final)}"></div><div class="campo"><label>Mentor padrão (texto na Jornada)</label><input name="mentor_padrao" value="${esc(c.mentor_padrao)}"></div><div class="campo"><label>Contato para suporte / senha</label><input name="contato_suporte" value="${esc(c.contato_suporte)}"></div><div class="campo"><label>Slogan</label><input name="slogan" value="${esc(c.slogan)}"></div></div>
      <div class="campo"><label>Mensagem de boas-vindas (tela inicial)</label><textarea name="mensagem_boas_vindas">${esc(c.mensagem_boas_vindas)}</textarea></div>
      <h3 class="mt-2">Pontos (ST) por atividade</h3><div class="grade-3">${Object.keys(xp).map(k => `<div class="campo"><label>${esc(REGRAS_XP_LABELS[k] || k)}</label><input name="xp_${k}" type="number" min="0" value="${xp[k]}"></div>`).join('')}</div>
      <button class="btn verde" type="submit">Salvar configurações</button></form>
      ${DB.mode === 'demo' ? '<div class="card alerta pequeno">🧪 Na demonstração as configurações ficam só neste navegador.</div>' : ''}`;
  }
  async function salvarConfig(ev) {
    ev.preventDefault(); const f = ev.target; const cfg = {}; const xp = {};
    for (const k of ['codigo_cadastro', 'nota_aprovacao', 'questoes_avaliacao_final', 'mentor_padrao', 'contato_suporte', 'slogan', 'mensagem_boas_vindas']) cfg[k] = f[k].value;
    for (const k of Object.keys(DB.conteudo.regras_xp)) xp[k] = Number(f['xp_' + k].value);
    try {
      if (DB.mode === 'supabase') { await DB.gestor.supabase.gestorSalvarConfig(cfg); for (const k of Object.keys(xp)) await DB.gestor.supabase.gestorUpsert('regras_xp', { chave: k, xp: xp[k] }); }
      else { await DB.gestor.demo.gestorSalvarConfig(cfg); await DB.gestor.demo.gestorSalvarConteudo('regras_xp', xp); }
      await DB.recarregarConteudo(true); render(); toast('Configurações salvas ✔');
    } catch (e) { toast(e.message); }
  }

  /* ───────────── Ajuda ───────────── */
  function secAjuda() {
    return `<div class="g-topo"><h1>Ajuda rápida</h1></div>
      <div class="card"><h3>Como um colaborador novo entra</h3><ol class="pequeno"><li>Ele abre o link do app no celular (pode "Adicionar à tela inicial" — vira um app).</li><li>Toca em <b>Primeiro acesso</b>, informa nome, login do sistema, loja, cargo, senha e o <b>código de cadastro</b> (${esc(DB.conteudo.config.codigo_cadastro)}) — ou você libera o login dele antes em <b>Colaboradores</b>.</li><li>Pronto: ele já ganha ST pela presença do dia e começa a trilha.</li></ol></div>
      <div class="card"><h3>Níveis de acesso (quem vê o quê)</h3><p class="pequeno"><b>Colaborador</b> vê só o próprio painel (Perfil, no app). <b>Gerente</b> vê a equipe da própria loja. <b>Supervisor</b> vê as lojas da sua região. <b>Coordenador</b> vê a rede inteira e é o único que edita conteúdo, cadastros e configurações. Gerentes e supervisores acompanham a equipe tanto no app (aba <b>Equipe</b>) quanto aqui no painel (entram com o mesmo login e veem só o seu recorte). O nível é definido no pré-cadastro (Colaboradores) ou depois, clicando no colaborador na Visão geral. As regiões e a região de cada loja ficam em <b>Conteúdo → Regiões / Lojas</b>.</p></div>
      <div class="card"><h3>Como funciona a gamificação</h3><p class="pequeno">Cada aula, vídeo, quiz, tarefa da jornada, DISC, história e valores valem ST (ajustável em Configurações). Os níveis são: ${DB.conteudo.niveis.map(n => `${n.emoji} ${esc(n.nome)} (${n.xp_min} ST)`).join(' → ')}. As conquistas desbloqueiam sozinhas pelas regras cadastradas. Não há ranking público entre colaboradores — cada um vê só o próprio progresso; você vê tudo aqui.</p></div>
      <div class="card"><h3>Como adicionar um treinamento novo</h3><ol class="pequeno"><li>Salve as páginas do guia como JPG numeradas (p001.jpg, p002.jpg…) em <span class="codigo">assets/material/m09/</span> (largura ~800 px).</li><li>Em <b>Conteúdo → Módulos</b> crie o módulo m09.</li><li>Em <b>Aulas</b>, crie as aulas apontando as páginas e escrevendo o resumo (HTML simples).</li><li>Em <b>Questões</b>, cadastre o quiz (marque "entra na avaliação final").</li><li>Opcional: em <b>Base de conhecimento</b>, resuma o guia para o Assessor responder sobre ele.</li></ol></div>
      <div class="card"><h3>Assessor com IA</h3><p class="pequeno">O chat do Assessor funciona sempre com a base de conhecimento local. Para ativar a IA (respostas personalizadas), publique a função <span class="codigo">mentor</span> no Supabase com a chave da API (veja o GUIA-DE-INSTALACAO.md). Sem a função, o app continua funcionando normalmente.</p></div>
      <div class="card"><h3>Instalação completa</h3><p class="pequeno">Supabase (banco) + GitHub Pages (site) + config.js. O passo a passo está no arquivo <b>GUIA-DE-INSTALACAO.md</b> da pasta do app.</p></div>`;
  }

  /* ───────────── utilidades ───────────── */
  function modal(html) { fecharModal(); const m = document.createElement('div'); m.className = 'modal-fundo'; m.id = 'modal'; m.innerHTML = html; m.addEventListener('click', e => { if (e.target === m) fecharModal(); }); document.body.appendChild(m); }
  function fecharModal() { const m = $('#modal'); if (m) m.remove(); }
  function toast(msg) { let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.style.bottom = '24px'; document.body.appendChild(t); } t.textContent = msg; requestAnimationFrame(() => t.classList.add('visivel')); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('visivel'), 2500); }
  async function recarregar() { await carregar(); render(); toast('Atualizado'); }
  async function sair() { await DB.sair(); location.reload(); }

  global.Gestor = { popularDemo, NV, niveisPrevia, niveisSalvar, vincular, exportarNiveisCSV, G, ir, render, entrar, sair, detalhe, alterarPerfil, ativar, remover, redefinirSenha, redefinirSenhaOk, exportarCSV, salvarPre, removerPre, editar, salvar, excluir, salvarConfig, fecharModal, recarregar };
  document.addEventListener('DOMContentLoaded', init);
})(window);
