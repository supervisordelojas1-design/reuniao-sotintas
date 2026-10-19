/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO — Minha Evolução (níveis de venda V1→V5 × nível da loja)
   O vendedor vê o próprio nível, a faixa, o que falta para o próximo,
   a curva de evolução pelo tempo de casa e QUANTO GANHA / PODE GANHAR
   em cada nível (bônus de performance + bônus de meta + outros bônus).
   Gerente, supervisor e coordenador veem o mesmo painel para a equipe
   (blocos dentro da aba Equipe) — cada um só no seu escopo.
   Regras e cálculo: assets/niveis.js · régua, bônus e base: conteudo-niveis.js
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  const { $, esc } = global.AppUtil;
  const App = global.App; const U = DB.util; const N = global.Niveis;
  const brl = N.brl, brlK = N.brlK;
  const cache = { ref: null, res: null };
  function dados() {
    const cont = App.cont; if (!cont || !cont.niveis_vendas) return null;
    if (cache.ref !== cont) { cache.ref = cont; cache.res = N.calcular(cont.niveis_vendas, cont.niveis_lojas || [], cont.niveis_vendedores || [], cont.lojas || []); }
    return cache.res;
  }
  App.niveis = { dados, meu: () => { const r = dados(); return r ? N.acharVendedor(App.user, r.vendedores) : null; } };
  const cfg = () => App.cont.niveis_vendas;
  const corV = (v) => (cfg().cores_vendedor || {})[v] || '#444';
  const inkV = (v) => v === 3 ? '#2a2000' : '#fff';
  const badgeV = (v, cls) => `<span class="nv-badge ${cls || ''}" style="background:${corV(v)};color:${inkV(v)}">V${v}</span>`;
  const corLoja = { 3: '#E6B935', 2: '#C3CBD8', 1: '#D98A3D' }; const inkLoja = { 3: '#2a2000', 2: '#1a2030', 1: '#2a1500' };
  const badgeLoja = (n, texto) => `<span class="nv-badge" style="background:${corLoja[n]};color:${inkLoja[n]}">${texto || ('N' + n + ' · ' + cfg().nomes_loja[n])}</span>`;
  const sit = (v) => N.SIT[v.situacao] || N.SIT['SEMDATA'];
  const sitChip = (v) => `<span class="etiqueta mini" style="background:${sit(v).cor}1a;color:${sit(v).cor}">${sit(v).emoji} ${sit(v).rotulo}${v.vencido ? ' · prazo vencido' : ''}</span>`;
  const lojaNoEscopo = (lojaId) => { const e = U.escopoDe(App.user, App.cont); if (e.nivel === 'rede') return true; const l = (App.cont.lojas || []).find(x => x.id === Number(lojaId)); if (e.nivel === 'regiao') return !!l && l.regiao_id === e.regiao_id; return Number(lojaId) === App.user.loja_id; };

  /* ───────────────────────── blocos reutilizáveis ───────────────────────── */
  function escadaHtml(nivelLoja, atual) {
    const c = cfg(); const f = c.faixas_vendedor[nivelLoja]; const alturas = [38, 52, 68, 84, 100];
    return `<div class="nv-escada">${[1, 2, 3, 4, 5].map(v => `<div class="nv-step ${atual === v ? 'atual' : ''}"><div class="nv-bar" style="height:${alturas[v - 1]}%;background:${corV(v)};color:${inkV(v)}"><b>V${v}</b><span>${esc(c.nomes_vendedor[v])}</span></div><div class="nv-axis">${v === 1 ? '< ' + brlK(f[0]) : '≥ ' + brlK(f[v - 2])}</div></div>`).join('')}</div>`;
  }
  function tabelaGanhosHtml(nivelLoja, atual) {
    const c = cfg(); const g = c.bonus.gatilhos_meta;
    return `<div class="nv-ganhos">${[1, 2, 3, 4, 5].map(v => { const x = N.ganhos(nivelLoja, v, c); return `<div class="nv-linha ${atual === v ? 'atual' : ''}"><div class="linha entre">${badgeV(v)}<span class="cresce pequeno negrito" style="margin-left:8px">${esc(c.nomes_vendedor[v])}</span><span class="negrito" style="color:${atual === v ? 'var(--azul-escuro)' : 'var(--verde)'}">até ${brl(x.max)}/mês</span></div><div class="mini texto-2" style="margin-top:2px">performance ${x.performance ? brl(x.performance) : '—'} · meta ${brl(x.m1)} (${g.m1}) / ${brl(x.m2)} (${g.m2}) / ${brl(x.super)} (${g.super})</div></div>`; }).join('')}</div>
      <p class="mini texto-3" style="margin:6px 0 0">Performance + bônus de meta de faturamento (${g.m1} · ${g.m2} · ${g.super} da sua meta). "Até" = performance + meta a ${g.super}. ${esc((c.bonus.notas || []).join(' '))}</p>`;
  }
  function outrosBonusHtml() {
    const c = cfg(); const teto = N.outrosBonusTeto(c);
    return `<div class="card"><h3>➕ Além do nível: o que mais dá para ganhar todo mês</h3><p class="pequeno texto-2" style="margin:0 0 8px">Esses bônus não dependem do seu nível — dependem de indicadores. Somados, chegam a <b>${brl(teto)}/mês</b>.</p>${(c.outros_bonus || []).map(b => `<div class="nv-outro"><div class="linha entre"><b class="pequeno">${esc(b.nome)}</b><span class="pequeno negrito" style="color:var(--verde)">até ${brl(b.valor)}</span></div><div class="mini texto-3">${esc(b.como)}${b.pago ? ' · pago ' + esc(b.pago) : ''}</div></div>`).join('')}</div>`;
  }
  function curvaHtml(atual, ten) {
    const c = cfg(); const treino = c.treino_meses == null ? 3 : c.treino_meses;
    return `<div class="card"><h3>🪜 Curva de evolução V1 → V5</h3><div class="nv-treino"><b>Contrato 0–${treino} meses</b><span>Fase de treinamento: a curva começa quando ela termina. Os meses abaixo são de atuação <b>após</b> o treino.</span></div>
      ${c.curva.map(x => `<div class="nv-curva ${atual === x.v ? 'atual' : ''}">${badgeV(x.v)}<div class="cresce"><div class="linha entre"><b class="pequeno">${esc(x.nome)}</b><span class="etiqueta cinza mini">${esc(x.janela)}</span></div><div class="mini texto-2">${esc(x.desc)}</div></div></div>`).join('')}
      ${ten != null ? `<p class="mini texto-3" style="margin:8px 0 0">Você tem ${esc(N.tempoCasa(ten))} de casa${ten >= treino ? ` — ${ten - treino} ${ten - treino === 1 ? 'mês' : 'meses'} de atuação após o treino` : ' — ainda na fase de treinamento'}.</p>` : ''}</div>`;
  }
  function proximoHtml(v) {
    const c = cfg(); const d = c.dias_uteis_mes || 26;
    if (v.nivel >= 5) return `<div class="card sucesso"><div class="negrito">🏆 Você está no topo: V5 · Elite</div><div class="pequeno">Agora o jogo é manter a média acima de ${brlK(c.faixas_vendedor[v.nivelLoja][3])} e buscar os bônus de indicadores e a Elite das Vendas CPF.</div></div>`;
    const prox = v.nivel + 1; const g = v.ganhosProx; const ganhoMais = g.max - v.ganhos.max; const ganhoMais100 = g.com100 - v.ganhos.com100;
    const f = c.faixas_vendedor[v.nivelLoja]; const min = f[v.nivel - 2] || 0, max = f[v.nivel - 1]; const pct = Math.max(4, Math.min(100, Math.round((v.med90 - min) / (max - min) * 100)));
    return `<div class="card destaque"><div class="etiqueta amarela">Próximo nível</div><div class="linha mt-1" style="gap:12px">${badgeV(prox, 'grande')}<div class="cresce"><div class="negrito">V${prox} · ${esc(c.nomes_vendedor[prox])} a partir de ${brlK(v.proximoMin)}</div><div class="pequeno texto-2">Faltam <b>${brl(v.falta)}</b> na sua média mensal de 90 dias — cerca de <b>${brl(v.falta / d)} por dia útil</b>.</div></div></div>
      <div class="barra mt-1"><span style="width:${pct}%"></span></div><div class="linha entre mini texto-3"><span>${brlK(min)}</span><span>você: ${brlK(v.med90)}</span><span>${brlK(max)}</span></div>
      <div class="nv-ganho mt-1"><div><span class="mini texto-3">Subindo para V${prox} você passa a ganhar</span><div class="negrito" style="color:var(--verde)">+${brl(ganhoMais100)}/mês batendo 100% da meta</div><div class="mini texto-2">(+${brl(ganhoMais)}/mês no máximo · +${brl(ganhoMais * 12)}/ano)</div></div></div>
      ${v.prazo ? `<div class="mini texto-3 mt-1">${v.situacao === 'ATRASADO' ? '⚠️ ' : ''}${esc(v.prazoTexto)}${v.vencido ? ' — prazo da curva vencido' : ' — prazo pela curva de evolução'}</div>` : ''}</div>`;
  }
  function resumoTexto(v) {
    const c = cfg();
    const l = [`*MINHA EVOLUÇÃO — Só Tintas*`, `${v.nome} · ${v.cod} ${v.loja} (loja ${c.nomes_loja[v.nivelLoja]})`, `Nível atual: V${v.nivel} ${c.nomes_vendedor[v.nivel]} · Méd. 90 dias ${brl(v.med90)} · faixa ${v.faixa}`, `Situação na curva: ${sit(v).rotulo}${v.prazo ? ' · ' + v.prazoTexto : ''}`, ''];
    l.push(`Hoje (V${v.nivel}): performance ${brl(v.ganhos.performance)} + meta ${brl(v.ganhos.m1)} / ${brl(v.ganhos.m2)} / ${brl(v.ganhos.super)} → até ${brl(v.ganhos.max)}/mês`);
    if (v.ganhosProx) l.push(`Próximo (V${v.nivel + 1}): a partir de ${brlK(v.proximoMin)} (faltam ${brl(v.falta)}) → até ${brl(v.ganhosProx.max)}/mês (+${brl(v.ganhosProx.max - v.ganhos.max)})`);
    l.push(`Outros bônus (indicadores): até ${brl(N.outrosBonusTeto(c))}/mês`);
    l.push(''); l.push(`_${c.base.rotulo} · vale o fechamento oficial · MENTOR ST PRO_`); return l.join('\n');
  }
  App.evolucao = { compartilhar: async (id) => { const r = dados(); const v = r && r.vendedores.find(x => String(x.id) === String(id)); if (!v) return; const t = resumoTexto(v); try { await navigator.clipboard.writeText(t); App.toast('Resumo copiado ✔'); } catch (e) {} global.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank', 'noopener'); } };

  /* ───────────────────────── tela: minha evolução (ou de um vendedor da equipe) ───────────────────────── */
  App.views.evolucao = ([id]) => {
    const r = dados(); const c = cfg();
    if (!r) return App.cabecalho('Minha evolução', 'Níveis de venda', { voltar: '#/perfil', cor: 'azul' }) + '<div class="tela"><div class="card"><p class="pequeno texto-3" style="margin:0">A base de níveis ainda não foi carregada.</p></div></div>';
    let v = null, deEquipe = false;
    if (id) { v = r.vendedores.find(x => String(x.id) === String(id)) || null; deEquipe = true; if (!v || !(U.ehLider(App.user) && lojaNoEscopo(v.loja_id))) return App.cabecalho('Evolução', '', { voltar: '#/equipe', cor: 'azul' }) + '<div class="tela"><div class="card erro"><p class="pequeno" style="margin:0">Este vendedor não está no seu escopo.</p></div></div>'; }
    else v = N.acharVendedor(App.user, r.vendedores);
    const voltar = deEquipe ? `#/equipe/loja/${v.loja_id}` : '#/perfil';
    const minhaLoja = r.lojas.find(l => l.loja_id === (v ? v.loja_id : App.user.loja_id));
    const nivelLoja = v ? v.nivelLoja : (minhaLoja ? minhaLoja.nivel : (App.cache.nvLoja || 2));
    const titulo = deEquipe ? esc(v.nome.split(' ').slice(0, 2).join(' ')) : 'Minha evolução';
    const extra = `<div class="linha mt-1" style="gap:8px;flex-wrap:wrap">${v ? `<span class="xp-pill">Méd. 90 dias ${brl(v.med90)}</span>` : ''}${minhaLoja ? `<span class="xp-pill">Loja ${esc(c.nomes_loja[minhaLoja.nivel])} · ${brlK(minhaLoja.med90)}</span>` : ''}<span class="xp-pill">📅 ${esc(c.base.rotulo)}</span></div>`;
    if (!v) {
      return App.cabecalho(titulo, `${esc(App.user.nome)} · ${esc(App.user.loja)}`, { voltar, cor: 'azul', extra }) + `<div class="tela">
        <div class="card info"><div class="negrito">Seu nome ainda não está na base de níveis</div><p class="pequeno" style="margin:4px 0 0">A base (${esc(c.base.rotulo)}) usa o nome do Relatório de Vendedores. Se você entrou há pouco ou o nome está diferente, fale com seu gerente ou com a coordenação para fazer o vínculo. Enquanto isso, veja abaixo a escada e quanto cada nível ganha na sua loja.</p></div>
        ${minhaLoja ? '' : `<div class="chips mb-2">${[3, 2, 1].map(n => `<button class="chip ${nivelLoja === n ? 'ativo' : ''}" onclick="App.cache.nvLoja=${n};App.render()">Loja ${esc(c.nomes_loja[n])}</button>`).join('')}</div>`}
        <div class="card"><h3>🪜 Escada de níveis · loja ${esc(c.nomes_loja[nivelLoja])}</h3>${escadaHtml(nivelLoja, 0)}<p class="mini texto-3" style="margin:6px 0 0">Nível pela Méd. 90 dias de venda. Loja ${esc(c.nomes_loja[nivelLoja])} = ${esc(minhaLoja ? minhaLoja.faixa : '')}.</p></div>
        <div class="card"><h3>💰 Quanto cada nível ganha por mês</h3>${tabelaGanhosHtml(nivelLoja, 0)}</div>
        ${outrosBonusHtml()}${curvaHtml(0, null)}
        <p class="mini texto-3 centro">Valores conforme as Regras de Bonificação Só Tintas. Vale sempre o fechamento oficial.</p></div>`;
    }
    const g = v.ganhos; const tetoOutros = N.outrosBonusTeto(c); const g5 = N.ganhos(v.nivelLoja, 5, c);
    return App.cabecalho(titulo, `${deEquipe ? esc(v.nome) + ' · ' : ''}V${v.nivel} · ${esc(v.rotulo)} · ${esc(v.cod)} ${esc(v.loja)} (loja ${esc(c.nomes_loja[v.nivelLoja])})`, { voltar, cor: 'azul', extra }) + `<div class="tela">
      <div class="card"><div class="linha" style="gap:14px">${badgeV(v.nivel, 'grande')}<div class="cresce"><div class="negrito" style="font-size:1.05rem">V${v.nivel} · ${esc(v.rotulo)}</div><div class="pequeno texto-2">Faixa do nível na loja ${esc(c.nomes_loja[v.nivelLoja])}: <b>${esc(v.faixa)}</b></div><div class="pequeno texto-2">Sua Méd. 90 dias: <b>${brl(v.med90)}</b></div></div></div>
        <div class="linha mt-1" style="gap:6px;flex-wrap:wrap">${sitChip(v)}${v.ten != null ? `<span class="etiqueta cinza mini">⏱ ${esc(v.tempoCasa)} de casa</span>` : ''}${v.muda ? `<span class="etiqueta ${v.muda > 0 ? 'verde' : 'vermelha'} mini">${v.muda > 0 ? '▲ subiu' : '▼ caiu'} com a régua de outubro (V${v.nivelAnt} → V${v.nivel})</span>` : ''}</div>
        ${v.situacao === 'ATRASADO' ? `<div class="ck-msg vermelho mt-1">Pela curva, com ${esc(v.tempoCasa)} de casa o esperado seria pelo menos V${v.esperado}. Dá para recuperar: foque na média dos próximos 90 dias.</div>` : v.situacao === 'ADIANTADO' ? `<div class="ck-msg mt-1" style="background:var(--azul-claro);color:var(--azul)">Você está adiantado na curva: com ${esc(v.tempoCasa)} de casa o esperado seria V${v.esperado} — e você já é V${v.nivel}. 👏</div>` : ''}</div>
      ${proximoHtml(v)}
      <div class="card"><h3>🪜 Escada de níveis · loja ${esc(c.nomes_loja[v.nivelLoja])}</h3>${escadaHtml(v.nivelLoja, v.nivel)}<p class="mini texto-3" style="margin:6px 0 0">Mínimos de Méd. 90 dias para cada nível na sua loja. A loja ${esc(c.nomes_loja[v.nivelLoja])} fica ${esc(minhaLoja ? minhaLoja.faixa : '')}${minhaLoja && minhaLoja.nivel < 3 ? ` — se ela subir para ${esc(c.nomes_loja[minhaLoja.nivel + 1])}, a escada e os bônus mudam.` : '.'}</p></div>
      <div class="card"><h3>💰 Quanto você ganha por nível</h3>${tabelaGanhosHtml(v.nivelLoja, v.nivel)}
        <div class="nv-resumo mt-1"><div><span class="mini texto-3">Hoje, V${v.nivel}</span><b>${brl(g.min)} a ${brl(g.max)}</b><span class="mini texto-3">por mês · até ${brl(g.ano)}/ano</span></div>${v.ganhosProx ? `<div><span class="mini texto-3">No V${v.nivel + 1}</span><b style="color:var(--verde)">até ${brl(v.ganhosProx.max)}</b><span class="mini texto-3">por mês · +${brl((v.ganhosProx.max - g.max) * 12)}/ano</span></div>` : ''}${v.nivel < 5 ? `<div><span class="mini texto-3">No topo, V5</span><b style="color:var(--azul)">até ${brl(g5.max)}</b><span class="mini texto-3">por mês · até ${brl(g5.ano)}/ano</span></div>` : ''}</div>
        <p class="pequeno mt-1" style="margin-bottom:0">Com os bônus de indicadores (até ${brl(tetoOutros)}), o teto no seu nível chega a <b>${brl(g.max + tetoOutros)}/mês</b>${v.nivel < 5 ? ` — e a <b>${brl(g5.max + tetoOutros)}/mês</b> no V5` : ''}.</p></div>
      ${outrosBonusHtml()}
      ${curvaHtml(v.nivel, v.ten)}
      <div class="botoes"><button class="btn verde" onclick="App.evolucao.compartilhar('${esc(String(v.id))}')">📲 Compartilhar meu plano</button>${deEquipe ? `<button class="btn contorno" onclick="location.hash='${voltar}'">‹ Voltar à loja</button>` : ''}</div>
      <p class="mini texto-3 centro mt-2">${esc(c.base.rotulo)} · fonte: ${esc(c.base.fonte || '')} · valores conforme as Regras de Bonificação Só Tintas. Vale sempre o fechamento oficial.</p></div>`;
  };

  /* ───────────────────────── blocos para a aba Equipe (gerente / supervisor / coordenador) ───────────────────────── */
  App.niveisBlocos = {
    etiquetaLoja(lojaId) { const r = dados(); const l = r && r.lojas.find(x => x.loja_id === Number(lojaId)); return l ? badgeLoja(l.nivel, cfg().nomes_loja[l.nivel]) : ''; },
    loja(lojaId) {
      const r = dados(); if (!r || !lojaNoEscopo(lojaId)) return ''; const c = cfg();
      const l = r.lojas.find(x => x.loja_id === Number(lojaId)); const vs = r.vendedores.filter(x => x.loja_id === Number(lojaId));
      if (!l && !vs.length) return '';
      const mudam = vs.filter(x => x.muda).length;
      return `<div class="card"><div class="linha entre"><h3 style="margin:0">💰 Níveis de venda</h3><span class="mini texto-3">${esc(c.base.rotulo)}</span></div>
        ${l ? `<div class="linha mt-1" style="gap:10px">${badgeLoja(l.nivel)}<div class="cresce pequeno">Méd. 90 dias <b>${brl(l.med90)}</b> · ${esc(l.faixa)}${l.muda ? ` · <span style="color:${l.muda > 0 ? 'var(--verde)' : 'var(--vermelho)'}">${l.muda > 0 ? '▲ sobe' : '▼ cai'} com a régua de outubro (N${l.nivelAnt} → N${l.nivel})</span>` : ''}${l.proximoMin ? `<div class="mini texto-3">Para ${esc(c.nomes_loja[l.nivel + 1])}: faltam ${brl(l.proximoMin - l.med90)} na média da loja.</div>` : ''}</div></div>` : ''}
        ${vs.length ? `<div class="mt-1">${vs.map(v => `<div class="item-lista" style="padding:8px 10px" onclick="location.hash='#/evolucao/${esc(String(v.id))}'"><span class="num" style="background:${corV(v.nivel)};color:${inkV(v.nivel)};font-size:.72rem">V${v.nivel}</span><div class="cresce"><div class="titulo" style="font-size:.84rem">${esc(v.nome)}</div><div class="desc">${brl(v.med90)} · ${esc(v.rotulo)} · ${v.nivel < 5 ? `faltam ${brlK(v.falta)} p/ V${v.nivel + 1}` : 'topo'}</div><div class="mt-1" style="display:flex;gap:4px;flex-wrap:wrap">${sitChip(v)}${v.muda ? `<span class="etiqueta ${v.muda > 0 ? 'verde' : 'vermelha'} mini">${v.muda > 0 ? '▲' : '▼'} V${v.nivelAnt}→V${v.nivel}</span>` : ''}</div></div><span class="seta">›</span></div>`).join('')}</div><p class="mini texto-3" style="margin:6px 0 0">${vs.length} vendedor${vs.length === 1 ? '' : 'es'} na base${mudam ? ` · ${mudam} muda${mudam === 1 ? '' : 'm'} de nível na régua de outubro` : ''}. Toque para ver a curva e os ganhos de cada um.</p>` : '<p class="mini texto-3" style="margin:6px 0 0">Nenhum vendedor desta loja na base.</p>'}</div>`;
    },
    resumo(filtro) { // filtro: (loja) => boolean  — resumo por níveis para região ou rede
      const r = dados(); if (!r) return ''; const c = cfg();
      const ls = r.lojas.filter(l => filtro(l)); const vs = r.vendedores.filter(v => filtro({ loja_id: v.loja_id, regiao_id: v.regiao_id }));
      if (!ls.length && !vs.length) return '';
      const nL = [3, 2, 1].map(n => ls.filter(l => l.nivel === n).length); const nV = [5, 4, 3, 2, 1].map(n => vs.filter(v => v.nivel === n).length);
      const mudamL = ls.filter(l => l.muda).length, mudamV = vs.filter(v => v.muda).length, atras = vs.filter(v => v.situacao === 'ATRASADO').length;
      return `<div class="card"><div class="linha entre"><h3 style="margin:0">💰 Níveis de venda</h3><span class="mini texto-3">${esc(c.base.rotulo)}</span></div>
        <div class="nv-contagem mt-1">${[3, 2, 1].map((n, i) => `<div>${badgeLoja(n, c.nomes_loja[n])}<b>${nL[i]}</b><span class="mini texto-3">loja${nL[i] === 1 ? '' : 's'}</span></div>`).join('')}</div>
        <div class="nv-contagem mt-1">${[5, 4, 3, 2, 1].map((n, i) => `<div>${badgeV(n, 'mini')}<b>${nV[i]}</b><span class="mini texto-3">${esc(c.nomes_vendedor[n])}</span></div>`).join('')}</div>
        <div class="pequeno mt-1">${mudamL || mudamV ? `⚠️ <b>${mudamL}</b> loja${mudamL === 1 ? '' : 's'} e <b>${mudamV}</b> vendedor${mudamV === 1 ? '' : 'es'} mudam de nível na régua de outubro. ` : ''}${atras ? `🔴 <b>${atras}</b> vendedor${atras === 1 ? '' : 'es'} atrasado${atras === 1 ? '' : 's'} na curva de evolução.` : ''}</div></div>`;
    },
  };
})(window);
