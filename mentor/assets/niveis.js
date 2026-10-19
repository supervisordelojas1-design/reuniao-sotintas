/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO — Níveis de Lojas e Vendedores (regras puras)
   Classifica loja (N1 Bronze · N2 Prata · N3 Ouro) e vendedor (V1…V5)
   pela Méd. 90 dias, calcula a curva de evolução (tempo de casa →
   nível esperado, situação, prazo) e quanto o vendedor ganha / pode
   ganhar em cada nível (bônus de performance + bônus de meta).
   Sem dependência de tela: usado pelo app, pelo gestor e pelos testes.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  const N = {};
  // número vindo de JSON (501861.32) ou de planilha brasileira ("501.861,32" / "R$ 501.861,32")
  const num = (v) => { if (typeof v === 'number') return isNaN(v) ? 0 : v; let s = String(v == null ? '' : v).replace(/[^\d.,-]/g, ''); if (!s) return 0; if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.'); else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, ''); const n = Number(s); return isNaN(n) ? 0 : n; };
  N.num = num;
  N.normNome = (s) => String(s || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s*-?\s*N\s*\d+\s*$/i, '').replace(/\s+\d+\s*$/, '').replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  N.brl = (v) => 'R$ ' + Math.round(Number(v) || 0).toLocaleString('pt-BR');
  N.brlK = (v) => { v = Number(v) || 0; return v >= 1000 ? 'R$ ' + (Math.round(v / 100) / 10).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil' : N.brl(v); };
  N.cod = (id) => String(Number(id) || 0).padStart(3, '0');

  /* ───── nível da loja: N3 ≥ regua.N3 · N2 ≥ regua.N2 · N1 abaixo ───── */
  N.nivelLoja = (med90, regua) => (med90 >= regua.N3 ? 3 : med90 >= regua.N2 ? 2 : 1);
  /* ───── nível do vendedor: faixas[nivelLoja] = [mín V2, mín V3, mín V4, mín V5] ───── */
  N.nivelVendedor = (med90, nivelLoja, faixas) => { const f = faixas[nivelLoja] || faixas[1]; let v = 1; for (let i = 0; i < f.length; i++) if (med90 >= f[i]) v = i + 2; return v; };
  N.faixaTexto = (v, nivelLoja, faixas) => { const f = faixas[nivelLoja] || faixas[1]; if (v <= 1) return 'abaixo de ' + N.brlK(f[0]); if (v >= 5) return 'a partir de ' + N.brlK(f[3]); return N.brlK(f[v - 2]) + ' a ' + N.brlK(f[v - 1]); };

  /* ───── tempo de casa (meses inteiros entre a admissão e hoje, sem olhar o dia) ───── */
  // meses de casa: o mês da admissão conta como mês 1 assim que o dia da admissão passa no mês atual
  N.mesesDesde = (admissao, hoje) => { if (!admissao) return null; const a = new Date(admissao + 'T12:00:00'), h = new Date(hoje + 'T12:00:00'); if (isNaN(a) || isNaN(h)) return null; return (h.getFullYear() - a.getFullYear()) * 12 + (h.getMonth() - a.getMonth()) + (a.getDate() <= h.getDate() ? 1 : 0); };
  N.tempoCasa = (meses) => meses == null ? '—' : meses < 12 ? meses + 'm' : Math.floor(meses / 12) + 'a ' + (meses % 12) + 'm';
  N.somaMeses = (iso, meses) => { const d = new Date(iso + 'T12:00:00'); const dia = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + meses); const ult = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(dia, ult)); return d.toISOString().slice(0, 10); };
  N.fmtData = (iso) => { if (!iso) return '—'; const [a, m, d] = String(iso).slice(0, 10).split('-'); return `${d}/${m}/${a}`; };

  /* ───── curva de evolução: treino (3 meses) e janelas por nível após o treino ───── */
  // cfg.curva = [{v:1, de:0, ate:6}, {v:2, de:6, ate:12}, {v:3, de:12, ate:24}, {v:4, de:24, ate:36}, {v:5, de:36, ate:null}]
  N.curva = (admissao, nivel, cfg, hoje) => {
    const treino = cfg.treino_meses == null ? 3 : cfg.treino_meses;
    const ten = N.mesesDesde(admissao, hoje);
    if (ten == null) return { situacao: 'SEMDATA', ten: null, esperado: null, alvo: Math.min(nivel + 1, 5), prazo: null, prazoTexto: nivel >= 5 ? 'Topo (V5)' : '—' };
    if (ten < treino) { const alvo = Math.min(nivel + 1, 5); return { situacao: 'TREINO', ten, esperado: 0, alvo, ...N.prazoDe(admissao, nivel, alvo, cfg, hoje) }; }
    const m = ten - treino; // meses de atuação após o treino
    let esperado = 0; for (const c of cfg.curva) if (c.v >= 2 && m >= c.de) esperado = c.v - 1; // níveis cuja janela já começou (o vendedor deveria ter, no mínimo, o nível anterior concluído)
    const alvo = Math.min(nivel + 1, 5);
    const situacao = esperado === 0 ? 'EM DIA' : nivel > esperado ? 'ADIANTADO' : nivel < esperado ? 'ATRASADO' : 'EM DIA';
    return { situacao, ten, esperado, alvo, ...N.prazoDe(admissao, nivel, alvo, cfg, hoje) };
  };
  // prazo para alcançar o nível "alvo" = admissão + treino + fim da janela desse nível
  N.prazoDe = (admissao, nivel, alvo, cfg, hoje) => {
    const treino = cfg.treino_meses == null ? 3 : cfg.treino_meses;
    if (nivel >= 5) return { prazo: null, prazoTexto: 'Topo (V5)' };
    const c = cfg.curva.find(x => x.v === alvo);
    if (!c) return { prazo: null, prazoTexto: '—' };
    if (alvo >= 5) { const d = N.somaMeses(admissao, treino + (c.de || 36)); return { prazo: d, prazoTexto: `V5 a partir de ${N.fmtData(d)} (${c.de}+)`, vencido: false }; }
    const d = N.somaMeses(admissao, treino + c.ate);
    return { prazo: d, prazoTexto: `V${alvo} até ${N.fmtData(d)}`, vencido: d < hoje };
  };
  N.SIT = { 'EM DIA': { rotulo: 'Em dia', cor: '#178048', emoji: '🟢' }, 'ATRASADO': { rotulo: 'Atrasado', cor: '#d64550', emoji: '🔴' }, 'ADIANTADO': { rotulo: 'Adiantado', cor: '#1B4DA1', emoji: '🔵' }, 'TREINO': { rotulo: 'Em treino', cor: '#B8860B', emoji: '🟡' }, 'SEMDATA': { rotulo: 'Sem data de admissão', cor: '#6b7688', emoji: '⚪' } };

  /* ───── ganhos por nível (bônus de performance + bônus de meta por cenário) ───── */
  // cfg.bonus.performance[nivelLoja] = [V1..V5]; cfg.bonus.meta[nivelLoja] = { m1:[V1..V5], m2:[...], super:[...] }
  N.ganhos = (nivelLoja, v, cfg) => {
    const p = (cfg.bonus.performance[nivelLoja] || [0, 0, 0, 0, 0])[v - 1] || 0;
    const m = cfg.bonus.meta[nivelLoja] || { m1: [], m2: [], super: [] };
    const m1 = m.m1[v - 1] || 0, m2 = m.m2[v - 1] || 0, sup = m.super[v - 1] || 0;
    return { performance: p, m1, m2, super: sup, min: p, com100: p + m2, max: p + sup, ano: (p + sup) * 12, anoCom100: (p + m2) * 12 };
  };
  N.outrosBonusTeto = (cfg) => (cfg.outros_bonus || []).reduce((s, b) => s + (Number(b.valor) || 0), 0);

  /* ───── cálculo completo (lojas + vendedores) ───── */
  N.calcular = (cfg, dadosLojas, dadosVendedores, lojasCadastro, hoje) => {
    hoje = hoje || new Date().toISOString().slice(0, 10);
    const regua = cfg.regua_loja, reguaAnt = cfg.regua_loja_anterior || null;
    const lojas = (dadosLojas || []).map(d => {
      const cad = (lojasCadastro || []).find(l => Number(l.id) === Number(d.loja_id)) || {};
      const med90 = num(d.med90); const nivel = N.nivelLoja(med90, regua); const nivelAnt = reguaAnt ? N.nivelLoja(med90, reguaAnt) : nivel;
      return { loja_id: Number(d.loja_id), cod: N.cod(d.loja_id), nome: d.nome || cad.nome || ('Loja ' + N.cod(d.loja_id)), regiao_id: cad.regiao_id != null ? cad.regiao_id : null, med90, nivel, nivelAnt, muda: nivel - nivelAnt, rotulo: cfg.nomes_loja[nivel], faixa: nivel === 3 ? 'acima de ' + N.brlK(regua.N3) : nivel === 2 ? N.brlK(regua.N2) + ' a ' + N.brlK(regua.N3) : 'abaixo de ' + N.brlK(regua.N2), proximoMin: nivel < 3 ? (nivel === 2 ? regua.N3 : regua.N2) : null };
    }).sort((a, b) => b.med90 - a.med90);
    lojas.forEach((l, i) => { l.pos = i + 1; });
    const vendedores = (dadosVendedores || []).map((d, i) => {
      const loja = lojas.find(l => l.loja_id === Number(d.loja_id)); const nivelLoja = loja ? loja.nivel : 1; const nivelLojaAnt = loja ? loja.nivelAnt : 1;
      const med90 = num(d.med90); const nivel = N.nivelVendedor(med90, nivelLoja, cfg.faixas_vendedor);
      const nivelAnt = cfg.faixas_vendedor_anterior ? N.nivelVendedor(med90, nivelLojaAnt, cfg.faixas_vendedor_anterior) : nivel;
      const f = cfg.faixas_vendedor[nivelLoja]; const proximoMin = nivel < 5 ? f[nivel - 1] : null;
      const curva = N.curva(d.admissao || null, nivel, cfg, hoje);
      const ganhos = N.ganhos(nivelLoja, nivel, cfg); const ganhosProx = nivel < 5 ? N.ganhos(nivelLoja, nivel + 1, cfg) : null;
      return { id: d.id || ('v' + (i + 1)), colaborador_id: d.colaborador_id || null, nome: d.nome, nomeNorm: N.normNome(d.nome), loja_id: Number(d.loja_id), loja: loja ? loja.nome : (d.loja || '—'), cod: N.cod(d.loja_id), regiao_id: loja ? loja.regiao_id : null, med90, admissao: d.admissao || null,
        nivelLoja, nivelLojaRotulo: cfg.nomes_loja[nivelLoja], nivel, nivelAnt, muda: nivel - nivelAnt, rotulo: cfg.nomes_vendedor[nivel], faixa: N.faixaTexto(nivel, nivelLoja, cfg.faixas_vendedor),
        proximoMin, falta: proximoMin != null ? Math.max(0, proximoMin - med90) : 0, tempoCasa: N.tempoCasa(curva.ten), ...curva, ganhos, ganhosProx };
    }).sort((a, b) => b.med90 - a.med90);
    vendedores.forEach((v, i) => { v.pos = i + 1; });
    return { lojas, vendedores, hoje };
  };
  // Acha o vendedor do colaborador logado: pelo vínculo explícito ou pelo nome do relatório
  N.acharVendedor = (user, vendedores) => {
    if (!user) return null;
    const porId = vendedores.find(v => v.colaborador_id && v.colaborador_id === user.id); if (porId) return porId;
    const alvo = N.normNome(user.nome); if (!alvo) return null;
    const exato = vendedores.filter(v => v.nomeNorm === alvo);
    if (exato.length === 1) return exato[0]; if (exato.length > 1) return exato.find(v => v.loja_id === user.loja_id) || exato[0];
    // nome parcial: primeiro e último nome iguais, na mesma loja
    const t = alvo.split(' '); if (t.length < 2) return null;
    const cand = vendedores.filter(v => { const u = v.nomeNorm.split(' '); return u[0] === t[0] && u[u.length - 1] === t[t.length - 1]; });
    if (cand.length === 1) return cand[0]; return cand.find(v => v.loja_id === user.loja_id) || null;
  };

  /* ───── importação de texto colado (CSV/TSV com cabeçalho, ou JSON do painel) ───── */
  N.importar = (texto) => {
    texto = String(texto || '').trim(); if (!texto) throw new Error('Cole os dados primeiro.');
    if (texto[0] === '{' || texto[0] === '[') {
      const j = JSON.parse(texto); const lojas = (j.lojas || j.LOJAS || (Array.isArray(j) ? j : [])).map(l => ({ loja_id: Number(l.loja_id != null ? l.loja_id : l.id), nome: l.nome || l.n, med90: num(l.med90 != null ? l.med90 : l.med) }));
      const vends = (j.vendedores || j.vends || j.VENDS || []).map(v => ({ loja_id: Number(v.loja_id != null ? v.loja_id : v.id), nome: v.nome, med90: num(v.med90 != null ? v.med90 : v.med), admissao: v.admissao || N.dataIso(v.adm) }));
      return { lojas: lojas.filter(l => l.loja_id), vendedores: vends.filter(v => v.nome) };
    }
    const linhas = texto.split(/\r?\n/).filter(l => l.trim());
    const sep = (linhas[0].match(/\t/g) || []).length >= 1 ? '\t' : (linhas[0].match(/;/g) || []).length >= 1 ? ';' : ',';
    const cab = linhas[0].split(sep).map(c => c.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
    const col = (...nomes) => cab.findIndex(c => nomes.some(n => c.includes(n)));
    const iLoja = col('loja', 'filial', 'cod'), iNome = col('vendedor', 'nome'), iMed = col('med', '90'), iAdm = col('adm', 'admiss', 'inicio', 'contrato');
    if (iLoja < 0 || iMed < 0) throw new Error('Não achei as colunas. Use um cabeçalho com "loja" (código) e "med 90 dias"; para vendedores, também "vendedor" e "admissao".');
    const lojas = [], vendedores = [];
    for (const l of linhas.slice(1)) {
      const c = l.split(sep).map(x => x.trim()); if (!c[iLoja]) continue;
      const loja_id = Number((c[iLoja].match(/\d+/) || ['0'])[0]); if (!loja_id) continue;
      if (iNome >= 0 && c[iNome]) vendedores.push({ loja_id, nome: c[iNome], med90: num(c[iMed]), admissao: iAdm >= 0 ? N.dataIso(c[iAdm]) : null });
      else lojas.push({ loja_id, nome: (c[iLoja].replace(/^\d+\s*[-·]?\s*/, '') || '').trim() || undefined, med90: num(c[iMed]) });
    }
    return { lojas, vendedores };
  };
  N.dataIso = (s) => { if (!s) return null; s = String(s).trim(); let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`; m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/); if (m) { const a = m[3].length === 2 ? '20' + m[3] : m[3]; return `${a}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; } return null; };

  global.Niveis = N;
})(window);
