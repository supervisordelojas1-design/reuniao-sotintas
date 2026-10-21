/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO — Camada de dados
   Dois modos, mesma interface:
     • demo     → tudo no navegador (localStorage), sem banco
     • supabase → banco real (auth + tabelas + funções)
   O modo é escolhido sozinho: se config.js ainda tem o endereço
   de exemplo, o app roda em demonstração.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  const CFG = global.SOTINTAS_CONFIG || {};
  const CHAVE_DEMO = 'mentorst_demo_v1';
  const temSupabase = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && !/COLE-AQUI|SEU-PROJETO/i.test(CFG.SUPABASE_URL) && !/COLE-AQUI/i.test(CFG.SUPABASE_ANON_KEY));

  const DB = { mode: temSupabase ? 'supabase' : 'demo', sb: null, conteudo: null, usuario: null };

  /* ───────────────────────────── utilidades ───────────────────────────── */
  const hoje = () => new Date().toISOString().slice(0, 10);
  const agora = () => new Date().toISOString();
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const emailDe = (login) => `${String(login).trim().toLowerCase()}@${CFG.DOMINIO_LOGIN || 'mentor.sotintas.app'}`;
  const normalizarLogin = (l) => String(l || '').trim().toLowerCase().replace(/\s+/g, '.');

  function erro(msg) { const e = new Error(msg); e.amigavel = true; return e; }

  /* ── Perfis e escopo de acesso (vale para o modo demo e para o Supabase, onde a RLS garante no servidor) ──
     colaborador: vê só o próprio painel · gerente: a própria loja · supervisor: as lojas da sua região · coordenador: tudo */
  const PERFIS = { colaborador: 'Colaborador', gerente: 'Gerente', supervisor: 'Supervisor(a)', coordenador: 'Coordenador(a)' };
  const perfilDe = (u) => !u ? 'colaborador' : (u.perfil === 'gestor' ? 'coordenador' : (PERFIS[u.perfil] ? u.perfil : 'colaborador'));
  const ehCoordenador = (u) => perfilDe(u) === 'coordenador';
  const ehLider = (u) => ['gerente', 'supervisor', 'coordenador'].includes(perfilDe(u));
  const lojaRotulo = (l) => l ? `${String(l.id).padStart(3, '0')} · ${l.nome}` : '—';
  // o colaborador "alvo" ({id, loja_id}) está no escopo do usuário "u"? (mesma regra da função escopo_ok do banco)
  function noEscopo(u, alvo, lojas) {
    if (!u || !alvo) return false; if (alvo.id === u.id) return true;
    const p = perfilDe(u);
    if (p === 'coordenador') return true;
    if (p === 'supervisor') { if (u.regiao_id == null) return false; const l = (lojas || []).find(x => x.id === alvo.loja_id); return !!l && l.regiao_id === u.regiao_id; }
    if (p === 'gerente') return u.loja_id != null && alvo.loja_id === u.loja_id;
    return false;
  }
  // descrição do escopo: { nivel: 'rede'|'regiao'|'loja'|'proprio', rotulo }
  function escopoDe(u, cont) {
    const p = perfilDe(u); cont = cont || {};
    if (p === 'coordenador') return { nivel: 'rede', rotulo: 'Rede Só Tintas', perfil: p };
    if (p === 'supervisor') { const r = (cont.regioes || []).find(x => x.id === u.regiao_id); return { nivel: 'regiao', rotulo: r ? r.nome : 'Região não definida', regiao_id: u.regiao_id, perfil: p }; }
    if (p === 'gerente') { const l = (cont.lojas || []).find(x => x.id === u.loja_id); return { nivel: 'loja', rotulo: lojaRotulo(l), loja_id: u.loja_id, perfil: p }; }
    return { nivel: 'proprio', rotulo: 'Meu painel', perfil: p };
  }

  /* ═════════════════════════════ MODO DEMO ═════════════════════════════ */
  const Demo = {
    ler() {
      try { return JSON.parse(localStorage.getItem(CHAVE_DEMO)) || Demo.vazio(); }
      catch (e) { return Demo.vazio(); }
    },
    vazio() { return { usuarios: {}, sessao: null, progresso: {}, xp: {}, conquistas: {}, tentativas: {}, atividade: {}, disc: {}, chat: [], conteudo_override: null, versao: 1 }; },
    salvar(d) { try { localStorage.setItem(CHAVE_DEMO, JSON.stringify(d)); } catch (e) { console.warn('Sem localStorage', e); } },
    zerar() { try { localStorage.removeItem(CHAVE_DEMO); } catch (e) {} },

    conteudo() {
      const base = clone(global.CONTEUDO);
      const d = Demo.ler();
      /* conteúdo publicado pela coordenação (Servidor de Dados) vale para todos; vem antes das edições locais */
      if (d.conteudo_compartilhado) for (const k of Object.keys(d.conteudo_compartilhado)) { if (!/^niveis_/.test(k) && d.conteudo_compartilhado[k] != null) base[k] = clone(d.conteudo_compartilhado[k]); }
      if (d.conteudo_override) { const o = { ...d.conteudo_override }; const nb = o.niveis_base; delete o.niveis_base; Object.assign(base, o); if (nb && base.niveis_vendas) base.niveis_vendas = { ...base.niveis_vendas, base: { ...base.niveis_vendas.base, ...nb } }; }
      return base;
    },
    // Base mensal de níveis de venda (lojas + vendedores) colada pelo coordenador
    async gestorSalvarNiveis({ lojas, vendedores, mes_base, rotulo }) {
      const d = Demo.ler(); d.conteudo_override = d.conteudo_override || {};
      const antigos = d.conteudo_override.niveis_vendedores || [];
      const vinc = (v) => { const a = antigos.find(x => x.colaborador_id && Number(x.loja_id) === Number(v.loja_id) && Niveis.normNome(x.nome) === Niveis.normNome(v.nome)); return a ? a.colaborador_id : (v.colaborador_id || null); };
      d.conteudo_override.niveis_lojas = lojas.map(l => ({ loja_id: Number(l.loja_id), med90: Number(l.med90) || 0 }));
      d.conteudo_override.niveis_vendedores = vendedores.map((v, i) => ({ id: v.id || ('v' + (i + 1)), loja_id: Number(v.loja_id), nome: String(v.nome).trim(), med90: Number(v.med90) || 0, admissao: v.admissao || null, colaborador_id: vinc(v) }));
      d.conteudo_override.niveis_base = { mes: mes_base || '', rotulo: rotulo || ('base ' + (mes_base || '')), atualizado_em: agora().slice(0, 10) };
      Demo.salvar(d); return true;
    },
    async gestorVincularVendedor(vendId, colaboradorId) {
      const d = Demo.ler(); d.conteudo_override = d.conteudo_override || {};
      const lista = d.conteudo_override.niveis_vendedores || clone(global.CONTEUDO.niveis_vendedores || []).map((v, i) => ({ id: v.id || ('v' + (i + 1)), ...v }));
      const v = lista.find(x => String(x.id) === String(vendId)); if (v) v.colaborador_id = colaboradorId || null;
      d.conteudo_override.niveis_vendedores = lista; Demo.salvar(d); return true;
    },

    async cadastrar({ login, nome, loja_id, cargo, senha, codigo }) {
      const d = Demo.ler();
      login = normalizarLogin(login);
      if (!login || !nome || !senha) throw erro('Preencha login, nome e senha.');
      const cont = Demo.conteudo();
      if (codigo && cont.config.codigo_cadastro && codigo.trim().toUpperCase() !== String(cont.config.codigo_cadastro).toUpperCase()) {
        throw erro('Código de cadastro inválido. Peça ao seu gestor.');
      }
      if (d.usuarios[login]) throw erro('Este login já tem cadastro. Use "Entrar".');
      const pre = (d.pre_cadastro || []).find(p => p.login === login && !p.usado); // login liberado pelo coordenador no painel
      let perfil = Object.keys(d.usuarios).length === 0 ? 'coordenador' : 'colaborador'; // 1º usuário da demo vira coordenador
      let regiao_id = null;
      if (pre) { perfil = PERFIS[pre.perfil] ? pre.perfil : (pre.perfil === 'gestor' ? 'coordenador' : perfil); regiao_id = pre.regiao_id != null ? Number(pre.regiao_id) : null; loja_id = loja_id || pre.loja_id; cargo = cargo || pre.cargo; pre.usado = true; }
      d.usuarios[login] = { id: uuid(), login, nome, loja_id: Number(loja_id) || null, cargo: cargo || 'Vendedor(a)', senha, perfil, regiao_id, criado_em: agora(), ultimo_acesso: agora() };
      d.sessao = login;
      Demo.salvar(d);
      return Demo.usuario(d.usuarios[login], cont);
    },
    async entrar(login, senha) {
      const d = Demo.ler();
      login = normalizarLogin(login);
      const u = d.usuarios[login];
      if (!u) throw erro('Login não encontrado. Faça seu cadastro.');
      if (u.senha !== senha) throw erro('Senha incorreta.');
      u.ultimo_acesso = agora();
      d.sessao = login;
      Demo.salvar(d);
      return Demo.usuario(u, Demo.conteudo());
    },
    async sair() { const d = Demo.ler(); d.sessao = null; Demo.salvar(d); },
    async sessao() {
      const d = Demo.ler();
      if (!d.sessao || !d.usuarios[d.sessao]) return null;
      return Demo.usuario(d.usuarios[d.sessao], Demo.conteudo());
    },
    usuario(u, cont) {
      const loja = (cont.lojas || []).find(l => l.id === u.loja_id);
      const regiao = (cont.regioes || []).find(r => r.id === u.regiao_id);
      return { id: u.id, login: u.login, nome: u.nome, loja_id: u.loja_id, loja: loja ? loja.nome : '—', cargo: u.cargo, perfil: perfilDe(u), regiao_id: u.regiao_id != null ? u.regiao_id : null, regiao: regiao ? regiao.nome : null };
    },

    async progresso(uid) {
      const d = Demo.ler();
      const itens = d.progresso[uid] || [];
      const xpEventos = d.xp[uid] || [];
      const cont = Demo.conteudo();
      const dias = Object.keys(d.atividade[uid] || {});
      const streak = Gamificacao.calcularStreak(dias);
      return {
        itens, xp_total: xpEventos.reduce((s, e) => s + e.xp, 0), eventos: xpEventos,
        conquistas: (d.conquistas[uid] || []), tentativas: d.tentativas[uid] || [], streak, dias_ativos: dias.length, dias,
        disc: d.disc[uid] || null, estado: Gamificacao.resumirEstado(itens, cont, { streak }),
      };
    },

    _premiar(d, uid, cont, tipo, referencia, xp) {
      if (!xp) return;
      d.xp[uid] = d.xp[uid] || [];
      d.xp[uid].push({ id: uuid(), tipo, referencia, xp, criado_em: agora() });
    },
    _verificarConquistas(d, uid, cont) {
      const itens = d.progresso[uid] || [];
      const dias = Object.keys(d.atividade[uid] || {});
      const estado = Gamificacao.resumirEstado(itens, cont, { streak: Gamificacao.calcularStreak(dias) });
      d.conquistas[uid] = d.conquistas[uid] || [];
      const novas = Gamificacao.verificarConquistas(estado, cont.conquistas, d.conquistas[uid].map(c => c.conquista_id));
      for (const c of novas) {
        d.conquistas[uid].push({ conquista_id: c.id, obtida_em: agora() });
        Demo._premiar(d, uid, cont, 'conquista', c.id, c.xp || 0);
      }
      return novas;
    },
    _marcarAtividade(d, uid) { d.atividade[uid] = d.atividade[uid] || {}; d.atividade[uid][hoje()] = true; },

    async registrarAcesso(uid) {
      const d = Demo.ler(); const cont = Demo.conteudo();
      const primeiroHoje = !(d.atividade[uid] && d.atividade[uid][hoje()]);
      Demo._marcarAtividade(d, uid);
      let xp = 0;
      if (primeiroHoje) { xp = cont.regras_xp.login_diario || 0; Demo._premiar(d, uid, cont, 'login_diario', hoje(), xp); }
      const novas = Demo._verificarConquistas(d, uid, cont);
      Demo.salvar(d);
      return { xp_ganho: xp, novas_conquistas: novas, primeiro_acesso_hoje: primeiroHoje };
    },

    async registrarProgresso(uid, tipo, item, dados) {
      const d = Demo.ler(); const cont = Demo.conteudo();
      d.progresso[uid] = d.progresso[uid] || [];
      const existe = d.progresso[uid].find(i => i.item_tipo === tipo && i.item_id === item);
      if (existe) return { ja_existia: true, xp_ganho: 0, novas_conquistas: [], xp_total: (d.xp[uid] || []).reduce((s, e) => s + e.xp, 0) };
      d.progresso[uid].push({ item_tipo: tipo, item_id: item, concluido_em: agora(), nota: dados && dados.nota != null ? dados.nota : null, dados: dados || null });
      Demo._marcarAtividade(d, uid);
      const mapa = { aula: 'aula', video: 'video', historia: 'historia', valores: 'valores', disc: 'disc', tarefa: 'tarefa', checklist: 'checklist' };
      let xp = 0;
      if (tipo === 'aula') { const a = cont.aulas.find(x => x.id === item); xp = (a && a.xp) || cont.regras_xp.aula; }
      else if (tipo === 'video') { const v = cont.videos.find(x => x.id === item); xp = (v && v.xp) || cont.regras_xp.video; }
      else if (tipo === 'tarefa') { const t = cont.jornada.find(x => x.id === item); xp = (t && t.xp) || cont.regras_xp.tarefa; }
      else xp = cont.regras_xp[mapa[tipo]] || 0;
      Demo._premiar(d, uid, cont, tipo, item, xp);
      // bônus de módulo concluído
      let moduloConcluido = null;
      if (tipo === 'aula') {
        const a = cont.aulas.find(x => x.id === item);
        if (a) moduloConcluido = Demo._checarModulo(d, uid, cont, a.modulo_id);
      }
      const novas = Demo._verificarConquistas(d, uid, cont);
      Demo.salvar(d);
      return { ja_existia: false, xp_ganho: xp + (moduloConcluido ? moduloConcluido.xp : 0), novas_conquistas: novas, modulo_concluido: moduloConcluido, xp_total: d.xp[uid].reduce((s, e) => s + e.xp, 0) };
    },
    _checarModulo(d, uid, cont, moduloId) {
      const itens = d.progresso[uid] || [];
      const aulas = cont.aulas.filter(a => a.modulo_id === moduloId);
      const feitas = aulas.every(a => itens.some(i => i.item_tipo === 'aula' && i.item_id === a.id));
      const quizOk = itens.some(i => i.item_tipo === 'quiz' && i.item_id === moduloId);
      const jaBonus = itens.some(i => i.item_tipo === 'modulo' && i.item_id === moduloId);
      if (feitas && quizOk && !jaBonus) {
        const m = cont.modulos.find(x => x.id === moduloId);
        const xp = (m && m.xp_bonus) || cont.regras_xp.modulo_bonus || 0;
        itens.push({ item_tipo: 'modulo', item_id: moduloId, concluido_em: agora(), nota: null });
        Demo._premiar(d, uid, cont, 'modulo', moduloId, xp);
        return { modulo: m, xp };
      }
      return null;
    },

    async enviarQuiz(uid, moduloId, respostas) {
      const d = Demo.ler(); const cont = Demo.conteudo();
      const questoes = cont.questoes.filter(q => q.modulo_id === moduloId);
      const res = Gamificacao.corrigirQuiz(questoes, respostas);
      const aprovado = res.nota >= (cont.config.nota_aprovacao || 7);
      d.tentativas[uid] = d.tentativas[uid] || [];
      d.tentativas[uid].push({ id: uuid(), modulo_id: moduloId, nota: res.nota, acertos: res.acertos, total: res.total, aprovado, realizado_em: agora(), respostas });
      Demo._marcarAtividade(d, uid);
      let xp = 0; let moduloConcluido = null;
      d.progresso[uid] = d.progresso[uid] || [];
      const jaAprovado = d.progresso[uid].find(i => i.item_tipo === 'quiz' && i.item_id === moduloId);
      if (aprovado && !jaAprovado) {
        d.progresso[uid].push({ item_tipo: 'quiz', item_id: moduloId, concluido_em: agora(), nota: res.nota });
        xp = cont.regras_xp.quiz_aprovado + (res.nota >= 10 ? cont.regras_xp.quiz_nota10 : 0);
        Demo._premiar(d, uid, cont, 'quiz', moduloId, xp);
        moduloConcluido = Demo._checarModulo(d, uid, cont, moduloId);
      } else if (aprovado && jaAprovado && res.nota > Number(jaAprovado.nota || 0)) {
        jaAprovado.nota = res.nota; // guarda a melhor nota
        if (res.nota >= 10 && !(d.xp[uid] || []).some(e => e.tipo === 'quiz_nota10' && e.referencia === moduloId)) {
          xp = cont.regras_xp.quiz_nota10; Demo._premiar(d, uid, cont, 'quiz_nota10', moduloId, xp);
        }
      }
      const novas = Demo._verificarConquistas(d, uid, cont);
      Demo.salvar(d);
      return { ...res, aprovado, xp_ganho: xp + (moduloConcluido ? moduloConcluido.xp : 0), novas_conquistas: novas, modulo_concluido: moduloConcluido, xp_total: (d.xp[uid] || []).reduce((s, e) => s + e.xp, 0) };
    },

    async enviarFinal(uid, respostas) {
      const d = Demo.ler(); const cont = Demo.conteudo();
      const ids = Object.keys(respostas);
      const questoes = cont.questoes.filter(q => ids.includes(q.id));
      const res = Gamificacao.corrigirQuiz(questoes, respostas);
      const aprovado = res.nota >= (cont.config.nota_aprovacao || 7);
      d.tentativas[uid] = d.tentativas[uid] || [];
      d.tentativas[uid].push({ id: uuid(), modulo_id: 'FINAL', nota: res.nota, acertos: res.acertos, total: res.total, aprovado, realizado_em: agora(), respostas });
      Demo._marcarAtividade(d, uid);
      d.progresso[uid] = d.progresso[uid] || [];
      let xp = 0;
      const ja = d.progresso[uid].find(i => i.item_tipo === 'final');
      if (aprovado && !ja) {
        d.progresso[uid].push({ item_tipo: 'final', item_id: 'FINAL', concluido_em: agora(), nota: res.nota });
        xp = cont.regras_xp.final_aprovado; Demo._premiar(d, uid, cont, 'final', 'FINAL', xp);
      } else if (aprovado && ja && res.nota > Number(ja.nota || 0)) ja.nota = res.nota;
      const novas = Demo._verificarConquistas(d, uid, cont);
      Demo.salvar(d);
      return { ...res, aprovado, xp_ganho: xp, novas_conquistas: novas, xp_total: (d.xp[uid] || []).reduce((s, e) => s + e.xp, 0) };
    },

    async salvarDisc(uid, resultado) {
      const d = Demo.ler();
      d.disc[uid] = { ...resultado, realizado_em: agora() };
      Demo.salvar(d);
      return Demo.registrarProgresso(uid, 'disc', 'DISC', { nota: null });
    },

    async perguntarAssessor(uid, mensagens) {
      const cont = Demo.conteudo();
      const ultima = mensagens[mensagens.length - 1].content;
      const resposta = global.Assessor ? global.Assessor.responderLocal(ultima, cont) : 'Assessor indisponível.';
      const d = Demo.ler();
      d.chat.push({ id: uuid(), colaborador_id: uid, pergunta: ultima, resposta, criado_em: agora(), origem: 'local' });
      if (d.chat.length > 300) d.chat = d.chat.slice(-300);
      Demo.salvar(d);
      return { resposta, origem: 'local' };
    },

    /* ── gestor (demo) ── */
    async gestorResumo() {
      const d = Demo.ler(); const cont = Demo.conteudo(); const eu = DB.usuario;
      const linhas = Object.values(d.usuarios).filter(u => noEscopo(eu, u, cont.lojas)).map(u => {
        const itens = d.progresso[u.id] || [];
        const xp = (d.xp[u.id] || []).reduce((s, e) => s + e.xp, 0);
        const estado = Gamificacao.resumirEstado(itens, cont, { streak: Gamificacao.calcularStreak(Object.keys(d.atividade[u.id] || {})) });
        const fin = itens.find(i => i.item_tipo === 'final');
        const loja = cont.lojas.find(l => l.id === u.loja_id); const regiao = loja && (cont.regioes || []).find(r => r.id === loja.regiao_id);
        return {
          id: u.id, login: u.login, nome: u.nome, loja: loja ? loja.nome : '—', loja_id: u.loja_id, regiao_id: loja ? loja.regiao_id : null, regiao: regiao ? regiao.nome : null, supervisiona_regiao_id: u.regiao_id != null ? u.regiao_id : null,
          cargo: u.cargo, perfil: perfilDe(u), ativo: u.ativo !== false, criado_em: u.criado_em, ultimo_acesso: u.ultimo_acesso,
          xp, nivel: Gamificacao.nivelPorXp(xp, cont.niveis).nivel.nome, aulas: estado.aulas, total_aulas: cont.aulas.length, modulos: estado.modulos_concluidos.length,
          total_modulos: cont.modulos.length, quizzes: estado.quizzes_aprovados, videos: estado.videos, final_nota: fin ? fin.nota : null, disc: d.disc[u.id] ? d.disc[u.id].dominante : null,
          conquistas: (d.conquistas[u.id] || []).length, streak: estado.streak,
        };
      });
      const ids = new Set(linhas.map(l => l.id));
      return { colaboradores: linhas, chat: d.chat.filter(c => ids.has(c.colaborador_id)).slice().reverse(), tentativas: d.tentativas };
    },
    async gestorDetalhe(uid) {
      const d = Demo.ler(); const cont = Demo.conteudo(); const alvo = Object.values(d.usuarios).find(u => u.id === uid);
      if (!alvo || !noEscopo(DB.usuario, alvo, cont.lojas)) throw erro('Este colaborador não está no seu escopo.');
      return { itens: d.progresso[uid] || [], tentativas: d.tentativas[uid] || [], disc: d.disc[uid] || null, conquistas: d.conquistas[uid] || [], xp: d.xp[uid] || [], chat: d.chat.filter(c => c.colaborador_id === uid) };
    },
    // Popula a demonstração com uma equipe fictícia (para ver o painel por níveis funcionando)
    async gestorPopular() {
      const d = Demo.ler(); const cont = Demo.conteudo();
      const nomes = [['Ana Souza', 7, 'Vendedor(a)'], ['Carlos Lima', 7, 'Gerente', 'gerente'], ['Beatriz Melo', 7, 'Vendedor(a)'], ['Diego Rocha', 10, 'Vendedor(a)'], ['Fernanda Dias', 10, 'Gerente', 'gerente'], ['Gustavo Reis', 15, 'Vendedor(a)'],
        ['Helena Costa', 27, 'Vendedor(a)'], ['Igor Martins', 27, 'Gerente', 'gerente'], ['Júlia Nunes', 34, 'Vendedor(a)'], ['Lucas Prado', 33, 'Auxiliar de Loja'], ['Marina Alves', 18, 'Vendedor(a)'], ['Nathan Cruz', 18, 'Gerente', 'gerente'], ['Paula Freitas', 35, 'Vendedor(a)'], ['Rafael Pires', 36, 'Vendedor(a)'],
        ['Danilo Supervisor', 27, 'Supervisor(a)', 'supervisor', 2], ['Ramon Supervisor', 18, 'Supervisor(a)', 'supervisor', 3]];
      const aulas = cont.aulas.slice().sort((a, b) => (a.modulo_id + a.ordem).localeCompare(b.modulo_id + b.ordem));
      let n = 0;
      nomes.forEach(([nome, loja_id, cargo, perfil, regiao_id], i) => {
        const login = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '.');
        if (d.usuarios[login]) return; n++;
        const id = uuid(); const diasAtras = [0, 1, 2, 3, 5, 9, 12, 20][i % 8];
        const ultimo = new Date(Date.now() - diasAtras * 86400000).toISOString();
        d.usuarios[login] = { id, login, nome, loja_id, cargo, senha: '123456', perfil: perfil || 'colaborador', regiao_id: regiao_id || null, criado_em: new Date(Date.now() - (30 + i * 3) * 86400000).toISOString(), ultimo_acesso: ultimo, ficticio: true };
        const qtd = Math.floor(aulas.length * [0.1, 0.3, 0.55, 0.8, 1, 0.45, 0.2, 0.7][i % 8]);
        d.progresso[id] = []; d.xp[id] = []; d.conquistas[id] = []; d.atividade[id] = {};
        aulas.slice(0, qtd).forEach((a, k) => { const q = new Date(Date.now() - (qtd - k) * 86400000 * 0.7).toISOString(); d.progresso[id].push({ item_tipo: 'aula', item_id: a.id, concluido_em: q }); d.xp[id].push({ id: uuid(), tipo: 'aula', referencia: a.id, xp: cont.regras_xp.aula || 20, criado_em: q }); });
        for (const m of cont.modulos) { const das = cont.aulas.filter(a => a.modulo_id === m.id); if (das.length && das.every(a => d.progresso[id].some(p => p.item_tipo === 'aula' && p.item_id === a.id))) { const nota = [8, 9, 10, 7, 8.5][i % 5]; d.progresso[id].push({ item_tipo: 'quiz', item_id: m.id, concluido_em: ultimo, nota }); d.progresso[id].push({ item_tipo: 'modulo', item_id: m.id, concluido_em: ultimo }); d.xp[id].push({ id: uuid(), tipo: 'quiz_aprovado', referencia: m.id, xp: cont.regras_xp.quiz_aprovado || 60, criado_em: ultimo }); } }
        if (i % 3 === 0) { d.progresso[id].push({ item_tipo: 'historia', item_id: 'HISTORIA', concluido_em: ultimo }); d.xp[id].push({ id: uuid(), tipo: 'historia', referencia: 'HISTORIA', xp: cont.regras_xp.historia || 30, criado_em: ultimo }); }
        for (let k = 0; k < [1, 3, 7, 2, 12, 4, 0, 6][i % 8]; k++) d.atividade[id][new Date(Date.now() - (diasAtras + k) * 86400000).toISOString().slice(0, 10)] = true;
        if (i % 4 === 1) d.disc[id] = { dominante: ['Executor', 'Comunicador', 'Planejador', 'Analista'][i % 4], secundario: 'Planejador', d: 30, i: 25, s: 25, c: 20 };
      });
      Demo.salvar(d); return n;
    },
    async gestorSalvarConteudo(tabela, lista) {
      const d = Demo.ler(); d.conteudo_override = d.conteudo_override || {};
      d.conteudo_override[tabela] = lista; Demo.salvar(d); return true;
    },
    async gestorSalvarConfig(config) {
      const d = Demo.ler(); d.conteudo_override = d.conteudo_override || {};
      d.conteudo_override.config = { ...Demo.conteudo().config, ...config }; Demo.salvar(d); return true;
    },
    async gestorPreCadastro() { const d = Demo.ler(); return d.pre_cadastro || []; },
    async gestorSalvarPreCadastro(lista) { const d = Demo.ler(); d.pre_cadastro = lista; Demo.salvar(d); return true; },
    async gestorAlterarPerfil(uid, perfil, regiao_id) {
      const d = Demo.ler(); const u = Object.values(d.usuarios).find(x => x.id === uid); if (u) { u.perfil = perfil; u.regiao_id = perfil === 'supervisor' && regiao_id != null ? Number(regiao_id) : null; } Demo.salvar(d); return true;
    },
    async gestorRemover(uid) {
      const d = Demo.ler(); const login = Object.keys(d.usuarios).find(k => d.usuarios[k].id === uid);
      if (login) delete d.usuarios[login]; delete d.progresso[uid]; delete d.xp[uid]; delete d.conquistas[uid]; delete d.tentativas[uid]; delete d.atividade[uid]; delete d.disc[uid];
      Demo.salvar(d); return true;
    },
  };

  /* ═══════════════════════════ MODO SUPABASE ═══════════════════════════ */
  const Sup = {
    cliente() {
      if (!global.supabase) throw erro('Não foi possível carregar a biblioteca do Supabase. Verifique a conexão com a internet e recarregue a página.');
      if (!DB.sb) DB.sb = global.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
      return DB.sb;
    },
    traduzirErro(e) {
      const m = (e && e.message) || String(e);
      if (/Invalid login credentials/i.test(m)) return 'Login ou senha incorretos.';
      if (/already registered|already exists/i.test(m)) return 'Este login já tem cadastro. Use "Entrar".';
      if (/Password should be/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
      if (/Database error saving new user/i.test(m)) return 'Cadastro não autorizado. Confira o código de cadastro ou peça ao gestor para liberar seu login.';
      if (/Failed to fetch|NetworkError/i.test(m)) return 'Sem conexão com o servidor. Verifique a internet.';
      return m;
    },
    async rpc(nome, params) {
      const { data, error } = await Sup.cliente().rpc(nome, params || {});
      if (error) throw erro(Sup.traduzirErro(error));
      return data;
    },
    async conteudo(paraGestor) {
      const sb = Sup.cliente();
      const q = (t, ordem) => sb.from(t).select('*').order(ordem || 'ordem', { ascending: true });
      const [lojas, modulos, aulas, questoes, videos, historia, valores, jornada, conquistas, niveis, regras, config, kb] = await Promise.all([
        sb.from('lojas').select('*').eq('ativa', true).order('id'),
        q('modulos'), q('aulas'),
        paraGestor ? q('questoes') : sb.from('questoes_colaborador').select('*').order('ordem'),
        q('videos'), q('historia'), q('valores'), q('jornada_tarefas'), q('conquistas'), sb.from('niveis').select('*').order('xp_min'),
        sb.from('regras_xp').select('*'), sb.from('configuracoes').select('*'), q('base_conhecimento'),
      ]);
      for (const r of [lojas, modulos, aulas, questoes, videos, historia, valores, jornada, conquistas, niveis, regras, config, kb]) if (r.error) throw erro('Erro ao carregar conteúdo: ' + r.error.message);
      const regras_xp = {}; for (const r of regras.data) regras_xp[r.chave] = Number(r.xp);
      const cfg = {}; for (const c of config.data) cfg[c.chave] = c.valor;
      cfg.nota_aprovacao = Number(cfg.nota_aprovacao || 7);
      const base = clone(global.CONTEUDO || {});
      // catálogo de produtos: vem do banco quando a tabela existe e tem linhas; senão usa o do código
      let produtos = base.produtos || [];
      try { const r = await q('produtos'); if (!r.error && r.data && r.data.length) produtos = r.data; } catch (e) { console.warn('Tabela produtos indisponível, usando catálogo do código', e); }
      let regioes = base.regioes || [];
      try { const r = await sb.from('regioes').select('*').order('id'); if (!r.error && r.data) regioes = r.data; } catch (e) { console.warn('Tabela regioes indisponível', e); }
      // níveis de venda: base mensal do banco (recortada pela RLS); se as tabelas estiverem vazias, usa a base do código
      let niveis_lojas = base.niveis_lojas || [], niveis_vendedores = base.niveis_vendedores || [];
      try {
        const [nl, nv] = await Promise.all([sb.from('niveis_lojas').select('*'), sb.from('niveis_vendedores').select('*').order('id')]);
        if (!nl.error && nl.data && nl.data.length) { niveis_lojas = nl.data.map(x => ({ ...x, med90: Number(x.med90) })); niveis_vendedores = (nv.data || []).map(x => ({ ...x, med90: Number(x.med90) })); }
      } catch (e) { console.warn('Tabelas de níveis indisponíveis, usando a base do código', e); }
      return {
        ...base,
        config: { ...(base.config || {}), ...cfg },
        regioes, lojas: lojas.data, niveis_lojas, niveis_vendedores, modulos: modulos.data.filter(m => m.ativo !== false), aulas: aulas.data, questoes: questoes.data, videos: videos.data.filter(v => v.ativo !== false),
        historia: historia.data, valores: valores.data, jornada: jornada.data, conquistas: conquistas.data, niveis: niveis.data, regras_xp, base_conhecimento: kb.data, produtos,
      };
    },
    async usuarioAtual() {
      const sb = Sup.cliente();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return null;
      const { data, error } = await sb.from('colaboradores').select('*, lojas(nome, regiao_id), regioes(nome)').eq('id', session.user.id).maybeSingle();
      if (error || !data) return null;
      return { id: data.id, login: data.login, nome: data.nome, loja_id: data.loja_id, loja: data.lojas ? data.lojas.nome : '—', cargo: data.cargo, perfil: perfilDe(data), ativo: data.ativo, regiao_id: data.regiao_id != null ? data.regiao_id : null, regiao: data.regioes ? data.regioes.nome : null };
    },
    async cadastrar({ login, nome, loja_id, cargo, senha, codigo }) {
      login = normalizarLogin(login);
      if (!/^[a-z0-9._-]{3,40}$/.test(login)) throw erro('Login inválido: use letras, números, ponto ou traço (3 a 40 caracteres).');
      if (!senha || senha.length < 6) throw erro('A senha precisa ter pelo menos 6 caracteres.');
      const valida = await Sup.rpc('validar_cadastro', { p_login: login, p_codigo: codigo || '' });
      if (!valida || !valida.ok) throw erro((valida && valida.motivo) || 'Cadastro não autorizado.');
      const sb = Sup.cliente();
      const { error } = await sb.auth.signUp({
        email: emailDe(login), password: senha,
        options: { data: { login, nome: nome || valida.nome, loja_id: Number(loja_id) || valida.loja_id || null, cargo: cargo || valida.cargo || 'Vendedor(a)', codigo: codigo || '' } },
      });
      if (error) throw erro(Sup.traduzirErro(error));
      // Se a confirmação de e-mail estiver desligada (como no guia), a sessão já vem ativa.
      const u = await Sup.usuarioAtual();
      if (!u) throw erro('Cadastro criado, mas não foi possível entrar. No Supabase, desligue "Confirm email" em Authentication → Providers → Email.');
      return u;
    },
    async entrar(login, senha) {
      const sb = Sup.cliente();
      const { error } = await sb.auth.signInWithPassword({ email: emailDe(normalizarLogin(login)), password: senha });
      if (error) throw erro(Sup.traduzirErro(error));
      const u = await Sup.usuarioAtual();
      if (!u) throw erro('Seu cadastro não foi encontrado. Fale com o gestor.');
      if (u.ativo === false) { await sb.auth.signOut(); throw erro('Seu acesso está desativado. Fale com o gestor.'); }
      return u;
    },
    async sair() { await Sup.cliente().auth.signOut(); },
    async progresso(uid) {
      const sb = Sup.cliente();
      const [itens, xp, conq, tent, dias, disc] = await Promise.all([
        sb.from('progresso').select('*').eq('colaborador_id', uid),
        sb.from('xp_eventos').select('*').eq('colaborador_id', uid).order('criado_em', { ascending: false }),
        sb.from('conquistas_obtidas').select('*').eq('colaborador_id', uid),
        sb.from('tentativas_quiz').select('*').eq('colaborador_id', uid).order('realizado_em', { ascending: false }),
        sb.from('atividade_diaria').select('dia').eq('colaborador_id', uid),
        sb.from('resultados_disc').select('*').eq('colaborador_id', uid).maybeSingle(),
      ]);
      for (const r of [itens, xp, conq, tent, dias]) if (r.error) throw erro('Erro ao carregar progresso: ' + r.error.message);
      const listaDias = (dias.data || []).map(x => x.dia);
      const streak = Gamificacao.calcularStreak(listaDias);
      const eventos = (xp.data || []).map(e => ({ ...e, xp: Number(e.xp) }));
      return {
        itens: itens.data || [], xp_total: eventos.reduce((s, e) => s + e.xp, 0), eventos, conquistas: conq.data || [], tentativas: tent.data || [], streak, dias_ativos: listaDias.length, dias: listaDias,
        disc: disc.data || null, estado: Gamificacao.resumirEstado(itens.data || [], DB.conteudo, { streak }),
      };
    },
    async registrarAcesso() { return Sup.rpc('registrar_acesso'); },
    async registrarProgresso(uid, tipo, item, dados) { return Sup.rpc('registrar_progresso', { p_tipo: tipo, p_item: item, p_dados: dados || {} }); },
    async enviarQuiz(uid, moduloId, respostas) { return Sup.rpc('enviar_quiz', { p_modulo: moduloId, p_respostas: respostas }); },
    async enviarFinal(uid, respostas) { return Sup.rpc('enviar_avaliacao_final', { p_respostas: respostas }); },
    async salvarDisc(uid, resultado) {
      const sb = Sup.cliente();
      const { error } = await sb.from('resultados_disc').upsert({ colaborador_id: uid, d: resultado.d, i: resultado.i, s: resultado.s, c: resultado.c, dominante: resultado.dominante, secundario: resultado.secundario, respostas: resultado.respostas, realizado_em: agora() });
      if (error) throw erro(error.message);
      return Sup.rpc('registrar_progresso', { p_tipo: 'disc', p_item: 'DISC', p_dados: {} });
    },
    async perguntarAssessor(uid, mensagens) {
      const sb = Sup.cliente();
      try {
        const { data, error } = await sb.functions.invoke(CFG.FUNCAO_ASSESSOR || 'mentor', { body: { acao: 'assessor', mensagens } });
        if (error) throw error;
        if (data && data.resposta) return { resposta: data.resposta, origem: 'ia' };
        throw new Error((data && data.erro) || 'Resposta vazia');
      } catch (e) {
        console.warn('Assessor IA indisponível, usando base local:', e);
        const ultima = mensagens[mensagens.length - 1].content;
        const resposta = global.Assessor ? global.Assessor.responderLocal(ultima, DB.conteudo) : 'Assessor indisponível no momento.';
        try { await sb.from('chat_assessor').insert({ colaborador_id: uid, pergunta: ultima, resposta, origem: 'local' }); } catch (_) {}
        return { resposta, origem: 'local', aviso: 'A IA não respondeu (função ainda não configurada?). Mostrando a base local.' };
      }
    },
    /* ── gestor ── */
    async gestorResumo() {
      const sb = Sup.cliente();
      const [painel, chat] = await Promise.all([
        sb.from('painel_progresso').select('*').order('nome'),
        sb.from('chat_assessor').select('*').order('criado_em', { ascending: false }).limit(200),
      ]);
      if (painel.error) throw erro(painel.error.message);
      return { colaboradores: painel.data || [], chat: chat.data || [], tentativas: {} };
    },
    async gestorDetalhe(uid) {
      const sb = Sup.cliente();
      const [itens, tent, disc, conq, xp, chat] = await Promise.all([
        sb.from('progresso').select('*').eq('colaborador_id', uid),
        sb.from('tentativas_quiz').select('*').eq('colaborador_id', uid).order('realizado_em', { ascending: false }),
        sb.from('resultados_disc').select('*').eq('colaborador_id', uid).maybeSingle(),
        sb.from('conquistas_obtidas').select('*').eq('colaborador_id', uid),
        sb.from('xp_eventos').select('*').eq('colaborador_id', uid).order('criado_em', { ascending: false }),
        sb.from('chat_assessor').select('*').eq('colaborador_id', uid).order('criado_em', { ascending: false }).limit(50),
      ]);
      return { itens: itens.data || [], tentativas: tent.data || [], disc: disc.data || null, conquistas: conq.data || [], xp: (xp.data || []).map(e => ({ ...e, xp: Number(e.xp) })), chat: chat.data || [] };
    },
    async gestorListar(tabela, ordem) {
      const { data, error } = await Sup.cliente().from(tabela).select('*').order(ordem || 'ordem', { ascending: true });
      if (error) throw erro(error.message); return data;
    },
    async gestorUpsert(tabela, registro) {
      const { data, error } = await Sup.cliente().from(tabela).upsert(registro).select();
      if (error) throw erro(error.message); return data;
    },
    async gestorExcluir(tabela, chave, valor) {
      const { error } = await Sup.cliente().from(tabela).delete().eq(chave, valor);
      if (error) throw erro(error.message); return true;
    },
    async gestorSalvarConfig(config) {
      const linhas = Object.entries(config).map(([chave, valor]) => ({ chave, valor: String(valor) }));
      const { error } = await Sup.cliente().from('configuracoes').upsert(linhas);
      if (error) throw erro(error.message); return true;
    },
    async gestorAlterarPerfil(uid, perfil, regiao_id) {
      const { error } = await Sup.cliente().from('colaboradores').update({ perfil, regiao_id: perfil === 'supervisor' && regiao_id != null ? Number(regiao_id) : null }).eq('id', uid);
      if (error) throw erro(error.message); return true;
    },
    async gestorSalvarNiveis({ lojas, vendedores, mes_base, rotulo }) {
      const sb = Sup.cliente();
      const ant = await sb.from('niveis_vendedores').select('loja_id, nome, colaborador_id');
      const antigos = (ant.data || []).filter(x => x.colaborador_id);
      const vinc = (v) => { const a = antigos.find(x => Number(x.loja_id) === Number(v.loja_id) && Niveis.normNome(x.nome) === Niveis.normNome(v.nome)); return a ? a.colaborador_id : (v.colaborador_id || null); };
      let r = await sb.from('niveis_vendedores').delete().neq('id', 0); if (r.error) throw erro(r.error.message);
      r = await sb.from('niveis_lojas').delete().neq('loja_id', 0); if (r.error) throw erro(r.error.message);
      if (lojas.length) { r = await sb.from('niveis_lojas').insert(lojas.map(l => ({ loja_id: Number(l.loja_id), med90: Number(l.med90) || 0, mes_base: mes_base || null }))); if (r.error) throw erro(r.error.message); }
      if (vendedores.length) { r = await sb.from('niveis_vendedores').insert(vendedores.map(v => ({ loja_id: Number(v.loja_id), nome: String(v.nome).trim(), med90: Number(v.med90) || 0, admissao: v.admissao || null, colaborador_id: vinc(v), mes_base: mes_base || null }))); if (r.error) throw erro(r.error.message); }
      await Sup.gestorSalvarConfig({ niveis_mes_base: mes_base || '', niveis_rotulo: rotulo || '', niveis_atualizado_em: hoje() });
      return true;
    },
    async gestorVincularVendedor(vendId, colaboradorId) {
      const { error } = await Sup.cliente().from('niveis_vendedores').update({ colaborador_id: colaboradorId || null }).eq('id', vendId);
      if (error) throw erro(error.message); return true;
    },
    async gestorAtivar(uid, ativo) {
      const { error } = await Sup.cliente().from('colaboradores').update({ ativo }).eq('id', uid);
      if (error) throw erro(error.message); return true;
    },
    async gestorRedefinirSenha(uid, novaSenha) {
      const { data, error } = await Sup.cliente().functions.invoke(CFG.FUNCAO_ASSESSOR || 'mentor', { body: { acao: 'redefinir_senha', colaborador_id: uid, nova_senha: novaSenha } });
      if (error) throw erro('A função "mentor" não respondeu. Ela precisa estar publicada no Supabase (veja o guia).');
      if (data && data.erro) throw erro(data.erro);
      return true;
    },
  };

  /* ═══════════════════════ INTERFACE ÚNICA (pública) ═══════════════════════ */
  const impl = DB.mode === 'supabase' ? Sup : Demo;

  function normalizar(cont) {
    // níveis de venda: rótulo da base vindo das configurações (quando o coordenador já colou uma base) e id em cada vendedor
    if (cont.niveis_vendas) { const c = cont.config || {}; if (c.niveis_mes_base) cont.niveis_vendas = { ...cont.niveis_vendas, base: { ...cont.niveis_vendas.base, mes: c.niveis_mes_base, rotulo: c.niveis_rotulo || ('base ' + c.niveis_mes_base), atualizado_em: c.niveis_atualizado_em || '' } }; }
    (cont.niveis_vendedores || []).forEach((v, i) => { if (v.id == null) v.id = 'v' + (i + 1); });
    // aulas: monta a lista de imagens das páginas a partir de pagina_inicial/final (quando vier do banco)
    for (const a of cont.aulas || []) {
      if ((!a.paginas || !a.paginas.length) && a.pagina_inicial) { a.paginas = []; for (let i = Number(a.pagina_inicial); i <= Number(a.pagina_final || a.pagina_inicial); i++) a.paginas.push(`assets/material/${a.modulo_id}/p${String(i).padStart(3, '0')}.jpg`); }
      if (typeof a.paginas === 'string') { try { a.paginas = JSON.parse(a.paginas); } catch (e) { a.paginas = []; } }
    }
    for (const q of cont.questoes || []) { if (typeof q.opcoes === 'string') { try { q.opcoes = JSON.parse(q.opcoes); } catch (e) { q.opcoes = []; } } if (q.correta != null) q.correta = Number(q.correta); }
    for (const c of cont.conquistas || []) { if (typeof c.regra === 'string') { try { c.regra = JSON.parse(c.regra); } catch (e) { c.regra = null; } } }
    for (const k of cont.base_conhecimento || []) { if (typeof k.tags === 'string') k.tags = k.tags.split(',').map(x => x.trim()).filter(Boolean); }
    for (const p of cont.produtos || []) {
      for (const key of ['superficies', 'acabamento']) if (typeof p[key] === 'string') p[key] = p[key].split(',').map(x => x.trim()).filter(Boolean);
      if (typeof p.rend === 'string') { try { p.rend = JSON.parse(p.rend); } catch (e) { p.rend = {}; } }
      if (!p.rend || typeof p.rend !== 'object') p.rend = {};
    }
    for (const f of cont.diagnostico || []) { for (const key of ['causas', 'verificar', 'correcao', 'tags']) if (typeof f[key] === 'string') { try { f[key] = JSON.parse(f[key]); } catch (e) { f[key] = String(f[key]).split('|'); } } }
    return cont;
  }
  DB.init = async function (paraGestor) {
    DB.conteudo = normalizar(DB.mode === 'supabase' ? await Sup.conteudo(paraGestor) : Demo.conteudo());
    DB.usuario = DB.mode === 'supabase' ? await Sup.usuarioAtual() : await Demo.sessao();
    return DB;
  };
  DB.recarregarConteudo = async function (paraGestor) { DB.conteudo = normalizar(DB.mode === 'supabase' ? await Sup.conteudo(paraGestor) : Demo.conteudo()); return DB.conteudo; };
  DB.cadastrar = (dados) => impl.cadastrar(dados).then(u => (DB.usuario = u));
  DB.entrar = (login, senha) => impl.entrar(login, senha).then(u => (DB.usuario = u));
  DB.sair = async () => { await impl.sair(); DB.usuario = null; };
  DB.progresso = () => impl.progresso(DB.usuario.id);
  DB.registrarAcesso = () => (DB.mode === 'supabase' ? Sup.registrarAcesso() : Demo.registrarAcesso(DB.usuario.id));
  DB.registrarProgresso = (tipo, item, dados) => impl.registrarProgresso(DB.usuario.id, tipo, item, dados);
  DB.enviarQuiz = (moduloId, respostas) => impl.enviarQuiz(DB.usuario.id, moduloId, respostas);
  DB.enviarFinal = (respostas) => impl.enviarFinal(DB.usuario.id, respostas);
  DB.salvarDisc = (resultado) => impl.salvarDisc(DB.usuario.id, resultado);
  DB.perguntarAssessor = (mensagens) => impl.perguntarAssessor(DB.usuario.id, mensagens);
  DB.gestor = {
    resumo: () => impl.gestorResumo(),
    detalhe: (uid) => impl.gestorDetalhe(uid),
    alterarPerfil: (uid, perfil, regiao_id) => impl.gestorAlterarPerfil(uid, perfil, regiao_id),
    salvarNiveis: (dados) => impl.gestorSalvarNiveis(dados),
    vincularVendedor: (vendId, colaboradorId) => impl.gestorVincularVendedor(vendId, colaboradorId),
    salvarConfig: (cfg) => impl.gestorSalvarConfig(cfg),
    // específicos de cada modo
    demo: Demo, supabase: Sup,
  };
  DB.zerarDemo = () => Demo.zerar();
  DB.util = { normalizarLogin, emailDe, uuid, hoje, PERFIS, perfilDe, ehCoordenador, ehLider, noEscopo, escopoDe, lojaRotulo };

  global.DB = DB;
})(window);
