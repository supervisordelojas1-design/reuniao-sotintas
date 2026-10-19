/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO — Perfil DISC (autoavaliação do colaborador)
   Usa a base QUESTIONS / PROFILES / GROWTH / POSITIONS de disc-data.js
   (a mesma do app de Recrutamento e Seleção da Só Tintas)
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  const { $, esc } = global.AppUtil;
  const App = global.App;
  const S = { i: 0, resp: {}, iniciado: false };

  function calcular(resp) {
    const bruto = { D: 0, I: 0, S: 0, C: 0 };
    QUESTIONS.forEach(q => { bruto[q.dim] += Number(resp[q.id] || 0); });
    const total = Object.values(bruto).reduce((a, b) => a + b, 0) || 1;
    const pct = {}; Object.keys(bruto).forEach(k => pct[k] = Math.round(bruto[k] / total * 100));
    const ordem = Object.keys(bruto).sort((a, b) => bruto[b] - bruto[a]);
    return { d: pct.D, i: pct.I, s: pct.S, c: pct.C, bruto, dominante: ordem[0], secundario: ordem[1], respostas: resp };
  }
  function cargoChave(cargo) {
    const c = String(cargo || '').toLowerCase();
    if (c.includes('gerente')) return 'gerente'; if (c.includes('supervisor')) return 'supervisor'; if (c.includes('assistente') || c.includes('caixa')) return 'assistente'; if (c.includes('auxiliar')) return 'auxiliar'; return 'vendedor';
  }

  App.views.disc = () => {
    const p = App.prog; const feito = p.disc;
    if (feito && !S.iniciado) return resultado(feito);
    if (!S.iniciado) return App.cabecalho('Perfil DISC', 'Descubra como você se comporta e se relaciona', { voltar: '#/perfil', cor: 'amarelo' }) + `<div class="tela">
      <div class="card"><h3>Como funciona</h3><p class="pequeno">São 24 frases. Para cada uma, marque de 1 (não me descreve) a 5 (me descreve totalmente). Leva uns 5 minutos. Não existe resposta certa — seja sincero(a): o objetivo é você se conhecer melhor e conversar com seu mentor sobre seus pontos fortes.</p>
      <div class="grade-2">${Object.keys(PROFILES).map(k => `<div class="card" style="margin:0;border-left:4px solid ${PROFILES[k].color}"><b>${PROFILES[k].emoji} ${esc(PROFILES[k].name)}</b><div class="mini texto-3">${esc(DIM_LABELS[k])}</div></div>`).join('')}</div>
      <button class="btn bloco amarelo mt-2" onclick="App.disc.iniciar()">Começar o teste · +${App.cont.regras_xp.disc} ST</button></div></div>`;
    const q = QUESTIONS[S.i]; const n = QUESTIONS.length; const respondidas = Object.keys(S.resp).length;
    return App.cabecalho('Perfil DISC', `Pergunta ${S.i + 1} de ${n}`, { voltar: '#/perfil', cor: 'amarelo' }) + `<div class="tela">
      <div class="barra fina mb-2"><span style="width:${respondidas / n * 100}%"></span></div>
      <div class="card"><div class="etiqueta" style="background:${DIM_COLORS[q.dim]}22;color:${DIM_COLORS[q.dim]}">${DIM_EMOJIS[q.dim]} ${esc(DIM_LABELS[q.dim])}</div><div class="quiz-pergunta mt-1">“${esc(q.text)}”</div>
      <div class="grade-2" style="grid-template-columns:repeat(5,1fr);gap:6px">${[1, 2, 3, 4, 5].map(v => `<button class="btn ${S.resp[q.id] === v ? 'amarelo' : 'contorno'}" style="padding:12px 0" onclick="App.disc.responder(${q.id},${v})">${v}</button>`).join('')}</div>
      <div class="linha entre mini texto-3 mt-1"><span>Não me descreve</span><span>Me descreve totalmente</span></div></div>
      <div class="botoes">${S.i > 0 ? `<button class="btn contorno" onclick="App.disc.ir(-1)">‹ Anterior</button>` : ''}${S.i < n - 1 ? `<button class="btn azul" onclick="App.disc.ir(1)">Próxima ›</button>` : `<button class="btn verde" ${respondidas < n ? 'disabled' : ''} onclick="App.disc.finalizar()">Ver meu perfil ✔</button>`}</div></div>`;
  };
  App.disc = {
    iniciar() { S.iniciado = true; S.i = 0; S.resp = {}; App.render(); },
    responder(id, v) { S.resp[id] = v; if (S.i < QUESTIONS.length - 1) S.i++; App.render(); },
    ir(d) { S.i = Math.max(0, Math.min(QUESTIONS.length - 1, S.i + d)); App.render(); },
    async finalizar() {
      const r = calcular(S.resp); S.iniciado = false;
      try { const res = await DB.salvarDisc(r); await App.atualizarProgresso(); App.render(); if (res && !res.ja_existia) setTimeout(() => App.celebrar(res, 'Perfil revelado!'), 300); }
      catch (e) { App.toast('Erro ao salvar: ' + e.message); }
    },
    refazer() { S.iniciado = true; S.i = 0; S.resp = {}; App.render(); },
  };

  function resultado(r) {
    const dom = PROFILES[r.dominante] || PROFILES.D, sec = PROFILES[r.secundario] || PROFILES.I;
    const cargo = cargoChave(App.user.cargo);
    const growth = (GROWTH[`${r.dominante}_${cargo}`] || GROWTH[`${r.dominante}_vendedor`] || []);
    const pct = { D: r.d, I: r.i, S: r.s, C: r.c };
    return App.cabecalho(`${dom.emoji} ${esc(dom.name)}`, esc(dom.title), { voltar: '#/perfil', cor: 'escuro' }) + `<div class="tela">
      <div class="card"><p class="pequeno">${esc(dom.description)}</p>
      ${Object.keys(pct).map(k => `<div class="linha pequeno" style="gap:8px;margin-top:6px"><span style="width:118px">${DIM_EMOJIS[k]} ${esc(DIM_LABELS[k])}</span><div class="barra cresce"><span style="width:${pct[k]}%;background:${DIM_COLORS[k]}"></span></div><b style="width:36px;text-align:right">${pct[k]}%</b></div>`).join('')}
      <p class="mini texto-3 mt-1">Perfil secundário: <b>${sec.emoji} ${esc(sec.name)}</b></p></div>
      <div class="card sucesso"><h3>💪 Pontos fortes</h3><ul class="pequeno" style="padding-left:18px;margin:0">${dom.strengths.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
      <div class="card info"><h3>🌱 Para desenvolver</h3><ul class="pequeno" style="padding-left:18px;margin:0">${dom.development.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
      ${growth.length ? `<div class="card destaque"><h3>🚀 No seu cargo (${esc(App.user.cargo || 'Vendedor(a)')})</h3>${growth.map(g => `<p class="pequeno">${esc(g)}</p>`).join('')}</div>` : ''}
      <p class="pequeno texto-3 centro">Converse sobre este resultado com seu mentor na Jornada dos 30 dias.</p>
      <button class="btn bloco contorno" onclick="App.disc.refazer()">Refazer o teste</button></div>`;
  }
})(window);
