/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO — Níveis de Lojas e Vendedores: régua, bônus e base mensal
   Régua vigente a partir de OUTUBRO/2026 (base: $ Méd. 90 dias de setembro).
   A base de dados (lojas e vendedores) é atualizada todo mês pelo coordenador
   no Painel do Gestor → Níveis de venda (colar o export). Os valores de bônus
   seguem as Regras de Bonificação Só Tintas; vale sempre o fechamento oficial.
   ═══════════════════════════════════════════════════════════════ */
(function (C) {
  C.niveis_vendas = {
    base: { mes: '2026-09', rotulo: 'base setembro/2026 · régua de outubro/2026', atualizado_em: '2026-10-07', fonte: 'Relatório de Vendedores / META (Méd. 90 dias)' },
    treino_meses: 3,
    // Nível da loja pela Méd. 90 dias (vigente out/26+) e régua anterior (jul–set/26), usada só para mostrar quem muda
    regua_loja: { N3: 250000, N2: 150000 },
    regua_loja_anterior: { N3: 180000, N2: 100000 },
    nomes_loja: { 3: 'Ouro', 2: 'Prata', 1: 'Bronze' },
    // Mínimos de V2, V3, V4 e V5 por nível de loja (vigente) e anteriores
    faixas_vendedor: { 3: [50000, 70000, 100000, 150000], 2: [40000, 60000, 90000, 110000], 1: [30000, 50000, 65000, 85000] },
    faixas_vendedor_anterior: { 3: [50000, 65000, 85000, 130000], 2: [40000, 55000, 70000, 95000], 1: [30000, 45000, 60000, 80000] },
    nomes_vendedor: { 1: 'Iniciante', 2: 'Júnior', 3: 'Pleno', 4: 'Sênior', 5: 'Elite' },
    cores_vendedor: { 1: '#2A2F3A', 2: '#D32531', 3: '#E6B935', 4: '#178048', 5: '#1B4DA1' },
    // Bônus mensais por nível de loja (N3 Ouro · N2 Prata · N1 Bronze), colunas V1..V5
    bonus: {
      performance: { 3: [0, 250, 400, 600, 800], 2: [0, 0, 300, 500, 600], 1: [0, 0, 0, 350, 500] },
      meta: {
        3: { m1: [250, 280, 350, 420, 500], m2: [330, 380, 450, 550, 750], super: [480, 550, 750, 850, 1500] },
        2: { m1: [220, 250, 280, 320, 380], m2: [290, 330, 380, 440, 530], super: [420, 480, 550, 650, 800] },
        1: { m1: [100, 120, 150, 180, 220], m2: [280, 300, 330, 380, 440], super: [480, 500, 530, 550, 650] },
      },
      gatilhos_meta: { m1: '95%', m2: '100%', super: '130%' },
      notas: ['Bônus de performance: pago dia 20. Se a loja ficar 3 meses sem contagem de estoque ou a contagem ficar abaixo de 80%, todos da loja perdem a performance no mês.', 'Bônus de meta de faturamento: pago até o 5º dia útil, pelo % de alcance da sua meta individual (95% · 100% · 130%).'],
    },
    // O que mais o vendedor pode ganhar todo mês, independentemente do nível (tetos)
    outros_bonus: [
      { nome: 'Indicadores CPF', valor: 80, como: '4 indicadores × R$ 20: identificadas ≥ 80% · itens ≥ 2,5 · ticket ≥ R$ 200 · desconto < 7%. Pré-requisito: você e a loja ≥ 95% da meta.', pago: 'dia 20' },
      { nome: 'Meta de time', valor: 200, como: 'A loja bate a meta: 95% = R$ 75 · 100% = R$ 150 · 130% = R$ 200. Pré-requisito: você ≥ 90% da sua meta.', pago: 'dia 10' },
      { nome: 'Indicadores CNPJ', valor: 500, como: 'Faturamento CNPJ (R$ 50 a 200) + desconto < 17% (R$ 50) + positivados (R$ 50 a 150) + clientes novos (R$ 50 a 100). Pré-requisitos: ≥ 10 positivados, ≥ 95% da meta e ≥ 50% da carteira positivada.', pago: 'dia 10' },
      { nome: 'Meta CNPJ', valor: 100, como: '% alcance da meta CNPJ ≥ 100%, com ≥ 95% da meta de faturamento.', pago: 'dia 10' },
      { nome: 'Eucatex (litragem)', valor: 50, como: 'A partir de 100% da meta de litragem lançada no sistema (tudo ou nada).', pago: '5º dia útil' },
      { nome: 'Elite das Vendas CPF', valor: 200, como: 'Ranking mensal dos 4 indicadores CPF entre quem bateu 95%: 1º R$ 200 · 2º 150 · 3º 100 · 4º 75 · 5º a 10º 50. Trimestral: 500 / 350 / 200.', pago: 'dia 15' },
    ],
    // Curva de evolução esperada (meses de atuação APÓS os 3 meses de treinamento)
    curva: [
      { v: 1, nome: 'Iniciante', de: 0, ate: 6, janela: '1 a 6 meses', desc: 'Primeiros passos no salão após o treinamento — domínio do mix básico, atendimento e sistema, construindo os primeiros resultados.' },
      { v: 2, nome: 'Júnior', de: 6, ate: 12, janela: '6 a 12 meses', desc: 'Ganha autonomia, começa a formar carteira própria e a bater a meta individual com mais consistência.' },
      { v: 3, nome: 'Pleno', de: 12, ate: 24, janela: '12 a 24 meses', desc: 'Vendedor consolidado e referência técnica em cores e produtos, com indicadores de CPF saudáveis.' },
      { v: 4, nome: 'Sênior', de: 24, ate: 36, janela: '24 a 36 meses', desc: 'Alto volume de vendas, fideliza clientes, apoia os colegas mais novos e puxa o resultado da loja.' },
      { v: 5, nome: 'Elite', de: 36, ate: null, janela: 'acima de 36 meses', desc: 'Topo da carreira de vendas — maiores tickets, carteira CNPJ forte e presença na Elite das Vendas CPF.' },
    ],
    dias_uteis_mes: 26,
  };

  // ── Base mensal: lojas (código da filial = loja_id) ──
  C.niveis_lojas = [];   /* Fase 2: vem do Servidor de Dados ST (recortado pelo crachá); ver sync.js */

  // ── Base mensal: vendedores (nome como no Relatório de Vendedores) ──
  C.niveis_vendedores = [];
})(window.CONTEUDO);
