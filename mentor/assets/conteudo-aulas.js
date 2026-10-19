/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO — Conteúdo base (parte 2 de 4): AULAS
   Cada aula resume um trecho do guia original e mostra as
   páginas correspondentes (assets/material/<módulo>/pNNN.jpg).
   ═══════════════════════════════════════════════════════════════ */
window.CONTEUDO = window.CONTEUDO || {};

(function () {
  const pg = (mod, de, ate) => { const l = []; for (let i = de; i <= ate; i++) l.push(`assets/material/${mod}/p${String(i).padStart(3, '0')}.jpg`); return l; };
  const A = [];
  const add = (modulo_id, ordem, titulo, duracao_min, de, ate, conteudo) => A.push({ id: `${modulo_id}a${String(ordem).padStart(2, '0')}`, modulo_id, ordem, titulo, duracao_min, paginas: pg(modulo_id, de, ate), pagina_inicial: de, pagina_final: ate, conteudo, xp: 20 });

  /* ══════════════ M01 — PINTURA SEM RETRABALHO ══════════════ */
  add('m01', 1, 'O retrabalho começa antes do defeito aparecer', 5, 2, 3, `
<p>Uma pintura pode parecer pronta hoje e apresentar problemas dias ou semanas depois: descascamento, manchas, diferença de acabamento, falhas de cobertura, bolhas, marcas e retoques aparentes. Quando isso acontece, o pintor precisa voltar — e <b>voltar custa dinheiro</b>: tempo, material, deslocamento, diária e novas oportunidades perdidas.</p>
<div class="regra">Faça uma vez. Faça direito. <b>Evite voltar para fazer de graça.</b></div>
<h2>Não basta saber pintar</h2>
<p>Saber movimentar o rolo não é suficiente. Um serviço profissional depende de uma sequência:</p>
<ol>
<li><b>Analisar</b> — entender a superfície antes de começar.</li>
<li><b>Preparar</b> — corrigir o que pode comprometer a pintura.</li>
<li><b>Escolher</b> — usar produtos e ferramentas adequados.</li>
<li><b>Aplicar</b> — respeitar orientação, diluição, secagem e condições de aplicação.</li>
<li><b>Conferir</b> — encontrar falhas antes do cliente.</li>
<li><b>Entregar</b> — finalizar e registrar corretamente.</li>
</ol>
<div class="destaque">O lucro também está nos erros que você consegue evitar.</div>
<h2>A regra de ouro: não pinte o problema</h2>
<p>Tinta não corrige automaticamente: infiltração, umidade, reboco fraco, superfície soltando, gordura, mofo ativo, fissuras, poeira e tinta antiga sem aderência. Cobrir o problema pode melhorar a aparência temporariamente, <b>mas a falha continua embaixo</b>.</p>
<div class="dica">Antes de perguntar "qual tinta vou usar?", pergunte: <b>"essa superfície está realmente pronta para receber pintura?"</b></div>
<h2>As 3 fases do serviço</h2>
<table><tr><th>ANTES</th><th>DURANTE</th><th>DEPOIS</th></tr>
<tr><td>Diagnóstico, proteção, preparação, produto, planejamento</td><td>Diluição, ferramentas, aplicação, secagem, controle</td><td>Inspeção, retoques, limpeza, registro, entrega</td></tr></table>
<p>Um erro em qualquer uma dessas etapas pode aparecer somente no final.</p>
<div class="dica"><b>Na loja:</b> quando o cliente diz "me vê uma tinta pra essa parede", a primeira pergunta do vendedor campeão é sobre a <b>superfície</b>, não sobre a cor.</div>`);

  add('m01', 2, 'Diagnóstico da parede: passe a mão, observe contra a luz', 5, 4, 4, `
<h2>Checklist antes de começar</h2>
<p>Antes de abrir a tinta, confira: superfície firme · sem partes soltas · sem poeira excessiva · sem gordura ou sujeira · sem problema de umidade aparente · fissuras avaliadas · imperfeições identificadas · produto adequado à superfície · cor confirmada · quantidade conferida · diluição consultada · tempo de secagem consultado · ambiente protegido · ferramentas disponíveis · cliente alinhado sobre o serviço.</p>
<div class="destaque">10 minutos de conferência podem evitar horas de correção.</div>
<h2>Faça o diagnóstico da parede</h2>
<p><b>Passe a mão. Observe contra a luz.</b> Procure:</p>
<ul>
<li><b>Esfarelamento</b> — a superfície solta partículas?</li>
<li><b>Descascamento</b> — existem áreas perdendo aderência?</li>
<li><b>Umidade</b> — manchas, bolhas ou regiões constantemente úmidas?</li>
<li><b>Mofo</b> — pontos escuros ou crescimento recorrente?</li>
<li><b>Fissuras</b> — aberturas na superfície?</li>
<li><b>Ondulações</b> — irregularidades visíveis?</li>
<li><b>Manchas</b> — gordura, ferrugem, infiltração ou contaminação?</li>
</ul>
<h2>Teste simples de firmeza</h2>
<p>Passe a mão sobre a parede. Se ela sair com grande quantidade de pó, partículas ou material solto, a superfície merece atenção antes da pintura. Observe também se a tinta antiga solta facilmente, apresenta placas, está estufada ou perdeu aderência.</p>
<div class="regra">REGRA PRÁTICA: não construa uma pintura nova sobre uma camada que já está falhando. A preparação deve chegar a uma <b>base firme</b> e compatível com o sistema escolhido.</div>
<h2>Teste de aderência da pintura antiga</h2>
<p>Antes de simplesmente pintar por cima, procure áreas descascando, estufadas, trincadas, soltando nas bordas ou com baixa aderência. Lixar e pintar apenas a parte visivelmente solta pode não resolver quando existe uma falha maior de aderência. <b>Investigue a extensão do problema.</b></p>`);

  add('m01', 3, 'Umidade, mofo, esfarelamento, descascamento e fissuras', 6, 5, 5, `
<h2>Umidade: não esconda com tinta</h2>
<p>Encontrou parede úmida, bolhas, manchas recorrentes ou sinais de infiltração? <b>Pare e investigue.</b> A origem pode estar em vazamentos, infiltração externa, entrada de água ou outras condições da edificação.</p>
<div class="atencao"><b>Erro comum:</b> raspar → passar massa → pintar → entregar. Se a causa continuar, o problema volta. O correto é identificar e tratar a causa antes de qualquer recuperação. Quando estiver fora da sua especialidade, informe o cliente e recomende avaliação adequada.</div>
<h2>Mofo não é só uma mancha</h2>
<p>Pintar diretamente sobre uma superfície contaminada não resolve a causa. Antes da pintura: 1) identifique a extensão do problema; 2) verifique possíveis fontes de umidade; 3) faça a limpeza/tratamento adequado; 4) aguarde as condições necessárias; 5) utilize o sistema de pintura recomendado. Use os EPIs adequados. <b>Não prometa que uma demão de tinta resolverá a origem do mofo.</b></p>
<h2>Parede esfarelando</h2>
<p>Passa a mão e sai pó? A parede parece fraca? Partes se desprendem? <b>Não ignore.</b> Pode ser necessário remover partes sem aderência, limpar corretamente, tratar a base e utilizar fundo/preparador apropriado conforme o fabricante. Erro comum: aplicar acabamento direto sobre uma superfície fraca esperando que a tinta "segure".</p>
<h2>Descascamento</h2>
<p><b>Não faça:</b> pintar por cima das partes soltas. <b>Faça:</b> remova as áreas sem aderência, avalie as bordas, verifique a condição da base, identifique possíveis causas e prepare corretamente antes de pintar.</p>
<div class="dica">A tinta nova pode aderir à tinta antiga. Mas se a tinta antiga não estiver aderida à parede… tudo vai junto.</div>
<h2>Fissura não é toda igual</h2>
<p>Não trate automaticamente como simples imperfeição estética. Avalie: localização, largura aparente, extensão, padrão, recorrência e sinais de movimentação. Algumas fissuras exigem tratamento específico ou avaliação técnica. <b>Primeiro entenda o problema. Depois escolha o tratamento.</b></p>`);

  add('m01', 4, 'Preparação: sujeira, lixamento, massa e luz lateral', 5, 6, 6, `
<h2>Superfície suja = aderência em risco</h2>
<p>Antes da pintura, procure poeira, gordura, óleo, fuligem, resíduos, sujeira acumulada e produtos aplicados anteriormente. Uma parede visualmente "seca" não significa limpa. <b>Não pinte sujeira.</b></p>
<h2>O lixamento não é só para "deixar liso"</h2>
<p>Lixar serve para corrigir irregularidades, nivelar reparos, remover partes inadequadas e preparar determinadas superfícies. Mas lixar também gera <b>pó</b> — e esse pó precisa ser removido antes da aplicação seguinte.</p>
<div class="atencao"><b>Erro clássico:</b> lixar muito bem… e pintar sobre todo o resíduo.</div>
<h2>Massa não corrige qualquer problema</h2>
<p>Massa é para correção e nivelamento dentro da aplicação indicada. Ela <b>não</b> resolve infiltração, umidade ativa, base fraca, movimentação estrutural nem superfície sem preparação. Antes de aplicar, confira: tipo de ambiente, tipo de superfície, produto indicado e instruções do fabricante. Produto certo no lugar errado também gera retrabalho.</p>
<h2>Massa: menos pressa, mais controle</h2>
<p>Evite camadas excessivas, aplicação sobre base inadequada, lixamento antes da secagem e pintura antes da preparação estar pronta. Busque: camadas controladas, nivelamento progressivo, secagem adequada, lixamento uniforme e limpeza entre etapas. <b>Objetivo: criar uma base uniforme.</b></p>
<h2>O problema da luz lateral</h2>
<p>Algumas imperfeições quase desaparecem de frente, mas aparecem quando entra luz pela janela, uma luminária ilumina lateralmente ou o ambiente recebe luz rasante. Antes do acabamento: observe de diferentes ângulos, use iluminação auxiliar e procure riscos, ondulações, marcas de massa e furos. <b>É melhor encontrar antes do cliente.</b></p>
<div class="dica"><b>Na loja:</b> massa corrida (PVA) é para interior seco; em área externa, banheiro e cozinha a indicação é <b>massa acrílica</b>.</div>`);

  add('m01', 5, 'Cor, produto e diluição: leia a embalagem', 5, 7, 7, `
<h2>Confirme a cor antes de pintar</h2>
<p>Nunca confie apenas em "é aquele cinza", "é um bege clarinho", "pode fazer igual à foto". <b>Registre:</b> marca, linha, nome da cor, código, acabamento e ambiente. Quando possível, faça uma amostra e peça a confirmação do cliente. Cor errada pode significar uma parede inteira refeita.</p>
<h2>A tela do celular pode enganar</h2>
<p>Uma referência no WhatsApp não é garantia de reprodução exata. A aparência muda conforme tela, brilho, câmera, iluminação, ambiente, produto e superfície.</p>
<div class="dica">Diga ao cliente: <b>"A foto serve como referência. Vamos confirmar a cor real antes da aplicação completa."</b> Isso evita que uma referência vaga vire discussão depois.</div>
<h2>Leia a embalagem e a ficha do produto</h2>
<p>Antes de usar, confira as instruções do fabricante: superfícies indicadas, preparação, diluição, ferramenta de aplicação, número de demãos, secagem, intervalo entre demãos, rendimento, limpeza e restrições. <b>Não existe diluição universal.</b></p>
<h2>Diluição errada custa caro</h2>
<p>Colocar água ou diluente "no olho" altera o comportamento do produto. <b>Não faça:</b> "eu sempre coloco mais ou menos isso". <b>Faça:</b> leia a orientação, confira a quantidade de tinta, calcule a proporção, meça e misture corretamente. Crie um padrão para repetir o processo com consistência.</p>
<h2>Misture o produto corretamente</h2>
<p>Antes e durante o uso, siga a homogeneização indicada. Componentes podem decantar e precisam ser incorporados. Com mais de uma embalagem da mesma cor, planeje o uso para reduzir diferenças entre lotes. Não faça: abrir → mexer rapidamente → começar sem conferir. <b>Preparação do material também faz parte da pintura.</b></p>`);

  add('m01', 6, 'Ferramentas, proteção e sequência de aplicação', 7, 8, 9, `
<h2>Ferramenta certa faz diferença</h2>
<p>O rolo, pincel, trincha ou equipamento precisa ser adequado ao produto e à superfície. Uma ferramenta inadequada pode gerar textura indesejada, dificuldade de aplicação, marcas e perda de produtividade. Consulte a recomendação do produto antes de começar.</p>
<h2>Ferramenta suja = problema novo</h2>
<p>Antes de utilizar: rolo limpo, trincha limpa, bandeja limpa, recipiente limpo, equipamento sem resíduos e em boas condições. Resíduos antigos podem contaminar o material. <b>Não economize no lugar errado</b> — uma ferramenta ruim custa mais em correção.</p>
<h2>Proteja antes de produzir</h2>
<p>Proteja piso, rodapés, portas, janelas, bancadas, móveis, tomadas (com os devidos cuidados de segurança) e objetos próximos. Remover respingos depois consome tempo e alguns danos são difíceis de corrigir. <b>Proteger é mais rápido do que limpar o prejuízo.</b></p>
<h2>Fita não é "coloco e esqueço"</h2>
<p>A fita de mascaramento precisa ser compatível com superfície, produto, tempo de permanência e condições do local. Aplique sobre superfície adequada, pressione corretamente, não deixe além do recomendado e retire no momento e da forma certos.</p>
<h2>Organize a sequência do ambiente</h2>
<p>Não comece aleatoriamente. Ordem sugerida: proteção → correções → preparação → teto → paredes → detalhes → acabamentos → retoques → limpeza → inspeção. Evite executar uma etapa que depois será danificada pela próxima. <b>Pense duas etapas à frente.</b></p>
<h2>Recorte e rolo precisam conversar</h2>
<p>Diferenças perceptíveis entre áreas aparecem quando recorte e rolo são feitos em condições muito diferentes. Planeje sequência, tamanho da área, ritmo de trabalho, condições ambientais e recomendação do produto para manter a aparência uniforme.</p>
<h2>Não tente "espremer" o rolo · cuidado com o excesso de pressão</h2>
<p>Aplicação inconsistente gera diferenças de acabamento. Busque consistência: carregamento adequado, distribuição controlada, pressão coerente e ritmo. Quando a ferramenta "secar", <b>recarregue</b> — não transforme força em cobertura. Padrão: carregar → distribuir → uniformizar → repetir.</p>
<h2>Respeite o tempo entre demãos · mais tinta não substitui mais demãos</h2>
<p>Parede seca ao toque não significa pronta para a próxima demão: temperatura, ventilação e umidade mudam o tempo. Quando a cobertura não está adequada, não carregue excessivamente uma única demão. <b>Siga o sistema do produto:</b> aplicação adequada, secagem adequada, próxima demão quando indicada.</p>
<div class="dica"><b>Na loja:</b> ao vender a tinta, ofereça o rolo certo (lã baixa para liso, lã alta para textura/reboco), bandeja, fita, lixa e lona. Isso é cuidado com o cliente — e ticket maior.</div>`);

  add('m01', 7, 'Clima, retoques, registro e entrega', 8, 10, 11, `
<h2>O clima faz parte da obra</h2>
<p>Especialmente em áreas externas, observe chuva, umidade, temperatura, vento, sol direto e previsão para o período de secagem. <b>Não deixe o cronograma mandar mais que a superfície.</b> Adiar uma etapa custa menos do que refazê-la. A obra não termina na última passada do rolo: o produto ainda precisa secar e curar.</p>
<h2>Cuidado com retoques</h2>
<p>Retoque parece simples, mas dependendo de produto, acabamento, ferramenta, tempo desde a aplicação e iluminação, a área corrigida fica perceptível. Antes de retocar: avalie tamanho e localização, use material compatível, reproduza o método adequado e, quando necessário, trabalhe uma área maior. Antes de corrigir, pergunte: é sujeira ou falha? A tinta está totalmente seca? A correção vai aparecer? <b>Primeiro diagnostique. Depois corrija.</b></p>
<h2>Registre — uma cortesia que evita discussão</h2>
<p>Antes do serviço, fotografe as condições existentes: manchas, fissuras, infiltrações, descascamentos, móveis próximos, danos existentes e áreas fora do serviço. Registre também o que foi combinado: ambiente, cor, produto/acabamento, áreas incluídas e não incluídas, correções combinadas e observações. <b>Quanto mais claro o combinado, menor o espaço para interpretações.</b></p>
<h2>"Já que você está aqui…" e "o cliente mudou de ideia"</h2>
<p>Vários "só isso" viram horas. Pare, avalie, explique, defina se está incluído e registre o serviço adicional. Retrabalho também nasce de escopo mal definido. Mudança de cor depois de pintado é diferente de defeito de execução: confirme a cor, registre a escolha e faça amostra. <b>Separe correção de execução de mudança solicitada pelo cliente.</b></p>
<h2>Não esconda um problema para entregar mais rápido</h2>
<p>Encontrou algo inesperado? Pare, registre, avise e explique o impacto. "Vou pintar e talvez ninguém perceba" — se aparecer depois, o problema volta maior e junto vem a dúvida sobre seu serviço. Profissionalismo também é saber dizer: <b>"antes de continuar, precisamos resolver isso."</b></p>
<h2>Inspeção antes da entrega: a regra dos 3 olhares</h2>
<p>Antes de chamar o cliente, faça sua própria vistoria: cobertura, uniformidade, recortes, cantos, encontros entre cores, teto, rodapés, portas e janelas, pontos corrigidos, respingos, proteções removidas e limpeza. Observe <b>de perto</b> (recortes e cantos), <b>de longe</b> (uniformidade) e <b>com a luz do ambiente</b> (sombras e marcas). Encontre você primeiro.</p>
<h2>Quando o cliente apontar um problema</h2>
<p>Não responda "isso não é comigo" nem assuma que tudo é erro seu. Faça uma análise: veja pessoalmente, identifique o sintoma, verifique a superfície, revise o que foi executado, confira os produtos e procure a causa provável. <b>Profissional não chuta. Profissional investiga.</b></p>
<h2>As 10 causas de retrabalho que você deve vigiar</h2>
<ol><li>Pintar sem avaliar a superfície.</li><li>Ignorar umidade ou contaminação.</li><li>Pintar sobre material sem aderência.</li><li>Preparar mal a base.</li><li>Usar produto inadequado.</li><li>Diluir sem seguir orientação.</li><li>Não respeitar intervalos e condições de aplicação.</li><li>Trabalhar sem proteger o ambiente.</li><li>Não confirmar cor e escopo.</li><li>Entregar sem inspeção final.</li></ol>
<div class="regra">Antes de pintar, <b>analise</b>. Antes de corrigir, <b>descubra a causa</b>. Antes de aplicar, <b>prepare</b>. Antes de entregar, <b>confira</b>.</div>`);

  /* ══════════════ M02 — CHECKLIST PRÉ-PINTURA ══════════════ */
  add('m02', 1, 'Identifique a superfície e verifique a condição da base', 4, 2, 2, `
<p>Uma avaliação rápida antes do serviço evita problemas, retrabalho e prejuízos. <b>Avalie antes. Prepare certo. Evite retrabalho.</b></p>
<h2>1. Identifique a superfície</h2>
<p>Antes de começar, marque qual superfície será trabalhada: reboco · massa corrida · massa acrílica · concreto · gesso · drywall · madeira · metal · superfície já pintada. E a situação: nova, já pintada, com reparos anteriores, em boas condições ou com problemas visíveis.</p>
<h2>2. Verifique a condição da base</h2>
<p>Passe os olhos e, quando adequado, a mão sobre a superfície. A superfície está: firme · seca · limpa · sem partes soltas · sem excesso de pó · sem gordura ou óleo · sem descascamentos · sem bolhas?</p>
<div class="atencao">Se a base estiver solta, pulverulenta ou deteriorada, <b>descubra a causa</b> antes de aplicar novos materiais.</div>
<div class="dica"><b>Na loja:</b> estas duas perguntas — "qual é a superfície?" e "como ela está?" — definem quase tudo que o cliente precisa levar: fundo, massa, lixa e a tinta certa.</div>`);

  add('m02', 2, 'Umidade, pintura antiga, defeitos e contaminações', 4, 3, 3, `
<h2>3. Procure sinais de umidade</h2>
<p>Verifique principalmente rodapés, cantos, próximo ao teto, ao redor de janelas, paredes externas e áreas hidráulicas. Existem manchas de umidade, bolhas, mofo, sais esbranquiçados, reboco úmido/deteriorado ou sinais de infiltração?</p>
<div class="atencao">Encontrou umidade ativa? <b>Não trate a pintura como solução</b> antes de investigar a origem.</div>
<h2>4. Verifique a pintura antiga</h2>
<p>A tinta está bem aderida? Existem partes descascando? Bolhas? A superfície está muito brilhante? Solta pó ao passar a mão? Existem muitas camadas antigas? Há reparos aparentes?</p>
<div class="regra">REGRA RÁPIDA: a nova pintura depende da estabilidade da camada que está embaixo. <b>Não pinte sobre uma película que já está soltando.</b></div>
<h2>5. Procure defeitos e contaminações</h2>
<p>Antes da preparação: fissuras, trincas, buracos, desníveis, mofo, gordura, óleo, ferrugem, resíduos e reparos mal executados. Encontrou algum? <b>Registre e defina a correção</b> antes de iniciar a pintura.</p>`);

  add('m02', 3, 'Defina a preparação e libere o serviço', 4, 4, 7, `
<h2>6. Defina a preparação</h2>
<p>Depois da avaliação, marque o que será necessário: limpeza · raspagem · lixamento · remoção de material solto · descontaminação · tratamento de mofo · tratamento de corrosão · correção de fissuras/reparos · regularização com massa · fundo/selador · primer · outra preparação.</p>
<h2>7. Checklist final — posso começar?</h2>
<p>Antes de abrir a tinta: identifiquei o substrato · a superfície está firme, seca e limpa · removi materiais sem aderência · não existe umidade ativa aparente · corrigi os defeitos necessários · eliminei contaminações · preparei áreas reparadas · o sistema escolhido é compatível com a superfície · registrei problemas preexistentes.</p>
<div class="destaque">SUPERFÍCIE AVALIADA → PREPARAÇÃO DEFINIDA → SERVIÇO LIBERADO</div>
<h2>Ficha de avaliação pré-pintura</h2>
<p>A ficha registra cliente, local, ambiente, superfície, data, condição encontrada (boa / necessita preparação / necessita correções / necessita investigação de outro problema), problemas identificados, preparação definida, observações e registro fotográfico.</p>
<div class="regra">REGRA FINAL: não comece pela tinta. <b>Comece avaliando a superfície.</b> Avaliar hoje é entregar um trabalho melhor amanhã.</div>
<div class="dica"><b>Na loja:</b> use o <b>Especificador</b> do Assessor ST para transformar essa avaliação em uma lista de produtos e enviar ao cliente pelo WhatsApp.</div>`);

  /* ══════════════ M03 — TABELA SUPERFÍCIE × PREPARAÇÃO ══════════════ */
  add('m03', 1, 'Como usar a tabela: superfície + condição + sistema', 5, 2, 3, `
<p>Nem toda superfície pode receber tinta do mesmo jeito. Reboco novo exige cuidados diferentes de parede já pintada; madeira não é preparada como metal; superfície brilhante não deve ser tratada como parede fosca. E até duas paredes visualmente iguais podem exigir preparações diferentes dependendo da condição.</p>
<h2>Para cada superfície, quatro perguntas</h2>
<ol>
<li><b>Qual é a base?</b> Reboco? Massa? Concreto? Gesso? Drywall? Madeira? Metal?</li>
<li><b>Qual é a condição?</b> Nova? Antiga? Pintada? Pulverulenta? Brilhante? Úmida? Contaminada?</li>
<li><b>O que precisa ser corrigido?</b> Sujeira, pó, baixa aderência, irregularidades, umidade, corrosão, contaminação, película antiga solta.</li>
<li><b>Qual preparação o sistema exige?</b> Só depois disso defina fundo, primer, massa e acabamento.</li>
</ol>
<div class="regra">A PREPARAÇÃO É DEFINIDA POR: <b>SUPERFÍCIE + CONDIÇÃO + SISTEMA DE PINTURA</b> — não apenas pelo tipo de tinta que o cliente quer usar.</div>
<h2>Tabela mestra — consulta rápida</h2>
<table><tr><th>Superfície</th><th>Antes de pintar, verifique</th><th>Preparação principal</th></tr>
<tr><td>Reboco novo</td><td>Cura, umidade, firmeza e sais</td><td>Aguardar condição adequada, limpar e preparar conforme sistema</td></tr>
<tr><td>Reboco antigo</td><td>Pó, fissuras, partes soltas</td><td>Remover material instável, limpar e reparar</td></tr>
<tr><td>Massa corrida</td><td>Firmeza, lixamento e pó</td><td>Lixar, remover pó e uniformizar</td></tr>
<tr><td>Massa acrílica</td><td>Firmeza, nivelamento e contaminação</td><td>Lixar e limpar</td></tr>
<tr><td>Concreto</td><td>Cura, desmoldante, pó e baixa porosidade</td><td>Limpeza e preparação compatível</td></tr>
<tr><td>Gesso</td><td>Pó, absorção e umidade</td><td>Limpar e regularizar absorção conforme sistema</td></tr>
<tr><td>Drywall</td><td>Juntas, massa, pó e diferenças de absorção</td><td>Lixar, limpar e uniformizar</td></tr>
<tr><td>Parede fosca já pintada</td><td>Aderência, sujeira, mofo e reparos</td><td>Limpeza, lixamento quando necessário e correções</td></tr>
<tr><td>Parede acetinada/brilhante</td><td>Brilho e baixa aderência</td><td>Fosquear/preparar e limpar</td></tr>
<tr><td>Esmalte antigo</td><td>Aderência e brilho</td><td>Preparação para criar condição de aderência</td></tr>
<tr><td>Madeira nova</td><td>Umidade, resina, nós e imperfeições</td><td>Lixar, limpar e utilizar sistema para madeira</td></tr>
<tr><td>Madeira pintada</td><td>Película solta e acabamento antigo</td><td>Remover partes instáveis, lixar e preparar</td></tr>
<tr><td>Metal ferroso</td><td>Ferrugem, gordura e pintura antiga</td><td>Desoxidar/descontaminar e aplicar sistema anticorrosivo</td></tr>
<tr><td>Galvanizado/alumínio</td><td>Contaminação e baixa aderência</td><td>Limpeza e primer compatível</td></tr>
<tr><td>Superfície com mofo</td><td>Origem da umidade</td><td>Tratar causa e descontaminar antes de pintar</td></tr>
<tr><td>Superfície engordurada</td><td>Óleo e gordura</td><td>Desengordurar antes de qualquer pintura</td></tr></table>`);

  add('m03', 2, 'Reboco, massa, concreto, gesso e drywall', 7, 4, 5, `
<h2>1. Reboco novo</h2>
<p><b>Verifique:</b> cura recomendada atingida? Seco? Firme? Solta areia ou pó? Fissuras? Sais esbranquiçados? Manchas de umidade? <b>Preparação:</b> aguarde a cura, remova poeira e material solto, corrija irregularidades, avalie absorção e firmeza, utilize fundo/selador compatível quando previsto, só então massa e/ou acabamento.</p>
<div class="atencao">NÃO FAÇA: não pinte reboco ainda úmido ou recém-executado só porque parece seco ao toque.</div>
<h2>2. Reboco antigo</h2>
<p><b>Verifique:</b> firme? Esfarela? Partes ocas? Fissuras? Umidade? Reparos antigos? Material pulverulento? <b>Preparação:</b> raspe material solto, remova pó, recupere regiões deterioradas, trate fissuras, uniformize reparos e prepare conforme absorção e condição. Alerta: se o reboco estiver muito fraco, a pintura não estabiliza uma base severamente deteriorada.</p>
<h2>3. Massa corrida</h2>
<p>Normalmente em áreas internas secas. <b>Verifique:</b> firme? Completamente seca? Marcas de desempenadeira? Ondulações? Excesso de pó? Nivelada? <b>Preparação:</b> lixe, corrija pequenas imperfeições, remova totalmente o pó, avalie a uniformidade da absorção e aplique o acabamento indicado.</p>
<div class="atencao">ERRO COMUM: pintar diretamente sobre o pó do lixamento. A tinta deve aderir à superfície, não à poeira.</div>
<h2>4. Massa acrílica</h2>
<p>Usada quando se deseja maior resistência à umidade ambiental (externo, banheiro, cozinha). <b>Verifique:</b> firme? Seca? Lixada? Imperfeições? Pó? <b>Preparação:</b> lixe, corrija, elimine o pó, uniformize e siga com o sistema compatível. <b>Importante:</b> massa acrílica não resolve infiltração ativa.</p>
<h2>5. Concreto</h2>
<p>Pode ter baixa porosidade, resíduos ou desmoldante. <b>Verifique:</b> novo? Curado? Desmoldante? Muito liso? Pó? Sais? Umidade? <b>Preparação:</b> remova contaminantes, corrija falhas, avalie porosidade, crie condição de aderência e use sistema recomendado para concreto. Concreto visualmente limpo ainda pode ter resíduos.</p>
<h2>6. Gesso</h2>
<p><b>Verifique:</b> seco? Solta pó? Firme? Áreas muito absorventes? Reparos diferentes? <b>Preparação:</b> elimine poeira, nivele, avalie a absorção, use a preparação indicada para o sistema e só depois o acabamento. NÃO FAÇA: não considere que gesso branco está automaticamente pronto para pintura.</p>
<h2>7. Drywall</h2>
<p>Mistura papel da chapa, massa de junta, reparos e regiões lixadas → diferenças de absorção. <b>Verifique:</b> juntas niveladas? Parafusos corrigidos? Marcas de lixamento? Pó? Diferença visível entre chapa e massa? <b>Preparação:</b> finalize juntas e reparos, lixe, remova o pó, uniformize a absorção e aplique o acabamento. Objetivo: evitar que as juntas fiquem marcadas ou com brilho diferente.</p>
<div class="dica"><b>Na loja:</b> para reboco novo, gesso e drywall, o <b>selador/fundo preparador</b> é o produto que uniformiza a absorção e faz a tinta render. Nunca deixe de oferecer.</div>`);

  add('m03', 3, 'Superfícies já pintadas e esmalte antigo', 4, 6, 6, `
<h2>8. Parede já pintada — acabamento fosco</h2>
<p>Não é porque a parede já tem tinta que basta aplicar outra por cima. <b>Verifique:</b> pintura antiga aderida? Limpa? Manchas? Mofo? Bolhas? Reparos? Calcinação/pó? <b>Preparação:</b> lave ou limpe, remova película sem aderência, trate contaminações, faça reparos, lixe onde necessário, elimine o pó, prepare áreas expostas e repinte.</p>
<div class="dica">TESTE RÁPIDO: faça verificações de aderência em diferentes pontos antes de assumir que toda a película antiga está firme.</div>
<h2>9. Parede acetinada ou semibrilho</h2>
<p>Principal problema: menor condição de aderência que uma pintura fosca. <b>Verifique:</b> muito lisa? Engordurada? Sujeira? Película firme? <b>Preparação:</b> limpe, remova contaminantes, promova o fosqueamento (lixamento), remova o pó e use sistema compatível.</p>
<div class="regra">REGRA: quanto mais lisa e brilhante a superfície, <b>mais atenção à aderência</b>.</div>
<h2>10. Esmalte antigo</h2>
<p>Portas, batentes, rodapés e metais. <b>Verifique:</b> película firme? Descascamento? Brilhante? Gordura? Ferrugem abaixo? <b>Preparação:</b> remova partes sem aderência, desengordure, lixe/fosqueie, elimine pó, prepare áreas expostas e use sistema compatível. NÃO FAÇA: não aplique nova camada apenas para "grudar" uma película que já está soltando.</p>`);

  add('m03', 4, 'Madeira e metais', 5, 7, 7, `
<h2>11. Madeira nova</h2>
<p>Madeira pode apresentar umidade, fibras, nós, resinas, taninos e imperfeições. <b>Verifique:</b> seca? Nós? Resina? Farpas? Manchas? Limpa? <b>Preparação:</b> corrija defeitos, lixe no sentido das fibras, remova o pó, trate particularidades (nós/resina), aplique fundo/primer ou sistema específico e faça o acabamento. Madeira úmida causa falhas posteriores.</p>
<h2>12. Madeira já pintada ou envernizada</h2>
<p><b>Verifique:</b> acabamento firme? Descascamentos? Bolhas? Úmida? Apodrecimento? Áreas escurecidas? <b>Preparação:</b> remova acabamento sem aderência, lixe a película firme, limpe, corrija imperfeições, avalie áreas expostas e aplique sistema compatível. Se a própria madeira estiver deteriorada, acabamento não resolve.</p>
<h2>13. Metal ferroso</h2>
<p>Ferro, aço carbono, grades, portões, estruturas. <b>Verifique:</b> ferrugem? Película soltando? Gordura? Metal exposto? Corrosão severa? <b>Preparação:</b> remova corrosão e material solto, desengordure, elimine resíduos, prepare o metal, use <b>sistema anticorrosivo</b> (fundo) e aplique o acabamento.</p>
<div class="atencao">NÃO FAÇA: não pinte sobre ferrugem ativa apenas para esconder a aparência.</div>
<h2>14. Galvanizado e alumínio</h2>
<p>Podem ter baixa aderência se não forem preparados. <b>Verifique:</b> nova? Gordura? Contaminantes? Oxidação? Pintura antiga? <b>Preparação:</b> limpar, desengordurar, remover contaminantes, preparar conforme o tipo de metal, aplicar primer/fundo compatível quando exigido e finalizar com acabamento compatível.</p>
<div class="regra">REGRA: <b>não trate todos os metais como se fossem ferro comum.</b></div>
<div class="dica"><b>Na loja:</b> portão de ferro = fundo anticorrosivo + esmalte. Portão galvanizado/alumínio = primer específico para galvanizado + esmalte. Madeira externa = fundo para madeira + esmalte ou verniz com filtro solar.</div>`);

  add('m03', 5, 'Condições especiais: mofo, gordura, pó, descascamento, umidade e superfície lisa', 6, 8, 8, `
<h2>15. Superfície com mofo</h2>
<p><b>Verifique primeiro:</b> infiltração? Condensação? Pouca ventilação? Local permanece úmido? Recorrente? <b>Preparação:</b> identifique e controle a origem da umidade, trate e descontamine, aguarde condição adequada, prepare e aplique o sistema indicado. Erro comum: pintar diretamente sobre a contaminação.</p>
<h2>16. Superfície com gordura ou óleo</h2>
<p>Comum em cozinhas, oficinas, portas, metais e regiões muito manuseadas. <b>Teste visual:</b> brilho irregular? Toque oleoso? Repele água? Acumula sujeira? <b>Preparação:</b> descontamine primeiro, enxágue, aguarde secagem, lixe quando necessário, remova o pó e prossiga. <b>Importante:</b> lixar antes de descontaminar espalha a gordura.</p>
<h2>17. Superfície pulverulenta</h2>
<p>Ao passar a mão, fica cheia de pó: calcinação, reboco fraco, massa deteriorada, tinta degradada. <b>Preparação:</b> determine de onde vem o pó, remova material sem coesão, limpe, avalie a firmeza, use preparação compatível (fundo preparador) para estabilizar a base e só depois pinte. <b>Não pinte sobre pó.</b></p>
<h2>18. Superfície com descascamento</h2>
<p>O mais importante não é só retirar a tinta: é descobrir <b>qual camada está soltando</b> — tinta sobre tinta, tinta sobre massa, massa sobre reboco ou reboco deteriorado. Remova tudo sem aderência, examine o verso do material desprendido, determine a origem, corrija o substrato, prepare novamente e repinte. Se você não descobrir onde ocorreu a falha, pode repetir o mesmo problema.</p>
<h2>19. Superfície com umidade</h2>
<p>Antes de falar em preparação, <b>pare e procure a origem</b>: infiltração, vazamento, capilaridade, condensação, impermeabilização. A preparação começa depois que a origem for controlada. NÃO FAÇA: não considere "raspar + massa + tinta" como tratamento automático de parede úmida.</p>
<h2>20. Superfície muito lisa</h2>
<p>Concreto liso, esmaltes, pinturas antigas, materiais industrializados. Pergunta: a nova camada terá onde aderir? <b>Preparação:</b> limpeza, desengorduramento, lixamento/fosqueamento, criação de perfil de aderência e primer específico. Superfície visualmente perfeita não significa pronta para receber tinta.</p>`);

  add('m03', 6, 'Tabelas rápidas, os 10 erros e a regra de bolso', 5, 9, 10, `
<h2>Problema × ação</h2>
<p>Pó → remova e avalie a firmeza da base · Gordura → descontamine · Mofo → investigue umidade e trate a contaminação · Ferrugem → trate a corrosão · Descascamento → descubra onde a aderência falhou · Bolha → investigue umidade, aderência e sistema · Fissura → determine se é recorrente ou ativa · Umidade → corrija a origem primeiro · Brilho → prepare para aderência · Reboco fraco → estabilize ou recupere a base · Reparos → uniformize nivelamento e absorção · Sais → investigue movimentação de água.</p>
<h2>Superfície × principal risco</h2>
<p>Reboco novo: umidade ou cura · Reboco antigo: material solto · Massa: pó do lixamento · Concreto: contaminação e baixa porosidade · Gesso: alta absorção · Drywall: diferença de absorção · Pintura fosca antiga: baixa aderência localizada · Pintura brilhante: pouca aderência · Madeira: umidade e movimentação · Ferro: corrosão · Galvanizado: aderência · Alumínio: aderência ou contaminação.</p>
<h2>Tabela ultrarrápida — antes de pintar qualquer superfície</h2>
<p>Está seca? Firme? Limpa? Livre de pó? Livre de gordura? Sem material solto? Sem umidade ativa? Pintura antiga aderida? Reparos nivelados? Tem condição de aderência? Sei qual é o substrato? O produto é compatível? <b>Se uma resposta importante for NÃO, resolva antes de avançar.</b></p>
<h2>Fluxo rápido de preparação</h2>
<p>Identifique a superfície → avalie a condição → remova o que não está firme → elimine contaminações → corrija defeitos → uniformize a base → fundo ou primer quando o sistema exigir → acabamento correto.</p>
<h2>Os 10 erros que mais comprometem a preparação</h2>
<ol><li>Pintar sem descobrir o substrato.</li><li>Pintar diretamente sobre pó.</li><li>Ignorar gordura e contaminações.</li><li>Não testar a aderência da tinta antiga.</li><li>Pintar sobre umidade ativa.</li><li>Aplicar tinta sobre ferrugem sem preparação.</li><li>Não preparar superfícies brilhantes.</li><li>Pintar sobre reboco ou massa instáveis.</li><li>Ignorar diferenças de absorção.</li><li>Usar o mesmo procedimento para todas as superfícies.</li></ol>
<div class="regra">REGRA DE BOLSO: SUPERFÍCIE <b>FIRME + LIMPA + SECA + PREPARADA</b> = melhor base para o sistema de pintura. Não escolha a preparação pelo hábito: escolha pela superfície que você encontrou.</div>
<p>E sempre respeite as instruções do fabricante: substratos permitidos, preparação, diluição, fundos e primers, intervalos, cura, número de demãos e condições de aplicação. <b>A pintura começa muito antes do rolo encostar na parede.</b></p>`);

  /* ══════════════ M04 — QUANDO O PROBLEMA NÃO É DE PINTURA ══════════════ */
  add('m04', 1, 'Antes de pegar o rolo: o teste das 3 perguntas', 4, 2, 2, `
<p>O cliente mostra uma parede manchada, descascando ou com bolhas e pergunta: <i>"dá para arrumar e pintar?"</i> Às vezes, sim. Mas nem todo defeito que aparece na pintura nasceu na pintura. A tinta pode ser apenas a camada onde um problema escondido ficou visível.</p>
<p>Por trás de uma parede descascando pode existir: infiltração, vazamento, umidade vinda do solo, fissura ativa, reboco deteriorado, corrosão, madeira úmida ou degradada, condensação, contaminação biológica ou falha construtiva/de impermeabilização. Nessas situações, raspar, emassar e pintar deixa a parede bonita temporariamente — <b>sem eliminar a origem</b>.</p>
<div class="regra">REGRA PRINCIPAL: antes de corrigir a pintura, descubra se a causa realmente pertence à pintura.</div>
<h2>O teste das 3 perguntas</h2>
<ol>
<li><b>O defeito está somente na película de tinta?</b> Se sim, pode ser problema do sistema de pintura.</li>
<li><b>O substrato abaixo também está comprometido?</b> Massa, reboco, madeira ou metal com problemas → a correção vai além da tinta.</li>
<li><b>Existe algo externo causando o defeito?</b> Água, vazamento, movimentação, corrosão ou condensação fazem o problema voltar mesmo após boa repintura.</li>
</ol>
<div class="atencao">Se a resposta for "SIM" para 2 ou 3: <b>não trate a repintura como solução</b> antes de investigar a origem.</div>`);

  add('m04', 2, 'Sinais de água: umidade ativa, chuva, vazamento e rodapé', 6, 3, 3, `
<h2>Sinal 1 — Umidade ativa</h2>
<p>Parede escura ou úmida, bolhas, pintura estufada, descascamento, massa amolecida, reboco deteriorado, sais esbranquiçados, mofo recorrente. Possíveis origens: infiltração externa, vazamento, falha de impermeabilização, água do solo, chuva entrando por fissuras, falhas próximas a portas e janelas, cobertura/calha, ambiente constantemente úmido. <b>Não é só pintura quando a parede continua recebendo água.</b> Próximo passo: identifique de onde a água vem e oriente a correção da origem.</p>
<h2>Sinal 2 — O problema piora quando chove</h2>
<p>Um dos sinais mais importantes em fachadas. Pergunte: "essa mancha aumenta quando chove?", "o descascamento apareceu depois de períodos de chuva?", "entra água perto da janela?". Procure fissuras externas, falhas de vedação, peitoris problemáticos, encontros entre materiais, trincas perto de janelas, falhas na fachada, cobertura/calha. <b>Passar massa e tinta pelo lado interno não elimina a origem.</b></p>
<h2>Sinal 3 — Vazamento hidráulico</h2>
<p>A mancha pode aparecer longe do ponto do vazamento. Desconfie quando: parede úmida mesmo sem chuva; banheiro do outro lado; cozinha ou área de serviço próxima; tubulações na região; teto com mancha localizada; umidade que apareceu de repente; problema que continua aumentando. Recomende verificação hidráulica por profissional competente. <b>Não diga que uma nova pintura resolverá enquanto houver suspeita de vazamento ativo.</b></p>
<h2>Sinal 4 — Umidade subindo do rodapé</h2>
<p>Faixa que começa no piso e sobe: umidade ascendente por capilaridade. Sinais: descascamento próximo ao piso, reboco deteriorado, bolhas, manchas, sais brancos, problema recorrente. Erro comum: raspar, passar massa, pintar — e algum tempo depois o problema volta, porque a origem continuou presente.</p>
<div class="dica"><b>Na loja:</b> quando o cliente descreve qualquer um desses sinais, oriente a investigar a origem antes de vender "só a tinta". Vender o produto certo depois da causa resolvida é cuidar do cliente — e evitar que ele volte reclamando da tinta.</div>`);

  add('m04', 3, 'Fissura, reboco, mofo, corrosão, madeira, condensação e recorrência', 7, 4, 5, `
<h2>Sinal 6 — Fissura que sempre volta</h2>
<p>"Já passaram massa aí duas vezes e abriu de novo." Esse histórico importa. Já foi reparada? Voltou no mesmo lugar? Está aumentando? É diagonal? Perto de portas ou janelas? Existem outras próximas? Há abertura relevante? Massa e tinta escondem temporariamente; com movimentação contínua o tratamento superficial não resolve. Fissuras relevantes, recorrentes ou com outros sinais devem ser avaliadas tecnicamente.</p>
<h2>Sinal 7 — Reboco solto ou deteriorado</h2>
<p>Às vezes a tinta não é a camada que está falhando — é o que existe embaixo. O reboco esfarela? Regiões ocas? Partes se desprendendo? Massa saindo junto com a tinta? Teste visual: observe o verso de um pedaço desprendido; se sair massa + reboco + material pulverulento, a falha está abaixo da película. <b>Tinta nova não transforma base instável em base firme.</b></p>
<h2>Sinal 8 — Mofo que sempre volta</h2>
<p>O cliente limpa, pinta, e o mofo volta. Investigue: umidade, condensação, baixa ventilação, infiltração, pouca incidência de sol, geração frequente de vapor, parede constantemente fria/úmida. A tinta pode fazer parte da solução, mas não elimina a condição que favorece o crescimento. Pergunta certa: <b>"por que essa região permanece úmida?"</b></p>
<h2>Sinal 9 — Corrosão no metal</h2>
<p>Ferrugem atravessando a pintura não é só mancha: pontos alaranjados, pintura levantando, bolhas sobre metal, película soltando, perda de material. Corrosão severa, perda de seção ou perfuração podem exigir avaliação/reparação além da pintura. <b>Não esconda corrosão ativa debaixo de tinta.</b></p>
<h2>Sinal 10 — Madeira deteriorada</h2>
<p>Madeira úmida, muito macia, fibras deterioradas, apodrecimento, peça deformada, ataque biológico, acabamento antigo totalmente comprometido. Não adianta acabamento perfeito sobre peça que perdeu integridade: pode precisar de reparo, tratamento ou substituição.</p>
<h2>Sinal 11 — Condensação</h2>
<p>Nem toda água vem de infiltração. Observe banheiros, cozinhas, ambientes pouco ventilados, paredes frias, cantos, atrás de móveis, áreas com mofo recorrente. O problema aparece em certas épocas, horários ou condições. Avalie ventilação, geração de vapor e temperatura das superfícies.</p>
<h2>Sinal 12 — O defeito volta sempre no mesmo lugar</h2>
<p>Pergunte: "isso já foi corrigido antes?", "voltou exatamente aqui?". Pode haver vazamento, movimentação, contaminação, falha localizada do substrato, entrada de água ou condição ambiental recorrente.</p>
<div class="regra">REGRA PRÁTICA: <b>defeito recorrente = investigue a causa antes de repetir a correção.</b></div>`);

  add('m04', 4, 'Quando parar, o que é do pintor e o que dizer ao cliente', 5, 6, 6, `
<h2>Quando você deve parar e investigar</h2>
<p>Durante a vistoria, pare antes de prometer a pintura como solução quando encontrar: umidade ativa · suspeita de vazamento · infiltração recorrente · fissura relevante ou recorrente · substrato severamente deteriorado · corrosão · madeira comprometida · contaminação extensa · problema que já voltou várias vezes · origem que você ainda não conseguiu identificar. <b>Não chute uma solução. Investigue ou recomende avaliação do profissional adequado.</b></p>
<h2>O que é do pintor e o que pode não ser</h2>
<table><tr><th>Normalmente dentro do escopo de preparação/pintura</th><th>Pode exigir outro profissional ou serviço</th></tr>
<tr><td>Remoção de película sem aderência · preparação de superfícies · lixamento · regularização compatível · preparação de reparos · correção de pequenas imperfeições · fundos/primers · sistema de acabamento · falhas diretamente ligadas à pintura</td><td>Vazamentos hidráulicos · impermeabilização · problemas de cobertura · infiltrações externas · falhas construtivas · fissuras que exigem avaliação especializada · corrosão com comprometimento da peça · madeira estrutural deteriorada · instalações danificadas · contaminações extensas · problemas estruturais</td></tr></table>
<p>Reconhecer o limite do serviço não diminui o pintor: demonstra que ele sabe diferenciar acabamento de causa.</p>
<h2>O que dizer ao cliente</h2>
<p>Você não precisa diagnosticar o que está fora da sua área. Em vez de afirmar "é vazamento", "essa trinca é estrutural" ou "essa tinta é ruim", diga:</p>
<ul>
<li>"A parede apresenta sinais compatíveis com presença de umidade. Antes de refazer a pintura, precisamos identificar de onde ela está vindo."</li>
<li>"Essa fissura apresenta características que merecem avaliação antes de simplesmente cobrir com massa e tinta."</li>
<li>"Primeiro precisamos descobrir em qual camada ocorreu a falha de aderência."</li>
</ul>
<p><b>Descreva o que encontrou. Explique o risco. Evite afirmar uma causa sem elementos para confirmar.</b></p>
<h2>Como proteger seu serviço</h2>
<p>Antes de começar: fotografe o problema, registre a localização, anote o que foi observado, pergunte sobre o histórico, informe o cliente quando houver causa externa suspeita, defina o que faz e o que não faz parte do seu serviço e registre recomendações. Exemplo: <i>"Parede apresenta sinais de umidade e descascamento na região inferior. Preparação e pintura serão realizadas após correção e secagem adequada da origem da umidade."</i></p>`);

  add('m04', 5, 'Semáforo, checklist ultrarrápido e fluxo de decisão', 5, 7, 7, `
<h2>Semáforo da decisão</h2>
<ul>
<li><b>🟢 VERDE — pode seguir para preparação:</b> pequenas imperfeições, preparação normal, película antiga que pode ser preparada, reparos simples, diferença de absorção. Ação: defina a preparação e siga o sistema correto.</li>
<li><b>🟡 AMARELO — investigue melhor:</b> mancha sem origem definida, pequena fissura recorrente, bolhas sem causa aparente, região localizada com perda de aderência. Ação: faça verificações antes de definir a solução.</li>
<li><b>🔴 VERMELHO — não trate a pintura como solução ainda:</b> vazamento ativo, infiltração, umidade intensa, substrato severamente deteriorado, fissura relevante, corrosão severa. Ação: corrija ou encaminhe a causa antes da pintura.</li>
</ul>
<h2>Checklist ultrarrápido — quando desconfiar que não é só pintura</h2>
<p>Existe umidade? Piora quando chove? Tubulação próxima? Começa no rodapé? Sais brancos? A fissura já voltou? Reboco deteriorado? Mofo sempre retorna? Ferrugem severa? Madeira deteriorada? O defeito já foi corrigido e voltou? Existe causa que ainda não consegui explicar? <b>Se marcou "sim": pare antes de raspar, emassar e pintar. Investigue a origem.</b></p>
<h2>Fluxo rápido de decisão</h2>
<p>O problema parece estar só na película? SIM → avalie preparação, aderência e compatibilidade. NÃO/NÃO SEI → continue investigando. Existe umidade, vazamento, infiltração ou condensação? SIM → origem da água primeiro. O substrato está firme? NÃO → recupere ou encaminhe. Existe fissura recorrente ou relevante? SIM → avalie antes de cobrir. Existe corrosão, madeira deteriorada ou outra condição externa? SIM → trate/encaminhe a causa. Só então defina o sistema de preparação e pintura.</p>
<h2>Regra de bolso: a tinta é a última camada</h2>
<p>Ambiente → construção → substrato → preparação → pintura. Se o problema nasceu em uma etapa anterior, trocar apenas a última camada pode não resolver. Quando encontrar um sinal, investigue a origem compatível: umidade → procure a água · fissura recorrente → procure a movimentação · descascamento → procure onde a aderência falhou · mofo recorrente → procure a condição de umidade · ferrugem → procure a corrosão · reboco soltando → avalie o substrato.</p>
<div class="regra">REGRA FINAL: nem todo problema que aparece na tinta é um problema de tinta. O profissional não precisa ter resposta imediata para tudo — <b>precisa saber quando não deve simplesmente pintar por cima.</b></div>`);

  /* ══════════════ M05 — CHECKLIST RÁPIDO DA PAREDE ══════════════ */
  add('m05', 1, 'Antes de passar o orçamento: o checklist de 5 minutos', 4, 2, 2, `
<p>Antes de orçar, avalie a condição real da superfície. Uma parede aparentemente simples pode esconder umidade, tinta antiga sem aderência, reboco fraco, fissuras, contaminação, reparos mal executados e diferenças de absorção.</p>
<div class="regra">REGRA PRINCIPAL: não faça orçamento olhando apenas quantos metros serão pintados. <b>Primeiro descubra em que condição está a superfície.</b></div>
<h2>Checklist de 5 minutos — os 10 pontos</h2>
<ol><li>Umidade</li><li>Infiltrações e vazamentos</li><li>Aderência da pintura existente</li><li>Fissuras e trincas</li><li>Pó e esfarelamento</li><li>Bolhas e descascamentos</li><li>Mofo e contaminações</li><li>Reparos anteriores</li><li>Condição do substrato</li><li>Histórico do problema</li></ol>
<p>Se encontrar alguma anormalidade, não ignore para resolver depois. <b>Investigue antes de definir o serviço.</b></p>
<div class="dica"><b>Na loja:</b> estes 10 pontos são as perguntas que o vendedor faz ao cliente antes de montar a lista de materiais. Quanto melhor a sondagem, mais certa a venda.</div>`);

  add('m05', 2, 'Umidade, infiltrações, aderência e pó', 5, 3, 3, `
<h2>Umidade — o que procurar</h2>
<p>Manchas escuras ou amareladas, parede úmida, pintura estufada, bolhas, descascamento, reboco deteriorado, sais esbranquiçados, mofo recorrente. Observe rodapés, paredes externas, abaixo de janelas, próximo ao teto, banheiros, cozinhas e áreas com tubulações. Pergunte: "essa parede já apresentou umidade antes?", "piora quando chove?", "já houve vazamento aqui?". Com umidade ativa, massa e tinta não resolvem: descubra de onde a água vem.</p>
<h2>Infiltrações e vazamentos</h2>
<p>A mancha pode ser apenas o sinal visível de um problema em outro local. Verifique: banheiro do outro lado? Tubulações próximas? Parede externa? Janela próxima? Cobertura ou laje acima? A mancha aumenta depois da chuva? Fissuras externas? O problema reaparece depois de pintado? Informe ao cliente que a origem precisa ser corrigida antes da pintura.</p>
<h2>Aderência da pintura antiga</h2>
<p>Parede que parece boa pode ter película antiga com pouca aderência: descascamentos, bordas levantadas, pintura oca ou soltando, muitas camadas, áreas brilhantes, película que sai facilmente ao raspar. Verificação rápida: em área discreta, teste a resistência da película; se sair com facilidade, investigue a extensão. NÃO FAÇA: aplicar massa ou tinta para "segurar" camada antiga que já está soltando.</p>
<h2>Parede soltando pó</h2>
<p>Passe a mão: a mão ficou limpa → a superfície pode estar firme; saiu bastante pó → pare e investigue (calcinação, reboco fraco, massa deteriorada, tinta degradada). Com pó entre a parede e a nova pintura, a aderência fica comprometida. <b>A tinta precisa aderir a uma base estável, não ao material solto.</b></p>`);

  add('m05', 3, 'Fissuras, bolhas, mofo, substrato e áreas lisas', 5, 4, 4, `
<h2>Fissuras e trincas</h2>
<p>Nem toda fissura deve ser apenas coberta com massa. Procure fissuras finas, perto de portas e janelas, diagonais, trincas maiores, já reparadas, que voltaram após o reparo. Pergunte: "já existia?", "já foi corrigida?", "voltou depois?". Fissuras recorrentes, relevantes ou com outros sinais podem exigir investigação técnica.</p>
<h2>Bolhas e descascamentos</h2>
<p>Antes de pensar em raspar, descubra por que está soltando. Não pense "quanto vou precisar raspar?"; pense "por que isso está soltando?". Verifique umidade, pó, aderência da tinta antiga, massa soltando, reboco deteriorado, área específica, várias camadas. <b>Dica:</b> observe o verso de um pedaço desprendido — só tinta, tinta + massa, pó ou reboco — para entender em qual camada ocorreu a falha.</p>
<h2>Mofo e contaminação</h2>
<p>Procure pontos pretos, manchas esverdeadas, bolor, gordura, óleo, fuligem, resíduos, silicone, superfície engordurada. Mofo: pergunte por que existe umidade suficiente (ventilação, condensação, infiltração, incidência de sol, recorrência). Gordura e óleo: pintar sobre superfície contaminada causa problemas de aderência e manchas. <b>A descontaminação faz parte da preparação.</b></p>
<h2>Condição do substrato</h2>
<p>Descubra o que existe abaixo da pintura (reboco, massa corrida, massa acrílica, concreto, gesso, drywall, madeira, metal) e verifique: firme? Seco? Limpo? Coeso? Nivelado? Livre de material solto? A preparação muda conforme o substrato.</p>
<h2>Áreas brilhantes ou muito lisas</h2>
<p>Esmalte, acabamento brilhante, superfície muito lisa, pintura lavável antiga, material de baixa porosidade. Exigem preparação específica para aderência. Não presuma que a parede pode receber qualquer produto diretamente.</p>`);

  add('m05', 4, 'Contra a luz, histórico, registro e classificação A/B/C', 5, 5, 7, `
<h2>Observe contra a luz</h2>
<p>Não faça a vistoria só de frente: olhe lateralmente e contra a incidência de luz para revelar ondulações, marcas de massa, reparos, desníveis, marcas de rolo e texturas diferentes. Quanto maior a luz lateral, mais as imperfeições aparecem — considere isso antes de prometer determinado padrão de acabamento.</p>
<h2>Pergunte o histórico — 5 perguntas</h2>
<ol><li>Quando essa parede foi pintada pela última vez?</li><li>Qual problema ela já apresentou?</li><li>Já houve infiltração ou vazamento?</li><li>Alguma parte já foi reparada?</li><li>O problema já voltou depois de uma pintura anterior?</li></ol>
<h2>Registre antes de começar</h2>
<p>Fotografe umidade, fissuras, descascamentos, bolhas, mofo, reparos antigos, reboco deteriorado, manchas e danos existentes — fotos gerais e aproximadas. Isso cria um registro da condição encontrada e facilita explicar ao cliente o que precisa ser corrigido.</p>
<h2>Classifique a parede</h2>
<ul>
<li><b>Situação A — superfície aparentemente adequada:</b> sem sinais relevantes de patologias. Siga para a preparação normal do sistema.</li>
<li><b>Situação B — precisa de preparação/correção:</b> tinta antiga soltando, pó, pequenos reparos, diferenças de absorção, preparação inadequada anterior. Inclua a correção no escopo e no orçamento.</li>
<li><b>Situação C — investigar antes de pintar:</b> umidade ativa, infiltração, vazamento, fissura relevante/recorrente, substrato muito deteriorado, corrosão severa, contaminação extensa. Não trate a pintura como solução antes de identificar a origem.</li>
</ul>
<h2>Checklist ultrarrápido para salvar no celular</h2>
<p><b>1. Olhe:</b> umidade, infiltração, descascamento, bolhas, fissuras, mofo, pó, contaminação, reparos, substrato. <b>2. Pergunte:</b> quando foi pintado? Já deu problema? Já houve vazamento? Já foi reparado? O problema voltou? <b>3. Registre:</b> fotos gerais, fotos dos defeitos, observações. <b>4. Antes de dar o preço:</b> defina a preparação, separe pintura de problemas externos, explique as condições, defina o escopo.</p>
<div class="regra">REGRA FINAL: não orce apenas a pintura. <b>Orce a condição real da parede.</b> Diagnóstico certo, serviço valorizado.</div>`);

  /* ══════════════ M06 — FICHA DE VISTORIA DE OBRA ══════════════ */
  add('m06', 1, 'Como preencher a ficha de vistoria', 4, 2, 2, `
<p>A ficha de vistoria registra o estado da superfície, problemas preexistentes, preparação necessária e observações <b>antes</b> do serviço. Ela protege o pintor, orienta o orçamento e organiza a lista de materiais.</p>
<h2>1. Identificação da vistoria</h2>
<p>Dados do serviço: cliente, telefone, endereço da obra, data, responsável. Tipo de serviço: pintura interna, externa, repintura, pintura nova, madeira, metal, outro. Ambientes avaliados: sala, quartos, cozinha, banheiro, área externa, fachada, outro.</p>
<h2>2. Condição geral da superfície</h2>
<p>Superfície principal (reboco, massa corrida, massa acrílica, concreto, gesso, drywall, madeira, metal, já pintada). Estado encontrado: bom estado, necessita limpeza, necessita preparação, necessita reparos, apresenta material solto, apresenta umidade, necessita investigação adicional. Condição da pintura antiga: bem aderida, descascando, com bolhas, pulverulenta, muito brilhante, com manchas, não possui pintura anterior.</p>
<h2>3. Problemas identificados e localização</h2>
<p>Umidade, infiltração aparente, mofo, bolhas, descascamento, eflorescência, fissuras, trincas, reboco deteriorado, massa soltando, falha de aderência, manchas, ferrugem, madeira deteriorada, gordura/óleo, outros. Registre a localização de cada problema. <b>Existe suspeita de problema fora da pintura?</b> Sim / Não / Necessita investigação — qual?</p>
<div class="dica"><b>Na loja:</b> um cliente que chega com a ficha preenchida (ou com as respostas dela) recebe uma especificação muito mais precisa. Ofereça a ficha aos pintores parceiros da loja.</div>`);

  add('m06', 2, 'Preparação necessária, registro fotográfico e resumo', 4, 3, 6, `
<h2>4. Preparação necessária</h2>
<p>Com base na vistoria: limpeza, raspagem, lixamento, remoção de material solto, tratamento de mofo, descontaminação, correção de fissuras, correção de imperfeições, regularização com massa, tratamento de corrosão, fundo/selador, primer. <b>Existe algo que precisa ser resolvido antes da pintura?</b> Situação da obra: liberada para preparação · liberada com ressalvas · aguardar correção de outro problema.</p>
<h2>5. Registro fotográfico</h2>
<p>Para cada foto: local e problema observado. Na versão impressa, a página serve para colar ou referenciar as fotos. Fotos gerais e aproximadas, antes de qualquer intervenção.</p>
<h2>6. Observações e registro final</h2>
<p>Observações importantes · problemas preexistentes informados ao cliente (sim / não se aplica) · recomendações antes do serviço · resumo da vistoria: superfície em condição adequada? Preparação necessária? Problemas preexistentes registrados? Existe problema que deve ser corrigido antes? Registro fotográfico realizado? · Responsável: nome, assinatura e data.</p>
<div class="regra">Viu → registrou → fotografou → informou. <b>Vistoria bem feita evita retrabalho e discussões futuras.</b></div>`);

  /* ══════════════ M07 — 100 COMBINAÇÕES DE CORES ══════════════ */
  add('m07', 1, 'Como usar o catálogo: principal, secundária e apoio', 4, 2, 2, `
<p>O catálogo traz 100 combinações prontas para ajudar você e o cliente a escolher cores para diferentes ambientes: harmoniosas, atuais, para ambientes internos e externos.</p>
<h2>Cada combinação possui</h2>
<ul>
<li><b>Cor principal</b> — predominante nas paredes.</li>
<li><b>Cor secundária</b> — para uma parede de destaque ou áreas específicas.</li>
<li><b>Cor de apoio</b> — para detalhes, acabamentos ou composição.</li>
</ul>
<p>Escolha o tipo de ambiente, encontre uma combinação que combine com o estilo desejado e use as cores como referência para conversar com o cliente.</p>
<div class="atencao"><b>Importante:</b> as cores do catálogo são referências visuais. A tonalidade final pode variar conforme marca da tinta, iluminação, superfície e tela utilizada. <b>Sempre valide a cor escolhida com o catálogo/amostra do fabricante antes da aplicação.</b></div>
<h2>Dicas de balcão</h2>
<ul>
<li>Pergunte o ambiente, a luz (natural ou artificial), os móveis e a sensação desejada (aconchego, modernidade, amplitude).</li>
<li>Cores claras ampliam; escuras aconchegam e marcam. Uma parede de destaque resolve a vontade de cor forte sem pesar.</li>
<li>Confirme o acabamento: fosco disfarça imperfeições; acetinado e semibrilho são mais laváveis.</li>
<li>Registre marca, linha, nome, código e acabamento — e faça amostra quando possível (lembre da aula "Confirme a cor").</li>
</ul>`);

  add('m07', 2, 'Salas e quartos de casal', 6, 3, 26, `
<h2>Salas (combinações 1 a 10)</h2>
<p>Bege Aconchegante (Bege Areia · Marrom Café · Branco Quente) — acolhedora, confortável e elegante · Cinza Moderno (Cinza Claro · Cinza Chumbo · Branco Neve) — moderna e urbana, ótima com móveis pretos, madeira ou metal · Verde Natural (Verde Sálvia · Verde Oliva · Off-white) — natural e tranquila, combina com madeira e plantas · Terracota Elegante (Bege Claro · Terracota · Creme) — quente e marcante sem pesar · Azul Sofisticado (Cinza Azulado · Azul Petróleo · Branco) · Sala Minimalista (Off-white · Greige · Cinza Escuro) — clean · Madeira e Areia (Areia · Caramelo · Branco Quente) · Azul e Bege (Bege Suave · Azul Acinzentado · Marfim) — equilibrada · Verde Profundo (Branco Quebrado · Verde Floresta · Bege Madeira) — elegante e marcante · Greige Sofisticado (Greige Claro · Taupe · Branco) — sofisticada sem cores fortes.</p>
<h2>Quartos de casal (combinações 11 a 21)</h2>
<p>Bege Relaxante (Bege Claro · Taupe · Off-white) — calma e aconchego · Verde Sálvia (Sálvia · Verde Musgo · Creme) — tranquilidade · Azul Sereno (Azul Acinzentado · Azul Profundo · Branco) — descanso · Terracota Suave (Nude · Terracota · Bege Claro) — calor e personalidade · Quarto Minimalista (Off-white · Cinza Médio · Grafite) · Rosé Elegante (Rosé Queimado · Taupe · Creme) — delicada sem ficar infantil · Azul Marinho (Cinza Claro · Azul Marinho · Branco) — forte e sofisticada · Verde + Madeira (Verde Claro · Verde Escuro · Caramelo) · Café com Leite (Bege Leite · Café · Marfim) — clássica · Cinza Quente (Greige · Cinza Escuro · Branco Quente) · Cinza Claro + Azul Petróleo + Branco — equilíbrio e sofisticação.</p>
<div class="dica"><b>Na loja:</b> para quartos, sugira tons que acalmam (bege, sálvia, azul acinzentado). A cor forte vai na parede da cabeceira — a "secundária" do catálogo.</div>`);

  add('m07', 3, 'Quartos infantis, cozinhas e banheiros', 6, 27, 55, `
<h2>Quartos infantis (22 a 30)</h2>
<p>Rosa Suave (Rosa Chá · Rosé · Branco) · Verde Menta (Menta · Verde Sálvia · Branco Quente) — fresca e suave · Amarelo Suave (Creme · Mostarda · Branco) · Azul + Bege (Bege · Azul · Branco) — equilibrada · Rosa + Verde (Rosa Pálido · Verde Sálvia · Creme) · Neutro Infantil (Greige Claro · Caramelo · Branco) — versátil, cresce com a criança · Lavanda (Lavanda Clara · Roxo Acinzentado · Branco) — delicada e lúdica · Verde + Amarelo (Verde Claro · Amarelo Mostarda · Creme) — alegre · Azul Profundo Infantil (Azul Claro · Azul Petróleo · Bege) — calma e imaginação.</p>
<h2>Cozinhas (31 a 40)</h2>
<p>Branco + Verde (Branco · Verde Sálvia · Madeira) — leve e funcional · Cinza + Branco (Cinza Claro · Grafite · Branco) — limpa e elegante · Bege + Madeira (Bege Claro · Caramelo · Creme) · Azul Cozinha (Branco Quebrado · Azul Acinzentado · Cinza Claro) · Verde Oliva (Creme · Oliva · Madeira) · Preto + Branco (Branco · Preto Suave · Cinza) — marcante e clean · Terracota (Bege · Terracota · Creme) — charmosa · Azul Marinho (Branco · Azul Marinho · Madeira Clara) — atemporal · Greige (Greige · Taupe · Branco) · Verde Escuro (Off-white · Verde Profundo · Bege Madeira).</p>
<h2>Banheiros (41 a 49)</h2>
<p>Branco + Azul (Branco · Azul Claro · Cinza) — limpa e refrescante · Verde Spa (Off-white · Verde Sálvia · Bege) — relaxante · Cinza Elegante (Cinza Claro · Grafite · Branco) · Areia (Areia · Taupe · Marfim) — quente e suave · Azul Petróleo (Branco · Petróleo · Cinza Claro) — refinada · Verde + Madeira (Creme · Verde Oliva · Madeira) · Minimalista (Branco · Greige · Preto) · Azul Acinzentado (Azul Claro · Azul Cinza · Branco) · Natural (Bege Claro · Verde Claro · Branco).</p>
<div class="dica"><b>Na loja:</b> cozinha e banheiro pedem acabamento <b>lavável</b> (acetinado/semibrilho) e, se houver umidade, massa acrílica e tinta com proteção antimofo. Cor bonita só dura com o produto certo.</div>`);

  add('m07', 4, 'Fachadas, escritórios e áreas externas', 6, 56, 86, `
<h2>Fachadas (50 a 59)</h2>
<p>Fachada Moderna (Cinza Claro · Grafite · Branco) — urbana · Fachada Bege (Bege Areia · Marrom · Creme) — clássica e convidativa · Branco + Madeira (Branco Quente · Caramelo · Grafite) · Verde Oliva (Bege · Oliva · Marrom) — natural · Azul Acinzentado (Azul Cinza · Grafite · Branco) — sóbria · Terracota (Terracota · Bege · Creme) — cheia de personalidade · Cinza + Madeira (Cinza Médio · Grafite · Madeira) · Fachada Clara (Off-white · Greige · Marrom) — atemporal · Verde Profundo (Verde Acinzentado · Verde Profundo · Creme) · Fachada Escura (Cinza · Chumbo · Madeira) — imponente.</p>
<h2>Escritórios e home office (60 a 69)</h2>
<p>Azul Produtivo (Cinza Claro · Azul · Branco) — organizada · Verde Concentrado (Verde Sálvia · Verde Escuro · Creme) — foco · Minimalista (Off-white · Cinza · Grafite) · Azul Marinho (Bege Claro · Marinho · Branco) — sóbria · Madeira (Areia · Caramelo · Verde) · Industrial (Cinza Concreto · Chumbo · Branco) — criativa · Terracota (Bege · Terracota · Creme) — inspiradora · Azul Suave (Azul Claro · Azul Cinza · Branco) — serena · Verde + Bege (Bege · Verde Oliva · Off-white) · Sóbrio (Greige · Grafite · Branco) — profissional.</p>
<h2>Áreas externas e varandas (70 a 79)</h2>
<p>Natural (Bege Areia · Verde Oliva · Creme) · Mediterrâneo (Branco Quente · Azul · Terracota) — ensolarada · Rústico (Bege · Marrom · Terracota) · Contemporâneo (Cinza Claro · Grafite · Madeira) · Verde Jardim (Verde Sálvia · Verde Floresta · Bege) · Areia + Branco (Areia · Branco · Marrom) · Terracota Natural (Terracota · Creme · Verde Oliva) · Azul Externo (Azul Acinzentado · Branco · Grafite) · Cinza + Verde (Cinza · Verde · Off-white) · Madeira + Preto (Bege · Preto Suave · Madeira).</p>
<div class="dica"><b>Na loja:</b> fachada = tinta acrílica para exterior com proteção UV e antimofo; cores muito escuras em fachada ensolarada esquentam mais e desbotam mais rápido — avise o cliente e indique produto premium.</div>`);

  add('m07', 5, 'Corredores, halls e combinações coringa', 5, 87, 104, `
<h2>Corredores e halls (80 a 88)</h2>
<p>Claro e Amplo (Off-white · Bege · Branco) — leve e ampla · Elegante (Greige · Grafite · Branco) · Verde (Verde Claro · Verde Musgo · Creme) — serena · Azul (Azul Claro · Azul Escuro · Branco) — organizada · Terracota (Bege · Terracota · Creme) — convidativa · Cinza Moderno (Cinza Claro · Chumbo · Branco) · Areia Quente (Areia · Caramelo · Marfim) · Verde Escuro (Off-white · Verde Profundo · Madeira) · Azul Marinho (Bege Claro · Marinho · Branco) — clássica.</p>
<h2>Combinações coringa (89 a 96) — funcionam em quase qualquer ambiente</h2>
<p>Off-white + Sálvia + Madeira · Greige + Grafite + Branco · Bege + Terracota + Creme · Cinza + Azul Petróleo + Branco · Creme + Verde Oliva + Madeira · Branco + Azul Marinho + Madeira · Areia + Marrom + Off-white · Rosé + Taupe + Creme.</p>
<h2>Bônus — quartos de casal (97 e 98)</h2>
<p>Chocolate + Bege (Chocolate · Bege · Caramelo) — conforto e acolhimento · Preto + Cinza + Madeira — modernidade e sofisticação.</p>
<h2>Como apresentar ao cliente</h2>
<ol><li>Pergunte o ambiente e a sensação desejada.</li><li>Mostre 2 ou 3 combinações do catálogo (não 10 — excesso de opção trava a decisão).</li><li>Defina principal, secundária e apoio e <b>anote nome e código oficiais</b> no leque/catálogo do fabricante.</li><li>Ofereça amostra ou teste de cor e confirme antes de fechar a quantidade.</li></ol>
<div class="regra">Corredor estreito pede cor clara e acabamento lavável (muito toque de mão). <b>Coringa</b> é a resposta quando o cliente diz "quero algo que combine com tudo".</div>`);

  /* ══════════════ M08 — ATLAS DAS PATOLOGIAS ══════════════ */
  add('m08', 1, 'Como usar o Atlas e a regra de ouro do diagnóstico', 5, 2, 2, `
<p>Na pintura profissional, nem todo defeito é simplesmente problema de tinta. Uma bolha pode estar ligada à umidade; um descascamento pode começar na preparação; uma mancha pode vir do substrato. Quando a causa é identificada errado, o profissional corrige apenas o efeito — e o problema volta.</p>
<h2>Como usar o Atlas</h2>
<ol><li><b>Observe</b> — formato, localização, extensão, textura e aparência do defeito.</li><li><b>Compare</b> — procure a ficha mais parecida.</li><li><b>Investigue</b> — leia as causas possíveis e o que verificar.</li><li><b>Identifique a origem</b> — está na tinta, na aplicação, na preparação ou no substrato?</li><li><b>Corrija a causa</b> — elimine a origem antes de refazer o acabamento.</li><li><b>Só depois repinte.</b></li></ol>
<div class="regra">REGRA DE OURO: <b>não trate o sintoma antes de investigar a causa.</b></div>
<h2>Antes de concluir, pergunte</h2>
<p>Qual é o substrato? A pintura é nova ou antiga? Existe histórico de infiltração? Interno ou externo? A superfície recebe água ou sol com frequência? Houve preparação da base? Foi usado fundo ou selador? Qual foi a diluição? Quanto tempo entre demãos? O defeito surgiu imediatamente ou depois de semanas? <b>Quanto mais informações, menor a chance de tratar apenas a aparência.</b></p>
<h2>As 8 categorias do Atlas</h2>
<p>1. Umidade e infiltração (fichas 1-7) · 2. Falhas de aderência e descolamento (8-14) · 3. Erros no preparo do substrato (15-21) · 4. Problemas de aplicação e diluição (22-30) · 5. Incompatibilidade química e repintura (31-36) · 6. Madeira e superfícies metálicas (37-42) · 7. Contaminação e agentes biológicos (43-46) · 8. Degradação e envelhecimento precoce (47-50).</p>
<div class="dica">Todas as 50 fichas estão no <b>Diagnóstico</b> do Assessor ST: escolha o sintoma e veja causas, verificações, o que não fazer e o caminho de correção.</div>`);

  add('m08', 2, 'Categoria 1 — Umidade e infiltração (fichas 1 a 7)', 7, 3, 9, `
<p>Problemas causados por entrada de água, umidade ascendente, condensação ou falhas de impermeabilização.</p>
<h2>01. Bolhas causadas por umidade</h2><p>Elevações sob a tinta; ao abrir, a base está úmida. Causas: infiltração, vazamento, umidade do solo, parede pintada úmida, falha de impermeabilização. Verifique proximidade com piso, janelas, teto, banheiros e tubulações. <b>Não estoure, emasse e repinte sem investigar.</b> Correção: identificar a fonte → corrigir → aguardar secagem → remover película solta → preparar → repintar.</p>
<h2>02. Descascamento por infiltração</h2><p>Escamas ou placas com manchas e reboco enfraquecido. Causas: água pela fachada, vazamentos, fissuras externas, telhado/calha/vedação, impermeabilização deficiente. Verifique se piora após chuva, marcas de água, lado oposto da parede. <b>Não raspe e repinte com a entrada de água ativa.</b></p>
<h2>03. Eflorescência</h2><p>Depósitos esbranquiçados (pó ou cristais). Causas: água atravessando materiais minerais, sais do reboco, umidade recorrente. <b>Não cubra os sais com tinta.</b> Correção: eliminar a umidade → secagem → remover depósitos → avaliar → preparar e pintar. Eflorescência recorrente indica movimentação de água pelo substrato.</p>
<h2>04. Manchas de umidade</h2><p>Áreas escuras ou amareladas com contornos irregulares. Compare a mancha em dias secos e chuvosos; observe teto, rodapé e tubulações. <b>Não use apenas uma demão para esconder.</b></p>
<h2>05. Umidade ascendente por capilaridade</h2><p>Começa no piso e sobe com manchas, sais e perda de acabamento. Causas: ausência de barreira impermeável, solo úmido, falhas na fundação. <b>Não raspe e repinte só a faixa inferior.</b> Se a parede continuar puxando água do solo, o problema volta.</p>
<h2>06. Deterioração próxima a tubulações</h2><p>Manchas, bolhas e pintura fraca perto de canos e registros. Causas: vazamento oculto, condensação, vedação deficiente. <b>Não feche o serviço só refazendo a pintura com suspeita de vazamento.</b></p>
<h2>07. Deterioração por chuva em fachadas</h2><p>Manchas escorridas, descascamento e desgaste em áreas expostas. Causas: fissuras, pingadeiras e rufos, exposição, impermeabilização insuficiente. Em área externa, o acabamento só resiste quando a água deixa de entrar.</p>`);

  add('m08', 3, 'Categoria 2 — Falhas de aderência e descolamento (fichas 8 a 14)', 7, 10, 16, `
<p>A película perde aderência, descola da base ou se separa entre camadas: preparação insuficiente, contaminação, baixa ancoragem, repintura sobre superfícies instáveis.</p>
<h2>08. Descascamento em placas</h2><p>Placas maiores revelam a base. Causas: preparação insuficiente, superfície contaminada, baixa ancoragem, base instável. <b>Não remende pequenas áreas sem avaliar toda a zona.</b> Quando a aderência falha em um ponto, áreas vizinhas também podem estar comprometidas.</p>
<h2>09. Desplacamento entre demãos</h2><p>A camada nova se destaca da anterior. Causas: repintura sobre tinta fraca ou brilhante, falta de lixamento, intervalo inadequado, incompatibilidade. Correção: remover a camada mal aderida → verificar a antiga → lixar/criar ancoragem → fundo → repintar compatível. O problema pode estar na interface entre camadas.</p>
<h2>10. Baixa aderência sobre superfície pulverulenta</h2><p>A base solta pó. Causas: substrato mal consolidado, pó residual, reboco fraco, calcinação. Correção: remover pó e partes fracas → consolidar → fundo adequado → repintar. Uma base pulverulenta compromete todo o sistema desde a origem.</p>
<h2>11. Descolamento sobre superfície lisa</h2><p>Base lisa demais, sem ancoragem (brilho, esmalte antigo, superfície não porosa). Correção: remover áreas mal aderidas → lixar/criar ancoragem → limpar → fundo de aderência → repintar. O erro costuma estar na falta de ancoragem, não na cobertura.</p>
<h2>12. Descascamento sobre pintura antiga</h2><p>A camada nova arrasta a película antiga fraca. <b>Não presuma que a tinta antiga está apta só porque ainda cobre a parede.</b> Faça testes de aderência antes.</p>
<h2>13. Bolhas sem umidade aparente</h2><p>Causas: contaminação, solventes, calor excessivo, aplicação inadequada, aprisionamento entre camadas, baixa aderência. Abra uma área de teste; bolhas também indicam falha de aderência.</p>
<h2>14. Película soltando ao toque ou raspagem</h2><p>Parece estável, mas sai à unha. Causas: baixa aderência, base contaminada, preparo inadequado, produto incompatível, superfície fraca. <b>Não entregue a parede só porque parece boa.</b> Se a tinta sai fácil, a falha pode ser maior que a área aparente.</p>`);

  add('m08', 4, 'Categoria 3 — Erros no preparo do substrato (fichas 15 a 21)', 6, 17, 23, `
<h2>15. Pintura sobre parede com pó</h2><p>A tinta adere ao pó, não à parede. Verifique se a mão sai suja. Correção: remover pó → eliminar partes fracas → consolidar → fundo → repintar.</p>
<h2>16. Pintura sobre massa mal curada</h2><p>Manchas, baixa resistência, falhas de acabamento. Causas: pintura cedo demais, massa úmida, secagem insuficiente. <b>Não acelere a entrega pintando sobre massa em cura.</b></p>
<h2>17. Pintura sobre reboco novo sem cura</h2><p>Manchas, sais, alteração do acabamento, falhas prematuras. Verifique data do reboco, umidade, eflorescência. <b>Não pinte reboco novo só porque parece seco por fora.</b></p>
<h2>18. Fissuras reaparecendo após pintura</h2><p>Some com massa e tinta, volta com o tempo. Causas: movimentação, tratamento inadequado, fissura ativa. Correção: avaliar a natureza → abrir e tratar corretamente → regularizar → repintar → monitorar. Não cubra indefinidamente.</p>
<h2>19. Marcas de reparo aparentes</h2><p>Remendos visíveis por textura, absorção ou nivelamento — ainda mais sob luz lateral. Correção: nivelar melhor → uniformizar textura → corrigir absorção → acabamento. Trate reparos como parte da preparação final.</p>
<h2>20. Diferença de absorção do substrato</h2><p>A mesma tinta fica diferente entre massa, reboco e reparos. Correção: identificar áreas → regularizar → preparação uniforme (fundo/selador) → repintar. Quando a base absorve diferente, a tinta denuncia.</p>
<h2>21. Pintura sobre superfície contaminada</h2><p>Falhas localizadas, manchas ou retrações em áreas com gordura, óleo, silicone, cera, poeira ou resíduos de limpeza. Teste: a água repele na superfície? <b>Não lixe ou pinte antes de descontaminar.</b></p>
<div class="dica"><b>Na loja:</b> fundo preparador, selador e desengraxante não são "venda a mais" — são o que impede o cliente de voltar reclamando. Explique o porquê.</div>`);

  add('m08', 5, 'Categoria 4 — Problemas de aplicação e diluição (fichas 22 a 30)', 7, 24, 32, `
<p>Defeitos por excesso ou falta de tinta, diluição inadequada, ferramenta errada, má distribuição e perda da borda molhada.</p>
<h2>22. Escorrimento</h2><p>Filetes e trilhas verticais. Causas: excesso de produto, diluição excessiva, ferramenta carregada demais, demão espessa. Não tente espalhar quando a tinta já começou a puxar: aguarde secar, lixe, corrija a diluição e reaplique uniforme.</p>
<h2>23. Marcas de rolo</h2><p>Faixas e trilhas visíveis. Causas: pouca tinta no rolo, pressão irregular, rolo inadequado, repasses excessivos. Mantenha o rolo bem carregado e passada consistente; não repasse área já secando.</p>
<h2>24. Marcas de pincel</h2><p>Sulcos das cerdas. Causas: tinta muito viscosa, pincel inadequado, excesso de repasses. Ajuste a diluição, use o pincel certo e movimentos uniformes.</p>
<h2>25. Emendas visíveis</h2><p>Encontros entre áreas pintadas em momentos diferentes. Causa principal: perda da <b>borda molhada</b>. Planeje concluir panos contínuos sem pausas.</p>
<h2>26. Baixa cobertura</h2><p>A cor anterior aparece. Causas: diluição excessiva, poucas demãos, cor de baixa opacidade, aplicação insuficiente. Não compense com excesso de tinta em pontos isolados: respeite rendimento e número de demãos.</p>
<h2>27. Manchas por diluição irregular</h2><p>Misturas em proporções diferentes, produto mal homogeneizado, água em excesso. Meça a diluição e repita o mesmo processo em toda a obra.</p>
<h2>28. Diferença de brilho</h2><p>Partes refletem mais luz. Causas: absorção irregular, retoques, quantidade desigual, mistura inadequada. Observe contra a luz; uniformize a preparação e evite retoques isolados em acabamento pronto.</p>
<h2>29. Textura irregular</h2><p>Áspera em uns pontos, lisa em outros. Padronize preparo, ferramenta e método em toda a área.</p>
<h2>30. Respingos e projeções</h2><p>Excesso de produto na ferramenta, movimento rápido, rolo inadequado, falta de proteção. Proteja o entorno e controle a carga.</p>
<div class="dica"><b>Na loja:</b> metade desses problemas se evita com a ferramenta certa (rolo de lã adequado, pincel de qualidade) e com a diluição medida. Venda a solução, não só a lata.</div>`);

  add('m08', 6, 'Categoria 5 — Incompatibilidade química e repintura (fichas 31 a 36)', 6, 33, 38, `
<h2>31. Enrugamento</h2><p>Rugas e dobras logo após a aplicação. Causas: camada muito espessa, repintura prematura, secagem superficial rápida, incompatibilidade. <b>Não aplique nova demão por cima para esconder.</b> Remova a película defeituosa, identifique o sistema, corrija espessura e intervalo.</p>
<h2>32. Craquelamento</h2><p>Rede de rachaduras tipo "solo seco". Causas: envelhecimento, camadas excessivas, perda de flexibilidade, incompatibilidade. Não cubra com mais tinta: avalie a profundidade e remova o comprometido.</p>
<h2>33. Repintura com baixa aderência</h2><p>A tinta nova se desprende da antiga. Causas: superfície brilhante, falta de preparo, sujeira, incompatibilidade. Sempre teste a base antes de uma repintura completa. A tinta nova pode estar boa, mas a película antiga fraca.</p>
<h2>34. Reação entre sistemas incompatíveis</h2><p>A superfície levanta, enruga ou amolece ao receber o novo produto (solventes atacando a película, primer inadequado, base desconhecida). <b>Interrompa a aplicação</b>, identifique o sistema existente e faça teste em pequena área. Uma área-teste evita comprometer a parede inteira.</p>
<h2>35. Amolecimento da pintura antiga</h2><p>A película anterior fica pegajosa após nova demão. Se a base antiga amolece, o problema não é só de acabamento: conheça o sistema anterior antes de repintar.</p>
<h2>36. Sangramento de pigmentos ou manchas</h2><p>Manchas amareladas/escurecidas ou cor antiga atravessam a nova pintura. Causas: pigmentos migrando, contaminantes, tanino da madeira, manchas antigas. Trate a origem e use <b>fundo bloqueador/isolante</b>; mais demãos sozinhas raramente resolvem.</p>
<div class="dica"><b>Na loja:</b> "qual tinta tinha aí antes?" é pergunta obrigatória em repintura. Esmalte sintético antigo + tinta à base d'água sem preparo = problema na certa.</div>`);

  add('m08', 7, 'Categoria 6 — Madeira e superfícies metálicas (fichas 37 a 42)', 6, 39, 44, `
<h2>37. Descascamento em madeira</h2><p>Tinta ou verniz em lascas expondo fibras. Causas: umidade, madeira mal preparada, acabamento antigo fraco, sistema inadequado. Não lixe e repinte sem investigar a umidade da peça. Madeira seca e bem preparada é essencial.</p>
<h2>38. Bolhas em madeira</h2><p>Causas: umidade interna, aquecimento solar, preparo deficiente, sistema inadequado. Não estoure e feche sem corrigir a causa. Bolha em madeira costuma indicar umidade ou calor sob a película.</p>
<h2>39. Manchas de tanino</h2><p>Manchas amareladas/amarronzadas atravessam o acabamento (substâncias naturais da madeira). Use <b>preparação isolante</b> compatível antes do acabamento; mais demãos não escondem.</p>
<h2>40. Ferrugem atravessando a pintura</h2><p>Pontos alaranjados através da película. Causas: corrosão não removida, proteção insuficiente, metal exposto. Correção: remover a corrosão → preparar o metal → <b>proteção anticorrosiva</b> → refazer o sistema → repintar. Ferrugem aparecendo indica corrosão ativa.</p>
<h2>41. Descascamento em metal</h2><p>Lascas ou placas deixando o metal exposto. Causas: gordura, oxidação, falta de preparação, primer inadequado. Aderência em metal depende de limpeza e preparação corretas.</p>
<h2>42. Corrosão sob a película</h2><p>Elevações e, ao abrir, ferrugem por baixo. Causas: água atingindo o metal, falha de proteção, corrosão residual, danos na película. Não feche as bolhas sem eliminar a corrosão e a umidade; ela cresce mesmo com a superfície intacta.</p>
<div class="dica"><b>Na loja:</b> metal = limpeza + lixa + fundo anticorrosivo + esmalte. Madeira = lixa + fundo para madeira (ou isolante de tanino) + esmalte/verniz. Explique que pular o fundo é a causa nº 1 de retorno.</div>`);

  add('m08', 8, 'Categorias 7 e 8 — Contaminação biológica e envelhecimento (fichas 43 a 50)', 6, 45, 52, `
<h2>43. Mofo</h2><p>Pontos escuros em áreas úmidas e pouco ventiladas. Causas: umidade, condensação, baixa ventilação, matéria orgânica. Não limpe e pinte sem resolver a causa da umidade. Correção: causa → ventilação/secagem → limpar e tratar → preparar → repintar.</p>
<h2>44. Bolor recorrente</h2><p>Limpa, pinta, e volta. Causas: condensação, ventilação insuficiente, infiltração, umidade relativa alta. Se a causa ambiental continuar, a pintura sozinha não resolve.</p>
<h2>45. Algas em fachadas</h2><p>Manchas verdes/escurecidas em áreas externas: umidade frequente, sombra, vegetação, superfície que demora a secar. Trate a contaminação biológica antes da nova pintura e use sistema externo adequado.</p>
<h2>46. Manchas de gordura e óleo</h2><p>Manchas persistentes e falhas de aderência em pontos contaminados. Não lixe ou pinte sem descontaminar; teste a aderência antes de repintar.</p>
<h2>47. Calcinação</h2><p>Ao passar a mão, fica um pó da cor da tinta: exposição ao tempo, envelhecimento, degradação superficial. Remova o pó solto, prepare (fundo), regularize e repinte com produto adequado à exposição.</p>
<h2>48. Desbotamento precoce</h2><p>A cor perde intensidade rápido em áreas expostas: radiação UV, produto inadequado, pigmentação sensível. Escolha produtos para alta exposição solar; não corrija só com retoques.</p>
<h2>49. Microfissuras superficiais</h2><p>Rede fina sobre a película: envelhecimento, perda de flexibilidade, camadas excessivas, movimentações leves. Avalie a profundidade antes de assumir que é só estético.</p>
<h2>50. Perda precoce de brilho</h2><p>Opaca antes do esperado: acabamento inadequado, aplicação incorreta, limpeza agressiva, exposição. Use produtos compatíveis com o ambiente e condições de uso.</p>
<div class="dica"><b>Na loja:</b> fachada ensolarada e cores fortes pedem tinta premium com proteção UV. Área de mofo pede tinta com fungicida — depois de resolvida a umidade.</div>`);

  add('m08', 9, 'Guia rápido de diagnóstico, testes de campo e fluxo final', 6, 53, 54, `
<h2>Guia rápido de diagnóstico</h2>
<p>Qual é o sinal predominante? <b>A pintura está soltando?</b> → descubra primeiro qual camada está soltando de qual camada. <b>A tinta está manchada?</b> → investigue umidade, contaminação, substrato, absorção e agentes biológicos. <b>A tinta está rachando?</b> → investigue película, espessura, idade, compatibilidade e movimentação do substrato. Compare com as fichas, identifique a causa provável e só então planeje a correção.</p>
<h2>Testes e verificações de campo</h2>
<ul><li><b>Inspeção visual</b> — de frente, lateralmente, contra a luz e à distância.</li><li><b>Teste de raspagem</b> — raspagem controlada para identificar falhas de aderência.</li><li><b>Teste de pó</b> — passe a mão ou pano para verificar material pulverulento.</li><li><b>Verificação de umidade</b> — método ou equipamento adequado quando houver suspeita.</li><li><b>Inspeção das camadas</b> — observe o verso da película destacada.</li><li><b>Teste em pequena área</b> — quando houver dúvida sobre aderência ou compatibilidade.</li></ul>
<h2>Os 10 erros que mais fazem o problema voltar</h2>
<ol><li>Pintar sobre umidade ativa.</li><li>Aplicar massa sobre material sem aderência.</li><li>Não remover poeira.</li><li>Pintar sobre superfície contaminada.</li><li>Ignorar a pintura antiga.</li><li>Não respeitar secagem e cura.</li><li>Diluir no olho.</li><li>Usar qualquer produto em qualquer substrato.</li><li>Corrigir fissura sem investigar a origem.</li><li>Tratar o sintoma sem eliminar a causa.</li></ol>
<h2>Quando o problema pode não ser de pintura</h2>
<p>Infiltração ativa, vazamento hidráulico, fissuras recorrentes, umidade ascendente, corrosão severa, madeira deteriorada, contaminação biológica extensa: continuar pintando por cima não resolve. <b>Saber quando não basta pintar aumenta a credibilidade do profissional.</b></p>
<h2>Fluxo final de decisão</h2>
<p>Identifique o sintoma → compare com as fichas → liste as causas → faça as verificações → determine se há causa externa → corrija ou encaminhe a causa → remova materiais comprometidos → prepare o substrato → use produtos compatíveis → respeite o fabricante → faça o acabamento.</p>
<div class="regra">3 regras finais: <b>Observe. Investigue. Corrija com segurança.</b> Quanto melhor o diagnóstico, menor a chance de o defeito voltar.</div>`);

  CONTEUDO.aulas = A;
})();
