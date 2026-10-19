/* ═══════════════════════════════════════════════════════════════
   MENTOR ST PRO — Conteúdo base (parte 1 de 4)
   Configurações, lojas, gamificação, história, valores, vídeos,
   jornada dos 30 dias e lista de módulos.
   Tudo aqui pode ser editado depois pelo Painel do Gestor.
   Textos marcados com [EDITAR] são sugestões para você completar.
   ═══════════════════════════════════════════════════════════════ */
window.CONTEUDO = window.CONTEUDO || {};

CONTEUDO.config = {
  nome_app: 'MENTOR ST PRO',
  slogan: 'Colorindo Vidas e Realizando Sonhos',
  codigo_cadastro: 'SOTINTAS2026',          // código que libera o cadastro de novos colaboradores
  nota_aprovacao: 7,                        // nota mínima (0 a 10) nos quizzes e na avaliação final
  questoes_avaliacao_final: 20,             // quantas questões a avaliação final sorteia
  mentor_padrao: 'Seu gerente de loja',     // quem acompanha a jornada dos 30 dias
  contato_suporte: 'Fale com seu supervisor ou com o RH',
  mensagem_boas_vindas: 'Seja muito bem-vindo(a) à família Só Tintas! Este app é o seu mentor de bolso: aqui você conhece nossa história, aprende o que precisa para atender bem e acompanha sua evolução.',
};

/* ── Regiões e lojas (mapa loja → supervisor, out/2026: Bruno · Danilo · Ramon · Carlos Eduardo) ──
   Perfis de acesso: colaborador (vê o próprio painel) · gerente (vê a loja) ·
   supervisor (vê as lojas da sua região) · coordenador (vê tudo + painel do gestor). */
CONTEUDO.regioes = [
  { id: 1, nome: 'Região 1 · Bruno', ativa: true },
  { id: 2, nome: 'Região 2 · Danilo', ativa: true },
  { id: 3, nome: 'Região 3 · Ramon', ativa: true },
  { id: 4, nome: 'Região 4 · Carlos Eduardo', ativa: true },
];
CONTEUDO.lojas = [
  { id: 2, nome: 'Mais Tintas', regiao_id: 1, ativa: true },
  { id: 4, nome: 'Petrópolis 2', regiao_id: 1, ativa: true },
  { id: 6, nome: 'Itaipava', regiao_id: 1, ativa: true },
  { id: 7, nome: 'Matriz', regiao_id: 1, ativa: true },
  { id: 8, nome: 'Friburgo', regiao_id: 4, ativa: true },
  { id: 9, nome: 'Magé', regiao_id: 1, ativa: true },
  { id: 10, nome: 'Petrópolis 1', regiao_id: 1, ativa: true },
  { id: 12, nome: 'Piabetá', regiao_id: 1, ativa: true },
  { id: 13, nome: 'Saracuruna', regiao_id: 1, ativa: true },
  { id: 15, nome: 'Três Rios', regiao_id: 4, ativa: true },
  { id: 17, nome: 'Santa Cruz', regiao_id: 1, ativa: true },
  { id: 22, nome: 'Dep. Alto', regiao_id: 1, ativa: true },
  { id: 23, nome: 'Dep. Várzea', regiao_id: 1, ativa: true },
  { id: 16, nome: 'Maricá', regiao_id: 2, ativa: true },
  { id: 27, nome: 'Araruama', regiao_id: 2, ativa: true },
  { id: 28, nome: 'Angra dos Reis', regiao_id: 2, ativa: true },
  { id: 29, nome: 'Itaipu', regiao_id: 2, ativa: true },
  { id: 30, nome: 'Barão', regiao_id: 2, ativa: true },
  { id: 32, nome: 'Paraíso', regiao_id: 2, ativa: true },
  { id: 33, nome: 'Macaé 2', regiao_id: 2, ativa: true },
  { id: 34, nome: 'Cabo Frio', regiao_id: 2, ativa: true },
  { id: 38, nome: 'Itaguaí', regiao_id: 2, ativa: true },
  { id: 18, nome: 'Nova Iguaçu 1', regiao_id: 3, ativa: true },
  { id: 19, nome: 'Nilópolis', regiao_id: 3, ativa: true },
  { id: 21, nome: 'Queimados', regiao_id: 3, ativa: true },
  { id: 24, nome: 'Nova Iguaçu 2', regiao_id: 3, ativa: true },
  { id: 25, nome: 'Belford Roxo', regiao_id: 3, ativa: true },
  { id: 26, nome: 'São Cristóvão', regiao_id: 3, ativa: true },
  { id: 35, nome: 'Taquara', regiao_id: 3, ativa: true },
  { id: 36, nome: 'São João de Meriti', regiao_id: 3, ativa: true },
  { id: 37, nome: 'Macaé 3', regiao_id: null, ativa: true },
  { id: 11, nome: 'CD', regiao_id: null, ativa: true },
];

