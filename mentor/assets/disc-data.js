/* Base de dados do assessment DISC — Só Tintas
   Extraído de analise-perfil-comportamental.html (não alterar sem revisar o painel) */
// ═══════════════════════════════════════════════════════════
// DATA — QUESTIONS
// ═══════════════════════════════════════════════════════════
const QUESTIONS = [
  {id:1,dim:'D',text:'Gosto de assumir o controle das situações e tomar decisões com rapidez.'},
  {id:2,dim:'D',text:'Prefiro trabalhar com metas desafiadoras e resultados mensuráveis.'},
  {id:3,dim:'D',text:'Fico impaciente quando as coisas demoram ou quando o ritmo está lento.'},
  {id:4,dim:'D',text:'Não tenho dificuldade em enfrentar conflitos ou situações de pressão diretamente.'},
  {id:5,dim:'D',text:'Gosto de competir e me sinto motivado(a) por conquistas e reconhecimento.'},
  {id:6,dim:'D',text:'Prefiro liderar e tomar iniciativa a aguardar que outros decidam por mim.'},
  {id:7,dim:'I',text:'Consigo persuadir e engajar pessoas com facilidade no meu dia a dia.'},
  {id:8,dim:'I',text:'Gosto de conhecer novas pessoas e criar conexões de forma rápida e natural.'},
  {id:9,dim:'I',text:'Sou naturalmente entusiasta e costumo transmitir energia positiva ao redor.'},
  {id:10,dim:'I',text:'Prefiro ambientes de trabalho dinâmicos, com muita interação e movimento.'},
  {id:11,dim:'I',text:'As pessoas me consideram comunicativo(a), simpático(a) e carismático(a).'},
  {id:12,dim:'I',text:'Me sinto à vontade para falar em público, apresentar ideias ou convencer pessoas.'},
  {id:13,dim:'S',text:'Prefiro rotinas bem definidas e ambientes de trabalho estáveis e previsíveis.'},
  {id:14,dim:'S',text:'Sou paciente e ouço o outro até o fim antes de dar minha opinião.'},
  {id:15,dim:'S',text:'Mudanças repentinas no trabalho me causam desconforto ou insegurança.'},
  {id:16,dim:'S',text:'Priorizo o bom relacionamento e a harmonia entre as pessoas no trabalho.'},
  {id:17,dim:'S',text:'Sou leal à empresa e aos colegas, mesmo quando as coisas estão difíceis.'},
  {id:18,dim:'S',text:'Prefiro trabalhar em ritmo constante e seguro do que lidar com alta pressão.'},
  {id:19,dim:'C',text:'Analiso todos os dados disponíveis antes de tomar qualquer decisão importante.'},
  {id:20,dim:'C',text:'Sigo regras, procedimentos e padrões estabelecidos de forma rigorosa.'},
  {id:21,dim:'C',text:'Presto muita atenção aos detalhes para garantir que meu trabalho não tenha erros.'},
  {id:22,dim:'C',text:'Questiono e analiso cuidadosamente antes de aceitar novas ideias ou mudanças.'},
  {id:23,dim:'C',text:'Me incomoda muito quando algo está fora do padrão ou da organização esperada.'},
  {id:24,dim:'C',text:'Prefiro fazer uma tarefa de forma correta e metódica do que rápida e com falhas.'},
];

