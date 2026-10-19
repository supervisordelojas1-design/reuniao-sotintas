/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO — Checklists dinâmicos + Painel de Vistorias de Obra (Assessor ST)
   Motor genérico: lê CONTEUDO.checklists (conteudo-checklists.js), guarda as
   respostas no navegador, calcula o semáforo (A/B/C), gera o texto e envia
   pelo WhatsApp. Ao enviar pela 1ª vez cada checklist, o colaborador ganha ST.

   A Ficha de Vistoria de Obra (id 'vistoria') não é um checklist avulso: ela
   vive no PAINEL DE VISTORIAS (aba 🏗️ Vistorias), onde cada obra vira um
   registro numerado com fotos, status, relatório em PDF e compartilhamento.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  const { $, esc } = global.AppUtil;
  const App = global.App;
  const zap = (t) => 'https://wa.me/?text=' + encodeURIComponent(t);
  const uid = () => DB.util.uuid();
  const hoje = () => new Date().toISOString().slice(0, 10);
  const agora = () => new Date().toISOString();
  const fmtData = (iso) => { if (!iso) return ''; const [a, m, d] = String(iso).slice(0, 10).split('-'); return d && m && a ? `${d}/${m}/${a}` : iso; };
  const fmtHora = (iso) => { try { return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; } };
  const loginAtual = () => (App.user ? App.user.login : 'anon');
  const irPara = (hash) => { if (location.hash === hash) App.render(); else location.hash = hash; };
  const ST_CHECK = () => (App.cont && App.cont.regras_xp && App.cont.regras_xp.checklist) || 15;

  /* ───────────────────────── estado (por colaborador, no navegador) ───────────────────────── */
  const KEY = () => 'mentorst_check_' + loginAtual();
  const K = { carregado: false, login: null, aberto: null, resp: {}, rascunhos: {}, historico: [], verHistorico: false, vistoriaId: null };
  function ler() { try { return JSON.parse(localStorage.getItem(KEY())) || {}; } catch (e) { return {}; } }
  function salvar() {
    if (K.vistoriaId) { vSalvar(); return; } // a vistoria aberta é gravada no painel, não nos rascunhos
    if (K.aberto) K.rascunhos[K.aberto] = K.resp;
    try { localStorage.setItem(KEY(), JSON.stringify({ rascunhos: K.rascunhos, historico: K.historico.slice(-50) })); } catch (e) {}
  }
  function init() { if (K.carregado && K.login === loginAtual()) return; const d = ler(); K.rascunhos = d.rascunhos || {}; K.historico = d.historico || []; K.carregado = true; K.login = loginAtual(); K.aberto = null; K.vistoriaId = null; }
  const lista = () => ((App.cont && App.cont.checklists) || []).slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const porId = (id) => lista().find(c => c.id === id) || null;
  App.ck = { K };

  /* ───────────────────────── registro na aba do Assessor (entram por último) ───────────────────────── */
  App.views.assessorExtras = () => [['vistoria', '🏗️ Vistorias'], ['checklists', '📋 Checklists']];
  App.telasAssessorExtras = {
    checklists: (resto) => {
      init(); const id = resto && resto[0];
      if (id === 'vistoria') { location.hash = '#/assessor/vistoria'; return ''; } // a ficha de vistoria virou painel
      if (K.vistoriaId) { salvar(); K.aberto = null; K.vistoriaId = null; }
      if (id && porId(id) && K.aberto !== id) App.ck.abrir(id, true);
      return K.aberto ? telaForm() : telaLista();
    },
    vistoria: (resto) => telaVistoria(resto),
  };

  /* ───────────────────────── lista de checklists ───────────────────────── */
  function telaLista() {
    vInit();
    const cls = lista();
    const hist = K.historico.slice().reverse();
    return `<div class="card"><h2>📋 Checklists de vistoria</h2><p class="pequeno texto-2">Preencha com o cliente ou com o pintor, veja a classificação da parede e envie o resultado pelo WhatsApp. A 1ª vez de cada checklist vale <b>+${ST_CHECK()} ST</b>.</p></div>
      ${cls.map(c => {
        if (c.id === 'vistoria') return `<div class="card clicavel" onclick="App.ck.abrir('vistoria')"><div class="linha"><span class="icone-grande ${c.cor || 'cinza'}">🏗️</span><div class="cresce"><div class="negrito">${esc(c.titulo)} <span class="etiqueta azul mini">Painel digital</span></div><div class="pequeno texto-2">Cada obra vira um registro com fotos, relatório em PDF e status.</div><div class="mini texto-3 mt-1">${App.feito('checklist', c.id) ? '✔ ST recebido · ' : ''}${V.lista.length ? V.lista.length + ' vistoria(s) neste aparelho' : 'Nenhuma vistoria ainda'}</div></div><span class="seta">›</span></div></div>`;
        const n = K.historico.filter(h => h.checklist_id === c.id).length; const rasc = K.rascunhos[c.id] && Object.keys(K.rascunhos[c.id]).some(k => k !== '_cab' && K.rascunhos[c.id][k] != null && K.rascunhos[c.id][k] !== '');
        return `<div class="card clicavel" onclick="App.ck.abrir('${c.id}')"><div class="linha"><span class="icone-grande ${c.cor || 'azul'}">${c.icone}</span><div class="cresce"><div class="negrito">${esc(c.titulo)}</div><div class="pequeno texto-2">${esc(c.subtitulo)}</div><div class="mini texto-3 mt-1">${App.feito('checklist', c.id) ? '✔ ST recebido · ' : ''}${n ? n + ' enviado(s)' : 'Nenhum enviado ainda'}${rasc ? ' · <b>rascunho em andamento</b>' : ''}</div></div><span class="seta">›</span></div></div>`; }).join('')}
      <div class="linha entre mt-2"><h3 style="margin:0">Histórico</h3>${hist.length ? `<button class="btn link pequeno" onclick="App.ck.K.verHistorico=!App.ck.K.verHistorico;App.render()">${K.verHistorico ? 'Ocultar' : 'Ver todos'} ›</button>` : ''}</div>
      ${hist.length ? (K.verHistorico ? hist : hist.slice(0, 3)).map(h => { const c = porId(h.checklist_id); const sit = (App.cont.checklists_situacoes || {})[h.semaforo] || {}; return `<div class="item-lista"><span class="num">${sit.emoji || '📋'}</span><div class="cresce" onclick="App.ck.reabrir('${h.id}')"><div class="titulo">${esc(h.cliente || 'Sem nome')}</div><div class="desc">${c ? esc(c.titulo) : ''} · ${new Date(h.criado_em).toLocaleDateString('pt-BR')}${h.local ? ' · ' + esc(h.local) : ''}</div></div><a class="btn mini verde" href="${zap(h.texto)}" target="_blank" rel="noopener">📲</a></div>`; }).join('') : '<p class="pequeno texto-3">Os checklists enviados ficam guardados aqui neste aparelho.</p>'}`;
  }
  App.ck.abrir = (id, silencioso) => {
    init(); const c = porId(id); if (!c) return;
    if (id === 'vistoria') { App.cache.abaAssessor = 'vistoria'; irPara('#/assessor/vistoria'); return; }
    if (K.vistoriaId) { salvar(); K.vistoriaId = null; }
    K.aberto = id; K.resp = K.rascunhos[id] || {}; if (!K.resp._cab) K.resp._cab = {}; if (!K.resp._cab.data) K.resp._cab.data = hoje();
    App.cache.abaAssessor = 'checklists';
    if (silencioso) return;
    if (App.rota.view === 'assessor' && App.rota.params[0] === 'checklists') App.render(); else location.hash = '#/assessor/checklists/' + id;
  };
  App.ck.fechar = () => {
    salvar();
    if (K.vistoriaId) { K.aberto = null; K.vistoriaId = null; irPara('#/assessor/vistoria'); return; }
    K.aberto = null; if (App.rota.params[1]) location.hash = '#/assessor/checklists'; else App.render();
  };
  App.ck.limpar = () => { App.confirmar(K.vistoriaId ? 'Apagar as respostas desta vistoria? A identificação e as fotos são mantidas.' : 'Apagar as respostas deste checklist?', () => { K.resp = { _cab: K.vistoriaId ? (K.resp._cab || {}) : { data: hoje() } }; salvar(); App.render(); }, 'Apagar'); };
  App.ck.reabrir = (hid) => {
    const h = K.historico.find(x => x.id === hid); if (!h) return;
    if (h.checklist_id === 'vistoria') { App.vist.importar(h); return; } // vistorias antigas do histórico entram no painel
    if (K.vistoriaId) { salvar(); K.vistoriaId = null; }
    K.aberto = h.checklist_id; K.resp = JSON.parse(JSON.stringify(h.respostas || {})); App.cache.abaAssessor = 'checklists'; App.render();
  };

  /* ───────────────────────── avaliação (semáforo + alertas) ───────────────────────── */
  const optTexto = (o) => typeof o === 'string' ? o : o.t;
  const optObj = (item, t) => (item.opcoes || []).map(o => typeof o === 'string' ? { t: o } : o).find(o => o.t === t) || null;
  function avaliar(c, resp) {
    const alertas = []; let pendentes = 0, respondidos = 0;
    for (const s of c.secoes) for (const it of s.itens) {
      const v = resp[it.id];
      if (it.tipo === 'sn') {
        if (!v) { pendentes++; continue; } respondidos++;
        if (it.alerta && v === it.alerta) alertas.push({ gravidade: it.gravidade || 'amarelo', texto: it.texto, msg: it.msg || '' });
      } else if (it.tipo === 'escolha') {
        if (!v) { if (it.id !== 'classe') pendentes++; continue; } respondidos++;
        const o = optObj(it, v); if (o && o.g) alertas.push({ gravidade: o.g, texto: it.texto + ': ' + o.t, msg: o.msg || '' });
      } else if (it.tipo === 'multi') {
        const arr = Array.isArray(v) ? v : []; if (!arr.length) { pendentes++; continue; } respondidos++;
        for (const t of arr) { const o = optObj(it, t); if (o && o.g) alertas.push({ gravidade: o.g, texto: o.t, msg: o.msg || '' }); }
      }
    }
    let semaforo = alertas.some(a => a.gravidade === 'vermelho') ? 'vermelho' : alertas.length ? 'amarelo' : 'verde';
    // classificação manual (Checklist Rápido)
    const manual = resp.classe; if (manual && manual !== 'Automática') semaforo = manual.startsWith('C') ? 'vermelho' : manual.startsWith('B') ? 'amarelo' : 'verde';
    const vistoriaSit = resp.situacao; // Ficha de vistoria: a situação da obra manda
    if (c.id === 'vistoria' && vistoriaSit) semaforo = vistoriaSit.startsWith('Aguardar') ? 'vermelho' : vistoriaSit.startsWith('Liberada com') ? (semaforo === 'vermelho' ? 'vermelho' : 'amarelo') : semaforo;
    return { semaforo, alertas, pendentes, respondidos, situacao: (App.cont.checklists_situacoes || {})[semaforo] };
  }

  /* ───────────────────────── formulário (checklist avulso ou vistoria do painel) ───────────────────────── */
  function telaForm() {
    const c = porId(K.aberto); const r = K.resp; const cab = r._cab || {}; const v = K.vistoriaId ? vPorId(K.vistoriaId) : null;
    return `<button class="btn link" onclick="App.ck.fechar()">${v ? '‹ Painel de vistorias' : '‹ Todos os checklists'}</button>
      <div class="card"><div class="linha"><span class="icone-grande ${c.cor || 'azul'}">${v ? '🏗️' : c.icone}</span><div class="cresce"><h2 style="margin:0">${esc(c.titulo)}</h2><div class="pequeno texto-2">${v ? `Nº <b>${esc(v.numero)}</b> · ${statusBadge(v)}` : esc(c.subtitulo)}</div></div></div><p class="pequeno mt-1" style="margin-bottom:0">${esc(c.intro)}</p></div>
      <div class="card"><h3>Identificação</h3><div class="grade-2">${c.cabecalho.map(f => `<div class="campo" style="margin:0"><label>${esc(f.l)}</label><input type="${f.tipo || 'text'}" value="${esc(cab[f.k] || '')}" oninput="App.ck.setCab('${f.k}',this.value)"></div>`).join('')}</div></div>
      ${c.secoes.map(s => v && s.id === 'fotos' ? fotosCardHtml(v, s) : `<div class="card"><h3>${esc(s.titulo)}</h3>${s.dica ? `<div class="ajuda" style="margin:-4px 0 8px">${esc(s.dica)}</div>` : ''}${s.itens.map(it => `<div id="ck-${it.id}" class="ck-item">${itemHtml(it, r[it.id])}</div>`).join('')}</div>`).join('')}
      <div id="ck-resultado">${resultadoHtml(c, r)}</div>
      ${v ? acoesVistoriaHtml(v) : ''}
      ${c.rodape ? `<p class="mini texto-3 centro">${esc(c.rodape)}</p>` : ''}
      <div class="botoes"><button class="btn cinza" onclick="App.ck.limpar()">🗑 Limpar${v ? ' respostas' : ''}</button><button class="btn contorno" onclick="App.ck.fechar()">Salvar e voltar</button></div>
      ${v ? `<button class="btn link bloco pequeno" style="color:var(--vermelho)" onclick="App.vist.excluir('${v.id}')">Excluir esta vistoria</button>` : ''}`;
  }
  function itemHtml(it, v) {
    const label = `<div class="ck-texto">${esc(it.texto)}</div>`;
    if (it.tipo === 'sn') return label + `<div class="chips">${[['sim', 'Sim'], ['nao', 'Não'], ['na', 'N.A.']].map(([k, l]) => `<button class="chip ${v === k ? (it.alerta === k ? 'vermelho ativo' : 'ativo') : ''}" onclick="App.ck.set('${it.id}','${k}')">${l}</button>`).join('')}</div>${v && it.alerta === v && it.msg ? `<div class="ck-msg ${it.gravidade || 'amarelo'}">⚠️ ${esc(it.msg)}</div>` : ''}`;
    if (it.tipo === 'escolha') { const o = v ? optObj(it, v) : null; return label + `<div class="chips">${it.opcoes.map(op => { const t = optTexto(op), g = typeof op === 'string' ? null : op.g; return `<button class="chip ${v === t ? (g ? 'vermelho ativo' : 'ativo') : ''}" onclick="App.ck.set('${it.id}',${JSON.stringify(t).replace(/"/g, '&quot;')})">${esc(t)}</button>`; }).join('')}</div>${o && o.g && o.msg ? `<div class="ck-msg ${o.g}">⚠️ ${esc(o.msg)}</div>` : ''}`; }
    if (it.tipo === 'multi') { const arr = Array.isArray(v) ? v : []; const msgs = arr.map(t => optObj(it, t)).filter(o => o && o.g && o.msg); return label + `<div class="chips">${it.opcoes.map(op => { const t = optTexto(op), g = typeof op === 'string' ? null : op.g; return `<button class="chip ${arr.includes(t) ? (g ? 'vermelho ativo' : 'ativo') : ''}" onclick="App.ck.toggle('${it.id}',${JSON.stringify(t).replace(/"/g, '&quot;')})">${esc(t)}</button>`; }).join('')}</div>${msgs.map(o => `<div class="ck-msg ${o.g}">⚠️ ${esc(o.msg)}</div>`).join('')}`; }
    if (it.tipo === 'check') return `<label class="caixa-opcao ${v ? 'ativa' : ''}"><input type="checkbox" ${v ? 'checked' : ''} onchange="App.ck.set('${it.id}',this.checked)"><span class="pequeno">${esc(it.texto)}</span></label>`;
    if (it.tipo === 'texto') return `<div class="campo" style="margin:0 0 10px"><label>${esc(it.texto)}</label><textarea rows="2" style="min-height:54px" oninput="App.ck.set('${it.id}',this.value,true)">${esc(v || '')}</textarea></div>`;
    return '';
  }
  function resultadoHtml(c, r) {
    const av = avaliar(c, r); const sit = av.situacao || {}; const fundo = { vermelho: '#FDE8E8', amarelo: '#FFF3E0', verde: '#E3F5EA' }[av.semaforo];
    const prep = Array.isArray(r.prep) ? r.prep : [];
    return `<div class="card" style="background:${fundo}"><div class="negrito">${sit.emoji || ''} ${esc(sit.rotulo || '')}</div><div class="pequeno mt-1">${esc(sit.orientacao || '')}</div>
      ${av.pendentes ? `<div class="mini texto-3 mt-1">${av.pendentes} item(ns) ainda sem resposta.</div>` : ''}
      ${av.alertas.length ? `<div class="pequeno mt-1"><b>Pontos de atenção (${av.alertas.length}):</b><ul style="padding-left:18px;margin:4px 0 0">${av.alertas.map(a => `<li>${a.gravidade === 'vermelho' ? '🔴' : '🟡'} ${esc(a.texto)}${a.msg ? ' — ' + esc(a.msg) : ''}</li>`).join('')}</ul></div>` : ''}
      ${prep.length ? `<div class="pequeno mt-1"><b>Preparação definida:</b> ${esc(prep.join(', '))}</div>` : ''}</div>
      <div class="botoes"><a class="btn verde" href="${zap(texto(c, r))}" target="_blank" rel="noopener" onclick="App.ck.enviar()">📲 Enviar pelo WhatsApp</a><button class="btn azul" onclick="App.ck.copiar()">📋 Copiar texto</button></div>
      ${av.semaforo !== 'verde' ? `<button class="btn link bloco" onclick="App.ck.especificar()">📐 Montar a especificação com o Especificador ›</button>` : `<button class="btn link bloco" onclick="App.ck.especificar()">📐 Seguir para o Especificador ›</button>`}`;
  }
  function atualizarResultado() { const c = porId(K.aberto); const res = $('#ck-resultado'); if (c && res) res.innerHTML = resultadoHtml(c, K.resp); }
  function atualizarItem(id) { const c = porId(K.aberto); const it = c.secoes.flatMap(s => s.itens).find(x => x.id === id); const el = $('#ck-' + id); if (el && it && it.tipo !== 'texto') el.innerHTML = itemHtml(it, K.resp[id]); atualizarResultado(); }
  App.ck.set = (id, v, quieto) => { K.resp[id] = v; salvar(); if (quieto) atualizarResultado(); else atualizarItem(id); };
  App.ck.toggle = (id, t) => { const arr = Array.isArray(K.resp[id]) ? K.resp[id].slice() : []; const i = arr.indexOf(t); if (i >= 0) arr.splice(i, 1); else { if (/^(Nenhum|Não possui)/.test(t)) arr.length = 0; else { for (let k = arr.length - 1; k >= 0; k--) if (/^(Nenhum|Não possui)/.test(arr[k])) arr.splice(k, 1); } arr.push(t); } K.resp[id] = arr; salvar(); atualizarItem(id); };
  App.ck.setCab = (k, v) => { K.resp._cab = K.resp._cab || {}; K.resp._cab[k] = v; salvar(); atualizarResultado(); };

  /* ───────────────────────── texto para WhatsApp ───────────────────────── */
  const legendaFoto = (f, i) => `${i + 1}. ${[f.local, f.problema].map(x => String(x || '').trim()).filter(Boolean).join(' — ') || 'sem descrição'}`;
  function texto(c, r, vOpc) {
    const v = vOpc || (c.id === 'vistoria' && K.vistoriaId ? vPorId(K.vistoriaId) : null);
    const cab = r._cab || {}; const av = avaliar(c, r); const sit = av.situacao || {};
    const l = [`*${c.titulo.toUpperCase()} — Só Tintas*`];
    if (v) l.push(`Vistoria nº ${v.numero}${v.status === 'concluida' ? ' · concluída' : ''}`);
    const id = c.cabecalho.map(f => cab[f.k] ? `${f.l.split(' (')[0]}: ${f.tipo === 'date' ? fmtData(cab[f.k]) : cab[f.k]}` : '').filter(Boolean);
    if (id.length) l.push(id.join(' · '));
    if (App.user) l.push(`Atendimento: ${App.user.nome}${App.user.loja ? ' · ' + App.user.loja : ''}`);
    for (const s of c.secoes) {
      if (v && s.id === 'fotos') continue; // no painel, as fotos reais entram no bloco abaixo
      const linhas = [];
      for (const it of s.itens) {
        const vv = r[it.id];
        if (it.tipo === 'sn' && vv) linhas.push(`${it.alerta && vv === it.alerta ? '⚠️' : vv === 'na' ? '➖' : '✅'} ${it.texto} — ${vv === 'sim' ? 'Sim' : vv === 'nao' ? 'Não' : 'N.A.'}${it.alerta && vv === it.alerta && it.msg ? ' → ' + it.msg : ''}`);
        else if (it.tipo === 'escolha' && vv) { const o = optObj(it, vv); linhas.push(`${o && o.g ? '⚠️' : '•'} ${it.texto}: ${vv}${o && o.g && o.msg ? ' → ' + o.msg : ''}`); }
        else if (it.tipo === 'multi' && Array.isArray(vv) && vv.length) { linhas.push(`• ${it.texto} ${vv.join(', ')}`); for (const t of vv) { const o = optObj(it, t); if (o && o.g && o.msg) linhas.push(`   ⚠️ ${t}: ${o.msg}`); } }
        else if (it.tipo === 'check') linhas.push(`${vv ? '☑' : '☐'} ${it.texto}`);
        else if (it.tipo === 'texto' && vv && String(vv).trim()) linhas.push(`• ${it.texto}: ${String(vv).trim()}`);
      }
      if (linhas.length) { l.push(''); l.push(`*${s.titulo.toUpperCase()}*`); l.push(...linhas); }
    }
    if (v) { l.push(''); l.push('*5. REGISTRO FOTOGRÁFICO*'); l.push(v.fotos.length ? `${v.fotos.length} foto(s) — veja no relatório em PDF da vistoria` : 'Nenhuma foto registrada'); v.fotos.forEach((f, i) => l.push('📷 ' + legendaFoto(f, i))); }
    l.push(''); l.push(`*RESULTADO: ${sit.emoji || ''} ${(sit.rotulo || '').toUpperCase()}*`); if (sit.orientacao) l.push(sit.orientacao);
    if (av.pendentes) l.push(`(${av.pendentes} item(ns) não avaliado(s))`);
    l.push(''); l.push('_Gerado no MENTOR ST PRO · Só Tintas. Confira sempre a superfície no local e a ficha técnica dos produtos._');
    return l.join('\n');
  }
  App.ck.copiar = async () => { const c = porId(K.aberto); try { await navigator.clipboard.writeText(texto(c, K.resp)); App.toast('Checklist copiado ✔'); } catch (e) { App.toast('Não foi possível copiar — use "Enviar pelo WhatsApp"'); } App.ck.enviar(); };
  // Registra o envio: guarda no histórico (ou marca a vistoria) e dá ST na 1ª vez de cada checklist
  App.ck.enviar = async () => {
    const c = porId(K.aberto); if (!c) return;
    const av = avaliar(c, K.resp); const cab = K.resp._cab || {};
    if (K.vistoriaId) { const v = vPorId(K.vistoriaId); if (v) { v.enviado_em = agora(); vSalvar(); } }
    else {
      const ultimo = K.historico[K.historico.length - 1];
      const t = texto(c, K.resp);
      if (!(ultimo && ultimo.checklist_id === c.id && ultimo.texto === t)) {
        K.historico.push({ id: uid(), checklist_id: c.id, criado_em: agora(), cliente: cab.cliente || '', local: cab.local || '', semaforo: av.semaforo, respostas: JSON.parse(JSON.stringify(K.resp)), texto: t });
        salvar();
      }
    }
    if (!App.feito('checklist', c.id)) { try { await App.concluir('checklist', c.id, K.vistoriaId ? 'Vistoria enviada ao cliente!' : 'Checklist enviado ao cliente!', { semaforo: av.semaforo, alertas: av.alertas.length }); } catch (e) {} }
  };
  // Leva as respostas para o Especificador (superfície + condições)
  App.ck.especificar = () => {
    const r = K.resp; const E = App.espec && App.espec.E; if (!E) return;
    const mapaSup = { 'Reboco': 'reboco_antigo', 'Massa corrida': 'massa_corrida', 'Massa acrílica': 'massa_acrilica', 'Concreto': 'concreto', 'Gesso': 'gesso', 'Drywall': 'drywall', 'Madeira': 'madeira_pintada', 'Metal': 'metal_ferroso', 'Já pintada': 'pintada_fosca' };
    if (r.superficie && mapaSup[r.superficie]) E.superficie = mapaSup[r.superficie];
    if (r.superficie === 'Reboco' && Array.isArray(r.situacao) && r.situacao.includes('Nova')) E.superficie = 'reboco_novo';
    // só o que acendeu alerta vira "condição encontrada" no Especificador
    const c = porId(K.aberto); const av = c ? avaliar(c, r) : { alertas: [] };
    const txt = av.alertas.map(a => a.texto + ' ' + a.msg).join(' | ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const cond = [];
    const regras = [['mofo', /mofo|bolor/], ['gordura', /gordura|oleo|contamina/], ['pulverulenta', /\bpo\b|pulverulent|esfarel|calcina/], ['descascando', /descasc|bolha|aderencia|solt/], ['umidade', /umid|infiltra|vazament|eflorescencia|sais/], ['brilhante', /brilh|lisa/], ['fissuras', /fissura|trinca/], ['ferrugem', /ferrugem|corros/], ['reparos', /reparo|remendo/]];
    for (const [id, re] of regras) if (re.test(txt)) cond.push(id);
    E.condicoes = cond; E.cliente = (r._cab && r._cab.cliente) || E.cliente; E.resultado = null;
    salvar(); App.cache.abaAssessor = 'espec'; location.hash = '#/assessor/espec'; App.toast('Superfície e condições levadas para o Especificador');
  };

  /* ───────────────────────── atalho dentro do módulo da trilha ───────────────────────── */
  App.ck.cardModulo = (moduloId) => {
    const c = lista().find(x => x.modulo_id === moduloId); if (!c) return '';
    if (c.id === 'vistoria') return `<div class="card destaque"><div class="etiqueta amarela">Ferramenta prática</div><div class="negrito mt-1">🏗️ Painel digital de Vistorias de Obra</div><p class="pequeno texto-2" style="margin:4px 0 8px">Preencha a ficha no celular, fotografe a obra, gere o relatório em PDF e envie ao cliente ou ao pintor (+${ST_CHECK()} ST na 1ª vistoria).</p><button class="btn pequeno" onclick="App.ck.abrir('vistoria')">Abrir painel de vistorias ›</button></div>`;
    return `<div class="card destaque"><div class="etiqueta amarela">Ferramenta prática</div><div class="negrito mt-1">${c.icone} ${esc(c.titulo)} — versão dinâmica</div><p class="pequeno texto-2" style="margin:4px 0 8px">Preencha com o cliente, veja a classificação da parede e envie pelo WhatsApp (+${ST_CHECK()} ST na 1ª vez).</p><button class="btn pequeno" onclick="App.ck.abrir('${c.id}')">Abrir checklist ›</button></div>`;
  };

  /* ═══════════════════════════════════════════════════════════════
     PAINEL DE VISTORIAS DE OBRA (aba 🏗️ Vistorias)
     Cada vistoria = registro numerado (V-001…) com as respostas da ficha,
     fotos (IndexedDB), status (em andamento / concluída), semáforo,
     relatório em PDF (impressão) e compartilhamento com fotos.
     ═══════════════════════════════════════════════════════════════ */
  const VKEY = () => 'mentorst_vistorias_' + loginAtual();
  const V = { carregado: false, login: null, lista: [], busca: '', filtro: 'todas', fotosCarregadas: new Set(), semBanco: false };
  const FBLOB = {}, FURL = {}; // fotos em memória (blob + URL) — a cópia durável fica no IndexedDB
  function vInit() { if (V.carregado && V.login === loginAtual()) return; try { const d = JSON.parse(localStorage.getItem(VKEY())) || {}; V.lista = Array.isArray(d.vistorias) ? d.vistorias : []; } catch (e) { V.lista = []; } for (const v of V.lista) { v.fotos = Array.isArray(v.fotos) ? v.fotos : []; v.respostas = v.respostas || {}; } V.carregado = true; V.login = loginAtual(); }
  function vSalvar() {
    const v = K.vistoriaId ? vPorId(K.vistoriaId) : null;
    if (v) { v.respostas = K.resp; v.atualizado_em = agora(); const c = porId('vistoria'); if (c) v.semaforo = avaliar(c, v.respostas).semaforo; }
    try { localStorage.setItem(VKEY(), JSON.stringify({ vistorias: V.lista })); } catch (e) { App.toast('Não foi possível guardar a vistoria neste navegador'); }
  }
  const vPorId = (id) => V.lista.find(v => v.id === id) || null;
  const statusBadge = (v) => v.status === 'concluida' ? '<span class="etiqueta verde mini">✔ Concluída</span>' : '<span class="etiqueta azul mini">⏳ Em andamento</span>';
  const sitDe = (v) => (App.cont.checklists_situacoes || {})[v.semaforo || 'verde'] || {};
  const emojiDe = (v) => (v.respostas && v.respostas.situacao) || v.status === 'concluida' ? (sitDe(v).emoji || '📋') : '📝';
  App.vist = {};

  /* fotos: IndexedDB (blobs reduzidos) ------------------------------------------------ */
  let idb = null;
  function abrirDB() {
    return new Promise((res, rej) => {
      if (idb) return res(idb); if (!global.indexedDB) return rej(new Error('sem IndexedDB'));
      const rq = indexedDB.open('mentorst_fotos', 1);
      rq.onupgradeneeded = () => { const db = rq.result; if (!db.objectStoreNames.contains('fotos')) db.createObjectStore('fotos', { keyPath: 'id' }); };
      rq.onsuccess = () => { idb = rq.result; res(idb); }; rq.onerror = () => rej(rq.error || new Error('IndexedDB indisponível')); rq.onblocked = () => rej(new Error('IndexedDB bloqueado'));
    });
  }
  const dbOp = (modo, fn) => abrirDB().then(db => new Promise((res, rej) => { const tx = db.transaction('fotos', modo); const rq = fn(tx.objectStore('fotos')); tx.oncomplete = () => res(rq && rq.result); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('abortado')); }));
  const fotoGravar = (reg) => dbOp('readwrite', st => st.put(reg));
  const fotoLer = (id) => dbOp('readonly', st => st.get(id));
  const fotoApagar = (id) => dbOp('readwrite', st => st.delete(id));
  async function reduzir(file, max) { // reduz a foto (lado maior = 1280 px, JPEG 72%) para caber no aparelho e no compartilhamento
    max = max || 1280;
    let w, h, fonte;
    try { fonte = await createImageBitmap(file, { imageOrientation: 'from-image' }); w = fonte.width; h = fonte.height; }
    catch (e) { fonte = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); }); w = fonte.naturalWidth; h = fonte.naturalHeight; }
    const s = Math.min(1, max / Math.max(w, h)); const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w * s)); cv.height = Math.max(1, Math.round(h * s));
    cv.getContext('2d').drawImage(fonte, 0, 0, cv.width, cv.height); if (fonte.close) fonte.close();
    return new Promise(res => cv.toBlob(b => res(b || file), 'image/jpeg', 0.72));
  }
  async function carregarFotos(v) {
    if (V.fotosCarregadas.has(v.id)) return;
    for (const f of v.fotos) { if (FBLOB[f.id]) continue; try { const reg = await fotoLer(f.id); if (reg && reg.blob) { FBLOB[f.id] = reg.blob; FURL[f.id] = URL.createObjectURL(reg.blob); } } catch (e) {} }
    V.fotosCarregadas.add(v.id);
  }
  const naVistoria = (v) => App.rota.view === 'assessor' && App.rota.params[0] === 'vistoria' && App.rota.params[1] === v.id;

  /* abrir / navegar ------------------------------------------------------------------- */
  function vAbrirSilencioso(v) {
    if (K.vistoriaId && K.vistoriaId !== v.id) salvar();
    K.aberto = 'vistoria'; K.vistoriaId = v.id; K.resp = v.respostas || (v.respostas = {});
    if (!K.resp._cab) K.resp._cab = {}; if (!K.resp._cab.data) K.resp._cab.data = hoje();
    App.cache.abaAssessor = 'vistoria';
  }
  function telaVistoria(resto) {
    init(); vInit(); const id = resto && resto[0];
    if (!id) { if (K.vistoriaId) { salvar(); K.aberto = null; K.vistoriaId = null; } return telaPainel(); }
    const v = vPorId(id);
    if (!v) return `<div class="card erro"><h3>Vistoria não encontrada</h3><p class="pequeno">Ela pode ter sido excluída ou registrada em outro aparelho.</p><button class="btn" onclick="location.hash='#/assessor/vistoria'">Voltar ao painel</button></div>`;
    if (!V.fotosCarregadas.has(v.id)) { if (v.fotos.length) carregarFotos(v).then(() => { if (naVistoria(v)) App.render(); }); else V.fotosCarregadas.add(v.id); }
    if (K.vistoriaId !== v.id) vAbrirSilencioso(v);
    if (resto[1] === 'relatorio') return telaRelatorio(v);
    return telaForm();
  }
  App.vist.ir = () => { App.cache.abaAssessor = 'vistoria'; irPara('#/assessor/vistoria'); };
  App.vist.abrir = (id) => { vInit(); const v = vPorId(id); if (!v) return; carregarFotos(v).then(() => { vAbrirSilencioso(v); irPara('#/assessor/vistoria/' + v.id); }); };
  App.vist.nova = () => {
    vInit();
    const n = V.lista.reduce((m, v) => Math.max(m, parseInt(String(v.numero || '').replace(/\D/g, ''), 10) || 0), 0) + 1;
    const v = { id: uid(), numero: 'V-' + String(n).padStart(3, '0'), status: 'aberta', criado_em: agora(), atualizado_em: agora(), semaforo: 'verde', respostas: { _cab: { data: hoje(), responsavel: App.user ? App.user.nome : '' } }, fotos: [] };
    V.lista.push(v); vSalvar(); V.fotosCarregadas.add(v.id); vAbrirSilencioso(v); irPara('#/assessor/vistoria/' + v.id);
  };
  App.vist.importar = (h) => { // vistoria enviada antes do painel existir (histórico dos checklists)
    vInit(); if (V.lista.some(v => v.origem_hist === h.id)) { App.vist.abrir(V.lista.find(v => v.origem_hist === h.id).id); return; }
    const n = V.lista.reduce((m, v) => Math.max(m, parseInt(String(v.numero || '').replace(/\D/g, ''), 10) || 0), 0) + 1;
    const v = { id: uid(), numero: 'V-' + String(n).padStart(3, '0'), status: 'concluida', criado_em: h.criado_em || agora(), atualizado_em: agora(), concluido_em: h.criado_em || agora(), enviado_em: h.criado_em, semaforo: h.semaforo || 'verde', respostas: JSON.parse(JSON.stringify(h.respostas || {})), fotos: [], origem_hist: h.id };
    V.lista.push(v); vSalvar(); App.toast('Vistoria do histórico levada para o painel'); App.vist.abrir(v.id);
  };
  App.vist.buscar = (q) => { V.busca = q || ''; const el = $('#vp-lista'); if (el) el.innerHTML = listaPainelHtml(); };
  App.vist.filtrar = (f) => { V.filtro = f; App.render(); };
  App.vist.excluir = (id) => {
    const v = vPorId(id); if (!v) return; const cab = v.respostas._cab || {};
    App.confirmar(`Excluir a vistoria ${esc(v.numero)}${cab.cliente ? ' de ' + esc(cab.cliente) : ''}? As fotos também serão apagadas deste aparelho.`, async () => {
      for (const f of v.fotos) { try { await fotoApagar(f.id); } catch (e) {} if (FURL[f.id]) URL.revokeObjectURL(FURL[f.id]); delete FURL[f.id]; delete FBLOB[f.id]; }
      V.lista = V.lista.filter(x => x.id !== id); if (K.vistoriaId === id) { K.vistoriaId = null; K.aberto = null; }
      vSalvar(); App.toast('Vistoria excluída'); irPara('#/assessor/vistoria');
    }, 'Excluir');
  };
  App.vist.concluir = () => {
    const v = vPorId(K.vistoriaId); if (!v) return;
    if (!K.resp.situacao) { App.toast('Defina a <b>Situação da obra</b> (seção 4) antes de concluir'); const el = $('#ck-situacao'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    App.confirmar('Concluir esta vistoria? Ela continua disponível no painel e pode ser reaberta.', async () => {
      v.status = 'concluida'; v.concluido_em = agora(); vSalvar(); App.render();
      if (!App.feito('checklist', 'vistoria')) { try { await App.concluir('checklist', 'vistoria', 'Primeira vistoria concluída!', { semaforo: v.semaforo, fotos: v.fotos.length }); } catch (e) {} }
      else App.toast('Vistoria concluída ✔');
    }, 'Concluir');
  };
  App.vist.reabrirStatus = () => { const v = vPorId(K.vistoriaId); if (!v) return; v.status = 'aberta'; delete v.concluido_em; vSalvar(); App.render(); App.toast('Vistoria reaberta para edição'); };

  /* fotos: ações ---------------------------------------------------------------------- */
  App.vist.addFotos = async (input) => {
    const v = vPorId(K.vistoriaId); if (!v) return;
    const files = Array.from(input.files || []); input.value = ''; if (!files.length) return;
    App.toast(`Processando ${files.length} foto(s)…`);
    let ok = 0;
    for (const f of files) {
      try {
        const blob = await reduzir(f); const id = uid();
        FBLOB[id] = blob; FURL[id] = URL.createObjectURL(blob);
        v.fotos.push({ id, local: '', problema: '', criado_em: agora() }); ok++;
        try { await fotoGravar({ id, vistoria_id: v.id, blob, criado_em: agora() }); } catch (e) { V.semBanco = true; }
      } catch (e) { console.warn(e); }
    }
    K.resp.fotos = v.fotos.length ? 'Sim' : 'Não'; if (v.fotos.length) K.resp.res3 = true;
    vSalvar(); atualizarFotos(v); atualizarItem('res3');
    if (!ok) App.toast('Não foi possível ler as fotos escolhidas');
    else if (V.semBanco) App.toast('⚠️ Este navegador não guarda fotos entre sessões — gere o PDF antes de fechar');
    else App.toast(`${ok} foto(s) adicionada(s) ✔`);
    const ultima = v.fotos[v.fotos.length - 1]; const campo = ultima && $('#vf-local-' + ultima.id); if (campo && files.length === 1) campo.focus();
  };
  App.vist.setFoto = (id, campo, valor) => { const v = vPorId(K.vistoriaId); const f = v && v.fotos.find(x => x.id === id); if (!f) return; f[campo] = valor; vSalvar(); atualizarResultado(); };
  App.vist.delFoto = (id) => {
    const v = vPorId(K.vistoriaId); if (!v) return;
    App.confirmar('Remover esta foto da vistoria?', async () => {
      v.fotos = v.fotos.filter(f => f.id !== id); try { await fotoApagar(id); } catch (e) {} if (FURL[id]) URL.revokeObjectURL(FURL[id]); delete FURL[id]; delete FBLOB[id];
      K.resp.fotos = v.fotos.length ? 'Sim' : 'Não'; vSalvar(); atualizarFotos(v); atualizarResultado();
    }, 'Remover');
  };
  App.vist.verFoto = (id) => { const v = vPorId(K.vistoriaId); const i = v ? v.fotos.findIndex(f => f.id === id) : -1; const f = i >= 0 ? v.fotos[i] : null; if (!f || !FURL[id]) return; App.modal(`<div class="modal" style="padding:10px"><img src="${FURL[id]}" alt="" style="width:100%;max-height:70vh;object-fit:contain;border-radius:10px;background:#000"><div class="pequeno mt-1">${esc(legendaFoto(f, i))}</div><div class="botoes mt-1"><button class="btn cinza" onclick="App.fecharModal()">Fechar</button></div></div>`); };
  function fotosCardHtml(v, s) {
    return `<div class="card" id="ck-fotos-card"><h3>${esc((s && s.titulo) || '5. Registro fotográfico')} ${v.fotos.length ? `<span class="etiqueta azul mini">${v.fotos.length}</span>` : ''}</h3><div class="ajuda" style="margin:-4px 0 8px">${esc((s && s.dica) || 'Fotos gerais e aproximadas, antes de qualquer intervenção. Anote local e problema de cada foto.')}</div>
      ${v.fotos.length ? `<div class="vf-grade">${v.fotos.map((f, i) => `<div class="vf-item">${FURL[f.id] ? `<img src="${FURL[f.id]}" alt="Foto ${i + 1}" onclick="App.vist.verFoto('${f.id}')">` : '<div class="vf-vazia">foto não disponível neste aparelho</div>'}<span class="vf-num">${i + 1}</span><button class="vf-del" title="Remover" onclick="App.vist.delFoto('${f.id}')">✕</button><input id="vf-local-${f.id}" placeholder="Local (ex.: sala, parede norte)" value="${esc(f.local || '')}" oninput="App.vist.setFoto('${f.id}','local',this.value)"><input placeholder="Problema observado" value="${esc(f.problema || '')}" oninput="App.vist.setFoto('${f.id}','problema',this.value)"></div>`).join('')}</div>` : '<p class="pequeno texto-3" style="margin:0 0 10px">Nenhuma foto ainda. Fotografe cada problema antes de qualquer intervenção — a foto protege o pintor e orienta o orçamento.</p>'}
      <div class="botoes"><label class="btn azul">📷 Tirar foto<input type="file" accept="image/*" capture="environment" onchange="App.vist.addFotos(this)"></label><label class="btn contorno azul">🖼️ Da galeria<input type="file" accept="image/*" multiple onchange="App.vist.addFotos(this)"></label></div></div>`;
  }
  function atualizarFotos(v) { const el = $('#ck-fotos-card'); if (el) el.outerHTML = fotosCardHtml(v, (porId('vistoria').secoes || []).find(s => s.id === 'fotos')); }
  function acoesVistoriaHtml(v) {
    return `<div class="card info"><h3>📄 Relatório da vistoria</h3><p class="pequeno texto-2" style="margin:0 0 10px">Relatório com identificação, respostas, resultado e as fotos legendadas — para enviar ao cliente ou ao pintor, imprimir ou guardar em PDF.</p>
      <div class="botoes"><button class="btn azul" onclick="App.vist.relatorio('${v.id}')">📄 Ver relatório / PDF</button>${global.navigator && navigator.share ? `<button class="btn contorno azul" onclick="App.vist.compartilhar('${v.id}')">📤 Compartilhar com fotos</button>` : ''}</div>
      <div class="botoes mt-1">${v.status === 'concluida' ? `<button class="btn contorno" onclick="App.vist.reabrirStatus()">🔓 Reabrir vistoria</button>` : `<button class="btn verde" onclick="App.vist.concluir()">✔ Concluir vistoria</button>`}</div></div>`;
  }

  /* painel ---------------------------------------------------------------------------- */
  function telaPainel() {
    const todas = V.lista.slice().sort((a, b) => String(b.atualizado_em || '').localeCompare(String(a.atualizado_em || '')));
    const conc = todas.filter(v => v.status === 'concluida');
    const cont = { abertas: todas.length - conc.length, verde: conc.filter(v => v.semaforo === 'verde').length, amarelo: conc.filter(v => v.semaforo === 'amarelo').length, vermelho: conc.filter(v => v.semaforo === 'vermelho').length };
    return `<div class="card"><div class="linha"><span class="icone-grande cinza">🏗️</span><div class="cresce"><h2 style="margin:0">Vistorias de obra</h2><div class="pequeno texto-2">Painel digital da Ficha de Vistoria</div></div></div><p class="pequeno mt-1" style="margin-bottom:10px">Leve o celular até a obra: registre as condições, fotografe os problemas, gere o relatório em PDF e envie ao cliente ou ao pintor. A 1ª vistoria vale <b>+${ST_CHECK()} ST</b>.</p><button class="btn bloco" onclick="App.vist.nova()">＋ Nova vistoria</button></div>
      <div class="vp-tiles"><div class="vp-tile"><b>${cont.abertas}</b><span>Em andamento</span></div><div class="vp-tile verde"><b>${cont.verde}</b><span>🟢 Liberadas</span></div><div class="vp-tile amarelo"><b>${cont.amarelo}</b><span>🟡 Com ressalvas</span></div><div class="vp-tile vermelho"><b>${cont.vermelho}</b><span>🔴 Aguardando</span></div></div>
      ${todas.length ? `<div class="campo" style="margin-bottom:8px"><input type="search" placeholder="🔎 Buscar por cliente, endereço ou nº" value="${esc(V.busca)}" oninput="App.vist.buscar(this.value)"></div><div class="chips mb-2">${[['todas', 'Todas'], ['abertas', 'Em andamento'], ['concluidas', 'Concluídas']].map(([k, l]) => `<button class="chip ${V.filtro === k ? 'ativo' : ''}" onclick="App.vist.filtrar('${k}')">${l}</button>`).join('')}</div>` : ''}
      <div id="vp-lista">${listaPainelHtml()}</div>
      <p class="mini texto-3 centro mt-2">As vistorias ficam guardadas neste aparelho. Gere o PDF para arquivar ou enviar.</p>`;
  }
  function listaPainelHtml() {
    const todas = V.lista.slice().sort((a, b) => String(b.atualizado_em || '').localeCompare(String(a.atualizado_em || '')));
    const q = V.busca.trim().toLowerCase();
    const filt = todas.filter(v => { const cab = v.respostas._cab || {}; return (V.filtro === 'todas' || (V.filtro === 'abertas' ? v.status !== 'concluida' : v.status === 'concluida')) && (!q || [cab.cliente, cab.local, cab.telefone, v.numero].join(' ').toLowerCase().includes(q)); });
    if (!filt.length) return `<div class="card"><p class="pequeno texto-3 centro" style="margin:0">${todas.length ? 'Nenhuma vistoria encontrada com esse filtro.' : 'Nenhuma vistoria ainda. Toque em <b>Nova vistoria</b> para começar.'}</p></div>`;
    return filt.map(v => { const cab = v.respostas._cab || {}; const sit = v.respostas.situacao; const cor = { verde: 'verde', amarelo: 'amarela', vermelho: 'vermelha' }[v.semaforo] || 'cinza';
      return `<div class="item-lista" onclick="App.vist.abrir('${v.id}')"><span class="num">${emojiDe(v)}</span><div class="cresce"><div class="titulo">${esc(cab.cliente || 'Sem nome')} <span class="mini texto-3">${esc(v.numero)}</span></div><div class="desc">${cab.local ? esc(cab.local) + ' · ' : ''}${fmtData(cab.data) || fmtData(v.criado_em)}${v.fotos.length ? ' · 📷 ' + v.fotos.length : ''}</div><div class="mt-1">${statusBadge(v)}${sit ? ` <span class="etiqueta ${cor} mini">${esc(sit)}</span>` : ''}</div></div><span class="seta">›</span></div>`; }).join('');
  }

  /* relatório (tela + impressão/PDF) ---------------------------------------------------- */
  App.vist.relatorio = (id) => { App.cache.abaAssessor = 'vistoria'; irPara('#/assessor/vistoria/' + id + '/relatorio'); };
  App.vist.imprimir = () => { setTimeout(() => window.print(), 60); };
  function telaRelatorio(v) {
    const c = porId('vistoria'); const r = v.respostas || {}; const cab = r._cab || {}; const av = avaliar(c, r); const sit = av.situacao || {};
    const fundo = { vermelho: '#FDE8E8', amarelo: '#FFF3E0', verde: '#E3F5EA' }[av.semaforo];
    const linhas = (s) => { const out = [];
      for (const it of s.itens) { const vv = r[it.id];
        if (it.tipo === 'sn' && vv) { const al = it.alerta && vv === it.alerta; out.push(`<li class="${al ? (it.gravidade || 'amarelo') : ''}">${al ? '⚠️' : vv === 'na' ? '➖' : '✅'} ${esc(it.texto)} — <b>${vv === 'sim' ? 'Sim' : vv === 'nao' ? 'Não' : 'N.A.'}</b>${al && it.msg ? ' → ' + esc(it.msg) : ''}</li>`); }
        else if (it.tipo === 'escolha' && vv) { const o = optObj(it, vv); out.push(`<li class="${o && o.g ? o.g : ''}">${o && o.g ? '⚠️' : '•'} ${esc(it.texto)}: <b>${esc(vv)}</b>${o && o.g && o.msg ? ' → ' + esc(o.msg) : ''}</li>`); }
        else if (it.tipo === 'multi' && Array.isArray(vv) && vv.length) { out.push(`<li>• ${esc(it.texto)}: <b>${esc(vv.join(', '))}</b></li>`); for (const t of vv) { const o = optObj(it, t); if (o && o.g && o.msg) out.push(`<li class="${o.g}">&nbsp;&nbsp;⚠️ ${esc(t)}: ${esc(o.msg)}</li>`); } }
        else if (it.tipo === 'check') out.push(`<li>${vv ? '☑' : '☐'} ${esc(it.texto)}</li>`);
        else if (it.tipo === 'texto' && vv && String(vv).trim()) out.push(`<li>• ${esc(it.texto)}: <b>${esc(String(vv).trim())}</b></li>`);
      } return out; };
    return `<div class="nao-imprimir botoes" style="margin-bottom:12px"><button class="btn contorno" onclick="App.vist.abrir('${v.id}')">‹ Voltar</button><button class="btn" onclick="App.vist.imprimir()">🖨️ Imprimir / Salvar PDF</button>${global.navigator && navigator.share ? `<button class="btn azul" onclick="App.vist.compartilhar('${v.id}')">📤 Compartilhar</button>` : ''}</div>
      <div class="rel" id="rel-vistoria">
        <div class="rel-topo"><div class="rel-marca">SÓ TINTAS</div><div><div class="rel-titulo">Ficha de Vistoria de Obra</div><div class="rel-sub">Nº ${esc(v.numero)} · ${fmtData(cab.data) || fmtData(v.criado_em)} · ${v.status === 'concluida' ? 'Concluída' : 'Em andamento'}</div></div><div class="rel-sem ${av.semaforo}">${sit.emoji || ''} ${esc((sit.rotulo || '').split(' — ')[0])}</div></div>
        <table class="rel-tab">${c.cabecalho.map(f => `<tr><td>${esc(f.l)}</td><td>${esc(f.tipo === 'date' ? fmtData(cab[f.k]) : (cab[f.k] || '—'))}</td></tr>`).join('')}${App.user ? `<tr><td>Atendimento</td><td>${esc(App.user.nome)}${App.user.loja ? ' · ' + esc(App.user.loja) : ''}</td></tr>` : ''}</table>
        ${c.secoes.map(s => { if (s.id === 'fotos') return `<div class="rel-secao"><h4>${esc(s.titulo)} (${v.fotos.length})</h4>${v.fotos.length ? `<div class="rel-fotos">${v.fotos.map((f, i) => `<div class="rel-foto">${FURL[f.id] ? `<img src="${FURL[f.id]}" alt="Foto ${i + 1}">` : '<div class="vf-vazia">foto não disponível neste aparelho</div>'}<div>📷 ${esc(legendaFoto(f, i))}</div></div>`).join('')}</div>` : '<p class="pequeno texto-3" style="margin:4px 0 0 12px">Nenhuma foto registrada.</p>'}</div>`; const ls = linhas(s); return ls.length ? `<div class="rel-secao"><h4>${esc(s.titulo)}</h4><ul>${ls.join('')}</ul></div>` : ''; }).join('')}
        <div class="rel-res" style="background:${fundo}"><b>${sit.emoji || ''} ${esc(sit.rotulo || '')}</b><div>${esc(sit.orientacao || '')}</div>${av.alertas.length ? `<div class="mt-1"><b>Pontos de atenção (${av.alertas.length}):</b><ul style="margin:4px 0 0;padding-left:18px">${av.alertas.map(a => `<li>${a.gravidade === 'vermelho' ? '🔴' : '🟡'} ${esc(a.texto)}${a.msg ? ' — ' + esc(a.msg) : ''}</li>`).join('')}</ul></div>` : ''}${av.pendentes ? `<div class="mini mt-1">${av.pendentes} item(ns) não avaliado(s).</div>` : ''}</div>
        <div class="rel-ass"><div>Responsável pela vistoria${cab.responsavel ? '<br><b>' + esc(cab.responsavel) + '</b>' : ''}</div><div>Cliente${cab.cliente ? '<br><b>' + esc(cab.cliente) + '</b>' : ''}</div></div>
        <div class="rel-rodape">Gerado no MENTOR ST PRO · Só Tintas · ${esc(fmtHora(agora()))}. Confira sempre a superfície no local e a ficha técnica dos produtos.</div>
      </div>`;
  }
  App.vist.compartilhar = async (id) => { // Web Share: texto + fotos (abre a folha de compartilhamento do celular — WhatsApp, e-mail…)
    const v = vPorId(id || K.vistoriaId); if (!v) return; const c = porId('vistoria');
    await carregarFotos(v);
    const t = texto(c, v.respostas, v);
    const files = v.fotos.map((f, i) => FBLOB[f.id] ? new File([FBLOB[f.id]], `vistoria-${v.numero}-${String(i + 1).padStart(2, '0')}.jpg`, { type: 'image/jpeg' }) : null).filter(Boolean);
    try {
      if (files.length && navigator.canShare && navigator.canShare({ files })) await navigator.share({ title: `Vistoria ${v.numero} — Só Tintas`, text: t, files });
      else if (navigator.share) { await navigator.share({ title: `Vistoria ${v.numero} — Só Tintas`, text: t }); if (files.length) App.toast('Este navegador não compartilha fotos — use o relatório em PDF'); }
      else global.open(zap(t), '_blank', 'noopener');
      v.enviado_em = agora(); vSalvar();
      if (!App.feito('checklist', 'vistoria')) { try { await App.concluir('checklist', 'vistoria', 'Vistoria enviada ao cliente!', { semaforo: v.semaforo, fotos: v.fotos.length }); } catch (e) {} }
    } catch (e) { if (!e || e.name !== 'AbortError') App.toast('Não foi possível compartilhar: ' + (e && e.message || e)); }
  };
  App.vist.V = V;
})(window);