/* ── Gamificação ─────────────────────────────────────────────── */
CONTEUDO.niveis = [
  { n: 1, nome: 'Aprendiz', xp_min: 0, emoji: '🌱', descricao: 'Todo campeão começa aqui.' },
  { n: 2, nome: 'Ajudante de Pintura', xp_min: 250, emoji: '🖌️', descricao: 'Já sabe o básico e ajuda no balcão.' },
  { n: 3, nome: 'Pintor', xp_min: 700, emoji: '🎨', descricao: 'Domina superfícies, produtos e cálculo.' },
  { n: 4, nome: 'Mestre das Cores', xp_min: 1300, emoji: '🏅', descricao: 'Diagnostica, especifica e orienta o cliente.' },
  { n: 5, nome: 'Campeão Só Tintas', xp_min: 2000, emoji: '🏆', descricao: 'Referência da loja. Colore vidas e realiza sonhos.' },
];

CONTEUDO.regras_xp = {
  aula: 20, video: 15, quiz_aprovado: 60, quiz_nota10: 25, modulo_bonus: 50,
  historia: 30, valores: 30, disc: 40, tarefa: 10, final_aprovado: 150, login_diario: 5, checklist: 15,
};

CONTEUDO.conquistas = [
  { id: 'primeiro_passo', nome: 'Primeiro Passo', emoji: '👣', descricao: 'Concluiu a primeira aula', xp: 10, regra: { tipo: 'aulas', min: 1 }, ordem: 1 },
  { id: 'maratonista', nome: 'Maratonista', emoji: '🏃', descricao: '3 aulas concluídas no mesmo dia', xp: 20, regra: { tipo: 'aulas_dia', min: 3 }, ordem: 2 },
  { id: 'zero_retrabalho', nome: 'Zero Retrabalho', emoji: '🎯', descricao: 'Concluiu o módulo Pintura sem Retrabalho', xp: 30, regra: { tipo: 'modulo', id: 'm01' }, ordem: 3 },
  { id: 'checklist_na_mao', nome: 'Checklist na Mão', emoji: '✅', descricao: 'Concluiu o Checklist de Avaliação Pré-Pintura', xp: 30, regra: { tipo: 'modulo', id: 'm02' }, ordem: 8 },
  { id: 'mestre_superficies', nome: 'Mestre das Superfícies', emoji: '🧱', descricao: 'Concluiu a Tabela Superfície × Preparação', xp: 30, regra: { tipo: 'modulo', id: 'm03' }, ordem: 4 },
  { id: 'detetive_parede', nome: 'Detetive da Parede', emoji: '🔎', descricao: 'Concluiu o Guia "Quando o problema NÃO é de pintura"', xp: 30, regra: { tipo: 'modulo', id: 'm04' }, ordem: 6 },
  { id: 'olho_clinico', nome: 'Olho Clínico', emoji: '👁️', descricao: 'Concluiu o Checklist Rápido da parede', xp: 30, regra: { tipo: 'modulo', id: 'm05' }, ordem: 9 },
  { id: 'vistoriador', nome: 'Vistoriador', emoji: '📋', descricao: 'Concluiu a Ficha de Vistoria de Obra', xp: 30, regra: { tipo: 'modulo', id: 'm06' }, ordem: 10 },
  { id: 'colorista', nome: 'Colorista', emoji: '🎨', descricao: 'Concluiu as 100 Combinações de Cores', xp: 30, regra: { tipo: 'modulo', id: 'm07' }, ordem: 7 },
  { id: 'doutor_patologias', nome: 'Doutor das Patologias', emoji: '🩺', descricao: 'Concluiu o Atlas das Patologias da Pintura', xp: 30, regra: { tipo: 'modulo', id: 'm08' }, ordem: 5 },
  { id: 'checklist_em_acao', nome: 'Checklist em Ação', emoji: '📲', descricao: 'Usou os 3 checklists dinâmicos do Assessor com um cliente', xp: 40, regra: { tipo: 'checklists', min: 3 }, ordem: 11 },
  { id: 'nota_10', nome: 'Nota 10', emoji: '💯', descricao: 'Gabaritou um quiz', xp: 25, regra: { tipo: 'quiz_nota10', min: 1 }, ordem: 12 },
  { id: 'cinefilo', nome: 'Cinéfilo', emoji: '🎬', descricao: 'Assistiu 5 vídeos', xp: 20, regra: { tipo: 'videos', min: 5 }, ordem: 13 },
  { id: 'historiador', nome: 'Historiador', emoji: '📜', descricao: 'Conheceu a história da Só Tintas', xp: 15, regra: { tipo: 'historia' }, ordem: 14 },
  { id: 'guardiao_valores', nome: 'Guardião dos Valores', emoji: '🛡️', descricao: 'Conheceu propósito, missão e valores', xp: 15, regra: { tipo: 'valores' }, ordem: 15 },
  { id: 'perfil_revelado', nome: 'Perfil Revelado', emoji: '🧭', descricao: 'Fez o teste DISC', xp: 20, regra: { tipo: 'disc' }, ordem: 16 },
  { id: 'sequencia_7', nome: 'Sequência de 7', emoji: '🔥', descricao: '7 dias seguidos de atividade', xp: 40, regra: { tipo: 'streak', min: 7 }, ordem: 17 },
  { id: 'jornada_30', nome: 'Jornada dos 30 Dias', emoji: '🗺️', descricao: 'Concluiu todas as tarefas da jornada com o mentor', xp: 50, regra: { tipo: 'tarefas', min: 20 }, ordem: 18 },
  { id: 'trilha_completa', nome: 'Trilha Completa', emoji: '🎓', descricao: 'Concluiu todos os módulos da trilha', xp: 80, regra: { tipo: 'todos_modulos' }, ordem: 19 },
  { id: 'campeao', nome: 'Campeão Só Tintas', emoji: '🏆', descricao: 'Aprovado na avaliação final', xp: 100, regra: { tipo: 'final' }, ordem: 20 },
];

