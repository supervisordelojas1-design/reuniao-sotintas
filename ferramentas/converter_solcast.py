#!/usr/bin/env python3
"""Converte o pacote exportado do Power BI (Solcast) para os .xlsx no mesmo
layout do "Exportar dados → Dados com layout atual".
uso: converter_solcast.py pacote.json pasta_saida
gera: INDICADORES - MES ATUAL.xlsx, META - MES ATUAL.xlsx,
      EVOLUCAO MENSAL POR CLIENTE - <cod>.xlsx (um por filial)"""
import csv, io, json, os, sys
from openpyxl import Workbook
from openpyxl.styles import Font

REG = 'SUPERVISOR BRUNO SÓ TINTAS, SUPERVISOR CARLOS EDUARDO SÓ TINTAS, SUPERVISOR DANILO SÓ TINTAS ou SUPERVISOR RAMON SÓ TINTAS'
MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
FMT_N, FMT_P = '#,0.00', '0.00%;-0.00%;0.00%'


def ler_csv(txt):
    return [r for r in csv.reader(io.StringIO(txt.replace('\r\n', '\n').replace('\r', '\n'))) if r]


def num(s):
    s = (s or '').strip()
    if s == '':
        return None
    pct = s.endswith('%')
    s = s.rstrip('%').replace('.', '').replace(',', '.')
    try:
        v = float(s)
    except ValueError:
        return None
    if pct:
        return v / 100
    return int(v) if v.is_integer() and '.' not in s else v


def div(a, b):
    return a / b if a is not None and b not in (None, 0) else None


def soma(L):
    v = [x for x in L if isinstance(x, (int, float))]
    return sum(v) if v else None


def salvar(wb, caminho):
    wb.save(caminho)
    print('ok', os.path.basename(caminho))


def planilha(cab, fmt_pct):
    wb = Workbook(); ws = wb.active; ws.title = 'Export'
    ws.append(cab)
    for c in ws[1]:
        c.font = Font(bold=True)
    return wb, ws


def formatar(ws, linha, cab, pct_cols, ini=2):
    for j in range(ini, len(cab)):
        c = ws.cell(linha, j + 1)
        if isinstance(c.value, (int, float)):
            c.number_format = FMT_P if j in pct_cols else FMT_N


def indicadores(txt, saida):
    R = ler_csv(txt); cab = ['Clientes recuperados CNPJ' if c == 'Qtd. Clientes reativo CNPJ' else c for c in R[0]]; dados = R[1:]
    pct = {j for j, n in enumerate(cab) if n.startswith('%')}
    ix = {n: j for j, n in enumerate(cab)}
    linhas = [[r[0], r[1]] + [num(x) for x in r[2:]] for r in dados if len(r) >= len(cab)]
    grupos = {}
    for l in linhas:
        grupos.setdefault(l[0], []).append(l)

    def total(G, f0, f1):
        t = [f0, f1] + [None] * (len(cab) - 2)
        for j in range(2, len(cab)):
            if j not in pct and cab[j] not in ('$ Ticket CPF', 'Itens CPF'):
                t[j] = soma([g[j] for g in G])
        g = lambda n: t[ix[n]] if n in ix else None
        regras = {'% Alc. Meta': ('$ Faturado', '$ Meta'), '% Alc. Meta CNPJ': ('$ Fat. CNPJ', '$ Meta CNPJ'), '% Rep. Fat. CNPJ': ('$ Fat. CNPJ', '$ Faturado'),
                  '% Clientes ativos CNPJ': ('Clientes ativos CNPJ', 'Clientes cadastrados CNPJ'), '% Positivados CNPJ': ('Clientes positivados CNPJ', 'Clientes ativos CNPJ')}
        for k, (a, b) in regras.items():
            if k in ix:
                t[ix[k]] = div(g(a), g(b))
        return t

    fat = ix['$ Faturado']
    ordem = sorted(grupos, key=lambda f: -(soma([x[fat] for x in grupos[f]]) or 0))
    wb, ws = planilha(cab, pct)
    for f in ordem:
        G = sorted(grupos[f], key=lambda x: -(x[fat] or 0))
        ini = ws.max_row + 1
        ws.append(total(G, f, 'Total')); formatar(ws, ws.max_row, cab, pct)
        for l in G:
            ws.append([None] + l[1:]); formatar(ws, ws.max_row, cab, pct)
        if ws.max_row > ini:
            ws.merge_cells(start_row=ini, start_column=1, end_row=ws.max_row, end_column=1)
    ws.append(total(linhas, 'Total', None)); formatar(ws, ws.max_row, cab, pct)
    ws.merge_cells(start_row=ws.max_row, start_column=1, end_row=ws.max_row, end_column=2)
    ws.append([])
    ws.append(['Filtros aplicados:\nano_2 é ATUAL\nnome é ' + REG + '\nnome_tipo_meta é POR VENDEDOR\nnome_tipo_vendedor é LOJA\nnome_mes_filtro é ATUAL'])
    salvar(wb, os.path.join(saida, 'INDICADORES - MES ATUAL.xlsx'))
    return len(linhas), len(grupos)


