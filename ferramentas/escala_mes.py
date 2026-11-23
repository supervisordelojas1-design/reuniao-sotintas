#!/usr/bin/env python3
"""Base mensal da Escala & Folgas: % da meta do mês fechado (23/11/2026).

Uso:  python3 -I escala_mes.py "META - <MÊS> <ANO>.xlsx" "INDICADORES - <MÊS> <ANO>.xlsx" "<mês>/<ano>" saida.json

Lê o META (meta e faturado de cada loja) e o INDICADORES expandido do Solcast
(linha "Total" da loja + vendedores) do MÊS FECHADO e grava:
  {"mes": "novembro/2026", "lojas": {"002": 95, ...},
   "vend": {"002": [["Patrick Marinheiro", 88], ...], ...}}
pct = faturado ÷ meta × 100, arredondado. Só vendedores com meta de R$ 1.000 ou mais.
O JSON vai para window.__ESC_MES antes de colar ferramentas/escala_mes.js na tela da Escala.
"""
import json, re, sys
import openpyxl

def num(v):
    if v is None or v == '':
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = re.sub(r'[^\d,.-]', '', str(v)).replace('.', '').replace(',', '.')
    try:
        return float(s)
    except ValueError:
        return None

def cod3(s):
    m = re.match(r'\s*(\d{1,3})\s*-', str(s or ''))
    return m.group(1).zfill(3) if m else None

PEQ = {'de', 'da', 'do', 'dos', 'das', 'e'}
def titulo(s):
    return ' '.join(w if (i and w in PEQ) else w.capitalize() for i, w in enumerate(s.lower().split()))

def nome_vend(cel):
    t = re.sub(r'\s+', ' ', str(cel or '')).strip()
    t = re.sub(r'^[A-Za-z]?\d{1,4}\s*-\s*', '', t)                 # código do Autcom
    for _ in range(4):
        t = re.sub(r'\s*-\s*(N\s?\d+|\d{1,3})\s*$', '', t, flags=re.I)   # " - 3", " - N2"
        t = re.sub(r'\s+N\s?\d+\s*$', '', t, flags=re.I)                  # " N1"
    return titulo(t.strip(' -'))

def linhas(path):
    ws = openpyxl.load_workbook(path, data_only=True).active
    rows = [r for r in ws.iter_rows(values_only=True)]
    cab = None
    for i, r in enumerate(rows[:20]):
        if r and any(str(c or '').strip().lower() == 'filial' for c in r):
            cab = i
            break
    if cab is None:
        raise SystemExit('sem a coluna Filial em ' + path)
    h = [str(c or '').strip().lower() for c in rows[cab]]
    return h, rows[cab + 1:]

def col(h, *nomes):
    for n in nomes:
        for i, c in enumerate(h):
            if c == n:
                return i
    raise SystemExit('coluna não encontrada: ' + '/'.join(nomes))

def main():
    meta_p, ind_p, mes, saida = sys.argv[1:5]
    h, rows = linhas(meta_p)
    cf, cm, cfat = col(h, 'filial'), col(h, '$ meta'), col(h, '$ faturado')
    lojas = {}
    for r in rows:
        c = cod3(r[cf]) if r and len(r) > cf else None
        m, f = (num(r[cm]), num(r[cfat])) if c else (None, None)
        if c and m and m >= 1000 and f is not None:
            lojas[c] = round(f / m * 100)
    h, rows = linhas(ind_p)
    cf, cv, cm, cfat = col(h, 'filial'), col(h, 'vendedor'), col(h, '$ meta'), col(h, '$ faturado')
    vend, atual = {}, None
    for r in rows:
        if not r:
            continue
        if r[cf] and cod3(r[cf]):
            atual = cod3(r[cf])                       # o Solcast só escreve a Filial na 1ª linha da loja
        v = str(r[cv] or '').strip()
        if not atual or not v or v.lower() == 'total':
            continue
        m, f = num(r[cm]), num(r[cfat])
        if not m or m < 1000:
            continue                                  # sem meta na loja ou meta simbólica (gerente/apoio)
        vend.setdefault(atual, []).append([nome_vend(v), round((f or 0) / m * 100)])
    out = {'mes': mes, 'lojas': lojas, 'vend': vend}
    json.dump(out, open(saida, 'w', encoding='utf-8'), ensure_ascii=False)
    print(json.dumps({'mes': mes, 'lojas': len(lojas), 'vendedores': sum(len(x) for x in vend.values())}, ensure_ascii=False))

if __name__ == '__main__':
    main()