/* ── Nossa história (linha do tempo) ─────────────────────────── */
CONTEUDO.historia = [
  { id: 'h01', ordem: 1, ano: '1977', titulo: '1º de abril: nasce a Só Tintas', descricao: 'Carlos Pinheiro e Paulo Borba fundam a Só Tintas. Uma história de coragem e propósito, que começa com dois homens que tiveram a coragem de começar — e nos ensinaram que trabalho, honestidade e fé constroem legados.', imagem: 'assets/historia/h01.jpg' },
  { id: 'h02', ordem: 2, ano: '1980', titulo: 'Paulo Borba assume a liderança', descricao: 'Paulo Borba assume integralmente a liderança da empresa, que presidiria por muitas décadas.', imagem: 'assets/historia/h02.jpg' },
  { id: 'h03', ordem: 3, ano: 'Início dos anos 2000', titulo: 'A 2ª geração entra no negócio', descricao: 'Rafael, Frederico e Thiago Borba entram no negócio e passam a conduzir a empresa — hoje à frente das três diretorias.', imagem: 'assets/historia/h03.jpg' },
  { id: 'h04', ordem: 4, ano: '2026', titulo: '33 lojas em 22 municípios', descricao: '33 lojas em 22 municípios do Estado do Rio de Janeiro e mais de 1.000 colaboradores. Referência em tintas e soluções para pintura.', imagem: 'assets/historia/h04.jpg' },
  { id: 'h05', ordem: 5, ano: '49 anos', titulo: 'História, evolução e transformação', descricao: 'Nosso negócio nunca foi vender tinta: sempre foi transformar pessoas. Nós não apenas pintamos paredes — nós colorimos vidas e realizamos sonhos. Nosso maior patrimônio são as pessoas: resultados extraordinários são consequência de pessoas extraordinárias. Você faz parte dessa história.', imagem: 'assets/historia/h05.png' },
];

