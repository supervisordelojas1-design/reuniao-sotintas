# CRM de Vendas — Só Tintas App (plano aprovado em 11/11/2026)

Objetivo: acompanhar os contatos do vendedor com clientes (orçamentos em aberto e carteira CNPJ) e com pintores imobiliários, validar e ter o status/previsão de cada orçamento.

Layout aprovado pelo Bruno em 11/11/2026: canvas "CRM Só Tintas — layout" (https://claude.ai/artifact/SmG2rsradpbUYz71kExhbL), 7 telas: Meus contatos, Registrar contato, Ficha do cliente, Pintores, Ficha do pintor, Visão do gerente, Pós-venda CPF.

## Situação (11/11/2026)
- **Etapa 1 publicada no app (sw ast-v162): `crm.html`** — orçamentos em aberto, registro de contato e situação. Piloto: loja 002 (vendedores e gerente) e a liderança (supervisão, análise, coordenação). O cartão "CRM de Vendas" só aparece na tela inicial para esse grupo.
- **Servidor: `crm.gs.txt` ainda precisa ser colado no Servidor de Dados ST** (ações `crmSalvar` e `crmListar`, aba `CRM_CONTATOS`). Enquanto isso não for feito, cada registro fica guardado só no aparelho de quem registrou (o gerente não vê) e sobe sozinho quando o servidor passar a responder.
- De onde vêm os orçamentos: pacote do Painel de Metas (`O`, com o mesmo crachá). Para o vendedor, casa pelo nome oficial que vem na ficha do PDI Semanal; se o Painel não responder, usa a lista da própria ficha da semana.

## Onde
Dentro do Só Tintas App (login nome + PIN). Dados no Servidor de Dados ST (Apps Script, `STDados.chamar`). O código do servidor não está no repositório: a tela vai no app e o trecho `.gs` é colado no Apps Script pelo Bruno.

## Áreas
1. **Orçamentos em aberto** (BASE_ORCAMENTOS: número, cliente, telefone, valor, dias) — situação: Em negociação (previsão de fechamento + chance alta/média/baixa), Fechado, Perdido (motivo obrigatório), Prorrogado.
2. **Carteira CNPJ** (clientes parados / abaixo do normal, mesma regra do e-mail Meta do dia) + ficha do comprador (nome, cargo, telefone, WhatsApp, e-mail, melhor horário; só dado profissional — LGPD).
3. **Pintores imobiliários** — cadastro + ligações (ver abaixo).
4. **Pós-venda CPF** — clientes CPF com compra de R$ 500 ou mais (ver abaixo).

Registro de contato (todas as áreas): canal (ligação/WhatsApp/visita/e-mail/na loja), resultado, próximo contato com data (vira lembrete do vendedor e do gerente).

## Pintores imobiliários
- Ficha: nome, apelido, WhatsApp, cidade/bairro de atuação, especialidade (residencial, predial/condomínio, textura/grafiato, epóxi/piso, madeira), tamanho da equipe, marcas que usa, loja e vendedor responsável, como chegou (balcão, indicação, evento), se já está no programa Pintor Cadastrado (Citel), aniversário (dia/mês).
- Obras: endereço/bairro, tipo, m² ou litros estimados, início e previsão, quem compra o material (pintor ou dono da obra), status (prospecção, orçada, comprando, concluída).
- Ligações: acompanhamento de obra, oferta/campanha, convite para treinamento/evento, pós-venda; próxima ação + data.
- Status do pintor: potencial, ativo (comprou nos últimos 60 dias), inativo; indicações de clientes que ele trouxe.
- Indicadores: pintores novos no mês, pintores ativos por loja, obras em andamento e litros previstos, pintores sem contato há 30+ dias.

## Pós-venda CPF (decidido em 11/11/2026)
- Corte: compras de R$ 500 ou mais por cliente, por dia e loja.
- Fonte: Solcast, página "Painel indicadores de vendas", tabela EVOLUÇÃO MENSAL POR CLIENTE com filtro CPF + Filial + Período (filtro de 1 dia) → dá cliente, vendedor do cadastro, grupo de produto e valor no dia. Não há telefone nem CPF no Solcast.
- Scripts: `ferramentas/solcast_cpf.js` (≈7 s por loja, ≈3,5 min por dia; no máximo 2 dias por execução) e `ferramentas/converter_cpf.py` (junta à base sem duplicar).
- Base: pasta "5 - Clientes CPF (pós-venda)" da Central de Atualização, arquivo `CLIENTES CPF - BASE POS-VENDA.xlsx` (Data, Loja, Cliente, Vendedor do cadastro, Valor, Produtos). A rotina diária das 7h acrescenta o dia anterior e completa dias faltantes desde 03/11/2026.
- Situação em 11/11: script validado na loja 002 e conversor testado; a carga das 30 lojas ainda não foi feita — a base começa na rotina de 12/11.
- Fila do pós-venda: D+3 satisfação + avaliação Google; D+15 complemento (conforme grupo comprado); D+45 acabamento/recompra; D+180 manutenção. Telefone: o vendedor registra no CRM na 1ª vez (ou vem do Autcom, abaixo). LGPD: só nome, telefone e o que comprou; cliente que não quiser contato sai da fila.

## Autcom WebService
Pelo "Manual de Endpoints WebService Autcom" (Citel): com credencial da Citel (rotas liberadas uma a uma) dá para automatizar sem tela:
- `GET /pedido-movimento/faturamento` e `/consultapedidovenda` (OR/PD) → vendas com data e orçamentos (status real: faturado/cancelado).
- `GET /cliente/{codigo}` (endereços e contatos/telefones), `/clienteUC/{data}`, `/cliente/vendedor/{vend}/ultima-compra/{data}`.
- `POST /venda-perdida` e `POST /crm/atendimento-cliente` → o CRM do app pode gravar de volta no Autcom.
- `GET /notas-fiscais` e `/notas-fiscais/itens` → itens comprados.

Pedir à Citel só as rotas de leitura acima (+ venda-perdida e crm, se for gravar). O Apps Script só alcança o WebService se ele for acessível pela internet; se for só rede interna, a rotina do computador faz a ponte.

## Gestão
- Validação automática: "Fechado" confere com faturamento do cliente nos dias seguintes; sem faturamento → gerente valida.
- Alertas ao gerente: orçamento sem contato em 48 h; previsão vencida sem atualização; 3 "não atendeu" seguidos; pintor/obra sem contato há 30 dias.
- Previsão do mês (soma ponderada pela chance: alta 70%, média 40%, baixa 15%) ao lado da meta restante; motivos de perda por loja.
- Integrações: e-mail Meta do dia (retornos vencidos de cada vendedor), PDI semanal (compromisso 3), placar no Painel de Metas.
- Indicadores: contatos/dia, % orçamentos com status, conversão, valor perdido por motivo, clientes resgatados, pintores ativos, pós-vendas feitos e venda gerada.

## Fases
1. Orçamentos (lista + registro + situação) — piloto loja 002. **No ar em 11/11/2026 (falta colar o `crm.gs.txt` no servidor).**
2. Carteira + ficha do comprador; Pintores (cadastro + ligações + obras); Pós-venda CPF.
3. Painel do gerente (validação, alertas, previsão) + integrações.
