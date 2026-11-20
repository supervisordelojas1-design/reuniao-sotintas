/* Só Tintas App — tela inicial em grupos (v1, 20/11/2026)
   Só reorganiza os cards que já existem: os mesmos botões, com os mesmos cliques e a mesma régua de acesso,
   passam a morar em 6 grupos. Nada é criado nem escondido além do que a régua já decide. */
(function () {
  'use strict';
  var GRUPOS = [
    ['res', 'Resultado', ['painel', 'niveis', 'pontos', 'ranking', 'rally']],
    ['bon', 'Bônus', ['bonusger', 'simulador', 'bonus', 'proposta']],
    ['dev', 'Desenvolvimento', ['semana', 'pdi', 'mentor', 'especialista', 'avulsas', 'provas']],
    ['cli', 'Clientes e lojas', ['crm', 'contatos', 'escala']],
    ['ope', 'Operação', []],
    ['adm', 'Administração', ['acessos', 'uso', 'cadastro', 'direitos', 'conteudo', 'central']]
  ];
  var PADRAO = ['painel', 'semana', 'crm', 'bonusger', 'rally', 'mentor', 'avulsas', 'agenda'];
  var corpo, obs, timer, caixas = {}, blocoU, gradeU, blocoG;

  function ler(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function visivel(c) { return getComputedStyle(c).display !== 'none'; }
  function grupoDe(c) {
    var a = c.getAttribute('data-act') || '';
    for (var i = 0; i < GRUPOS.length; i++) if (GRUPOS[i][2].indexOf(a) >= 0) return GRUPOS[i][0];
    return c.classList.contains('feat') ? 'adm' : 'ope';
  }
  function posicao(c) {
    var a = c.getAttribute('data-act') || '', g = grupoDe(c);
    for (var i = 0; i < GRUPOS.length; i++) if (GRUPOS[i][0] === g) { var p = GRUPOS[i][2].indexOf(a); return p < 0 ? 99 : p; }
    return 99;
  }

  function montar() {
    corpo = document.getElementById('iniBody');
    if (!corpo || corpo.querySelector('.stv-grupos')) return !!corpo;
    if (!corpo.querySelector('.ini-card[data-act]')) return false;
    blocoU = el('div', 'stv-bloco stv-bloco-u'); blocoU.appendChild(el('div', 'stv-sec', 'Mais usados'));
    gradeU = el('div', 'stv-usados'); blocoU.appendChild(gradeU);
    blocoG = el('div', 'stv-bloco stv-bloco-g'); blocoG.appendChild(el('div', 'stv-sec', 'Todos os painéis'));
    var grade = el('div', 'stv-grupos'); blocoG.appendChild(grade);
    var fech = ler('stv_fech');
    GRUPOS.forEach(function (g) {
      var box = el('section', 'stv-g'); box.setAttribute('data-g', g[0]);
      var cab = el('button', 'stv-gh'); cab.type = 'button';
      cab.appendChild(el('span', 'stv-gi')); cab.appendChild(el('span', null, g[1])); cab.appendChild(el('small')); cab.appendChild(el('i', null, '▾'));
      cab.addEventListener('click', function () {
        if (!window.matchMedia('(max-width:680px)').matches) return;
        box.classList.toggle('fechado'); var f = ler('stv_fech'); f[g[0]] = box.classList.contains('fechado') ? 1 : 0; gravar('stv_fech', f);
      });
      var lista = el('div', 'stv-gb'); box.appendChild(cab); box.appendChild(lista); grade.appendChild(box);
      if (fech[g[0]] === 1) box.classList.add('fechado');
      caixas[g[0]] = { box: box, lista: lista, cab: cab };
    });
    corpo.appendChild(blocoU); corpo.appendChild(blocoG);
    corpo.classList.add('stv-on');
    corpo.addEventListener('click', function (e) {
      var c = e.target.closest ? e.target.closest('.ini-card[data-act]') : null; if (!c) return;
      var u = ler('stv_uso'), a = c.getAttribute('data-act'); u[a] = (u[a] || 0) + 1; gravar('stv_uso', u);
    }, true);
    obs = new MutationObserver(agendar);
    arrumar();
    return true;
  }

  function agendar() { clearTimeout(timer); timer = setTimeout(arrumar, 90); }

  function arrumar() {
    if (!corpo) return;
    if (obs) obs.disconnect();
    /* cards que ainda estão (ou entraram depois) nas grades antigas vão para o grupo certo */
    var soltos = [].slice.call(corpo.querySelectorAll('.ini-feat .ini-card[data-act], .ini-grid .ini-card[data-act]'));
    soltos.sort(function (a, b) { return posicao(a) - posicao(b); });
    soltos.forEach(function (c) { caixas[grupoDe(c)].lista.appendChild(c); });
    var todos = [], total = 0;
    GRUPOS.forEach(function (g) {
      var cx = caixas[g[0]], cs = [].slice.call(cx.lista.querySelectorAll('.ini-card[data-act]')), n = 0;
      cs.forEach(function (c) { if (visivel(c)) { n++; todos.push(c); } });
      total += n; cx.box.hidden = !n;
      cx.cab.querySelector('small').textContent = n + (n === 1 ? ' painel' : ' painéis');
      var gi = cx.cab.querySelector('.stv-gi');
      if (!gi.firstChild && cs[0]) { var sv = cs[0].querySelector('.ini-ic svg'); if (sv) gi.appendChild(sv.cloneNode(true)); }
    });
    /* primeira vez no celular com muita coisa: só os dois primeiros grupos abertos */
    if (!localStorage.getItem('stv_fech') && total > 10 && window.matchMedia('(max-width:680px)').matches) {
      var vistos = 0;
      GRUPOS.forEach(function (g) { var cx = caixas[g[0]]; if (cx.box.hidden) return; vistos++; cx.box.classList.toggle('fechado', vistos > 2); });
    }
    /* mais usados: o que a pessoa mais abre neste aparelho; sem histórico, uma ordem padrão */
    var uso = ler('stv_uso');
    var ordem = todos.slice().sort(function (a, b) {
      var ua = uso[a.getAttribute('data-act')] || 0, ub = uso[b.getAttribute('data-act')] || 0;
      if (ua !== ub) return ub - ua;
      var pa = PADRAO.indexOf(a.getAttribute('data-act')), pb = PADRAO.indexOf(b.getAttribute('data-act'));
      return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb);
    }).slice(0, 4);
    gradeU.textContent = '';
    ordem.forEach(function (c) {
      var b = el('button', 'stv-u'); b.type = 'button';
      var ic = el('span', 'stv-ui'), sv = c.querySelector('.ini-ic svg'); if (sv) ic.appendChild(sv.cloneNode(true));
      var nm = c.querySelector('.ini-nm');
      b.appendChild(ic); b.appendChild(el('span', null, nm ? nm.textContent : ''));
      b.addEventListener('click', function () { c.click(); });
      gradeU.appendChild(b);
    });
    blocoU.hidden = total < 6 || !ordem.length;
    blocoG.hidden = !total;
    if (obs) {
      obs.observe(corpo, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
      obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function iniciar() {
    if (montar()) return;
    var n = 0, t = setInterval(function () { if (montar() || ++n > 40) clearInterval(t); }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
