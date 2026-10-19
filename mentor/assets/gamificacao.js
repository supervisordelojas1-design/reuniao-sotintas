/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO — Motor de gamificação (ST, níveis, conquistas)
   Usado no modo demonstração (sem banco). No Supabase, a mesma
   lógica roda dentro do banco (ver supabase/schema.sql).
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  function nivelPorXp(xp, niveis) {
    const lista = [...niveis].sort((a, b) => a.xp_min - b.xp_min);
    let atual = lista[0];
    for (const n of lista) if (xp >= n.xp_min) atual = n;
    const idx = lista.indexOf(atual);
    const proximo = lista[idx + 1] || null;
    const base = atual.xp_min;
    const alvo = proximo ? proximo.xp_min : atual.xp_min;
    const pct = proximo ? Math.min(100, Math.round(((xp - base) / (alvo - base)) * 100)) : 100;
    return { nivel: atual, proximo, pct, faltam: proximo ? Math.max(0, alvo - xp) : 0 };
  }

  /* Resumo do estado do colaborador a partir dos itens de progresso.
     itens: [{item_tipo, item_id, concluido_em, nota}] */
  function resumirEstado(itens, conteudo, extras) {
    extras = extras || {};
    const aulasFeitas = new Set(itens.filter(i => i.item_tipo === 'aula').map(i => i.item_id));
    const videosFeitos = new Set(itens.filter(i => i.item_tipo === 'video').map(i => i.item_id));
    const quizzesAprovados = new Set(itens.filter(i => i.item_tipo === 'quiz').map(i => i.item_id));
    const quizNota10 = itens.filter(i => i.item_tipo === 'quiz' && Number(i.nota) >= 10).length;
    const tarefas = new Set(itens.filter(i => i.item_tipo === 'tarefa').map(i => i.item_id));
    const checklists = new Set(itens.filter(i => i.item_tipo === 'checklist').map(i => i.item_id));
    const modulosConcluidos = [];
    for (const m of conteudo.modulos) {
      const aulasDoModulo = conteudo.aulas.filter(a => a.modulo_id === m.id);
      const todas = aulasDoModulo.length > 0 && aulasDoModulo.every(a => aulasFeitas.has(a.id));
      if (todas && quizzesAprovados.has(m.id)) modulosConcluidos.push(m.id);
    }
    const hoje = new Date().toISOString().slice(0, 10);
    const aulasHoje = itens.filter(i => i.item_tipo === 'aula' && String(i.concluido_em || '').slice(0, 10) === hoje).length;
    return {
      aulas: aulasFeitas.size,
      videos: videosFeitos.size,
      quizzes_aprovados: quizzesAprovados.size,
      quiz_nota10: quizNota10,
      tarefas: tarefas.size,
      checklists: checklists.size,
      historia: itens.some(i => i.item_tipo === 'historia'),
      valores: itens.some(i => i.item_tipo === 'valores'),
      disc: itens.some(i => i.item_tipo === 'disc'),
      final: itens.some(i => i.item_tipo === 'final'),
      modulos_concluidos: modulosConcluidos,
      todos_modulos: conteudo.modulos.filter(m => m.obrigatorio !== false).every(m => modulosConcluidos.includes(m.id)),
      streak: extras.streak || 0,
      aulas_hoje: aulasHoje,
    };
  }

  function regraAtendida(regra, estado) {
    if (!regra) return false;
    switch (regra.tipo) {
      case 'aulas': return estado.aulas >= (regra.min || 1);
      case 'videos': return estado.videos >= (regra.min || 1);
      case 'quizzes': return estado.quizzes_aprovados >= (regra.min || 1);
      case 'quiz_nota10': return estado.quiz_nota10 >= (regra.min || 1);
      case 'tarefas': return estado.tarefas >= (regra.min || 1);
      case 'checklists': return (estado.checklists || 0) >= (regra.min || 1);
      case 'historia': return !!estado.historia;
      case 'valores': return !!estado.valores;
      case 'disc': return !!estado.disc;
      case 'final': return !!estado.final;
      case 'modulo': return estado.modulos_concluidos.includes(regra.id);
      case 'todos_modulos': return !!estado.todos_modulos;
      case 'streak': return estado.streak >= (regra.min || 1);
      case 'aulas_dia': return estado.aulas_hoje >= (regra.min || 1);
      default: return false;
    }
  }

  function verificarConquistas(estado, conquistas, jaObtidas) {
    const obtidas = new Set(jaObtidas || []);
    const novas = [];
    for (const c of conquistas) {
      if (obtidas.has(c.id)) continue;
      if (regraAtendida(c.regra, estado)) novas.push(c);
    }
    return novas;
  }

  function calcularStreak(dias) {
    // dias: array de 'YYYY-MM-DD'
    const set = new Set(dias);
    let streak = 0;
    const d = new Date();
    for (let k = 0; k < 400; k++) {
      const chave = d.toISOString().slice(0, 10);
      if (set.has(chave)) { streak++; d.setDate(d.getDate() - 1); }
      else if (k === 0) { d.setDate(d.getDate() - 1); } // hoje ainda sem atividade não quebra a sequência
      else break;
    }
    return streak;
  }

  function corrigirQuiz(questoes, respostas) {
    let acertos = 0;
    const detalhes = questoes.map(q => {
      const escolhida = respostas[q.id];
      const certa = Number(escolhida) === Number(q.correta);
      if (certa) acertos++;
      return { questao_id: q.id, escolhida: escolhida == null ? null : Number(escolhida), correta: Number(q.correta), certa, explicacao: q.explicacao || '' };
    });
    const total = questoes.length;
    const nota = total ? Math.round((acertos / total) * 100) / 10 : 0;
    return { acertos, total, nota, detalhes };
  }

  global.Gamificacao = { nivelPorXp, resumirEstado, verificarConquistas, regraAtendida, calcularStreak, corrigirQuiz };
})(window);
