#!/usr/bin/env python3
"""Converte o pacote exportado do Power BI (Solcast) para os .xlsx no mesmo
layout do "Exportar dados → Dados com layout atual".
uso: converter_solcast.py pacote.json pasta_saida
gera: INDICADORES - MES ATUAL.xlsx, META - MES ATUAL.xlsx,
      EVOLUCAO MENSAL POR CLIENTE - <cod>.xlsx (um por filial)
      e, se o pacote trouxer (desde 24/11/2026), META EUCATEX.csv no layout do AUTCOM"""
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
        ADIT = ('$ Meta', '$ Faturado', '$ Meta restante', '$ Med. 90 dias', '$ Meta CNPJ', '$ Fat. CNPJ', 'Qtd. Atendimentos')
        for j in range(2, len(cab)):   # só o que soma de verdade; contagens de clientes e médias ficam em branco
            if cab[j] in ADIT:
                t[j] = soma([g[j] for g in G])
        g = lambda n: t[ix[n]] if n in ix else None
        regras = {'% Alc. Meta': ('$ Faturado', '$ Meta'), '% Alc. Meta CNPJ': ('$ Fat. CNPJ', '$ Meta CNPJ'), '% Rep. Fat. CNPJ': ('$ Fat. CNPJ', '$ Faturado')}
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


def br(v, casas=2):
    s = ('{:,.%df}' % casas).format(v or 0)
    return s.replace(',', '#').replace('.', ',').replace('#', '.')


def eucatex(P, saida):
    """META EUCATEX da página "Por fornecedor" do Power BI, gravada no MESMO layout do
    relatório "METAS POR VENDEDOR E FORNECEDOR" do AUTCOM (CSV ; latin-1), para o Painel
    ler sem mudança nenhuma. A loja (EMP.OPE) vem da filial em que a meta do vendedor
    aparece; reserva: a filial em que ele tem meta no INDICADORES."""
    R = ler_csv(P['EUC']); cab = R[0]; ix = {n: j for j, n in enumerate(cab)}
    loja = {}
    for f, vs in (P.get('EUC_LOJA') or {}).items():
        for v in vs:
            loja.setdefault(v.strip(), []).append(f.split(' - ')[0].strip())
    reserva = {}
    if P.get('INDICADORES'):
        I = ler_csv(P['INDICADORES'])
        for r in I[1:]:
            if len(r) > 2 and (num(r[2]) or 0) > 3.5:
                c = r[1].split(' - ')[0].strip(); m = num(r[2])
                if m > reserva.get(c, (0, ''))[0]:
                    reserva[c] = (m, r[0].split(' - ')[0].strip())
    ult = ''.join(P.get('ULT') or '').split('\n')
    ult = [l.strip() for l in ult if l.strip()[:2] == '20']
    from datetime import datetime
    dt = datetime.strptime(ult[0][:16], '%Y-%m-%d %H:%M') if ult else datetime.now()
    mf = P.get('mes_filtro') or 'ATUAL'
    if mf in MESES:
        mm = MESES.index(mf) + 1; aa = dt.year - (1 if mm > dt.month else 0)
    else:
        mm, aa = dt.month, dt.year
    linhas, avisos, tm, tl, tf = [], [], 0, 0, 0
    for r in R[1:]:
        if len(r) < len(cab) or 'EUCATEX' not in r[ix['Fornecedor']].upper():
            continue
        v = r[ix['Vendedor']].strip(); c = v.split(' - ')[0].strip()
        meta_l, lit, fat = num(r[ix['Meta litros']]) or 0, num(r[ix['Litros']]) or 0, num(r[ix['$ Faturado']]) or 0
        ls = sorted(set(loja.get(v, [])))
        if len(ls) > 1:
            avisos.append('%s em mais de uma loja %s' % (v, ls))
        emp = ls[0] if ls else reserva.get(c, (0, ''))[1]
        if not emp:
            avisos.append('%s sem loja (ficou de fora)' % v); continue
        pct = (lit / meta_l * 100) if meta_l else 0
        pm = (fat / lit) if lit else 0
        prz = num(r[ix['Prazo médio']]) if 'Prazo médio' in ix else 0
        linhas.append('"%s";"%s";"10001139";"EUCATEX INDUSTRIA E COMERCIO LTDA";100,00;%s;%s;0,00;%s;%s;%s;""' % (
            v, emp, br(meta_l), br(lit), br(pct), br(pm), br(prz or 0)))
        tm += meta_l; tl += lit; tf += fat
    if not linhas:
        print('EUCATEX: nenhuma linha'); return 0
    cabec = ['SO TINTAS - SOLCAST BI (Power BI, página Por fornecedor)', '',
             'METAS POR VENDEDOR E FORNECEDOR - LITRAGEM DE FATURAMENTO – SÓ TINTAS RJ %s' % dt.strftime('%d/%m/%Y %H:%M'), '',
             'Mês/Ano : %02d/%d' % (mm, aa), 'Empresa de : FATURAMENTO', 'Empresa : TODAS (Solcast BI)', 'Vendedor : TODOS',
             'Fornecedor : 10001139-EUCATEX INDUSTRIA E COMERCIO LTDA', 'Tipo de Relatório : ANALÍTICO', 'Destino : CSV', '',
             'VENDEDOR;EMP.OPE;CÓDIGO;FORNECEDOR;% FORN.;LIT.META;LITROS;KILOS;% REAL;PR. MEDIO;PRZ.MÉD.REA.;POSITIV.']
    rod = ['', '', 'METAS POR VENDEDOR E FORNECEDOR - LITRAGEM DE FATURAMENTO  SÓ TINTAS RJ', '', '',
           'ESP;LIT.META;LITROS;KILOS;% REAL;PR. MEDIO;PRZ.MÉD.REA.;POSITIV.',
           '"TOTAL GERAL:";%s;%s;0,00;%s;%s;0,00;0,00' % (br(tm), br(tl), br(tl / tm * 100 if tm else 0), br(tf / tl if tl else 0)), '', '']
    txt = '\r\n'.join(cabec + linhas + rod)
    with open(os.path.join(saida, 'META EUCATEX.csv'), 'w', encoding='cp1252', errors='replace', newline='') as fh:
        fh.write(txt)
    print('ok META EUCATEX.csv', len(linhas), 'vendedores ·', br(tm), 'L de meta ·', br(tl), 'L', '· avisos:', avisos)
    return len(linhas)


if __name__ == '__main__':
    P = json.load(open(sys.argv[1], encoding='utf-8')); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
    ate = int(P.get('mes_atual') or 12)
    rel = {}
    if P.get('INDICADORES') and '--com-indicadores' in sys.argv:   # o INDICADORES oficial sai pela tela (totais por loja exatos)
        rel['indicadores'] = indicadores(P['INDICADORES'], out)
    if P.get('META'):
        rel['meta'] = meta(P['META'], out)
    rel['carteiras'] = {f: carteira(f, t, out, ate) for f, t in (P.get('CART') or {}).items()}
    if P.get('EUC'):
        rel['eucatex'] = eucatex(P, out)
    print(json.dumps(rel, ensure_ascii=False))