def meta(txt, saida):
    R = ler_csv(txt); cab = R[0]
    pct = {j for j, n in enumerate(cab) if n.startswith('%')}
    ix = {n: j for j, n in enumerate(cab)}
    linhas = [[r[0]] + [num(x) for x in r[1:]] for r in R[1:] if len(r) >= len(cab)]
    linhas.sort(key=lambda x: -(x[ix['$ Faturado']] or 0))
    wb, ws = planilha(cab, pct)
    for l in linhas:
        ws.append(l); formatar(ws, ws.max_row, cab, pct, 1)
    ADIT = ('$ Meta', '$ Faturado', '$ Meta restante', '$ Fat. Hoje', '$ Méd. 90 dias')   # só o que soma de verdade; o resto fica em branco
    t = ['Total'] + [soma([l[j] for l in linhas]) if cab[j] in ADIT else None for j in range(1, len(cab))]
    g = lambda n: t[ix[n]] if n in ix else None
    for k, (a, b) in {'% Alcance': ('$ Faturado', '$ Meta')}.items():
        if k in ix:
            t[ix[k]] = div(g(a), g(b))
    ws.append(t); formatar(ws, ws.max_row, cab, pct, 1)
    ws.append([])
    ws.append(['Filtros aplicados:\nano_2 é ATUAL\nnome é ' + REG + '\nnome_tipo_meta é POR EMPRESA\nnome_tipo_vendedor é LOJA\nnome_mes_filtro é ATUAL'])
    salvar(wb, os.path.join(saida, 'META - MES ATUAL.xlsx'))
    return len(linhas)


def carteira(filial, txt, saida, ate_mes):
    R = ler_csv(txt); cab = R[0]
    ic, im, iv = cab.index('Cliente'), cab.index('Mês'), cab.index('$ Faturado')
    meses = MESES[:ate_mes]
    T = {}
    for r in R[1:]:
        if len(r) <= iv or r[im] not in meses:
            continue
        v = num(r[iv])
        if v is None:
            continue
        d = T.setdefault(r[ic], {})
        d[r[im]] = (d.get(r[im]) or 0) + v
    cli = sorted(T, key=lambda c: -sum(T[c].values()))
    wb = Workbook(); ws = wb.active; ws.title = 'Export'
    ws.append(['Mês'] + meses + ['Total'])
    ws.append(['Cliente'] + ['$ Faturado'] * (len(meses) + 1))
    for row in (1, 2):
        for c in ws[row]:
            c.font = Font(bold=True)
    for c in cli:
        vals = [round(T[c][m], 2) if m in T[c] else None for m in meses]
        ws.append([c] + vals + [round(sum(T[c].values()), 2)])
    tot = [round(soma([T[c].get(m) for c in cli]) or 0, 2) if any(m in T[c] for c in cli) else None for m in meses]
    ws.append(['Total'] + tot + [round(sum(sum(T[c].values()) for c in cli), 2)])
    for row in ws.iter_rows(min_row=3):
        for c in row[1:]:
            if isinstance(c.value, (int, float)):
                c.number_format = FMT_N
    ws.append([])
    ws.append(['Filtros aplicados:\nnome_indica_cpf_cnpj é CNPJ\nnome é ' + REG + '\nano_2 é ATUAL\nnome_tipo_vendedor é LOJA\ncodigo_e_nome é ' + filial])
    cod = filial.split(' - ')[0].strip()
    salvar(wb, os.path.join(saida, 'EVOLUCAO MENSAL POR CLIENTE - %s.xlsx' % cod))
    return len(cli)


if __name__ == '__main__':
    P = json.load(open(sys.argv[1], encoding='utf-8')); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
    ate = int(P.get('mes_atual') or 12)
    rel = {}
    if P.get('INDICADORES') and '--com-indicadores' in sys.argv:   # o INDICADORES oficial sai pela tela (totais por loja exatos)
        rel['indicadores'] = indicadores(P['INDICADORES'], out)
    if P.get('META'):
        rel['meta'] = meta(P['META'], out)
    rel['carteiras'] = {f: carteira(f, t, out, ate) for f, t in (P.get('CART') or {}).items()}
    print(json.dumps(rel, ensure_ascii=False))