// ═══════════════════════════════════════════════════════════
// DATA — POSITIONS (5 cargos)
// ═══════════════════════════════════════════════════════════
const POSITIONS = {
  gerente:{
    label:'Gerente',icon:'🏆',
    profile:{D:40,I:30,S:15,C:15},
    description:'Responsável pela liderança estratégica da unidade, desenvolvimento da equipe, análise de resultados e tomada de decisões que impactam o desempenho global da loja.',
    requirements:['Liderança estratégica','Visão de negócio','Gestão de pessoas','Decisão sob pressão','Comunicação executiva','Desenvolvimento de equipes'],
  },
  supervisor:{
    label:'Supervisor(a)',icon:'👔',
    profile:{D:35,I:30,S:20,C:15},
    description:'Responsável por orientar e motivar a equipe de vendas, acompanhar indicadores, garantir o cumprimento das metas e manter o padrão de atendimento ao cliente.',
    requirements:['Liderança assertiva','Comunicação eficaz','Gestão de conflitos','Acompanhamento de metas','Desenvolvimento de pessoas','Visão operacional'],
  },
  vendedor:{
    label:'Vendedor(a)',icon:'🤝',
    profile:{D:30,I:40,S:20,C:10},
    description:'Responsável por prospectar, atender e fidelizar clientes, atingir metas de vendas e construir relacionamentos comerciais sólidos e duradouros.',
    requirements:['Persuasão e influência','Proatividade','Resiliência','Foco em resultado','Habilidade relacional','Negociação'],
  },
  assistente:{
    label:'Assistente Comercial / Op. de Caixa',icon:'💰',
    profile:{D:10,I:15,S:35,C:40},
    description:'Responsável pelas operações de caixa, controle financeiro, emissão de documentos, atendimento ao cliente e suporte administrativo-comercial.',
    requirements:['Precisão e detalhes','Conformidade com normas','Organização','Responsabilidade financeira','Equilíbrio emocional','Agilidade no atendimento'],
  },
  auxiliar:{
    label:'Auxiliar de Loja',icon:'🏪',
    profile:{D:10,I:25,S:40,C:25},
    description:'Responsável pelo atendimento ao cliente, organização e reposição do estoque, manutenção da apresentação da loja e suporte às operações diárias.',
    requirements:['Trabalho em equipe','Organização','Atenção ao cliente','Paciência','Seguir procedimentos','Comprometimento'],
  },
};

// ═══════════════════════════════════════════════════════════
// DATA — BEHAVIORAL PROFILES
// ═══════════════════════════════════════════════════════════
const PROFILES = {
  D:{
    name:'Executor(a)',emoji:'⚡',
    title:'Perfil Determinado — O(a) Executor(a)',
    color:'#CC1122',gradient:'linear-gradient(135deg,#990011,#CC1122)',dim_color:'#e53935',
    description:'Você é orientado(a) para resultados, assertivo(a) e direto(a). Toma decisões com rapidez e não recua diante de desafios. Em ambientes competitivos, sua garra, senso de urgência e disposição para superar obstáculos são verdadeiros diferenciais.',
    strengths:['Liderança natural e forte iniciativa','Alta capacidade de decisão sob pressão','Foco intenso em resultados e metas','Determinação para superar qualquer obstáculo','Proatividade e senso de urgência acima da média'],
    development:['Escuta ativa e empatia nas relações','Planejamento com foco na consistência do time','Delegação intencional e desenvolvimento de outros','Equilíbrio entre velocidade e qualidade','Construção de conexões emocionais genuínas'],
  },
  I:{
    name:'Comunicador(a)',emoji:'✨',
    title:'Perfil Influente — O(a) Comunicador(a)',
    color:'#e65100',gradient:'linear-gradient(135deg,#bf360c,#e65100)',dim_color:'#f57c00',
    description:'Você é carismático(a), entusiasta e naturalmente persuasivo(a). Cria conexões com facilidade e irradia energia positiva. Em ambientes sociais, você é a referência que motiva, engaja e inspira quem está ao seu redor.',
    strengths:['Comunicação altamente eficaz e natural','Facilidade em criar e manter relacionamentos','Entusiasmo contagiante que motiva pessoas','Criatividade e pensamento inovador','Adaptabilidade em ambientes dinâmicos'],
    development:['Organização e foco no acompanhamento de tarefas','Disciplina com prazos e processos','Equilíbrio entre entusiasmo e objetividade','Escuta consultiva e análise mais profunda','Comprometimento com entregas de ponta a ponta'],
  },
  S:{
    name:'Apoiador(a)',emoji:'🤲',
    title:'Perfil Estável — O(a) Apoiador(a)',
    color:'#1b5e20',gradient:'linear-gradient(135deg,#1b5e20,#2e7d32)',dim_color:'#2e7d32',
    description:'Você é paciente, leal e um(a) excelente parceiro(a) de equipe. Prioriza o bom relacionamento e a estabilidade. No trabalho, é o(a) profissional que mantém a coesão do grupo e garante consistência e confiabilidade nos processos.',
    strengths:['Excelência em trabalho em equipe','Alta lealdade e comprometimento de longo prazo','Paciência e escuta ativa muito desenvolvidas','Consistência e confiabilidade nas entregas','Habilidade em criar ambientes harmoniosos'],
    development:['Assertividade e posicionamento mais direto','Resiliência e adaptação a mudanças','Desenvolvimento de senso de urgência','Gestão de conflitos de forma construtiva','Proatividade para novas iniciativas'],
  },
  C:{
    name:'Analítico(a)',emoji:'🔍',
    title:'Perfil Criterioso — O(a) Analítico(a)',
    color:'#1A2A6C',gradient:'linear-gradient(135deg,#1A2A6C,#263a8f)',dim_color:'#1565c0',
    description:'Você é metódico(a), preciso(a) e orientado(a) para a qualidade. Analisa profundamente antes de agir e mantém alto padrão de exigência. Em funções que requerem precisão e conformidade, você é referência pela organização e pelo rigor.',
    strengths:['Alta precisão e atenção cuidadosa aos detalhes','Capacidade analítica e pensamento crítico','Organização e sistematização eficientes','Comprometimento com qualidade e exatidão','Seguimento rigoroso de normas e padrões'],
    development:['Agilidade e conforto na tomada de decisão','Comunicação interpessoal mais próxima','Equilíbrio entre análise e senso de urgência','Flexibilidade diante de situações imprevistas','Engajamento emocional nas relações de trabalho'],
  },
};