/* ── Organograma (Bootcamp Só Tintas 2026) ──────────────────── */
CONTEUDO.organograma = {
  titulo: 'Organograma',
  subtitulo: 'Como a Só Tintas se organiza',
  diretorias: [
    { nome: 'Rafael Borba', cargo: 'Diretoria', areas: [{ nome: 'RH' }, { nome: 'Auditoria' }, { nome: 'Marketing' }, { nome: 'Comercial', sub: ['Lojas', 'Atendimento On Line', 'Atacado'] }] },
    { nome: 'Fred Borba', cargo: 'Diretoria', areas: [{ nome: 'Digital' }, { nome: 'Financeiro' }, { nome: 'Jurídico' }] },
    { nome: 'Thiago Borba', cargo: 'Diretoria', areas: [{ nome: 'Logística' }, { nome: 'Compras' }, { nome: 'TI' }] },
  ],
};

/* ── Propósito, missão, visão, valores e mantras (Bootcamp 2026) ── */
CONTEUDO.valores = [
  { id: 'v01', ordem: 1, tipo: 'proposito', titulo: 'Nosso propósito', descricao: 'Colorindo vidas e realizando sonhos — A meta é o caminho, a Só Tintas é o veículo e o seu sonho é o destino.', icone: '🌈' },
  { id: 'v02', ordem: 2, tipo: 'missao', titulo: 'Missão', descricao: 'Ser reconhecido como a melhor empresa do Brasil, atendendo as necessidades dos clientes através do entendimento e atendimento das nossas PESSOAS.', icone: '🎯' },
  { id: 'v03', ordem: 3, tipo: 'visao', titulo: 'Visão', descricao: 'Ser reconhecida como a empresa que mais desenvolve pessoas no nosso segmento, expandindo com excelência, inovação e tecnologia, mantendo nossa alma de família.', icone: '🔭' },
  { id: 'v04', ordem: 4, tipo: 'valor', titulo: 'Confiança', descricao: 'Construímos relações duradouras com qualidade e transparência. Grandes equipes começam quando confiamos uns nos outros.', icone: '🛡️' },
  { id: 'v05', ordem: 5, tipo: 'valor', titulo: 'Acolhimento', descricao: 'Valorizamos as pessoas e acreditamos que grandes resultados nascem de grandes relacionamentos. Ninguém evolui sendo tratado apenas pelos seus erros.', icone: '❤️' },
  { id: 'v06', ordem: 6, tipo: 'valor', titulo: 'Desenvolvimento', descricao: 'Evoluímos constantemente nossos produtos, nossas pessoas e nossos parceiros. Acreditamos que todos podem crescer e se transformar: de lagarta a BORBOLETA!', icone: '🦋' },
  { id: 'v07', ordem: 7, tipo: 'valor', titulo: 'Responsabilização', descricao: 'O problema não é meu, mas assim que fiquei sabendo só tem dois caminhos: ser parte da SOLUÇÃO ou ser conivente com o errado.', icone: '✅' },
  { id: 'v08', ordem: 8, tipo: 'mantra', titulo: 'Mantra', descricao: 'Confia e confere.', icone: '💬' },
  { id: 'v09', ordem: 9, tipo: 'mantra', titulo: 'Mantra', descricao: 'Se não há dúvida, há dívida.', icone: '💬' },
  { id: 'v10', ordem: 10, tipo: 'mantra', titulo: 'Mantra', descricao: 'Você é tão grande quanto sua capacidade de resolver problema.', icone: '💬' },
  { id: 'v11', ordem: 11, tipo: 'mantra', titulo: 'Mantra', descricao: 'Justificativa depois do prazo é desculpa por não ter feito.', icone: '💬' },
  { id: 'v12', ordem: 12, tipo: 'mantra', titulo: 'Mantra', descricao: 'Quanto custa e pra que serve.', icone: '💬' },
  { id: 'v13', ordem: 13, tipo: 'mantra', titulo: 'Mantra', descricao: 'Ninguém cresce sozinho.', icone: '💬' },
  { id: 'v14', ordem: 14, tipo: 'mantra', titulo: 'Mantra', descricao: 'É proibido resmungar.', icone: '💬' },
  { id: 'v15', ordem: 15, tipo: 'mantra', titulo: 'Mantra', descricao: 'Se o assunto não é venda, o assunto está errado.', icone: '💬' },
  { id: 'v16', ordem: 16, tipo: 'mantra', titulo: 'Mantra', descricao: 'Se não se pode medir, não se pode pagar.', icone: '💬' },
  { id: 'v17', ordem: 17, tipo: 'mantra', titulo: 'Mantra', descricao: 'Ser antes de Ser.', icone: '💬' },
  { id: 'v18', ordem: 18, tipo: 'nao_permitimos', titulo: 'Assédio', descricao: 'Não permitimos assédio.', icone: '🚫' },
  { id: 'v19', ordem: 19, tipo: 'nao_permitimos', titulo: 'Preconceito', descricao: 'Não permitimos preconceito.', icone: '🚫' },
  { id: 'v20', ordem: 20, tipo: 'nao_permitimos', titulo: 'Discriminação', descricao: 'Não permitimos discriminação.', icone: '🚫' },
  { id: 'v21', ordem: 21, tipo: 'nao_permitimos', titulo: 'Mentira', descricao: 'Não permitimos mentira.', icone: '🚫' },
  { id: 'v22', ordem: 22, tipo: 'nao_permitimos', titulo: 'Roubo e furto', descricao: 'Não permitimos roubo e furto.', icone: '🚫' },
];

