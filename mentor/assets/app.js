/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO — App do colaborador (núcleo + telas principais)
   Telas do Assessor em app-assessor.js · DISC em app-disc.js
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtData = (iso) => { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('pt-BR'); };
  const fmtNum = (n, dec = 1) => Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  const App = {
    user: null, cont: null, prog: null, rota: { view: 'inicio', params: [] }, cache: {},

    /* ───────────── inicialização ───────────── */
    async init() {
      const root = $('#app');
      root.innerHTML = '<div class="tela centro" style="padding-top:40vh"><div class="texto-3">Carregando o MENTOR ST PRO…</div></div>';
      try {
        await DB.init(false);
      } catch (e) {
        root.innerHTML = `<div class="tela"><div class="card erro"><h3>Não foi possível carregar</h3><p>${esc(e.message)}</p><button class="btn" onclick="location.reload()">Tentar de novo</button></div></div>`;
        return;
      }
      App.cont = DB.conteudo; App.user = DB.usuario;
      window.addEventListener('hashchange', () => { const v = document.getElementById('visor'); if (v) v.remove(); App.navegar(); });
      if (App.user) await App.aoEntrar(true); else App.navegar();
      if ('serviceWorker' in navigator && location.protocol.startsWith('http')) { try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {} }
    },

    async aoEntrar(silencioso) {
      try {
        App.prog = await DB.progresso();
        const r = await DB.registrarAcesso();
        if (r && (r.xp_ganho || (r.novas_conquistas && r.novas_conquistas.length))) { App.prog = await DB.progresso(); if (!silencioso || r.primeiro_acesso_hoje) App.celebrar(r, r.primeiro_acesso_hoje ? 'Bom te ver por aqui! Presença do dia registrada.' : null); }
      } catch (e) { console.warn(e); App.prog = App.prog || { itens: [], xp_total: 0, eventos: [], conquistas: [], tentativas: [], streak: 0, estado: Gamificacao.resumirEstado([], App.cont) }; }
      if (!location.hash || location.hash === '#/login') location.hash = '#/inicio'; else App.navegar();
    },

    async atualizarProgresso() { App.prog = await DB.progresso(); return App.prog; },

    /* ───────────── roteador ───────────── */
    navegar() {
      const h = (location.hash || '#/inicio').replace(/^#\/?/, '');
      const partes = h.split('/').filter(Boolean);
      App.rota = { view: partes[0] || 'inicio', params: partes.slice(1) };
      if (!App.user && App.rota.view !== 'login') { App.rota = { view: 'login', params: [] }; }
      App.render();
    },
    ir(hash) { location.hash = hash; },

    render() {
      const root = $('#app');
      const v = App.rota.view;
      const fn = App.views[v] || App.views.inicio;
      try {
        const html = fn(App.rota.params);
        root.innerHTML = html + (App.user && v !== 'login' ? App.navInferior(v) : '');
        window.scrollTo(0, 0);
        if (App.posRender) { const f = App.posRender; App.posRender = null; f(); }
      } catch (e) {
        console.error(e);
        root.innerHTML = `<div class="tela"><div class="card erro"><h3>Ops, algo deu errado nesta tela</h3><p class="pequeno">${esc(e.message)}</p><button class="btn" onclick="location.hash='#/inicio'">Voltar ao início</button></div></div>`;
      }
    },

    navInferior(v) {
      const lider = DB.util.ehLider(App.user); // gerente, supervisor e coordenador ganham a aba Equipe
      const itens = [['inicio', '🏠', 'Início'], ['trilha', '🎓', 'Trilha'], ['assessor', '🧰', 'Assessor'], ['videos', '🎬', 'Vídeos']].concat(lider ? [['equipe', '📊', 'Equipe']] : []).concat([['perfil', '🏅', 'Perfil']]);
      const ativo = (k) => (v === k || (k === 'trilha' && ['modulo', 'aula', 'quiz', 'final', 'certificado'].includes(v)) || (k === 'assessor' && v === 'assessor') || (k === 'perfil' && ['disc', 'conquistas', 'evolucao'].includes(v)) || (k === 'videos' && v === 'video') || (k === 'inicio' && ['historia', 'valores', 'jornada', 'organograma'].includes(v)));
      return `<nav class="nav-inferior nao-imprimir ${lider ? 'seis' : ''}">${itens.map(([k, i, l]) => `<button class="${ativo(k) ? 'ativo' : ''}" onclick="location.hash='#/${k}'"><span class="ico">${i}</span>${l}</button>`).join('')}</nav>`;
    },

    cabecalho(titulo, sub, opts) {
      opts = opts || {};
      const voltar = opts.voltar ? `<button class="btn-voltar" onclick="${opts.voltar === true ? 'history.back()' : `location.hash='${opts.voltar}'`}">‹</button>` : '<span></span>';
      return `<header class="cabecalho ${opts.cor || ''}"><div class="cabecalho-topo">${voltar}<div class="logo-st"><span class="marca">SÓ TINTAS</span></div></div><h1>${titulo}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}${opts.extra || ''}</header>`;
    },

    /* ───────────── feedback (toast, celebração) ───────────── */
    toast(msg, classe) {
      let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
      t.className = 'toast ' + (classe || ''); t.innerHTML = msg; cancelAnimationFrame(App._toastRaf); App._toastRaf = requestAnimationFrame(() => t.classList.add('visivel'));
      clearTimeout(App._toastT); App._toastT = setTimeout(() => t.classList.remove('visivel'), 2600);
    },
    toastOcultar() { cancelAnimationFrame(App._toastRaf); const t = $('#toast'); if (t) t.classList.remove('visivel'); clearTimeout(App._toastT); },
    celebrar(resultado, mensagem) {
      if (!resultado) return;
      const novas = resultado.novas_conquistas || [];
      const xp = resultado.xp_ganho || 0;
      const nivelAntes = App.cache.nivel || null;
      const nivelAgora = Gamificacao.nivelPorXp(App.prog ? App.prog.xp_total : 0, App.cont.niveis).nivel;
      const subiu = nivelAntes && nivelAgora.n > nivelAntes.n;
      App.cache.nivel = nivelAgora;
      if (xp > 0 && !novas.length && !subiu && !resultado.modulo_concluido) { App.toast(`${mensagem ? mensagem + ' ' : ''}+${xp} ST ⭐`, 'xp'); return; }
      if (xp === 0 && !novas.length && !subiu && !resultado.modulo_concluido) { if (mensagem) App.toast(mensagem); return; }
      const partes = [];
      if (resultado.modulo_concluido && resultado.modulo_concluido.modulo) partes.push(`<div class="card sucesso"><b>Módulo concluído:</b> ${esc(resultado.modulo_concluido.modulo.titulo)} <span class="etiqueta verde">+${resultado.modulo_concluido.xp} ST</span></div>`);
      for (const c of novas) { const cc = typeof c === 'string' ? App.cont.conquistas.find(x => x.id === c) : c; if (cc) partes.push(`<div class="conquista nova" style="display:inline-block;min-width:120px;margin:4px"><span class="emoji">${cc.emoji}</span>${esc(cc.nome)}<div class="mini texto-3">+${cc.xp} ST</div></div>`); }
      App.modal(`<div class="modal celebra"><div class="emoji">${subiu ? nivelAgora.emoji : (novas.length ? '🎉' : '⭐')}</div>
        <h2>${subiu ? 'Você subiu de nível!' : (novas.length ? 'Nova conquista!' : 'Mandou bem!')}</h2>
        ${subiu ? `<p>Agora você é <b>${esc(nivelAgora.nome)}</b> — ${esc(nivelAgora.descricao)}</p>` : ''}
        ${mensagem ? `<p>${esc(mensagem)}</p>` : ''}
        ${xp ? `<div class="xp-pill" style="background:var(--azul-claro);color:var(--azul)">+${xp} ST</div>` : ''}
        <div class="mt-2">${partes.join('')}</div>
        <button class="btn bloco mt-2" onclick="App.fecharModal()">Continuar</button></div>`);
      App.confete();
    },
    confirmar(msg, aoConfirmar, rotulo) {
      App._confirmarCb = aoConfirmar;
      App.modal(`<div class="modal"><h3>${msg}</h3><div class="botoes mt-2"><button class="btn" onclick="App.fecharModal();App._confirmarCb&&App._confirmarCb()">${rotulo || 'Confirmar'}</button><button class="btn cinza" onclick="App.fecharModal()">Cancelar</button></div></div>`);
    },
    modal(html) { App.fecharModal(); const m = document.createElement('div'); m.className = 'modal-fundo'; m.id = 'modal'; m.innerHTML = html; m.addEventListener('click', e => { if (e.target === m) App.fecharModal(); }); document.body.appendChild(m); },
    fecharModal() { const m = $('#modal'); if (m) m.remove(); },
    confete() {
      const c = document.createElement('div'); c.className = 'confete'; const cores = ['#E31E24', '#FFD200', '#1B4DA1', '#1E9E5A', '#F57C00'];
      for (let i = 0; i < 60; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = cores[i % cores.length]; s.style.animationDuration = (1.8 + Math.random() * 1.6) + 's'; s.style.animationDelay = Math.random() * .6 + 's'; s.style.transform = `rotate(${Math.random() * 360}deg)`; c.appendChild(s); }
      document.body.appendChild(c); setTimeout(() => c.remove(), 3800);
    },

    /* ───────────── ações de progresso ───────────── */
    async concluir(tipo, id, mensagem, dados) {
      try {
        const r = await DB.registrarProgresso(tipo, id, dados || {});
        await App.atualizarProgresso();
        if (r && !r.ja_existia) App.celebrar(r, mensagem); else if (r && r.ja_existia) App.toast('Você já tinha concluído este item ✔');
        App.render();
        return r;
      } catch (e) { App.toast('Erro ao salvar: ' + e.message); }
    },

    /* ───────────── utilidades de progresso ───────────── */
    feito(tipo, id) { return !!(App.prog && App.prog.itens.some(i => i.item_tipo === tipo && i.item_id === id)); },
    nivelInfo() { return Gamificacao.nivelPorXp(App.prog ? App.prog.xp_total : 0, App.cont.niveis); },
    progressoModulo(m) {
      const aulas = App.cont.aulas.filter(a => a.modulo_id === m.id).sort((a, b) => a.ordem - b.ordem);
      const feitas = aulas.filter(a => App.feito('aula', a.id)).length;
      const quiz = App.feito('quiz', m.id);
      const total = aulas.length + 1;
      const pct = Math.round(((feitas + (quiz ? 1 : 0)) / total) * 100);
      return { aulas, feitas, quiz, total, pct, concluido: feitas === aulas.length && quiz };
    },
    progressoTrilha() {
      const mods = App.cont.modulos.filter(m => m.ativo !== false).sort((a, b) => a.ordem - b.ordem);
      const detalhes = mods.map(m => ({ m, p: App.progressoModulo(m) }));
      const concluidos = detalhes.filter(d => d.p.concluido).length;
      const pct = mods.length ? Math.round(detalhes.reduce((s, d) => s + d.p.pct, 0) / mods.length) : 0;
      return { mods, detalhes, concluidos, pct, todos: concluidos === mods.length && mods.length > 0 };
    },
    proximoPasso() {
      const t = App.progressoTrilha();
      for (const d of t.detalhes) {
        const a = d.p.aulas.find(x => !App.feito('aula', x.id));
        if (a) return { titulo: a.titulo, sub: d.m.titulo, hash: `#/aula/${a.id}`, icone: d.m.icone };
        if (!d.p.quiz) return { titulo: 'Quiz: ' + d.m.titulo, sub: 'Prove o que aprendeu', hash: `#/quiz/${d.m.id}`, icone: '📝' };
      }
      if (!App.feito('final', 'FINAL')) return { titulo: 'Avaliação final', sub: 'Conquiste seu certificado', hash: '#/final', icone: '🏆' };
      return null;
    },

    /* sequência de dias estudando: chama que cresce, últimos 7 dias e o próximo marco */
    cardSequencia(p) {
      const set = new Set(p.dias || []), s = p.streak || 0;
      const dia = (k) => { const d = new Date(); d.setDate(d.getDate() - k); return d.toISOString().slice(0, 10); };
      const fezHoje = set.has(dia(0));
      const nomes = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
      const bolas = [6, 5, 4, 3, 2, 1, 0].map(k => { const d = new Date(); d.setDate(d.getDate() - k); const on = set.has(dia(k));
        return `<span class="seq-dia ${on ? 'on' : ''} ${k === 0 ? 'hoje' : ''}" title="${dia(k).split('-').reverse().join('/')}"><i>${on ? '🔥' : ''}</i><b>${k === 0 ? 'hoje' : nomes[d.getDay()]}</b></span>`; }).join('');
      const marcos = [3, 7, 14, 30, 60, 100], prox = marcos.find(m => m > s) || (s + 30);
      const tam = Math.min(2.6, 1.3 + s * 0.08);
      const msg = !s ? 'Estude hoje para acender a sua chama.'
        : fezHoje ? `Chama acesa hoje! Volte amanhã para chegar a <b>${s + 1} dias</b>.`
        : `Estude hoje para não apagar: são <b>${s} dia${s === 1 ? '' : 's'}</b> seguidos.`;
      if (window.STAnima && marcos.includes(s) && fezHoje) setTimeout(() => STAnima.comemorarUmaVez('mentor-seq-' + s + '-' + dia(0), () => { STAnima.confete(); STAnima.faixa(`🔥 ${s} dias seguidos! Isso é constância de campeão.`, '#E30613'); }), 600);
      return `<div class="card seq-card"><div class="linha" style="gap:14px"><span class="seq-chama ${s ? 'viva' : ''}" style="font-size:${tam}rem">🔥</span>
        <div class="cresce"><div class="negrito">${s} dia${s === 1 ? '' : 's'} seguido${s === 1 ? '' : 's'} estudando</div><div class="pequeno texto-2">${msg}</div>
        <div class="pequeno texto-2" style="margin-top:2px">Próximo marco: <b>${prox} dias</b> · faltam ${Math.max(0, prox - s)}</div></div></div>
        <div class="seq-semana">${bolas}</div></div>`;
    },
    anel(pct, texto, sub) {
      const r = 38, c = 2 * Math.PI * r; const v = Math.max(0, Math.min(100, pct));
      return `<div class="anel"><svg width="92" height="92" viewBox="0 0 92 92"><circle class="anel-fundo" cx="46" cy="46" r="${r}"/><circle class="anel-valor" cx="46" cy="46" r="${r}" stroke-dasharray="${(c * v / 100).toFixed(1)} ${c.toFixed(1)}"/></svg><div class="anel-texto">${texto}<small>${sub || ''}</small></div></div>`;
    },

    views: {},
  };

  /* ═════════════════════════ LOGIN / CADASTRO ═════════════════════════ */
  App.views.login = () => {
    const demo = DB.mode === 'demo';
    const lojas = App.cont.lojas.filter(l => l.ativa !== false).sort((a, b) => a.id - b.id);
    App.posRender = () => {
      const aba = App.cache.abaLogin || 'entrar';
      $$('.login-abas button').forEach(b => b.classList.toggle('ativa', b.dataset.aba === aba));
      $('#form-entrar').classList.toggle('oculto', aba !== 'entrar'); $('#form-cadastro').classList.toggle('oculto', aba !== 'cadastro');
    };
    return `<div class="login-tela">
      <div class="login-topo"><div class="logo-st" style="justify-content:center"><span class="marca" style="font-size:1.1rem">SÓ TINTAS</span></div>
        <div class="titulo-app">MENTOR <span>ST</span> PRO</div><div style="opacity:.9">${esc(App.cont.config.slogan)}</div></div>
      <div class="login-corpo">
        ${demo ? ((window.SOTINTAS_CONFIG || {}).DEMO_PUBLICA ? `<div class="aviso-demo">🧪 <b>Demonstração</b> — seus dados ficam só neste navegador. Crie um acesso com qualquer login e use o código <b>${esc(App.cont.config.codigo_cadastro)}</b>. O primeiro cadastro vira gestor (painel em "Perfil").</div>` : `<div class="aviso-demo">🧪 <b>Modo demonstração</b> — os dados ficam só neste navegador. Para ativar o banco real, preencha o <span class="codigo">config.js</span> (veja o guia de instalação). Código de cadastro da demo: <b>${esc(App.cont.config.codigo_cadastro)}</b>. O primeiro cadastro vira gestor.</div>`) : ''}
        <div class="login-abas"><button data-aba="entrar" onclick="App.cache.abaLogin='entrar';App.render()">Entrar</button><button data-aba="cadastro" onclick="App.cache.abaLogin='cadastro';App.render()">Primeiro acesso</button></div>
        <form id="form-entrar" onsubmit="App.entrar(event)">
          <div class="campo"><label>Login do sistema</label><input name="login" autocomplete="username" placeholder="ex.: joao.silva" required></div>
          <div class="campo"><label>Senha</label><input name="senha" type="password" autocomplete="current-password" placeholder="Sua senha" required></div>
          <div id="erro-entrar" class="msg-erro oculto"></div>
          <button class="btn bloco" type="submit">Entrar</button>
          <p class="pequeno texto-3 centro mt-2">Esqueceu a senha? ${esc(App.cont.config.contato_suporte)}.</p>
        </form>
        <form id="form-cadastro" class="oculto" onsubmit="App.cadastrar(event)">
          <div class="campo"><label>Nome completo</label><input name="nome" placeholder="Como está no crachá" required></div>
          <div class="campo"><label>Login do sistema</label><input name="login" autocomplete="username" placeholder="o mesmo login que você usa na loja" required><div class="ajuda">Letras, números, ponto ou traço.</div></div>
          <div class="campo"><label>Loja</label><select name="loja_id" required>${lojas.map(l => `<option value="${l.id}">${esc(DB.util.lojaRotulo(l))}</option>`).join('')}</select></div>
          <div class="campo"><label>Cargo</label><select name="cargo"><option>Vendedor(a)</option><option>Auxiliar de Loja</option><option>Assistente Comercial / Op. de Caixa</option><option>Gerente</option><option>Supervisor(a)</option><option>Outro</option></select></div>
          <div class="campo"><label>Senha</label><input name="senha" type="password" autocomplete="new-password" minlength="6" placeholder="mínimo 6 caracteres" required></div>
          <div class="campo"><label>Código de cadastro</label><input name="codigo" placeholder="Peça ao seu gestor" style="text-transform:uppercase"><div class="ajuda">Se o gestor já liberou o seu login, pode deixar em branco.</div></div>
          <div id="erro-cadastro" class="msg-erro oculto"></div>
          <button class="btn bloco" type="submit">Criar meu acesso</button>
        </form>
      </div></div>`;
  };
  App.entrar = async (ev) => {
    ev.preventDefault(); const f = ev.target; const btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Entrando…';
    try { await DB.entrar(f.login.value, f.senha.value); App.user = DB.usuario; App.cache.nivel = null; await App.aoEntrar(false); }
    catch (e) { const el = $('#erro-entrar'); el.textContent = e.message; el.classList.remove('oculto'); btn.disabled = false; btn.textContent = 'Entrar'; }
  };
  App.cadastrar = async (ev) => {
    ev.preventDefault(); const f = ev.target; const btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Criando…';
    try {
      await DB.cadastrar({ login: f.login.value, nome: f.nome.value, loja_id: f.loja_id.value, cargo: f.cargo.value, senha: f.senha.value, codigo: f.codigo.value });
      App.user = DB.usuario; App.cache.nivel = null; await App.aoEntrar(false);
    } catch (e) { const el = $('#erro-cadastro'); el.textContent = e.message; el.classList.remove('oculto'); btn.disabled = false; btn.textContent = 'Criar meu acesso'; }
  };
  App.sair = async () => { await DB.sair(); App.user = null; App.prog = null; App.cache = {}; App.rota = { view: 'login', params: [] }; location.hash = '#/login'; App.render(); };

  /* ═════════════════════════ INÍCIO ═════════════════════════ */
  App.views.inicio = () => {
    const u = App.user, p = App.prog, cfg = App.cont.config;
    const ni = App.nivelInfo(); App.cache.nivel = App.cache.nivel || ni.nivel;
    const trilha = App.progressoTrilha();
    const prox = App.proximoPasso();
    const primeiroNome = (u.nome || '').split(' ')[0];
    const hora = new Date().getHours(); const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    const conqs = App.cont.conquistas.length, obtidas = (p.conquistas || []).length;
    const jornadaFeitas = App.cont.jornada.filter(t => App.feito('tarefa', t.id)).length;
    const extra = `<div class="linha mt-2" style="gap:14px">${App.anel(ni.pct, `${ni.nivel.emoji}`, `Nível ${ni.nivel.n}`)}<div class="cresce"><div class="negrito" style="font-size:1.05rem">${esc(ni.nivel.nome)}</div><div class="pequeno" style="opacity:.9">${ni.proximo ? `Faltam <b>${ni.faltam} ST</b> para ${esc(ni.proximo.nome)}` : 'Nível máximo alcançado!'}</div><div class="linha mt-1" style="gap:8px"><span class="xp-pill">⭐ ${p.xp_total} ST</span><span class="xp-pill">🔥 ${p.streak} dia${p.streak === 1 ? '' : 's'}</span></div></div></div>`;
    return App.cabecalho(`${saud}, ${esc(primeiroNome)}!`, `${esc(u.loja)} · ${esc(u.cargo || '')}`, { extra }) + `<div class="tela">
      ${prox ? `<div class="card destaque clicavel" onclick="location.hash='${prox.hash}'"><div class="etiqueta amarela">Continuar de onde parou</div><div class="linha mt-1"><span class="icone-grande amarelo">${prox.icone}</span><div class="cresce"><div class="negrito">${esc(prox.titulo)}</div><div class="pequeno texto-2">${esc(prox.sub)}</div></div><span class="seta">›</span></div></div>`
        : `<div class="card sucesso"><div class="linha"><span class="icone-grande verde">🏆</span><div><div class="negrito">Trilha e avaliação concluídas!</div><div class="pequeno">Você é um Campeão Só Tintas. Veja seu certificado no Perfil.</div></div></div></div>`}
      ${App.cardSequencia(p)}
      ${DB.util.ehLider(u) ? (() => { const e = DB.util.escopoDe(u, App.cont); return `<div class="card info clicavel" onclick="location.hash='#/equipe'"><div class="linha"><span class="icone-grande azul">📊</span><div class="cresce"><div class="negrito">Painel da equipe</div><div class="pequeno texto-2">${esc(e.rotulo)} · ${e.nivel === 'rede' ? 'regiões, lojas e colaboradores' : e.nivel === 'regiao' ? 'lojas e colaboradores da sua região' : 'colaboradores da sua loja'}</div></div><span class="seta">›</span></div></div>`; })() : ''}
      <div class="card clicavel" onclick="location.hash='#/trilha'"><div class="linha entre"><div class="card-titulo" style="margin:0"><span class="icone-grande vermelho">🎓</span><div><h3>Trilha de treinamento</h3><div class="pequeno texto-2">${trilha.concluidos} de ${trilha.mods.length} módulos concluídos</div></div></div><b>${trilha.pct}%</b></div><div class="barra mt-1"><span style="width:${trilha.pct}%"></span></div></div>
      <div class="grade-2">
        <div class="card clicavel" onclick="location.hash='#/historia'" style="margin:0"><span class="icone-grande vermelho">📜</span><div class="negrito mt-1">Nossa História</div><div class="mini texto-3">${App.feito('historia', 'HISTORIA') ? '✔ concluída' : '+' + App.cont.regras_xp.historia + ' ST'}</div></div>
        <div class="card clicavel" onclick="location.hash='#/organograma'" style="margin:0"><span class="icone-grande azul">🏢</span><div class="negrito mt-1">Organograma</div><div class="mini texto-3">Diretorias e áreas</div></div>
        <div class="card clicavel" onclick="location.hash='#/valores'" style="margin:0"><span class="icone-grande azul">🌈</span><div class="negrito mt-1">Propósito & Valores</div><div class="mini texto-3">${App.feito('valores', 'VALORES') ? '✔ concluído' : '+' + App.cont.regras_xp.valores + ' ST'}</div></div>
        <div class="card clicavel" onclick="location.hash='#/jornada'" style="margin:0"><span class="icone-grande verde">🗺️</span><div class="negrito mt-1">Jornada dos 30 dias</div><div class="mini texto-3">${jornadaFeitas}/${App.cont.jornada.length} tarefas</div></div>
        <div class="card clicavel" onclick="location.hash='#/assessor'" style="margin:0"><span class="icone-grande amarelo">🧰</span><div class="negrito mt-1">Assessor ST</div><div class="mini texto-3">Calculadora, especificador, diagnóstico e chat</div></div>
        <div class="card clicavel" onclick="location.hash='#/disc'" style="margin:0"><span class="icone-grande laranja">🧭</span><div class="negrito mt-1">Meu perfil DISC</div><div class="mini texto-3">${p.disc ? '✔ ' + esc(p.disc.dominante) : '+' + App.cont.regras_xp.disc + ' ST'}</div></div>
        <div class="card clicavel" onclick="location.hash='#/conquistas'" style="margin:0"><span class="icone-grande cinza">🏅</span><div class="negrito mt-1">Conquistas</div><div class="mini texto-3">${obtidas}/${conqs} desbloqueadas</div></div>
        ${App.niveis ? (() => { const v = App.niveis.meu(); return `<div class="card clicavel" onclick="location.hash='#/evolucao'" style="margin:0"><span class="icone-grande amarelo">📈</span><div class="negrito mt-1">Minha evolução</div><div class="mini texto-3">${v ? `V${v.nivel} ${esc(v.rotulo)} · ${v.nivel < 5 ? 'faltam ' + Niveis.brlK(v.falta) + ' p/ V' + (v.nivel + 1) : 'topo'}` : 'Níveis V1→V5 e ganhos'}</div></div>`; })() : ''}
      </div>
      <div class="card mt-2 ${trilha.todos ? 'destaque' : ''} clicavel" onclick="location.hash='#/final'"><div class="linha"><span class="icone-grande ${trilha.todos ? 'amarelo' : 'cinza'}">${App.feito('final', 'FINAL') ? '🏆' : (trilha.todos ? '📝' : '🔒')}</span><div class="cresce"><div class="negrito">Avaliação final</div><div class="pequeno texto-2">${App.feito('final', 'FINAL') ? 'Aprovado! Certificado disponível.' : (trilha.todos ? 'Liberada — nota mínima ' + fmtNum(cfg.nota_aprovacao) : 'Conclua todos os módulos para liberar')}</div></div><span class="seta">›</span></div></div>
      <p class="pequeno texto-3 centro mt-2">${esc(cfg.mensagem_boas_vindas)}</p>
    </div>`;
  };

  /* ═════════════════════════ HISTÓRIA / VALORES ═════════════════════════ */
  App.views.historia = () => {
    const feito = App.feito('historia', 'HISTORIA');
    const itens = [...App.cont.historia].sort((a, b) => a.ordem - b.ordem);
    const fundadores = 'assets/historia/fundadores.jpg';
    const ehMascote = (h) => /h05|mascote|rocky/i.test(h.imagem || '') || /^49/.test(String(h.ano || ''));
    return App.cabecalho('Nossa História', '49 anos de coragem e propósito — de 1977 a 33 lojas em 22 municípios do Rio', { voltar: '#/inicio' }) + `<div class="tela">
      <div class="hist-hero" onclick="App.verFoto('${fundadores}','Carlos Pinheiro e Paulo Borba — cofundadores da Só Tintas · 1º de abril de 1977')"><img src="${fundadores}" alt="Carlos Pinheiro e Paulo Borba"><div class="hist-hero-texto"><div class="mini org-eyebrow" style="color:#FFD200">Cofundadores · 1º de abril de 1977</div><div class="negrito">Carlos Pinheiro e Paulo Borba</div><div class="mini" style="opacity:.9">Dois homens que tiveram a coragem de começar — e nos ensinaram que trabalho, honestidade e fé constroem legados.</div></div></div>
      <div class="hist-stats"><div><b>49</b><span>anos</span></div><div><b>33</b><span>lojas</span></div><div><b>22</b><span>municípios</span></div><div><b>+1.000</b><span>colaboradores</span></div></div>
      <div class="timeline">${itens.map((h, i) => `<div class="tl-item" style="animation-delay:${i * 70}ms"><div class="tl-ano"><span>${esc(h.ano)}</span></div><div class="card tl-card ${ehMascote(h) ? 'mascote' : ''}">${h.imagem ? (ehMascote(h) ? `<img class="tl-mascote" src="${esc(h.imagem)}" alt="">` : `<div class="tl-foto" onclick="App.verFoto('${esc(h.imagem)}','${esc(h.ano)} · ${esc(h.titulo)}')"><img src="${esc(h.imagem)}" alt="${esc(h.titulo)}" loading="lazy"><span class="tl-lupa">🔍</span></div>`) : ''}<div class="tl-corpo"><h3>${esc(h.titulo)}</h3><p class="pequeno" style="margin:0">${esc(h.descricao)}</p></div></div></div>`).join('')}</div>
      ${App.cont.organograma ? `<div class="card clicavel" onclick="location.hash='#/organograma'"><div class="linha"><span class="icone-grande azul">🏢</span><div class="cresce"><div class="negrito">Organograma</div><div class="pequeno texto-2">Quem cuida de cada área da Só Tintas</div></div><span class="seta">›</span></div></div>` : ''}
      ${feito ? '<div class="card sucesso centro">✔ Você já conhece a nossa história. Obrigado por fazer parte dela!</div>' : `<button class="btn bloco verde" onclick="App.concluir('historia','HISTORIA','Agora você conhece a nossa história!')">Li e conheço a história · +${App.cont.regras_xp.historia} ST</button>`}
      <p class="mini texto-3 centro mt-2">Fotos: acervo Só Tintas · Bootcamp 2026</p>
    </div>`;
  };
  App.verFoto = (src, legenda) => App.modal(`<div class="modal" style="padding:10px"><img src="${esc(src)}" alt="" style="width:100%;max-height:70vh;object-fit:contain;border-radius:12px;background:#111"><div class="pequeno mt-1 centro">${esc(legenda || '')}</div><div class="botoes mt-1"><button class="btn cinza" onclick="App.fecharModal()">Fechar</button></div></div>`);
  /* ═════════════════════════ ORGANOGRAMA (interativo) ═════════════════════════ */
  const ORG_ICONES = { 'rh': '👥', 'auditoria': '🔎', 'marketing': '📣', 'comercial': '🛒', 'lojas': '🏪', 'atendimento on line': '💬', 'atacado': '📦', 'digital': '💻', 'financeiro': '💰', 'juridico': '⚖️', 'logistica': '🚚', 'compras': '🧾', 'ti': '🖥️' };
  const ORG_CORES = ['vermelho', 'azul', 'amarelo', 'verde', 'laranja'];
  const orgNorm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const orgIcone = (nome) => ORG_ICONES[orgNorm(nome)] || '🏢';
  const orgIniciais = (nome) => String(nome || '').split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
  App.org = {
    escolher(i) { App.cache.orgSel = i; App.cache.orgTodas = false; App.render(); },
    todas() { App.cache.orgTodas = !App.cache.orgTodas; App.render(); },
  };
  App.views.organograma = () => {
    const o = App.cont.organograma || { diretorias: [] }; const dirs = o.diretorias || [];
    const u = App.user || {}; const lojas = App.cont.lojas || []; const regioes = App.cont.regioes || [];
    const minhaLoja = lojas.find(l => l.id === u.loja_id); const minhaRegiao = minhaLoja && regioes.find(r => r.id === minhaLoja.regiao_id);
    // onde o colaborador está: a sub-área "Lojas" (Comercial) — procura pelo nome
    const ehAqui = (nome) => orgNorm(nome) === 'lojas';
    const idxAqui = dirs.findIndex(d => (d.areas || []).some(a => (a.sub || []).some(ehAqui)));
    if (App.cache.orgSel == null) App.cache.orgSel = idxAqui >= 0 ? idxAqui : 0;
    const sel = Math.min(App.cache.orgSel, Math.max(0, dirs.length - 1)); const todas = !!App.cache.orgTodas;
    const totalAreas = dirs.reduce((s, d) => s + (d.areas || []).length + (d.areas || []).reduce((t, a) => t + (a.sub || []).length, 0), 0);
    const painel = (d, i) => `<section class="org-painel ${ORG_CORES[i % ORG_CORES.length]}" ${todas ? '' : 'id="org-painel"'}>
        <header class="org-painel-topo"><span class="org-avatar">${esc(orgIniciais(d.nome))}</span><div class="cresce"><div class="mini org-eyebrow">${esc(d.cargo || 'Diretoria')}</div><div class="negrito">${esc(d.nome)}</div></div><span class="etiqueta cinza mini">${(d.areas || []).length} área${(d.areas || []).length === 1 ? '' : 's'}</span></header>
        <div class="org-lista">${(d.areas || []).map((a, k) => `<div class="org-item" style="animation-delay:${k * 45}ms"><div class="org-item-linha"><span class="org-ico">${orgIcone(a.nome)}</span><span class="org-nome">${esc(a.nome)}</span>${a.sub ? `<span class="mini texto-3">${a.sub.length} frentes</span>` : ''}</div>
            ${a.sub ? `<div class="org-subs">${a.sub.map(x => `<div class="org-sub-item ${ehAqui(x) ? 'aqui' : ''}"><span class="org-ico pequeno">${orgIcone(x)}</span><span class="cresce">${esc(x)}</span>${ehAqui(x) ? '<span class="org-voce">você está aqui</span>' : ''}</div>${ehAqui(x) && regioes.length ? `<div class="org-rede"><div class="mini org-eyebrow">Supervisão · ${regioes.length} regiões · ${lojas.length} lojas</div><div class="org-regioes">${regioes.map(r => `<span class="org-chip ${minhaRegiao && minhaRegiao.id === r.id ? 'minha' : ''}">${esc(r.nome)}<small>${lojas.filter(l => l.regiao_id === r.id).length} lojas</small></span>`).join('')}</div>${minhaLoja ? `<div class="org-minha">🏪 Sua loja: <b>${esc(DB.util.lojaRotulo(minhaLoja))}</b>${minhaRegiao ? ` · ${esc(minhaRegiao.nome)}` : ''}</div>` : ''}</div>` : ''}`).join('')}</div>` : ''}</div>`).join('')}</div></section>`;
    const extra = `<div class="org-trilha mt-1"><span>Diretoria</span><i>›</i><span>Áreas</span><i>›</i><span>Frentes</span><i>›</i><span class="forte">Você</span></div>`;
    return App.cabecalho(o.titulo || 'Organograma', o.subtitulo || 'Como a Só Tintas se organiza', { voltar: '#/historia', cor: 'escuro', extra }) + `<div class="tela">
      <div class="org-arvore">
        <div class="org-raiz"><span class="org-raiz-marca">SÓ TINTAS</span><small>Diretoria executiva</small></div>
        <div class="org-trilho" style="--n:${dirs.length};--sel:${todas ? -1 : sel}"></div>
        <div class="org-diretores" style="grid-template-columns:repeat(${dirs.length}, minmax(0, 1fr))">${dirs.map((d, i) => `<button class="org-diretor ${ORG_CORES[i % ORG_CORES.length]} ${!todas && i === sel ? 'sel' : ''}" onclick="App.org.escolher(${i})" aria-pressed="${!todas && i === sel}"><span class="org-avatar">${esc(orgIniciais(d.nome))}</span><span class="org-dir-nome">${esc(d.nome)}</span><span class="org-dir-sub">${(d.areas || []).length} áreas${idxAqui === i ? ' · você' : ''}</span></button>`).join('')}</div>
        <p class="mini texto-3 centro org-dica">${todas ? 'Mostrando as três diretorias.' : 'Toque em uma diretoria para ver as áreas dela.'} <button class="btn link mini" onclick="App.org.todas()">${todas ? 'Ver uma por vez' : 'Ver todas de uma vez'}</button></p>
      </div>
      ${todas ? dirs.map(painel).join('') : (dirs[sel] ? painel(dirs[sel], sel) : '')}
      <div class="card info pequeno">${dirs.length} diretorias · ${totalAreas} áreas e frentes · ${lojas.length} lojas em ${regioes.length} regiões. Cada diretoria responde pelas áreas abaixo dela; na loja, você está em <b>Comercial → Lojas</b>, e a Supervisão e os Gerentes são a ponte entre a loja e a diretoria.</div>
      <p class="mini texto-3 centro">Fonte: Bootcamp Só Tintas 2026 · Colorindo Vidas e Realizando Sonhos</p>
    </div>`;
  };
  App.views.valores = () => {
    const feito = App.feito('valores', 'VALORES');
    const v = [...App.cont.valores].sort((a, b) => a.ordem - b.ordem);
    const bloco = (tipo) => v.filter(x => x.tipo === tipo);
    const card = (x) => `<div class="card valor-card"><span class="icone-grande ${x.tipo === 'valor' ? 'amarelo' : 'azul'}">${x.icone || '⭐'}</span><div><h3>${esc(x.titulo)}</h3><p class="pequeno" style="margin:0">${esc(x.descricao)}</p></div></div>`;
    return App.cabecalho('Propósito & Valores', 'O que nos move todos os dias', { voltar: '#/inicio', cor: 'azul' }) + `<div class="tela">
      ${bloco('proposito').map(x => `<div class="mantra" style="font-size:1.2rem;text-align:center">${esc(x.descricao)}</div>`).join('')}
      ${bloco('missao').map(card).join('')}${bloco('visao').map(card).join('')}
      <h2 class="mt-2">Nossos valores</h2>${bloco('valor').map(card).join('')}
      <h2 class="mt-2">Mantras</h2>${bloco('mantra').map(x => `<div class="mantra">${esc(x.descricao)}</div>`).join('')}
      ${bloco('nao_permitimos').length ? `<h2 class="mt-2">O que NÃO permitimos na Só Tintas</h2><div class="card erro nao-permitimos"><p class="pequeno" style="margin:0 0 8px">Aqui não tem exceção, não tem "foi só uma vez" e não tem cargo que proteja. Se você vir ou sofrer, fale com seu gerente, supervisor ou com o RH.</p>${bloco('nao_permitimos').map(x => `<div class="np-item"><span class="np-ico">${x.icone || '🚫'}</span><div><b>${esc(x.titulo)}</b><div class="mini">${esc(x.descricao)}</div></div></div>`).join('')}</div>` : ''}
      ${feito ? '<div class="card sucesso centro mt-2">✔ Valores conhecidos. Agora é viver cada um deles na loja!</div>' : `<button class="btn bloco verde mt-2" onclick="App.concluir('valores','VALORES','Você conhece nossos valores!')">Li e me comprometo · +${App.cont.regras_xp.valores} ST</button>`}
    </div>`;
  };

  /* ═════════════════════════ JORNADA DOS 30 DIAS ═════════════════════════ */
  App.views.jornada = () => {
    const tarefas = [...App.cont.jornada].sort((a, b) => (a.semana - b.semana) || (a.ordem - b.ordem));
    const semanas = [...new Set(tarefas.map(t => t.semana))];
    const feitas = tarefas.filter(t => App.feito('tarefa', t.id)).length;
    const nomes = { 1: 'Semana 1 — Chegada', 2: 'Semana 2 — Produto e loja', 3: 'Semana 3 — Atendimento', 4: 'Semana 4 — Autonomia' };
    return App.cabecalho('Jornada dos 30 dias', `Com o seu mentor: ${esc(App.cont.config.mentor_padrao)}`, { voltar: '#/inicio', cor: 'verde' }) + `<div class="tela">
      <div class="card"><div class="linha entre"><b>${feitas} de ${tarefas.length} tarefas</b><span>${Math.round(feitas / tarefas.length * 100)}%</span></div><div class="barra verde mt-1"><span style="width:${feitas / tarefas.length * 100}%"></span></div><p class="pequeno texto-2 mt-1" style="margin:0">Marque cada tarefa quando fizer com o seu mentor. Cada uma vale ST — e a jornada completa, uma conquista.</p></div>
      ${semanas.map(s => `<h2 class="mt-2">${nomes[s] || 'Semana ' + s}</h2>${tarefas.filter(t => t.semana === s).map(t => { const ok = App.feito('tarefa', t.id); return `<label class="caixa-opcao ${ok ? 'ativa' : ''}"><input type="checkbox" ${ok ? 'checked disabled' : ''} onchange="App.concluir('tarefa','${t.id}','Tarefa concluída!')"><div class="cresce"><div class="negrito pequeno">${esc(t.titulo)}</div><div class="mini texto-3">${esc(t.descricao)}</div></div><span class="etiqueta ${ok ? 'verde' : ''}">${ok ? '✔' : '+' + (t.xp || App.cont.regras_xp.tarefa)}</span></label>`; }).join('')}`).join('')}
    </div>`;
  };

  /* ═════════════════════════ TRILHA / MÓDULO / AULA ═════════════════════════ */
  App.views.trilha = () => {
    const t = App.progressoTrilha();
    return App.cabecalho('Trilha de treinamento', `${t.concluidos} de ${t.mods.length} módulos · ${t.pct}% concluído`) + `<div class="tela">
      ${t.detalhes.map((d, i) => `<div class="item-lista ${d.p.concluido ? 'feito' : (d.p.pct > 0 ? 'atual' : '')}" onclick="location.hash='#/modulo/${d.m.id}'"><span class="num">${d.p.concluido ? '✔' : i + 1}</span><div class="cresce"><div class="titulo">${d.m.icone} ${esc(d.m.titulo)}</div><div class="desc">${d.p.aulas.length} aulas · quiz · ${d.m.paginas} páginas do guia</div><div class="barra fina mt-1 ${d.p.concluido ? 'verde' : ''}"><span style="width:${d.p.pct}%"></span></div></div><span class="seta">›</span></div>`).join('')}
      <div class="card mt-2 ${t.todos ? 'destaque' : ''} clicavel" onclick="location.hash='#/final'"><div class="linha"><span class="icone-grande ${t.todos ? 'amarelo' : 'cinza'}">${t.todos ? '🏆' : '🔒'}</span><div class="cresce"><div class="negrito">Avaliação final</div><div class="pequeno texto-2">${t.todos ? 'Liberada! ' + App.cont.config.questoes_avaliacao_final + ' questões sorteadas de todos os módulos.' : 'Conclua todos os módulos para liberar.'}</div></div></div></div>
    </div>`;
  };

  App.views.modulo = ([id]) => {
    const m = App.cont.modulos.find(x => x.id === id); if (!m) return App.views.trilha();
    const p = App.progressoModulo(m);
    const tent = (App.prog.tentativas || []).filter(t => t.modulo_id === m.id);
    const melhor = tent.length ? Math.max(...tent.map(t => Number(t.nota))) : null;
    return App.cabecalho(m.titulo, m.subtitulo, { voltar: '#/trilha', cor: m.cor === 'verde' ? 'verde' : m.cor === 'azul' ? 'azul' : m.cor === 'amarelo' ? 'amarelo' : m.cor === 'cinza' ? 'escuro' : '' }) + `<div class="tela">
      <div class="card"><p class="pequeno" style="margin:0 0 8px">${esc(m.descricao)}</p><div class="linha entre pequeno"><span>📘 ${esc(m.fonte)}</span><b>${p.pct}%</b></div><div class="barra mt-1"><span style="width:${p.pct}%"></span></div>${m.pdf && !(window.SOTINTAS_CONFIG && window.SOTINTAS_CONFIG.DEMO_PUBLICA) ? `<a class="btn mini contorno mt-1" href="${esc(m.pdf)}" target="_blank" rel="noopener" download>📄 Baixar o guia em PDF (${m.paginas} pág.)</a>` : ''}</div>
      ${p.aulas.map((a, i) => { const ok = App.feito('aula', a.id); return `<div class="item-lista ${ok ? 'feito' : ''}" onclick="location.hash='#/aula/${a.id}'"><span class="num">${ok ? '✔' : i + 1}</span><div class="cresce"><div class="titulo">${esc(a.titulo)}</div><div class="desc">${a.duracao_min} min · páginas ${a.pagina_inicial}–${a.pagina_final} · +${a.xp || App.cont.regras_xp.aula} ST</div></div><span class="seta">›</span></div>`; }).join('')}
      <div class="item-lista ${p.quiz ? 'feito' : (p.feitas === p.aulas.length ? 'atual' : 'bloqueado')}" onclick="${p.feitas === p.aulas.length ? `location.hash='#/quiz/${m.id}'` : `App.toast('Conclua todas as aulas para liberar o quiz')`}"><span class="num">${p.quiz ? '✔' : '📝'}</span><div class="cresce"><div class="titulo">Quiz do módulo</div><div class="desc">${App.cont.questoes.filter(q => q.modulo_id === m.id).length} questões · nota mínima ${fmtNum(App.cont.config.nota_aprovacao)} · +${App.cont.regras_xp.quiz_aprovado} ST${melhor != null ? ` · melhor nota: <b>${fmtNum(melhor)}</b>` : ''}</div></div><span class="seta">›</span></div>
      ${p.concluido ? `<div class="card sucesso centro">🏅 Módulo concluído! Bônus de ${m.xp_bonus} ST recebido.</div>` : ''}
      ${App.ck ? App.ck.cardModulo(m.id) : ''}
    </div>`;
  };

  App.views.aula = ([id]) => {
    const a = App.cont.aulas.find(x => x.id === id); if (!a) return App.views.trilha();
    const m = App.cont.modulos.find(x => x.id === a.modulo_id);
    const aulas = App.cont.aulas.filter(x => x.modulo_id === m.id).sort((x, y) => x.ordem - y.ordem);
    const idx = aulas.findIndex(x => x.id === a.id); const prox = aulas[idx + 1];
    const feito = App.feito('aula', a.id);
    const paginas = a.paginas || [];
    App.cache.paginasAtuais = paginas;
    return App.cabecalho(a.titulo, `${m.icone} ${esc(m.titulo)} · aula ${a.ordem} de ${aulas.length}`, { voltar: `#/modulo/${m.id}` }) + `<div class="tela">
      ${paginas.length ? `<h3 class="mb-1">📘 Páginas do guia (${a.pagina_inicial}–${a.pagina_final})</h3><div class="paginas-guia">${paginas.map((p, i) => `<img src="${p}" loading="lazy" alt="Página ${a.pagina_inicial + i}" onclick="App.abrirVisor(${i})">`).join('')}<div style="flex-shrink:0;width:8px"></div></div><p class="mini texto-3">Deslize para ver as páginas · toque para ampliar</p>` : ''}
      <div class="card aula-conteudo">${a.conteudo}</div>
      ${feito ? `<div class="card sucesso centro">✔ Aula concluída</div>` : `<button class="btn bloco verde" onclick="App.concluir('aula','${a.id}','Aula concluída!')">Concluir aula · +${a.xp || App.cont.regras_xp.aula} ST</button>`}
      <div class="botoes mt-2">${idx > 0 ? `<button class="btn contorno" onclick="location.hash='#/aula/${aulas[idx - 1].id}'">‹ Anterior</button>` : ''}${prox ? `<button class="btn azul" onclick="location.hash='#/aula/${prox.id}'">Próxima aula ›</button>` : `<button class="btn amarelo" onclick="location.hash='#/quiz/${m.id}'">Ir para o quiz ›</button>`}</div>
    </div>`;
  };
  App.abrirVisor = (i) => {
    const pags = App.cache.paginasAtuais || []; if (!pags.length) return;
    const render = (k) => { const v = $('#visor'); v.querySelector('.visor-corpo').innerHTML = `<img src="${pags[k]}" alt="">`; v.querySelector('.visor-pos').textContent = `${k + 1} / ${pags.length}`; v.dataset.k = k; };
    const v = document.createElement('div'); v.className = 'visor'; v.id = 'visor';
    v.innerHTML = `<div class="visor-topo"><span class="visor-pos"></span><div><button class="btn mini cinza" onclick="App.visorNav(-1)">‹</button> <button class="btn mini cinza" onclick="App.visorNav(1)">›</button> <button class="btn mini" onclick="document.getElementById('visor').remove()">Fechar ✕</button></div></div><div class="visor-corpo"></div>`;
    document.body.appendChild(v); render(i);
    App.visorNav = (d) => { const k = Math.max(0, Math.min(pags.length - 1, Number(v.dataset.k) + d)); render(k); };
  };

  /* ═════════════════════════ QUIZ / AVALIAÇÃO FINAL ═════════════════════════ */
  function montarQuiz(questoes, titulo, sub, onEnviar, opts) {
    opts = opts || {};
    const st = App.cache.quiz = App.cache.quiz && App.cache.quiz.chave === opts.chave ? App.cache.quiz : { chave: opts.chave, i: 0, resp: {}, resultado: null, questoes };
    const q = st.questoes[st.i]; const n = st.questoes.length;
    if (st.resultado) return renderResultado(st, titulo, sub, opts);
    const respondidas = Object.keys(st.resp).length;
    return App.cabecalho(titulo, sub, { voltar: opts.voltar, cor: 'azul' }) + `<div class="tela">
      <div class="linha entre pequeno texto-2 mb-1"><span>Questão ${st.i + 1} de ${n}</span><span>${respondidas} respondida${respondidas === 1 ? '' : 's'}</span></div><div class="barra azul fina mb-2"><span style="width:${(respondidas / n) * 100}%"></span></div>
      <div class="card"><div class="quiz-pergunta">${esc(q.enunciado)}</div>${q.opcoes.map((o, k) => `<div class="quiz-opcao ${st.resp[q.id] === k ? 'sel' : ''}" onclick="App.quizResponder('${q.id}',${k})"><span class="letra">${'ABCD'[k]}</span><span>${esc(o)}</span></div>`).join('')}</div>
      <div class="botoes">${st.i > 0 ? `<button class="btn contorno" onclick="App.quizIr(-1)">‹ Anterior</button>` : ''}${st.i < n - 1 ? `<button class="btn azul" onclick="App.quizIr(1)">Próxima ›</button>` : `<button class="btn verde" ${respondidas < n ? 'disabled' : ''} onclick="App.quizEnviar()">Enviar respostas ✔</button>`}</div>
      ${respondidas < n && st.i === n - 1 ? '<p class="pequeno texto-3 centro mt-1">Responda todas as questões para enviar.</p>' : ''}
    </div>`;
  }
  function renderResultado(st, titulo, sub, opts) {
    const r = st.resultado; const aprovado = r.aprovado; const nota = Number(r.nota);
    const mapa = {}; (r.detalhes || []).forEach(d => mapa[d.questao_id] = d);
    return App.cabecalho(titulo, sub, { voltar: opts.voltar, cor: aprovado ? 'verde' : '' }) + `<div class="tela">
      <div class="card centro ${aprovado ? 'sucesso' : 'erro'}"><div class="nota-grande">${fmtNum(nota)}</div><div class="negrito">${aprovado ? '🎉 Aprovado!' : '😕 Ainda não foi dessa vez'}</div><div class="pequeno texto-2">${r.acertos} de ${r.total} acertos · nota mínima ${fmtNum(App.cont.config.nota_aprovacao)}${r.xp_ganho ? ` · <b>+${r.xp_ganho} ST</b>` : ''}</div></div>
      ${aprovado && opts.aprovadoHtml ? opts.aprovadoHtml : ''}
      <h3 class="mt-2">Gabarito comentado</h3>
      ${st.questoes.map((q, i) => { const d = mapa[q.id] || {}; const certa = d.certa; return `<div class="card"><div class="pequeno negrito mb-1">${i + 1}. ${esc(q.enunciado)}</div>${q.opcoes.map((o, k) => { let cls = 'desab'; if (k === d.correta) cls += ' certa'; else if (k === d.escolhida && !certa) cls += ' errada'; return `<div class="quiz-opcao ${cls}"><span class="letra">${'ABCD'[k]}</span><span class="pequeno">${esc(o)}</span></div>`; }).join('')}${d.explicacao ? `<div class="dica-box pequeno">${esc(d.explicacao)}</div>` : ''}</div>`; }).join('')}
      <div class="botoes mt-2">${!aprovado ? `<button class="btn" onclick="App.quizReiniciar()">Tentar de novo</button>` : ''}<button class="btn contorno" onclick="location.hash='${opts.voltar || '#/trilha'}'">Voltar</button></div>
    </div>`;
  }
  App.quizResponder = (qid, k) => { App.cache.quiz.resp[qid] = k; const st = App.cache.quiz; if (st.i < st.questoes.length - 1) { st.i++; } App.render(); };
  App.quizIr = (d) => { const st = App.cache.quiz; st.i = Math.max(0, Math.min(st.questoes.length - 1, st.i + d)); App.render(); };
  App.quizReiniciar = () => { const st = App.cache.quiz; st.i = 0; st.resp = {}; st.resultado = null; if (st.final) st.questoes = sortearFinal(); App.render(); };
  App.quizEnviar = async () => {
    const st = App.cache.quiz; App.toast('Corrigindo…');
    try {
      const r = st.final ? await DB.enviarFinal(st.resp) : await DB.enviarQuiz(st.moduloId, st.resp);
      st.resultado = r; await App.atualizarProgresso(); App.toastOcultar(); App.render();
      if (r.aprovado) setTimeout(() => App.celebrar(r, st.final ? 'Você é um Campeão Só Tintas!' : 'Quiz aprovado!'), 300);
    } catch (e) { App.toast('Erro ao enviar: ' + e.message); }
  };
  App.views.quiz = ([moduloId]) => {
    const m = App.cont.modulos.find(x => x.id === moduloId); if (!m) return App.views.trilha();
    const questoes = App.cont.questoes.filter(q => q.modulo_id === m.id).sort((a, b) => a.ordem - b.ordem);
    if (!questoes.length) return App.cabecalho('Quiz', m.titulo, { voltar: `#/modulo/${m.id}` }) + '<div class="tela"><div class="card">Este módulo ainda não tem questões cadastradas. O gestor pode adicionar pelo painel.</div></div>';
    const chave = 'quiz:' + m.id;
    if (!App.cache.quiz || App.cache.quiz.chave !== chave) App.cache.quiz = { chave, i: 0, resp: {}, resultado: null, questoes, moduloId: m.id, final: false };
    return montarQuiz(questoes, 'Quiz: ' + m.titulo, `${questoes.length} questões · nota mínima ${fmtNum(App.cont.config.nota_aprovacao)}`, null, { chave, voltar: `#/modulo/${m.id}` });
  };
  function sortearFinal() {
    const pool = App.cont.questoes.filter(q => q.final !== false);
    const n = Math.min(Number(App.cont.config.questoes_avaliacao_final) || 20, pool.length);
    const porModulo = {}; pool.forEach(q => (porModulo[q.modulo_id] = porModulo[q.modulo_id] || []).push(q));
    const mods = Object.keys(porModulo); const escolhidas = [];
    // distribui as questões entre os módulos, embaralhando
    const emb = (arr) => arr.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    const filas = mods.map(k => emb(porModulo[k])); let g = 0;
    while (escolhidas.length < n) { const f = filas[g % filas.length]; if (f.length) escolhidas.push(f.shift()); g++; if (filas.every(x => !x.length)) break; }
    return emb(escolhidas);
  }
  App.views.final = () => {
    const t = App.progressoTrilha();
    if (App.feito('final', 'FINAL') && !(App.cache.quiz && App.cache.quiz.final && App.cache.quiz.resultado)) {
      const fin = App.prog.itens.find(i => i.item_tipo === 'final');
      return App.cabecalho('Avaliação final', 'Concluída', { voltar: '#/trilha', cor: 'verde' }) + `<div class="tela"><div class="card sucesso centro"><div class="nota-grande">${fmtNum(fin.nota)}</div><div class="negrito">🏆 Aprovado em ${fmtData(fin.concluido_em)}</div></div><button class="btn bloco amarelo" onclick="location.hash='#/certificado'">Ver meu certificado</button><button class="btn bloco contorno mt-1" onclick="App.cache.quiz=null;App.cache.refazerFinal=true;App.render()">Refazer para melhorar a nota</button></div>`;
    }
    if (!t.todos && !App.cache.refazerFinal) return App.cabecalho('Avaliação final', 'Ainda bloqueada', { voltar: '#/trilha' }) + `<div class="tela"><div class="card alerta"><h3>🔒 Conclua a trilha primeiro</h3><p class="pequeno">Faltam ${t.mods.length - t.concluidos} módulo(s). A avaliação final sorteia ${App.cont.config.questoes_avaliacao_final} questões de todos os guias.</p><button class="btn" onclick="location.hash='#/trilha'">Ir para a trilha</button></div></div>`;
    const chave = 'final';
    if (!App.cache.quiz || App.cache.quiz.chave !== chave) App.cache.quiz = { chave, i: 0, resp: {}, resultado: null, questoes: sortearFinal(), final: true };
    const html = montarQuiz(App.cache.quiz.questoes, 'Avaliação final', `${App.cache.quiz.questoes.length} questões · nota mínima ${fmtNum(App.cont.config.nota_aprovacao)}`, null, { chave, voltar: '#/trilha', aprovadoHtml: `<button class="btn bloco amarelo" onclick="location.hash='#/certificado'">🏆 Ver meu certificado</button>` });
    return html;
  };

  /* ═════════════════════════ CERTIFICADO ═════════════════════════ */
  App.views.certificado = () => {
    const fin = App.prog.itens.find(i => i.item_tipo === 'final');
    if (!fin) return App.cabecalho('Certificado', '', { voltar: '#/perfil' }) + '<div class="tela"><div class="card alerta">Seja aprovado na avaliação final para gerar seu certificado.</div></div>';
    App.posRender = () => App.desenharCertificado(fin);
    return App.cabecalho('Seu certificado', 'Campeão Só Tintas', { voltar: '#/perfil', cor: 'amarelo' }) + `<div class="tela"><canvas id="cert" class="certificado-prev" width="1600" height="1131" style="display:none"></canvas><img id="cert-img" class="certificado-prev" alt="Certificado">
      <div class="botoes mt-2"><button class="btn" onclick="App.baixarCertificado()">⬇️ Baixar imagem</button><button class="btn verde" onclick="App.compartilharCertificado()">📲 Compartilhar</button></div>
      <p class="pequeno texto-3 centro mt-2">Toque e segure a imagem para salvar no celular. Compartilhe no grupo da loja e marque a Só Tintas!</p></div>`;
  };
  App.desenharCertificado = (fin) => {
    const c = $('#cert'); if (!c) return; const x = c.getContext('2d'); const W = c.width, H = c.height; const u = App.user;
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#E31E24'); g.addColorStop(1, '#B5141A'); x.fillStyle = g; x.fillRect(0, 0, W, 170);
    x.fillStyle = '#FFD200'; x.fillRect(0, 170, W, 14); x.fillStyle = '#1B4DA1'; x.fillRect(0, H - 60, W, 60);
    x.strokeStyle = '#FFD200'; x.lineWidth = 6; x.strokeRect(40, 40, W - 80, H - 80);
    x.fillStyle = '#fff'; x.font = 'bold 54px Poppins, Arial'; x.textAlign = 'center'; x.fillText('SÓ TINTAS · MENTOR ST PRO', W / 2, 105);
    x.font = '26px Poppins, Arial'; x.fillText('Colorindo Vidas e Realizando Sonhos', W / 2, 148);
    x.fillStyle = '#1E2430'; x.font = 'bold 72px Poppins, Arial'; x.fillText('CERTIFICADO', W / 2, 320);
    x.font = '30px Poppins, Arial'; x.fillStyle = '#5B6472'; x.fillText('Certificamos que', W / 2, 400);
    x.fillStyle = '#E31E24'; x.font = 'bold 64px Poppins, Arial'; x.fillText((u.nome || '').toUpperCase(), W / 2, 500);
    x.fillStyle = '#5B6472'; x.font = '30px Poppins, Arial'; x.fillText(`${u.cargo || 'Colaborador(a)'} · Loja ${u.loja}`, W / 2, 560);
    x.fillStyle = '#1E2430'; x.font = '34px Poppins, Arial';
    x.fillText('concluiu a Jornada do Campeão — trilha de integração e', W / 2, 660); x.fillText('treinamento técnico do MENTOR ST PRO — com aprovação', W / 2, 710); x.fillText(`na avaliação final (nota ${fmtNum(fin.nota)}).`, W / 2, 760);
    x.fillStyle = '#1B4DA1'; x.font = 'bold 40px Poppins, Arial'; x.fillText('🏆 CAMPEÃO SÓ TINTAS', W / 2, 860);
    x.fillStyle = '#5B6472'; x.font = '28px Poppins, Arial'; x.fillText(`Rio de Janeiro, ${fmtData(fin.concluido_em)}`, W / 2, 940);
    x.font = '24px Poppins, Arial'; x.fillText('Diretoria Só Tintas · Rafael Borba · Fred Borba · Thiago Borba', W / 2, 1010);
    x.fillStyle = '#fff'; x.font = '22px Poppins, Arial'; x.fillText(`Código: ${(u.login || '').toUpperCase()}-${new Date(fin.concluido_em).getTime().toString(36).toUpperCase()}`, W / 2, H - 22);
    const img = $('#cert-img'); if (img) img.src = c.toDataURL('image/png');
  };
  App.baixarCertificado = () => { const c = $('#cert'); const a = document.createElement('a'); a.download = `certificado-${(App.user.login || 'colaborador')}.png`; a.href = c.toDataURL('image/png'); a.click(); };
  App.compartilharCertificado = async () => {
    const c = $('#cert'); c.toBlob(async (blob) => {
      const file = new File([blob], 'certificado-so-tintas.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Certificado Só Tintas', text: 'Concluí a Jornada do Campeão no MENTOR ST PRO! 🏆' }); } catch (e) {} }
      else { App.baixarCertificado(); App.toast('Imagem baixada — envie no WhatsApp 😉'); }
    });
  };

  /* ═════════════════════════ VÍDEOS ═════════════════════════ */
  function videoId(url) { const m = String(url || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/); return m ? m[1] : null; }
  function driveId(url) { const m = String(url || '').match(/drive\.google\.com\/file\/d\/([^/]+)/); return m ? m[1] : null; }
  App.views.videos = () => {
    const vids = App.cont.videos.filter(v => v.ativo !== false).sort((a, b) => a.ordem - b.ordem);
    const cats = [...new Set(vids.map(v => v.categoria))];
    const assistidos = vids.filter(v => App.feito('video', v.id)).length;
    return App.cabecalho('Videoteca', `${assistidos} de ${vids.length} assistidos`, { cor: 'escuro' }) + `<div class="tela">
      ${cats.map(c => `<h2 class="mt-1">${esc(c)}</h2>${vids.filter(v => v.categoria === c).map(v => { const yid = videoId(v.url); const ok = App.feito('video', v.id); return `<div class="card video-card clicavel" onclick="location.hash='#/video/${v.id}'"><div class="video-thumb">${yid ? `<img src="https://img.youtube.com/vi/${yid}/hqdefault.jpg" alt="">` : ''}<span class="play">${ok ? '✔' : '▶'}</span></div><div class="video-corpo"><div class="negrito">${esc(v.titulo)}</div><div class="pequeno texto-2">${esc(v.descricao)}</div>${!v.url ? '<span class="etiqueta mt-1">Em breve</span>' : ''}</div></div>`; }).join('')}`).join('')}
    </div>`;
  };
  App.views.video = ([id]) => {
    const v = App.cont.videos.find(x => x.id === id); if (!v) return App.views.videos();
    const yid = videoId(v.url), did = driveId(v.url); const ok = App.feito('video', v.id);
    const player = yid ? `<iframe class="video-player" src="https://www.youtube.com/embed/${yid}?rel=0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` : did ? `<iframe class="video-player" src="https://drive.google.com/file/d/${did}/preview" allow="autoplay" allowfullscreen></iframe>` : v.url ? `<video class="video-player" src="${esc(v.url)}" controls></video>` : `<div class="video-thumb" style="border-radius:14px"><div class="centro pequeno">🎬 Vídeo ainda não cadastrado.<br>O gestor adiciona o link pelo painel.</div></div>`;
    return App.cabecalho(v.titulo, v.categoria, { voltar: '#/videos', cor: 'escuro' }) + `<div class="tela">${player}<div class="card mt-2"><p class="pequeno" style="margin:0">${esc(v.descricao)}</p></div>
      ${ok ? '<div class="card sucesso centro">✔ Vídeo assistido</div>' : `<button class="btn bloco verde" ${!v.url ? 'disabled' : ''} onclick="App.concluir('video','${v.id}','Vídeo assistido!')">Assisti até o fim · +${v.xp || App.cont.regras_xp.video} ST</button>`}</div>`;
  };

  /* ═════════════════════════ PERFIL / CONQUISTAS ═════════════════════════ */
  App.views.perfil = () => {
    const u = App.user, p = App.prog; const ni = App.nivelInfo();
    const eventos = (p.eventos || []).slice(0, 12);
    const nomesTipo = { aula: 'Aula', video: 'Vídeo', quiz: 'Quiz aprovado', quiz_nota10: 'Nota 10', modulo: 'Módulo concluído', historia: 'Nossa história', valores: 'Valores', disc: 'DISC', tarefa: 'Tarefa da jornada', final: 'Avaliação final', login_diario: 'Presença do dia', conquista: 'Conquista' };
    const extra = `<div class="linha mt-2" style="gap:14px">${App.anel(ni.pct, ni.nivel.emoji, `Nível ${ni.nivel.n}`)}<div class="cresce"><div class="negrito" style="font-size:1.05rem">${esc(ni.nivel.nome)}</div><div class="pequeno" style="opacity:.9">${ni.proximo ? `${ni.faltam} ST para ${esc(ni.proximo.nome)}` : 'Nível máximo!'}</div><div class="linha mt-1" style="gap:8px"><span class="xp-pill">⭐ ${p.xp_total} ST</span><span class="xp-pill">🔥 ${p.streak}d</span><span class="xp-pill">📅 ${p.dias_ativos || 0} dias</span></div></div></div>`;
    return App.cabecalho(esc(u.nome), `${esc(u.cargo || '')} · ${esc(u.loja)} · login ${esc(u.login)}`, { extra, cor: 'azul' }) + `<div class="tela">
      <div class="grade-3">${App.cont.niveis.map(n => `<div class="conquista ${p.xp_total >= n.xp_min ? '' : 'bloqueada'}"><span class="emoji">${n.emoji}</span>${esc(n.nome)}<div class="mini texto-3">${n.xp_min} ST</div></div>`).join('')}</div>
      ${App.niveis ? (() => { const v = App.niveis.meu(); const c = App.cont.niveis_vendas; return `<div class="card clicavel mt-2 destaque" onclick="location.hash='#/evolucao'"><div class="linha"><span class="icone-grande amarelo">📈</span><div class="cresce"><div class="negrito">Minha evolução${v ? ` · V${v.nivel} ${esc(v.rotulo)}` : ''}</div><div class="pequeno texto-2">${v ? `Loja ${esc(c.nomes_loja[v.nivelLoja])} · ${v.nivel < 5 ? `faltam ${Niveis.brlK(v.falta)} para o V${v.nivel + 1}` : 'topo da carreira'} · ganhe até ${Niveis.brl(v.ganhos.max)}/mês no seu nível` : 'Seu nível de venda, a curva V1→V5 e quanto você pode ganhar'}</div></div><span class="seta">›</span></div></div>`; })() : ''}
      <div class="card clicavel" onclick="location.hash='#/conquistas'"><div class="linha"><span class="icone-grande amarelo">🏅</span><div class="cresce"><div class="negrito">Conquistas</div><div class="pequeno texto-2">${(p.conquistas || []).length} de ${App.cont.conquistas.length}</div></div><span class="seta">›</span></div></div>
      <div class="card clicavel" onclick="location.hash='#/disc'"><div class="linha"><span class="icone-grande laranja">🧭</span><div class="cresce"><div class="negrito">Perfil DISC</div><div class="pequeno texto-2">${p.disc ? `${esc(p.disc.dominante)} (secundário ${esc(p.disc.secundario)})` : 'Faça o teste e descubra seu perfil'}</div></div><span class="seta">›</span></div></div>
      <div class="card clicavel" onclick="location.hash='#/certificado'"><div class="linha"><span class="icone-grande ${App.feito('final', 'FINAL') ? 'verde' : 'cinza'}">🎓</span><div class="cresce"><div class="negrito">Certificado</div><div class="pequeno texto-2">${App.feito('final', 'FINAL') ? 'Disponível para baixar e compartilhar' : 'Seja aprovado na avaliação final'}</div></div><span class="seta">›</span></div></div>
      <h3 class="mt-2">Últimos pontos</h3>
      ${eventos.length ? eventos.map(e => `<div class="linha entre pequeno" style="padding:7px 0;border-bottom:1px solid var(--borda)"><span>${esc(nomesTipo[e.tipo] || e.tipo)} <span class="texto-3">· ${fmtData(e.criado_em)}</span></span><b style="color:var(--verde)">+${e.xp}</b></div>`).join('') : '<p class="pequeno texto-3">Nenhum ponto ainda. Comece pela trilha!</p>'}
      ${DB.util.ehLider(u) ? `<div class="card info mt-3"><div class="negrito">Nível de acesso: ${esc(DB.util.PERFIS[u.perfil] || u.perfil)}</div><div class="pequeno texto-2">${esc(DB.util.escopoDe(u, App.cont).rotulo)}</div><div class="botoes mt-1"><button class="btn azul" onclick="location.hash='#/equipe'">📊 Painel da equipe</button>${DB.util.ehCoordenador(u) ? `<a class="btn contorno azul" href="gestor.html">🛠️ Painel do gestor</a>` : `<a class="btn contorno azul" href="gestor.html">🖥️ Versão para computador</a>`}</div></div>` : ''}
      <button class="btn bloco contorno mt-2" onclick="App.sair()">Sair da conta</button>
      ${DB.mode === 'demo' ? `<button class="btn bloco link mt-1 pequeno" onclick="App.confirmar('Apagar todos os dados da demonstração neste navegador?',()=>{DB.zerarDemo();location.reload();},'Apagar tudo')">Zerar demonstração</button>` : ''}
      <p class="mini texto-3 centro mt-2">MENTOR ST PRO · modo ${DB.mode === 'demo' ? 'demonstração' : 'conectado'}</p>
    </div>`;
  };
  App.views.conquistas = () => {
    const obt = new Set((App.prog.conquistas || []).map(c => c.conquista_id));
    const lista = [...App.cont.conquistas].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    return App.cabecalho('Conquistas', `${obt.size} de ${lista.length} desbloqueadas`, { voltar: '#/perfil', cor: 'amarelo' }) + `<div class="tela"><div class="conquistas-grade">${lista.map(c => `<div class="conquista ${obt.has(c.id) ? '' : 'bloqueada'}" onclick="App.toast('${esc(c.nome)}: ${esc(c.descricao)} (+${c.xp} ST)')"><span class="emoji">${c.emoji}</span>${esc(c.nome)}<div class="mini texto-3">${obt.has(c.id) ? '✔ +' + c.xp + ' ST' : esc(c.descricao)}</div></div>`).join('')}</div></div>`;
  };

  global.App = App;
  global.AppUtil = { $, $$, esc, fmtData, fmtNum };
  document.addEventListener('DOMContentLoaded', () => App.init());
})(window);
