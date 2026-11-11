"""Meta do dia aos gerentes (Só Tintas) — gera um e-mail por loja.

Uso:  python3 -I meta_do_dia.py <pasta_solcast> <extra.json> <AAAA-MM-DD> <saida>
  pasta_solcast: META - MES ATUAL.xlsx, INDICADORES - MES ATUAL.xlsx, EVOLUCAO MENSAL POR CLIENTE - <cod>.xlsx
  extra.json:    {"euc": {cod: {loja:[meta,litros], vend:{nome:[meta,litros]}}}, "ger": {cod: {gerente,email}}}
                 (lido do Painel de Metas pela rotina: Eucatex por loja/vendedor e gerente/e-mail da EQUIPE)
Saída, por loja: <saida>/<cod>.pdf  — folhas A4: a 1ª com o resumo da loja e depois UMA FOLHA POR VENDEDOR (para imprimir e entregar)
                 <saida>/<cod>.png  — a 1ª folha (resumo da loja) em imagem, para ir no corpo do e-mail
                 <saida>/<cod>.html — as mesmas folhas, e <saida>/manifesto.json
Calendário (o do Solcast): seg–sex = 1, sábado = 0,5, domingo e feriado = 0.
Meta de hoje = (meta restante + faturado hoje) ÷ dias úteis depois de hoje — a mesma 'Meta diária' do Solcast.
"""
import sys, re, json, html, datetime, unicodedata, os, openpyxl

FERIADOS = {  # nacionais + RJ (23/04). Acrescente feriados aqui.
    '2026-01-01', '2026-04-03', '2026-04-21', '2026-04-23', '2026-05-01', '2026-09-07', '2026-10-12',
    '2026-11-02', '2026-11-15', '2026-11-20', '2026-12-25',
    '2027-01-01', '2027-03-26', '2027-04-21', '2027-04-23', '2027-05-01', '2027-09-07', '2027-10-12',
    '2027-11-02', '2027-11-15', '2027-11-20', '2027-12-25'}
MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
SEM = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

# Correções do cadastro enquanto a EQUIPE do app não é atualizada (informadas pelo Bruno)
GERENTE_FIX = {
    '023': {'gerente': 'Carlos Alexandre', 'email': 'depositodastintasvarzea@sotintasnet.com.br'},  # 11/11/2026, login 042
}
EMAIL_FIX = {'novaiguacu@sotintasnet.com': 'novaiguacu@sotintasnet.com.br'}

pasta, extra_f, data_s, saida = sys.argv[1:5]
# Hora dos dados do Solcast (opcional, 5º argumento "HH:MM"; sem ele, a hora de agora em Brasília).
# Antes das 8h o "$ Fat. Hoje" do Solcast ainda é o do DIA ANTERIOR (conferido em 11/11/2026: às 06h54 trazia as vendas de 10/11)
# e a "Meta diária" do BI sai inflada; nesse horário a meta de hoje é só o que falta ÷ dias úteis depois de hoje.
try:
    _h = sys.argv[5] if len(sys.argv) > 5 else datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3))).strftime('%H:%M')
    HORA = int(_h[:2]) + int(_h[3:5]) / 60
except Exception:
    HORA = 7.0
FAT_HOJE_VALE = HORA >= 8
HOJE = datetime.date.fromisoformat(data_s)
EX = json.load(open(extra_f, encoding='utf-8'))
for _c, _g in GERENTE_FIX.items(): EX.setdefault('ger', {}).setdefault(_c, {}).update(_g)
for _g in EX.get('ger', {}).values():
    if _g.get('email') in EMAIL_FIX: _g['email'] = EMAIL_FIX[_g['email']]
os.makedirs(saida, exist_ok=True)


def peso(d):
    if d.isoformat() in FERIADOS or d.weekday() == 6: return 0
    return 0.5 if d.weekday() == 5 else 1


ini = HOJE.replace(day=1)
fim = (ini.replace(month=ini.month % 12 + 1, year=ini.year + (ini.month == 12)) - datetime.timedelta(days=1))
DIAS_MES = [ini + datetime.timedelta(days=i) for i in range((fim - ini).days + 1)]
DIAS = sum(peso(d) for d in DIAS_MES if d >= HOJE) or 1
DIV = max(DIAS - peso(HOJE), 0.5)  # divisor da meta diária do Solcast: dias depois de hoje
FEITO = sum(peso(d) for d in DIAS_MES if d < HOJE)
ESP = FEITO / (FEITO + DIAS)