/* ── Videoteca (cole o link do YouTube ou do Google Drive no painel) ── */
CONTEUDO.videos = [
  { id: 'v01', ordem: 1, categoria: 'Institucional', titulo: 'Boas-vindas da Diretoria', descricao: 'Rafael, Fred e Thiago Borba dão as boas-vindas aos novos campeões.', url: '', xp: 15, ativo: true },
  { id: 'v02', ordem: 2, categoria: 'Institucional', titulo: 'Nossa história em 3 minutos', descricao: 'De 1977 a 33 lojas em 22 municípios: a trajetória da Só Tintas.', url: '', xp: 15, ativo: true },
  { id: 'v03', ordem: 3, categoria: 'Produtos', titulo: 'Linha Coral: conhecendo os produtos', descricao: 'Acabamentos, linhas e embalagens que mais vendemos.', url: '', xp: 15, ativo: true },
  { id: 'v04', ordem: 4, categoria: 'Técnica', titulo: 'Como calcular a quantidade de tinta', descricao: 'Metragem, demãos e rendimento na prática.', url: '', xp: 15, ativo: true },
  { id: 'v05', ordem: 5, categoria: 'Técnica', titulo: 'Preparação de superfície na prática', descricao: 'Lixar, selar, emassar: o que acontece antes da tinta.', url: '', xp: 15, ativo: true },
  { id: 'v06', ordem: 6, categoria: 'Atendimento', titulo: 'Atendimento Só Tintas: do "bom dia" ao fechamento', descricao: 'Sondagem, especificação, complementos e fechamento.', url: '', xp: 15, ativo: true },
];

