"""Base do pós-venda: compras de clientes CPF por dia e loja (Só Tintas).

Uso:  python3 -I converter_cpf.py <solcast_cpf_AAAAMMDD.json> <pasta_saida> [base_anterior.xlsx] [--min 500]
  Lê o pacote gerado pelo ferramentas/solcast_cpf.js, soma o que cada cliente comprou em cada dia e loja,
  mantém só as compras de R$ 500 ou mais (--min) e junta com a base anterior (se informada), sem duplicar
  (chave: data + loja + cliente; o dado novo substitui o antigo).
Saída: <pasta_saida>/CLIENTES CPF - BASE POS-VENDA.xlsx
       <pasta_saida>/pos_venda_cpf.json  (o mesmo conteúdo, últimos 200 dias, para enviar ao CRM do app: aba Pós-venda)
  colunas: Data · Loja · Cliente · Vendedor (cadastro do cliente) · Valor · Produtos (grupos, do maior para o menor)
LGPD: guarda só nome, loja, vendedor, valor e grupo de produto. Não há CPF, telefone nem endereço no Solcast.
"""
import sys, json, csv, io, os, re, collections, openpyxl
from openpyxl.styles import Font

args, MIN, _it = [], 500.0, iter(sys.argv[1:])
for a in _it:
    if a == '--min': MIN = float(next(_it))
    else: args.append(a)
pacote, saida = args[0], args[1]
base_ant = args[2] if len(args) > 2 and args[2].lower().endswith('.xlsx') else None
os.makedirs(saida, exist_ok=True)
NOME = 'CLIENTES CPF - BASE POS-VENDA.xlsx'
CAB = ['Data', 'Loja', 'Cliente', 'Vendedor (cadastro)', 'Valor', 'Produtos']


def num(s):
    s = str(s or '').strip().replace('.', '').replace(',', '.')
    try: return float(s)
    except ValueError: return 0.0


P = json.load(open(pacote, encoding='utf-8'))
novas = {}; avisos = []; brutos = 0
for dia, lojas in P['CPF'].items():
    ant = None
    for loja, txt in lojas.items():
        if txt and txt == ant and len(txt) > 200: avisos.append(f'{dia} {loja[:3]}: tabela igual à da loja anterior (pode não ter atualizado)')
        ant = txt
        ag = collections.defaultdict(lambda: collections.defaultdict(float))
        rd = csv.reader(io.StringIO(txt or ''))
        cab = next(rd, None)
        if not cab or 'Cliente' not in cab[0]: continue
        iv = len(cab) - 1
        for r in rd:
            if len(r) < 3 or not r[0] or r[0].strip().lower().startswith('total'): continue
            ag[r[0].strip()][(r[1] or '').strip()] += num(r[iv])
        for rot, grupos in ag.items():
            tot = sum(grupos.values()); brutos += 1
            if tot < MIN: continue
            cli, _, vend = rot.partition(' - VEND.: ')
            if re.search(r'CONSUMIDOR', cli, re.I): continue
            prod = ' · '.join(f"{g.title()} R$ {v:,.0f}".replace(',', '.') for g, v in sorted(grupos.items(), key=lambda x: -x[1]) if v > 0)
            novas[(dia, loja[:3], cli.strip())] = [dia, loja, cli.strip().title(), vend.strip().title(), round(tot, 2), prod]

base = {}
if base_ant and os.path.exists(base_ant):
    for r in list(openpyxl.load_workbook(base_ant).active.iter_rows(values_only=True))[1:]:
        if r and r[0] and r[2]: base[(str(r[0])[:10], str(r[1])[:3], str(r[2]).upper())] = list(r[:6])
antes = len(base)
for (dia, cod, cli), linha in novas.items(): base[(dia, cod, cli.upper())] = linha

wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Compras CPF'
ws.append(CAB)
for c in ws[1]: c.font = Font(bold=True)
for linha in sorted(base.values(), key=lambda x: (str(x[0]), float(x[4] or 0)), reverse=True): ws.append(linha)
for col, w in zip('ABCDEF', (12, 38, 42, 32, 12, 90)): ws.column_dimensions[col].width = w
ws.freeze_panes = 'A2'
wb.save(os.path.join(saida, NOME))

# pacote para o CRM do app (aba Pós-venda): compras dos últimos 200 dias, sem nada além do que já está na planilha
import datetime
corte = (datetime.date.today() - datetime.timedelta(days=200)).isoformat()
linhas = [dict(data=str(x[0])[:10], loja=str(x[1])[:3], cli=str(x[2]), vend=str(x[3] or ''), valor=float(x[4] or 0), prod=str(x[5] or ''))
          for x in base.values() if str(x[0])[:10] >= corte]
json.dump(dict(gerado=datetime.datetime.now().isoformat(timespec='seconds'), linhas=linhas),
          open(os.path.join(saida, 'pos_venda_cpf.json'), 'w', encoding='utf-8'), ensure_ascii=False)

por_dia = collections.Counter(k[0] for k in novas)
print(json.dumps(dict(dias=P.get('dias'), clientes_dia_lidos=brutos, compras_minimo=MIN, novas=len(novas), por_dia=dict(sorted(por_dia.items())),
                      base_antes=antes, base_agora=len(base), erros=P.get('erros') or [], avisos=avisos[:10]), ensure_ascii=False))