// ═══════════════════════════════════════════════════════════
// DATA — GROWTH OPPORTUNITIES (tom acolhedor e direcionador)
// 5 cargos × 4 perfis = 20 combinações
// ═══════════════════════════════════════════════════════════
const GROWTH = {

  // ── GERENTE ──
  D_gerente:[
    'Sua visão de resultados é um dos seus maiores trunfos na gestão. Ao equilibrá-la com momentos intencionais de escuta com a equipe, você multiplica o engajamento e fortalece a confiança de todos ao seu redor.',
    'Sua capacidade de decisão sob pressão é muito admirável. Incorporar o ritmo e as necessidades individuais de cada colaborador no planejamento transforma seu time em uma máquina de alta performance e comprometimento.',
    'Sua energia e iniciativa inspiram o time naturalmente. Ao delegar com intencionalidade, você cria espaço para pensar estrategicamente e ainda desenvolve líderes dentro da própria equipe.',
    'Metas ambiciosas fazem parte do seu DNA — isso é poderoso. Ao combiná-las com planos individuais de desenvolvimento, você transforma resultados de curto prazo em crescimento sustentável para todos.',
  ],
  I_gerente:[
    'Seu carisma e capacidade de engajar pessoas são qualidades raras e muito valorizadas em líderes. Ao complementar essa habilidade com análise consistente de indicadores, suas decisões estratégicas ganham ainda mais solidez e credibilidade.',
    'Você tem o dom de criar times coesos e motivados — isso é fundamental. Ao incorporar dados e métricas nas suas decisões, você une o melhor de dois mundos: relacionamento genuíno e resultado concreto.',
    'Sua criatividade e visão inspiradora são um diferencial de liderança. Ao estruturar planos de acompanhamento das iniciativas, você garante que toda essa energia se converta em impacto real e mensurável.',
    'Sua facilidade de comunicação cria pontes poderosas dentro do time. Ao desenvolvê-la ainda mais com técnicas de feedback estruturado, você potencializa o crescimento de cada membro da equipe.',
  ],
  S_gerente:[
    'Sua empatia e habilidade de criar vínculos genuínos são qualidades raras e muito valorizadas em líderes. Ao combiná-las com clareza nas metas e posicionamento mais assertivo nas cobranças, você constrói equipes que entregam e que confiam em você plenamente.',
    'Você tem o dom de ouvir e de construir relações sólidas e duradouras. Ao equilibrar esse talento com posicionamentos firmes quando necessário, você lidera com consistência, respeito e autoridade natural.',
    'Sua estabilidade transmite segurança ao time — isso é extremamente poderoso. Ao incorporar mais agilidade nas decisões do dia a dia, você une a confiança que inspira com o dinamismo que o cargo exige.',
    'Você cria ambientes de trabalho saudáveis e colaborativos com muita naturalidade. Ao desenvolver também a assertividade nas conversas difíceis, sua liderança se torna ainda mais completa, respeitada e admirada.',
  ],
  C_gerente:[
    'Sua capacidade analítica e rigor com qualidade são diferenciais poderosos na gestão estratégica. Ao equilibrá-los com decisões mais ágeis no dia a dia operacional, você combina precisão com dinamismo — o perfil de liderança mais completo.',
    'Seu alto padrão de exigência garante resultados de qualidade consistente. Ao comunicar esse padrão de forma acolhedora e inspiradora ao time, você transforma o rigor em uma cultura de excelência que todos abraçam.',
    'Você tem visão de detalhes que outros não percebem — isso é extremamente valioso na gestão. Ao alternar esse olhar com a perspectiva estratégica do todo, sua liderança ganha amplitude, profundidade e impacto.',
    'Seu comprometimento com a qualidade é admirável e serve de referência para o time. Ao desenvolver também habilidades de engajamento emocional, você potencializa sua liderança de forma completa e humana.',
  ],

  // ── SUPERVISOR ──
  D_supervisor:[
    'Seu perfil proativo é exatamente o que energiza e movimenta uma equipe. Ao incluir espaços de diálogo e escuta nas rotinas do time, você fortalece ainda mais a confiança dos colaboradores e amplia seu impacto como líder.',
    'Sua determinação por resultados é um diferencial real e muito valorizado. Calibrar o ritmo com as necessidades da equipe potencializa a entrega coletiva e cria uma cultura de alta performance de forma consistente.',
    'Você tem habilidade natural para liderar pelo exemplo — isso gera respeito genuíno. Ao distribuir responsabilidades de forma estratégica, você desenvolve o time e amplia significativamente o alcance dos seus resultados.',
    'Sua assertividade é um ponto forte que diferencia líderes de excelência. Combiná-la com reconhecimento positivo e feedbacks motivacionais cria uma cultura de alta performance com pertencimento e engajamento genuíno.',
  ],
  I_supervisor:[
    'Sua energia positiva transforma o clima da equipe — isso tem muito valor na supervisão. Ao combinar esse talento relacional com metas e indicadores claros, você gera resultados concretos e mantém o time sempre motivado.',
    'Você cria conexões genuínas com facilidade, o que é um diferencial poderoso. Ao usar essa habilidade para alinhar o time em torno dos objetivos da loja, você transforma relacionamento em performance e resultados consistentes.',
    'Seu entusiasmo é contagiante e naturalmente inspira a equipe a dar o melhor. Ao estruturar acompanhamentos regulares dos indicadores, você garante que essa energia se converta em resultados mensuráveis e sustentáveis.',
    'Sua comunicação fluida facilita muito as relações com o time e com os clientes. Ao desenvolvê-la com feedbacks mais estruturados e periódicos, você amplifica ainda mais seu impacto como referência de liderança.',
  ],
  S_supervisor:[
    'Sua lealdade e comprometimento são pilares que sustentam equipes de alta performance. Ao aliá-los a um estilo de supervisão mais assertivo nas cobranças, você fortalece a cultura de responsabilidade e resultado no time.',
    'Você cria vínculos reais e duradouros com sua equipe — isso gera confiança e engajamento genuíno. Ao desenvolver a habilidade de dar feedbacks diretos quando necessário, você potencializa ainda mais esses laços de forma saudável.',
    'Sua consistência e paciência são qualidades que o time percebe, valoriza e se inspira. Ao cultivar também mais senso de urgência em situações específicas, você amplia seu impacto e completude como supervisor(a).',
    'Você é uma referência de equilíbrio e estabilidade emocional para toda a equipe. Ao desenvolver maior conforto com decisões rápidas e cobranças diretas, você se torna ainda mais completo(a) e eficaz na liderança.',
  ],
  C_supervisor:[
    'Seu rigor com processos e padrões é exatamente o que garante consistência e qualidade no time. Ao combinar essa habilidade com uma comunicação mais próxima e motivacional, você cria um ambiente de alto desempenho com propósito.',
    'Sua atenção aos detalhes é uma garantia de qualidade para toda a operação da loja. Ao desenvolvê-la junto com agilidade nas decisões do dia a dia, você lidera com precisão e ritmo — combinação que todos admiram.',
    'Você tem padrão de exigência elevado e isso eleva o nível de toda a equipe naturalmente. Ao equilibrá-lo com reconhecimento positivo frequente, você cria um time mais motivado, comprometido e confiante.',
    'Sua organização e método são referenciais de qualidade para o time. Ao aliá-los com maior flexibilidade nas situações imprevisíveis do dia a dia, você se torna um(a) supervisor(a) verdadeiramente completo(a).',
  ],

  // ── VENDEDOR ──
  D_vendedor:[
    'Sua energia e determinação são ingredientes essenciais para o sucesso em vendas. Ao dedicar alguns momentos para entender profundamente a necessidade do cliente antes de apresentar soluções, você fecha mais, fideliza com mais facilidade e se torna uma referência.',
    'Você tem garra genuína para buscar resultados — isso é o coração de um bom vendedor. Ao equilibrar seu foco no fechamento com a construção de relacionamento, suas vendas se tornam mais duradouras e seus clientes voltam espontaneamente.',
    'Seu senso de urgência é um diferencial competitivo poderoso em vendas. Ao usá-lo com estratégia e empatia nas negociações, você cria uma experiência de compra que o cliente sente como atenção genuína e cuidado real.',
    'Seu espírito competitivo impulsiona seus resultados de forma consistente. Ao compartilhar boas práticas com o time, você fortalece o ambiente e abre portas para um reconhecimento ainda maior dentro da empresa.',
  ],
  I_vendedor:[
    'Você é naturalmente persuasivo(a) e cria conexões com facilidade — esse é exatamente o coração de um(a) grande vendedor(a). Ao canalizar essa energia para entender profundamente o cliente, seus resultados se multiplicam de forma consistente.',
    'Sua capacidade de criar rapport é uma vantagem competitiva real e muito valiosa. Ao complementar esse dom com disciplina no acompanhamento pós-venda, você garante que nenhuma oportunidade fique para trás e sua carteira cresça.',
    'Você inspira confiança e entusiasmo no cliente de forma natural. Ao equilibrar esse talento com comprometimentos realistas e precisos, você constrói uma reputação de confiabilidade que fideliza e gera indicações.',
    'Seu talento comunicativo abre portas com grande facilidade. Ao desenvolvê-lo com técnicas de escuta consultiva mais profunda, você agrega ainda mais valor para cada cliente que atende e amplia seu ticket médio.',
  ],
  S_vendedor:[
    'Sua capacidade de criar relações duradouras com clientes é um diferencial muito valioso em vendas. Ao complementá-la com abordagens mais proativas de prospecção e abertura de novas oportunidades, você expande seu potencial de resultados de forma consistente.',
    'Você inspira confiança genuína no cliente — isso é fundamental para vendas de alto valor. Ao desenvolver técnicas de manejo de objeções com mais confiança, você se sente ainda mais seguro(a) para conduzir negociações e fechamentos.',
    'Sua paciência e escuta criam experiências de compra memoráveis que os clientes valorizam muito. Ao combinar essas qualidades com mais assertividade no momento do fechamento, você aumenta sua taxa de conversão de forma natural.',
    'Você tem o perfil de quem fideliza clientes com muito facilidade — isso é raro e muito valorizado. Ao ampliar sua zona de conforto para novas abordagens e prospecção ativa, você descobre todo o seu potencial como vendedor(a) de excelência.',
  ],
  C_vendedor:[
    'Sua capacidade de análise e domínio profundo dos produtos são diferenciais que geram credibilidade real com o cliente. Ao combinar isso com uma abordagem mais próxima e calorosa, você cria experiências de venda que conquistam, fidelizam e geram indicações.',
    'Você conhece profundamente o que vende e isso inspira confiança genuína no cliente. Ao praticar técnicas de conexão emocional e rapport, você amplifica ainda mais seu poder de influência e persuasão nas negociações.',
    'Seu rigor e organização garantem um processo de venda e pós-venda impecáveis. Ao desenvolver também agilidade e espontaneidade na abordagem inicial, você transforma cada oportunidade em resultado com mais rapidez.',
    'Você tem um perfil técnico muito valorizado em vendas consultivas de maior complexidade. Ao cultivar também a descontração no relacionamento com clientes, você se torna um(a) vendedor(a) completo(a) e difícil de substituir.',
  ],

  // ── ASSISTENTE / OP CAIXA ──
  D_assistente:[
    'Sua agilidade e disposição são qualidades que se destacam e fazem diferença no atendimento. Ao aliá-las à atenção cuidadosa aos detalhes exigida pelo cargo, você transforma velocidade em precisão — a combinação ideal para um(a) operador(a) de excelência.',
    'Você tem energia e disposição acima da média — isso é muito positivo. Ao aplicar esse ritmo nas conferências e rotinas operacionais, você garante um atendimento rápido, sem erros e altamente valorizado pelo cliente e pela liderança.',
    'Sua determinação é um ativo real que o cargo vai potencializar. Ao canalizá-la para o seguimento rigoroso dos procedimentos financeiros, você se torna uma referência de confiabilidade e segurança para toda a equipe.',
    'Sua vontade de fazer acontecer é muito positiva e contagiante. Com o tempo, você vai perceber que a cautela nas operações é exatamente o que te diferencia e te torna um(a) profissional indispensável e de grande confiança.',
  ],
  I_assistente:[
    'Seu talento para se relacionar é um diferencial positivo e muito valorizado no atendimento ao cliente. Ao equilibrá-lo com atenção cuidadosa às operações de caixa, você oferece ao cliente o melhor dos dois mundos: agilidade com acolhimento genuíno.',
    'Você torna o ambiente mais leve e agradável — isso tem muito valor e é percebido por todos. Ao combinar essa qualidade com foco total nos processos do caixa, seu atendimento se torna ao mesmo tempo memorável e preciso.',
    'Sua comunicação natural facilita muito a resolução de situações com clientes difíceis. Ao desenvolvê-la com técnicas de atendimento mais consultivo, você se torna uma referência em experiência do cliente na loja.',
    'Você tem facilidade para criar conexões rápidas e genuínas — isso é muito valioso. Ao direcionar essa habilidade para cada operação com atenção total, você une eficiência com um atendimento de qualidade superior.',
  ],
  S_assistente:[
    'Sua estabilidade emocional é exatamente o que o cargo de caixa exige para funcionar bem. Ao complementá-la com maior agilidade nos momentos de alto fluxo de clientes, você entrega uma experiência de atendimento ainda mais fluida e eficiente.',
    'Você é consistente e confiável — essas qualidades são essenciais em operações financeiras e muito valorizadas. Ao desenvolver leveza para lidar com imprevistos e variações do sistema, você mantém sua eficiência em qualquer situação.',
    'Seu equilíbrio e cuidado nas operações são grandes diferenciais que garantem segurança no caixa. Ao cultivar também mais assertividade em situações com clientes insatisfeitos, você se torna completo(a) no atendimento de ponta a ponta.',
    'Você demonstra comprometimento real e genuíno com suas responsabilidades — isso é muito admirado. Ao se sentir mais à vontade para expressar dúvidas e necessidades ao time, você cresce ainda mais rápido e com mais segurança.',
  ],
  C_assistente:[
    'Sua precisão e respeito às normas são qualidades fundamentais para quem opera um caixa com excelência. Ao complementar esse rigor com agilidade no atendimento ao cliente, você une qualidade e velocidade — a combinação que toda loja busca e valoriza.',
    'Você tem um perfil que garante confiabilidade nas operações financeiras — isso é extremamente valorizado e reconhecido. Ao desenvolver também leveza e calor no relacionamento com o cliente, você enriquece ainda mais a experiência de atendimento.',
    'Seu alto padrão é uma garantia de segurança e tranquilidade nas operações do caixa. Ao cultivar também equilíbrio emocional diante de imprevistos operacionais, você mantém sua eficiência e qualidade mesmo nas situações mais desafiadoras.',
    'Você demonstra responsabilidade e cuidado genuíno em cada operação — isso é muito admirável. Ao desenvolver também uma comunicação mais acolhedora com clientes e colegas, você fortalece as relações e cria um ambiente ainda mais colaborativo.',
  ],

  // ── AUXILIAR ──
  D_auxiliar:[
    'Sua iniciativa e proatividade são muito bem-vindas e valorizadas no ambiente de loja. Ao alinhar essas qualidades aos processos estabelecidos, você garante que sua energia gere resultados sustentáveis e seja reconhecida pela liderança de forma consistente.',
    'Seu potencial de liderança é notável e certamente vai ser percebido. Ao aplicá-lo dentro das responsabilidades do seu cargo, você constrói um histórico sólido que abre naturalmente portas para crescimento dentro da empresa.',
    'Você tem perfil para crescer rapidamente na carreira — e isso é muito positivo. Demonstrar domínio dos processos operacionais é o primeiro passo para ser percebido(a) como alguém pronto(a) para assumir novos e maiores desafios.',
    'Sua agilidade e disposição são diferenciais que fazem diferença no dia a dia da loja. Ao canalizá-las dentro das rotinas estabelecidas, você demonstra maturidade profissional e acelera naturalmente seu desenvolvimento de carreira.',
  ],
  I_auxiliar:[
    'Sua facilidade de relacionamento é um diferencial precioso no atendimento ao cliente e no clima da equipe. Ao equilibrá-la com foco nas tarefas operacionais, você se torna um(a) profissional completo(a) e muito valorizado(a) no papel de auxiliar.',
    'Você cria um ambiente agradável onde chega — isso faz diferença real para o cliente e para o time. Ao manter o foco nas entregas operacionais, você une o melhor dos dois mundos e se torna uma referência na loja.',
    'Seu jeito comunicativo e simpático conquista clientes naturalmente. Ao estruturar melhor seu tempo entre atendimento e organização da loja, você demonstra grande versatilidade e um perfil de alto valor para o negócio.',
    'Sua energia social é muito valorizada em um ambiente de loja. Ao desenvolvê-la junto com disciplina nas rotinas operacionais diárias, você se torna um(a) profissional completo(a) e uma referência de qualidade no time.',
  ],
  S_auxiliar:[
    'Sua lealdade e comprometimento são muito valorizados no ambiente de loja e percebidos por todos. Ao desenvolvê-los junto com mais flexibilidade diante de mudanças nos processos, você se adapta ainda melhor às necessidades do negócio.',
    'Você é uma pessoa confiável e consistente — qualidades que fazem toda a diferença para o time e para o cliente. Ao desenvolver agilidade para situações de maior movimento e demanda, você se torna ainda mais versátil e valioso(a).',
    'Sua habilidade de criar um ambiente harmonioso é muito positiva e percebida por todos. Ao cultivar também assertividade nas situações de conflito com clientes, você completa um perfil de atendimento de excelência muito admirado.',
    'Você demonstra comprometimento genuíno e consistente com o trabalho — isso é admirável. Ao se sentir mais à vontade para comunicar suas necessidades e dificuldades ao gestor, você evolui ainda mais rápido na sua trajetória profissional.',
  ],
  C_auxiliar:[
    'Seu compromisso com a qualidade e a organização é muito valorizado no ambiente de loja e percebido diariamente. Ao equilibrá-lo com flexibilidade nos momentos de alto movimento, você demonstra maturidade profissional e versatilidade valiosa.',
    'Você tem padrão de organização acima da média — isso faz diferença real na operação e na experiência do cliente. Ao desenvolvê-lo junto com agilidade no atendimento, você oferece o melhor da qualidade com ritmo e eficiência.',
    'Sua atenção aos detalhes garante uma loja bem apresentada e organizada — isso é fundamental. Ao combinar isso com um atendimento mais descontraído e próximo ao cliente, você amplia sua versatilidade e seu valor para o time.',
    'Você demonstra comprometimento real com as rotinas e padrões da loja — isso é muito admirável. Ao desenvolver também maior flexibilidade nas situações não planejadas, você evolui para um(a) profissional cada vez mais completo(a) e indispensável.',
  ],
};

const DIM_LABELS = {D:'Determinação',I:'Influência',S:'Serenidade',C:'Conformidade'};
const DIM_COLORS = {D:'#e53935',I:'#f57c00',S:'#2e7d32',C:'#1A2A6C'};
const DIM_EMOJIS = {D:'⚡',I:'✨',S:'🤲',C:'🔍'};
