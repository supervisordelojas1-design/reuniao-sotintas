/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO — CHECKLISTS DINÂMICOS (Assessor ST → aba Checklists)
   Três ferramentas de vistoria que o vendedor preenche com o cliente
   (ou com o pintor) e envia pelo WhatsApp:
     • pre_pintura   → Checklist de Avaliação Pré-Pintura (módulo m02)
     • parede_rapido → Checklist Rápido da Parede (módulo m05)
     • vistoria      → Ficha de Vistoria de Obra (módulo m06)

   Tipos de item:
     sn      → Sim / Não / N.A.  (alerta: 'sim' ou 'nao' = resposta que acende o alerta; gravidade: 'vermelho' | 'amarelo'; msg: orientação)
     escolha → uma opção (opções podem ser texto ou { t: 'texto', g: 'vermelho'|'amarelo'|null, msg })
     multi   → várias opções (mesmo formato)
     check   → caixa de marcar (lista de conferência)
     texto   → texto livre
   Resultado (semáforo): vermelho se qualquer alerta vermelho foi acionado; amarelo se só amarelos; verde se nenhum.
   ═══════════════════════════════════════════════════════════════ */
window.CONTEUDO = window.CONTEUDO || {};
(function (C) {
  'use strict';

  const SITUACOES = {
    verde: { rotulo: 'Situação A — superfície aparentemente adequada', emoji: '🟢', orientacao: 'Sem sinais relevantes de patologias. Siga para a preparação normal do sistema de pintura.' },
    amarelo: { rotulo: 'Situação B — precisa de preparação / correção', emoji: '🟡', orientacao: 'Inclua a correção no escopo e no orçamento antes do acabamento.' },
    vermelho: { rotulo: 'Situação C — investigar antes de pintar', emoji: '🔴', orientacao: 'Não trate a pintura como solução antes de identificar e corrigir a origem do problema.' },
  };

  C.checklists = [
    /* ───────────────────────── 1. CHECKLIST PRÉ-PINTURA ───────────────────────── */
    {
      id: 'pre_pintura', modulo_id: 'm02', ordem: 1, icone: '✅', cor: 'azul',
      titulo: 'Checklist de Avaliação Pré-Pintura',
      subtitulo: 'Avalie antes. Prepare certo. Evite retrabalho.',
      intro: 'Os 7 passos para avaliar a superfície antes de abrir a tinta. Preencha com o cliente ou o pintor e envie o resultado pelo WhatsApp.',
      cabecalho: [
        { k: 'cliente', l: 'Cliente' }, { k: 'telefone', l: 'Telefone', tipo: 'tel' }, { k: 'local', l: 'Local / endereço' },
        { k: 'ambiente', l: 'Ambiente (sala, quarto, fachada…)' }, { k: 'data', l: 'Data', tipo: 'date' },
      ],
      secoes: [
        { id: 'identificar', titulo: '1. Identifique a superfície', itens: [
          { id: 'superficie', tipo: 'escolha', texto: 'Qual é a superfície?', opcoes: ['Reboco', 'Massa corrida', 'Massa acrílica', 'Concreto', 'Gesso', 'Drywall', 'Madeira', 'Metal', 'Já pintada'] },
          { id: 'situacao', tipo: 'multi', texto: 'Situação encontrada', opcoes: ['Nova', 'Já pintada', 'Com reparos anteriores', 'Em boas condições', { t: 'Com problemas visíveis', g: 'amarelo', msg: 'Problemas visíveis precisam entrar no escopo da preparação.' }] },
        ] },
        { id: 'base', titulo: '2. Verifique a condição da base', dica: 'Passe os olhos e, quando adequado, a mão sobre a superfície.', itens: [
          { id: 'firme', tipo: 'sn', texto: 'Está firme, sem partes soltas?', alerta: 'nao', gravidade: 'amarelo', msg: 'Base solta ou deteriorada: descubra a causa antes de aplicar novos materiais.' },
          { id: 'seca', tipo: 'sn', texto: 'Está seca?', alerta: 'nao', gravidade: 'vermelho', msg: 'Superfície úmida: investigue a origem da umidade antes de pintar.' },
          { id: 'limpa', tipo: 'sn', texto: 'Está limpa, sem gordura ou óleo?', alerta: 'nao', gravidade: 'amarelo', msg: 'Descontaminação (limpeza com detergente neutro e enxágue) entra na preparação.' },
          { id: 'po', tipo: 'sn', texto: 'Sem excesso de pó (a mão sai limpa)?', alerta: 'nao', gravidade: 'amarelo', msg: 'Superfície soltando pó: fundo preparador e, se o reboco estiver fraco, investigar.' },
          { id: 'descasca', tipo: 'sn', texto: 'Sem descascamentos ou bolhas?', alerta: 'nao', gravidade: 'amarelo', msg: 'Remover tudo o que está soltando e descobrir por que soltou (umidade, pó, aderência).' },
        ] },
        { id: 'umidade', titulo: '3. Procure sinais de umidade', dica: 'Rodapés, cantos, perto do teto, ao redor de janelas, paredes externas e áreas hidráulicas.', itens: [
          { id: 'manchas', tipo: 'sn', texto: 'Manchas de umidade, pintura estufada ou reboco úmido?', alerta: 'sim', gravidade: 'vermelho', msg: 'Umidade ativa: não trate a pintura como solução antes de investigar a origem.' },
          { id: 'mofo', tipo: 'sn', texto: 'Mofo?', alerta: 'sim', gravidade: 'amarelo', msg: 'Tratamento antimofo antes de pintar e verificar ventilação / condensação.' },
          { id: 'sais', tipo: 'sn', texto: 'Sais esbranquiçados (eflorescência)?', alerta: 'sim', gravidade: 'vermelho', msg: 'Eflorescência indica água passando pelo reboco: corrigir a origem antes de pintar.' },
          { id: 'infiltracao', tipo: 'sn', texto: 'Sinais de infiltração?', alerta: 'sim', gravidade: 'vermelho', msg: 'Infiltração: corrigir a origem (telhado, laje, tubulação, parede externa) antes de qualquer pintura.' },
        ] },
        { id: 'antiga', titulo: '4. Verifique a pintura antiga', dica: 'A nova pintura depende da estabilidade da camada que está embaixo.', itens: [
          { id: 'sem_pintura', tipo: 'sn', texto: 'A superfície é nova, sem pintura anterior?' },
          { id: 'aderida', tipo: 'sn', texto: 'A tinta antiga está bem aderida?', alerta: 'nao', gravidade: 'amarelo', msg: 'Não pinte sobre película que já está soltando: raspar, lixar e preparar.' },
          { id: 'brilho', tipo: 'sn', texto: 'A superfície está muito brilhante ou lisa?', alerta: 'sim', gravidade: 'amarelo', msg: 'Lixar para quebrar o brilho e usar fundo / promotor de aderência.' },
          { id: 'camadas', tipo: 'sn', texto: 'Muitas camadas antigas ou reparos aparentes?', alerta: 'sim', gravidade: 'amarelo', msg: 'Avaliar remoção das camadas e uniformizar com fundo preparador.' },
        ] },
        { id: 'defeitos', titulo: '5. Procure defeitos e contaminações', itens: [
          { id: 'defeitos', tipo: 'multi', texto: 'Encontrou:', opcoes: [
            { t: 'Fissuras finas', g: 'amarelo', msg: 'Fissuras finas: abrir, tratar e corrigir antes da massa.' },
            { t: 'Trincas maiores ou recorrentes', g: 'vermelho', msg: 'Trinca relevante ou que voltou: exige investigação técnica antes da pintura.' },
            { t: 'Buracos / desníveis', g: 'amarelo', msg: 'Regularizar com massa e lixar.' },
            { t: 'Gordura / óleo', g: 'amarelo', msg: 'Descontaminar antes de qualquer produto.' },
            { t: 'Ferrugem', g: 'amarelo', msg: 'Remover a ferrugem e aplicar fundo anticorrosivo.' },
            { t: 'Resíduos / sujeira', g: 'amarelo', msg: 'Limpeza completa antes da preparação.' },
            { t: 'Reparos mal executados', g: 'amarelo', msg: 'Refazer o reparo e uniformizar a absorção com fundo.' },
            'Nenhum defeito encontrado',
          ] },
          { id: 'defeitos_obs', tipo: 'texto', texto: 'Onde? (localização e observações)' },
        ] },
        { id: 'preparacao', titulo: '6. Defina a preparação', itens: [
          { id: 'prep', tipo: 'multi', texto: 'Será necessário:', opcoes: ['Limpeza', 'Raspagem', 'Lixamento', 'Remoção de material solto', 'Descontaminação', 'Tratamento de mofo', 'Tratamento de corrosão', 'Correção de fissuras / reparos', 'Regularização com massa', 'Fundo / selador', 'Primer', 'Outra preparação'] },
        ] },
        { id: 'final', titulo: '7. Checklist final — posso começar?', dica: 'Antes de abrir a tinta.', itens: [
          { id: 'f1', tipo: 'check', texto: 'Identifiquei o substrato' },
          { id: 'f2', tipo: 'check', texto: 'A superfície está firme, seca e limpa' },
          { id: 'f3', tipo: 'check', texto: 'Removi materiais sem aderência' },
          { id: 'f4', tipo: 'check', texto: 'Não existe umidade ativa aparente' },
          { id: 'f5', tipo: 'check', texto: 'Corrigi os defeitos necessários' },
          { id: 'f6', tipo: 'check', texto: 'Eliminei contaminações' },
          { id: 'f7', tipo: 'check', texto: 'Preparei as áreas reparadas' },
          { id: 'f8', tipo: 'check', texto: 'O sistema escolhido é compatível com a superfície' },
          { id: 'f9', tipo: 'check', texto: 'Registrei os problemas preexistentes' },
        ] },
        { id: 'obs', titulo: 'Observações', itens: [{ id: 'obs', tipo: 'texto', texto: 'Observações e fotos tiradas' }] },
      ],
      rodape: 'Superfície avaliada → preparação definida → serviço liberado. Use o Especificador para transformar esta avaliação em lista de produtos.',
    },

    /* ───────────────────────── 2. CHECKLIST RÁPIDO DA PAREDE ───────────────────────── */
    {
      id: 'parede_rapido', modulo_id: 'm05', ordem: 2, icone: '👁️', cor: 'vermelho',
      titulo: 'Checklist Rápido da Parede',
      subtitulo: 'A vistoria de 5 minutos antes de fechar o serviço',
      intro: 'Os 10 pontos, as 5 perguntas de histórico e a classificação A/B/C da parede. Não orce só a pintura: orce a condição real da parede.',
      cabecalho: [
        { k: 'cliente', l: 'Cliente' }, { k: 'local', l: 'Local / endereço' }, { k: 'ambiente', l: 'Parede / ambiente' }, { k: 'data', l: 'Data', tipo: 'date' },
      ],
      secoes: [
        { id: 'pontos', titulo: 'Checklist de 5 minutos — os 10 pontos', dica: 'Olhe de perto, passe a mão e observe contra a luz. Marque "Sim" quando encontrar o sinal.', itens: [
          { id: 'umidade', tipo: 'sn', texto: '1. Umidade (manchas, parede úmida, pintura estufada, mofo recorrente)?', alerta: 'sim', gravidade: 'vermelho', msg: 'Com umidade ativa, massa e tinta não resolvem: descubra de onde a água vem.' },
          { id: 'infiltracao', tipo: 'sn', texto: '2. Infiltrações ou vazamentos (mancha que cresce com a chuva, banheiro do outro lado, laje acima)?', alerta: 'sim', gravidade: 'vermelho', msg: 'A origem precisa ser corrigida antes da pintura.' },
          { id: 'aderencia', tipo: 'sn', texto: '3. Pintura existente sem aderência (bordas levantadas, película oca, sai ao raspar)?', alerta: 'sim', gravidade: 'amarelo', msg: 'Não aplique massa ou tinta para "segurar" camada antiga: remover e preparar.' },
          { id: 'fissuras', tipo: 'escolha', texto: '4. Fissuras e trincas?', opcoes: ['Não', { t: 'Fissuras finas', g: 'amarelo', msg: 'Fissuras finas: tratar antes da massa.' }, { t: 'Trincas maiores ou que voltaram', g: 'vermelho', msg: 'Trinca relevante ou recorrente: investigação técnica antes de pintar.' }] },
          { id: 'po', tipo: 'sn', texto: '5. Pó e esfarelamento (a mão sai suja)?', alerta: 'sim', gravidade: 'amarelo', msg: 'Pare e investigue: calcinação, reboco fraco, massa deteriorada ou tinta degradada. Fundo preparador.' },
          { id: 'bolhas', tipo: 'sn', texto: '6. Bolhas e descascamentos?', alerta: 'sim', gravidade: 'amarelo', msg: 'Antes de raspar, descubra por que está soltando (veja o verso do pedaço desprendido).' },
          { id: 'mofo', tipo: 'sn', texto: '7. Mofo ou contaminação (pontos pretos, gordura, óleo, fuligem, silicone)?', alerta: 'sim', gravidade: 'amarelo', msg: 'Descontaminação e tratamento antimofo fazem parte da preparação.' },
          { id: 'reparos', tipo: 'sn', texto: '8. Reparos anteriores (remendos, diferenças de absorção)?', alerta: 'sim', gravidade: 'amarelo', msg: 'Uniformizar com fundo preparador; refazer reparos mal feitos.' },
          { id: 'substrato', tipo: 'escolha', texto: '9. Condição do substrato (o que existe abaixo da pintura)', opcoes: ['Firme, seco, limpo e coeso', { t: 'Com material solto / sem coesão', g: 'amarelo', msg: 'Remover o material solto; a tinta precisa aderir a uma base estável.' }, { t: 'Muito deteriorado', g: 'vermelho', msg: 'Substrato muito deteriorado: investigar e refazer antes de pintar.' }] },
          { id: 'liso', tipo: 'sn', texto: '10. Área brilhante ou muito lisa (esmalte, lavável antiga, baixa porosidade)?', alerta: 'sim', gravidade: 'amarelo', msg: 'Exige lixamento e fundo / promotor de aderência. Não presuma que aceita qualquer produto.' },
        ] },
        { id: 'luz', titulo: 'Observe contra a luz', itens: [
          { id: 'luz', tipo: 'sn', texto: 'Ondulações, marcas de massa, reparos ou marcas de rolo aparecem contra a luz?', alerta: 'sim', gravidade: 'amarelo', msg: 'Quanto maior a luz lateral, mais as imperfeições aparecem: alinhe o padrão de acabamento com o cliente antes de prometer.' },
        ] },
        { id: 'historico', titulo: 'Pergunte o histórico — 5 perguntas', itens: [
          { id: 'h1', tipo: 'texto', texto: 'Quando essa parede foi pintada pela última vez?' },
          { id: 'h2', tipo: 'texto', texto: 'Qual problema ela já apresentou?' },
          { id: 'h3', tipo: 'sn', texto: 'Já houve infiltração ou vazamento?', alerta: 'sim', gravidade: 'vermelho', msg: 'Histórico de infiltração: confirmar que a origem foi corrigida.' },
          { id: 'h4', tipo: 'sn', texto: 'Alguma parte já foi reparada?', alerta: 'sim', gravidade: 'amarelo', msg: 'Reparos anteriores: verificar aderência e absorção.' },
          { id: 'h5', tipo: 'sn', texto: 'O problema já voltou depois de uma pintura anterior?', alerta: 'sim', gravidade: 'vermelho', msg: 'Problema recorrente: a pintura anterior não resolveu a causa. Investigar antes de repetir.' },
        ] },
        { id: 'registro', titulo: 'Registre antes de começar', itens: [
          { id: 'r1', tipo: 'check', texto: 'Fotos gerais da parede' },
          { id: 'r2', tipo: 'check', texto: 'Fotos aproximadas dos defeitos' },
          { id: 'r3', tipo: 'check', texto: 'Condições explicadas ao cliente' },
        ] },
        { id: 'classe', titulo: 'Classificação da parede', dica: 'O app sugere a classificação pelos sinais marcados. Se quiser, defina manualmente.', itens: [
          { id: 'classe', tipo: 'escolha', texto: 'Classificação final', opcoes: ['Automática', 'A — adequada', 'B — preparação / correção', 'C — investigar antes'] },
          { id: 'obs', tipo: 'texto', texto: 'Observações / escopo definido' },
        ] },
      ],
      rodape: 'Antes de dar o preço: defina a preparação, separe pintura de problemas externos, explique as condições e defina o escopo.',
    },

    /* ───────────────────────── 3. FICHA DE VISTORIA DE OBRA ───────────────────────── */
    {
      id: 'vistoria', modulo_id: 'm06', ordem: 3, icone: '📋', cor: 'cinza',
      titulo: 'Ficha de Vistoria de Obra',
      subtitulo: 'Registre as condições antes de começar',
      intro: 'A ficha protege o pintor, orienta o orçamento e organiza a lista de materiais. Viu → registrou → fotografou → informou.',
      cabecalho: [
        { k: 'cliente', l: 'Cliente' }, { k: 'telefone', l: 'Telefone', tipo: 'tel' }, { k: 'local', l: 'Endereço da obra' },
        { k: 'responsavel', l: 'Responsável pela vistoria' }, { k: 'data', l: 'Data', tipo: 'date' },
      ],
      secoes: [
        { id: 'ident', titulo: '1. Identificação da vistoria', itens: [
          { id: 'servico', tipo: 'multi', texto: 'Tipo de serviço', opcoes: ['Pintura interna', 'Pintura externa', 'Repintura', 'Pintura nova', 'Madeira', 'Metal', 'Outro'] },
          { id: 'ambientes', tipo: 'multi', texto: 'Ambientes avaliados', opcoes: ['Sala', 'Quartos', 'Cozinha', 'Banheiro', 'Área externa', 'Fachada', 'Outro'] },
        ] },
        { id: 'condicao', titulo: '2. Condição geral da superfície', itens: [
          { id: 'superficie', tipo: 'escolha', texto: 'Superfície principal', opcoes: ['Reboco', 'Massa corrida', 'Massa acrílica', 'Concreto', 'Gesso', 'Drywall', 'Madeira', 'Metal', 'Já pintada'] },
          { id: 'estado', tipo: 'multi', texto: 'Estado encontrado', opcoes: ['Bom estado', { t: 'Necessita limpeza', g: 'amarelo' }, { t: 'Necessita preparação', g: 'amarelo' }, { t: 'Necessita reparos', g: 'amarelo' }, { t: 'Apresenta material solto', g: 'amarelo', msg: 'Remover todo o material solto antes de qualquer produto.' }, { t: 'Apresenta umidade', g: 'vermelho', msg: 'Umidade: identificar a origem antes de pintar.' }, { t: 'Necessita investigação adicional', g: 'vermelho', msg: 'Há sinais que exigem investigação técnica antes do serviço.' }] },
          { id: 'antiga', tipo: 'multi', texto: 'Condição da pintura antiga', opcoes: ['Bem aderida', { t: 'Descascando', g: 'amarelo', msg: 'Raspar e remover a película sem aderência.' }, { t: 'Com bolhas', g: 'amarelo', msg: 'Descobrir a causa das bolhas (umidade, pó, incompatibilidade).' }, { t: 'Pulverulenta (solta pó)', g: 'amarelo', msg: 'Fundo preparador após remover o pó.' }, { t: 'Muito brilhante', g: 'amarelo', msg: 'Lixar e usar promotor de aderência.' }, { t: 'Com manchas', g: 'amarelo', msg: 'Identificar a origem das manchas (umidade, gordura, fuligem).' }, 'Não possui pintura anterior'] },
        ] },
        { id: 'problemas', titulo: '3. Problemas identificados e localização', itens: [
          { id: 'problemas', tipo: 'multi', texto: 'Problemas encontrados', opcoes: [
            { t: 'Umidade', g: 'vermelho', msg: 'Umidade ativa: corrigir a origem antes da pintura.' }, { t: 'Infiltração aparente', g: 'vermelho', msg: 'Infiltração: corrigir a origem antes da pintura.' }, { t: 'Mofo', g: 'amarelo', msg: 'Tratamento antimofo e ventilação.' },
            { t: 'Bolhas', g: 'amarelo' }, { t: 'Descascamento', g: 'amarelo' }, { t: 'Eflorescência', g: 'vermelho', msg: 'Sais na superfície: há água passando pelo reboco.' }, { t: 'Fissuras', g: 'amarelo', msg: 'Tratar as fissuras antes da massa.' }, { t: 'Trincas', g: 'vermelho', msg: 'Trincas relevantes exigem avaliação técnica.' },
            { t: 'Reboco deteriorado', g: 'vermelho', msg: 'Refazer o reboco antes de pintar.' }, { t: 'Massa soltando', g: 'amarelo' }, { t: 'Falha de aderência', g: 'amarelo' }, { t: 'Manchas', g: 'amarelo' }, { t: 'Ferrugem', g: 'amarelo', msg: 'Remover a ferrugem e aplicar fundo anticorrosivo.' },
            { t: 'Madeira deteriorada', g: 'amarelo', msg: 'Substituir ou recuperar a madeira antes do acabamento.' }, { t: 'Gordura / óleo', g: 'amarelo', msg: 'Descontaminar antes de qualquer produto.' }, 'Outros', 'Nenhum problema encontrado',
          ] },
          { id: 'localizacao', tipo: 'texto', texto: 'Localização de cada problema' },
          { id: 'fora', tipo: 'escolha', texto: 'Existe suspeita de problema fora da pintura?', opcoes: ['Não', { t: 'Sim', g: 'vermelho', msg: 'Problema fora da pintura (hidráulica, estrutura, cobertura): corrigir antes.' }, { t: 'Necessita investigação', g: 'vermelho', msg: 'Investigar antes de definir o serviço.' }] },
          { id: 'fora_qual', tipo: 'texto', texto: 'Qual? (se houver suspeita)' },
        ] },
        { id: 'preparacao', titulo: '4. Preparação necessária', itens: [
          { id: 'prep', tipo: 'multi', texto: 'Com base na vistoria', opcoes: ['Limpeza', 'Raspagem', 'Lixamento', 'Remoção de material solto', 'Tratamento de mofo', 'Descontaminação', 'Correção de fissuras', 'Correção de imperfeições', 'Regularização com massa', 'Tratamento de corrosão', 'Fundo / selador', 'Primer'] },
          { id: 'antes', tipo: 'texto', texto: 'Existe algo que precisa ser resolvido antes da pintura? O quê?' },
          { id: 'situacao', tipo: 'escolha', texto: 'Situação da obra', opcoes: ['Liberada para preparação', { t: 'Liberada com ressalvas', g: 'amarelo', msg: 'Liberada com ressalvas: as ressalvas entram no escopo e no orçamento.' }, { t: 'Aguardar correção de outro problema', g: 'vermelho', msg: 'Obra aguardando correção: não iniciar a pintura antes.' }] },
        ] },
        { id: 'fotos', titulo: '5. Registro fotográfico', dica: 'Fotos gerais e aproximadas, antes de qualquer intervenção. Anote local e problema de cada foto.', itens: [
          { id: 'fotos', tipo: 'escolha', texto: 'Registro fotográfico realizado?', opcoes: ['Sim', 'Não'] },
          { id: 'fotos_lista', tipo: 'texto', texto: 'Fotos (local — problema observado)' },
        ] },
        { id: 'final', titulo: '6. Observações e registro final', itens: [
          { id: 'obs', tipo: 'texto', texto: 'Observações importantes' },
          { id: 'informado', tipo: 'escolha', texto: 'Problemas preexistentes informados ao cliente?', opcoes: ['Sim', 'Não se aplica', { t: 'Ainda não', g: 'amarelo', msg: 'Informe o cliente antes de iniciar: evita discussões futuras.' }] },
          { id: 'recomendacoes', tipo: 'texto', texto: 'Recomendações antes do serviço' },
          { id: 'res1', tipo: 'check', texto: 'Superfície em condição adequada (ou preparação definida)' },
          { id: 'res2', tipo: 'check', texto: 'Problemas preexistentes registrados' },
          { id: 'res3', tipo: 'check', texto: 'Registro fotográfico realizado' },
        ] },
      ],
      rodape: 'Vistoria bem feita evita retrabalho e discussões futuras. Ofereça a ficha aos pintores parceiros da loja.',
    },
  ];

  C.checklists_situacoes = SITUACOES;
})(window.CONTEUDO);