e = html.escape
R = lambda x: 'R$ ' + f"{x:,.0f}".replace(',', '.')
P = lambda x: f"{x * 100:.0f}%"
LT = lambda x: f"{x:,.0f} L".replace(',', '.')
B1 = lambda x: f"{x:.1f}".replace('.', ',')
def norm(s): return re.sub(r'\s+', ' ', unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().upper()).strip()
def semcod(n): return norm(re.sub(r'^\w{3} - ', '', n))
def nm(n): n = re.sub(r'\s+', ' ', re.sub(r'^\w{3} - ', '', n)); n = re.sub(r'\s*-\s*\d+$|\s+N\d.*$|\s*-\s*N\d.*$', '', n).strip(); return n.title()
def cor(p): return '#16a34a' if p >= ESP else ('#f59e0b' if p >= ESP * 0.75 else '#dc2626')
def rows(f): return list(openpyxl.load_workbook(os.path.join(pasta, f)).active.iter_rows(values_only=True))


def barra(p, c, h=10, fundo='#e5e7eb'):
    p = max(min(p or 0, 1), 0)
    def td(w, col): return f"<td width='{w:.1f}%' style='background:{col};height:{h}px;font-size:0;line-height:0'>&nbsp;</td>" if w > 0.05 else ''
    cells = (td(p * 100, c) + td((ESP - p) * 100, fundo) + td(0.8, '#111827') + td((1 - ESP) * 100 - 0.8, fundo)) if p < ESP \
        else (td(ESP * 100, c) + td(0.8, '#111827') + td((p - ESP) * 100 - 0.8, c) + td((1 - p) * 100, fundo))
    return f"<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='border-collapse:collapse;border-radius:{h}px;overflow:hidden'><tr>{cells}</tr></table>"


META = {str(r[0])[:3]: r for r in rows('META - MES ATUAL.xlsx')[1:] if r[0] and re.match(r'^\w{3} - ', str(r[0]))}
IND = rows('INDICADORES - MES ATUAL.xlsx'); H = IND[0]
VEND = {}; cur = None
for r in IND[1:]:
    if r[0]: cur = str(r[0])[:3]
    d = dict(zip(H, r))
    if cur and r[1] and r[1] != 'Total' and (d['$ Meta'] or 0) >= 1000: VEND.setdefault(cur, []).append(d)


def carteira(cod):
    f = f'EVOLUCAO MENSAL POR CLIENTE - {cod}.xlsx'
    if not os.path.exists(os.path.join(pasta, f)): return []
    cart = rows(f); n = len(cart[0]) - 2; C = []
    for r in cart[2:]:
        if not r[0] or ' - VEND.: ' not in str(r[0]): continue
        cli, vend = str(r[0]).split(' - VEND.: ', 1)
        vals = [x or 0 for x in r[1:1 + n]]; ant3 = vals[-4:-1]
        C.append(dict(cli=re.sub(r'\s+', ' ', re.sub(r'\b\d{11,14}\b', '', cli)).strip(),  # nome sem CPF/CNPJ colado
                       vend=norm(vend), atual=vals[-1], u3=sum(ant3) / 3, compras3=sum(1 for x in ant3 if x > 0)))
    return C


def crm_vend(cod, k):
    """Orçamentos em aberto do vendedor (do Painel) cruzados com os registros do CRM de Vendas.
    Devolve None se a rotina não trouxe os dados do CRM."""
    if 'orc' not in EX: return None
    CR = EX.get('crm') or {}; hoje = HOJE.isoformat(); sem = []; ret = []; tot = 0
    for o in EX['orc'].get(cod, []):
        vend, cli, valor, dias, doc = o
        kv = semcod(re.sub(r'^\d+\s*-\s*', '', vend or '')); kv = re.sub(r'\s+N\s?\d+$', '', kv)
        if not kv or not (kv == k or kv.startswith(k) or k.startswith(kv)): continue
        r = CR.get(str(doc))
        if r and r[0] in ('fechado', 'validado', 'perdido'): continue
        tot += 1; it = dict(cli=re.sub(r'^\d+-', '', cli or '').strip(), valor=valor or 0, dias=dias, doc=doc)
        if not r:
            if dias is not None and dias >= 2: sem.append(it)
        elif (r[2] and r[2] <= hoje) or (r[0] == 'neg' and r[1] and r[1] < hoje):
            it['quando'] = r[2] or r[1]; ret.append(it)
    sem.sort(key=lambda x: -x['valor']); ret.sort(key=lambda x: -x['valor'])
    return dict(tot=tot, sem=sem, ret=ret)


