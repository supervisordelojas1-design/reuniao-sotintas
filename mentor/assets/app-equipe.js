/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO — Painel da Equipe por níveis (aba 📊 Equipe)
   Quem vê o quê:
     colaborador  → só o próprio painel (Perfil) — esta aba nem aparece
     gerente      → a equipe da própria loja
     supervisor   → as lojas da sua região → equipe de cada loja
     coordenador  → a rede inteira → regiões → lojas → equipe
   Os dados vêm de DB.gestor.resumo(), que já chega recortado pelo escopo
   (no Supabase a RLS garante isso no servidor; na demo, o filtro é local).
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  const { $, esc, fmtNum } = global.AppUtil;
  const App = global.App; const U = DB.util;
  const E = { dados: null, carregando: false, erro: null, quando: 0, busca: '', detalhe: {} };
  const SEMANA = () => Date.now() - 7 * 86400000;
  const ativo7 = (c) => !!(c.ultimo_acesso && new Date(c.ultimo_acesso).getTime() > SEMANA());
  const pctTrilha = (c) => c.total_modulos ? Math.round(c.modulos / c.total_modulos * 100) : 0;
  const diasSem = (c) => c.ultimo_acesso ? Math.floor((Date.now() - new Date(c.ultimo_acesso).getTime()) / 86400000) : null;
  const fmtData = (iso) => iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';
  const lojaDe = (id) => (App.cont.lojas || []).find(l => l.id === Number(id));
  const regiaoDe = (id) => (App.cont.regioes || []).find(r => r.id === Number(id));
  const ir = (h) => { location.hash = h; };

  async function carregar(forcar) {
    if (E.carregando) return; if (E.dados && !forcar && Date.now() - E.quando < 60000) return;
    E.carregando = true; E.erro = null;
    try { E.dados = await DB.gestor.resumo(); E.quando = Date.now(); } catch (e) { E.erro = e.message; }
    E.carregando = false; if (App.rota.view === 'equipe') App.render();
  }
  App.equipe = { E, atualizar: () => carregar(true), buscar: (q) => { E.busca = q; const el = $('#eq-lista'); if (el) el.innerHTML = listaColabHtml(colabsFiltrados(todos())); } };

  /* ───────── agregações ───────── */
  const todos = () => (E.dados && E.dados.colaboradores) || [];
  function resumo(itens) {
    const n = itens.length; const ativos = itens.filter(ativo7).length;
    return { n, ativos, parados: n - ativos, media: n ? Math.round(itens.reduce((s, c) => s + pctTrilha(c), 0) / n) : 0, aprovados: itens.filter(c => c.final_nota != null).length, st: n ? Math.round(itens.reduce((s, c) => s + (c.xp || 0), 0) / n) : 0, quaseLa: itens.filter(c => c.final_nota == null && pctTrilha(c) >= 80).length };
  }
  const porLoja = (itens) => { const g = {}; for (const c of itens) (g[c.loja_id] = g[c.loja_id] || []).push(c); return Object.entries(g).map(([id, lista]) => ({ id: Number(id), loja: lojaDe(id), nome: lojaDe(id) ? U.lojaRotulo(lojaDe(id)) : (lista[0].loja || 'Sem loja'), ...resumo(lista) })).sort((a, b) => a.nome.localeCompare(b.nome)); };
  const porRegiao = (itens) => { const g = {}; for (const c of itens) { const k = c.regiao_id == null ? 'sem' : c.regiao_id; (g[k] = g[k] || []).push(c); } return Object.entries(g).map(([k, lista]) => ({ id: k, nome: k === 'sem' ? 'Sem região' : (regiaoDe(k) ? regiaoDe(k).nome : lista[0].regiao), lojas: new Set(lista.map(c => c.loja_id)).size, ...resumo(lista) })).sort((a, b) => String(a.nome).localeCompare(String(b.nome))); };
  const colabsFiltrados = (itens) => { const q = E.busca.trim().toLowerCase(); return q ? itens.filter(c => (c.nome + ' ' + c.login + ' ' + (c.loja || '')).toLowerCase().includes(q)) : itens; };

  /* ───────── blocos de tela ───────── */
  const tiles = (r) => `<div class="eq-tiles"><div class="vp-tile"><b>${r.n}</b><span>Colaboradores</span></div><div class="vp-tile ${r.parados ? 'vermelho' : 'verde'}"><b>${r.parados}</b><span>Sem acesso 7d+</span></div><div class="vp-tile"><b>${r.media}%</b><span>Trilha média</span></div><div class="vp-tile amarelo"><b>${r.aprovados}</b><span>Aprovados</span></div></div>`;
  const barra = (p) => `<div class="barra fina mt-1"><span style="width:${p}%"></span></div>`;
  function itemGrupo(g, hash, sub, etiqueta) {
    return `<div class="item-lista" onclick="location.hash='${hash}'"><span class="num" style="font-size:.72rem">${g.media}%</span><div class="cresce"><div class="titulo">${esc(g.nome)} ${etiqueta || ''}</div><div class="desc">${sub ? esc(sub) + ' · ' : ''}${g.n} colaborador${g.n === 1 ? '' : 'es'} · ${g.ativos} ativo${g.ativos === 1 ? '' : 's'} 7d${g.parados ? ` · <span style="color:var(--vermelho)">${g.parados} parado${g.parados === 1 ? '' : 's'}</span>` : ''}${g.aprovados ? ` · ${g.aprovados} aprovado${g.aprovados === 1 ? '' : 's'}` : ''}</div>${barra(g.media)}</div><span class="seta">›</span></div>`;
  }
  function listaColabHtml(itens) {
    if (!itens.length) return '<div class="card"><p class="pequeno texto-3 centro" style="margin:0">Ninguém neste recorte.</p></div>';
    const ordem = itens.slice().sort((a, b) => (ativo7(b) - ativo7(a)) || (pctTrilha(b) - pctTrilha(a)) || a.nome.localeCompare(b.nome));
    return ordem.map(c => { const d = diasSem(c); const parado = !ativo7(c); const nivel = (App.cont.niveis || []).find(n => n.nome === c.nivel);
      return `<div class="item-lista ${parado ? '' : ''}" onclick="location.hash='#/equipe/colab/${c.id}'"><span class="num">${nivel ? nivel.emoji : '👤'}</span><div class="cresce"><div class="titulo">${esc(c.nome)} ${c.perfil && c.perfil !== 'colaborador' ? `<span class="etiqueta azul mini">${esc(U.PERFIS[c.perfil] || c.perfil)}</span>` : ''}</div><div class="desc">${esc(c.cargo || '')}${c.loja ? ' · ' + esc(c.loja) : ''} · ${c.xp} ST · trilha ${pctTrilha(c)}%</div><div class="mini mt-1">${parado ? `<span class="etiqueta vermelha mini">⚠️ ${d == null ? 'nunca entrou' : d + ' dias sem acesso'}</span>` : `<span class="etiqueta verde mini">ativo · ${d === 0 ? 'hoje' : d + 'd'}</span>`} ${c.final_nota != null ? `<span class="etiqueta amarela mini">✔ final ${fmtNum(c.final_nota)}</span>` : pctTrilha(c) >= 80 ? '<span class="etiqueta azul mini">quase na final</span>' : ''}</div></div><span class="seta">›</span></div>`; }).join('');
  }
  function alertas(itens) {
    const parados = itens.filter(c => !ativo7(c)).sort((a, b) => (diasSem(b) || 999) - (diasSem(a) || 999));
    const quase = itens.filter(c => c.final_nota == null && pctTrilha(c) >= 80);
    if (!parados.length && !quase.length) return '';
    return `<div class="card alerta"><div class="negrito">👀 Para puxar hoje</div>${parados.length ? `<div class="pequeno mt-1"><b>${parados.length} sem acesso há 7+ dias:</b> ${parados.slice(0, 6).map(c => esc(c.nome.split(' ')[0]) + (diasSem(c) == null ? ' (nunca entrou)' : ` (${diasSem(c)}d)`)).join(', ')}${parados.length > 6 ? ` e mais ${parados.length - 6}` : ''}</div>` : ''}${quase.length ? `<div class="pequeno mt-1"><b>${quase.length} com 80%+ da trilha:</b> ${quase.slice(0, 6).map(c => esc(c.nome.split(' ')[0])).join(', ')} — hora de incentivar a avaliação final.</div>` : ''}</div>`;
  }
  function textoResumo(titulo, itens) {
    const r = resumo(itens); const parados = itens.filter(c => !ativo7(c));
    const l = [`*MENTOR ST PRO — ${titulo}*`, `${r.n} colaborador(es) · ${r.ativos} ativo(s) nos últimos 7 dias · trilha média ${r.media}% · ${r.aprovados} aprovado(s) na avaliação final`, ''];
    for (const c of itens.slice().sort((a, b) => pctTrilha(b) - pctTrilha(a))) l.push(`${ativo7(c) ? '🟢' : '🔴'} ${c.nome} — trilha ${pctTrilha(c)}% · ${c.xp} ST${c.final_nota != null ? ' · ✔ aprovado' : ''}${!ativo7(c) ? ` · ${diasSem(c) == null ? 'nunca entrou' : diasSem(c) + ' dias sem acesso'}` : ''}`);
    if (parados.length) { l.push(''); l.push(`⚠️ Puxar: ${parados.map(c => c.nome.split(' ')[0]).join(', ')}`); }
    l.push(''); l.push('_Gerado no MENTOR ST PRO · Só Tintas_'); return l.join('\n');
  }
  App.equipe.copiar = async (titulo, chave, valor) => { const itens = chave === 'loja' ? todos().filter(c => String(c.loja_id) === String(valor)) : chave === 'regiao' ? todos().filter(c => String(c.regiao_id == null ? 'sem' : c.regiao_id) === String(valor)) : todos(); const t = textoResumo(titulo, itens); try { await navigator.clipboard.writeText(t); App.toast('Resumo copiado ✔ Cole no grupo da loja.'); } catch (e) { global.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank', 'noopener'); } };
  const topo = (titulo, sub, voltar) => App.cabecalho(titulo, sub, { voltar, cor: 'azul', extra: `<div class="linha mt-1" style="gap:8px"><button class="btn mini" style="background:rgba(255,255,255,.18)" onclick="App.equipe.atualizar()">↻ Atualizar</button><span class="mini" style="opacity:.8">${E.quando ? 'dados de ' + new Date(E.quando).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</span></div>` });
  const semAcesso = () => App.cabecalho('Equipe', 'Painel por níveis', { voltar: '#/inicio', cor: 'azul' }) + `<div class="tela"><div class="card info"><h3>Seu painel é o Perfil</h3><p class="pequeno">Colaboradores acompanham o próprio progresso na aba <b>Perfil</b>. Gerentes veem a equipe da loja, supervisores as lojas da região e o coordenador a rede inteira. Se o seu cargo mudou, peça ao coordenador para ajustar seu nível de acesso.</p><button class="btn" onclick="location.hash='#/perfil'">Ir para o meu Perfil</button></div></div>`;

  /* ───────── telas ───────── */
  App.views.equipe = ([tipo, id]) => {
    if (!U.ehLider(App.user)) return semAcesso();
    if (E.uid !== App.user.id) { E.uid = App.user.id; E.dados = null; E.detalhe = {}; E.busca = ''; E.quando = 0; } // trocou de usuário: nada da sessão anterior
    if (!E.dados) { carregar(); return App.cabecalho('Equipe', 'Painel por níveis', { voltar: '#/inicio', cor: 'azul' }) + `<div class="tela"><div class="card">${E.erro ? `<p class="pequeno" style="color:var(--vermelho)">${esc(E.erro)}</p><button class="btn pequeno" onclick="App.equipe.atualizar()">Tentar de novo</button>` : '<p class="pequeno texto-3" style="margin:0">Carregando a equipe…</p>'}</div></div>`; }
    const escopo = U.escopoDe(App.user, App.cont); const lista = todos();
    if (tipo === 'colab' && id) return telaColab(id, escopo);
    if (tipo === 'loja' && id) return telaLoja(Number(id), escopo);
    if (tipo === 'regiao' && id) return telaRegiao(id, escopo);
    if (tipo === 'lista') return telaLista(escopo);
    // raiz: depende do nível
    if (escopo.nivel === 'loja') return telaLoja(escopo.loja_id, escopo, true);
    if (escopo.nivel === 'regiao') return telaRegiao(String(escopo.regiao_id), escopo, true);
    return telaRede(lista, escopo);
  };
  function telaRede(lista, escopo) {
    const r = resumo(lista); const regioes = porRegiao(lista);
    return topo('Rede Só Tintas', `${(App.cont.lojas || []).length} lojas · ${(App.cont.regioes || []).length} regiões · visão do coordenador`, '#/inicio') + `<div class="tela">
      ${tiles(r)}${alertas(lista)}${App.niveisBlocos ? App.niveisBlocos.resumo(() => true) : ''}
      <div class="linha entre mt-1"><h3 style="margin:0">Por região</h3><button class="btn link pequeno" onclick="location.hash='#/equipe/lista'">Todos (${r.n}) ›</button></div>
      ${regioes.length ? regioes.map(g => { const tot = (App.cont.lojas || []).filter(l => g.id === 'sem' ? l.regiao_id == null : l.regiao_id === Number(g.id)).length; return itemGrupo(g, `#/equipe/regiao/${g.id}`, `${g.lojas} de ${tot} loja${tot === 1 ? '' : 's'} com equipe`); }).join('') : '<div class="card"><p class="pequeno texto-3 centro" style="margin:0">Nenhum colaborador cadastrado ainda.</p></div>'}
      <div class="botoes mt-2"><button class="btn contorno azul" onclick="App.equipe.copiar('Rede Só Tintas','rede')">📋 Copiar resumo</button>${U.ehCoordenador(App.user) ? '<a class="btn azul" href="gestor.html">🛠️ Painel completo</a>' : ''}</div>
      <p class="mini texto-3 centro mt-2">Toque numa região para ver as lojas, e numa loja para ver a equipe.</p></div>`;
  }
  function telaRegiao(id, escopo, raiz) {
    if (!(escopo.nivel === 'rede' || (escopo.nivel === 'regiao' && String(escopo.regiao_id) === String(id)))) return foraDoEscopo('Região');
    const lista = todos().filter(c => String(c.regiao_id == null ? 'sem' : c.regiao_id) === String(id));
    const rg = regiaoDe(id); const nome = id === 'sem' ? 'Sem região' : (rg ? rg.nome : 'Região'); const r = resumo(lista);
    const lojasRegiao = (App.cont.lojas || []).filter(l => id === 'sem' ? l.regiao_id == null : l.regiao_id === Number(id));
    const grupos = porLoja(lista); const semGente = lojasRegiao.filter(l => !grupos.some(g => g.id === l.id));
    return topo(esc(nome), `${lojasRegiao.length} loja${lojasRegiao.length === 1 ? '' : 's'} · ${escopo.nivel === 'regiao' ? 'visão do supervisor' : 'visão do coordenador'}`, raiz ? '#/inicio' : '#/equipe') + `<div class="tela">
      ${tiles(r)}${alertas(lista)}${App.niveisBlocos ? App.niveisBlocos.resumo(l => id === 'sem' ? l.regiao_id == null : l.regiao_id === Number(id)) : ''}
      <div class="linha entre mt-1"><h3 style="margin:0">Por loja</h3><button class="btn link pequeno" onclick="App.equipe.copiar('${esc(nome)}','regiao','${id}')">📋 Copiar resumo</button></div>
      ${grupos.map(g => itemGrupo(g, `#/equipe/loja/${g.id}`, undefined, App.niveisBlocos ? App.niveisBlocos.etiquetaLoja(g.id) : '')).join('')}
      ${semGente.length ? `<p class="mini texto-3 mt-1">Sem ninguém cadastrado ainda: ${semGente.map(l => esc(U.lojaRotulo(l))).join(' · ')}</p>` : ''}
      ${!grupos.length ? '<div class="card"><p class="pequeno texto-3 centro" style="margin:0">Nenhum colaborador desta região cadastrado ainda.</p></div>' : ''}</div>`;
  }
  const foraDoEscopo = (titulo) => topo(titulo, '', '#/equipe') + '<div class="tela"><div class="card erro"><p class="pequeno" style="margin:0">Isto não está no seu escopo. Gerente vê a própria loja; supervisor, as lojas da sua região.</p><button class="btn pequeno mt-1" onclick="location.hash=\'#/equipe\'">Voltar à minha equipe</button></div></div>';
  function telaLoja(lojaId, escopo, raiz) {
    const loja = lojaDe(lojaId); const lista = todos().filter(c => c.loja_id === lojaId); const r = resumo(lista);
    const rg = loja && regiaoDe(loja.regiao_id);
    const voltar = raiz ? '#/inicio' : (escopo.nivel === 'regiao' ? '#/equipe' : (loja && loja.regiao_id != null ? `#/equipe/regiao/${loja.regiao_id}` : '#/equipe/regiao/sem'));
    const permitido = escopo.nivel === 'rede' || (escopo.nivel === 'regiao' && loja && loja.regiao_id === escopo.regiao_id) || (escopo.nivel === 'loja' && lojaId === escopo.loja_id);
    if (!permitido || (!loja && !lista.length)) return foraDoEscopo('Loja');
    const titulo = loja ? U.lojaRotulo(loja) : (lista[0] && lista[0].loja) || 'Loja';
    return topo(esc(titulo), `${rg ? esc(rg.nome) + ' · ' : ''}${escopo.nivel === 'loja' ? 'visão do gerente' : escopo.nivel === 'regiao' ? 'visão do supervisor' : 'visão do coordenador'}`, voltar) + `<div class="tela">
      ${tiles(r)}${alertas(lista)}${App.niveisBlocos ? App.niveisBlocos.loja(lojaId) : ''}
      <div class="linha entre mt-1"><h3 style="margin:0">Equipe</h3><button class="btn link pequeno" onclick="App.equipe.copiar('${esc(titulo)}','loja','${lojaId}')">📋 Copiar resumo</button></div>
      ${listaColabHtml(lista)}
      <p class="mini texto-3 centro mt-2">Toque no colaborador para ver o progresso módulo a módulo.</p></div>`;
  }
  function telaLista(escopo) {
    const lista = todos();
    return topo('Todos os colaboradores', esc(escopo.rotulo), '#/equipe') + `<div class="tela"><div class="campo"><input type="search" placeholder="🔎 Buscar por nome, login ou loja" value="${esc(E.busca)}" oninput="App.equipe.buscar(this.value)"></div><div id="eq-lista">${listaColabHtml(colabsFiltrados(lista))}</div></div>`;
  }
  function telaColab(uid, escopo) {
    const c = todos().find(x => x.id === uid);
    if (!c) return topo('Colaborador', '', '#/equipe') + '<div class="tela"><div class="card erro"><p class="pequeno" style="margin:0">Este colaborador não está no seu escopo.</p></div></div>';
    const det = E.detalhe[uid];
    if (!det) { E.detalhe[uid] = { carregando: true }; DB.gestor.detalhe(uid).then(d => { E.detalhe[uid] = d; if (App.rota.view === 'equipe') App.render(); }).catch(e => { E.detalhe[uid] = { erro: e.message }; App.render(); }); }
    const voltar = c.loja_id != null ? `#/equipe/loja/${c.loja_id}` : '#/equipe';
    const feito = (t, i) => !!(det && det.itens && det.itens.some(x => x.item_tipo === t && x.item_id === i));
    const mods = (App.cont.modulos || []).slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map(m => { const aulas = App.cont.aulas.filter(a => a.modulo_id === m.id); const feitas = aulas.filter(a => feito('aula', a.id)).length; const quiz = det && det.itens ? det.itens.find(x => x.item_tipo === 'quiz' && x.item_id === m.id) : null; const pct = aulas.length ? Math.round(feitas / aulas.length * 100) : 0;
      return `<div class="eq-mod"><div class="linha entre"><span class="pequeno"><b>${m.icone || ''} ${esc(m.titulo)}</b></span><span class="mini ${quiz ? 'texto-verde' : 'texto-3'}">${quiz ? '✔ quiz ' + fmtNum(quiz.nota) : feitas + '/' + aulas.length + ' aulas'}</span></div><div class="barra fina mt-1"><span style="width:${quiz ? 100 : pct}%;${quiz ? 'background:var(--verde)' : ''}"></span></div></div>`; }).join('');
    const d = diasSem(c);
    return topo(esc(c.nome), `${esc(c.cargo || '')} · ${esc(c.loja || '')}${c.perfil && c.perfil !== 'colaborador' ? ' · ' + esc(U.PERFIS[c.perfil] || c.perfil) : ''}`, voltar) + `<div class="tela">
      <div class="eq-tiles"><div class="vp-tile"><b>${c.xp}</b><span>ST · ${esc(c.nivel || '')}</span></div><div class="vp-tile ${ativo7(c) ? 'verde' : 'vermelho'}"><b>${d == null ? '—' : d + 'd'}</b><span>${ativo7(c) ? 'último acesso' : 'sem acesso'}</span></div><div class="vp-tile"><b>${pctTrilha(c)}%</b><span>Trilha</span></div><div class="vp-tile amarelo"><b>${c.final_nota != null ? fmtNum(c.final_nota) : '—'}</b><span>Avaliação final</span></div></div>
      ${!ativo7(c) ? `<div class="card alerta pequeno" style="margin-bottom:12px">⚠️ ${d == null ? 'Ainda não entrou no app.' : `Sem acesso há ${d} dias.`} Vale uma conversa: combine um horário fixo para a trilha (15 min por dia já resolve).</div>` : ''}
      <div class="card"><h3>Trilha módulo a módulo</h3>${det && det.carregando ? '<p class="pequeno texto-3">Carregando…</p>' : det && det.erro ? `<p class="pequeno" style="color:var(--vermelho)">${esc(det.erro)}</p>` : mods}</div>
      <div class="card"><h3>Outros marcos</h3><div class="chips">${[['historia', 'HISTORIA', '📜 História'], ['valores', 'VALORES', '🌈 Valores']].map(([t, i, l]) => `<span class="chip ${feito(t, i) ? 'ativo' : ''}">${l}</span>`).join('')}<span class="chip ${c.disc ? 'ativo' : ''}">🧭 DISC${c.disc ? ' · ' + esc(c.disc) : ''}</span><span class="chip ${c.conquistas ? 'ativo' : ''}">🏅 ${c.conquistas || 0} conquista${c.conquistas === 1 ? '' : 's'}</span><span class="chip">🔥 ${c.streak || 0} dia${c.streak === 1 ? '' : 's'} seguidos</span><span class="chip">📅 cadastro ${fmtData(c.criado_em)}</span></div>
        ${det && det.tentativas && det.tentativas.length ? `<div class="mini texto-3 mt-1">${det.tentativas.length} tentativa(s) de quiz no total.</div>` : ''}</div>
      ${det && det.chat && det.chat.length ? `<div class="card"><h3>Últimas dúvidas no Assessor</h3>${det.chat.slice(0, 5).map(x => `<div class="pequeno" style="padding:6px 0;border-bottom:1px solid var(--borda)">${esc(x.pergunta)}<div class="mini texto-3">${fmtData(x.criado_em)}</div></div>`).join('')}</div>` : ''}
    </div>`;
  }
})(window);