/* ── Jornada dos 30 dias (tarefas práticas com o mentor) ──────── */
CONTEUDO.jornada = [
  { id: 'j01', semana: 1, ordem: 1, titulo: 'Conhecer o gerente e a equipe da loja', descricao: 'Apresente-se, anote o nome de cada colega e descubra quem é o seu mentor.', xp: 10 },
  { id: 'j02', semana: 1, ordem: 2, titulo: 'Tour completo pela loja', descricao: 'Setores: tintas, complementos, caixa, estoque e área de preparo. Onde fica cada coisa?', xp: 10 },
  { id: 'j03', semana: 1, ordem: 3, titulo: 'Ler "Nossa História" e "Propósito & Valores" no app', descricao: 'Conheça a história, o organograma, os valores e os mantras — e ganhe pontos ST.', xp: 10 },
  { id: 'j04', semana: 1, ordem: 4, titulo: 'Assistir aos vídeos institucionais', descricao: 'Boas-vindas da diretoria e Nossa história em 3 minutos.', xp: 10 },
  { id: 'j05', semana: 1, ordem: 5, titulo: 'Concluir o módulo Pintura sem Retrabalho', descricao: 'Base de tudo: a sequência profissional da pintura.', xp: 10 },
  { id: 'j06', semana: 2, ordem: 6, titulo: 'Conhecer as embalagens e linhas mais vendidas', descricao: 'Com o mentor, identifique as 10 referências que mais saem e onde ficam.', xp: 10 },
  { id: 'j07', semana: 2, ordem: 7, titulo: 'Acompanhar 3 atendimentos do mentor', descricao: 'Só observe: como ele pergunta, especifica e fecha.', xp: 10 },
  { id: 'j08', semana: 2, ordem: 8, titulo: 'Usar a Calculadora de Materiais com um cliente real', descricao: 'Calcule tinta + complementos e confira com o mentor.', xp: 10 },
  { id: 'j09', semana: 2, ordem: 9, titulo: 'Concluir Tabela de Superfícies e Atlas das Patologias', descricao: 'Módulos 2 e 3 da trilha: a preparação de cada superfície e as 50 fichas de problemas.', xp: 10 },
  { id: 'j10', semana: 2, ordem: 10, titulo: 'Aprender a consultar preço, estoque e pedido no sistema', descricao: 'Com o mentor: consulta, reserva e emissão.', xp: 10 },
  { id: 'j11', semana: 3, ordem: 11, titulo: 'Fazer 3 atendimentos acompanhados', descricao: 'Você conduz, o mentor observa e dá feedback.', xp: 10 },
  { id: 'j12', semana: 3, ordem: 12, titulo: 'Usar o Especificador em um caso real', descricao: 'Superfície + condição + ambiente → sistema de pintura. Envie a especificação para o cliente.', xp: 10 },
  { id: 'j13', semana: 3, ordem: 13, titulo: 'Montar uma lista completa de materiais', descricao: 'Tinta, fundo, massa, lixa, fita, rolo, pincel, lona… nada pode faltar.', xp: 10 },
  { id: 'j14', semana: 3, ordem: 14, titulo: 'Concluir "Quando o problema NÃO é de pintura" e Cores (módulos 4 e 5)', descricao: 'Reconhecer o que a tinta não resolve e ajudar o cliente a escolher cores.', xp: 10 },
  { id: 'j15', semana: 3, ordem: 15, titulo: 'Fazer o teste DISC', descricao: 'Descubra seu perfil e converse com o mentor sobre pontos fortes.', xp: 10 },
  { id: 'j16', semana: 4, ordem: 16, titulo: 'Diagnosticar um problema de pintura com o Atlas', descricao: 'Cliente com parede descascando, mofo ou bolha: use o Diagnóstico do Assessor.', xp: 10 },
  { id: 'j17', semana: 4, ordem: 17, titulo: 'Sugerir uma combinação de cores', descricao: 'Use o catálogo de 100 combinações para ajudar um cliente a decidir.', xp: 10 },
  { id: 'j18', semana: 4, ordem: 18, titulo: 'Concluir os checklists de vistoria (módulos 6, 7 e 8)', descricao: 'Últimos módulos da trilha. Depois, use os checklists dinâmicos do Assessor com um cliente real e envie pelo WhatsApp.', xp: 10 },
  { id: 'j19', semana: 4, ordem: 19, titulo: 'Fazer uma venda completa sozinho', descricao: 'Do "bom dia" ao fechamento, com complementos.', xp: 10 },
  { id: 'j20', semana: 4, ordem: 20, titulo: 'Avaliação final + conversa de feedback com o mentor', descricao: 'Seja aprovado na avaliação final e combine seus próximos passos.', xp: 10 },
];

/* ── Módulos da trilha (as aulas estão em conteudo-aulas.js) ──── */
/* Ordem da trilha (campo ordem): 1 Pintura sem Retrabalho (preparação de superfície e patologias) → 2 Tabela Superfície × Preparação →
   3 Atlas das Patologias → 4 Quando o problema NÃO é de pintura → 5 Cores → 6, 7 e 8 Checklists e Ficha de Vistoria (ferramentas de vistoria, por último).
   Para mudar a ordem, basta alterar o campo "ordem" (também pelo Painel do Gestor). */