def gerar(cod):
    m = META[cod]; L = dict(nome=m[0], meta=m[1] or 0, fat=m[2] or 0, alc=m[3] or 0, proj=m[4] or 0, alcproj=m[5] or 0, rest=max(m[6] or 0, 0), hoje=m[8] or 0, diaria=m[7])
    C = carteira(cod); EU = EX['euc'].get(cod, {}); G = EX['ger'].get(cod, {})
    EUV = {norm(k): v for k, v in (EU.get('vend') or {}).items()}
    VS = []
    for v in VEND.get(cod, []):
        k = semcod(v['Vendedor']); cs = [c for c in C if c['vend'] and (c['vend'] == k or c['vend'].startswith(k) or k.startswith(c['vend']))]
        sem = sorted([c for c in cs if c['atual'] <= 0 and c['compras3'] >= 2], key=lambda c: -c['u3'])
        baixo = sorted([c for c in cs if c['atual'] > 0 and c['u3'] > 0 and c['atual'] < 0.5 * c['u3']], key=lambda c: -(c['u3'] - c['atual']))
        rest = max(v['$ Meta restante'] or 0, 0)
        VS.append(dict(nome=nm(v['Vendedor']), meta=v['$ Meta'], fat=v['$ Faturado'] or 0, alc=v['% Alc. Meta'] or 0, md=rest / DIV, ritmo=v['$ Diária'] or 0,
                       euc=EUV.get(norm(nm(v['Vendedor']))), sem=sem, baixo=baixo[:2], pos=v['% Positivados CNPJ'], posit=v['Clientes positivados CNPJ'],
                       ativos=v['Clientes ativos CNPJ'], desc=v['% Desconto CNPJ'], itens=v['Itens CPF'], crm=crm_vend(cod, k)))
    VS.sort(key=lambda x: -x['md'])
    sd = sorted([c for c in C if 'NOVO' in c['vend'] and c['atual'] <= 0 and c['compras3'] >= 1], key=lambda c: -c['u3'])[:5]
    gerente = (G.get('gerente') or 'gerente').split()[0]
    loja_nome = (G.get('loja') or '').split(' - ', 1)[-1].strip() or (L['nome'].split('(')[-1].rstrip(')').title() if '(' in L['nome'] else L['nome'][6:].title())
    mh = (L['rest'] + (L['hoje'] if FAT_HOJE_VALE else 0)) / DIV   # meta do dia fixada no começo do dia (igual à do BI depois das 8h)
    h = [f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="50%" style="background:#fef2f2;border-radius:12px;padding:14px;text-align:center"><div style="font-size:11px;color:#6b7280">🎯 META DE HOJE</div>
<div style="font-size:26px;white-space:nowrap;font-weight:bold;color:#b91c1c;margin-top:2px">{R(mh)}</div><div style="font-size:12px;color:#6b7280">faltam {R(L['rest'])} · {B1(DIV)} dias úteis depois de hoje</div></td><td width="8"></td>
<td width="50%" style="background:#f9fafb;border-radius:12px;padding:14px;text-align:center"><div style="font-size:11px;color:#6b7280">📈 PROJEÇÃO DO MÊS</div>
<div style="font-size:26px;white-space:nowrap;font-weight:bold;color:{'#16a34a' if L['alcproj'] >= 1 else '#dc2626'};margin-top:2px">{P(L['alcproj'])}</div><div style="font-size:12px;color:#6b7280">{R(L['proj'])} de {R(L['meta'])}</div></td></tr></table>
<div style="margin:16px 0 6px;font-size:13px"><b>Mês: {P(L['alc'])}</b> <span style="color:#6b7280">· {R(L['fat'])} vendidos · o traço preto marca onde deveria estar hoje ({P(ESP)})</span></div>{barra(L['alc'], cor(L['alc']), 14)}"""]
    if EU.get('loja'):
        em, el = EU['loja']; f = max(em - el, 0); p = el / em if em else 0
        h.append(f"""<div style="margin:18px 0 0;background:#ecfdf5;border-radius:12px;padding:14px"><table role="presentation" width="100%"><tr><td style="font-size:14px"><b style="color:#047857">🪣 EUCATEX</b> <span style="color:#6b7280">· {LT(el)} de {LT(em)}</span></td>
<td align="right" style="font-size:18px;font-weight:bold;color:{cor(p)}">{P(p)}</td></tr></table><div style="margin:8px 0">{barra(p, '#059669', 12, '#d1fae5')}</div>
<div style="font-size:13px">{'Meta batida ✔' if not f else f"Hoje a loja precisa de <b style='font-size:16px;color:#047857'>{B1(f / DIV / 18)} baldes</b> de 18 L <span style='color:#6b7280'>({LT(f / DIV)})</span>"} · bônus R$ 50 por vendedor em 100%</div></div>""")
    h.append("""<div style="margin:22px 0 8px;font-size:16px;font-weight:bold">🏁 Placar do time hoje</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px">
<tr style="color:#6b7280;font-size:11px"><td style="padding:4px 0">VENDEDOR</td><td align="right">META HOJE</td><td align="right">FAZ/DIA</td><td align="center">🪣</td><td align="right">ORÇ. SEM CONTATO</td></tr>""")
    def bd(v):
        if not v['euc']: return '—'
        em, el = v['euc']; return '✔' if el >= em else f"{B1(max(em - el, 0) / DIV / 18)} 🪣"
    for v in VS:
        ok = v['ritmo'] >= v['md']
        h.append(f"<tr style='border-top:1px solid #f3f4f6'><td style='padding:9px 0'><b>{'🟢' if ok else '🔴'} {e(v['nome'].split()[0])}</b></td><td align='right' style='white-space:nowrap'><b>{R(v['md'])}</b></td><td align='right' style='white-space:nowrap;padding-left:6px;color:{'#16a34a' if ok else '#dc2626'}'>{R(v['ritmo'])}</td><td align='center'>{bd(v)}</td><td align='right' style='white-space:nowrap'>{(str(len(v['crm']['sem'])) + (' · ' + R(sum(x['valor'] for x in v['crm']['sem'])) if v['crm']['sem'] else '')) if v['crm'] else '—'}</td></tr>")
    h.append("</table>")
    if any(v['crm'] for v in VS):
        ns = sum(len(v['crm']['sem']) for v in VS if v['crm']); vs_ = sum(x['valor'] for v in VS if v['crm'] for x in v['crm']['sem']); nr = sum(len(v['crm']['ret']) for v in VS if v['crm'])
        h.append(f"<div style='margin-top:12px;background:#eff6ff;border-radius:12px;padding:12px 14px;font-size:13px'><b style='color:#1e3a8a'>📋 CRM de Vendas</b> · <b>{ns}</b> orçamentos sem contato há 2 dias ou mais ({R(vs_)}) · <b>{nr}</b> retornos de hoje ou vencidos. <span style='color:#6b7280'>Cada vendedor registra o contato no app; você acompanha na aba Loja.</span></div>")
    PV = []
    for v in VS:
        ok = v['ritmo'] >= v['md']; c = cor(v['alc']); falta = v['md'] - v['ritmo']
        vh = [f"""<div style="border:1px solid #e5e7eb;border-left:6px solid {'#16a34a' if ok else '#dc2626'};border-radius:12px;padding:14px">
<table role="presentation" width="100%"><tr><td><div style="font-size:16px;font-weight:bold">{e(v['nome'])}</div><div style="font-size:12px;color:#6b7280">{R(v['fat'])} de {R(v['meta'])} no mês</div></td>
<td align="right" valign="top" style="white-space:nowrap"><span style="background:{'#dcfce7' if ok else '#fee2e2'};color:{'#166534' if ok else '#991b1b'};font-size:11px;font-weight:bold;padding:4px 8px;border-radius:20px">{'NO RITMO' if ok else 'ACELERAR'}</span>{'' if ok else f"<div style='font-size:11px;color:#991b1b;margin-top:4px'>+{R(falta)}/dia</div>"}</td></tr></table>
<table role="presentation" width="100%" style="margin:10px 0 4px"><tr>
<td width="33%" style="text-align:center;background:#f9fafb;border-radius:8px;padding:8px"><div style="font-size:10px;color:#6b7280">META HOJE</div><div style="font-size:16px;white-space:nowrap;font-weight:bold">{R(v['md'])}</div></td><td width="6"></td>
<td width="33%" style="text-align:center;background:#f9fafb;border-radius:8px;padding:8px"><div style="font-size:10px;color:#6b7280">NO MÊS</div><div style="font-size:16px;white-space:nowrap;font-weight:bold;color:{c}">{P(v['alc'])}</div></td><td width="6"></td>
<td width="33%" style="text-align:center;background:#ecfdf5;border-radius:8px;padding:8px"><div style="font-size:10px;color:#6b7280">EUCATEX HOJE</div><div style="font-size:16px;white-space:nowrap;font-weight:bold;color:#047857">{bd(v)}</div></td></tr></table>
<div style="font-size:11px;color:#6b7280;margin:8px 0 4px">Meta do mês</div>{barra(v['alc'], c, 10)}"""]
        if v['euc'] and v['euc'][0]:
            em, el = v['euc']; vh.append(f"<div style='font-size:11px;color:#6b7280;margin:10px 0 4px'>Eucatex · {LT(el)} de {LT(em)}</div>{barra(el / em, '#059669', 8, '#d1fae5')}")
        cr = v['crm']; tem_crm = bool(cr and (cr['sem'] or cr['ret']))
        if tem_crm:
            def lin(x, extra=''):
                return (f"<tr style='border-top:1px solid #dbeafe'><td style='padding:5px 0'><b>{e(x['cli'].title()[:38])}</b><div style='font-size:11px;color:#6b7280'>Nº {e(str(x['doc']))}"
                        + (f" · há {x['dias']} dias" if x['dias'] is not None else '') + extra + f"</div></td><td align='right' style='white-space:nowrap;font-weight:bold'>{R(x['valor'])}</td></tr>")
            vh.append(f"<div style='margin-top:12px;background:#eff6ff;border-radius:10px;padding:10px 12px'><div style='font-size:13px;font-weight:bold;color:#1e3a8a'>📋 Orçamentos para retornar hoje <span style='font-weight:normal;color:#6b7280'>· registre o contato no CRM de Vendas do app</span></div>")
            if cr['ret']:
                vh.append(f"<div style='font-size:12px;margin:8px 0 2px'><b>{len(cr['ret'])}</b> com retorno marcado para hoje ou vencido</div><table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='border-collapse:collapse;font-size:12.5px'>"
                          + ''.join(lin(x, f" · retorno {x['quando'][8:10]}/{x['quando'][5:7]}") for x in cr['ret'][:3]) + "</table>")
            if cr['sem']:
                vh.append(f"<div style='font-size:12px;margin:8px 0 2px'><b>{len(cr['sem'])}</b> sem nenhum contato registrado · {R(sum(x['valor'] for x in cr['sem']))} · os maiores:</div><table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='border-collapse:collapse;font-size:12.5px'>"
                          + ''.join(lin(x) for x in cr['sem'][:4 if cr['ret'] else 5]) + "</table>")
            vh.append("</div>")
        if v['sem']:
            vh.append(f"<div style='font-size:13px;font-weight:bold;margin:14px 0 4px'>Ligar hoje <span style='font-weight:normal;color:#6b7280'>· compravam e ainda não compraram em {MESES[HOJE.month - 1]}</span></div>")
            vh += [f"<div style='background:#fff7ed;border-radius:8px;padding:7px 10px;margin:4px 0;font-size:13px'>📞 <b>{e(x['cli'].title()[:42])}</b><div style='color:#9a3412;font-size:12px;margin-left:22px'>costuma comprar ~{R(x['u3'])}/mês</div></div>" for x in v['sem'][:3]]
            resto = v['sem'][3:(5 if tem_crm else 11)]; fora = len(v['sem']) - 3 - len(resto)
            if resto:
                vh.append(f"<div style='font-size:12px;color:#6b7280;margin:8px 0 4px'>Mais {len(v['sem']) - 3} clientes parados · {R(sum(x['u3'] for x in v['sem']))}/mês no total da lista</div><table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='border-collapse:collapse;font-size:12px'>"
                         + ''.join(f"<tr style='border-top:1px solid #f3f4f6'><td style='padding:5px 0;color:#9ca3af;width:22px'>{i}</td><td style='padding:5px 0'>{e(x['cli'].title()[:40])}</td><td align='right' style='padding:5px 0;white-space:nowrap;color:#9a3412'>~{R(x['u3'])}</td></tr>" for i, x in enumerate(resto, 4)) + "</table>"
                         + (f"<div style='font-size:12px;color:#6b7280;margin-top:4px'>… e mais {fora} na Carteira do CRM de Vendas, no app.</div>" if fora > 0 else ''))
        if v['baixo']:
            vh.append("<div style='font-size:13px;font-weight:bold;margin:12px 0 4px'>Completar pedido <span style='font-weight:normal;color:#6b7280'>· compraram abaixo do normal</span></div>")
            vh += [f"<div style='background:#eff6ff;border-radius:8px;padding:7px 10px;margin:4px 0;font-size:13px'>🛒 <b>{e(x['cli'].title()[:42])}</b><div style='color:#1e40af;font-size:12px;margin-left:22px'>{R(x['atual'])} no mês · costuma ~{R(x['u3'])}</div></div>" for x in v['baixo']]
        dic = []
        if v['pos'] is not None and v['pos'] < 0.3 and v['ativos']: dic.append(f"🎯 Positivação CNPJ {P(v['pos'])} ({v['posit'] or 0}/{v['ativos']})")
        if v['desc'] and v['desc'] > 0.07: dic.append(f"✂️ Desconto CNPJ {P(v['desc'])}: segurar")
        if v['itens'] and v['itens'] < 2.2: dic.append(f"🧺 {B1(v['itens'])} itens/venda: oferecer complemento")
        if dic: vh.append("<div style='margin-top:10px'>" + ''.join(f"<span style='display:inline-block;background:#f3f4f6;border-radius:20px;padding:4px 10px;margin:3px 4px 0 0;font-size:12px'>{d}</span>" for d in dic) + "</div>")
        vh.append("</div>"); PV.append((v, ''.join(vh)))
    if sd:
        h.append("<div style='margin-top:18px;background:#f9fafb;border-radius:12px;padding:14px'><div style='font-size:14px;font-weight:bold;margin-bottom:6px'>📋 Para você distribuir hoje</div><div style='font-size:12px;color:#6b7280;margin-bottom:6px'>Clientes sem vendedor que pararam de comprar</div>"
                 + ''.join(f"<div style='font-size:13px;padding:5px 0;border-top:1px solid #e5e7eb'>👤 {e(x['cli'].title()[:42])} <span style='color:#6b7280'>· ~{R(x['u3'])}/mês</span></div>" for x in sd) + "</div>")
    rod = (f"Meta de hoje = o que falta ÷ {B1(DIV)} dias úteis depois de hoje, na conta do Solcast e do Painel de Metas (sábado conta meio dia; domingos e feriados não contam). "
           "🟢 vende por dia pelo menos a meta de hoje · 🔴 abaixo. Traço preto = onde deveria estar hoje. "
           "Ligar hoje = comprou em pelo menos 2 dos últimos 3 meses e ainda não comprou neste mês. Dados do Solcast e do Painel de Metas.")
    dia = f"{SEM[HOJE.weekday()]}, {HOJE:%d/%m}"
    def folha(titulo, sub, corpo, n):
        return (f"<section class='pg'><div class='cab'><div class='k'>SÓ TINTAS · META DO DIA · {HOJE:%d/%m/%Y}</div><div class='t'>{titulo}</div><div class='s'>{sub}</div></div>"
                f"<div class='corpo'>{corpo}</div><div class='rod'><span>folha {n} de {len(PV) + 1}</span>{e(rod)}</div></section>")
    pags = [folha(f"{e(loja_nome)} · loja {cod}", f"{dia} · bom dia, {e(gerente)}! 👋 · resumo da loja", ''.join(h), 1)]
    pags += [folha(e(v['nome']), f"{e(loja_nome)} · loja {cod} · {dia} · folha do vendedor", c, i) for i, (v, c) in enumerate(PV, 2)]
    doc = ("<!doctype html><html lang='pt-BR'><head><meta charset='utf-8'><title>Meta do dia</title><style>"
           "@page{size:A4;margin:9mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}"
           "body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#111827;background:#fff}"
           ".pg{width:192mm;margin:0 auto;break-after:page;page-break-after:always}.pg:last-child{break-after:auto;page-break-after:auto}"
           ".cab{background:#b91c1c;color:#fff;padding:14px 18px;border-radius:12px}.cab .k{font-size:11px;letter-spacing:1px;opacity:.85}"
           ".cab .t{font-size:24px;font-weight:bold;margin-top:3px}.cab .s{font-size:13px;opacity:.92;margin-top:2px}"
           ".corpo{padding:12px 2px 4px;zoom:1.1}.rod{margin-top:10px;border-top:1px solid #e5e7eb;padding-top:6px;font-size:9.5px;color:#6b7280}"
           ".rod span{float:right;margin-left:8px;font-weight:bold}</style></head><body>" + ''.join(pags) + "</body></html>")
    txt = [f"Meta do dia {HOJE:%d/%m} · {loja_nome} (loja {cod})", f"Meta de hoje: {R(mh)} · mês {P(L['alc'])} (esperado {P(ESP)}) · projeção {P(L['alcproj'])}", ""]
    txt += [f"Em anexo, o PDF para imprimir: a 1ª folha é o resumo da loja e cada vendedor tem a sua folha ({len(PV)} vendedores).", ""]
    for v in VS: txt.append(f"{v['nome']}: meta hoje {R(v['md'])}" + (f" · ligar: {', '.join(x['cli'].title() for x in v['sem'][:3])}" if v['sem'] else ''))
    return dict(cod=cod, loja=loja_nome, gerente=G.get('gerente'), email=G.get('email'), meta_hoje=round(mh), vendedores=len(VS), euc=bool(EU.get('loja')), crm='orc' in EX,
                assunto=f"🎯 Meta do dia {HOJE:%d/%m} · {loja_nome} {cod} · {R(mh)} hoje", html=doc, texto='\n'.join(txt), folhas=len(PV) + 1,
                anexo=f"Meta do dia {HOJE:%d-%m} - loja {cod} {loja_nome}.pdf")


MAN = []
for cod in sorted(META):
    try:
        r = gerar(cod)
    except Exception as ex:
        MAN.append(dict(cod=cod, erro=str(ex))); continue
    open(os.path.join(saida, f'{cod}.html'), 'w', encoding='utf-8').write(r.pop('html'))
    MAN.append(r)

try:  # PDF (uma folha A4 por seção) e a imagem da 1ª folha, que vai no corpo do e-mail
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 760, 'height': 1000}, device_scale_factor=1.5)
        for r in MAN:
            if 'erro' in r: continue
            base = os.path.abspath(os.path.join(saida, r['cod']))
            pg.goto('file://' + base + '.html')
            pg.locator('.pg').first.screenshot(path=base + '.png', type='png')
            pg.pdf(path=base + '.pdf', format='A4', print_background=True, prefer_css_page_size=True)
            r['png'] = base + '.png'; r['pdf'] = base + '.pdf'
            try:
                import pypdf; r['paginas_pdf'] = len(pypdf.PdfReader(base + '.pdf').pages)
            except Exception: pass
        b.close()
except Exception as ex:
    print('sem imagem/PDF:', ex)
json.dump(dict(data=data_s, dias=DIAS, esperado=ESP, lojas=MAN), open(os.path.join(saida, 'manifesto.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps(dict(dias=DIAS, esperado=round(ESP, 3), ok=sum('erro' not in r for r in MAN), erros=[r for r in MAN if 'erro' in r],
                      sem_email=[r['cod'] for r in MAN if 'erro' not in r and not r.get('email')], sem_euc=[r['cod'] for r in MAN if 'erro' not in r and not r['euc']], crm=('orc' in EX), crm_erro=EX.get('crm_erro'),
                      folha_estourou=[r['cod'] for r in MAN if r.get('paginas_pdf') and r['paginas_pdf'] != r['folhas']]), ensure_ascii=False))