CONTEUDO.modulos = [
  { id: 'm01', ordem: 1, pdf: 'assets/pdf/SoTintas-m01-Pintura-sem-Retrabalho.pdf', titulo: 'Pintura sem Retrabalho', subtitulo: 'Guia prático para reduzir erros, desperdícios e retornos à obra', icone: '🎯', cor: 'verde', paginas: 11, fonte: 'Guia Pintura sem Retrabalho', obrigatorio: true, xp_bonus: 50, descricao: 'A sequência profissional da pintura: analisar, preparar, escolher, aplicar, conferir e entregar. O que fazer antes, durante e depois para não voltar à obra de graça.', ativo: true },
  { id: 'm03', ordem: 2, pdf: 'assets/pdf/SoTintas-m03-Tabela-Superficie-x-Preparacao.pdf', titulo: 'Tabela Superfície × Preparação', subtitulo: 'O que fazer antes de pintar cada tipo de superfície', icone: '🧱', cor: 'azul', paginas: 10, fonte: 'Tabela Rápida de Superfície × Preparação', obrigatorio: true, xp_bonus: 50, descricao: 'Reboco, massa, concreto, gesso, drywall, paredes pintadas, madeira, metais e condições especiais: o que verificar e qual preparação cada uma exige.', ativo: true },
  { id: 'm08', ordem: 3, pdf: 'assets/pdf/SoTintas-m08-Atlas-das-Patologias-da-Pintura.pdf', titulo: 'Atlas das Patologias da Pintura', subtitulo: '50 fichas técnicas para identificar e corrigir problemas', icone: '🩺', cor: 'vermelho', paginas: 54, fonte: 'Atlas Visual das Patologias da Pintura — 50 Fichas Técnicas', obrigatorio: true, xp_bonus: 50, descricao: 'Bolhas, descascamento, eflorescência, marcas de rolo, enrugamento, ferrugem, mofo, calcinação… como reconhecer, causas, o que verificar, o que não fazer e o caminho de correção.', ativo: true },
  { id: 'm04', ordem: 4, pdf: 'assets/pdf/SoTintas-m04-Quando-o-Problema-NAO-e-de-Pintura.pdf', titulo: 'Quando o problema NÃO é de pintura', subtitulo: 'Guia de bolso para reconhecer causas que a tinta não resolve', icone: '🔎', cor: 'laranja', paginas: 7, fonte: 'Guia de Bolso: Quando o problema NÃO é de pintura', obrigatorio: true, xp_bonus: 50, descricao: 'Umidade, chuva, vazamento, rodapé, fissuras, reboco, mofo, corrosão, madeira e condensação: os 12 sinais de que pintar por cima não vai resolver — e o que dizer ao cliente.', ativo: true },
  { id: 'm07', ordem: 5, pdf: 'assets/pdf/SoTintas-m07-100-Combinacoes-de-Cores.pdf', titulo: '100 Combinações de Cores', subtitulo: 'Catálogo visual de cores para ambientes', icone: '🎨', cor: 'amarelo', paginas: 104, fonte: '100 Combinações de Cores para Ambientes', obrigatorio: true, xp_bonus: 50, descricao: 'Cor principal, secundária e de apoio para salas, quartos, cozinhas, banheiros, fachadas, escritórios, áreas externas, corredores e combinações coringa.', ativo: true },
  { id: 'm02', ordem: 6, pdf: 'assets/pdf/SoTintas-m02-Checklist-Pre-Pintura.pdf', titulo: 'Checklist de Avaliação Pré-Pintura', subtitulo: 'Avalie antes. Prepare certo. Evite retrabalho.', icone: '✅', cor: 'azul', paginas: 7, fonte: 'Checklist de Avaliação Pré-Pintura', obrigatorio: true, xp_bonus: 50, descricao: 'Os 7 passos para avaliar uma superfície antes de abrir a tinta: identificar, verificar a base, procurar umidade, checar a pintura antiga, defeitos, preparação e liberação.', ativo: true },
  { id: 'm05', ordem: 7, pdf: 'assets/pdf/SoTintas-m05-Checklist-Rapido-da-Parede.pdf', titulo: 'Checklist Rápido da Parede', subtitulo: 'O que olhar na parede antes de fechar o serviço', icone: '👁️', cor: 'vermelho', paginas: 7, fonte: 'Checklist Rápido: O que olhar na parede antes de fechar o serviço', obrigatorio: true, xp_bonus: 50, descricao: 'A vistoria de 5 minutos em 10 pontos, as 5 perguntas de histórico e a classificação A/B/C da parede antes de orçar.', ativo: true },
  { id: 'm06', ordem: 8, pdf: 'assets/pdf/SoTintas-m06-Ficha-de-Vistoria-de-Obra.pdf', titulo: 'Ficha de Vistoria de Obra', subtitulo: 'Registre as condições antes de começar', icone: '📋', cor: 'cinza', paginas: 6, fonte: 'Ficha Imprimível de Vistoria de Obra', obrigatorio: true, xp_bonus: 50, descricao: 'Como preencher a ficha de vistoria: dados do serviço, condição da superfície, problemas, preparação necessária, registro fotográfico e situação da obra.', ativo: true },
];
